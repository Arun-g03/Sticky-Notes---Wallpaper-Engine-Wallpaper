#!/usr/bin/env python3
"""
Convert words.txt to JavaScript array format for notepad.js
"""

def convert_words_to_js():
    """Convert words.txt to JavaScript array format"""
    
    # Read words from words.txt
    try:
        with open('words.txt', 'r', encoding='utf-8') as f:
            words = f.read().strip().split('\n')
    except FileNotFoundError:
        print("Error: words.txt not found!")
        return
    except Exception as e:
        print(f"Error reading words.txt: {e}")
        return
    
    # Clean and filter words
    cleaned_words = []
    total_words = len(words)
    print(f"Processing {total_words} words...")
    
    for i, word in enumerate(words):
        # Show progress every 1000 words
        if i % 1000 == 0:
            progress = (i / total_words) * 100
            print(f"Progress: {progress:.1f}% ({i}/{total_words})")
        
        word = word.strip().lower()
        # Only include words that are reasonable for suggestions
        if (word and 
            len(word) >= 2 and 
            len(word) <= 20 and 
            word.isalpha() and 
            word not in cleaned_words):
            cleaned_words.append(word)
    
    print(f"Progress: 100.0% ({total_words}/{total_words})")
    print(f"Filtered to {len(cleaned_words)} valid words")
    
    # Sort words for better organization
    print("Sorting words...")
    cleaned_words.sort()
    
    # Convert to JavaScript array format
    print("Converting to JavaScript format...")
    js_array = "window.wordList = [\n"
    
    # Format with proper indentation and line breaks
    for i, word in enumerate(cleaned_words):
        # Show progress every 1000 words
        if i % 1000 == 0:
            progress = (i / len(cleaned_words)) * 100
            print(f"Conversion progress: {progress:.1f}% ({i}/{len(cleaned_words)})")
        
        if i > 0 and i % 10 == 0:  # New line every 10 words
            js_array += "\n            "
        js_array += f"'{word}'"
        if i < len(cleaned_words) - 1:
            js_array += ", "
    
    js_array += "\n        ];"
    print(f"Conversion progress: 100.0% ({len(cleaned_words)}/{len(cleaned_words)})")
    
    # Write to output file
    print("Writing to word_list_js.txt...")
    with open('word_list_js.txt', 'w', encoding='utf-8') as f:
        f.write(js_array)
    
    print(f"✅ Successfully converted {len(cleaned_words)} words to JavaScript format")
    print("📁 Output saved to word_list_js.txt")
    print(f"📊 First 20 words: {cleaned_words[:20]}")
    print(f"📊 Last 20 words: {cleaned_words[-20:]}")
    print(f"📏 File size: {len(js_array)} characters")

if __name__ == "__main__":
    convert_words_to_js() 