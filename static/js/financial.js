// Financial Monitor JavaScript
class FinancialMonitor {
    constructor() {
        this.currentMarket = 'global';
        this.isActive = false;
        this.updateInterval = null;
        this.marketData = this.generateInitialData();
        
        this.init();
    }

    init() {
        this.setupDropdown();
        this.startDataUpdates();
        this.updateDisplay();
    }

    setupDropdown() {
        console.log('Setting up financial dropdown...');
        
        const dropdown = document.getElementById('marketDropdown');
        const selected = document.getElementById('marketDropdownSelected');
        const options = document.getElementById('marketDropdownOptions');

        if (!dropdown || !selected || !options) {
            console.error('Financial dropdown elements not found!');
            return;
        }

        console.log('All dropdown elements found successfully');

        // Handle dropdown toggle
        selected.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Dropdown toggle clicked');
            dropdown.classList.toggle('open');
        });

        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove('open');
            }
        });

        // Handle individual option clicks
        const optionElements = options.querySelectorAll('.dropdown-option');
        console.log('Found', optionElements.length, 'dropdown options');
        
        optionElements.forEach(option => {
            option.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Option clicked:', option.textContent);
                
                const market = option.getAttribute('data-value');
                const text = option.getAttribute('data-text');
                
                console.log('Switching to market:', market);
                
                // Update dropdown text
                selected.querySelector('.dropdown-text').textContent = text;
                
                // Close dropdown
                dropdown.classList.remove('open');
                
                // Change market
                this.currentMarket = market;
                
                // Update display immediately
                this.updateDisplay();
            });
        });
    }

    generateInitialData() {
        return {
            global: {
                sp500: { value: 4750.50, change: 1.2 },
                nasdaq: { value: 14823.12, change: 0.8 },
                dow: { value: 37659.78, change: 0.95 },
                btc: { value: 43250.45, change: -2.3 },
                gold: { value: 2058.30, change: 0.65 },
                oil: { value: 73.25, change: -1.8 },
                eur: { value: 1.0835, change: 0.15 },
                vix: { value: 15.75, change: -5.2 },
                yield: { value: 4.32, change: 0.08 },
                nikkei: { value: 33678.50, change: 1.8 },
                hangseng: { value: 16825.30, change: -0.95 },
                shanghai: { value: 19654.75, change: 2.45 },
                kospi: { value: 2468.25, change: 1.25 },
                jpy: { value: 149.85, change: -0.35 },
                cny: { value: 7.24, change: 0.15 },
                asx200: { value: 75485.20, change: 1.85 }
            },
            us: {
                sp500: { value: 4785.25, change: 1.8 },
                nasdaq: { value: 15124.87, change: 2.1 },
                dow: { value: 38124.50, change: 1.65 },
                btc: { value: 43850.12, change: 1.4 },
                gold: { value: 2065.80, change: 0.85 },
                oil: { value: 74.85, change: 2.2 },
                eur: { value: 1.0842, change: 0.25 },
                vix: { value: 14.25, change: -8.5 },
                yield: { value: 4.58, change: 0.26 },
                nikkei: { value: 33678.50, change: 1.8 },
                hangseng: { value: 16825.30, change: -0.95 },
                shanghai: { value: 19654.75, change: 2.45 },
                kospi: { value: 2468.25, change: 1.25 },
                jpy: { value: 149.85, change: -0.35 },
                cny: { value: 7.24, change: 0.15 },
                asx200: { value: 75485.20, change: 1.85 }
            },
            eu: {
                sp500: { value: 4680.15, change: -0.3 },
                nasdaq: { value: 14456.23, change: -0.8 },
                dow: { value: 37125.80, change: -0.45 },
                btc: { value: 42456.78, change: -1.2 },
                gold: { value: 1945.60, change: -0.35 },
                oil: { value: 68.45, change: -2.1 },
                eur: { value: 1.0925, change: 0.85 },
                vix: { value: 17.80, change: 12.5 },
                yield: { value: 2.45, change: -0.15 },
                nikkei: { value: 33678.50, change: 1.8 },
                hangseng: { value: 16825.30, change: -0.95 },
                shanghai: { value: 19654.75, change: 2.45 },
                kospi: { value: 2468.25, change: 1.25 },
                jpy: { value: 149.85, change: -0.35 },
                cny: { value: 7.24, change: 0.15 },
                asx200: { value: 75485.20, change: 1.85 }
            },
            asia: {
                sp500: { value: 4820.75, change: 2.8 },
                nasdaq: { value: 15354.66, change: 3.2 },
                dow: { value: 38456.25, change: 2.95 },
                btc: { value: 45125.90, change: 4.2 },
                gold: { value: 2125.45, change: 2.8 },
                oil: { value: 78.90, change: 5.1 },
                eur: { value: 1.0758, change: -0.85 },
                vix: { value: 12.45, change: -18.2 },
                yield: { value: 4.85, change: 0.53 },
                nikkei: { value: 35254.80, change: 3.85 },
                hangseng: { value: 17685.25, change: 2.45 },
                shanghai: { value: 20125.50, change: 3.25 },
                kospi: { value: 2598.45, change: 3.25 },
                jpy: { value: 148.25, change: 1.15 },
                cny: { value: 7.18, change: 0.85 },
                asx200: { value: 77245.85, change: 3.65 }
            },
            crypto: {
                sp500: { value: 4750.50, change: 1.2 },
                nasdaq: { value: 14823.12, change: 0.8 },
                dow: { value: 37659.78, change: 0.95 },
                btc: { value: 67890.25, change: 8.5 },
                gold: { value: 2058.30, change: 0.65 },
                oil: { value: 73.25, change: -1.8 },
                eur: { value: 1.0835, change: 0.15 },
                vix: { value: 15.75, change: -5.2 },
                yield: { value: 4.32, change: 0.08 },
                nikkei: { value: 33678.50, change: 1.8 },
                hangseng: { value: 16825.30, change: -0.95 },
                shanghai: { value: 19654.75, change: 2.45 },
                kospi: { value: 2468.25, change: 1.25 },
                jpy: { value: 149.85, change: -0.35 },
                cny: { value: 7.24, change: 0.15 },
                asx200: { value: 75485.20, change: 1.85 }
            },
            commodities: {
                sp500: { value: 4750.50, change: 1.2 },
                nasdaq: { value: 14823.12, change: 0.8 },
                dow: { value: 37659.78, change: 0.95 },
                btc: { value: 43250.45, change: -2.3 },
                gold: { value: 2245.80, change: 4.2 },
                oil: { value: 89.65, change: 6.8 },
                eur: { value: 1.0835, change: 0.15 },
                vix: { value: 15.75, change: -5.2 },
                yield: { value: 4.32, change: 0.08 },
                nikkei: { value: 33678.50, change: 1.8 },
                hangseng: { value: 16825.30, change: -0.95 },
                shanghai: { value: 19654.75, change: 2.45 },
                kospi: { value: 2468.25, change: 1.25 },
                jpy: { value: 149.85, change: -0.35 },
                cny: { value: 7.24, change: 0.15 },
                asx200: { value: 75485.20, change: 1.85 }
            },
            forex: {
                sp500: { value: 4750.50, change: 1.2 },
                nasdaq: { value: 14823.12, change: 0.8 },
                dow: { value: 37659.78, change: 0.95 },
                btc: { value: 43250.45, change: -2.3 },
                gold: { value: 2058.30, change: 0.65 },
                oil: { value: 73.25, change: -1.8 },
                eur: { value: 1.1256, change: 2.8 },
                vix: { value: 15.75, change: -5.2 },
                yield: { value: 4.32, change: 0.08 },
                nikkei: { value: 33678.50, change: 1.8 },
                hangseng: { value: 16825.30, change: -0.95 },
                shanghai: { value: 19654.75, change: 2.45 },
                kospi: { value: 2468.25, change: 1.25 },
                jpy: { value: 148.95, change: 1.85 },
                cny: { value: 7.15, change: 1.25 },
                asx200: { value: 75485.20, change: 1.85 }
            }
        };
    }

    simulateMarketChange() {
        const markets = Object.keys(this.marketData);
        
        markets.forEach(market => {
            const data = this.marketData[market];
            Object.keys(data).forEach(asset => {
                // Base change rate
                let baseChange = (Math.random() - 0.5) * 0.015; // -0.75% to +0.75%
                
                // Market-specific multipliers
                let marketMultiplier = 1;
                switch(market) {
                    case 'us':
                        marketMultiplier = 1.2; // US markets more active
                        break;
                    case 'eu':
                        marketMultiplier = 0.8; // EU markets more conservative
                        break;
                    case 'asia':
                        marketMultiplier = 1.5; // Asian markets more volatile
                        break;
                    case 'crypto':
                        marketMultiplier = 2.0; // Crypto most volatile
                        break;
                    case 'commodities':
                        marketMultiplier = 1.1; // Commodities moderate volatility
                        break;
                    case 'forex':
                        marketMultiplier = 0.6; // Forex least volatile
                        break;
                    default:
                        marketMultiplier = 1.0;
                }
                
                // Asset-specific volatility
                let assetMultiplier = 1;
                switch(asset) {
                    case 'btc':
                        assetMultiplier = 3.5; // Bitcoin most volatile
                        break;
                    case 'vix':
                        assetMultiplier = 2.5; // VIX high volatility
                        break;
                    case 'oil':
                        assetMultiplier = 1.8; // Oil moderate-high volatility
                        break;
                    case 'gold':
                        assetMultiplier = 1.2; // Gold moderate volatility
                        break;
                    case 'eur':
                        assetMultiplier = 0.8; // EUR/USD lower volatility
                        break;
                    case 'yield':
                        assetMultiplier = 0.5; // Bond yields lowest volatility
                        break;
                    default: // Indices
                        assetMultiplier = 1.0;
                }
                
                const totalChange = baseChange * marketMultiplier * assetMultiplier;
                
                // Update change percentage
                data[asset].change += totalChange;
                
                // Update value
                data[asset].value *= (1 + totalChange / 100);
                
                // Keep realistic bounds
                if (asset === 'vix' && data[asset].value < 8) data[asset].value = 8;
                if (asset === 'yield' && data[asset].value < 0.1) data[asset].value = 0.1;
                if (asset === 'btc' && data[asset].value < 10000) data[asset].value = 10000;
                if (asset === 'gold' && data[asset].value < 1500) data[asset].value = 1500;
                if (asset === 'oil' && data[asset].value < 30) data[asset].value = 30;
                if (asset === 'eur' && data[asset].value < 0.8) data[asset].value = 0.8;
                if (asset === 'eur' && data[asset].value > 1.3) data[asset].value = 1.3;
                
                // Prevent extreme changes (daily reset simulation)
                if (Math.abs(data[asset].change) > 15) {
                    data[asset].change *= 0.7; // Dampen extreme moves
                }
            });
        });
    }

    startDataUpdates() {
        if (this.updateInterval) clearInterval(this.updateInterval);
        
        this.updateInterval = setInterval(() => {
            this.simulateMarketChange();
            this.updateDisplay();
        }, 5000); // Update every 5 seconds instead of 3
    }

    updateDisplay() {
        const data = this.marketData['global']; // Always use same data
        
        // Only log on market changes, not every update
        if (this.lastLoggedMarket !== this.currentMarket) {
            console.log('Focusing on market:', this.currentMarket);
            this.lastLoggedMarket = this.currentMarket;
        }
        
        if (!data) {
            console.error('No data found');
            return;
        }

        // Define which assets are relevant for each market
        const marketFocus = {
            global: ['sp500', 'nasdaq', 'dow', 'btc', 'gold', 'oil', 'eur', 'vix', 'yield', 'nikkei', 'hangseng', 'shanghai', 'kospi', 'jpy', 'cny', 'asx200'],
            us: ['sp500', 'nasdaq', 'dow', 'vix', 'yield'],
            eu: ['eur', 'vix', 'yield'],
            asia: ['shanghai', 'asx200', 'nikkei', 'hangseng', 'kospi', 'jpy', 'cny'],
            crypto: ['btc'],
            commodities: ['gold', 'oil'],
            forex: ['eur', 'jpy', 'cny']
        };

        const focusedAssets = marketFocus[this.currentMarket] || marketFocus.global;

        // Update all 16 gauges with focus styling
        this.updateGaugeWithFocus('sp500', data.sp500.value, data.sp500.change, 'index', focusedAssets.includes('sp500'));
        this.updateGaugeWithFocus('nasdaq', data.nasdaq.value, data.nasdaq.change, 'index', focusedAssets.includes('nasdaq'));
        this.updateGaugeWithFocus('dow', data.dow.value, data.dow.change, 'index', focusedAssets.includes('dow'));
        this.updateGaugeWithFocus('btc', data.btc.value, data.btc.change, 'crypto', focusedAssets.includes('btc'));
        this.updateGaugeWithFocus('gold', data.gold.value, data.gold.change, 'commodity', focusedAssets.includes('gold'));
        this.updateGaugeWithFocus('oil', data.oil.value, data.oil.change, 'commodity', focusedAssets.includes('oil'));
        this.updateGaugeWithFocus('eur', data.eur.value, data.eur.change, 'forex', focusedAssets.includes('eur'));
        this.updateGaugeWithFocus('vix', data.vix.value, data.vix.change, 'volatility', focusedAssets.includes('vix'));
        this.updateGaugeWithFocus('yield', data.yield.value, data.yield.change, 'bond', focusedAssets.includes('yield'));
        this.updateGaugeWithFocus('nikkei', data.nikkei.value, data.nikkei.change, 'index', focusedAssets.includes('nikkei'));
        this.updateGaugeWithFocus('hangseng', data.hangseng.value, data.hangseng.change, 'index', focusedAssets.includes('hangseng'));
        this.updateGaugeWithFocus('shanghai', data.shanghai.value, data.shanghai.change, 'index', focusedAssets.includes('shanghai'));
        this.updateGaugeWithFocus('kospi', data.kospi.value, data.kospi.change, 'index', focusedAssets.includes('kospi'));
        this.updateGaugeWithFocus('jpy', data.jpy.value, data.jpy.change, 'forex', focusedAssets.includes('jpy'));
        this.updateGaugeWithFocus('cny', data.cny.value, data.cny.change, 'forex', focusedAssets.includes('cny'));
        this.updateGaugeWithFocus('asx200', data.asx200.value, data.asx200.change, 'index', focusedAssets.includes('asx200'));

        // Update financial bars
        this.updateFinancialBars(data);
    }

    updateGaugeWithFocus(id, value, change, type, isFocused) {
        const gauge = document.getElementById(`${id}Gauge`);
        const valueEl = document.getElementById(`${id}Value`);
        const statusEl = document.getElementById(`${id}Status`);
        const container = gauge?.parentElement;

        if (!gauge || !valueEl || !statusEl || !container) return;

        // Format value based on type
        let formattedValue;
        switch (type) {
            case 'index':
                formattedValue = Math.round(value).toLocaleString();
                break;
            case 'crypto':
                formattedValue = `${Math.round(value).toLocaleString()}`;
                break;
            case 'commodity':
                formattedValue = value.toFixed(2);
                break;
            case 'forex':
                formattedValue = value.toFixed(4);
                break;
            case 'volatility':
                formattedValue = value.toFixed(2);
                break;
            case 'bond':
                formattedValue = `${value.toFixed(2)}%`;
                break;
            default:
                formattedValue = value.toFixed(2);
        }

        valueEl.textContent = formattedValue;

        // Update status with change
        const changeText = change >= 0 ? `+${change.toFixed(2)}%` : `${change.toFixed(2)}%`;
        statusEl.textContent = changeText;

        // Update gauge color based on change
        gauge.className = 'gauge';
        if (change > 0.5) {
            gauge.classList.add('bullish');
        } else if (change < -0.5) {
            gauge.classList.add('bearish');
        } else {
            gauge.classList.add('neutral');
        }

        // Apply focus styling - HIGHLIGHT vs DIM
        if (isFocused) {
            container.style.opacity = '1';
            container.style.filter = 'none';
        } else {
            container.style.opacity = '0.3';
            container.style.filter = 'grayscale(0.7)';
        }
    }

    updateFinancialBars(data) {
        // Fear & Greed Index (simulated)
        const fearValue = 50 + (data.vix.change * -2);
        this.updateBar('fear', Math.max(0, Math.min(100, fearValue)), fearValue.toFixed(0));

        // Volatility
        const volValue = Math.abs(data.vix.value);
        this.updateBar('vol', Math.min(100, volValue * 2), `${volValue.toFixed(1)}%`);

        // Market Sentiment (simulated)
        const avgChange = (data.sp500.change + data.nasdaq.change + data.dow.change) / 3;
        const sentimentValue = 50 + (avgChange * 10);
        this.updateBar('sentiment', Math.max(0, Math.min(100, sentimentValue)), sentimentValue.toFixed(0));

        // Momentum (simulated)
        const momentumValue = 50 + (avgChange * 15);
        this.updateBar('momentum', Math.max(0, Math.min(100, momentumValue)), momentumValue.toFixed(0));
    }

    updateBar(id, percentage, value) {
        const fill = document.getElementById(`${id}Fill`);
        const valueEl = document.getElementById(`${id}Value`);

        if (fill) {
            fill.style.width = `${percentage}%`;
        }
        if (valueEl) {
            valueEl.textContent = value;
        }
    }

    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }
}

// Initialize when DOM is loaded
let financialMonitor;

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, checking for financial elements...');
    
    // Wait a bit to ensure all elements are rendered
    setTimeout(() => {
        const marketDropdown = document.getElementById('marketDropdown');
        console.log('Looking for marketDropdown:', marketDropdown);
        
        if (marketDropdown) {
            console.log('Initializing financial monitor...');
            financialMonitor = new FinancialMonitor();
        } else {
            console.error('Financial monitor elements not found in DOM');
            // List all elements with IDs for debugging
            const allElements = document.querySelectorAll('[id]');
            console.log('Available elements with IDs:', Array.from(allElements).map(el => el.id));
        }
    }, 100);
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (financialMonitor) {
        financialMonitor.destroy();
    }
}); 