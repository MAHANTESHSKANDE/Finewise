/**
 * Central theme configuration for PocketBudget app
 */

import { AppTheme } from '../types';

export const theme: AppTheme = {
  colors: {
    primary: '#6366F1',      // Indigo
    secondary: '#8B5CF6',    // Purple
    background: '#F8FAFC',   // Gray-50
    surface: '#FFFFFF',      // White
    text: '#1E293B',         // Gray-800
    error: '#EF4444',        // Red-500
    warning: '#F59E0B',      // Amber-500
    success: '#10B981',      // Emerald-500
    disabled: '#9CA3AF',     // Gray-400
    placeholder: '#6B7280',  // Gray-500
    white: '#FFFFFF',
    border: '#E5E7EB',
    shadow: 'rgba(0,0,0,0.1)',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  typography: {
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 24,
      xxl: 32,
    },
    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 999,
  },
};

// Category colors for charts and UI
export const categoryColors: { [key: string]: string } = {
  food: '#EF4444',           // Red
  transportation: '#F97316', // Orange
  entertainment: '#EAB308',  // Yellow
  shopping: '#22C55E',       // Green
  utilities: '#06B6D4',      // Cyan
  healthcare: '#3B82F6',     // Blue
  education: '#6366F1',      // Indigo
  travel: '#8B5CF6',         // Purple
  groceries: '#EC4899',      // Pink
  housing: '#F59E0B',        // Amber
  insurance: '#84CC16',      // Lime
  miscellaneous: '#6B7280',  // Gray
};

// Common styles used across the app
export const commonStyles = {
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  screenPadding: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginVertical: theme.spacing.sm,
    shadowColor: theme.colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minHeight: 44,
  },
  buttonText: {
    color: theme.colors.surface,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  inputContainer: {
    marginVertical: theme.spacing.sm,
  },
  inputLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
  },
  focusedInput: {
    borderColor: theme.colors.primary,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.typography.fontSize.sm,
    marginTop: theme.spacing.xs,
  },
  successText: {
    color: theme.colors.success,
    fontSize: theme.typography.fontSize.sm,
    marginTop: theme.spacing.xs,
  },
  warningText: {
    color: theme.colors.warning,
    fontSize: theme.typography.fontSize.sm,
    marginTop: theme.spacing.xs,
  },
};

// Animation constants
export const animations = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  easing: {
    easeInOut: 'ease-in-out',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
  },
};

// Chart configuration
export const chartConfig = {
  backgroundColor: theme.colors.surface,
  backgroundGradientFrom: theme.colors.surface,
  backgroundGradientTo: theme.colors.surface,
  color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
  strokeWidth: 2,
  barPercentage: 0.7,
  useShadowColorFromDataset: false,
  decimalPlaces: 0,
  propsForLabels: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  propsForVerticalLabels: {
    fontSize: theme.typography.fontSize.xs,
  },
  propsForHorizontalLabels: {
    fontSize: theme.typography.fontSize.xs,
  },
};
