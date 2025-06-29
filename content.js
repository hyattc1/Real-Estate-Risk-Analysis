// Real Estate Risk Analysis Extension - Content Script
// Creates a floating sidebar with comprehensive property analysis

(function() {
    'use strict';

    // Check if sidebar already exists
    if (document.getElementById('propwise-sidebar')) {
        return;
    }

    // Create the sidebar HTML with all sections
    const sidebarHTML = `
        <div id="propwise-sidebar" style="
            position: fixed;
            bottom: 20px;
            left: 20px;
            z-index: 2147483647;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            transition: all 0.3s ease;
        ">
            <!-- Minimized Button -->
            <div id="propwise-button" style="
                width: 60px;
                height: 60px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                color: white;
                font-weight: bold;
                font-size: 12px;
                text-align: center;
                line-height: 1.2;
            ">
                Propwise
            </div>

            <!-- Expanded Dashboard -->
            <div id="propwise-dashboard" style="
                position: absolute;
                bottom: 70px;
                left: 0;
                width: 400px;
                max-height: 600px;
                background: white;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.15);
                overflow-y: auto;
                display: none;
                padding: 20px;
                border: 1px solid #e1e5e9;
                z-index: 2147483647;
            ">
                <!-- Header -->
                <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 2px solid #f0f0f0;
                ">
                    <h2 style="margin: 0; color: #2c3e50; font-size: 18px; font-weight: 600;">Property Analysis</h2>
                    <button id="propwise-close" style="
                        background: none;
                        border: none;
                        font-size: 20px;
                        cursor: pointer;
                        color: #7f8c8d;
                        padding: 0;
                        width: 30px;
                        height: 30px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">×</button>
                </div>

                <!-- Section 1: Price Analysis -->
                <div class="analysis-section" style="
                    background: #f8f9fa;
                    border-radius: 8px;
                    padding: 15px;
                    margin-bottom: 15px;
                    border-left: 4px solid #3498db;
                ">
                    <h3 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 14px; font-weight: 600;">💰 Price Analysis</h3>
                    <div style="font-size: 12px; color: #555;">
                        <div style="margin-bottom: 8px;"><strong>Median Price:</strong> $485,000</div>
                        <div style="margin-bottom: 8px;"><strong>Price per Sq Ft:</strong> $242</div>
                        <div style="margin-bottom: 8px;"><strong>Market Position:</strong> <span style="color: #27ae60;">Above Average</span></div>
                        <div><strong>Price Percentile:</strong> 75th</div>
                    </div>
                </div>

                <!-- Section 2: Median Income -->
                <div class="analysis-section" style="
                    background: #f8f9fa;
                    border-radius: 8px;
                    padding: 15px;
                    margin-bottom: 15px;
                    border-left: 4px solid #e74c3c;
                ">
                    <h3 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 14px; font-weight: 600;">💵 Median Income</h3>
                    <div style="font-size: 12px; color: #555;">
                        <div style="margin-bottom: 8px;"><strong>Median Income:</strong> $72,500</div>
                        <div style="margin-bottom: 8px;"><strong>Rent Affordability:</strong> <span style="color: #e67e22;">Moderate</span></div>
                        <div><strong>Neighborhood Stability:</strong> <span style="color: #27ae60;">Stable</span></div>
                    </div>
                </div>

                <!-- Section 3: Crime Risk -->
                <div class="analysis-section" style="
                    background: #f8f9fa;
                    border-radius: 8px;
                    padding: 15px;
                    margin-bottom: 15px;
                    border-left: 4px solid #f39c12;
                ">
                    <h3 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 14px; font-weight: 600;">🚨 Crime Risk</h3>
                    <div style="font-size: 12px; color: #555;">
                        <div style="margin-bottom: 8px;"><strong>Overall Risk:</strong> <span style="color: #27ae60;">Low</span></div>
                        <div style="margin-bottom: 8px;"><strong>Violent Crime:</strong> 12 per 1,000</div>
                        <div style="margin-bottom: 8px;"><strong>Property Crime:</strong> 45 per 1,000</div>
                        <div><strong>Safety Score:</strong> 8.2/10</div>
                    </div>
                </div>

                <!-- Section 4: Market Risk -->
                <div class="analysis-section" style="
                    background: #f8f9fa;
                    border-radius: 8px;
                    padding: 15px;
                    margin-bottom: 15px;
                    border-left: 4px solid #9b59b6;
                ">
                    <h3 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 14px; font-weight: 600;">📊 Market Risk</h3>
                    <div style="font-size: 12px; color: #555;">
                        <div style="margin-bottom: 8px;"><strong>Vacancy Rate:</strong> 8.5%</div>
                        <div style="margin-bottom: 8px;"><strong>Population Growth:</strong> +2.1%</div>
                        <div style="margin-bottom: 8px;"><strong>Job Growth:</strong> +1.8%</div>
                        <div><strong>Overall Risk:</strong> <span style="color: #27ae60;">Low</span></div>
                    </div>
                </div>

                <!-- Section 5: Rent Viability -->
                <div class="analysis-section" style="
                    background: #f8f9fa;
                    border-radius: 8px;
                    padding: 15px;
                    margin-bottom: 15px;
                    border-left: 4px solid #1abc9c;
                ">
                    <h3 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 14px; font-weight: 600;">🏠 Rent Viability</h3>
                    <div style="font-size: 12px; color: #555;">
                        <div style="margin-bottom: 8px;"><strong>Nearby Institutions:</strong> 5</div>
                        <div style="margin-bottom: 8px;"><strong>Rent Boost Potential:</strong> +18%</div>
                        <div style="margin-bottom: 8px;"><strong>Vacancy Reduction:</strong> 12%</div>
                        <div><strong>Viability:</strong> <span style="color: #27ae60;">High</span></div>
                    </div>
                </div>

                <!-- Section 6: Demographics -->
                <div class="analysis-section" style="
                    background: #f8f9fa;
                    border-radius: 8px;
                    padding: 15px;
                    margin-bottom: 15px;
                    border-left: 4px solid #34495e;
                ">
                    <h3 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 14px; font-weight: 600;">👥 Demographics</h3>
                    <div style="font-size: 12px; color: #555;">
                        <div style="margin-bottom: 8px;"><strong>Median Age:</strong> 38</div>
                        <div style="margin-bottom: 8px;"><strong>Education Level:</strong> 65% College+</div>
                        <div style="margin-bottom: 8px;"><strong>Household Size:</strong> 2.4</div>
                        <div><strong>Income Diversity:</strong> <span style="color: #27ae60;">High</span></div>
                    </div>
                </div>

                <!-- Footer -->
                <div style="
                    text-align: center;
                    padding-top: 15px;
                    border-top: 1px solid #e1e5e9;
                    font-size: 11px;
                    color: #7f8c8d;
                ">
                    Propwise • Real Estate Risk Analysis
                </div>
            </div>
        </div>
    `;

    // Inject the sidebar into the page
    document.body.insertAdjacentHTML('beforeend', sidebarHTML);

    // Get references to elements
    const sidebar = document.getElementById('propwise-sidebar');
    const button = document.getElementById('propwise-button');
    const dashboard = document.getElementById('propwise-dashboard');
    const closeBtn = document.getElementById('propwise-close');

    // Toggle sidebar visibility
    function toggleSidebar() {
        const isVisible = dashboard.style.display === 'block';
        dashboard.style.display = isVisible ? 'none' : 'block';
        
        // Add visual feedback
        if (!isVisible) {
            button.style.transform = 'scale(0.9)';
            setTimeout(() => {
                button.style.transform = 'scale(1)';
            }, 150);
        }
    }

    // Close sidebar
    function closeSidebar() {
        dashboard.style.display = 'none';
    }

    // Add event listeners
    button.addEventListener('click', toggleSidebar);
    closeBtn.addEventListener('click', closeSidebar);

    // Close sidebar when clicking outside
    document.addEventListener('click', function(event) {
        if (!sidebar.contains(event.target)) {
            closeSidebar();
        }
    });

    // Prevent clicks inside dashboard from closing it
    dashboard.addEventListener('click', function(event) {
        event.stopPropagation();
    });

    console.log('Propwise sidebar loaded successfully!');
})(); 