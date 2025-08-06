# Sticky Notes Wallpaper for Wallpaper Engine

A beautiful and functional notetaking wallpaper that allows you to create, edit, resize, and manage sticky notes directly on your desktop.

## Features

- **Create Notes**: Click the "+ Add Note" button to create new sticky notes
- **Drag & Drop**: Move notes around by dragging them
- **Resize Notes**: Drag the bottom-right corner to resize notes
- **Color Customization**: Change note colors using the color picker
- **Text Editing**: Click inside any note to edit the text
- **Auto-Save**: All notes are automatically saved to your browser's local storage
- **Delete Notes**: Click the "×" button to remove notes
- **Persistent Storage**: Notes persist between wallpaper sessions

## How to Use

1. **Adding Notes**: Click the "+ Add Note" button in the top-right corner
2. **Moving Notes**: Click and drag anywhere on a note (except the text area or resize handle)
3. **Resizing Notes**: Drag the small handle in the bottom-right corner of each note
4. **Editing Text**: Click inside the text area of any note to start typing
5. **Changing Colors**: Use the color picker in the top-right of each note
6. **Deleting Notes**: Click the red "×" button in the top-right of each note

## Installation

1. Open Wallpaper Engine
2. Click "Open from file"
3. Select the `project.json` file from this folder
4. The wallpaper will load with all functionality ready to use

## Customization

The wallpaper includes several customizable properties in Wallpaper Engine:

- **Scheme Color**: Changes the overall theme color
- **Default Note Color**: Sets the default color for new notes
- **Show Instructions**: Toggle the instruction panel visibility
- **Auto Save**: Enable/disable automatic saving of notes

## Technical Details

- Built with vanilla JavaScript (no external dependencies)
- Uses HTML5 localStorage for data persistence
- Responsive design that works on any resolution
- Optimized for performance with smooth animations
- Compatible with Wallpaper Engine's HTML wallpaper format

## File Structure

```
notepad_project/
├── index.html              # Main HTML file
├── project.json            # Wallpaper Engine configuration
├── scene.json              # Scene configuration (legacy)
├── scripts/
│   └── notepad.js         # Main JavaScript functionality
├── shaders/                # GLSL shaders for 3D effects
├── materials/              # Material definitions
└── README.md              # This file
```

## Browser Compatibility

This wallpaper works best in modern browsers that support:
- HTML5 localStorage
- CSS3 animations and transforms
- Modern JavaScript ES6+ features

## Troubleshooting

- **Notes not saving**: Make sure localStorage is enabled in your browser
- **Performance issues**: Try reducing the number of notes if you have many
- **Display issues**: Ensure your graphics drivers are up to date

## License

This project is open source and available under the MIT License.

---

Enjoy your interactive sticky notes wallpaper! 📝✨ 