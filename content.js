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