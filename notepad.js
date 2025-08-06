// Notepad Wallpaper Engine Script
// Handles sticky note creation, editing, resizing, and removal

class StickyNote {
    constructor(x, y, width = 200, height = 150, color = '#ffff99', text = '', fontSize = 14) {
        this.id = 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.text = text;
        this.fontSize = fontSize;
        this.isDragging = false;
        this.isResizing = false;
        this.isEditing = false;
        this.keyboardManuallyClosed = false; // Track if keyboard was manually closed
        this.dragOffset = { x: 0, y: 0 };
        this.resizeHandle = null;
        this.element = null;
        this.textElement = null;
        this.saveButton = null; // Reference to save button
        this.virtualKeyboard = null;
        this.screenBounds = null;
        this.wallpaper = null;
        this.wordList = [];
        this.resizeTimeout = null;
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
            font-size: ${this.fontSize}px;
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
        
        // Calculate initial border color based on note color brightness
        const brightness = this.getColorBrightness(this.color);
        const initialBorderColor = brightness > 128 ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.6)';
        
        colorPicker.style.cssText = `
            width: 20px;
            height: 20px;
            border: 2px solid ${initialBorderColor};
            border-radius: 4px;
            cursor: pointer;
            background: ${this.color};
            transition: all 0.2s ease;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        `;
        
