// Notepad Wallpaper Engine Script
// Handles sticky note creation, editing, resizing, and removal

class StickyNote {
    constructor(x, y, width = 200, height = 150, color = '#ffff99', text = '') {
        this.id = 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.text = text;
        this.isDragging = false;
        this.isResizing = false;
        this.isEditing = false;
        this.dragOffset = { x: 0, y: 0 };
        this.resizeHandle = null;
        this.element = null;
        this.textElement = null;
        this.createNote();
    }

    createNote() {
        // Create note container
        this.element = document.createElement('div');
        this.element.className = 'sticky-note';
        this.element.id = this.id;
        this.element.dataset.noteId = this.id;
        this.element.style.cssText = `
            position: absolute;
            left: ${this.x}px;
            top: ${this.y}px;
            width: ${this.width}px;
            height: ${this.height}px;
            background: ${this.color};
            border: 1px solid #d4d4d4;
            border-radius: 2px;
            box-shadow: 2px 2px 8px rgba(0,0,0,0.1);
            cursor: move;
            user-select: none;
            font-family: 'Arial', sans-serif;
            font-size: 14px;
            padding: 10px;
            box-sizing: border-box;
            z-index: 1000;
        `;

        // Create header with controls
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
            padding-bottom: 5px;
            border-bottom: 1px solid rgba(0,0,0,0.1);
        `;

        const title = document.createElement('span');
        title.textContent = 'Sticky Note';
        title.style.cssText = `
            font-weight: bold;
            font-size: 12px;
            color: rgba(0,0,0,0.6);
        `;

        const controls = document.createElement('div');
        controls.style.cssText = `
            display: flex;
            gap: 5px;
        `;

        // Color picker
        const colorPicker = document.createElement('input');
        colorPicker.type = 'color';
        colorPicker.value = this.color;
        colorPicker.style.cssText = `
            width: 20px;
            height: 20px;
            border: none;
            border-radius: 2px;
            cursor: pointer;
        `;
        colorPicker.addEventListener('change', (e) => {
            this.color = e.target.value;
            this.element.style.background = this.color;
        });

        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '×';
        deleteBtn.style.cssText = `
            width: 20px;
            height: 20px;
            border: none;
            background: rgba(255,0,0,0.8);
            color: white;
            border-radius: 2px;
            cursor: pointer;
            font-size: 14px;
            line-height: 1;
        `;
        deleteBtn.addEventListener('click', () => {
            this.remove();
        });

        controls.appendChild(colorPicker);
        controls.appendChild(deleteBtn);
        header.appendChild(title);
        header.appendChild(controls);

        // Create text area
        this.textElement = document.createElement('textarea');
        this.textElement.value = this.text;
        this.textElement.placeholder = 'Click here to type your note...';
        this.textElement.style.cssText = `
            width: 100%;
            height: 100%;
            border: none;
            background: transparent;
            resize: none;
            outline: none;
            font-family: 'Segoe UI', 'Arial', sans-serif;
            font-size: 13px;
            line-height: 1.5;
            color: rgba(0,0,0,0.9);
            cursor: pointer;
            padding: 0;
            box-sizing: border-box;
            overflow-y: auto;
            tabindex: 0;
            user-select: text;
            direction: ltr;
            text-align: left;
            unicode-bidi: normal;
            writing-mode: horizontal-tb;
        `;
        this.textElement.readOnly = false;
        this.textElement.addEventListener('keydown', (e) => {
            // Prevent direct typing, only allow virtual keyboard
            e.preventDefault();
            e.stopPropagation();
        });
        

        
        // Remove the input event listener since we're using virtual keyboard
        // this.textElement.addEventListener('input', (e) => {
        //     this.text = e.target.value;
        //     this.saveToStorage();
        //     console.log('Text changed:', this.text); // Debug log
        // });

        // Enhanced textarea event handling
        this.textElement.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            // Ensure textarea gets focus
            this.textElement.focus();
        });

        this.textElement.addEventListener('click', (e) => {
            e.stopPropagation();
            // Ensure textarea gets focus
            this.textElement.focus();
        });

        // Double-click to select all text
        this.textElement.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            this.textElement.select();
        });

        this.textElement.addEventListener('focus', (e) => {
            this.isEditing = true;
            // Bring note to front when editing
            this.element.style.zIndex = '1001';
            // Add visual editing state
            this.element.classList.add('editing');
            this.showVirtualKeyboard();
        });

        this.textElement.addEventListener('blur', (e) => {
            // Check if the new focus target is part of the virtual keyboard
            const relatedTarget = e.relatedTarget;
            if (relatedTarget && this.virtualKeyboard && this.virtualKeyboard.contains(relatedTarget)) {
                // Don't hide keyboard if focus is moving to keyboard elements
                return;
            }
            
            // Don't hide keyboard if clicking on keyboard elements
            setTimeout(() => {
                if (!this.virtualKeyboard || this.virtualKeyboard.style.display === 'none') {
                    this.isEditing = false;
                    // Return to normal z-index when done editing
                    this.element.style.zIndex = '1000';
                    // Remove visual editing state
                    this.element.classList.remove('editing');
                    this.hideVirtualKeyboard();
                }
            }, 100);
        });

        // Prevent drag when typing
        this.textElement.addEventListener('keydown', (e) => {
            e.stopPropagation();
        });

        this.textElement.addEventListener('keyup', (e) => {
            e.stopPropagation();
        });

        // Create resize handle
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'resize-handle';
        resizeHandle.style.cssText = `
            position: absolute;
            bottom: 0;
            right: 0;
            width: 15px;
            height: 15px;
            background: rgba(0,0,0,0.3);
            cursor: se-resize;
            border-radius: 0 0 2px 0;
        `;

        // Create text layer container
        const textLayer = document.createElement('div');
        textLayer.className = 'text-layer';
        textLayer.style.cssText = `
            position: relative;
            width: 100%;
            height: calc(100% - 40px);
            background: rgba(255,255,255,0.1);
            border-radius: 2px;
            padding: 8px;
            box-sizing: border-box;
            overflow: hidden;
        `;

        // Add textarea to the text layer
        textLayer.appendChild(this.textElement);

        // Add click handler to text layer for easier typing
        textLayer.addEventListener('click', (e) => {
            if (e.target === textLayer) {
                this.textElement.focus();
            }
        });

        this.element.appendChild(header);
        this.element.appendChild(textLayer);
        this.element.appendChild(resizeHandle);

        // Add event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Single mousedown handler for the entire note
        this.element.addEventListener('mousedown', (e) => {
            // Don't start dragging if clicking on textarea, text layer, or resize handle
            if (e.target === this.textElement || 
                e.target.className === 'resize-handle' ||
                e.target.className === 'text-layer') {
                // Allow textarea to receive focus and handle its own events
                return;
            }
            
            // Start dragging for other elements
            this.isDragging = true;
            const rect = this.element.getBoundingClientRect();
            this.dragOffset.x = e.clientX - rect.left;
            this.dragOffset.y = e.clientY - rect.top;
            this.element.style.zIndex = '1001';
            e.preventDefault();
            e.stopPropagation();
        });

        this.element.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Resize functionality
        const resizeHandle = this.element.querySelector('.resize-handle');
        resizeHandle.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            this.isResizing = true;
            this.element.style.zIndex = '1001';
            e.preventDefault();
        });

        // Global mouse events
        const handleMouseMove = (e) => {
            if (this.isDragging) {
                const newX = e.clientX - this.dragOffset.x;
                const newY = e.clientY - this.dragOffset.y;
                
                // Keep note within safe screen bounds
                const maxX = (this.wallpaper ? this.screenBounds.right : window.innerWidth) - this.width;
                const maxY = (this.wallpaper ? this.screenBounds.bottom - this.screenBounds.taskbarHeight : window.innerHeight) - this.height;
                
                this.x = Math.max(0, Math.min(newX, maxX));
                this.y = Math.max(0, Math.min(newY, maxY));
                
                this.element.style.left = this.x + 'px';
                this.element.style.top = this.y + 'px';
                this.saveToStorage();
            } else if (this.isResizing) {
                const newWidth = e.clientX - this.x;
                const newHeight = e.clientY - this.y;
                if (newWidth > 100 && newHeight > 80) {
                    this.width = newWidth;
                    this.height = newHeight;
                    this.element.style.width = this.width + 'px';
                    this.element.style.height = this.height + 'px';
                    this.textElement.style.height = (this.height - 40) + 'px';
                    this.saveToStorage();
                }
            }
        };

        const handleMouseUp = () => {
            this.isDragging = false;
            this.isResizing = false;
            this.element.style.zIndex = '1000';
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        
        // Store references for cleanup
        this.mouseMoveHandler = handleMouseMove;
        this.mouseUpHandler = handleMouseUp;
    }

    saveToStorage() {
        // Check if wallpaper engine is available
        if (!this.wallpaper) {
            console.log('Wallpaper engine not available, skipping save');
            return;
        }
        
        try {
            // Get current note count
            const noteCount = parseInt(this.wallpaper.getProperty('note_count') || 0);
            
            // Find this note's index
            let noteIndex = -1;
            for (let i = 1; i <= noteCount; i++) {
                const noteId = this.wallpaper.getProperty(`note_${i}_id`);
                if (noteId === this.id) {
                    noteIndex = i;
                    break;
                }
            }
            
            // If note doesn't exist, add it
            if (noteIndex === -1) {
                noteIndex = noteCount + 1;
                this.wallpaper.setProperty('note_count', noteIndex);
            }
            
            // Save note data to properties
            this.wallpaper.setProperty(`note_${noteIndex}_id`, this.id);
            this.wallpaper.setProperty(`note_${noteIndex}_text`, this.text);
            this.wallpaper.setProperty(`note_${noteIndex}_x`, this.x);
            this.wallpaper.setProperty(`note_${noteIndex}_y`, this.y);
            this.wallpaper.setProperty(`note_${noteIndex}_color`, this.color);
            this.wallpaper.setProperty(`note_${noteIndex}_width`, this.width);
            this.wallpaper.setProperty(`note_${noteIndex}_height`, this.height);
            
            console.log(`Note saved to property note_${noteIndex}`);
        } catch (error) {
            console.log('Error saving to storage:', error);
        }
    }

    remove() {
        // Clean up event listeners
        if (this.mouseMoveHandler) {
            document.removeEventListener('mousemove', this.mouseMoveHandler);
        }
        if (this.mouseUpHandler) {
            document.removeEventListener('mouseup', this.mouseUpHandler);
        }
        
        this.element.remove();
        
        // Remove from properties
        const noteCount = parseInt(this.wallpaper.getProperty('note_count') || 0);
        for (let i = 1; i <= noteCount; i++) {
            const noteId = this.wallpaper.getProperty(`note_${i}_id`);
            if (noteId === this.id) {
                // Clear this note's properties
                this.wallpaper.setProperty(`note_${i}_id`, '');
                this.wallpaper.setProperty(`note_${i}_text`, '');
                this.wallpaper.setProperty(`note_${i}_x`, 0);
                this.wallpaper.setProperty(`note_${i}_y`, 0);
                this.wallpaper.setProperty(`note_${i}_color`, '255 255 153');
                this.wallpaper.setProperty(`note_${i}_width`, 200);
                this.wallpaper.setProperty(`note_${i}_height`, 150);
                break;
            }
        }
    }

    showVirtualKeyboard() {
        if (this.virtualKeyboard) {
            this.virtualKeyboard.style.display = 'block';
            return;
        }

        // Create virtual keyboard
        this.virtualKeyboard = document.createElement('div');
        this.virtualKeyboard.className = 'virtual-keyboard';
        // Calculate optimal initial position
        const screenWidth = this.screenBounds ? this.screenBounds.right : window.innerWidth;
        const screenHeight = this.screenBounds ? this.screenBounds.bottom : window.innerHeight;
        const taskbarHeight = this.screenBounds ? this.screenBounds.taskbarHeight : 40;
        
        // Position keyboard in bottom center, avoiding taskbar
        const keyboardWidth = 600; // Initial width (increased from 500)
        const keyboardHeight = 250; // Initial height
        const left = Math.max(20, (screenWidth - keyboardWidth) / 2);
        const top = Math.max(20, screenHeight - taskbarHeight - keyboardHeight - 20);
        
        this.virtualKeyboard.style.cssText = `
            position: fixed;
            top: ${top}px;
            left: ${left}px;
            background: rgba(40,40,40,0.95);
            border-radius: 8px;
            padding: 12px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 4px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.6);
            width: ${keyboardWidth}px;
            height: ${keyboardHeight}px;
            min-width: 300px;
            min-height: 150px;
            resize: both;
            overflow: hidden;
            cursor: move;
            border: 1px solid rgba(255,255,255,0.1);
        `;

        // Add word suggestions bar at the top
        this.suggestionsBar = document.createElement('div');
        this.suggestionsBar.className = 'suggestions-bar';
        this.suggestionsBar.style.cssText = `
            display: flex;
            gap: 4px;
            padding: 6px;
            background: rgba(50,50,50,0.9);
            border-radius: 4px;
            margin-bottom: 8px;
            min-height: 32px;
            align-items: center;
            flex-wrap: wrap;
            justify-content: center;
            border: 1px solid rgba(255,255,255,0.1);
            z-index: 100003;
            position: relative;
        `;
        this.virtualKeyboard.appendChild(this.suggestionsBar);
        
        console.log('Suggestions bar created:', this.suggestionsBar);

        // Load word list for predictions
        this.wordList = [];
        this.loadWordList();



        const keys = [
            ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', '⌫'],
            ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
            ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'"],
            ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/'],
            ['space', '↵', '✕']
        ];

        keys.forEach(row => {
            const keyRow = document.createElement('div');
            keyRow.className = 'keyboard-row';
            keyRow.style.cssText = `
                display: flex;
                gap: 3px;
                justify-content: center;
                margin: 2px 0;
            `;

            row.forEach(key => {
                const keyButton = document.createElement('button');
                keyButton.textContent = key;
                keyButton.style.cssText = `
                    border: none;
                    background: rgba(60,60,60,0.9);
                    color: white;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: all 0.15s ease;
                    border: 1px solid rgba(255,255,255,0.1);
                    font-weight: 500;
                `;

                keyButton.addEventListener('click', () => {
                    this.handleKeyPress(key);
                });

                keyButton.addEventListener('mouseenter', () => {
                    keyButton.style.background = 'rgba(80,80,80,0.9)';
                    keyButton.style.transform = 'scale(1.02)';
                });

                keyButton.addEventListener('mouseleave', () => {
                    keyButton.style.background = 'rgba(60,60,60,0.9)';
                    keyButton.style.transform = 'scale(1)';
                });

                keyRow.appendChild(keyButton);
            });

            this.virtualKeyboard.appendChild(keyRow);
        });

        // Add move button at bottom right
        const moveButton = document.createElement('button');
        moveButton.textContent = '🖱️';
        moveButton.className = 'control-button move-button';
        moveButton.style.cssText = `
            position: absolute;
            bottom: 5px;
            right: 5px;
            width: 28px;
            height: 28px;
            border: none;
            background: rgba(60,60,60,0.9);
            color: white;
            border-radius: 4px;
            cursor: move;
            font-size: 12px;
            transition: all 0.15s ease;
            z-index: 100000;
            pointer-events: auto;
            border: 1px solid rgba(255,255,255,0.1);
        `;
        this.virtualKeyboard.appendChild(moveButton);

        // Add resize handle at bottom left
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'resize-handle';
        resizeHandle.style.cssText = `
            position: absolute;
            bottom: 0;
            left: 0;
            width: 18px;
            height: 18px;
            background: rgba(60,60,60,0.9);
            border-radius: 0 0 0 4px;
            cursor: nw-resize;
            z-index: 100000;
            pointer-events: auto;
            border: 1px solid rgba(255,255,255,0.1);
        `;
        this.virtualKeyboard.appendChild(resizeHandle);

        // Store control elements for later reference
        this.moveButton = moveButton;
        this.resizeHandle = resizeHandle;

        // Add resize functionality
        let isResizing = false;
        let resizeStartX, resizeStartY, resizeStartWidth, resizeStartHeight, resizeStartLeft, resizeStartTop;

        resizeHandle.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            e.preventDefault();
            isResizing = true;
            
            const rect = this.virtualKeyboard.getBoundingClientRect();
            resizeStartX = e.clientX;
            resizeStartY = e.clientY;
            resizeStartWidth = rect.width;
            resizeStartHeight = rect.height;
            resizeStartLeft = rect.left;
            resizeStartTop = rect.top;
            
            document.addEventListener('mousemove', handleResize);
            document.addEventListener('mouseup', handleResizeEnd);
        });

        const handleResize = (e) => {
            if (!isResizing) return;
            
            const deltaX = e.clientX - resizeStartX;
            const deltaY = e.clientY - resizeStartY;
            
            // Calculate new dimensions (resizing from bottom-left)
            const newWidth = Math.max(300, resizeStartWidth - deltaX);
            const newHeight = Math.max(150, resizeStartHeight - deltaY);
            
            // Constrain to screen bounds
            const maxWidth = this.screenBounds ? this.screenBounds.right - 40 : window.innerWidth - 40;
            const maxHeight = this.screenBounds ? this.screenBounds.bottom - this.screenBounds.taskbarHeight - 40 : window.innerHeight - 40;
            
            const constrainedWidth = Math.min(newWidth, maxWidth);
            const constrainedHeight = Math.min(newHeight, maxHeight);
            
            // Calculate new position (bottom-left corner stays fixed)
            const newLeft = resizeStartLeft + (resizeStartWidth - constrainedWidth);
            const newTop = resizeStartTop + (resizeStartHeight - constrainedHeight);
            
            // Apply new size and position
            this.virtualKeyboard.style.width = constrainedWidth + 'px';
            this.virtualKeyboard.style.height = constrainedHeight + 'px';
            this.virtualKeyboard.style.left = newLeft + 'px';
            this.virtualKeyboard.style.top = newTop + 'px';
            
            // Update button sizes
            this.updateKeyboardButtonSizes();
        };

        const handleResizeEnd = () => {
            isResizing = false;
            document.removeEventListener('mousemove', handleResize);
            document.removeEventListener('mouseup', handleResizeEnd);
        };

        // Add movement functionality
        let isMoving = false;
        let moveStartX, moveStartY, moveStartLeft, moveStartTop;

        moveButton.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            e.preventDefault();
            isMoving = true;
            
            const rect = this.virtualKeyboard.getBoundingClientRect();
            moveStartX = e.clientX;
            moveStartY = e.clientY;
            moveStartLeft = rect.left;
            moveStartTop = rect.top;
            
            this.virtualKeyboard.style.cursor = 'grabbing';
            
            document.addEventListener('mousemove', handleMove);
            document.addEventListener('mouseup', handleMoveEnd);
        });

        const handleMove = (e) => {
            if (!isMoving) return;
            
            const deltaX = e.clientX - moveStartX;
            const deltaY = e.clientY - moveStartY;
            
            let newLeft = moveStartLeft + deltaX;
            let newTop = moveStartTop + deltaY;
            
            // Keep keyboard within screen bounds
            const keyboardRect = this.virtualKeyboard.getBoundingClientRect();
            const maxLeft = this.screenBounds ? this.screenBounds.right - keyboardRect.width : window.innerWidth - keyboardRect.width;
            const maxTop = this.screenBounds ? this.screenBounds.bottom - this.screenBounds.taskbarHeight - keyboardRect.height : window.innerHeight - keyboardRect.height;
            
            newLeft = Math.max(0, Math.min(newLeft, maxLeft));
            newTop = Math.max(0, Math.min(newTop, maxTop));
            
            this.virtualKeyboard.style.left = newLeft + 'px';
            this.virtualKeyboard.style.top = newTop + 'px';
            this.virtualKeyboard.style.bottom = 'auto';
            this.virtualKeyboard.style.transform = 'none';
        };

        const handleMoveEnd = () => {
            if (isMoving) {
                isMoving = false;
                this.virtualKeyboard.style.cursor = 'move';
                document.removeEventListener('mousemove', handleMove);
                document.removeEventListener('mouseup', handleMoveEnd);
            }
        };

        document.body.appendChild(this.virtualKeyboard);
        

        
        // Set initial button sizes
        this.updateKeyboardButtonSizes();
        
        // Adjust position to avoid taskbar
        this.adjustKeyboardPosition();
        
        // Keyboard movement is now handled by the control buttons and background dragging
        
        // Update button sizes again after a short delay to ensure proper sizing
        setTimeout(() => {
            this.updateKeyboardButtonSizes();
        }, 100);
        

    }

    loadWordList() {
        console.log('loadWordList called');
        // Use external word list from word_list.js
        // The word list is loaded via script tag in index.html
        // Check if the global wordList exists (from word_list.js)
        
        if (typeof window.wordList !== 'undefined' && window.wordList && window.wordList.length > 0) {
            this.wordList = window.wordList;
            console.log('✅ Using external word list from word_list.js');
        } else {
            console.error('❌ Word list not loaded! Check if word_list.js is properly loaded.');
            // Fallback to a small word list
            this.wordList = ['the', 'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog'];
            console.log('⚠️ Using fallback word list');
        }
        
        console.log('Word list loaded with', this.wordList.length, 'words');
        console.log('Sample words:', this.wordList.slice(0, 10));
    }

    updateSuggestions(currentWord) {
        if (!this.suggestionsBar || !this.wordList.length) {
            return;
        }
        
        // Clear existing suggestions
        this.suggestionsBar.innerHTML = '';
        
        if (!currentWord || currentWord.length < 1) {
            return;
        }
        
        // Find matching words (case-insensitive)
        console.log('Looking for words starting with:', currentWord);
        const suggestions = this.wordList.filter(word => 
            word.toLowerCase().startsWith(currentWord.toLowerCase())
        ).slice(0, 5); // Limit to 5 suggestions
        
        console.log('Found suggestions:', suggestions);
        
        // Only show suggestions if we have matches
        if (suggestions.length === 0) {
            console.log('No suggestions found for:', currentWord);
            return;
        }
        
        // Create suggestion buttons with better styling
        suggestions.forEach((word, index) => {
            const suggestionButton = document.createElement('button');
            suggestionButton.textContent = word;
            suggestionButton.className = 'suggestion-button';
            suggestionButton.style.cssText = `
                border: none;
                background: rgba(70,70,70,0.9);
                color: white;
                border-radius: 4px;
                padding: 4px 8px;
                margin: 2px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 500;
                transition: all 0.15s ease;
                border: 1px solid rgba(255,255,255,0.1);
                min-width: 50px;
                z-index: 100004;
                position: relative;
            `;
            
            suggestionButton.addEventListener('click', () => {
                this.insertSuggestion(word);
            });
            
            suggestionButton.addEventListener('mouseenter', () => {
                suggestionButton.style.background = 'rgba(255,255,255,0.4)';
                suggestionButton.style.transform = 'scale(1.05)';
            });
            
            suggestionButton.addEventListener('mouseleave', () => {
                suggestionButton.style.background = 'rgba(255,255,255,0.25)';
                suggestionButton.style.transform = 'scale(1)';
            });
            
            this.suggestionsBar.appendChild(suggestionButton);
        });
        
        // Make sure suggestions bar is visible
        this.suggestionsBar.style.display = 'flex';
        this.suggestionsBar.style.visibility = 'visible';
    }

    insertSuggestion(word) {
        const textarea = this.textElement;
        const cursorPos = textarea.selectionStart;
        const text = textarea.value;
        
        // Find the start of the current word (improved logic)
        let wordStart = cursorPos;
        while (wordStart > 0 && !/\s/.test(text[wordStart - 1])) {
            wordStart--;
        }
        
        // Replace the current word with the suggestion
        const newText = text.slice(0, wordStart) + word + ' ' + text.slice(cursorPos);
        textarea.value = newText;
        
        // Set cursor position after the inserted word
        const newCursorPos = wordStart + word.length + 1;
        textarea.selectionStart = textarea.selectionEnd = newCursorPos;
        
        // Update note text and save
        this.text = textarea.value;
        this.saveToStorage();
        
        // Clear suggestions
        if (this.suggestionsBar) {
            this.suggestionsBar.innerHTML = '';
        }
        
        // Focus and ensure cursor position
        textarea.focus();
        setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = newCursorPos;
            
            // Continue suggesting the next word after a short delay
            setTimeout(() => {
                this.updateWordSuggestions();
            }, 50);
        }, 10);
    }

    getCurrentWord() {
        const textarea = this.textElement;
        const text = textarea.value;
        
        // Since cursor is always at the end for virtual keyboard,
        // we need to find the last word being typed
        let wordStart = text.length;
        
        // Find the start of the last word
        while (wordStart > 0 && !/\s/.test(text[wordStart - 1])) {
            wordStart--;
        }
        
        const currentWord = text.slice(wordStart, text.length).trim();
        
        // If we're at the beginning of a new word (after a space),
        // return empty string to trigger next word suggestions
        if (currentWord.length === 0 && text.length > 0 && /\s$/.test(text)) {
            return '';
        }
        
        return currentWord;
    }

    updateWordSuggestions() {
        const currentWord = this.getCurrentWord();
        
        // Show suggestions for current word being typed
        if (currentWord.length >= 1) {
            this.updateSuggestions(currentWord);
        } 
        // Show next word suggestions when at beginning of new word
        else if (currentWord.length === 0) {
            this.updateNextWordSuggestions();
        }
        // Clear suggestions if no context
        else {
            if (this.suggestionsBar) {
                this.suggestionsBar.innerHTML = '';
            }
        }
    }

    updateNextWordSuggestions() {
        if (!this.suggestionsBar || !this.wordList.length) {
            return;
        }
        
        // Clear existing suggestions
        this.suggestionsBar.innerHTML = '';
        
        // Common next words to suggest
        const commonNextWords = [
            'the', 'a', 'is', 'was', 'and', 'or', 'but', 'in', 'on', 'at',
            'to', 'for', 'of', 'with', 'by', 'from', 'this', 'that', 'it',
            'you', 'he', 'she', 'they', 'we', 'I', 'me', 'him', 'her', 'them',
            'my', 'your', 'his', 'her', 'their', 'our', 'its', 'some', 'any',
            'all', 'many', 'few', 'much', 'more', 'most', 'very', 'really',
            'quite', 'rather', 'too', 'also', 'just', 'only', 'even', 'still',
            'again', 'always', 'never', 'sometimes', 'often', 'usually'
        ];
        
        // Show common next words
        const suggestions = commonNextWords.slice(0, 5);
        
        suggestions.forEach(word => {
            const suggestionButton = document.createElement('button');
            suggestionButton.textContent = word;
            suggestionButton.className = 'suggestion-button';
            suggestionButton.style.cssText = `
                border: none;
                background: rgba(70,70,70,0.9);
                color: white;
                border-radius: 4px;
                padding: 4px 8px;
                margin: 2px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 500;
                transition: all 0.15s ease;
                border: 1px solid rgba(255,255,255,0.1);
                min-width: 50px;
                z-index: 100004;
                position: relative;
            `;
            
            suggestionButton.addEventListener('click', () => {
                this.insertSuggestion(word);
            });
            
            suggestionButton.addEventListener('mouseenter', () => {
                suggestionButton.style.background = 'rgba(90,90,90,0.9)';
                suggestionButton.style.transform = 'scale(1.05)';
            });
            
            suggestionButton.addEventListener('mouseleave', () => {
                suggestionButton.style.background = 'rgba(70,70,70,0.9)';
                suggestionButton.style.transform = 'scale(1)';
            });
            
            this.suggestionsBar.appendChild(suggestionButton);
        });
        
        // Make sure suggestions bar is visible
        this.suggestionsBar.style.display = 'flex';
        this.suggestionsBar.style.visibility = 'visible';
    }

    adjustKeyboardPosition() {
        if (!this.virtualKeyboard || !this.screenBounds) return;
        
        const keyboardRect = this.virtualKeyboard.getBoundingClientRect();
        const maxBottom = this.screenBounds.bottom - this.screenBounds.taskbarHeight - 20;
        
        if (keyboardRect.bottom > maxBottom) {
            const newTop = maxBottom - keyboardRect.height;
            this.virtualKeyboard.style.bottom = 'auto';
            this.virtualKeyboard.style.top = newTop + 'px';
        }
    }

    setupKeyboardMovement() {
        if (!this.virtualKeyboard) return;
        
        let isMoving = false;
        let startX, startY, startLeft, startTop;
        
        // Mouse events for movement (only for dragging the keyboard background)
        this.virtualKeyboard.addEventListener('mousedown', (e) => {
            // Don't start moving if clicking on buttons, control elements, or resize handle
            if (e.target.tagName === 'BUTTON' || e.target.className.includes('control-button') || e.target.className.includes('resize-handle')) {
                return;
            }
            
            // Don't start moving if clicking on suggestions
            if (e.target.closest('.suggestions-bar')) {
                return;
            }
            
            isMoving = true;
            startX = e.clientX;
            startY = e.clientY;
            
            const rect = this.virtualKeyboard.getBoundingClientRect();
            startLeft = rect.left;
            startTop = rect.top;
            
            this.virtualKeyboard.style.cursor = 'grabbing';
            e.preventDefault();
            e.stopPropagation();
            
            // Add event listeners for movement
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        });
        
        const handleMouseMove = (e) => {
            if (!isMoving) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            let newLeft = startLeft + deltaX;
            let newTop = startTop + deltaY;
            
            // Keep keyboard within screen bounds
            const keyboardRect = this.virtualKeyboard.getBoundingClientRect();
            const maxLeft = this.screenBounds ? this.screenBounds.right - keyboardRect.width : window.innerWidth - keyboardRect.width;
            const maxTop = this.screenBounds ? this.screenBounds.bottom - this.screenBounds.taskbarHeight - keyboardRect.height : window.innerHeight - keyboardRect.height;
            
            newLeft = Math.max(0, Math.min(newLeft, maxLeft));
            newTop = Math.max(0, Math.min(newTop, maxTop));
            
            this.virtualKeyboard.style.left = newLeft + 'px';
            this.virtualKeyboard.style.top = newTop + 'px';
            this.virtualKeyboard.style.bottom = 'auto';
            this.virtualKeyboard.style.transform = 'none';
        };
        
        const handleMouseUp = () => {
            if (isMoving) {
                isMoving = false;
                this.virtualKeyboard.style.cursor = 'move';
                
                // Remove event listeners
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            }
        };
    }

    hideVirtualKeyboard() {
        if (this.virtualKeyboard) {
            this.virtualKeyboard.style.display = 'none';
        }
    }

    handleKeyPress(key) {
        const textarea = this.textElement;
        
        // Always append to the end for virtual keyboard input
        const text = textarea.value;
        const start = text.length; // Force cursor to end
        const end = text.length;

        switch (key) {
            case '⌫':
                if (start === end) {
                    // Delete character before cursor
                    if (start > 0) {
                        textarea.value = text.slice(0, start - 1) + text.slice(start);
                        textarea.selectionStart = textarea.selectionEnd = start - 1;
                    }
                } else {
                    // Delete selected text
                    textarea.value = text.slice(0, start) + text.slice(end);
                    textarea.selectionStart = textarea.selectionEnd = start;
                }
                break;
            case 'space':
                textarea.value = text.slice(0, start) + ' ' + text.slice(end);
                textarea.selectionStart = textarea.selectionEnd = start + 1;
                break;
            case '↵':
                textarea.value = text.slice(0, start) + '\n' + text.slice(end);
                textarea.selectionStart = textarea.selectionEnd = start + 1;
                break;
            case '✕':
                this.hideVirtualKeyboard();
                textarea.blur();
                break;
            default:
            // Insert character at cursor position
            const newText = text.slice(0, start) + key + text.slice(end);
            textarea.value = newText;
            // Move cursor to position after inserted character
            const newCursorPos = start + 1;
            textarea.selectionStart = textarea.selectionEnd = newCursorPos;
            break;
        }

        // Update note text and save
        this.text = textarea.value;
        this.saveToStorage();
        
        // Update word suggestions
        this.updateWordSuggestions();
        
        textarea.focus();
        
        // Ensure cursor position is maintained after focus
        setTimeout(() => {
            // Force cursor to end of text for virtual keyboard
            textarea.selectionStart = textarea.selectionEnd = textarea.value.length;
        }, 50);
    }

    updateKeyboardButtonSizes() {
        if (!this.virtualKeyboard) return;
        
        const keyboardWidth = this.virtualKeyboard.offsetWidth;
        const keyboardHeight = this.virtualKeyboard.offsetHeight;
        
        // Account for padding and margins
        const horizontalPadding = 24; // 12px padding on each side
        const verticalPadding = 24;   // 12px padding on top/bottom
        const availableWidth = keyboardWidth - horizontalPadding;
        const availableHeight = keyboardHeight - verticalPadding;
        
        // Calculate base button size based on keyboard dimensions
        // Assume 10 keys per row on average for width calculation
        const baseButtonWidth = availableWidth / 10;
        const baseButtonHeight = availableHeight / 5; // 5 rows
        
        // Ensure minimum and maximum sizes
        const buttonWidth = Math.max(20, Math.min(60, baseButtonWidth));
        const buttonHeight = Math.max(20, Math.min(50, baseButtonHeight));
        
        // Calculate gap between buttons (proportional to button size)
        const gap = Math.max(2, Math.min(6, buttonWidth * 0.15));
        
        // Update all keyboard rows for proper spacing
        const keyRows = this.virtualKeyboard.querySelectorAll('.keyboard-row');
        keyRows.forEach(row => {
            row.style.gap = gap + 'px';
            row.style.justifyContent = 'center';
            row.style.margin = (gap * 0.5) + 'px 0';
        });

        // Update resize handle size
        const resizeHandle = this.virtualKeyboard.querySelector('.resize-handle');
        if (resizeHandle) {
            const handleSize = Math.max(16, Math.min(24, buttonHeight * 0.6));
            resizeHandle.style.width = handleSize + 'px';
            resizeHandle.style.height = handleSize + 'px';
            resizeHandle.style.fontSize = Math.max(10, Math.min(14, handleSize * 0.5)) + 'px';
        }

        // Update all buttons
        const buttons = this.virtualKeyboard.querySelectorAll('button');
        buttons.forEach(button => {
            const key = button.textContent;
            
            // Special sizing for control buttons (🖱️)
            if (button.className.includes('control-button')) {
                const controlSize = Math.max(24, Math.min(36, buttonHeight * 0.8));
                button.style.width = controlSize + 'px';
                button.style.height = controlSize + 'px';
                button.style.fontSize = Math.max(12, Math.min(16, controlSize * 0.4)) + 'px';
                button.style.padding = '2px';
                return;
            }
            
            // Special sizing for different key types
            let finalWidth = buttonWidth;
            if (key === 'space') {
                finalWidth = buttonWidth * 4; // Space bar is 4x wider
            } else if (key === '↵' || key === '✕') {
                finalWidth = buttonWidth * 1.5; // Enter and clear are 1.5x wider
            }
            
            button.style.width = finalWidth + 'px';
            button.style.height = buttonHeight + 'px';
            
            // Dynamic font size based on button height
            const fontSize = Math.max(10, Math.min(18, buttonHeight * 0.45));
            button.style.fontSize = fontSize + 'px';
            
            // Adjust padding for better appearance
            const padding = Math.max(2, Math.min(6, buttonHeight * 0.1));
            button.style.padding = padding + 'px';
        });
    }


}

class NotepadWallpaper {
    constructor() {
        this.notes = [];
        this.container = null;
        this.isInteracting = false;
        this.wallpaper = null;
        this.screenBounds = {
            top: 0,
            left: 0,
            right: window.innerWidth,
            bottom: window.innerHeight,
            taskbarHeight: 0
        };
        this.init();
    }

    init() {
        // Create container
        this.container = document.createElement('div');
        this.container.id = 'notepad-container';
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: 999;
            pointer-events: none;
        `;

