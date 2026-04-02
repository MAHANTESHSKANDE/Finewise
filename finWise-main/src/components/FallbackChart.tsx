import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../styles/theme';

interface FallbackChartProps {
  message: string;
  height?: number;
}

const FallbackChart: React.FC<FallbackChartProps> = ({ message, height = 250 }) => {
  return (
    <View style={[styles.container, { height }]}>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  message: {
    color: theme.colors.text,
    fontSize: 16,
    textAlign: 'center',
  },
});

export default FallbackChart;