        // Add hover effects for the color picker
        colorPicker.addEventListener('mouseenter', () => {
            const brightness = this.getColorBrightness(this.color);
            const hoverBorderColor = brightness > 128 ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)';
            colorPicker.style.border = `2px solid ${hoverBorderColor}`;
            colorPicker.style.transform = 'scale(1.05)';
            colorPicker.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
        });
        
        colorPicker.addEventListener('mouseleave', () => {
            const brightness = this.getColorBrightness(this.color);
            const normalBorderColor = brightness > 128 ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.6)';
            colorPicker.style.border = `2px solid ${normalBorderColor}`;
            colorPicker.style.transform = 'scale(1)';
            colorPicker.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)';
        });
        colorPicker.addEventListener('change', (e) => {
            this.color = e.target.value;
            this.element.style.background = this.color;
            
            // Update the color picker's background to show the new color
            colorPicker.style.background = this.color;
            
            // Update border color based on the new color brightness
            const brightness = this.getColorBrightness(this.color);
            const borderColor = brightness > 128 ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.6)';
            colorPicker.style.border = `2px solid ${borderColor}`;
            
            // Update text color based on the new color brightness
            this.updateTextColor();
        });

        // Save button (initially hidden)
        const saveBtn = document.createElement('button');
        saveBtn.textContent = '✓';
        saveBtn.style.cssText = `
            width: 20px;
            height: 20px;
            border: none;
            background: rgba(0,255,0,0.8);
            color: white;
            border-radius: 2px;
            cursor: pointer;
            font-size: 14px;
            line-height: 1;
            display: none;
            transition: all 0.2s ease;
        `;
        saveBtn.addEventListener('click', () => {
            this.saveAndCloseKeyboard();
        });
        
        // Add hover effects for the save button
        saveBtn.addEventListener('mouseenter', () => {
            saveBtn.style.background = 'rgba(0,255,0,0.9)';
            saveBtn.style.transform = 'scale(1.1)';
            saveBtn.style.boxShadow = '0 2px 6px rgba(0,255,0,0.3)';
        });
        
        saveBtn.addEventListener('mouseleave', () => {
            saveBtn.style.background = 'rgba(0,255,0,0.8)';
            saveBtn.style.transform = 'scale(1)';
            saveBtn.style.boxShadow = 'none';
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
        controls.appendChild(saveBtn);
        controls.appendChild(deleteBtn);
        
        // Store reference to save button
        this.saveButton = saveBtn;
        header.appendChild(title);
        header.appendChild(controls);

        // Create text area
        this.textElement = document.createElement('textarea');
        this.textElement.value = this.text;
        this.textElement.placeholder = 'Click here to type your note...';
        
        // Calculate initial text color based on note color brightness
        const initialBrightness = this.getColorBrightness(this.color);
        const initialTextColor = initialBrightness > 128 ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.9)';
        const initialPlaceholderColor = initialBrightness > 128 ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)';
        
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
            color: ${initialTextColor};
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
        
        // Set placeholder color
        this.textElement.style.setProperty('--placeholder-color', initialPlaceholderColor);
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
            
            // Show keyboard if it's not already open, regardless of manual close status
            if (!this.virtualKeyboard || !this.virtualKeyboard.parentNode) {
                this.showVirtualKeyboard();
            } else {
                // Show save button even if keyboard is already open
                this.showSaveButton();
            }
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
                    // Hide save button
                    this.hideSaveButton();
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
        try {
            // Save to localStorage
            const noteData = {
                id: this.id,
                text: this.text,
                x: this.x,
                y: this.y,
                color: this.isValidHexColor(this.color) ? this.color : '#ffff99',
                width: this.width,
                height: this.height,
                fontSize: this.fontSize
            };
            
            // Get existing notes from localStorage
            const existingNotes = JSON.parse(localStorage.getItem('stickyNotes') || '[]');
            
            // Find if this note already exists
            const existingIndex = existingNotes.findIndex(note => note.id === this.id);
            
            if (existingIndex !== -1) {
                // Update existing note
                existingNotes[existingIndex] = noteData;
            } else {
                // Add new note
                existingNotes.push(noteData);
            }
            
            // Save back to localStorage
            localStorage.setItem('stickyNotes', JSON.stringify(existingNotes));
            
            console.log(`Note saved to localStorage: ${this.id}`);
        } catch (error) {
            console.log('Error saving to storage:', error);
        }
    }

    remove() {
        // Close virtual keyboard if it's open
        if (this.virtualKeyboard && this.virtualKeyboard.parentNode) {
            this.virtualKeyboard.parentNode.removeChild(this.virtualKeyboard);
            this.virtualKeyboard = null;
            console.log('Keyboard closed when note was removed');
        }
        
        // Clean up event listeners
        if (this.mouseMoveHandler) {
            document.removeEventListener('mousemove', this.mouseMoveHandler);
        }
        if (this.mouseUpHandler) {
            document.removeEventListener('mouseup', this.mouseUpHandler);
        }
        
        this.element.remove();
        
        // Remove from localStorage
        try {
            const existingNotes = JSON.parse(localStorage.getItem('stickyNotes') || '[]');
            const filteredNotes = existingNotes.filter(note => note.id !== this.id);
            localStorage.setItem('stickyNotes', JSON.stringify(filteredNotes));
            console.log(`Note removed from localStorage: ${this.id}`);
        } catch (error) {
            console.log('Error removing from storage:', error);
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
        const keyboardWidth = Math.min(600, Math.max(300, screenWidth - 40)); // Responsive width with minimum
        const keyboardHeight = Math.min(400, Math.max(200, screenHeight - taskbarHeight - 40)); // Increased height to fit all rows
        const left = Math.max(20, (screenWidth - keyboardWidth) / 2);
        const top = Math.max(20, screenHeight - taskbarHeight - keyboardHeight - 20);
        
        this.virtualKeyboard.style.cssText = `
            position: fixed;
            top: ${top}px;
            left: ${left}px;
            background: rgba(40,40,40,0.95);
            border-radius: 8px;
            padding: 10px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 4px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.6);
            width: ${keyboardWidth}px;
            height: ${keyboardHeight}px;
            min-width: 300px;
            min-height: 200px;
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
            padding: 4px;
            background: rgba(50,50,50,0.9);
            border-radius: 4px;
            margin-bottom: 6px;
            min-height: 28px;
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
            ['A-', 'A+', 'space', '↵', '✕']
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
                keyButton.dataset.key = key; // Add data attribute for key identification
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
        
        // Initialize keyboard sizes after creation
        setTimeout(() => {
            this.updateKeyboardButtonSizes();
        }, 10);
        


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
            const minWidth = 300; // Minimum width - smaller to fit all keys
            const minHeight = 200; // Increased minimum height to fit all rows
            const newWidth = Math.max(minWidth, resizeStartWidth - deltaX);
            const newHeight = Math.max(minHeight, resizeStartHeight - deltaY);
            
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
            
            // Debounced button size update for better performance
            this.debouncedUpdateKeyboardSizes();
        };

        const handleResizeEnd = () => {
            isResizing = false;
            document.removeEventListener('mousemove', handleResize);
            document.removeEventListener('mouseup', handleResizeEnd);
            
            // Final update after resize ends
            if (this.resizeTimeout) {
                clearTimeout(this.resizeTimeout);
            }
            this.updateKeyboardButtonSizes();
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
        
        // Set editing state
        this.isEditing = true;
        this.element.classList.add('editing');
        
        // Reset manual close flag since keyboard is being shown
        this.keyboardManuallyClosed = false;
        
        // Show save button when keyboard is open
        this.showSaveButton();
        
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
        
        // Get context from the current text
        const context = this.getTextContext();
        const currentWordLower = currentWord.toLowerCase();
        
        // Find matching words with improved relevance scoring
        console.log('Looking for words starting with:', currentWord, 'Context:', context);
        
        let suggestions = this.wordList
            .filter(word => {
                const wordLower = word.toLowerCase();
                return wordLower.startsWith(currentWordLower) && 
                       wordLower !== currentWordLower; // Don't suggest the exact same word
            })
            .map(word => {
                // Calculate relevance score
                let score = 0;
                const wordLower = word.toLowerCase();
                
                // Exact prefix match gets highest score
                if (wordLower.startsWith(currentWordLower)) {
                    score += 100;
                }
                
                // Shorter words get preference (more likely to be what user wants)
                score += Math.max(0, 20 - wordLower.length);
                
                // Common words get bonus
                if (this.isCommonWord(wordLower)) {
                    score += 50;
                }
                
                // Context relevance
                if (context && this.isContextuallyRelevant(wordLower, context)) {
                    score += 30;
                }
                
                // Frequency bonus (if we had frequency data)
                if (this.isFrequentWord(wordLower)) {
                    score += 25;
                }
                
                return { word, score };
            })
            .sort((a, b) => b.score - a.score) // Sort by relevance score
            .slice(0, 6) // Get top 6 suggestions
            .map(item => item.word);
        
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
        
        // Get context from the current text
        const context = this.getTextContext();
        
        // Smart next word suggestions based on context
        let suggestions = this.getContextualNextWords(context);
        
        // Fallback to common words if no contextual suggestions
        if (suggestions.length === 0) {
            suggestions = this.getCommonNextWords();
        }
        
        // Limit to 5 suggestions
        suggestions = suggestions.slice(0, 5);
        
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

    // Helper methods for improved word suggestions
    getTextContext() {
        const text = this.textElement.value;
        const words = text.trim().split(/\s+/);
        
        // Get the last few words for context
        const recentWords = words.slice(-3);
        return recentWords.join(' ').toLowerCase();
    }

    isCommonWord(word) {
        const commonWords = [
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'this', 'that', 'it', 'is', 'was', 'are',
            'you', 'he', 'she', 'they', 'we', 'I', 'me', 'him', 'her', 'them',
            'my', 'your', 'his', 'her', 'their', 'our', 'its', 'some', 'any',
            'all', 'many', 'few', 'much', 'more', 'most', 'very', 'really',
            'quite', 'rather', 'too', 'also', 'just', 'only', 'even', 'still',
            'again', 'always', 'never', 'sometimes', 'often', 'usually', 'can',
            'will', 'would', 'could', 'should', 'may', 'might', 'must', 'have',
            'has', 'had', 'do', 'does', 'did', 'be', 'been', 'being', 'get',
            'got', 'getting', 'go', 'goes', 'going', 'went', 'gone', 'make',
            'makes', 'making', 'made', 'take', 'takes', 'taking', 'took', 'taken'
        ];
        return commonWords.includes(word);
    }

    isFrequentWord(word) {
        const frequentWords = [
            'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
            'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
            'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her',
            'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there',
            'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get',
            'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no',
            'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your',
            'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then',
            'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
            'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first',
            'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these',
            'give', 'day', 'most', 'us'
        ];
        return frequentWords.includes(word);
    }

    isContextuallyRelevant(word, context) {
        // Simple context matching - can be enhanced with more sophisticated NLP
        const contextWords = context.split(/\s+/);
        
        // Check if word is related to context words
        for (const contextWord of contextWords) {
            if (this.areWordsRelated(word, contextWord)) {
                return true;
            }
        }
        return false;
    }

    areWordsRelated(word1, word2) {
        // Simple word relationship detection
        // This could be enhanced with a proper thesaurus or semantic analysis
        
        // Check for common prefixes/suffixes
        if (word1.startsWith(word2) || word2.startsWith(word1)) {
            return true;
        }
        
        // Check for similar word families
        const wordFamilies = {
            'work': ['working', 'worker', 'workplace', 'workload'],
            'time': ['timing', 'timer', 'timeline', 'timeout'],
            'help': ['helping', 'helper', 'helpful', 'helpless'],
            'play': ['playing', 'player', 'playful', 'playground'],
            'learn': ['learning', 'learner', 'learned', 'lesson'],
            'write': ['writing', 'writer', 'written', 'writings'],
            'read': ['reading', 'reader', 'readable', 'readings'],
            'think': ['thinking', 'thought', 'thinker', 'thoughtful'],
            'feel': ['feeling', 'felt', 'feelings', 'emotional'],
            'know': ['knowing', 'knowledge', 'known', 'unknown']
        };
        
        for (const [family, words] of Object.entries(wordFamilies)) {
            if (words.includes(word1) && words.includes(word2)) {
                return true;
            }
        }
        
        return false;
    }

    getContextualNextWords(context) {
        const contextLower = context.toLowerCase();
        const suggestions = [];
        
        // Context-based next word patterns
        const patterns = {
            // After "I" or "I am"
            'i am': ['happy', 'tired', 'working', 'thinking', 'feeling', 'going', 'here', 'ready'],
            'i': ['think', 'know', 'want', 'need', 'like', 'love', 'hate', 'feel', 'am', 'will', 'can'],
            
            // After "the"
            'the': ['best', 'worst', 'most', 'least', 'only', 'same', 'other', 'next', 'last', 'first'],
            
            // After "is" or "was"
            'is': ['good', 'bad', 'great', 'awesome', 'terrible', 'amazing', 'wonderful', 'perfect'],
            'was': ['good', 'bad', 'great', 'awesome', 'terrible', 'amazing', 'wonderful', 'perfect'],
            
            // After "in" or "at"
            'in': ['the', 'this', 'that', 'my', 'your', 'his', 'her', 'their', 'our'],
            'at': ['the', 'this', 'that', 'my', 'your', 'his', 'her', 'their', 'our'],
            
            // After "to"
            'to': ['the', 'this', 'that', 'my', 'your', 'his', 'her', 'their', 'our', 'go', 'come', 'get'],
            
            // After "for"
            'for': ['the', 'this', 'that', 'my', 'your', 'his', 'her', 'their', 'our', 'work', 'study'],
            
            // After "with"
            'with': ['the', 'this', 'that', 'my', 'your', 'his', 'her', 'their', 'our'],
            
            // After "and"
            'and': ['the', 'this', 'that', 'my', 'your', 'his', 'her', 'their', 'our', 'then', 'also'],
            
            // After "but"
            'but': ['the', 'this', 'that', 'my', 'your', 'his', 'her', 'their', 'our', 'then', 'also'],
            
            // After "it"
            'it': ['is', 'was', 'will', 'can', 'should', 'might', 'could', 'would', 'has', 'had'],
            
            // After "this"
            'this': ['is', 'was', 'will', 'can', 'should', 'might', 'could', 'would', 'has', 'had'],
            
            // After "that"
            'that': ['is', 'was', 'will', 'can', 'should', 'might', 'could', 'would', 'has', 'had']
        };
        
        // Check for exact context matches
        for (const [pattern, words] of Object.entries(patterns)) {
            if (contextLower.endsWith(pattern)) {
                suggestions.push(...words);
            }
        }
        
        // Check for partial matches (last word)
        const lastWord = contextLower.split(/\s+/).pop();
        for (const [pattern, words] of Object.entries(patterns)) {
            if (pattern.endsWith(lastWord)) {
                suggestions.push(...words);
            }
        }
        
        return [...new Set(suggestions)]; // Remove duplicates
    }

    getCommonNextWords() {
        return [
            'the', 'a', 'an', 'is', 'was', 'and', 'or', 'but', 'in', 'on', 'at',
            'to', 'for', 'of', 'with', 'by', 'from', 'this', 'that', 'it',
            'you', 'he', 'she', 'they', 'we', 'I', 'me', 'him', 'her', 'them',
            'my', 'your', 'his', 'her', 'their', 'our', 'its', 'some', 'any',
            'all', 'many', 'few', 'much', 'more', 'most', 'very', 'really',
            'quite', 'rather', 'too', 'also', 'just', 'only', 'even', 'still',
            'again', 'always', 'never', 'sometimes', 'often', 'usually'
        ];
    }

    getColorBrightness(color) {
        // Convert hex color to RGB and calculate brightness
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        // Calculate brightness using standard formula
        return (r * 299 + g * 587 + b * 114) / 1000;
    }

    updateTextColor() {
        // Update text color based on current note color brightness
        const brightness = this.getColorBrightness(this.color);
        const textColor = brightness > 128 ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.9)';
        const placeholderColor = brightness > 128 ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)';
        
        this.textElement.style.color = textColor;
        this.textElement.style.setProperty('--placeholder-color', placeholderColor);
    }

    // Validate hex color format
    isValidHexColor(color) {
        if (!color || typeof color !== 'string') {
            return false;
        }
        
        // Check if it's a valid hex color (#RRGGBB)
        const hexRegex = /^#[0-9A-Fa-f]{6}$/;
        return hexRegex.test(color);
    }

    isKeyboardOpen() {
        return this.virtualKeyboard && this.virtualKeyboard.parentNode;
    }

    closeAllKeyboards() {
        // Close all open virtual keyboards
        const openKeyboards = document.querySelectorAll('.virtual-keyboard');
        openKeyboards.forEach(keyboard => {
            if (keyboard.parentNode) {
                keyboard.parentNode.removeChild(keyboard);
            }
        });
        
        // Reset editing state for all notes
        this.notes.forEach(note => {
            note.isEditing = false;
            note.keyboardManuallyClosed = false; // Reset manual close flag
            if (note.element) {
                note.element.classList.remove('editing');
            }
            note.virtualKeyboard = null;
            // Hide save button
            if (note.saveButton) {
                note.saveButton.style.display = 'none';
            }
        });
        
        console.log('All keyboards closed');
    }

    saveAndCloseKeyboard() {
        // Visual feedback - briefly change button appearance
        if (this.saveButton) {
            this.saveButton.textContent = '✓';
            this.saveButton.style.background = 'rgba(0,255,0,1)';
            this.saveButton.style.transform = 'scale(1.2)';
        }
        
        // Save the current text
        this.text = this.textElement.value;
        this.saveToStorage();
        
        // Close the keyboard
        this.hideVirtualKeyboard();
        
        // Hide the save button
        if (this.saveButton) {
            this.saveButton.style.display = 'none';
        }
        
        console.log('Note saved and keyboard closed');
    }

    showSaveButton() {
        if (this.saveButton) {
            this.saveButton.style.display = 'block';
        }
    }

    hideSaveButton() {
        if (this.saveButton) {
            this.saveButton.style.display = 'none';
        }
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
            // Remove the keyboard from DOM
            if (this.virtualKeyboard.parentNode) {
                this.virtualKeyboard.parentNode.removeChild(this.virtualKeyboard);
            }
            this.virtualKeyboard = null;
            
            // Clear any editing state
            this.isEditing = false;
            
            // Remove editing class from note
            if (this.element) {
                this.element.classList.remove('editing');
            }
            
            // Blur the textarea
            if (this.textElement) {
                this.textElement.blur();
            }
            
            // Mark keyboard as manually closed
            this.keyboardManuallyClosed = true;
            
            // Hide save button
            this.hideSaveButton();
            
            console.log('Virtual keyboard hidden');
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
                // Don't refocus or update suggestions when closing keyboard
                return;
            case 'fontSizeUp':
                this.changeFontSize(2);
                return;
            case 'fontSizeDown':
                this.changeFontSize(-2);
                return;
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

    changeFontSize(delta) {
        // Change font size with limits (double the max possible size)
        const newSize = Math.max(8, Math.min(72, this.fontSize + delta));
        if (newSize !== this.fontSize) {
            this.fontSize = newSize;
            
            // Update the note element font size
            if (this.element) {
                this.element.style.fontSize = this.fontSize + 'px';
            }
            
            // Update the textarea font size if it exists
            if (this.textElement) {
                this.textElement.style.fontSize = this.fontSize + 'px';
            }
            
            // Save the change
            this.saveToStorage();
            
            console.log(`Font size changed to ${this.fontSize}px`);
        }
    }

    // Debounced keyboard size update for better performance during resize
    debouncedUpdateKeyboardSizes() {
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
        this.resizeTimeout = setTimeout(() => {
            this.updateKeyboardButtonSizes();
        }, 50); // 50ms delay
    }



    updateKeyboardButtonSizes() {
        if (!this.virtualKeyboard) return;
        
        const keyboardWidth = this.virtualKeyboard.offsetWidth;
        const keyboardHeight = this.virtualKeyboard.offsetHeight;
        
        // Account for padding and margins
        const horizontalPadding = 24; // 12px padding on each side
        const verticalPadding = 20;   // Reduced padding to fit all rows
        const availableWidth = keyboardWidth - horizontalPadding;
        const availableHeight = keyboardHeight - verticalPadding;
        
        // Define keyboard layout for better sizing
        const keyboardLayout = [
            ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', '⌫'],
            ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
            ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'"],
            ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/'],
            ['space', '↵', '✕']
        ];
        
        // Calculate optimal button sizes based on layout
        const maxKeysInRow = Math.max(...keyboardLayout.map(row => row.length));
        const baseButtonWidth = availableWidth / maxKeysInRow;
        const baseButtonHeight = availableHeight / keyboardLayout.length;
        
        // Ensure minimum and maximum sizes - smaller minimums to fit all keys
        const buttonWidth = Math.max(12, Math.min(80, baseButtonWidth));
        const buttonHeight = Math.max(12, Math.min(60, baseButtonHeight));
        
        // Calculate gap between buttons (proportional to button size)
        const gap = Math.max(2, Math.min(6, buttonWidth * 0.1));
        
        // Update all keyboard rows for proper spacing
        const keyRows = this.virtualKeyboard.querySelectorAll('.keyboard-row');
        keyRows.forEach((row, rowIndex) => {
            row.style.gap = gap + 'px';
            row.style.justifyContent = 'center';
            row.style.margin = (gap * 0.3) + 'px 0'; // Reduced margin to fit all rows
            
            // Special handling for different rows
            const rowKeys = keyboardLayout[rowIndex];
            if (rowKeys) {
                // Calculate total width needed for this row
                let totalRowWidth = 0;
                rowKeys.forEach(key => {
                    let keyWidth = buttonWidth;
                    if (key === 'space') {
                        keyWidth = buttonWidth * 3; // Space bar
                    } else if (key === '↵' || key === '✕') {
                        keyWidth = buttonWidth * 1.5; // Enter and clear
                    } else if (key === '⌫') {
                        keyWidth = buttonWidth * 1.2; // Backspace
                    } else if (key === 'A+' || key === 'A-') {
                        keyWidth = buttonWidth * 1.2; // Font size controls
                    }
                    totalRowWidth += keyWidth;
                });
                
                // Add gaps
                totalRowWidth += gap * (rowKeys.length - 1);
                
                // Adjust if row is too wide
                if (totalRowWidth > availableWidth) {
                    const scaleFactor = availableWidth / totalRowWidth;
                    const adjustedButtonWidth = buttonWidth * scaleFactor;
                    const adjustedGap = gap * scaleFactor;
                    
                    row.style.gap = adjustedGap + 'px';
                    
                    // Update buttons in this row
                    const rowButtons = row.querySelectorAll('button');
                    rowButtons.forEach((button, buttonIndex) => {
                        const key = button.textContent;
                        let finalWidth = adjustedButtonWidth;
                        
                        if (key === 'space') {
                            finalWidth = adjustedButtonWidth * 3;
                        } else if (key === '↵' || key === '✕') {
                            finalWidth = adjustedButtonWidth * 1.5;
                        } else if (key === '⌫') {
                            finalWidth = adjustedButtonWidth * 1.2;
                        } else if (key === 'A+' || key === 'A-') {
                            finalWidth = adjustedButtonWidth * 1.2;
                        }
                        
                        button.style.width = finalWidth + 'px';
                        button.style.height = buttonHeight + 'px';
                        
                        // Dynamic font size - smaller for very small buttons
                        const fontSize = Math.max(6, Math.min(12, buttonHeight * 0.3));
                        button.style.fontSize = fontSize + 'px';
                        
                        // Adjust padding - minimal for small buttons
                        const padding = Math.max(0, Math.min(3, buttonHeight * 0.05));
                        button.style.padding = padding + 'px';
                    });
                } else {
                    // Normal sizing
                    const rowButtons = row.querySelectorAll('button');
                    rowButtons.forEach((button, buttonIndex) => {
                        const key = button.textContent;
                        let finalWidth = buttonWidth;
                        
                        if (key === 'space') {
                            finalWidth = buttonWidth * 3;
                        } else if (key === '↵' || key === '✕') {
                            finalWidth = buttonWidth * 1.5;
                        } else if (key === '⌫') {
                            finalWidth = buttonWidth * 1.2;
                        } else if (key === 'A+' || key === 'A-') {
                            finalWidth = buttonWidth * 1.2;
                        }
                        
                        button.style.width = finalWidth + 'px';
                        button.style.height = buttonHeight + 'px';
                        
                        // Dynamic font size - smaller for very small buttons
                        const fontSize = Math.max(6, Math.min(12, buttonHeight * 0.3));
                        button.style.fontSize = fontSize + 'px';
                        
                        // Adjust padding - minimal for small buttons
                        const padding = Math.max(0, Math.min(3, buttonHeight * 0.05));
                        button.style.padding = padding + 'px';
                    });
                }
            }
        });

        // Update resize handle size
        const resizeHandle = this.virtualKeyboard.querySelector('.resize-handle');
        if (resizeHandle) {
            const handleSize = Math.max(16, Math.min(24, buttonHeight * 0.6));
            resizeHandle.style.width = handleSize + 'px';
            resizeHandle.style.height = handleSize + 'px';
            resizeHandle.style.fontSize = Math.max(8, Math.min(12, handleSize * 0.5)) + 'px';
        }

        // Update control buttons (move button)
        const controlButtons = this.virtualKeyboard.querySelectorAll('.control-button');
        controlButtons.forEach(button => {
            const controlSize = Math.max(24, Math.min(32, buttonHeight * 0.8));
            button.style.width = controlSize + 'px';
            button.style.height = controlSize + 'px';
            button.style.fontSize = Math.max(10, Math.min(14, controlSize * 0.4)) + 'px';
            button.style.padding = '2px';
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

        // Create help button
        const helpButton = document.createElement('button');
        helpButton.textContent = '❓ Help';
        helpButton.style.cssText = `
            position: fixed;
            bottom: 80px;
            left: 20px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 8px 16px;
            border: 1px solid rgba(255,255,255,0.2);
            border-radius: 5px;
            cursor: pointer;
            font-size: 12px;
            z-index: 1002;
            pointer-events: auto;
            transition: all 0.2s ease;
        `;
        
        // Create instructions panel
        const instructionsPanel = document.createElement('div');
        instructionsPanel.style.cssText = `
            position: fixed;
            bottom: 120px;
            left: 20px;
            background: rgba(0,0,0,0.9);
            color: white;
            padding: 15px;
            border-radius: 8px;
            font-size: 12px;
            z-index: 1001;
            pointer-events: auto;
            border: 1px solid rgba(255,255,255,0.2);
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
            max-width: 300px;
            display: none;
            backdrop-filter: blur(10px);
        `;
        instructionsPanel.innerHTML = `
            <div style="margin-bottom: 10px; font-weight: bold; color: #4CAF50;">📝 Interactive Notes Wallpaper</div>
            <div style="margin-bottom: 8px;"><strong>• Move:</strong> Click and drag notes</div>
            <div style="margin-bottom: 8px;"><strong>• Edit:</strong> Double-click to open keyboard</div>
            <div style="margin-bottom: 8px;"><strong>• Resize:</strong> Drag the resize handle</div>
            <div style="margin-bottom: 8px;"><strong>• Color:</strong> Right-click for color options</div>
            <div style="margin-bottom: 8px;"><strong>• Delete:</strong> Click the red X button</div>
            <div style="margin-bottom: 8px;"><strong>• Add:</strong> Use the + Add Note button</div>
            <div style="margin-bottom: 8px;"><strong>• Clear All:</strong> Use the 🗑️ Clear All button</div>
            <div style="margin-bottom: 0px;"><strong>• Keyboard controls:</strong> Bottom left = resize, bottom right = move/reposition, A+/A- = font size</div>
        `;
        
        // Add close button to instructions panel
        const closeInstructionsButton = document.createElement('button');
        closeInstructionsButton.textContent = '✕';
        closeInstructionsButton.style.cssText = `
            position: absolute;
            top: 8px;
            right: 8px;
            background: rgba(255,255,255,0.1);
            color: white;
            border: none;
            border-radius: 3px;
            width: 20px;
            height: 20px;
            cursor: pointer;
            font-size: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        instructionsPanel.appendChild(closeInstructionsButton);
        
        // Toggle instructions panel
        let instructionsVisible = false;
        helpButton.addEventListener('click', (e) => {
            e.stopPropagation();
            instructionsVisible = !instructionsVisible;
            instructionsPanel.style.display = instructionsVisible ? 'block' : 'none';
            helpButton.textContent = instructionsVisible ? '❌ Help' : '❓ Help';
            helpButton.style.background = instructionsVisible ? 'rgba(255,0,0,0.8)' : 'rgba(0,0,0,0.8)';
        });
        
        // Close instructions when clicking close button
        closeInstructionsButton.addEventListener('click', (e) => {
            e.stopPropagation();
            instructionsVisible = false;
            instructionsPanel.style.display = 'none';
            helpButton.textContent = '❓ Help';
            helpButton.style.background = 'rgba(0,0,0,0.8)';
        });
        
        // Close instructions when clicking outside
        document.addEventListener('click', (e) => {
            if (instructionsVisible && 
                !instructionsPanel.contains(e.target) && 
                !helpButton.contains(e.target)) {
                instructionsVisible = false;
                instructionsPanel.style.display = 'none';
                helpButton.textContent = '❓ Help';
                helpButton.style.background = 'rgba(0,0,0,0.8)';
            }
        });

        document.body.appendChild(this.container);
        document.body.appendChild(addButton);
        document.body.appendChild(clearButton);
        document.body.appendChild(helpButton);
        document.body.appendChild(instructionsPanel);

        // Enable pointer events for the container
        this.container.style.pointerEvents = 'auto';
        
        // Add global event handlers to prevent desktop interaction
        this.setupGlobalEventHandlers();
        
        // Get wallpaper engine reference
        this.wallpaper = this.getWallpaperEngineReference();
        
        // Set up properties listener if available
        this.setupPropertiesListener();
        
        // Detect screen bounds and taskbar
        this.detectScreenBounds();
        
        // Load existing notes from properties
        this.loadNotes();
    }

    addNote(x = 100, y = 100) {
        // Check max notes limit
        let maxNotes = 5;
        if (this.wallpaper) {
            try {
                maxNotes = parseInt(this.wallpaper.getProperty('max_notes') || 5);
            } catch (error) {
                console.log('Error reading max_notes property, using default:', error);
            }
        }
        
        if (this.notes.length >= maxNotes) {
            console.log(`Maximum notes limit reached (${maxNotes})`);
            return null;
        }
        
        const note = new StickyNote(x, y);
        note.wallpaper = this.wallpaper;
        note.screenBounds = this.screenBounds;

        this.notes.push(note);
        this.container.appendChild(note.element);
        return note;
    }

    loadNotes() {
        // Get configuration from Wallpaper Engine properties if available
        let defaultColor = '#ffff99';
        let maxNotes = 5;
        
        if (this.wallpaper) {
            try {
                defaultColor = this.wallpaper.getProperty('default_note_color') || '#ffff99';
                maxNotes = parseInt(this.wallpaper.getProperty('max_notes') || 5);
            } catch (error) {
                console.log('Error reading properties, using defaults:', error);
            }
        }
        
        // Load notes from localStorage
        try {
            const savedNotes = JSON.parse(localStorage.getItem('stickyNotes') || '[]');
            console.log(`Loading ${savedNotes.length} notes from localStorage`);
            
            // Limit to max notes
            const notesToLoad = savedNotes.slice(0, maxNotes);
            
            notesToLoad.forEach(noteData => {
                const note = new StickyNote(
                    noteData.x || 100,
                    noteData.y || 100,
                    noteData.width || 200,
                    noteData.height || 150,
                    this.isValidHexColor(noteData.color) ? noteData.color : defaultColor,
                    noteData.text || '',
                    noteData.fontSize || 14
                );
                
                // Set the saved ID if it exists
                if (noteData.id) {
                    note.id = noteData.id;
                }
                
                note.wallpaper = this.wallpaper;
                note.screenBounds = this.screenBounds;
                this.notes.push(note);
                this.container.appendChild(note.element);
            });
        } catch (error) {
            console.log('Error loading notes from localStorage:', error);
        }
    }

    closeAllKeyboards() {
        // Close all open virtual keyboards
        const openKeyboards = document.querySelectorAll('.virtual-keyboard');
        openKeyboards.forEach(keyboard => {
            if (keyboard.parentNode) {
                keyboard.parentNode.removeChild(keyboard);
            }
        });
        
        // Reset editing state for all notes
        this.notes.forEach(note => {
            note.isEditing = false;
            note.keyboardManuallyClosed = false; // Reset manual close flag
            if (note.element) {
                note.element.classList.remove('editing');
            }
            note.virtualKeyboard = null;
            // Hide save button
            if (note.saveButton) {
                note.saveButton.style.display = 'none';
            }
        });
        
        console.log('All keyboards closed');
    }

    clearAllNotes() {
        // Close all open keyboards first
        this.closeAllKeyboards();
        
        // Remove all notes from DOM
        this.notes.forEach(note => {
            note.remove();
        });
        
        // Clear the notes array
        this.notes = [];
        
        // Clear from localStorage
        try {
            localStorage.removeItem('stickyNotes');
            console.log('All notes cleared from display and localStorage');
        } catch (error) {
            console.log('Error clearing localStorage:', error);
        }
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



    setupPropertiesListener() {
        // Set up Wallpaper Engine properties listener if available
        if (window.wallpaperRegisterAudioListener) {
            try {
                window.wallpaperRegisterAudioListener({
                    setProperty: (name, value) => {
                        console.log('Property changed:', name, value);
                        // Handle property changes if needed
                    }
                });
                console.log('Properties listener set up successfully');
            } catch (error) {
                console.log('Failed to set up properties listener:', error);
            }
        }
    }

    // Validate hex color format
    isValidHexColor(color) {
        if (!color || typeof color !== 'string') {
            return false;
        }
        
        // Check if it's a valid hex color (#RRGGBB)
        const hexRegex = /^#[0-9A-Fa-f]{6}$/;
        return hexRegex.test(color);
    }

    // Get default hex color
    getDefaultColor() {
        return '#ffff99'; // Default yellow
    }

    getWallpaperEngineReference() {
        // Try multiple ways to get Wallpaper Engine reference
        const possibleReferences = [
            window.wallpaperRegisterAudioListener,
            window.wallpaperPropertiesListener,
            window.wallpaperEngine,
            window.engine,
            window.thisScene,
            window.wallpaper
        ];
        
        for (const ref of possibleReferences) {
            if (ref && typeof ref === 'object') {
                console.log('Found Wallpaper Engine reference:', ref);
                return ref;
            }
        }
        
        // Try to access properties directly from window
        if (window.wallpaperRegisterAudioListener && window.wallpaperRegisterAudioListener.getProperty) {
            console.log('Found Wallpaper Engine reference via wallpaperRegisterAudioListener');
            return window.wallpaperRegisterAudioListener;
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
                      clickedElement.closest('.control-panel') ||
                      clickedElement.closest('.suggestions-bar') ||
                      clickedElement.closest('.suggestion-button') ||
                      clickedElement.closest('.resize-handle') ||
                      clickedElement.closest('.control-button');
        
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
                if (openKeyboard.parentNode) {
                    openKeyboard.parentNode.removeChild(openKeyboard);
                }
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