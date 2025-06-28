// Content Script for Real Estate Risk Analysis Extension
// Scrapes property data from Zillow and Redfin pages

class PropertyDataScraper {
    constructor() {
        this.currentUrl = window.location.href;
        this.isZillow = this.currentUrl.includes('zillow.com');
        this.isRedfin = this.currentUrl.includes('redfin.com');
        this.isRealtor = this.currentUrl.includes('realtor.com');
    }

    // Main scraping function
    async scrapePropertyData() {
        try {
            if (this.isZillow) {
                return await this.scrapeZillowData();
            } else if (this.isRedfin) {
                return await this.scrapeRedfinData();
            } else if (this.isRealtor) {
                return await this.scrapeRealtorData();
            } else if (this.currentUrl.includes('test.html') || window.propertyData) {
                // Handle test pages
                return await this.scrapeTestData();
            } else {
                throw new Error('Unsupported website');
            }
        } catch (error) {
            console.error('Error scraping property data:', error);
            return null;
        }
    }

    // Scrape data from Zillow
    async scrapeZillowData() {
        // Wait for page to load
        await this.waitForElement('[data-testid="property-card"]', 5000);
        
        const data = {
            source: 'Zillow',
            url: this.currentUrl,
            timestamp: new Date().toISOString()
        };

        // Extract address
        const addressElement = document.querySelector('[data-testid="property-card-addr"]') || 
                             document.querySelector('.property-card-addr') ||
                             document.querySelector('[data-testid="home-details-summary-address"]');
        if (addressElement) {
            data.address = addressElement.textContent.trim();
        }

        // Extract price
        const priceElement = document.querySelector('[data-testid="property-card-price"]') ||
                           document.querySelector('.property-card-price') ||
                           document.querySelector('[data-testid="home-details-summary-price"]');
        if (priceElement) {
            data.price = this.extractPrice(priceElement.textContent);
        }

        // Extract property details
        const detailsElement = document.querySelector('[data-testid="property-card-details"]') ||
                             document.querySelector('.property-card-details') ||
                             document.querySelector('[data-testid="home-details-summary-details"]');
        if (detailsElement) {
            const details = this.extractPropertyDetails(detailsElement.textContent);
            data.bedrooms = details.bedrooms;
            data.bathrooms = details.bathrooms;
            data.squareFootage = details.squareFootage;
        }

        // Extract year built
        const yearBuiltElement = document.querySelector('[data-testid="year-built"]') ||
                               document.querySelector('.year-built');
        if (yearBuiltElement) {
            data.yearBuilt = this.extractYear(yearBuiltElement.textContent);
        }

        // Extract coordinates from map data
        const coordinates = this.extractCoordinates();
        if (coordinates) {
            data.latitude = coordinates.lat;
            data.longitude = coordinates.lng;
        }

        return data;
    }

