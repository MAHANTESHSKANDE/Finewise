/**
 * Network Test Component
 * Use this to test API connectivity from your React Native app
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { apiService } from '../services/apiService';
import { ENV_CONFIG } from '../config/environment';

const NetworkTestScreen: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const testHealth = async () => {
    setIsLoading(true);
    addResult('🔍 Testing backend health...');
    
    try {
      const health = await apiService.healthCheck();
      if (health.success) {
        addResult('✅ Backend health check passed!');
      } else {
        addResult(`❌ Backend health check failed: ${health.message}`);
      }
    } catch (error) {
      addResult(`❌ Health check error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    setIsLoading(false);
  };

  const testBudgets = async () => {
    setIsLoading(true);
    addResult('📊 Testing budget API...');
    
    try {
      const budgets = await apiService.budgets.getAll();
      addResult(`✅ Loaded ${budgets.length} budgets`);
    } catch (error) {
      addResult(`❌ Budget API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    setIsLoading(false);
  };

  const testExpenses = async () => {
    setIsLoading(true);
    addResult('💰 Testing expense API...');
    
    try {
      const expenses = await apiService.expenses.getAll();
      addResult(`✅ Loaded ${expenses.length} expenses`);
    } catch (error) {
      addResult(`❌ Expense API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    setIsLoading(false);
  };

  const runAllTests = async () => {
    clearResults();
    addResult(`🚀 Starting network tests with: ${ENV_CONFIG.CURRENT_ENV}`);
    addResult(`📡 API URL: ${apiService['baseUrl']}`);
    
    await testHealth();
    await testBudgets();
    await testExpenses();
    
    addResult('🏁 All tests completed!');
  };

  const showConfigInfo = () => {
    Alert.alert(
      'Current Configuration',
      `Environment: ${ENV_CONFIG.CURRENT_ENV}\n\nTo change the environment, edit:\nsrc/config/environment.ts\n\nAvailable environments:\n- ANDROID_EMULATOR\n- IOS_SIMULATOR\n- PHYSICAL_DEVICE\n- PRODUCTION`,
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Network Test</Text>
      <Text style={styles.subtitle}>Current: {ENV_CONFIG.CURRENT_ENV}</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]} 
          onPress={runAllTests}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Run All Tests</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]} 
          onPress={showConfigInfo}
        >
          <Text style={styles.buttonText}>Config Info</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]} 
          onPress={clearResults}
        >
          <Text style={styles.buttonText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.resultsContainer}>
        {testResults.map((result, index) => (
          <Text key={index} style={styles.resultText}>
            {result}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#6c757d',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 5,
    padding: 10,
  },
  resultText: {
    fontSize: 12,
    marginBottom: 5,
    fontFamily: 'monospace',
  },
});

export default NetworkTestScreen;
