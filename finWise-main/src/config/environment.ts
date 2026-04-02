/**
 * Environment Configuration for API endpoints
 * Modify this file based on your testing environment
 */

export const ENV_CONFIG = {
  // Backend API URLs for different environments
  API_URLS: {
    // Use your actual IP address for Android Emulator since 10.0.2.2 doesn't work
    ANDROID_EMULATOR: 'http://192.168.0.167:3000/api',
    
    // Use this for iOS Simulator  
    IOS_SIMULATOR: 'http://localhost:3000/api',
    
    // Use this for physical device on same network
    PHYSICAL_DEVICE: 'http://192.168.0.167:3000/api',
    
    // Backup option - localhost for testing
    LOCALHOST: 'http://localhost:3000/api',
    
    // Use this for production
    PRODUCTION: 'https://your-production-api.com/api'
  },
  
  // Current environment - CHANGE THIS BASED ON YOUR TESTING SETUP
  CURRENT_ENV: 'ANDROID_EMULATOR', // Options: 'ANDROID_EMULATOR', 'IOS_SIMULATOR', 'PHYSICAL_DEVICE', 'PRODUCTION'
  
  // Debug settings
  ENABLE_API_LOGGING: true,
  ENABLE_NETWORK_TIMEOUT: false
};

// Get the current API URL based on environment
export const getCurrentApiUrl = (): string => {
  const url = ENV_CONFIG.API_URLS[ENV_CONFIG.CURRENT_ENV as keyof typeof ENV_CONFIG.API_URLS];
  
  if (ENV_CONFIG.ENABLE_API_LOGGING) {
    console.log(`[ENV] Using API URL for ${ENV_CONFIG.CURRENT_ENV}: ${url}`);
  }
  
  return url;
};
