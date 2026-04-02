import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { theme } from '../styles/theme';

interface ChartErrorFallbackProps {
  error: Error;
  errorInfo: any;
  message?: string;
}

const ChartErrorFallback: React.FC<ChartErrorFallbackProps> = ({ 
  error, 
  errorInfo, 
  message = 'Chart rendering error' 
}) => {
  return (
    <View style={styles.container}>
      <MaterialIcons name="error" size={48} color={theme.colors.error} />
      <Text style={styles.errorMessage}>{message}</Text>
      <Text style={styles.errorDetails}>{error.message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  errorMessage: {
    color: theme.colors.error,
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 8,
    textAlign: 'center',
  },
  errorDetails: {
    color: theme.colors.text,
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
});

export default ChartErrorFallback;