    // Scrape data from Redfin - Updated with better selectors
    async scrapeRedfinData() {
        // Wait for page to load - try multiple selectors
        try {
            await this.waitForElement('.homeAddress, .homeValue, [data-rf-test-name="address"]', 5000);
        } catch (error) {
            console.log('Waiting for Redfin page to load...');
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        const data = {
            source: 'Redfin',
            url: this.currentUrl,
            timestamp: new Date().toISOString()
        };

        // Extract address - try multiple selectors
        const addressSelectors = [
            '.homeAddress',
            '[data-rf-test-name="address"]',
            '.homeAddressValue',
            '.homeAddressContainer .homeAddress',
            'h1.homeAddress',
            '.homeAddressValue'
        ];
        
        for (const selector of addressSelectors) {
            const addressElement = document.querySelector(selector);
            if (addressElement && addressElement.textContent.trim()) {
                data.address = addressElement.textContent.trim();
                break;
            }
        }

        // Extract price - try multiple selectors
        const priceSelectors = [
            '.homeValue',
            '[data-rf-test-name="price"]',
            '.homeValueValue',
            '.priceValue',
            '.homePrice',
            '.homeValueContainer .homeValue'
        ];
        
        for (const selector of priceSelectors) {
            const priceElement = document.querySelector(selector);
            if (priceElement && priceElement.textContent.trim()) {
                data.price = this.extractPrice(priceElement.textContent);
                if (data.price) break;
            }
        }

        // Extract property details - try multiple approaches
        const detailsSelectors = [
            '.HomeStats',
            '[data-rf-test-name="property-details"]',
            '.homeStats',
            '.propertyStats',
            '.homeDetails',
            '.homeStatsContainer'
        ];
        
        for (const selector of detailsSelectors) {
            const detailsElement = document.querySelector(selector);
            if (detailsElement) {
                const details = this.extractPropertyDetails(detailsElement.textContent);
                if (details.bedrooms || details.bathrooms || details.squareFootage) {
                    data.bedrooms = details.bedrooms;
                    data.bathrooms = details.bathrooms;
                    data.squareFootage = details.squareFootage;
                    break;
                }
            }
        }

        // If details not found in HomeStats, try individual elements
        if (!data.bedrooms || !data.bathrooms) {
            // Try to find beds/baths in various locations
            const pageText = document.body.textContent;
            const bedMatch = pageText.match(/(\d+)\s*(?:bed|br|bedroom)/i);
            const bathMatch = pageText.match(/(\d+(?:\.\d+)?)\s*(?:bath|ba|bathroom)/i);
            
            if (bedMatch && !data.bedrooms) {
                data.bedrooms = parseInt(bedMatch[1]);
            }
            if (bathMatch && !data.bathrooms) {
                data.bathrooms = parseFloat(bathMatch[1]);
            }
        }

        // Extract year built
        const yearSelectors = [
            '.yearBuilt',
            '[data-rf-test-name="year-built"]',
            '.homeYearBuilt',
            '.yearBuiltValue'
        ];
        
        for (const selector of yearSelectors) {
            const yearBuiltElement = document.querySelector(selector);
            if (yearBuiltElement) {
                data.yearBuilt = this.extractYear(yearBuiltElement.textContent);
                if (data.yearBuilt) break;
            }
        }

        // Extract coordinates from page data
        const coordinates = this.extractCoordinates();
        if (coordinates) {
            data.latitude = coordinates.lat;
            data.longitude = coordinates.lng;
        }

        // If we still don't have coordinates, try to extract from URL or other sources
        if (!coordinates) {
            const urlCoords = this.extractCoordinatesFromURL();
            if (urlCoords) {
                data.latitude = urlCoords.lat;
                data.longitude = urlCoords.lng;
            }
        }

        return data;
    }

    // Scrape data from Realtor.com
    async scrapeRealtorData() {
        // Wait for page to load - try multiple selectors
        try {
            await this.waitForElement('.price, .price-value, [data-testid="price"], .property-price', 5000);
        } catch (error) {
            console.log('Waiting for Realtor.com page to load...');
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        const data = {
            source: 'Realtor.com',
            url: this.currentUrl,
            timestamp: new Date().toISOString()
        };

        // Extract address - try multiple selectors
        const addressSelectors = [
            '[data-testid="address"]',
            '.address',
            '.property-address',
            '.home-address',
            'h1[data-testid="address"]',
            '.address-value',
            '.property-title h1',
            '.home-title'
        ];
        
        for (const selector of addressSelectors) {
            const addressElement = document.querySelector(selector);
            if (addressElement && addressElement.textContent.trim()) {
                data.address = addressElement.textContent.trim();
                break;
            }
        }

        // Extract price - try multiple selectors
        const priceSelectors = [
            '[data-testid="price"]',
            '.price',
            '.price-value',
            '.property-price',
            '.home-price',
            '.price-container .price',
            '.price-display'
        ];
        
        for (const selector of priceSelectors) {
            const priceElement = document.querySelector(selector);
            if (priceElement && priceElement.textContent.trim()) {
                data.price = this.extractPrice(priceElement.textContent);
                if (data.price) break;
            }
        }

        // Extract property details - try multiple approaches
        const detailsSelectors = [
            '[data-testid="property-details"]',
            '.property-details',
            '.home-details',
            '.property-stats',
            '.home-stats',
            '.property-info',
            '.home-info'
        ];
        
        for (const selector of detailsSelectors) {
            const detailsElement = document.querySelector(selector);
            if (detailsElement) {
                const details = this.extractPropertyDetails(detailsElement.textContent);
                if (details.bedrooms || details.bathrooms || details.squareFootage) {
                    data.bedrooms = details.bedrooms;
                    data.bathrooms = details.bathrooms;
                    data.squareFootage = details.squareFootage;
                    break;
                }
            }
        }

        // If details not found in dedicated section, try individual elements
        if (!data.bedrooms || !data.bathrooms) {
            // Try to find beds/baths in various locations
            const bedSelectors = [
                '[data-testid="beds"]',
                '.beds',
                '.bedrooms',
                '.property-beds',
                '.home-beds'
            ];
            
            const bathSelectors = [
                '[data-testid="baths"]',
                '.baths',
                '.bathrooms',
                '.property-baths',
                '.home-baths'
            ];
            
            for (const selector of bedSelectors) {
                const bedElement = document.querySelector(selector);
                if (bedElement && !data.bedrooms) {
                    const bedText = bedElement.textContent.trim();
                    const bedMatch = bedText.match(/(\d+)/);
                    if (bedMatch) {
                        data.bedrooms = parseInt(bedMatch[1]);
                        break;
                    }
                }
            }
            
            for (const selector of bathSelectors) {
                const bathElement = document.querySelector(selector);
                if (bathElement && !data.bathrooms) {
                    const bathText = bathElement.textContent.trim();
                    const bathMatch = bathText.match(/(\d+(?:\.\d+)?)/);
                    if (bathMatch) {
                        data.bathrooms = parseFloat(bathMatch[1]);
                        break;
                    }
                }
            }
        }

        // Extract square footage
        const sqftSelectors = [
            '[data-testid="sqft"]',
            '.sqft',
            '.square-feet',
            '.property-sqft',
            '.home-sqft',
            '.size'
        ];
        
        for (const selector of sqftSelectors) {
            const sqftElement = document.querySelector(selector);
            if (sqftElement && !data.squareFootage) {
                const sqftText = sqftElement.textContent.trim();
                const sqftMatch = sqftText.match(/([\d,]+)/);
                if (sqftMatch) {
                    data.squareFootage = parseInt(sqftMatch[1].replace(/,/g, ''));
                    break;
                }
            }
        }

        // Extract year built
        const yearSelectors = [
            '[data-testid="year-built"]',
            '.year-built',
            '.built',
            '.property-year',
            '.home-year',
            '.construction-year'
        ];
        
        for (const selector of yearSelectors) {
            const yearBuiltElement = document.querySelector(selector);
            if (yearBuiltElement) {
                data.yearBuilt = this.extractYear(yearBuiltElement.textContent);
                if (data.yearBuilt) break;
            }
        }

        // If we still don't have some data, try to extract from page text
        if (!data.bedrooms || !data.bathrooms || !data.squareFootage) {
            const pageText = document.body.textContent;
            
            if (!data.bedrooms) {
                const bedMatch = pageText.match(/(\d+)\s*(?:bed|br|bedroom)/i);
                if (bedMatch) {
                    data.bedrooms = parseInt(bedMatch[1]);
                }
            }
            
            if (!data.bathrooms) {
                const bathMatch = pageText.match(/(\d+(?:\.\d+)?)\s*(?:bath|ba|bathroom)/i);
                if (bathMatch) {
                    data.bathrooms = parseFloat(bathMatch[1]);
                }
            }
            
            if (!data.squareFootage) {
                const sqftMatch = pageText.match(/(\d{1,3}(?:,\d{3})*)\s*(?:sq\s*ft|square\s*feet|sqft)/i);
                if (sqftMatch) {
                    data.squareFootage = parseInt(sqftMatch[1].replace(/,/g, ''));
                }
            }
        }

        // Extract coordinates from page data
        const coordinates = this.extractCoordinates();
        if (coordinates) {
            data.latitude = coordinates.lat;
            data.longitude = coordinates.lng;
        }

        // If we still don't have coordinates, try to extract from URL or other sources
        if (!coordinates) {
            const urlCoords = this.extractCoordinatesFromURL();
            if (urlCoords) {
                data.latitude = urlCoords.lat;
                data.longitude = urlCoords.lng;
            }
        }

        return data;
    }

    // Scrape data from test pages
    async scrapeTestData() {
        // Use window.propertyData if available, otherwise scrape from DOM
        if (window.propertyData) {
            return window.propertyData;
        }
        
        const data = {
            source: 'Test Page',
            url: this.currentUrl,
            timestamp: new Date().toISOString()
        };

        // Extract price
        const priceElement = document.querySelector('.price');
        if (priceElement) {
            data.price = this.extractPrice(priceElement.textContent);
        }

        // Extract details from the property info section
        const detailsElement = document.querySelector('.details');
        if (detailsElement) {
            const detailsText = detailsElement.textContent;
            
            // Extract address
            const addressMatch = detailsText.match(/Address:\s*(.+?)(?:\n|$)/);
            if (addressMatch) {
                data.address = addressMatch[1].trim();
            }
            
            // Extract bedrooms
            const bedMatch = detailsText.match(/Bedrooms:\s*(\d+)/);
            if (bedMatch) {
                data.bedrooms = parseInt(bedMatch[1]);
            }
            
            // Extract bathrooms
            const bathMatch = detailsText.match(/Bathrooms:\s*(\d+(?:\.\d+)?)/);
            if (bathMatch) {
                data.bathrooms = parseFloat(bathMatch[1]);
            }
            
            // Extract square footage
            const sqftMatch = detailsText.match(/Square Footage:\s*([\d,]+)/);
            if (sqftMatch) {
                data.squareFootage = parseInt(sqftMatch[1].replace(/,/g, ''));
            }
            
            // Extract year built
            const yearMatch = detailsText.match(/Year Built:\s*(\d+)/);
            if (yearMatch) {
                data.yearBuilt = parseInt(yearMatch[1]);
            }
        }

        return data;
    }

    // Extract coordinates from URL (Redfin sometimes has them in URL)
    extractCoordinatesFromURL() {
        const url = window.location.href;
        const coordMatch = url.match(/lat=([-\d.]+).*?lng=([-\d.]+)/i);
        if (coordMatch) {
            return {
                lat: parseFloat(coordMatch[1]),
                lng: parseFloat(coordMatch[2])
            };
        }
        return null;
    }

    // Helper function to wait for element to appear
    async waitForElement(selector, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            const checkElement = () => {
                const element = document.querySelector(selector);
                if (element) {
                    resolve(element);
                } else if (Date.now() - startTime > timeout) {
                    reject(new Error(`Element ${selector} not found within ${timeout}ms`));
                } else {
                    setTimeout(checkElement, 100);
                }
            };
            
            checkElement();
        });
    }

