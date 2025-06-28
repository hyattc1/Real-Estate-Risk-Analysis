# Quick Installation Guide

## 🚀 Install the Chrome Extension

### Step 1: Generate Icons (Required)
1. Open `icons/generate_icons.html` in your browser
2. Right-click on each icon and save as:
   - `icon16.png` (16x16 size)
   - `icon48.png` (48x48 size) 
   - `icon128.png` (128x128 size)
3. Save all three files in the `icons/` folder

### Step 2: Load Extension in Chrome
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select this folder (the one containing `manifest.json`)
5. The extension should now appear in your extensions list

### Step 3: Pin the Extension
1. Click the puzzle piece icon in Chrome's toolbar
2. Find "Real Estate Risk Analysis"
3. Click the pin icon to keep it visible

## 🏠 How to Use

1. **Navigate to a property**: Go to any Zillow or Redfin property listing page
2. **Click the extension icon**: Click the extension icon in your Chrome toolbar
3. **View analysis**: The popup will show:
   - Property details
   - Crime risk assessment
   - Price analysis with charts
   - Demographics breakdown
   - Income and rent estimates
   - Investment metrics calculator

## 🔧 Troubleshooting

**Extension not working?**
- Make sure you're on a Zillow or Redfin property page (not search results)
- Refresh the page and try again
- Check that all files are in the correct locations

**Icons missing?**
- Follow Step 1 above to generate the required PNG icons
- Ensure all three icon files are in the `icons/` folder

**Charts not displaying?**
- Check your internet connection (Chart.js loads from CDN)
- Try refreshing the extension

## 📝 Notes

- Currently uses dummy data for demonstration
- Real API integration can be added by updating `popup.js`
- Extension works on Chrome 88+ with Manifest V3
- All analysis is performed locally in your browser

---

**Ready to analyze real estate investments!** 🏠📊 