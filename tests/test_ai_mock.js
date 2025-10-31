// Basic sanity test for LocalAIService presence and mock fallback.
// This is not a runnable automated test in the extension context, but can be loaded in a page via devtools.

(function() {
  console.log('[AI Test] Starting localAIService sanity check');
  if (window.localAIService) {
    console.log('[AI Test] localAIService found. Enabled:', window.localAIService.enabled);
    // Mock a generate examples call if APIs missing (will use fallback)
    window.localAIService.generateExamples('huis').then(r => {
      console.log('[AI Test] Examples for "huis":', r);
    });
  } else {
    console.warn('[AI Test] localAIService not found');
  }
})();
