class AirQualityMonitor {
    constructor() {
        this.currentLocation = { lat: 12.9716, lon: 77.5946, name: 'Bangalore' };
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupCustomDropdown();
        this.loadAirQualityData();
        this.startAutoRefresh();
    }

    setupCustomDropdown() {
        const dropdown = document.getElementById('customDropdown');
        const selected = document.getElementById('dropdownSelected');
        const options = document.getElementById('dropdownOptions');
        
        selected.addEventListener('click', () => {
            dropdown.classList.toggle('open');
        });
        
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove('open');
            }
        });
        
        options.addEventListener('click', (e) => {
            if (e.target.classList.contains('dropdown-option')) {
                const value = e.target.dataset.value;
                const text = e.target.dataset.text;
                
                document.querySelector('.dropdown-text').textContent = text;
                dropdown.classList.remove('open');
                
                if (value === 'current') {
                    this.getCurrentLocation();
                } else {
                    const [lat, lon] = value.split(',');
                    this.currentLocation = { 
                        lat: parseFloat(lat), 
                        lon: parseFloat(lon), 
                        name: text 
                    };
                    this.loadAirQualityData();
                }
            }
        });
    }

    setupEventListeners() {
        // Keep for backward compatibility if needed
    }

    getCurrentLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.currentLocation = {
                        lat: position.coords.latitude,
                        lon: position.coords.longitude,
                        name: 'Current Location'
                    };
                    this.loadAirQualityData();
                },
                (error) => {
                    console.error('Error getting location:', error);
                    alert('Unable to get your location. Using default location.');
                    // Reset to default
                    document.querySelector('.dropdown-text').textContent = 'Bangalore';
                    this.currentLocation = { lat: 12.9716, lon: 77.5946, name: 'Bangalore' };
                }
            );
        } else {
            alert('Geolocation is not supported by this browser.');
            document.querySelector('.dropdown-text').textContent = 'Bangalore';
            this.currentLocation = { lat: 12.9716, lon: 77.5946, name: 'Bangalore' };
        }
    }

    async loadAirQualityData() {
        this.setLoadingState();
        
        try {
            // For now, use mock data since the API endpoint is having issues
            // This will be replaced with actual API call once working
            const mockData = this.generateMockData();
            
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            this.updateDisplay(mockData);
            
        } catch (error) {
            console.error('Error fetching air quality data:', error);
            this.setErrorState();
        }
    }

    generateMockData() {
        // Generate realistic mock data based on city
        const basePollution = this.getBasePollutionForLocation();
        const baseEnvironment = this.getBaseEnvironmentForLocation();
        
        return {
            current: {
                european_aqi: basePollution.aqi + Math.floor(Math.random() * 10 - 5),
                pm2_5: basePollution.pm25 + Math.floor(Math.random() * 10 - 5),
                pm10: basePollution.pm10 + Math.floor(Math.random() * 20 - 10),
                ozone: basePollution.ozone + Math.floor(Math.random() * 20 - 10),
                nitrogen_dioxide: basePollution.no2 + Math.floor(Math.random() * 15 - 7),
                carbon_monoxide: basePollution.co + Math.floor(Math.random() * 1000 - 500),
                sulphur_dioxide: basePollution.so2 + Math.floor(Math.random() * 10 - 5),
                ammonia: basePollution.nh3 + Math.floor(Math.random() * 8 - 4),
                air_pressure: baseEnvironment.pressure + Math.floor(Math.random() * 20 - 10),
                temperature: baseEnvironment.temp + Math.floor(Math.random() * 6 - 3),
                humidity: baseEnvironment.humidity + Math.floor(Math.random() * 20 - 10),
                visibility: baseEnvironment.visibility + Math.floor(Math.random() * 4 - 2),
                uv_index: baseEnvironment.uv + Math.floor(Math.random() * 2)
            }
        };
    }

    getBaseEnvironmentForLocation() {
        const { name } = this.currentLocation;
        
        // Different base environmental conditions for different cities
        if (name.includes('Dubai') || name.includes('Riyadh')) {
            return { temp: 32, humidity: 45, visibility: 12, uv: 8, pressure: 1015 };
        } else if (name.includes('Mumbai') || name.includes('Singapore')) {
            return { temp: 28, humidity: 75, visibility: 8, uv: 7, pressure: 1008 };
        } else if (name.includes('London') || name.includes('Berlin')) {
            return { temp: 15, humidity: 70, visibility: 15, uv: 3, pressure: 1020 };
        } else if (name.includes('Oslo') || name.includes('Stockholm')) {
            return { temp: 8, humidity: 65, visibility: 18, uv: 2, pressure: 1025 };
        } else if (name.includes('New York') || name.includes('Toronto')) {
            return { temp: 18, humidity: 60, visibility: 14, uv: 5, pressure: 1018 };
        } else {
            // Default for Bangalore and other cities
            return { temp: 24, humidity: 68, visibility: 10, uv: 6, pressure: 1012 };
        }
    }

    getBasePollutionForLocation() {
        const { lat, lon, name } = this.currentLocation;
        
        // Different base pollution levels for different cities
        if (name.includes('Beijing') || name.includes('New Delhi')) {
            return { aqi: 85, pm25: 45, pm10: 80, ozone: 120, no2: 65, co: 8500, so2: 25, nh3: 18 };
        } else if (name.includes('Mumbai') || name.includes('Mexico City')) {
            return { aqi: 65, pm25: 35, pm10: 60, ozone: 100, no2: 50, co: 6500, so2: 18, nh3: 12 };
        } else if (name.includes('Los Angeles') || name.includes('Bangkok')) {
            return { aqi: 55, pm25: 25, pm10: 45, ozone: 85, no2: 40, co: 5500, so2: 12, nh3: 8 };
        } else if (name.includes('London') || name.includes('Berlin')) {
            return { aqi: 35, pm25: 15, pm10: 30, ozone: 60, no2: 35, co: 4000, so2: 8, nh3: 5 };
        } else if (name.includes('Oslo') || name.includes('Stockholm')) {
            return { aqi: 25, pm25: 8, pm10: 20, ozone: 45, no2: 25, co: 3000, so2: 5, nh3: 3 };
        } else {
            // Default for Bangalore and other cities
            return { aqi: 45, pm25: 28, pm10: 55, ozone: 75, no2: 45, co: 5800, so2: 15, nh3: 10 };
        }
    }

    setLoadingState() {
        const gauges = document.querySelectorAll('.gauge');
        const values = document.querySelectorAll('.gauge-value');
        
        gauges.forEach(gauge => {
            gauge.className = 'gauge loading';
        });
        
        values.forEach(value => {
            value.textContent = '...';
        });
        
        document.getElementById('aqiStatus').textContent = 'Loading...';
    }

    setErrorState() {
        const values = document.querySelectorAll('.gauge-value');
        values.forEach(value => {
            value.textContent = '--';
        });
        document.getElementById('aqiStatus').textContent = 'Error';
    }

    updateDisplay(data) {
        const current = data.current;
        
        // Update AQI
        const aqi = Math.max(0, Math.round(current.european_aqi || 0));
        this.updateGauge('aqi', aqi, this.getAQIStatus(aqi), this.getAQIClass(aqi));
        
        // Update PM2.5
        const pm25 = Math.max(0, Math.round(current.pm2_5 || 0));
        this.updateGauge('pm25', pm25, '', this.getPMClass(pm25, 'pm25'));
        
        // Update PM10
        const pm10 = Math.max(0, Math.round(current.pm10 || 0));
        this.updateGauge('pm10', pm10, '', this.getPMClass(pm10, 'pm10'));
        
        // Update Ozone
        const ozone = Math.max(0, Math.round(current.ozone || 0));
        this.updateGauge('ozone', ozone, '', this.getGasClass(ozone, 'ozone'));
        
        // Update NO2
        const no2 = Math.max(0, Math.round(current.nitrogen_dioxide || 0));
        this.updateGauge('no2', no2, '', this.getGasClass(no2, 'no2'));
        
        // Update CO
        const co = Math.max(0, Math.round(current.carbon_monoxide || 0));
        this.updateGauge('co', co, '', this.getGasClass(co, 'co'));
        
        // Update SO2
        const so2 = Math.max(0, Math.round(current.sulphur_dioxide || 0));
        this.updateGauge('so2', so2, '', this.getGasClass(so2, 'so2'));
        
        // Update NH3
        const nh3 = Math.max(0, Math.round(current.ammonia || 0));
        this.updateGauge('nh3', nh3, '', this.getGasClass(nh3, 'nh3'));
        
        // Update Air Pressure
        const pressure = Math.max(900, Math.round(current.air_pressure || 1013));
        this.updateGauge('pressure', pressure, '', this.getPressureClass(pressure));
        
        // Update Environmental Conditions
        this.updateLinearMeter('temp', current.temperature, '°C', 0, 45);
        this.updateLinearMeter('humidity', current.humidity, '%', 0, 100);
        this.updateLinearMeter('visibility', current.visibility, 'km', 0, 20);
        this.updateLinearMeter('uv', current.uv_index, '', 0, 11);
        
        // Update AQI status
        document.getElementById('aqiStatus').textContent = this.getAQIStatus(aqi);
    }

    updateGauge(type, value, status, className) {
        const gauge = document.getElementById(`${type}Gauge`);
        const valueElement = document.getElementById(`${type}Value`);
        
        gauge.className = `gauge ${className}`;
        valueElement.textContent = value;
        
        if (status && type === 'aqi') {
            document.getElementById('aqiStatus').textContent = status;
        }
    }

    getAQIStatus(aqi) {
        if (aqi >= 0 && aqi <= 20) return 'Good';
        if (aqi <= 40) return 'Fair';
        if (aqi <= 60) return 'Moderate';
        if (aqi <= 80) return 'Poor';
        return 'Very Poor';
    }

    getAQIClass(aqi) {
        if (aqi >= 0 && aqi <= 20) return 'good';
        if (aqi <= 40) return 'fair';
        if (aqi <= 60) return 'moderate';
        if (aqi <= 80) return 'poor';
        return 'very-poor';
    }

    getPMClass(value, type) {
        // PM2.5 thresholds: 0-10 good, 10-20 fair, 20-25 moderate, 25-50 poor, 50+ very poor
        // PM10 thresholds: 0-20 good, 20-40 fair, 40-50 moderate, 50-100 poor, 100+ very poor
        if (type === 'pm25') {
            if (value <= 10) return 'good';
            if (value <= 20) return 'fair';
            if (value <= 25) return 'moderate';
            if (value <= 50) return 'poor';
            return 'very-poor';
        } else if (type === 'pm10') {
            if (value <= 20) return 'good';
            if (value <= 40) return 'fair';
            if (value <= 50) return 'moderate';
            if (value <= 100) return 'poor';
            return 'very-poor';
        }
        return 'good';
    }

    getPressureClass(value) {
        // Atmospheric pressure classification (hPa)
        if (value >= 1020) return 'good';      // High pressure - clear weather
        if (value >= 1013) return 'fair';     // Normal pressure
        if (value >= 1005) return 'moderate'; // Slightly low
        if (value >= 995) return 'poor';      // Low pressure - stormy
        return 'very-poor';                   // Very low pressure
    }

    getGasClass(value, type) {
        // Simplified thresholds for visual representation
        if (type === 'ozone') {
            if (value <= 50) return 'good';
            if (value <= 100) return 'fair';
            if (value <= 130) return 'moderate';
            if (value <= 240) return 'poor';
            return 'very-poor';
        } else if (type === 'no2') {
            if (value <= 40) return 'good';
            if (value <= 90) return 'fair';
            if (value <= 120) return 'moderate';
            if (value <= 230) return 'poor';
            return 'very-poor';
        } else if (type === 'co') {
            if (value <= 4400) return 'good';
            if (value <= 9400) return 'fair';
            if (value <= 12400) return 'moderate';
            if (value <= 15400) return 'poor';
            return 'very-poor';
        } else if (type === 'so2') {
            if (value <= 20) return 'good';
            if (value <= 80) return 'fair';
            if (value <= 250) return 'moderate';
            if (value <= 350) return 'poor';
            return 'very-poor';
        } else if (type === 'nh3') {
            if (value <= 10) return 'good';
            if (value <= 20) return 'fair';
            if (value <= 30) return 'moderate';
            if (value <= 50) return 'poor';
            return 'very-poor';
        }
        return 'good';
    }

    updateLinearMeter(type, value, unit, min, max) {
        const valueElement = document.getElementById(`${type}Value`);
        const fillElement = document.getElementById(`${type}Fill`);
        
        if (valueElement && fillElement) {
            valueElement.textContent = `${Math.round(value)}${unit}`;
            const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
            fillElement.style.width = `${percentage}%`;
        }
    }

    startAutoRefresh() {
        // Refresh every 10 minutes
        setInterval(() => {
            this.loadAirQualityData();
        }, 10 * 60 * 1000);
    }
}

// Initialize the air quality monitor when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new AirQualityMonitor();
}); 