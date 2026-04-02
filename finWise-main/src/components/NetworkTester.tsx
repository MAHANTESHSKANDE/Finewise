/**
 * Network Testing Component for debugging API connectivity
 * Add this to any screen to test network connectivity
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { apiService } from '../services/apiService';
import { getCurrentApiUrl } from '../config/environment';

export const NetworkTester: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [lastResult, setLastResult] = useState<string>('');

  const testConnectivity = async () => {
    setTesting(true);
    setLastResult('Testing...');
    
    try {
      console.log('=== NETWORK TEST START ===');
      console.log('Current API URL:', getCurrentApiUrl());
      
      // Test 1: Health check
      console.log('Test 1: Health check');
      const healthResult = await apiService.healthCheck();
      console.log('Health check result:', healthResult);
      
      if (!healthResult.success) {
        setLastResult(`Health check failed: ${healthResult.message}`);
        return;
      }
      
      // Test 2: Try to fetch budgets
      console.log('Test 2: Fetch budgets');
      const budgets = await apiService.budgets.getProgress();
      console.log('Budgets result:', budgets);
      
      setLastResult(`✅ Success! Got ${budgets.length} budgets`);
      
      Alert.alert(
        'Network Test Success', 
        `✅ API connection working!\n\nGot ${budgets.length} budget items.\n\nCheck console for detailed logs.`
      );
      
    } catch (error) {
      console.error('Network test failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setLastResult(`❌ Failed: ${errorMessage}`);
      
      Alert.alert(
        'Network Test Failed', 
        `❌ ${errorMessage}\n\nCheck console for detailed logs.`
      );
    } finally {
      setTesting(false);
      console.log('=== NETWORK TEST END ===');
    }
  };

  const testDifferentURLs = async () => {
    setTesting(true);
    setLastResult('Testing different URLs...');
    
    const testUrls = [
      'http://192.168.0.167:3000/api',  // Your actual IP - should work
      'http://localhost:3000/api',      // Localhost - works in tests
      'http://127.0.0.1:3000/api',     // Alternative localhost
      'http://10.0.2.2:3000/api'       // Android emulator default (often doesn't work)
    ];
    
    for (const url of testUrls) {
      try {
        console.log(`Testing URL: ${url}`);
        
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const response = await fetch(`${url.replace('/api', '')}/health`, {
          method: 'GET',
          headers: {
            'Accept': '*/*',
            'User-Agent': 'PocketBudget-RN/1.0',
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const result = await response.json();
          console.log(`✅ ${url} - Success:`, result);
          setLastResult(`✅ Working URL found: ${url}`);
          
          Alert.alert(
            'Working URL Found!', 
            `✅ ${url} is working!\n\nUpdate your environment.ts to use this URL.`
          );
          setTesting(false);
          return;
        }
      } catch (error) {
        console.log(`❌ ${url} - Failed:`, error);
      }
    }
    
    setLastResult('❌ No working URLs found');
    Alert.alert('URL Test Complete', 'No working URLs found. Check if backend server is running.');
    setTesting(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔧 Network Tester</Text>
      <Text style={styles.subtitle}>Current URL: {getCurrentApiUrl()}</Text>
      
      <TouchableOpacity 
        style={[styles.button, testing && styles.buttonDisabled]} 
        onPress={testConnectivity}
        disabled={testing}
      >
        <Text style={styles.buttonText}>
          {testing ? 'Testing...' : '🚀 Test API Connection'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, styles.buttonSecondary, testing && styles.buttonDisabled]} 
        onPress={testDifferentURLs}
        disabled={testing}
      >
        <Text style={styles.buttonText}>
          🔍 Test Different URLs
        </Text>
      </TouchableOpacity>
      
      {lastResult ? (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Last Test Result:</Text>
          <Text style={styles.resultText}>{lastResult}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  buttonSecondary: {
    backgroundColor: '#6c757d',
  },
  buttonDisabled: {
    backgroundColor: '#adb5bd',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  resultContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#e9ecef',
    borderRadius: 6,
  },
  resultTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  resultText: {
    fontSize: 12,
    color: '#495057',
  },
});