    // Extract price from text
    extractPrice(text) {
        if (!text) return null;
        const priceMatch = text.match(/[\$,\d]+/);
        if (priceMatch) {
            return parseInt(priceMatch[0].replace(/[$,]/g, ''));
        }
        return null;
    }

    // Extract property details (bedrooms, bathrooms, square footage)
    extractPropertyDetails(text) {
        if (!text) return { bedrooms: null, bathrooms: null, squareFootage: null };
        
        const details = {
            bedrooms: null,
            bathrooms: null,
            squareFootage: null
        };

        // Extract bedrooms
        const bedMatch = text.match(/(\d+)\s*(?:bed|br|bedroom)/i);
        if (bedMatch) {
            details.bedrooms = parseInt(bedMatch[1]);
        }

        // Extract bathrooms
        const bathMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:bath|ba|bathroom)/i);
        if (bathMatch) {
            details.bathrooms = parseFloat(bathMatch[1]);
        }

        // Extract square footage
        const sqftMatch = text.match(/(\d{1,3}(?:,\d{3})*)\s*(?:sq\s*ft|sqft|square\s*feet)/i);
        if (sqftMatch) {
            details.squareFootage = parseInt(sqftMatch[1].replace(/,/g, ''));
        }

        return details;
    }

    // Extract year built
    extractYear(text) {
        if (!text) return null;
        const yearMatch = text.match(/\b(19|20)\d{2}\b/);
        if (yearMatch) {
            return parseInt(yearMatch[0]);
        }
        return null;
    }

    // Extract coordinates from page data
    extractCoordinates() {
        // Try to find coordinates in script tags
        const scripts = document.querySelectorAll('script');
        for (const script of scripts) {
            const content = script.textContent;
            
            // Look for latitude/longitude patterns
            const latMatch = content.match(/latitude["\s:]+([-\d.]+)/i);
            const lngMatch = content.match(/longitude["\s:]+([-\d.]+)/i);
            
            if (latMatch && lngMatch) {
                return {
                    lat: parseFloat(latMatch[1]),
                    lng: parseFloat(lngMatch[1])
                };
            }

            // Look for coordinates array
            const coordMatch = content.match(/coordinates["\s:]*\[["\s]*([-\d.]+)["\s]*,[\s]*([-\d.]+)/i);
            if (coordMatch) {
                return {
                    lat: parseFloat(coordMatch[1]),
                    lng: parseFloat(coordMatch[2])
                };
            }

            // Look for Redfin-specific coordinate patterns
            const redfinCoordMatch = content.match(/lat["\s:]+([-\d.]+).*?lng["\s:]+([-\d.]+)/i);
            if (redfinCoordMatch) {
                return {
                    lat: parseFloat(redfinCoordMatch[1]),
                    lng: parseFloat(redfinCoordMatch[2])
                };
            }
        }
        
        return null;
    }
}

// Initialize scraper and listen for messages from popup
const scraper = new PropertyDataScraper();

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'scrapePropertyData') {
        scraper.scrapePropertyData().then(data => {
            sendResponse({ success: true, data: data });
        }).catch(error => {
            sendResponse({ success: false, error: error.message });
        });
        return true; // Keep message channel open for async response
    }
});

// Auto-scrape when page loads (optional)
if (scraper.isZillow || scraper.isRedfin) {
    setTimeout(async () => {
        const data = await scraper.scrapePropertyData();
        if (data) {
            // Store data for popup to access
            chrome.storage.local.set({ 'scrapedPropertyData': data });
        }
    }, 3000); // Wait 3 seconds for page to fully load
}

console.log('Real Estate Risk Analysis Extension: Content script loaded');

// Inject the sidebar HTML into the page if not already present
(async function injectSidebar() {
    if (document.getElementById('realEstateSidebar')) return;

    // Fetch sidebar.html from extension
    const html = await fetch(chrome.runtime.getURL('sidebar.html')).then(r => r.text());
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    document.body.appendChild(tempDiv.firstElementChild);

    // Sidebar DOM elements
    const sidebar = document.getElementById('realEstateSidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebarContent = document.getElementById('sidebarContent');
    const sidebarClose = document.getElementById('sidebarClose');
    const sectionHeaders = sidebar.querySelectorAll('.section-header');

    // State persistence helpers
    function saveSidebarState() {
        localStorage.setItem('reSidebarMinimized', sidebar.classList.contains('minimized'));
        const openSections = Array.from(document.querySelectorAll('.section-content.expanded')).map(e => e.id);
        localStorage.setItem('reSidebarOpenSections', JSON.stringify(openSections));
    }
    function loadSidebarState() {
        const minimized = localStorage.getItem('reSidebarMinimized') === 'true';
        if (minimized) minimizeSidebar(); else expandSidebar();
        const openSections = JSON.parse(localStorage.getItem('reSidebarOpenSections') || '[]');
        document.querySelectorAll('.section-content').forEach(e => {
            if (openSections.includes(e.id)) {
                e.classList.add('expanded');
                const btn = e.parentElement.querySelector('.section-toggle');
                if (btn) { btn.classList.add('expanded'); btn.innerText = '▲'; }
            } else {
                e.classList.remove('expanded');
                const btn = e.parentElement.querySelector('.section-toggle');
                if (btn) { btn.classList.remove('expanded'); btn.innerText = '▼'; }
            }
        });
    }

    // Expand sidebar
    function expandSidebar() {
        sidebar.classList.remove('minimized');
        sidebar.classList.add('expanded');
        sidebarContent.style.display = 'block';
        saveSidebarState();
    }
    // Minimize sidebar
    function minimizeSidebar() {
        sidebar.classList.remove('expanded');
        sidebar.classList.add('minimized');
        sidebarContent.style.display = 'none';
        saveSidebarState();
    }

    // Toggle sidebar on icon click
    sidebarToggle.addEventListener('click', expandSidebar);
    // Close button minimizes
    sidebarClose.addEventListener('click', minimizeSidebar);

    // Section expand/collapse logic
    sectionHeaders.forEach(header => {
        const section = header.getAttribute('data-section');
        const toggleBtn = header.querySelector('.section-toggle');
        const content = document.getElementById(`${section}-content`);
        // Start expanded by default
        content.classList.add('expanded');
        toggleBtn.classList.add('expanded');
        toggleBtn.innerText = '▲';
        // Toggle on click
        header.addEventListener('click', () => {
            const isExpanded = content.classList.contains('expanded');
            if (isExpanded) {
                content.classList.remove('expanded');
                toggleBtn.classList.remove('expanded');
                toggleBtn.innerText = '▼';
            } else {
                content.classList.add('expanded');
                toggleBtn.classList.add('expanded');
                toggleBtn.innerText = '▲';
            }
            saveSidebarState();
        });
    });

    // Optional: Make minimized bar draggable
    let isDragging = false, dragOffsetX = 0, dragOffsetY = 0;
    sidebarToggle.addEventListener('mousedown', function(e) {
        if (!sidebar.classList.contains('minimized')) return;
        isDragging = true;
        dragOffsetX = e.clientX - sidebar.offsetLeft;
        dragOffsetY = e.clientY - sidebar.offsetTop;
        document.body.style.userSelect = 'none';
    });
    document.addEventListener('mousemove', function(e) {
        if (isDragging && sidebar.classList.contains('minimized')) {
            sidebar.style.left = (e.clientX - dragOffsetX) + 'px';
            sidebar.style.top = (e.clientY - dragOffsetY) + 'px';
            sidebar.style.bottom = 'auto';
        }
    });
    document.addEventListener('mouseup', function() {
        isDragging = false;
        document.body.style.userSelect = '';
    });

    // Add a refresh button to the header
    const refreshBtn = document.createElement('button');
    refreshBtn.textContent = '⟳';
    refreshBtn.title = 'Refresh Analysis';
    refreshBtn.style.marginLeft = '8px';
    refreshBtn.className = 'sidebar-close';
    sidebarClose.parentElement.appendChild(refreshBtn);

    // Loading spinner
    const statusMessage = document.getElementById('statusMessage');
    function showLoadingSpinner(msg = 'Loading...') {
        statusMessage.innerHTML = `<span class="loading">${msg} <span style='font-size:18px;'>⏳</span></span>`;
        statusMessage.className = 'status-message info';
        statusMessage.style.display = 'block';
    }
    function hideLoadingSpinner() {
        statusMessage.style.display = 'none';
    }

    // Chart.js loader
    function waitForChartJs(cb) {
        if (window.Chart) return cb();
        const interval = setInterval(() => {
            if (window.Chart) {
                clearInterval(interval);
                cb();
            }
        }, 100);
        setTimeout(() => clearInterval(interval), 5000);
    }
    if (typeof window.Chart === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.js';
        document.head.appendChild(script);
    }

    // RealEstateAnalyzer logic (adapted for sidebar)
    class RealEstateAnalyzer {
        constructor() {
            this.propertyData = null;
            this.analysisData = null;
            this.charts = {};
        }

        // Main analysis function
        async runAnalysis() {
            try {
                showLoadingSpinner('Analyzing property...');
                
                // Scrape property data
                this.propertyData = await scraper.scrapePropertyData();
                
                if (!this.propertyData) {
                    hideLoadingSpinner();
                    statusMessage.innerHTML = '<span class="error">❌ Could not load property data. Please refresh the page and try again.</span>';
                    statusMessage.className = 'status-message error';
                    statusMessage.style.display = 'block';
                    return;
                }

                // Update source badge
                const sourceBadge = document.getElementById('sourceBadge');
                if (sourceBadge && this.propertyData) {
                    sourceBadge.textContent = this.propertyData.source;
                }

                // Generate analysis data
                this.analysisData = await this.generateComprehensiveAnalysisData();
                
                // Wait for Chart.js and update UI
                waitForChartJs(() => {
                    this.updateAllSections();
                    hideLoadingSpinner();
                    statusMessage.innerHTML = '<span class="success">✅ Analysis complete!</span>';
                    statusMessage.className = 'status-message success';
                    statusMessage.style.display = 'block';
                    setTimeout(() => statusMessage.style.display = 'none', 3000);
                });
                
            } catch (error) {
                console.error('Error in analysis:', error);
                hideLoadingSpinner();
                statusMessage.innerHTML = '<span class="error">❌ Error performing analysis. Please try again.</span>';
                statusMessage.className = 'status-message error';
                statusMessage.style.display = 'block';
            }
        }

        // Generate comprehensive analysis data
        async generateComprehensiveAnalysisData() {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const basePrice = this.propertyData?.price || 500000;
            
            return {
                // 1. Price Analysis
                priceAnalysis: this.generatePriceAnalysisData(basePrice),
                
                // 2. Median Income
                medianIncome: this.generateMedianIncomeData(basePrice),
                
                // 3. Crime Risk
                crimeRisk: this.calculateRealisticCrimeRisk(),
                
                // 4. Market Risk
                marketRisk: this.generateMarketRiskData(),
                
                // 5. Rent by Room Viability
                rentViability: this.generateRentViabilityData(),
                
                // 6. Demographics
                demographics: this.generateRealisticDemographics()
            };
        }

        // 1. Generate price analysis data
        generatePriceAnalysisData(basePrice) {
            const medianPrice = this.calculateRealisticMedianPrice();
            const pricePerSqft = basePrice / (this.propertyData?.squareFootage || 2000);
            const medianPricePerSqft = medianPrice / (this.propertyData?.squareFootage || 2000);
            
            // Generate comparable properties
            const comps = this.generatePriceComps(basePrice);
            
            // Calculate market position
            const pricePercentile = this.calculatePricePercentile(basePrice, comps);
            const marketPosition = this.determineMarketPosition(pricePercentile);
            
            return {
                median: Math.floor(medianPrice),
                pricePerSqft: Math.round(pricePerSqft),
                medianPricePerSqft: Math.round(medianPricePerSqft),
                comps: comps,
                marketPosition: marketPosition,
                pricePercentile: pricePercentile
            };
        }

        // 2. Generate median income data
        generateMedianIncomeData(basePrice) {
            // Base income on property price and location
            const baseIncome = this.calculateRealisticMedianIncome();
            const rentAffordability = this.calculateRentAffordability(baseIncome, basePrice);
            const stability = this.determineNeighborhoodStability(baseIncome);
            
            return {
                median: baseIncome,
                rentAffordability: rentAffordability,
                stability: stability
            };
        }

        // 4. Generate market risk data
        generateMarketRiskData() {
            const vacancyRate = Math.floor(Math.random() * 15) + 5; // 5-20%
            const populationGrowth = (Math.random() - 0.5) * 10; // -5% to +5%
            const jobGrowth = (Math.random() - 0.5) * 6; // -3% to +3%
            
            return {
                vacancyRate: vacancyRate,
                populationGrowth: populationGrowth.toFixed(1),
                jobGrowth: jobGrowth.toFixed(1),
                overallRisk: this.calculateOverallMarketRisk(vacancyRate, populationGrowth, jobGrowth)
            };
        }

        // 5. Generate rent by room viability data
        generateRentViabilityData() {
            const nearbyInstitutions = Math.floor(Math.random() * 8) + 1;
            const isViable = nearbyInstitutions >= 3;
            const rentBoost = isViable ? Math.floor(Math.random() * 20) + 10 : 0; // 10-30% boost
            const vacancyReduction = isViable ? Math.floor(Math.random() * 15) + 5 : 0; // 5-20% reduction
            
            return {
                nearbyInstitutions: nearbyInstitutions,
                viable: isViable,
                rentBoost: rentBoost,
                vacancyReduction: vacancyReduction
            };
        }

        // Calculate realistic median price based on property data
        calculateRealisticMedianPrice() {
            const basePrice = this.propertyData?.price || 500000;
            const bedrooms = this.propertyData?.bedrooms || 3;
            const bathrooms = this.propertyData?.bathrooms || 2;
            const sqft = this.propertyData?.squareFootage || 2000;
            
            // Base median on property characteristics
            let median = basePrice;
            
            // Adjust based on bedrooms (more bedrooms = higher median)
            const bedAdjustment = (bedrooms - 3) * 50000;
            median += bedAdjustment;
            
            // Adjust based on bathrooms (more bathrooms = higher median)
            const bathAdjustment = (bathrooms - 2) * 25000;
            median += bathAdjustment;
            
            // Adjust based on square footage (larger = higher median)
            const sqftAdjustment = (sqft - 2000) * 100;
            median += sqftAdjustment;
            
            // Add some realistic variation (±15%)
            const variation = (Math.random() - 0.5) * 0.3;
            median *= (1 + variation);
            
            // Ensure reasonable bounds
            median = Math.max(200000, Math.min(2000000, median));
            
            return median;
        }

        // Calculate realistic median income
        calculateRealisticMedianIncome() {
            const basePrice = this.propertyData?.price || 500000;
            
            // Base income on property price (typical 3-4x income to price ratio)
            let medianIncome = basePrice / 3.5;
            
            // Add geographic variation based on address hash
            const address = this.propertyData?.address || 'Unknown';
            const hash = this.hashCode(address);
            const variation = (hash % 100 - 50) / 100; // -50% to +50%
            medianIncome *= (1 + variation * 0.3);
            
            // Ensure reasonable bounds
            medianIncome = Math.max(30000, Math.min(200000, medianIncome));
            
            return Math.floor(medianIncome);
        }

        // Calculate rent affordability
        calculateRentAffordability(income, propertyPrice) {
            const monthlyIncome = income / 12;
            const estimatedRent = propertyPrice * 0.008; // 0.8% rule
            const rentToIncomeRatio = (estimatedRent / monthlyIncome) * 100;
            
            if (rentToIncomeRatio <= 25) return 'Excellent';
            if (rentToIncomeRatio <= 30) return 'Good';
            if (rentToIncomeRatio <= 35) return 'Fair';
            return 'Poor';
        }

        // Determine neighborhood stability
        determineNeighborhoodStability(income) {
            if (income >= 80000) return 'High';
            if (income >= 60000) return 'Medium';
            return 'Low';
        }

        // Calculate price percentile
        calculatePricePercentile(propertyPrice, comps) {
            const sortedComps = [...comps].sort((a, b) => a - b);
            const position = sortedComps.findIndex(price => price >= propertyPrice);
            return position === -1 ? 100 : Math.round((position / sortedComps.length) * 100);
        }

        // Determine market position
        determineMarketPosition(percentile) {
            if (percentile <= 25) return 'Low';
            if (percentile <= 75) return 'Average';
            return 'High';
        }

        // Calculate overall market risk
        calculateOverallMarketRisk(vacancyRate, populationGrowth, jobGrowth) {
            let risk = 0;
            
            // Vacancy rate impact (higher = more risk)
            if (vacancyRate > 15) risk += 3;
            else if (vacancyRate > 10) risk += 2;
            else if (vacancyRate > 5) risk += 1;
            
            // Population growth impact (negative = more risk)
            if (populationGrowth < -2) risk += 3;
            else if (populationGrowth < 0) risk += 2;
            else if (populationGrowth < 2) risk += 1;
            
            // Job growth impact (negative = more risk)
            if (jobGrowth < -1) risk += 3;
            else if (jobGrowth < 0) risk += 2;
            else if (jobGrowth < 1) risk += 1;
            
            if (risk <= 2) return 'Low';
            if (risk <= 4) return 'Medium';
            return 'High';
        }

        // Generate price comps
        generatePriceComps(basePrice) {
            const comps = [];
            const count = 10;
            
            for (let i = 0; i < count; i++) {
                // Generate realistic comp prices around the base price
                const variation = (Math.random() - 0.5) * 0.4; // ±20%
                const compPrice = basePrice * (1 + variation);
                comps.push(Math.floor(compPrice));
            }
            
            return comps;
        }

        // Calculate realistic crime risk
        calculateRealisticCrimeRisk() {
            const address = this.propertyData?.address || 'Unknown';
            const price = this.propertyData?.price || 500000;
            
            // Base risk on geographic factors and property value
            let risk = 0;
            
            // Geographic risk based on address hash
            const geographicRisk = this.calculateGeographicRisk(address);
            risk += geographicRisk;
            
            // Property value risk (lower value = higher crime risk generally)
            const valueRisk = this.calculateValueBasedRisk(price);
            risk += valueRisk;
            
            // Add some randomness
            const randomRisk = Math.floor(Math.random() * 3);
            risk += randomRisk;
            
            // Normalize to 1-10 scale
            risk = Math.max(1, Math.min(10, risk));
            
            return {
                score: risk,
                level: this.getCrimeRiskLevel(risk),
                factors: this.getCrimeRiskFactors(risk, address, price)
            };
        }

        // Calculate geographic risk
        calculateGeographicRisk(address) {
            const hash = this.hashCode(address);
            
            // Use hash to create geographic patterns
            const region = hash % 10;
            
            // Some regions have higher crime rates
            if (region <= 2) return 3; // High crime areas
            if (region <= 5) return 2; // Medium crime areas
            return 1; // Low crime areas
        }

        // Calculate value-based risk
        calculateValueBasedRisk(price) {
            if (price < 300000) return 2; // Lower value = higher crime risk
            if (price < 600000) return 1;
            return 0; // Higher value = lower crime risk
        }

        // Get crime risk level
        getCrimeRiskLevel(score) {
            if (score <= 3) return 'Low';
            if (score <= 6) return 'Medium';
            return 'High';
        }

        // Get crime risk factors
        getCrimeRiskFactors(score, address, price) {
            const factors = [];
            
            if (score >= 7) {
                factors.push('Above average crime rates in area');
                factors.push('Property value below neighborhood median');
            } else if (score >= 4) {
                factors.push('Moderate crime activity');
                factors.push('Mixed neighborhood characteristics');
            } else {
                factors.push('Below average crime rates');
                factors.push('Property value above neighborhood median');
            }
            
            return factors;
        }

        // Generate realistic demographics
        generateRealisticDemographics() {
            const address = this.propertyData?.address || 'Unknown';
            const hash = this.hashCode(address);
            
            // Use hash to create consistent demographics for the same address
            const seed = hash % 1000;
            
            return {
                ageGroups: {
                    '18-24': Math.floor(15 + (seed % 10)),
                    '25-34': Math.floor(20 + (seed % 15)),
                    '35-44': Math.floor(18 + (seed % 12)),
                    '45-54': Math.floor(15 + (seed % 10)),
                    '55-64': Math.floor(12 + (seed % 8)),
                    '65+': Math.floor(10 + (seed % 6))
                },
                householdSize: {
                    '1 person': Math.floor(25 + (seed % 15)),
                    '2 people': Math.floor(30 + (seed % 20)),
                    '3 people': Math.floor(20 + (seed % 15)),
                    '4+ people': Math.floor(15 + (seed % 10))
                },
                education: {
                    'High School': Math.floor(20 + (seed % 15)),
                    'Some College': Math.floor(25 + (seed % 20)),
                    'Bachelor\'s': Math.floor(30 + (seed % 25)),
                    'Graduate': Math.floor(15 + (seed % 10))
                }
            };
        }

        // Hash function for consistent data generation
        hashCode(str) {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32-bit integer
            }
            return Math.abs(hash);
        }

        // Update all sections
        updateAllSections() {
            this.updatePriceAnalysis();
            this.updateMedianIncome();
            this.updateCrimeRisk();
            this.updateMarketRisk();
            this.updateRentViability();
            this.updateDemographics();
        }

        // Update price analysis section
        updatePriceAnalysis() {
            if (!this.analysisData?.priceAnalysis) return;
            
            const data = this.analysisData.priceAnalysis;
            const price = this.propertyData?.price;
            
            // Update text displays
            const elements = {
                'median-price': `$${data.median.toLocaleString()}`,
                'price-per-sqft': `$${data.pricePerSqft}`,
                'median-price-per-sqft': `$${data.medianPricePerSqft}`,
                'market-position': data.marketPosition,
                'price-percentile': `${data.pricePercentile}%`
            };
            
            Object.entries(elements).forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) element.textContent = value;
            });
            
            // Create price comparison chart
            this.createPriceBoxplot(data.comps, price);
        }

        // Update median income section
        updateMedianIncome() {
            if (!this.analysisData?.medianIncome) return;
            
            const data = this.analysisData.medianIncome;
            
            const elements = {
                'median-income': `$${data.median.toLocaleString()}`,
                'rent-affordability': data.rentAffordability,
                'neighborhood-stability': data.stability
            };
            
            Object.entries(elements).forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) element.textContent = value;
            });
        }

        // Update crime risk section
        updateCrimeRisk() {
            if (!this.analysisData?.crimeRisk) return;
            
            const data = this.analysisData.crimeRisk;
            
            // Update risk score and level
            const scoreElement = document.getElementById('crime-risk-score');
            const levelElement = document.getElementById('crime-risk-level');
            
            if (scoreElement) scoreElement.textContent = data.score;
            if (levelElement) {
                levelElement.textContent = data.level;
                levelElement.className = `risk-level ${data.level.toLowerCase()}`;
            }
            
            // Update risk factors
            const factorsElement = document.getElementById('crime-risk-factors');
            if (factorsElement) {
                factorsElement.innerHTML = data.factors.map(factor => `<li>${factor}</li>`).join('');
            }
        }

        // Update market risk section
        updateMarketRisk() {
            if (!this.analysisData?.marketRisk) return;
            
            const data = this.analysisData.marketRisk;
            
            const elements = {
                'vacancy-rate': `${data.vacancyRate}%`,
                'population-growth': `${data.populationGrowth}%`,
                'job-growth': `${data.jobGrowth}%`,
                'overall-market-risk': data.overallRisk
            };
            
            Object.entries(elements).forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) {
                    element.textContent = value;
                    if (id === 'overall-market-risk') {
                        element.className = `risk-level ${value.toLowerCase()}`;
                    }
                }
            });
        }

        // Update rent viability section
        updateRentViability() {
            if (!this.analysisData?.rentViability) return;
            
            const data = this.analysisData.rentViability;
            
            const elements = {
                'nearby-institutions': data.nearbyInstitutions,
                'rent-boost': data.viable ? `${data.rentBoost}%` : 'N/A',
                'vacancy-reduction': data.viable ? `${data.vacancyReduction}%` : 'N/A'
            };
            
            Object.entries(elements).forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) element.textContent = value;
            });
            
            // Update viability status
            const viabilityElement = document.getElementById('rent-viability-status');
            if (viabilityElement) {
                viabilityElement.textContent = data.viable ? 'Viable' : 'Not Viable';
                viabilityElement.className = `viability-status ${data.viable ? 'viable' : 'not-viable'}`;
            }
        }

        // Update demographics section
        updateDemographics() {
            if (!this.analysisData?.demographics) return;
            
            const data = this.analysisData.demographics;
            
            // Create demographics chart
            this.createDemographicsChart(data);
        }

        // Create price comparison boxplot
        createPriceBoxplot(comps, propertyPrice) {
            const canvas = document.getElementById('price-comparison-chart');
            if (!canvas || !window.Chart) return;
            
            // Destroy existing chart
            if (this.charts.priceComparison) {
                this.charts.priceComparison.destroy();
            }
            
            const sortedComps = [...comps].sort((a, b) => a - b);
            const q1 = sortedComps[Math.floor(sortedComps.length * 0.25)];
            const q3 = sortedComps[Math.floor(sortedComps.length * 0.75)];
            const median = sortedComps[Math.floor(sortedComps.length * 0.5)];
            
            this.charts.priceComparison = new Chart(canvas, {
                type: 'bar',
                data: {
                    labels: ['Market Range', 'Property Price'],
                    datasets: [{
                        label: 'Price Range',
                        data: [q3 - q1, propertyPrice - median],
                        backgroundColor: ['rgba(54, 162, 235, 0.5)', 'rgba(255, 99, 132, 0.8)'],
                        borderColor: ['rgba(54, 162, 235, 1)', 'rgba(255, 99, 132, 1)'],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return '$' + (value / 1000) + 'k';
                                }
                            }
                        }
                    }
                }
            });
        }

        // Create demographics chart
        createDemographicsChart(demoData) {
            const canvas = document.getElementById('demographics-chart');
            if (!canvas || !window.Chart) return;
            
            // Destroy existing chart
            if (this.charts.demographics) {
                this.charts.demographics.destroy();
            }
            
            const labels = Object.keys(demoData.ageGroups);
            const data = Object.values(demoData.ageGroups);
            
            this.charts.demographics = new Chart(canvas, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.8)',
                            'rgba(54, 162, 235, 0.8)',
                            'rgba(255, 205, 86, 0.8)',
                            'rgba(75, 192, 192, 0.8)',
                            'rgba(153, 102, 255, 0.8)',
                            'rgba(255, 159, 64, 0.8)'
                        ],
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 10,
                                usePointStyle: true
                            }
                        }
                    }
                }
            });
        }
    }

    // Initialize analyzer and run analysis
    const analyzer = new RealEstateAnalyzer();
    function runAnalyzer() {
        analyzer.runAnalysis();
    }

    // Run analyzer on load and on refresh
    runAnalyzer();
    refreshBtn.addEventListener('click', runAnalyzer);

    // Restore sidebar state
    loadSidebarState();
})(); 