        // Create add note button
        const addButton = document.createElement('button');
        addButton.textContent = '+ Add Note';
        addButton.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            background: rgba(255,255,255,0.9);
            border: 1px solid #ccc;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            z-index: 1002;
            pointer-events: auto;
        `;
        addButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.addNote();
        });

        // Create clear all button
        const clearButton = document.createElement('button');
        clearButton.textContent = '🗑️ Clear All';
        clearButton.style.cssText = `
            position: fixed;
            top: 20px;
            right: 140px;
            padding: 10px 20px;
            background: rgba(255,0,0,0.8);
            color: white;
            border: 1px solid #d32f2f;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            z-index: 1002;
            pointer-events: auto;
            transition: all 0.2s ease;
        `;
        clearButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.clearAllNotes();
        });

        // Create instructions
        const instructions = document.createElement('div');
        instructions.style.cssText = `
            position: fixed;
            bottom: 30px;
            left: 20px;
            background: rgba(0,0,0,0.7);
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-size: 12px;
            z-index: 1002;
            pointer-events: none;
        `;
        instructions.innerHTML = `
            <strong>Interactive Notes Wallpaper</strong><br>
            • Click and drag notes to move them<br>
            • Double-click to edit text<br>
            • Use the resize handle to change size<br>
            • Right-click for more options
        `;

        document.body.appendChild(this.container);
        document.body.appendChild(addButton);
        document.body.appendChild(clearButton);
        document.body.appendChild(instructions);

        // Enable pointer events for the container
        this.container.style.pointerEvents = 'auto';
        
        // Add global event handlers to prevent desktop interaction
        this.setupGlobalEventHandlers();
        
        // Get wallpaper engine reference
        this.wallpaper = this.getWallpaperEngineReference();
        
        // Detect screen bounds and taskbar
        this.detectScreenBounds();
        
        // Load existing notes from properties
        this.loadNotes();
    }

    addNote(x = 100, y = 100) {
        const note = new StickyNote(x, y);
        note.wallpaper = this.wallpaper;
        note.screenBounds = this.screenBounds;
        this.notes.push(note);
        this.container.appendChild(note.element);
        return note;
    }

    loadNotes() {
        if (!this.wallpaper) {
            console.log('Wallpaper engine not available, using localStorage fallback');
        const savedNotes = JSON.parse(localStorage.getItem('stickyNotes') || '[]');
        savedNotes.forEach(noteData => {
            const note = new StickyNote(
                noteData.x,
                noteData.y,
                noteData.width,
                noteData.height,
                noteData.color,
                noteData.text
            );
                note.wallpaper = this.wallpaper;
            this.notes.push(note);
            this.container.appendChild(note.element);
        });
            return;
        }
        
        const noteCount = parseInt(this.wallpaper.getProperty('note_count') || 0);
        console.log(`Loading ${noteCount} notes from properties`);
        
        for (let i = 1; i <= noteCount; i++) {
            const noteId = this.wallpaper.getProperty(`note_${i}_id`);
            if (noteId && noteId !== '') {
                const note = new StickyNote(
                    parseInt(this.wallpaper.getProperty(`note_${i}_x`) || 100),
                    parseInt(this.wallpaper.getProperty(`note_${i}_y`) || 100),
                    parseInt(this.wallpaper.getProperty(`note_${i}_width`) || 200),
                    parseInt(this.wallpaper.getProperty(`note_${i}_height`) || 150),
                    this.wallpaper.getProperty(`note_${i}_color`) || '#ffff99',
                    this.wallpaper.getProperty(`note_${i}_text`) || ''
                );
                note.id = noteId;
                note.wallpaper = this.wallpaper;
                note.screenBounds = this.screenBounds;
            this.notes.push(note);
            this.container.appendChild(note.element);
            }
        }
    }

    clearAllNotes() {
        // Remove all notes from DOM
        this.notes.forEach(note => {
            note.remove();
        });
        
        // Clear the notes array
        this.notes = [];
        
        // Clear from properties
        if (this.wallpaper) {
            const noteCount = parseInt(this.wallpaper.getProperty('note_count') || 0);
            for (let i = 1; i <= noteCount; i++) {
                this.wallpaper.setProperty(`note_${i}_id`, '');
                this.wallpaper.setProperty(`note_${i}_text`, '');
                this.wallpaper.setProperty(`note_${i}_x`, 0);
                this.wallpaper.setProperty(`note_${i}_y`, 0);
                this.wallpaper.setProperty(`note_${i}_color`, '255 255 153');
                this.wallpaper.setProperty(`note_${i}_width`, 200);
                this.wallpaper.setProperty(`note_${i}_height`, 150);
            }
            this.wallpaper.setProperty('note_count', 0);
        }
        
        // Clear from localStorage as fallback
        localStorage.removeItem('stickyNotes');
        
        console.log('All notes cleared from display and properties');
    }

    detectScreenBounds() {
        // Get screen resolution from Wallpaper Engine
        const screenRes = this.getScreenResolution();
        if (screenRes) {
            this.screenBounds.right = screenRes.x;
            this.screenBounds.bottom = screenRes.y;
            console.log('Using Wallpaper Engine screen resolution:', this.screenBounds);
        } else {
            // Fallback to window dimensions
            this.screenBounds.right = window.innerWidth;
            this.screenBounds.bottom = window.innerHeight;
            console.log('Using window dimensions as fallback:', this.screenBounds);
        }
        
        // Try to detect taskbar height
        this.detectTaskbar();
        
        // Listen for window resize events
        window.addEventListener('resize', () => {
            const screenRes = this.getScreenResolution();
            if (screenRes) {
                this.screenBounds.right = screenRes.x;
                this.screenBounds.bottom = screenRes.y;
            } else {
                this.screenBounds.right = window.innerWidth;
                this.screenBounds.bottom = window.innerHeight;
            }
            this.detectTaskbar();
            this.adjustKeyboardPosition();
        });
        
        console.log('Screen bounds detected:', this.screenBounds);
    }

    getWallpaperEngineReference() {
        // Try multiple ways to get Wallpaper Engine reference
        const possibleReferences = [
            window.wallpaperRegisterAudioListener,
            window.wallpaperPropertiesListener,
            window.wallpaperEngine,
            window.engine,
            window.thisScene
        ];
        
        for (const ref of possibleReferences) {
            if (ref && typeof ref === 'object') {
                console.log('Found Wallpaper Engine reference:', ref);
                return ref;
            }
        }
        
        console.log('No Wallpaper Engine reference found, using fallback');
        return null;
    }

    getScreenResolution() {
        // Try to get screen resolution from Wallpaper Engine
        if (this.wallpaper) {
            // Try different property names
            const possibleProperties = [
                'screenResolution',
                'screen',
                'resolution',
                'screenSize'
            ];
            
            for (const prop of possibleProperties) {
                if (this.wallpaper[prop]) {
                    console.log('Found screen resolution property:', prop, this.wallpaper[prop]);
                    return this.wallpaper[prop];
                }
            }
            
            // Try to access as Vec2
            if (this.wallpaper.screenResolution && this.wallpaper.screenResolution.x && this.wallpaper.screenResolution.y) {
                return this.wallpaper.screenResolution;
            }
        }
        
        // Fallback to window.screen
        if (window.screen && window.screen.width && window.screen.height) {
            return { x: window.screen.width, y: window.screen.height };
        }
        
        return null;
    }

    detectTaskbar() {
        // Try multiple methods to detect taskbar
        const methods = [
            () => this.detectTaskbarByElement(),
            () => this.detectTaskbarByScreenSize(),
            () => this.detectTaskbarByMousePosition()
        ];
        
        for (const method of methods) {
            const taskbarHeight = method();
            if (taskbarHeight > 0) {
                this.screenBounds.taskbarHeight = taskbarHeight;
                console.log('Taskbar height detected:', taskbarHeight);
                return;
            }
        }
        
        // Default taskbar height if detection fails
        this.screenBounds.taskbarHeight = 40;
        console.log('Using default taskbar height:', 40);
    }

    detectTaskbarByElement() {
        // Look for common taskbar elements
        const taskbarSelectors = [
            '[class*="taskbar"]',
            '[class*="Taskbar"]',
            '[id*="taskbar"]',
            '[id*="Taskbar"]',
            '.Shell_TrayWnd',
            '#Shell_TrayWnd'
        ];
        
        for (const selector of taskbarSelectors) {
            const elements = document.querySelectorAll(selector);
            for (const element of elements) {
                const rect = element.getBoundingClientRect();
                if (rect.height > 0 && rect.height < 100) {
                    return rect.height;
                }
            }
        }
        return 0;
    }

    detectTaskbarByScreenSize() {
        // Compare screen size with window size
        if (window.screen && window.screen.height) {
            const screenHeight = window.screen.height;
            const windowHeight = window.innerHeight;
            const difference = screenHeight - windowHeight;
            
            if (difference > 0 && difference < 100) {
                return difference;
            }
        }
        return 0;
    }

    detectTaskbarByMousePosition() {
        // Simulate mouse movement to detect taskbar
        const testY = window.innerHeight - 10;
        const element = document.elementFromPoint(window.innerWidth / 2, testY);
        
        if (element && (element.tagName === 'BUTTON' || 
                       element.className.includes('taskbar') || 
                       element.id.includes('taskbar'))) {
            return 40; // Estimated taskbar height
        }
        return 0;
    }

    adjustKeyboardPosition() {
        // Adjust keyboard position to avoid taskbar
        const keyboards = document.querySelectorAll('.virtual-keyboard');
        keyboards.forEach(keyboard => {
            const keyboardRect = keyboard.getBoundingClientRect();
            const maxBottom = this.screenBounds.bottom - this.screenBounds.taskbarHeight - 20;
            
            if (keyboardRect.bottom > maxBottom) {
                const newTop = maxBottom - keyboardRect.height;
                keyboard.style.bottom = 'auto';
                keyboard.style.top = newTop + 'px';
            }
        });
    }

    setupGlobalEventHandlers() {
        // Prevent desktop interaction when interacting with notes
        document.addEventListener('mousedown', (e) => {
            // Check if clicking on any note element
            const isOnNote = e.target.closest('.sticky-note') || 
                           e.target.closest('#notepad-container') ||
                           e.target.closest('button') ||
                           e.target.closest('.text-layer');
            
            // Don't interfere with virtual keyboard movement
            const isOnKeyboard = e.target.closest('.virtual-keyboard');
            
            if (isOnNote && !isOnKeyboard) {
                this.isInteracting = true;
                e.stopPropagation();
                e.preventDefault();
            }
            
            // Close keyboard if clicking outside the current editing note
            this.handleClickOutsideNote(e);
        });

        document.addEventListener('mouseup', (e) => {
            if (this.isInteracting) {
                e.stopPropagation();
                e.preventDefault();
                // Small delay to prevent immediate desktop interaction
                setTimeout(() => {
                    this.isInteracting = false;
                }, 100);
            }
        });

        // Prevent context menu on notes
        document.addEventListener('contextmenu', (e) => {
            if (e.target.closest('.sticky-note')) {
                e.preventDefault();
                e.stopPropagation();
            }
        });

        // Prevent text selection on notes (but allow in textarea)
        document.addEventListener('selectstart', (e) => {
            if (e.target.closest('.sticky-note') && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
            }
        });
    }

    handleClickOutsideNote(e) {
        // Find the currently editing note (the one with an open keyboard)
        const openKeyboard = document.querySelector('.virtual-keyboard');
        if (!openKeyboard) {
            return; // No keyboard is open
        }

        // Find the note that owns this keyboard
        const editingNote = openKeyboard.closest('.sticky-note');
        if (!editingNote) {
            return; // Keyboard not associated with a note
        }

        // Check if the click is outside the editing note and not on the keyboard
        const clickedElement = e.target;
        const isOnEditingNote = editingNote.contains(clickedElement);
        const isOnKeyboard = openKeyboard.contains(clickedElement);
        
        // Also check if clicking on UI elements that shouldn't close the keyboard
        const isOnUI = clickedElement.closest('#notepad-container') || 
                      clickedElement.closest('button') ||
                      clickedElement.closest('input') ||
                      clickedElement.closest('.control-panel');
        
        // If clicking outside the editing note, keyboard, and UI elements, close the keyboard
        if (!isOnEditingNote && !isOnKeyboard && !isOnUI) {
            console.log('Clicking outside editing note, closing keyboard');
            
            // Find the StickyNote instance and hide its keyboard
            const noteId = editingNote.dataset.noteId;
            const noteInstance = this.notes.find(note => note.noteElement.dataset.noteId === noteId);
            
            if (noteInstance) {
                noteInstance.hideVirtualKeyboard();
            } else {
                // Fallback: just remove the keyboard element
                openKeyboard.remove();
            }
        }
    }
}

// Initialize the wallpaper when the page loads
window.addEventListener('load', () => {
    const wallpaper = new NotepadWallpaper();
    
    // Test typing functionality
    setTimeout(() => {
        const testNote = wallpaper.addNote(200, 200);
        testNote.textElement.focus();
        

    }, 1000);
}); 