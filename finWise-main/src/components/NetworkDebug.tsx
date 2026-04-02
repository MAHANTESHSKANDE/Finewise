/**
 * Simple Network Test - Add this to HomeScreen temporarily for debugging
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

const NetworkDebug: React.FC = () => {
  const [status, setStatus] = useState('Testing...');

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      console.log('🧪 Testing API connection...');
      
      // Test health endpoint
      const healthResponse = await fetch('http://10.0.2.2:3000/health');
      const healthData = await healthResponse.json();
      console.log('✅ Health check:', healthData);
      
      // Test API endpoint
      const apiResponse = await fetch('http://10.0.2.2:3000/api/budgets');
      const apiData = await apiResponse.json();
      console.log('✅ API data:', apiData);
      
      setStatus(`✅ Connected! Found ${apiData.data?.length || 0} budgets`);
    } catch (error) {
      console.error('❌ Connection failed:', error);
      setStatus(`❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Network Debug</Text>
      <Text style={styles.status}>{status}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f0f0f0',
    margin: 10,
    borderRadius: 5,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  status: {
    fontSize: 14,
    color: '#333',
  },
});

export default NetworkDebug;
