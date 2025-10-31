class LocalAIService {
  constructor() {
    this.enabled = true;
    this.examplesEnabled = true;
    this.translationEnabled = true;
    this.grammarEnabled = true;
    this.langSrc = 'nl';
    this.langTgt = 'en';
    this.translationCache = new Map();
    this.grammarCache = new Map();
    this.exampleCache = new Map();
    this.sessionCache = null; // Cache a session for reuse
    this.isInitialized = false;
    
    // Preload models in background
    this.preloadModels();
  }

  async preloadModels() {
    // Don't block the constructor, do this in background
    setTimeout(async () => {
      try {
        console.log('[LocalAI] Preloading models in background...');
        await this.initializeSession();
      } catch (e) {
        console.debug('[LocalAI] Background preload failed (this is normal):', e.message);
      }
    }, 2000);
  }

  async initializeSession() {
    if (this.isInitialized) return;
    
    try {
      const LM = await this.ensureLM();
      // Create and cache a session for faster subsequent use
      this.sessionCache = await LM.create({
        systemPrompt: 'You are a helpful language learning assistant.',
        language: 'en'
      });
      this.isInitialized = true;
      console.log('[LocalAI] Session initialized and cached');
    } catch (e) {
      console.debug('[LocalAI] Session initialization failed:', e.message);
      this.isInitialized = false;
    }
  }

  async loadSettings() {
    const s = await chrome.storage.sync.get([
      'localAIEnabled','localAIExamples','localAITranslation','localAIGrammar',
      'localAISource','localAITarget'
    ]);
    this.enabled = s.localAIEnabled !== false;
    this.examplesEnabled = s.localAIExamples !== false;
    this.translationEnabled = s.localAITranslation !== false;
    this.grammarEnabled = s.localAIGrammar !== false;
    if (s.localAISource) this.langSrc = s.localAISource;
    if (s.localAITarget) this.langTgt = s.localAITarget;
  }

  LM() { return globalThis.LanguageModel || globalThis.chrome?.ai?.LanguageModel; }
  TR() { return globalThis.Translator || globalThis.chrome?.ai?.translator; }

  async ensureLM() {
    const LM = this.LM();
    if (!LM) throw new Error('LanguageModel API missing');
    
    const status = await LM.availability();
    console.debug('[LocalAI] LanguageModel availability:', status);
    
    if (status === 'unavailable') {
      throw new Error('LanguageModel unavailable');
    }
    
    if (status === 'after-download') {
      console.log('[LocalAI] LanguageModel will be available after download');
      // Try to trigger download proactively
      try {
        console.log('[LocalAI] Attempting to initiate model download...');
        const session = await LM.create({ 
          systemPrompt: 'Ready to assist.',
          language: 'en',
          monitor: (m) => {
            if (m) {
              m.addEventListener('downloadprogress', (e) => {
                const percent = ((e.loaded / e.total) * 100).toFixed(1);
                console.log(`[LocalAI] Model download progress: ${percent}%`);
              });
            }
          }
        });
        session.destroy();
      } catch (e) {
        console.warn('[LocalAI] Could not initiate download:', e.message);
      }
    }
    
    return LM;
  }

  async ensureTranslator() {
    const T = this.TR();
    if (!T) throw new Error('Translator API missing');
    const status = await T.availability({ sourceLanguage: this.langSrc, targetLanguage: this.langTgt });
    if (status === 'unavailable') throw new Error('Translator unavailable');
    return T;
  }

  async streamTranslate(sentence, onUpdate) {
    if (!this.enabled || !this.translationEnabled) return;
    const k = 'T:' + sentence;
    if (this.translationCache.has(k)) {
      onUpdate && onUpdate(this.translationCache.get(k), true);
      return;
    }
    try {
      const T = await this.ensureTranslator();
      const inst = await T.create({
        sourceLanguage: this.langSrc,
        targetLanguage: this.langTgt,
        monitor: m => {
          m.addEventListener('downloadprogress', e => {
            onUpdate && onUpdate('[Downloading ' + (e.loaded*100).toFixed(1) + '%]', false);
          });
        }
      });
      const stream = inst.translateStreaming(sentence);
      let acc = '';
      for await (const chunk of stream) {
        acc += chunk;
        onUpdate && onUpdate(acc, false);
      }
      this.translationCache.set(k, acc);
    } catch(e) {
      onUpdate && onUpdate('[Translation error]', false);
    }
  }

  grammarPrompt(sentence) {
    return `Analyze this Dutch sentence and respond with ONLY valid JSON (no explanations, no markdown):

"${sentence}"

Return EXACTLY one JSON object with these fields ONLY:
{
  "sentence": "${sentence}",
  "main_clause": "main clause structure",
  "sub_clauses": [],
  "verbs": [{"form": "verb", "lemma": "root", "tense": "present"}],
  "nouns": [{"form": "noun", "lemma": "root"}],
  "difficulty_points": ["point 1", "point 2"],
  "explanation_en": "Brief grammar explanation in English"
}

Do NOT include any translation field (translation is handled separately). Return ONLY the JSON object above with values filled in.`;
  }

  async analyzeGrammar(sentence) {
    if (!this.enabled || !this.grammarEnabled) return null;
    const k = 'G:' + sentence;
    if (this.grammarCache.has(k)) return this.grammarCache.get(k);
    try {
      const LM = await this.ensureLM();
      const session = await LM.create({
        systemPrompt: `You are a precise language analysis assistant. You must respond with valid JSON only, no explanations or formatting.`,
        language: 'en'
      });
      const raw = await session.prompt(this.grammarPrompt(sentence));
      session.destroy();
      const parsed = this.safeParseJSON(raw);
      
      console.debug('[LocalAI] Grammar raw response:', raw);
      console.debug('[LocalAI] Grammar parsed result:', parsed);
      
      // If parsing failed, provide a basic fallback structure
      if (parsed.error === 'parse_failed') {
        console.warn('[LocalAI] Grammar parsing failed, using fallback structure');
        const fallback = {
          sentence: sentence,
          main_clause: "Analysis unavailable",
          sub_clauses: [],
          verbs: [],
          nouns: [],
          difficulty_points: ["Analysis error"],
          explanation_en: "AI response could not be parsed as JSON",
          _parsing_error: true,
          _raw_response: raw.substring(0, 500) // Store first 500 chars for debugging
        };
        this.grammarCache.set(k, fallback);
        return fallback;
      }
      
      this.grammarCache.set(k, parsed);
      return parsed;
    } catch(e) {
      console.warn('[LocalAI] analyzeGrammar error:', e.message);
      return { 
        error:'grammar_failed', 
        detail:e.message,
        sentence: sentence,
        main_clause: "Analysis failed",
        sub_clauses: [],
        verbs: [],
        nouns: [],
        difficulty_points: ["Error occurred"],
        explanation_en: "Analysis failed due to: " + e.message
      };
    }
  }

  examplePrompt(word) {
    return `Create exactly 2 Dutch sentences using the word "${word}". Return ONLY a JSON array without any explanation:

[{"nl":"Dutch sentence 1","en":"English translation 1"},{"nl":"Dutch sentence 2","en":"English translation 2"}]`;
  }

  async generateExamples(word) {
    if (!this.enabled || !this.examplesEnabled) return null;
    const k = 'E:' + word;
    if (this.exampleCache.has(k)) return this.exampleCache.get(k);
    
    try {
      let session = this.sessionCache;
      let shouldDestroy = false;
      
      // If no cached session, create a new one
      if (!session || !this.isInitialized) {
        console.debug('[LocalAI] Creating new session for examples');
        const LM = await this.ensureLM();
        session = await LM.create({
          systemPrompt: `You are a language learning assistant. Always respond in valid JSON format.`,
          language: 'en'
        });
        shouldDestroy = true;
      }
      
      const raw = await session.prompt(this.examplePrompt(word));
      
      // Only destroy if we created a new session
      if (shouldDestroy) {
        session.destroy();
      }
      
      const parsed = this.safeParseJSON(raw);
      console.debug('[LocalAI] Examples raw:', raw);
      console.debug('[LocalAI] Examples parsed:', parsed);
      
      // If parsing failed, try to return mock data or an empty array
      if (parsed && parsed.error) {
        console.warn(`[LocalAI] Examples parsing failed for "${word}":`, parsed.error);
        // Return mock examples as fallback
        const mockExamples = [
          {"nl": `Dit is een voorbeeld met ${word}.`, "en": `This is an example with ${word}.`},
          {"nl": `Hier is nog een ${word} zin.`, "en": `Here is another ${word} sentence.`}
        ];
        console.debug('[LocalAI] Returning mock examples as fallback');
        this.exampleCache.set(k, mockExamples);
        return mockExamples;
      }
      
      this.exampleCache.set(k, parsed);
      return parsed;
    } catch(e) {
      console.warn('[LocalAI] generateExamples error:', e.message);
      return null;
    }
  }

  safeParseJSON(raw) {
    if (!raw) return { error:'empty' };
    
    console.debug('[LocalAI] Raw response length:', raw.length);
    console.debug('[LocalAI] Raw response preview:', raw.substring(0, 200) + (raw.length > 200 ? '...' : ''));
    
    try {
      const text = raw.trim();
      
      // Try direct parsing first
      try {
        const result = JSON.parse(text);
        console.debug('[LocalAI] Direct parse successful');
        return result;
      } catch (e) {
        console.debug('[LocalAI] Direct parse failed:', e.message);
      }
      
      // Remove common markdown artifacts
      let cleaned = text
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```\s*$/i, '')
        .replace(/^Here's the JSON:\s*/i, '')
        .replace(/^JSON response:\s*/i, '')
        .trim();
      
      if (cleaned !== text) {
        try {
          const result = JSON.parse(cleaned);
          console.debug('[LocalAI] Markdown cleanup successful');
          return result;
        } catch (e) {
          console.debug('[LocalAI] Cleaned parse failed:', e.message);
        }
      }
      
      // Look for JSON array pattern
      let arrayMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (arrayMatch) {
        try {
          const result = JSON.parse(arrayMatch[0]);
          console.debug('[LocalAI] Array extraction successful');
          return result;
        } catch (e) {
          console.debug('[LocalAI] Array extraction failed:', e.message);
        }
      }
      
      // Look for JSON object pattern (more robust)
      let objectStart = text.indexOf('{');
      let braceCount = 0;
      let objectEnd = -1;
      
      for (let i = objectStart; i < text.length; i++) {
        if (text[i] === '{') braceCount++;
        if (text[i] === '}') {
          braceCount--;
          if (braceCount === 0) {
            objectEnd = i;
            break;
          }
        }
      }
      
      if (objectStart >= 0 && objectEnd > objectStart) {
        try {
          const jsonStr = text.slice(objectStart, objectEnd + 1);
          const result = JSON.parse(jsonStr);
          console.debug('[LocalAI] Object extraction successful');
          return result;
        } catch (e) {
          console.debug('[LocalAI] Object extraction failed:', e.message);
        }
      }
      
      // If all parsing fails, return error with raw text
      console.warn('[LocalAI] All JSON parsing attempts failed');
      console.warn('[LocalAI] Final raw text:', text);
      return { error: 'parse_failed', raw: text };
      
    } catch (e) {
      console.error('[LocalAI] Unexpected error in safeParseJSON:', e);
      return { error: 'parse_exception', raw, exception: e.message };
    }
  }
}

window.localAIService = new LocalAIService();

// Mock fallback if APIs not present (dev/test environments)
if (!window.localAIService.LM()) {
  console.warn('[LocalAI] Using mock fallbacks');
  window.localAIService.ensureLM = async () => ({
    create: async (options) => ({
      prompt: async (prompt) => {
        // Better mock responses based on prompt type
        if (prompt.includes('example sentences') || prompt.includes('Dutch example sentences')) {
          const word = prompt.match(/word "([^"]+)"/)?.[1] || 'test';
          return `[
            {"nl":"Dit is een ${word} voorbeeld zin.","en":"This is a ${word} example sentence."},
            {"nl":"Nog een ${word} demonstratie.","en":"Another ${word} demonstration."}
          ]`;
        } else {
          return '{"sentence":"(mock)","main_clause":"(mock)","sub_clauses":[],"verbs":[],"nouns":[],"difficulty_points":[],"explanation_en":"Mock explanation"}';
        }
      },
      destroy: ()=>{}
    }),
    availability: async ()=>'available'
  });
  window.localAIService.ensureTranslator = async () => ({
    create: async () => ({
      translateStreaming: async function*(s){ yield '(mock translation) ' + s.slice(0,40); }
    }),
    availability: async ()=>'available'
  });
}
