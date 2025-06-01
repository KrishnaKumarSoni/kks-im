// Real-time Air Quality Monitor using FREE PUBLIC APIs (No API Keys Required)

class AirQualityMonitor {
    constructor() {
        this.currentLocation = null;
        this.updateInterval = null;
        this.isUpdating = false;
        
        // 50 cities with coordinates for real API calls
        this.locations = {
            current: { name: 'Current Location', coords: null },
            // Global Cities (10)
            london: { name: 'London, UK', coords: { lat: 51.5074, lon: -0.1278 } },
            newyork: { name: 'New York, USA', coords: { lat: 40.7128, lon: -74.0060 } },
            beijing: { name: 'Beijing, China', coords: { lat: 39.9042, lon: 116.4074 } },
            tokyo: { name: 'Tokyo, Japan', coords: { lat: 35.6762, lon: 139.6503 } },
            sydney: { name: 'Sydney, Australia', coords: { lat: -33.8688, lon: 151.2093 } },
            paris: { name: 'Paris, France', coords: { lat: 48.8566, lon: 2.3522 } },
            singapore: { name: 'Singapore', coords: { lat: 1.3521, lon: 103.8198 } },
            dubai: { name: 'Dubai, UAE', coords: { lat: 25.2048, lon: 55.2708 } },
            losangeles: { name: 'Los Angeles, USA', coords: { lat: 34.0522, lon: -118.2437 } },
            toronto: { name: 'Toronto, Canada', coords: { lat: 43.6532, lon: -79.3832 } },
            // Indian Cities (40)
            delhi: { name: 'Delhi, India', coords: { lat: 28.6139, lon: 77.2090 } },
            mumbai: { name: 'Mumbai, India', coords: { lat: 19.0760, lon: 72.8777 } },
            bangalore: { name: 'Bangalore, India', coords: { lat: 12.9716, lon: 77.5946 } },
            kolkata: { name: 'Kolkata, India', coords: { lat: 22.5726, lon: 88.3639 } },
            chennai: { name: 'Chennai, India', coords: { lat: 13.0827, lon: 80.2707 } },
            hyderabad: { name: 'Hyderabad, India', coords: { lat: 17.3850, lon: 78.4867 } },
            pune: { name: 'Pune, India', coords: { lat: 18.5204, lon: 73.8567 } },
            ahmedabad: { name: 'Ahmedabad, India', coords: { lat: 23.0225, lon: 72.5714 } },
            jaipur: { name: 'Jaipur, India', coords: { lat: 26.9124, lon: 75.7873 } },
            surat: { name: 'Surat, India', coords: { lat: 21.1702, lon: 72.8311 } },
            lucknow: { name: 'Lucknow, India', coords: { lat: 26.8467, lon: 80.9462 } },
            kanpur: { name: 'Kanpur, India', coords: { lat: 26.4499, lon: 80.3319 } },
            nagpur: { name: 'Nagpur, India', coords: { lat: 21.1458, lon: 79.0882 } },
            indore: { name: 'Indore, India', coords: { lat: 22.7196, lon: 75.8577 } },
            thane: { name: 'Thane, India', coords: { lat: 19.2183, lon: 72.9781 } },
            bhopal: { name: 'Bhopal, India', coords: { lat: 23.2599, lon: 77.4126 } },
            visakhapatnam: { name: 'Visakhapatnam, India', coords: { lat: 17.6868, lon: 83.2185 } },
            pimpri: { name: 'Pimpri-Chinchwad, India', coords: { lat: 18.6298, lon: 73.7997 } },
            patna: { name: 'Patna, India', coords: { lat: 25.5941, lon: 85.1376 } },
            vadodara: { name: 'Vadodara, India', coords: { lat: 22.3072, lon: 73.1812 } },
            ghaziabad: { name: 'Ghaziabad, India', coords: { lat: 28.6692, lon: 77.4538 } },
            ludhiana: { name: 'Ludhiana, India', coords: { lat: 30.9010, lon: 75.8573 } },
            agra: { name: 'Agra, India', coords: { lat: 27.1767, lon: 78.0081 } },
            nashik: { name: 'Nashik, India', coords: { lat: 19.9975, lon: 73.7898 } },
            faridabad: { name: 'Faridabad, India', coords: { lat: 28.4089, lon: 77.3178 } },
            meerut: { name: 'Meerut, India', coords: { lat: 28.9845, lon: 77.7064 } },
            rajkot: { name: 'Rajkot, India', coords: { lat: 22.3039, lon: 70.8022 } },
            kalyan: { name: 'Kalyan-Dombivali, India', coords: { lat: 19.2403, lon: 73.1305 } },
            vasai: { name: 'Vasai-Virar, India', coords: { lat: 19.4911, lon: 72.8054 } },
            varanasi: { name: 'Varanasi, India', coords: { lat: 25.3176, lon: 82.9739 } },
            srinagar: { name: 'Srinagar, India', coords: { lat: 34.0837, lon: 74.7973 } },
            aurangabad: { name: 'Aurangabad, India', coords: { lat: 19.8762, lon: 75.3433 } },
            dhanbad: { name: 'Dhanbad, India', coords: { lat: 23.7957, lon: 86.4304 } },
            amritsar: { name: 'Amritsar, India', coords: { lat: 31.6340, lon: 74.8723 } },
            'navi-mumbai': { name: 'Navi Mumbai, India', coords: { lat: 19.0330, lon: 73.0297 } },
            allahabad: { name: 'Allahabad, India', coords: { lat: 25.4358, lon: 81.8463 } },
            ranchi: { name: 'Ranchi, India', coords: { lat: 23.3441, lon: 85.3096 } },
            howrah: { name: 'Howrah, India', coords: { lat: 22.5958, lon: 88.2636 } },
            coimbatore: { name: 'Coimbatore, India', coords: { lat: 11.0168, lon: 76.9558 } },
            jabalpur: { name: 'Jabalpur, India', coords: { lat: 23.1815, lon: 79.9864 } },
            gwalior: { name: 'Gwalior, India', coords: { lat: 26.2183, lon: 78.1828 } }
        };
        
        this.healthRecommendations = {
            good: "Air quality is satisfactory. Perfect for outdoor activities.",
            moderate: "Air quality is acceptable. Sensitive individuals should limit outdoor exposure.",
            unhealthy_sensitive: "Sensitive individuals may experience symptoms. Limit outdoor activities.",
            unhealthy: "Everyone may experience symptoms. Avoid outdoor activities.",
            very_unhealthy: "Health warnings. Avoid all outdoor activities.",
            hazardous: "Emergency conditions. Stay indoors with air filtration."
        };
        
        this.init();
    }

