# Real Estate Risk Analysis — Zillow & Redfin Chrome Extension

A powerful Chrome extension that overlays real estate investment analysis directly onto Zillow and Redfin property listings. Get instant insights into crime rates, demographics, rental potential, and financial viability while browsing properties.

## 🏗️ Features

### ✅ Property Data Scraping
- **Address, Price, Bedrooms, Bathrooms, Square Footage, Year Built**
- Automatically extracts property details from Zillow and Redfin pages
- Real-time data scraping with fallback mechanisms

### 🚨 Crime Risk Analysis
- **Crime Risk Assessment**: Low/Medium/High risk indicators
- **Crime Index**: Numerical crime score (0-50 scale)
- Integration with crime data APIs (currently using dummy data)

### 👥 Demographics Analysis (0.5 mile radius)
- **Ethnicity Breakdown**: White, Black, Asian, Hispanic percentages
- **Interactive Charts**: Visual representation of demographic data
- Census data integration (currently using dummy data)

### 💰 Price Analysis with Visual Charts
- **Price Comparison**: Property price vs. median area price
- **Price Distribution**: Histogram showing local property price ranges
- **Market Positioning**: Percentage above/below median

### 💵 Income & Rent Analysis
- **Median Income**: Household income within 0.5 mile radius
- **Rent Estimates**: Monthly rental potential for whole property
- **Rent by Room**: Individual room rental estimates
- **Rent Viability**: Assessment of room-by-room rental potential

### 📊 Investment Metrics Calculator
- **Cap Rate**: Net operating income / property value
- **Cash Flow**: Monthly rental income - monthly expenses
- **ROI**: Return on investment percentage
- **Interactive Calculator**: Enter monthly expenses for real-time calculations

## 🚀 Installation

### Method 1: Load Unpacked Extension (Recommended for Development)

1. **Download the Extension**
   ```bash
   git clone <repository-url>
   cd real-estate-risk-analysis-extension
   ```

2. **Open Chrome Extensions Page**
   - Open Chrome and navigate to `chrome://extensions/`
   - Or go to Chrome Menu → More Tools → Extensions

3. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top right corner

4. **Load the Extension**
   - Click "Load unpacked"
   - Select the extension folder containing `manifest.json`
   - The extension should now appear in your extensions list

5. **Pin the Extension**
   - Click the puzzle piece icon in Chrome's toolbar
   - Find "Real Estate Risk Analysis" and click the pin icon

### Method 2: Chrome Web Store (Future Release)
- Extension will be available on the Chrome Web Store (coming soon)

## 📖 Usage Guide

### Getting Started
1. **Navigate to a Property**: Go to any Zillow or Redfin property listing page
2. **Click the Extension Icon**: Click the extension icon in your Chrome toolbar
3. **View Analysis**: The popup will automatically load and display:
   - Property details
   - Crime risk assessment
   - Price analysis with charts
   - Demographics breakdown
   - Income and rent estimates
   - Investment metrics

### Using the Investment Calculator
1. **Enter Monthly Expenses**: In the "Investment Metrics" section, enter your estimated monthly expenses
2. **Click Calculate**: Click the "Calculate" button to see:
   - Cap Rate percentage
   - Monthly cash flow
   - ROI percentage
3. **Interpret Results**: 
   - Green metrics indicate good investment potential
   - Yellow metrics suggest moderate potential
   - Red metrics indicate potential concerns

### Understanding the Charts
- **Price Distribution Chart**: Shows how the property's price compares to similar properties in the area
- **Demographics Chart**: Visual breakdown of ethnic diversity in the neighborhood

## 🔧 Technical Details

### File Structure
```
real-estate-risk-analysis-extension/
├── manifest.json          # Extension configuration
├── content.js            # Property data scraping script
├── popup.html            # User interface
├── popup.css             # Styling
├── popup.js              # Main logic and API calls
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # This file
```

### APIs Used (Currently Dummy Data)
- **Crime Data**: Crimeometer API (placeholder)
- **Demographics**: Census Bureau API (placeholder)
- **Income Data**: Census Bureau API (placeholder)
- **Rent Estimates**: Rentometer API (placeholder)
- **Price Comps**: Zillow/Redfin API (placeholder)

### Browser Compatibility
- **Chrome**: 88+ (Manifest V3)
- **Edge**: 88+ (Chromium-based)
- **Other Chromium browsers**: Should work with Manifest V3 support

## 🛠️ Development

### Prerequisites
- Chrome browser with developer mode enabled
- Basic knowledge of HTML, CSS, JavaScript
- Understanding of Chrome Extension APIs

### Local Development
1. **Clone the repository**
2. **Make changes** to the code
3. **Reload the extension** in `chrome://extensions/`
4. **Test on Zillow/Redfin** property pages

### Adding Real APIs
To replace dummy data with real APIs:

1. **Update `popup.js`**:
   - Replace `generateDummyAnalysisData()` with real API calls
   - Add API keys and endpoints
   - Implement proper error handling

2. **Update `manifest.json`**:
   - Add necessary permissions for external APIs
   - Update host permissions if needed

3. **Test thoroughly**:
   - Ensure API rate limits are respected
   - Add fallback mechanisms for API failures

## 🔒 Privacy & Security

- **No Data Collection**: The extension does not collect or store personal data
- **Local Processing**: All analysis is performed locally in your browser
- **Secure APIs**: When real APIs are implemented, they will use secure HTTPS connections
- **Transparent**: All code is open source and can be reviewed

## 🐛 Troubleshooting

### Common Issues

**Extension not loading property data**
- Refresh the Zillow/Redfin page
- Ensure you're on a property listing page (not search results)
- Check browser console for errors

**Charts not displaying**
- Ensure internet connection (Chart.js is loaded from CDN)
- Check if popup is wide enough to display charts
- Try refreshing the extension

**Investment calculator not working**
- Ensure property data has loaded completely
- Enter valid numbers in the expenses field
- Check that price and rent data are available

### Getting Help
- Check the browser console for error messages
- Ensure all files are present in the extension folder
- Verify the extension is properly loaded in Chrome

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Areas for Improvement
- Real API integration
- Additional data sources
- Enhanced UI/UX
- Performance optimizations
- Additional analysis metrics

## 📞 Support

For support, questions, or feature requests:
- Open an issue on GitHub
- Contact the development team

---

**Disclaimer**: This extension is for educational and informational purposes only. All data and analysis should be verified independently before making investment decisions. The developers are not responsible for any financial decisions made based on this tool. 