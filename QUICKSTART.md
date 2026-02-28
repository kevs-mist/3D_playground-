# BlockCraft - QUICK START (2 minutes)

## ⚡ Get Running Right Now

### Step 1: Enter the folder
```bash
cd BlockCraft
```

### Step 2: Start the server
```bash
python3 -m http.server 8000
```

Or on Windows:
```bash
python -m http.server 8000
```

### Step 3: Open in browser
```
http://localhost:8000
```

**✅ Done!** You're playing BlockCraft.

---

## 🎮 Play Immediately

### What You See
- **3D Grid**: 10×10×10 block space
- **UI Panel** (bottom-left): Block selector + Stats
- **Toolbar** (top): Save/Load/Clear buttons

### Controls
| Action | What Happens |
|--------|--------------|
| **Click** | Place selected block |
| **Right-click** | Remove block |
| **Right-click + Drag** | Rotate camera |
| **Scroll** | Zoom in/out |

### Build Something
1. Select **Cube** (red button)
2. Click in the 3D space to place
3. Try **Slope** (blue) or **Pyramid** (green)
4. Right-click to remove mistakes
5. Click **Save** to store your creation

---

## 📁 What's in the Folder?

```
BlockCraft/
├── index.html       ← Open this in browser (or use localhost:8000)
├── js/
│   └── game.js     ← All game logic (900 lines, well-commented)
├── package.json    ← npm metadata (optional)
└── README.md       ← Full documentation
```

**Total: 5 files. No compilation. No build step.**

---

## 🔧 Key Features Already Built

✅ **3D Block Placement** - Click to place, right-click to remove  
✅ **Camera Controls** - Drag to rotate, scroll to zoom  
✅ **3 Block Types** - Cube, Slope, Pyramid  
✅ **Save/Load System** - localStorage persistence  
✅ **Performance Monitor** - Real-time FPS counter  
✅ **Grid Validation** - Auto-clamps to 10×10×10  
✅ **Smooth Rendering** - Three.js with proper lighting  

---

## 🚀 Customization (Easy!)

### Change Grid Size
Open `js/game.js`, find line ~80:
```javascript
this.grid = new Array(10).fill(null).map(...)  // Change 10 to 20, 30, etc
```

### Add a New Block Type
1. Add button in `index.html`:
```html
<button class="block-btn" data-block="wood">🌳 Wood</button>
```

2. Add color in `game.js` (line ~350):
```javascript
'wood': 0xd68910  // Brown
```

3. Add geometry:
```javascript
case 'wood':
    geometry = new THREE.BoxGeometry(0.8, 1.2, 0.8);
    break;
```

### Change Colors
In `js/game.js`, function `getBlockColor()` (line ~350):
```javascript
const colors = {
    'cube': 0xe74c3c,      // Change these hex codes
    'slope': 0x3498db,
    'pyramid': 0x2ecc71
};
```

---

## 🐛 Issues?

### Port 8000 already in use?
```bash
python3 -m http.server 8001  # Use port 8001 instead
```

### Three.js not loading?
- Check internet connection (CDN required)
- Check browser console (F12) for errors
- Try a different browser

### Blocks not saving?
- Enable localStorage (not in private/incognito mode)
- Check browser console for errors
- Try clearing cache (Ctrl+Shift+Delete)

---

## 📚 Next Steps

### For Developers
- Read `README.md` for full documentation
- Open `js/game.js` - heavily commented code
- Modify and reload page (Ctrl+F5)
- Use browser DevTools (F12) for debugging

### For Teachers
- Ask students to build recognizable structures
- Have them describe their design choices
- Challenge: "Build with only 50 blocks"
- Save student work with screenshot

### For Sugarizer Integration
- See README.md section "Sugarizer Integration"
- Will need `activity.info` file
- Simple Sugar activity lifecycle code included

---

## ✨ Tips & Tricks

1. **Camera Control**: Drag with RIGHT mouse button (or middle button on Mac)
2. **Zoom**: Scroll wheel or two-finger scroll on trackpad
3. **Undo**: Use Clear button to start over (careful - asks for confirmation!)
4. **Save Patterns**: Build, save, clear, build different structure - load to compare
5. **Performance**: Watch FPS counter - should stay at 60

---

## 🎯 What Works Right Now

- ✅ Full 3D rendering
- ✅ Block placement/removal via clicking
- ✅ Camera rotation and zoom
- ✅ Save/Load to browser storage
- ✅ Three block types with custom geometry
- ✅ Proper lighting and shadows
- ✅ Real-time statistics
- ✅ Performance monitoring

---

## 🚦 What's NOT Included (v1.0)

- ❌ Physics (blocks don't fall)
- ❌ Multiplayer
- ❌ Level design mode
- ❌ Sound effects
- ❌ Mobile touch optimization
- ❌ Sugarizer datastore integration

**These can be added easily in v1.1+**

---

## 📞 Questions?

Open `js/game.js` - every function is documented.  
Most of the code is self-explanatory!

**Enjoy building!** 🎮✨

---

Made for Sugarizer with ❤️
