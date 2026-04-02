/**
 * API Request Comparison Test
 * This component tests the exact same requests as our working curl commands
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { apiService } from '../services/apiService';
import { testDirectApiCalls } from '../utils/directApiTest';

const ApiRequestTest: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    console.log(message);
    setTestResults(prev => [...prev, message]);
  };

  const testDirect = async () => {
    addResult('🧪 Testing direct fetch calls (like curl)...');
    try {
      await testDirectApiCalls();
      addResult('✅ Direct tests completed - check console');
    } catch (error) {
      addResult(`❌ Direct test error: ${error}`);
    }
  };

  const testViaApiService = async () => {
    addResult('🔄 Testing via API service...');
    try {
      const budgets = await apiService.budgets.getProgress();
      addResult(`✅ API Service: Got ${budgets.length} budget progress items`);
    } catch (error) {
      addResult(`❌ API Service error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  };

  const testCurlEquivalent = async () => {
    addResult('📋 Testing curl equivalent...');
    try {
      // Exact equivalent of: curl -s http://localhost:3000/api/budgets/progress
      const response = await fetch('http://localhost:3000/api/budgets/progress', {
        method: 'GET',
        headers: {
          'Accept': '*/*',
          'User-Agent': 'PocketBudget-Test/1.0'
        }
      });
      
      addResult(`Response status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        addResult(`✅ Curl equivalent: Got ${data.data?.length || 0} items`);
      } else {
        addResult(`❌ Curl equivalent failed: ${response.statusText}`);
      }
    } catch (error) {
      addResult(`❌ Curl equivalent error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>API Request Test</Text>
      
      <TouchableOpacity style={styles.button} onPress={testCurlEquivalent}>
        <Text style={styles.buttonText}>Test Curl Equivalent</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={testDirect}>
        <Text style={styles.buttonText}>Test Direct Calls</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={testViaApiService}>
        <Text style={styles.buttonText}>Test API Service</Text>
      </TouchableOpacity>
      
      <View style={styles.results}>
        {testResults.map((result, index) => (
          <Text key={index} style={styles.resultText}>{result}</Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
    backgroundColor: '#f9f9f9',
    margin: 10,
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  results: {
    marginTop: 15,
    maxHeight: 200,
  },
  resultText: {
    fontSize: 12,
    marginBottom: 5,
    fontFamily: 'monospace',
  },
});

export default ApiRequestTest;