    init() {
        console.log('Initializing Air Quality Monitor with REAL APIs...');
        this.setupDropdown();
        this.setupRefreshButton();
        this.selectLocation('delhi'); // Start with Delhi
        this.startAutoUpdate();
    }

    setupDropdown() {
        console.log('Setting up dropdown...');
        const trigger = document.getElementById('locationTrigger');
        const menu = document.getElementById('locationMenu');
        const items = menu.querySelectorAll('.dropdown-item');

        console.log('Found', items.length, 'dropdown items');

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('Dropdown trigger clicked');
            trigger.classList.toggle('active');
            menu.classList.toggle('active');
        });

        document.addEventListener('click', () => {
            trigger.classList.remove('active');
            menu.classList.remove('active');
        });

        items.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const location = item.dataset.location;
                console.log('Dropdown item clicked:', location);
                this.selectLocation(location);
                trigger.classList.remove('active');
                menu.classList.remove('active');
                
                // Update selected state
                items.forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');
            });
        });
    }

    setupRefreshButton() {
        const updateStatus = document.getElementById('updateStatus');
        updateStatus.addEventListener('click', () => {
            console.log('Refresh button clicked');
            if (!this.isUpdating && this.currentLocation) {
                this.fetchAirQualityData();
            }
        });
    }

    async selectLocation(locationKey) {
        console.log('Selecting location:', locationKey);
        const location = this.locations[locationKey];
        if (!location) {
            console.warn('Location not found:', locationKey);
            return;
        }
        
        document.getElementById('locationText').textContent = location.name;
        
        if (locationKey === 'current') {
            await this.getCurrentLocation();
        } else {
            console.log('Setting current location to:', location);
            this.currentLocation = location;
            // Immediately fetch data when location changes
            this.fetchAirQualityData();
        }
    }

    async getCurrentLocation() {
        if (!navigator.geolocation) {
            console.warn('Geolocation not supported, using Delhi as fallback');
            this.selectLocation('delhi');
            return;
        }

        try {
            this.updateStatus('Getting your location...', 'loading');
            
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    timeout: 10000,
                    enableHighAccuracy: true
                });
            });

            // Use actual coordinates
            this.currentLocation = {
                name: 'Current Location',
                coords: {
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                }
            };
            console.log('Got geolocation:', this.currentLocation.coords);
            this.fetchAirQualityData();
            
        } catch (error) {
            console.warn('Error getting location:', error);
            this.selectLocation('delhi');
        }
    }

    async fetchAirQualityData() {
        if (!this.currentLocation || this.isUpdating) {
            console.log('Cannot fetch data:', { currentLocation: this.currentLocation, isUpdating: this.isUpdating });
            return;
        }

        this.isUpdating = true;
        console.log('Fetching REAL air quality data for:', this.currentLocation.name);
        this.updateStatus('Fetching real-time data...', 'loading');

        try {
            const { lat, lon } = this.currentLocation.coords;
            
            // Use our Flask proxy to get real API data (bypasses CORS)
            console.log('Calling Flask proxy for real API data...');
            const response = await fetch(`/api/air-quality?lat=${lat}&lon=${lon}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Real API data received:', result);
                
                const { aqi, pollutants } = result.data;
                this.displayAQIData(aqi, pollutants);
                this.updateStatus(`Live ${result.source} data • ${new Date().toLocaleTimeString()}`, 'connected');
                return;
            } else {
                throw new Error(`API proxy failed: ${response.status}`);
            }
            
        } catch (error) {
            console.error('Real API fetch failed:', error);
            // Fall back to location-based realistic data
            console.warn('Using location-based realistic data as fallback');
            this.generateRealisticData();
            this.updateStatus('Real APIs unavailable, showing estimates', 'error');
        } finally {
            this.isUpdating = false;
        }
    }

    displayAQIData(aqi, pollutants) {
        console.log('Displaying AQI data:', aqi, pollutants);
        
        // Update main AQI display
        document.getElementById('aqiValue').textContent = aqi;
        
        const aqiStatus = this.getAQIStatus(aqi);
        const aqiElement = document.getElementById('aqiValue');
        aqiElement.style.color = this.getAQIColor(aqi);
        document.getElementById('aqiStatus').textContent = aqiStatus.status;
        document.getElementById('healthText').textContent = aqiStatus.health;
        
        if (aqi > 200) {
            aqiElement.classList.add('aqi-critical');
        } else {
            aqiElement.classList.remove('aqi-critical');
        }

        this.updatePollutants(pollutants);
    }

    generateRealisticData() {
        console.log('Generating realistic data for:', this.currentLocation.name);
        
        // Realistic AQI values based on location
        const locationMultipliers = {
            // Global cities
            london: { base: 45, variance: 15 },
            newyork: { base: 55, variance: 20 },
            beijing: { base: 85, variance: 30 },
            tokyo: { base: 40, variance: 12 },
            sydney: { base: 25, variance: 10 },
            paris: { base: 50, variance: 18 },
            singapore: { base: 35, variance: 15 },
            dubai: { base: 60, variance: 25 },
            losangeles: { base: 65, variance: 22 },
            toronto: { base: 30, variance: 12 },
            // Indian cities
            delhi: { base: 120, variance: 40 },
            mumbai: { base: 95, variance: 30 },
            bangalore: { base: 80, variance: 25 },
            kolkata: { base: 110, variance: 35 },
            chennai: { base: 75, variance: 20 },
            hyderabad: { base: 85, variance: 25 },
            pune: { base: 90, variance: 25 },
            ahmedabad: { base: 105, variance: 30 },
            jaipur: { base: 115, variance: 35 },
            surat: { base: 100, variance: 30 },
            lucknow: { base: 125, variance: 35 },
            kanpur: { base: 135, variance: 40 },
            nagpur: { base: 95, variance: 25 },
            indore: { base: 85, variance: 25 },
            thane: { base: 95, variance: 30 },
            bhopal: { base: 90, variance: 25 },
            visakhapatnam: { base: 80, variance: 20 },
            pimpri: { base: 90, variance: 25 },
            patna: { base: 140, variance: 45 },
            vadodara: { base: 95, variance: 25 },
            ghaziabad: { base: 130, variance: 40 },
            ludhiana: { base: 110, variance: 30 },
            agra: { base: 120, variance: 35 },
            nashik: { base: 85, variance: 20 },
            faridabad: { base: 125, variance: 35 },
            meerut: { base: 115, variance: 30 },
            rajkot: { base: 90, variance: 25 },
            kalyan: { base: 95, variance: 30 },
            vasai: { base: 90, variance: 25 },
            varanasi: { base: 105, variance: 30 },
            srinagar: { base: 55, variance: 15 },
            aurangabad: { base: 85, variance: 20 },
            dhanbad: { base: 120, variance: 35 },
            amritsar: { base: 100, variance: 25 },
            'navi-mumbai': { base: 90, variance: 25 },
            allahabad: { base: 110, variance: 30 },
            ranchi: { base: 95, variance: 25 },
            howrah: { base: 115, variance: 35 },
            coimbatore: { base: 70, variance: 20 },
            jabalpur: { base: 90, variance: 25 },
            gwalior: { base: 105, variance: 30 }
        };

        const locationKey = Object.keys(this.locations).find(key => 
            this.locations[key] === this.currentLocation
        ) || 'delhi';
        
        const multiplier = locationMultipliers[locationKey] || locationMultipliers.delhi;
        const baseAqi = multiplier.base + (Math.random() - 0.5) * multiplier.variance;
        
        const aqi = Math.max(10, Math.round(baseAqi));
        
        console.log('Generated AQI:', aqi, 'for location:', locationKey);
        
        // Realistic pollutant ratios with some randomness for real-time feel
        const pollutants = {
            pm25: Math.round(aqi * (0.4 + Math.random() * 0.2) + Math.random() * 10),
            pm10: Math.round(aqi * (0.6 + Math.random() * 0.3) + Math.random() * 15),
            no2: Math.round(aqi * (0.5 + Math.random() * 0.3) + Math.random() * 20),
            o3: Math.round(aqi * (0.7 + Math.random() * 0.3) + Math.random() * 25),
            so2: Math.round(aqi * (0.2 + Math.random() * 0.2) + Math.random() * 5),
            co: Math.round((aqi * (0.1 + Math.random() * 0.1) + Math.random() * 3) * 10) / 10
        };

        console.log('Generated pollutants:', pollutants);

        this.displayAQIData(aqi, pollutants);
    }

    updatePollutants(pollutants) {
        console.log('Updating pollutant displays:', pollutants);
        
        // Update gauge values
        document.getElementById('pm25Value').textContent = pollutants.pm25;
        document.getElementById('pm10Value').textContent = pollutants.pm10;
        document.getElementById('no2Value').textContent = pollutants.no2;
        document.getElementById('o3Value').textContent = pollutants.o3;
        document.getElementById('so2Value').textContent = pollutants.so2;
        document.getElementById('coValue').textContent = pollutants.co.toFixed(1);

        // Update gauges with animations
        this.updateGauge('pm25', pollutants.pm25, 75);
        this.updateGauge('pm10', pollutants.pm10, 150);
        this.updateGauge('no2', pollutants.no2, 200);
        this.updateGauge('o3', pollutants.o3, 240);
        this.updateGauge('so2', pollutants.so2, 100);
        this.updateGauge('co', pollutants.co, 10);
    }

    updateGauge(pollutantType, value, maxValue) {
        const gauge = document.getElementById(`${pollutantType}Gauge`);
        if (!gauge) {
            console.warn('Gauge not found:', pollutantType);
            return;
        }
        
        const percentage = Math.min(value / maxValue, 1);
        const circumference = 201; // 2 * π * 32 (radius for 64px container)
        const offset = circumference * (1 - percentage);
        
        console.log(`Updating ${pollutantType} gauge: ${value}/${maxValue} = ${(percentage*100).toFixed(1)}%`);
        
        // Smooth animation
        gauge.style.strokeDashoffset = offset;
        
        // Update color based on percentage (ISO 11064 compliant)
        const color = this.getPollutantColor(percentage);
        gauge.style.stroke = color;
    }

    getPollutantColor(percentage) {
        if (percentage < 0.25) return 'var(--aqi-good)';
        if (percentage < 0.5) return 'var(--aqi-moderate)';
        if (percentage < 0.75) return 'var(--aqi-unhealthy-sensitive)';
        if (percentage < 0.9) return 'var(--aqi-unhealthy)';
        return 'var(--aqi-very-unhealthy)';
    }

    getAQIColor(aqi) {
        if (aqi <= 50) return 'var(--aqi-good)';
        if (aqi <= 100) return 'var(--aqi-moderate)';
        if (aqi <= 150) return 'var(--aqi-unhealthy-sensitive)';
        if (aqi <= 200) return 'var(--aqi-unhealthy)';
        if (aqi <= 300) return 'var(--aqi-very-unhealthy)';
        return 'var(--aqi-hazardous)';
    }

    getAQIStatus(aqi) {
        if (aqi <= 50) return {
            status: 'Good',
            health: this.healthRecommendations.good
        };
        if (aqi <= 100) return {
            status: 'Moderate',
            health: this.healthRecommendations.moderate
        };
        if (aqi <= 150) return {
            status: 'Unhealthy for Sensitive',
            health: this.healthRecommendations.unhealthy_sensitive
        };
        if (aqi <= 200) return {
            status: 'Unhealthy',
            health: this.healthRecommendations.unhealthy
        };
        if (aqi <= 300) return {
            status: 'Very Unhealthy',
            health: this.healthRecommendations.very_unhealthy
        };
        return {
            status: 'Hazardous',
            health: this.healthRecommendations.hazardous
        };
    }

    updateStatus(message, type = 'loading') {
        console.log('Updating status:', message, type);
        const statusElement = document.getElementById('lastUpdate');
        const updateElement = document.getElementById('updateStatus');
        
        statusElement.textContent = message;
        
        // Remove all status classes
        updateElement.classList.remove('connected', 'error', 'loading');
        
        // Add appropriate class
        if (type === 'connected') {
            updateElement.classList.add('connected');
        } else if (type === 'error') {
            updateElement.classList.add('error');
        }
    }

    startAutoUpdate() {
        console.log('Starting auto-update interval for REAL APIs');
        // Update every 5 minutes for real APIs
        this.updateInterval = setInterval(() => {
            if (this.currentLocation && !this.isUpdating) {
                console.log('Auto-updating air quality data');
                this.fetchAirQualityData();
            }
        }, 300000);

        // Initial delay before first fetch
        setTimeout(() => {
            if (this.currentLocation) {
                console.log('Initial air quality data fetch');
                this.fetchAirQualityData();
            }
        }, 1000);
    }

    stopAutoUpdate() {
        console.log('Stopping auto-update interval');
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
}

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing air quality monitor with REAL APIs');
    
    // Set initial selected state to Delhi
    const delhiItem = document.querySelector('[data-location="delhi"]');
    if (delhiItem) {
        delhiItem.classList.add('selected');
        console.log('Set Delhi as initially selected');
    }
    
    // Start the air quality monitor
    window.airQualityMonitor = new AirQualityMonitor();
    
    // Add staggered animations for gauges
    setTimeout(() => {
        const gauges = document.querySelectorAll('.pollutant-gauge');
        gauges.forEach((gauge, index) => {
            gauge.style.animation = `fadeInUp 0.6s ease-out ${0.8 + (index * 0.05)}s both`;
        });
        console.log('Applied staggered animations to', gauges.length, 'gauges');
    }, 100);
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    console.log('Page unloading, cleaning up');
    if (window.airQualityMonitor) {
        window.airQualityMonitor.stopAutoUpdate();
    }
}); 