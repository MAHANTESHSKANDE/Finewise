/**
 * Expense Detail Screen - View and edit expense details
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import DatePicker from 'react-native-date-picker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// Internal imports
import { theme, commonStyles, categoryColors } from '../styles/theme';
import { dateUtils, currencyUtils, validationUtils, errorUtils } from '../utils';
import { apiAzureExpenseRepository } from '../database/apiAzureExpenseRepository';
import { aiCategorizer } from '../services/aiCategorizer';
import { Expense, ExpenseCategory, PaymentMethod } from '../types';

interface ExpenseDetailScreenProps {
  navigation: any;
  route: {
    params: {
      expenseId: number;
    };
  };
}

interface FormData {
  amount: string;
  description: string;
  date: Date;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
}

const PAYMENT_METHODS: Array<{ value: PaymentMethod; label: string; icon: string }> = [
  { value: 'cash', label: 'Cash', icon: 'money' },
  { value: 'credit_card', label: 'Credit Card', icon: 'credit-card' },
  { value: 'debit_card', label: 'Debit Card', icon: 'payment' },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: 'account-balance' },
  { value: 'digital_wallet', label: 'Digital Wallet', icon: 'smartphone' },
];

const ExpenseDetailScreen: React.FC<ExpenseDetailScreenProps> = ({ navigation, route }) => {
  const { expenseId } = route.params;
  
  const [expense, setExpense] = useState<Expense | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    amount: '',
    description: '',
    date: new Date(),
    category: 'miscellaneous',
    paymentMethod: 'cash',
  });
  
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  /**
   * Load expense details
   */
  const loadExpenseDetails = async () => {
    try {
      setIsLoading(true);
      const expenseData = await apiAzureExpenseRepository.getExpenseById(expenseId);
      
      if (!expenseData) {
        Alert.alert('Error', 'Expense not found.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
        return;
      }

      setExpense(expenseData);
      setFormData({
        amount: expenseData.amount.toString(),
        description: expenseData.description,
        date: new Date(expenseData.date),
        category: expenseData.category as ExpenseCategory,
        paymentMethod: expenseData.paymentMethod as PaymentMethod,
      });

    } catch (error) {
      console.error('[ExpenseDetailScreen] Error loading expense:', error);
      errorUtils.logError(error as Error, 'ExpenseDetailScreen.loadExpenseDetails');
      Alert.alert('Error', 'Failed to load expense details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExpenseDetails();
  }, [expenseId]);

  /**
   * Validate form data
   */
  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    // Validate amount
    const amount = parseFloat(formData.amount);
    if (!formData.amount.trim()) {
      errors.amount = 'Amount is required';
    } else if (isNaN(amount) || amount <= 0) {
      errors.amount = 'Please enter a valid positive amount';
    } else if (amount > 999999.99) {
      errors.amount = 'Amount cannot exceed $999,999.99';
    }

    // Validate description
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    } else if (formData.description.length < 2) {
      errors.description = 'Description must be at least 2 characters';
    } else if (formData.description.length > 100) {
      errors.description = 'Description cannot exceed 100 characters';
    }

    // Validate category
    if (!validationUtils.validateCategory(formData.category)) {
      errors.category = 'Please select a valid category';
    }

    // Validate payment method
    if (!validationUtils.validatePaymentMethod(formData.paymentMethod)) {
      errors.paymentMethod = 'Please select a valid payment method';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle save changes
   */
  const handleSave = async () => {
    if (!validateForm() || !expense) {
      return;
    }

    try {
      setIsSaving(true);

      const updates: Partial<Expense> = {
        amount: currencyUtils.roundAmount(parseFloat(formData.amount)),
        description: formData.description.trim(),
        date: dateUtils.formatDateToString(formData.date),
        category: formData.category,
        paymentMethod: formData.paymentMethod,
      };

      const updatedExpense = await apiAzureExpenseRepository.updateExpense(expense.id!, updates);
      
      setExpense(updatedExpense);
      setIsEditing(false);
      
      Alert.alert('Success', 'Expense updated successfully!');

    } catch (error) {
      console.error('[ExpenseDetailScreen] Error saving expense:', error);
      errorUtils.logError(error as Error, 'ExpenseDetailScreen.handleSave');
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handle delete expense
   */
  const handleDelete = () => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: confirmDelete,
        },
      ]
    );
  };

  const confirmDelete = async () => {
    if (!expense) return;

    try {
      setIsDeleting(true);
      await apiAzureExpenseRepository.deleteExpense(expense.id!);
      
      Alert.alert('Success', 'Expense deleted successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);

    } catch (error) {
      console.error('[ExpenseDetailScreen] Error deleting expense:', error);
      errorUtils.logError(error as Error, 'ExpenseDetailScreen.confirmDelete');
      Alert.alert('Error', 'Failed to delete expense. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * Cancel editing
   */
  const handleCancel = () => {
    if (!expense) return;

    setFormData({
      amount: expense.amount.toString(),
      description: expense.description,
      date: new Date(expense.date),
      category: expense.category as ExpenseCategory,
      paymentMethod: expense.paymentMethod as PaymentMethod,
    });
    setFormErrors({});
    setIsEditing(false);
  };

  /**
   * Render expense info (read-only mode)
   */
  const renderExpenseInfo = () => {
    if (!expense) return null;

    return (
      <View style={commonStyles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>Expense Details</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setIsEditing(true)}
            >
              <MaterialIcons name="edit" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color={theme.colors.error} />
              ) : (
                <MaterialIcons name="delete" size={20} color={theme.colors.error} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Amount</Text>
          <Text style={styles.value}>
            {currencyUtils.formatCurrency(expense.amount)}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Description</Text>
          <Text style={styles.value}>{expense.description}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Date</Text>
          <Text style={styles.value}>
            {dateUtils.formatDateForDisplay(expense.date)}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryInfo}>
            <View style={[styles.categoryDot, { backgroundColor: categoryColors[expense.category] }]} />
            <Text style={styles.value}>
              {aiCategorizer.getCategoryDisplayName(expense.category)}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Payment Method</Text>
          <View style={styles.paymentInfo}>
            <MaterialIcons
              name={PAYMENT_METHODS.find(p => p.value === expense.paymentMethod)?.icon as any}
              size={20}
              color={theme.colors.text}
            />
            <Text style={[styles.value, styles.paymentText]}>
              {PAYMENT_METHODS.find(p => p.value === expense.paymentMethod)?.label}
            </Text>
          </View>
        </View>

        {expense.createdAt && (
          <View style={styles.timestampContainer}>
            <Text style={styles.timestampText}>
              Created: {dateUtils.formatDateForDisplay(expense.createdAt.split('T')[0])}
            </Text>
            {expense.updatedAt && expense.updatedAt !== expense.createdAt && (
              <Text style={styles.timestampText}>
                Updated: {dateUtils.formatDateForDisplay(expense.updatedAt.split('T')[0])}
              </Text>
            )}
          </View>
        )}
      </View>
    );
  };

  /**
   * Render edit form
   */
  const renderEditForm = () => (
    <View style={commonStyles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Edit Expense</Text>
      </View>

      {/* Amount Input */}
      <View style={commonStyles.inputContainer}>
        <Text style={commonStyles.inputLabel}>Amount *</Text>
        <TextInput
          style={[commonStyles.input, formErrors.amount && styles.errorInput]}
          value={formData.amount}
          onChangeText={(text) => {
            const cleanedText = text.replace(/[^0-9.]/g, '');
            setFormData(prev => ({ ...prev, amount: cleanedText }));
            if (formErrors.amount) {
              setFormErrors(prev => ({ ...prev, amount: '' }));
            }
          }}
          placeholder="0.00"
          keyboardType="decimal-pad"
          maxLength={10}
        />
        {formErrors.amount && (
          <Text style={commonStyles.errorText}>{formErrors.amount}</Text>
        )}
      </View>

      {/* Description Input */}
      <View style={commonStyles.inputContainer}>
        <Text style={commonStyles.inputLabel}>Description *</Text>
        <TextInput
          style={[commonStyles.input, formErrors.description && styles.errorInput]}
          value={formData.description}
          onChangeText={(text) => {
            setFormData(prev => ({ ...prev, description: text }));
            if (formErrors.description) {
              setFormErrors(prev => ({ ...prev, description: '' }));
            }
          }}
          placeholder="e.g., Lunch at restaurant"
          maxLength={100}
          multiline
        />
        {formErrors.description && (
          <Text style={commonStyles.errorText}>{formErrors.description}</Text>
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
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={handleCancel}
          disabled={isSaving}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[commonStyles.button, styles.saveButton, isSaving && styles.disabledButton]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={theme.colors.surface} />
          ) : (
            <Text style={commonStyles.buttonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[commonStyles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading expense details...</Text>
      </View>
    );
  }

  if (!expense) {
    return (
      <View style={[commonStyles.container, styles.errorContainer]}>
        <MaterialIcons name="error" size={64} color={theme.colors.error} />
        <Text style={styles.errorText}>Expense not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={commonStyles.container} contentContainerStyle={commonStyles.screenPadding}>
      {isEditing ? renderEditForm() : renderExpenseInfo()}

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

      {/* Category Selection Modal */}
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
          {/* Category selection content would go here */}
        </View>
      </Modal>

      {/* Payment Method Selection Modal */}
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
          {/* Payment method selection content would go here */}
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  loadingText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.placeholder,
    marginTop: theme.spacing.sm,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  errorText: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.error,
    marginTop: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  editButton: {
    padding: theme.spacing.xs,
  },
  deleteButton: {
    padding: theme.spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background,
  },
  label: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.placeholder,
    fontWeight: theme.typography.fontWeight.medium,
  },
  value: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text,
    fontWeight: theme.typography.fontWeight.medium,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: theme.spacing.sm,
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentText: {
    marginLeft: theme.spacing.sm,
  },
  timestampContainer: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.background,
  },
  timestampText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholder,
    marginBottom: theme.spacing.xs,
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
  cancelButton: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.disabled,
  },
  cancelButtonText: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
  },
  saveButton: {},
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
});

export default ExpenseDetailScreen;
