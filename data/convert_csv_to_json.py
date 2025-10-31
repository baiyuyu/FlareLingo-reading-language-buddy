import csv
import json
import os

def convert_csv_to_json():
    # Input and output file paths
    input_file = 'dutch_frequency_dictionary_processed.csv'
    output_file = 'dutch_frequency_dictionary.json'
    
    # Get the directory of this script
    current_dir = os.path.dirname(os.path.abspath(__file__))
    input_path = os.path.join(current_dir, input_file)
    output_path = os.path.join(current_dir, output_file)
    
    result = {}
    
    # Read CSV file
    with open(input_path, 'r', encoding='utf-8') as csvfile:
        reader = csv.reader(csvfile)
        next(reader)  # Skip header row
        
        for row in reader:
            if len(row) < 9 or not row[0]:
                continue
            
            # Handle cases like "het, 't" by splitting into individual words
            word_variants = row[0].replace('"', '').split(', ')
            
            for variant in word_variants:
                trimmed_variant = variant.strip().lower()
                if trimmed_variant:
                    result[trimmed_variant] = {
                        'pos': row[1] if len(row) > 1 else '',
                        'definition': row[2] if len(row) > 2 else '',
                        'whether_core': row[3] == 'True' if len(row) > 3 else False,
                        'whether_general': row[4] == 'True' if len(row) > 4 else False,
                        'whether_spoken': row[5] == 'True' if len(row) > 5 else False,
                        'whether_fiction': row[6] == 'True' if len(row) > 6 else False,
                        'whether_newspapers': row[7] == 'True' if len(row) > 7 else False,
                        'whether_web': row[8] == 'True' if len(row) > 8 else False
                    }
    
    # Write to JSON file
    with open(output_path, 'w', encoding='utf-8') as jsonfile:
        json.dump(result, jsonfile, ensure_ascii=False, indent=2)
    
    print(f"Converted {len(result)} Dutch words from CSV to JSON")
    print(f"JSON file created at: {output_path}")
    
    # Check if "een" is in the dictionary with the correct properties
    if 'een' in result:
        print(f"Word 'een' found in dictionary with properties:")
        print(f"- whether_core: {result['een']['whether_core']}")
        print(f"- Entry: {json.dumps(result['een'], ensure_ascii=False)}")
    else:
        print("WARNING: Word 'een' NOT found in dictionary!")

if __name__ == "__main__":
    convert_csv_to_json() 