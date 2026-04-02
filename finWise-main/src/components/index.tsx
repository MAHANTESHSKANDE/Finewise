/**
 * Common UI Components - Reusable components used throughout the app
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Modal,
  FlatList,
  Pressable,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { theme, commonStyles } from '../styles/theme';

// Button Component
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  icon?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  icon,
}) => {
  const getButtonStyle = (): ViewStyle[] => {
    const baseStyle: ViewStyle[] = [styles.button as ViewStyle];

    // Size styles
    switch (size) {
      case 'small':
        baseStyle.push(styles.buttonSmall as ViewStyle);
        break;
      case 'large':
        baseStyle.push(styles.buttonLarge as ViewStyle);
        break;
      default:
        baseStyle.push(styles.buttonMedium as ViewStyle);
    }

    // Variant styles
    switch (variant) {
      case 'secondary':
        baseStyle.push(styles.buttonSecondary as ViewStyle);
        break;
      case 'outline':
        baseStyle.push(styles.buttonOutline as ViewStyle);
        break;
      case 'danger':
        baseStyle.push(styles.buttonDanger as ViewStyle);
        break;
      default:
        baseStyle.push(styles.buttonPrimary as ViewStyle);
    }

    if (disabled || loading) {
      baseStyle.push(styles.buttonDisabled as ViewStyle);
    }

    if (style) {
      baseStyle.push(style);
    }

    return baseStyle;
  };

  const getTextStyle = (): TextStyle[] => {
    const baseStyle: TextStyle[] = [styles.buttonText as TextStyle];

    switch (variant) {
      case 'outline':
        baseStyle.push(styles.buttonTextOutline as TextStyle);
        break;
      case 'danger':
        baseStyle.push(styles.buttonTextDanger as TextStyle);
        break;
      default:
        baseStyle.push(styles.buttonTextDefault as TextStyle);
    }

    return baseStyle;
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' ? theme.colors.primary : theme.colors.white}
        />
      ) : (
        <View style={styles.buttonContent}>
          {icon && (
            <MaterialIcons
              name={icon as any}
              size={16}
              color={variant === 'outline' ? theme.colors.primary : theme.colors.white}
              style={styles.buttonIcon}
            />
          )}
          <Text style={getTextStyle()}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// Input Field Component
interface InputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  error?: string;
  required?: boolean;
  editable?: boolean;
  icon?: string;
  style?: ViewStyle;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  maxLength,
  error,
  required = false,
  editable = true,
  icon,
  style,
}) => {
  return (
    <View style={[styles.inputContainer, style]}>
      <Text style={styles.inputLabel}>
        {label}
        {required && <Text style={styles.requiredAsterisk}> *</Text>}
      </Text>

      <View style={[styles.inputWrapper, error && styles.inputError]}>
        {icon && (
          <MaterialIcons
            name={icon as any}
            size={20}
            color={theme.colors.placeholder}
            style={styles.inputIcon}
          />
        )}

        <TextInput
          style={[
            styles.input,
            multiline && styles.inputMultiline,
            icon && styles.inputWithIcon,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.placeholder}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          maxLength={maxLength}
          editable={editable}
        />
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

// Card Component
interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
  onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  padding = theme.spacing.md,
  onPress
}) => {
  const cardStyle = [
    styles.card,
    { padding },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.8}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

// Loading Spinner Component
interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
  style?: ViewStyle;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  color = theme.colors.primary,
  text,
  style,
}) => {
  return (
    <View style={[styles.loadingContainer, style]}>
      <ActivityIndicator size={size} color={color} />
      {text && <Text style={styles.loadingText}>{text}</Text>}
    </View>
  );
};

// Empty State Component
interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  actionTitle?: string;
  onActionPress?: () => void;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionTitle,
  onActionPress,
  style,
}) => {
  return (
    <View style={[styles.emptyState, style]}>
      <MaterialIcons name={icon as any} size={64} color={theme.colors.disabled} />
      <Text style={styles.emptyTitle}>{title}</Text>
      {description && <Text style={styles.emptyDescription}>{description}</Text>}
      {actionTitle && onActionPress && (
        <Button
          title={actionTitle}
          onPress={onActionPress}
          variant="outline"
          style={styles.emptyAction}
        />
      )}
    </View>
  );
};

// Modal Selector Component
interface ModalSelectorProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  data: Array<{ value: string; label: string; icon?: string }>;
  selectedValue?: string;
  onSelect: (value: string) => void;
}

export const ModalSelector: React.FC<ModalSelectorProps> = ({
  visible,
  onClose,
  title,
  data,
  selectedValue,
  onSelect,
}) => {
  const handleSelect = (value: string) => {
    onSelect(value);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <MaterialIcons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={data}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.modalOption,
                  selectedValue === item.value && styles.modalOptionSelected,
                ]}
                onPress={() => handleSelect(item.value)}
              >
                {item.icon && (
                  <MaterialIcons
                    name={item.icon as any}
                    size={20}
                    color={selectedValue === item.value ? theme.colors.primary : theme.colors.placeholder}
                    style={styles.modalOptionIcon}
                  />
                )}
                <Text style={[
                  styles.modalOptionText,
                  selectedValue === item.value && styles.modalOptionTextSelected,
                ]}>
                  {item.label}
                </Text>
                {selectedValue === item.value && (
                  <MaterialIcons name="check" size={20} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
            )}
            style={styles.modalList}
          />
        </View>
      </View>
    </Modal>
  );
};

// Badge Component
interface BadgeProps {
  text: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'small' | 'medium';
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  text,
  variant = 'primary',
  size = 'medium',
  style,
}) => {
  const getBadgeStyle = (): ViewStyle[] => {
    const baseStyle: ViewStyle[] = [styles.badge as ViewStyle];

    switch (size) {
      case 'small':
        baseStyle.push(styles.badgeSmall as ViewStyle);
        break;
      default:
        baseStyle.push(styles.badgeMedium as ViewStyle);
    }

    switch (variant) {
      case 'secondary':
        baseStyle.push(styles.badgeSecondary as ViewStyle);
        break;
      case 'success':
        baseStyle.push(styles.badgeSuccess as ViewStyle);
        break;
      case 'warning':
        baseStyle.push(styles.badgeWarning as ViewStyle);
        break;
      case 'error':
        baseStyle.push(styles.badgeError as ViewStyle);
        break;
      default:
        baseStyle.push(styles.badgePrimary as ViewStyle);
    }

    if (style) {
      baseStyle.push(style);
    }

    return baseStyle;
  };

  const getTextStyle = (): TextStyle[] => {
    const baseStyle: TextStyle[] = [styles.badgeText as TextStyle];

    switch (size) {
      case 'small':
        baseStyle.push(styles.badgeTextSmall as TextStyle);
        break;
      default:
        baseStyle.push(styles.badgeTextMedium as TextStyle);
    }

    return baseStyle;
  };

  return (
    <View style={getBadgeStyle()}>
      <Text style={getTextStyle()}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  // Button Styles
  button: {
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  buttonSmall: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    minHeight: 36,
  },
  buttonMedium: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    minHeight: 44,
  },
  buttonLarge: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    minHeight: 52,
  },
  buttonPrimary: {
    backgroundColor: theme.colors.primary,
  },
  buttonSecondary: {
    backgroundColor: theme.colors.placeholder,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  buttonDanger: {
    backgroundColor: theme.colors.error,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonIcon: {
    marginRight: theme.spacing.sm,
  },
  buttonText: {
    fontWeight: theme.typography.fontWeight.semibold,
  },
  buttonTextDefault: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.md,
  },
  buttonTextOutline: {
    color: theme.colors.primary,
    fontSize: theme.typography.fontSize.md,
  },
  buttonTextDanger: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.md,
  },

  // Input Styles
  inputContainer: {
    marginBottom: theme.spacing.md,
  },
  inputLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  requiredAsterisk: {
    color: theme.colors.error,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  inputIcon: {
    marginLeft: theme.spacing.md,
  },
  input: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text,
  },
  inputWithIcon: {
    paddingLeft: theme.spacing.sm,
  },
  inputMultiline: {
    textAlignVertical: 'top',
    minHeight: 80,
  },
  errorText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.error,
    marginTop: theme.spacing.sm,
  },

  // Card Styles
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    shadowColor: theme.colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },

  // Loading Styles
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  loadingText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.placeholder,
    marginTop: theme.spacing.sm,
  },

  // Empty State Styles
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.placeholder,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyAction: {
    marginTop: theme.spacing.lg,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
  },
  modalCloseButton: {
    padding: theme.spacing.sm,
  },
  modalList: {
    maxHeight: 400,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background,
  },
  modalOptionSelected: {
    backgroundColor: `${theme.colors.primary}15`,
  },
  modalOptionIcon: {
    marginRight: theme.spacing.md,
  },
  modalOptionText: {
    flex: 1,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text,
    textTransform: 'capitalize',
  },
  modalOptionTextSelected: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },

  // Badge Styles
  badge: {
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeSmall: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
  },
  badgeMedium: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  badgePrimary: {
    backgroundColor: theme.colors.primary,
  },
  badgeSecondary: {
    backgroundColor: theme.colors.placeholder,
  },
  badgeSuccess: {
    backgroundColor: theme.colors.success,
  },
  badgeWarning: {
    backgroundColor: theme.colors.warning,
  },
  badgeError: {
    backgroundColor: theme.colors.error,
  },
  badgeText: {
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.white,
  },
  badgeTextSmall: {
    fontSize: theme.typography.fontSize.xs,
  },
  badgeTextMedium: {
    fontSize: theme.typography.fontSize.sm,
  },
});

export default {
  Button,
  InputField,
  Card,
  LoadingSpinner,
  EmptyState,
  ModalSelector,
  Badge,
};
