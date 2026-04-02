/**
 * Add Expense Screen - Form for adding new expenses with AI categorization
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import DatePicker from 'react-native-date-picker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// Internal imports
import { theme, commonStyles, categoryColors } from '../styles/theme';
import { dateUtils, currencyUtils, validationUtils, errorUtils } from '../utils';
import { apiAzureExpenseRepository } from '../database/apiAzureExpenseRepository';
import { aiCategorizer } from '../services/aiCategorizer';
import { Expense, ExpenseCategory, PaymentMethod } from '../types';

interface AddExpenseScreenProps {
  navigation: any;
}

interface FormData {
  amount: string;
  description: string;
  date: Date;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
}

interface FormErrors {
  amount?: string;
  description?: string;
  category?: string;
  paymentMethod?: string;
}

const PAYMENT_METHODS: Array<{ value: PaymentMethod; label: string; icon: string }> = [
  { value: 'cash', label: 'Cash', icon: 'money' },
  { value: 'credit_card', label: 'Credit Card', icon: 'credit-card' },
  { value: 'debit_card', label: 'Debit Card', icon: 'payment' },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: 'account-balance' },
  { value: 'digital_wallet', label: 'Digital Wallet', icon: 'smartphone' },
];

const AddExpenseScreen: React.FC<AddExpenseScreenProps> = ({ navigation }) => {
  const [formData, setFormData] = useState<FormData>({
    amount: '',
    description: '',
    date: new Date(),
    category: 'miscellaneous',
    paymentMethod: 'cash',
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCategorizingAI, setIsCategorizingAI] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [suggestedCategories, setSuggestedCategories] = useState<ExpenseCategory[]>([]);

  /**
   * Validate form data
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate amount
    const amount = parseFloat(formData.amount);
    if (!formData.amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(amount) || amount <= 0) {
      newErrors.amount = 'Please enter a valid positive amount';
    } else if (amount > 999999.99) {
      newErrors.amount = 'Amount cannot exceed $999,999.99';
    }

    // Validate description
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 2) {
      newErrors.description = 'Description must be at least 2 characters';
    } else if (formData.description.length > 100) {
      newErrors.description = 'Description cannot exceed 100 characters';
    }

    // Validate category
    if (!validationUtils.validateCategory(formData.category)) {
      newErrors.category = 'Please select a valid category';
    }

    // Validate payment method
    if (!validationUtils.validatePaymentMethod(formData.paymentMethod)) {
      newErrors.paymentMethod = 'Please select a valid payment method';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle AI categorization
   */
  const handleAICategorization = async () => {
    if (!formData.description.trim()) {
      Alert.alert('Description Required', 'Please enter a description first to get AI suggestions.');
      return;
    }

    try {
      setIsCategorizingAI(true);
      const amount = parseFloat(formData.amount) || undefined;
      
      const response = await aiCategorizer.categorizeExpense({
        description: formData.description,
        amount,
      });

      // Update category with AI suggestion
      setFormData(prev => ({ ...prev, category: response.category as ExpenseCategory }));
      
      // Set alternative suggestions
      if (response.alternativeCategories) {
        setSuggestedCategories(response.alternativeCategories as ExpenseCategory[]);
      }

      // Show confidence feedback
      const confidenceText = response.confidence > 0.8 ? 'High' : response.confidence > 0.6 ? 'Medium' : 'Low';
      Alert.alert(
        'AI Suggestion',
        `Category "${response.category}" suggested with ${confidenceText} confidence.\n\nYou can change it if needed.`
      );

    } catch (error) {
      console.error('[AddExpenseScreen] AI categorization failed:', error);
      errorUtils.logError(error as Error, 'AddExpenseScreen.handleAICategorization');
      Alert.alert('AI Unavailable', 'AI categorization is temporarily unavailable. Please select a category manually.');
    } finally {
      setIsCategorizingAI(false);
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);

      const expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'> = {
        amount: currencyUtils.roundAmount(parseFloat(formData.amount)),
        description: formData.description.trim(),
        date: dateUtils.formatDateToString(formData.date),
        category: formData.category,
        paymentMethod: formData.paymentMethod,
      };

      const createdExpense = await apiAzureExpenseRepository.createExpense(expense);
      
      console.log('[AddExpenseScreen] Expense created:', createdExpense);

      // Show success message
      Alert.alert(
        'Success',
        'Expense added successfully!',
        [
          {
            text: 'Add Another',
            onPress: resetForm,
          },
          {
            text: 'View Dashboard',
            onPress: () => navigation.navigate('Home'),
            style: 'default',
          },
        ]
      );

    } catch (error) {
      console.error('[AddExpenseScreen] Error creating expense:', error);
      errorUtils.logError(error as Error, 'AddExpenseScreen.handleSubmit');
      Alert.alert('Error', 'Failed to add expense. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Reset form to initial state
   */
  const resetForm = () => {
    setFormData({
      amount: '',
      description: '',
      date: new Date(),
      category: 'miscellaneous',
      paymentMethod: 'cash',
    });
    setErrors({});
    setSuggestedCategories([]);
  };

  /**
   * Handle category selection
   */
  const handleCategorySelect = (category: ExpenseCategory) => {
    setFormData(prev => ({ ...prev, category }));
    setShowCategoryModal(false);
  };

  /**
   * Handle payment method selection
   */
  const handlePaymentMethodSelect = (paymentMethod: PaymentMethod) => {
    setFormData(prev => ({ ...prev, paymentMethod }));
    setShowPaymentModal(false);
  };

  /**
   * Render category modal
   */
  const renderCategoryModal = () => {
    const categories = aiCategorizer.getAvailableCategories();
    
    return (
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Category</Text>
            <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
              <MaterialIcons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          
          {suggestedCategories.length > 0 && (
            <>
              <Text style={styles.suggestionHeader}>AI Suggestions</Text>
              <FlatList
                data={suggestedCategories}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.categoryItem, styles.suggestedCategory]}
                    onPress={() => handleCategorySelect(item)}
                  >
                    <View style={[styles.categoryDot, { backgroundColor: categoryColors[item] }]} />
                    <Text style={styles.categoryLabel}>
                      {aiCategorizer.getCategoryDisplayName(item)}
                    </Text>
                    <MaterialIcons name="auto-awesome" size={16} color={theme.colors.primary} />
                  </TouchableOpacity>
                )}
                scrollEnabled={false}
              />
              <Text style={styles.allCategoriesHeader}>All Categories</Text>
            </>
          )}
          
          <FlatList
            data={categories}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.categoryItem,
                  formData.category === item && styles.selectedCategoryItem,
                ]}
                onPress={() => handleCategorySelect(item)}
              >
                <View style={[styles.categoryDot, { backgroundColor: categoryColors[item] }]} />
                <Text style={[
                  styles.categoryLabel,
                  formData.category === item && styles.selectedCategoryLabel,
                ]}>
                  {aiCategorizer.getCategoryDisplayName(item)}
                </Text>
                {formData.category === item && (
                  <MaterialIcons name="check" size={20} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    );
  };

  /**
   * Render payment method modal
   */
  const renderPaymentMethodModal = () => (
    <Modal
      visible={showPaymentModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Payment Method</Text>
          <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
            <MaterialIcons name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
        
        <FlatList
          data={PAYMENT_METHODS}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.paymentItem,
                formData.paymentMethod === item.value && styles.selectedPaymentItem,
              ]}
              onPress={() => handlePaymentMethodSelect(item.value)}
            >
              <MaterialIcons 
                name={item.icon as any} 
                size={24} 
                color={formData.paymentMethod === item.value ? theme.colors.primary : theme.colors.placeholder} 
              />
              <Text style={[
                styles.paymentLabel,
                formData.paymentMethod === item.value && styles.selectedPaymentLabel,
              ]}>
                {item.label}
              </Text>
              {formData.paymentMethod === item.value && (
                <MaterialIcons name="check" size={20} color={theme.colors.primary} />
              )}
            </TouchableOpacity>
          )}
        />
      </View>
    </Modal>
  );

  return (
    <ScrollView style={commonStyles.container} contentContainerStyle={commonStyles.screenPadding}>
      <View style={commonStyles.card}>
        <Text style={styles.formTitle}>Add New Expense</Text>
        
        {/* Amount Input */}
        <View style={commonStyles.inputContainer}>
          <Text style={commonStyles.inputLabel}>Amount *</Text>
          <TextInput
            style={[commonStyles.input, errors.amount && styles.errorInput]}
            value={formData.amount}
            onChangeText={(text) => {
              // Only allow numbers and decimal point
              const cleanedText = text.replace(/[^0-9.]/g, '');
              setFormData(prev => ({ ...prev, amount: cleanedText }));
              if (errors.amount) {
                setErrors(prev => ({ ...prev, amount: undefined }));
              }
            }}
            placeholder="0.00"
            keyboardType="decimal-pad"
            maxLength={10}
          />
          {errors.amount && (
            <Text style={commonStyles.errorText}>{errors.amount}</Text>
          )}
        </View>

        {/* Description Input */}
        <View style={commonStyles.inputContainer}>
          <View style={styles.descriptionHeader}>
            <Text style={commonStyles.inputLabel}>Description *</Text>
            <TouchableOpacity
              style={[styles.aiButton, isCategorizingAI && styles.aiButtonActive]}
              onPress={handleAICategorization}
              disabled={isCategorizingAI}
            >
              {isCategorizingAI ? (
                <ActivityIndicator size="small" color={theme.colors.surface} />
              ) : (
                <MaterialIcons name="auto-awesome" size={16} color={theme.colors.surface} />
              )}
              <Text style={styles.aiButtonText}>
                {isCategorizingAI ? 'Analyzing...' : 'AI Suggest'}
              </Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={[commonStyles.input, errors.description && styles.errorInput]}
            value={formData.description}
            onChangeText={(text) => {
              setFormData(prev => ({ ...prev, description: text }));
              if (errors.description) {
                setErrors(prev => ({ ...prev, description: undefined }));
              }
            }}
            placeholder="e.g., Lunch at restaurant"
            maxLength={100}
            multiline
          />
          {errors.description && (
            <Text style={commonStyles.errorText}>{errors.description}</Text>
          )}
        </View>

        {/* Date Input */}
        <View style={commonStyles.inputContainer}>
          <Text style={commonStyles.inputLabel}>Date</Text>
          <TouchableOpacity
            style={commonStyles.input}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateText}>
              {dateUtils.formatDateForDisplay(dateUtils.formatDateToString(formData.date))}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Category Input */}
        <View style={commonStyles.inputContainer}>
          <Text style={commonStyles.inputLabel}>Category *</Text>
          <TouchableOpacity
            style={[commonStyles.input, styles.selectableInput]}
            onPress={() => setShowCategoryModal(true)}
          >
            <View style={styles.categoryDisplay}>
              <View style={[styles.categoryDot, { backgroundColor: categoryColors[formData.category] }]} />
              <Text style={styles.categoryDisplayText}>
                {aiCategorizer.getCategoryDisplayName(formData.category)}
              </Text>
            </View>
            <MaterialIcons name="keyboard-arrow-down" size={24} color={theme.colors.placeholder} />
          </TouchableOpacity>
          {errors.category && (
            <Text style={commonStyles.errorText}>{errors.category}</Text>
          )}
        </View>

        {/* Payment Method Input */}
        <View style={commonStyles.inputContainer}>
          <Text style={commonStyles.inputLabel}>Payment Method *</Text>
          <TouchableOpacity
            style={[commonStyles.input, styles.selectableInput]}
            onPress={() => setShowPaymentModal(true)}
          >
            <View style={styles.paymentDisplay}>
              <MaterialIcons
                name={PAYMENT_METHODS.find(p => p.value === formData.paymentMethod)?.icon as any}
                size={20}
                color={theme.colors.text}
              />
              <Text style={styles.paymentDisplayText}>
                {PAYMENT_METHODS.find(p => p.value === formData.paymentMethod)?.label}
              </Text>
            </View>
            <MaterialIcons name="keyboard-arrow-down" size={24} color={theme.colors.placeholder} />
          </TouchableOpacity>
          {errors.paymentMethod && (
            <Text style={commonStyles.errorText}>{errors.paymentMethod}</Text>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.resetButton]}
            onPress={resetForm}
            disabled={isSubmitting}
          >
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[commonStyles.button, styles.submitButton, isSubmitting && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={theme.colors.surface} />
            ) : (
              <>
                <MaterialIcons name="add" size={20} color={theme.colors.surface} />
                <Text style={[commonStyles.buttonText, styles.submitButtonText]}>Add Expense</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Date Picker Modal */}
      <DatePicker
        modal
        open={showDatePicker}
        date={formData.date}
        mode="date"
        onConfirm={(date) => {
          setFormData(prev => ({ ...prev, date }));
          setShowDatePicker(false);
        }}
        onCancel={() => setShowDatePicker(false)}
      />

      {/* Category Modal */}
      {renderCategoryModal()}
      
      {/* Payment Method Modal */}
      {renderPaymentMethodModal()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  formTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  descriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  aiButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  aiButtonActive: {
    opacity: 0.7,
  },
  aiButtonText: {
    color: theme.colors.surface,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    marginLeft: theme.spacing.xs,
  },
  errorInput: {
    borderColor: theme.colors.error,
  },
  dateText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text,
  },
  selectableInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: theme.spacing.sm,
  },
  categoryDisplayText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text,
  },
  paymentDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentDisplayText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  button: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  resetButton: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.disabled,
  },
  resetButtonText: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  submitButtonText: {
    marginLeft: theme.spacing.xs,
  },
  disabledButton: {
    opacity: 0.7,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: theme.spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.disabled,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
  },
  suggestionHeader: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.primary,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  allCategoriesHeader: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background,
  },
  suggestedCategory: {
    backgroundColor: theme.colors.surface,
  },
  selectedCategoryItem: {
    backgroundColor: `${theme.colors.primary}10`,
  },
  categoryLabel: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  selectedCategoryLabel: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  paymentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background,
  },
  selectedPaymentItem: {
    backgroundColor: `${theme.colors.primary}10`,
  },
  paymentLabel: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text,
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  selectedPaymentLabel: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
});

export default AddExpenseScreen;
