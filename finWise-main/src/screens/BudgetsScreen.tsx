/**
 * Budgets Screen - Manage budgets and view spending progress
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  FlatList,
  TextInput,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import DatePicker from 'react-native-date-picker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// Internal imports
import { theme, commonStyles, categoryColors } from '../styles/theme';
import { dateUtils, currencyUtils, validationUtils, errorUtils } from '../utils';
import { apiAzureBudgetRepository } from '../database/apiAzureBudgetRepository';
import { databaseManager } from '../database';
import { aiCategorizer } from '../services/aiCategorizer';
import { Budget, BudgetProgress, ExpenseCategory } from '../types';

interface BudgetsScreenProps {
  navigation: any;
}

interface BudgetFormData {
  category: ExpenseCategory;
  amount: string;
  startDate: Date;
  endDate: Date;
}

const BudgetsScreen: React.FC<BudgetsScreenProps> = ({ navigation }) => {
  const [budgetProgress, setBudgetProgress] = useState<BudgetProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  
  const [formData, setFormData] = useState<BudgetFormData>({
    category: 'miscellaneous',
    amount: '',
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  });
  
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Load budget progress data
   */
  const loadBudgetProgress = async () => {
    try {
      console.log('[BudgetsScreen] Loading budget progress...');
      const today = dateUtils.getTodayString();
      console.log('[BudgetsScreen] Today:', today);
      
      const progress = await apiAzureBudgetRepository.getAllBudgetProgress(today);
      console.log('[BudgetsScreen] Loaded budget progress:', progress);
      
      setBudgetProgress(progress);
    } catch (error) {
      console.error('[BudgetsScreen] Error loading budget progress:', error);
      errorUtils.logError(error as Error, 'BudgetsScreen.loadBudgetProgress');
      Alert.alert('Error', 'Failed to load budget data. Please try again.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  /**
   * Handle refresh
   */
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadBudgetProgress();
  }, []);

  /**
   * Load data when screen focuses
   */
  useFocusEffect(
    useCallback(() => {
      loadBudgetProgress();
    }, [])
  );

  /**
   * Validate budget form
   */
  const validateBudgetForm = (): boolean => {
    console.log('[BudgetsScreen] Starting form validation...');
    const errors: { [key: string]: string } = {};

    // Validate amount
    const amount = parseFloat(formData.amount);
    console.log('[BudgetsScreen] Validating amount:', formData.amount, 'parsed:', amount);
    if (!formData.amount.trim()) {
      errors.amount = 'Budget amount is required';
    } else if (isNaN(amount) || amount <= 0) {
      errors.amount = 'Please enter a valid positive amount';
    } else if (amount > 999999.99) {
      errors.amount = 'Budget amount cannot exceed $999,999.99';
    }

    // Validate category
    console.log('[BudgetsScreen] Validating category:', formData.category);
    if (!validationUtils.validateCategory(formData.category)) {
      errors.category = 'Please select a valid category';
    }

    // Validate dates
    const startDate = dateUtils.formatDateToString(formData.startDate);
    const endDate = dateUtils.formatDateToString(formData.endDate);
    console.log('[BudgetsScreen] Validating dates:', startDate, 'to', endDate);
    
    if (!validationUtils.validateDateRange(startDate, endDate)) {
      errors.dates = 'End date must be after start date';
    }

    // Check if budget already exists for this category and date range
    console.log('[BudgetsScreen] Checking for existing budgets...');
    console.log('[BudgetsScreen] Current budgets:', budgetProgress.length);
    const existingBudget = budgetProgress.find(bp => 
      bp.budget.category === formData.category &&
      bp.budget.startDate <= endDate &&
      bp.budget.endDate >= startDate
    );

    if (existingBudget) {
      console.log('[BudgetsScreen] Found conflicting budget:', existingBudget.budget);
      errors.category = 'Budget already exists for this category and date range';
    }

    console.log('[BudgetsScreen] Validation errors:', errors);
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle budget creation
   */
  const handleCreateBudget = async () => {
    console.log('[BudgetsScreen] Starting budget creation...');
    console.log('[BudgetsScreen] Form data:', formData);
    
    if (!validateBudgetForm()) {
      console.log('[BudgetsScreen] Form validation failed');
      console.log('[BudgetsScreen] Form errors:', formErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('[BudgetsScreen] Creating budget...');
      
      // Verify database connection first
      try {
        console.log('[BudgetsScreen] Verifying database connection...');
        await databaseManager.getDatabase();
        console.log('[BudgetsScreen] Database connection verified');
      } catch (dbError) {
        console.error('[BudgetsScreen] Database connection failed:', dbError);
        throw new Error(`Database Error: Could not connect to the database - ${(dbError as Error).message}`);
      }

      const budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'> = {
        category: formData.category,
        amount: currencyUtils.roundAmount(parseFloat(formData.amount)),
        startDate: dateUtils.formatDateToString(formData.startDate),
        endDate: dateUtils.formatDateToString(formData.endDate),
      };

      console.log('[BudgetsScreen] Budget object to create:', budget);
      
      // Create the budget with timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Budget creation timed out')), 5000);
      });
      
      await Promise.race([
        apiAzureBudgetRepository.createBudget(budget),
        timeoutPromise
      ]);
      
      console.log('[BudgetsScreen] Budget created successfully');
      Alert.alert('Success', 'Budget created successfully!');
      
      // Reset form and close modal
      resetForm();
      setShowCreateModal(false);
      
      // Refresh data
      loadBudgetProgress();

    } catch (error) {
      console.error('[BudgetsScreen] Error creating budget:', error);
      errorUtils.logError(error as Error, 'BudgetsScreen.handleCreateBudget');
      
      // Show diagnostic option
      Alert.alert(
        'Budget Error',
        `Failed to create budget: ${(error as Error).message}`,
        [
          {
            text: 'Run Diagnostic',
            onPress: async () => {
              try {
                // Import dynamically to avoid circular dependencies
                const { default: DatabaseDiagnostic } = await import('../utils/DatabaseDiagnostic');
                const result = await DatabaseDiagnostic.runDiagnostics();
                if (result) {
                  // Try again if diagnostic was successful
                  Alert.alert('Diagnostic Complete', 
                    'Database issues have been fixed. Would you like to try again?',
                    [
                      {
                        text: 'Try Again',
                        onPress: () => handleCreateBudget()
                      },
                      {
                        text: 'Cancel',
                        style: 'cancel'
                      }
                    ]
                  );
                }
              } catch (diagError) {
                console.error('[BudgetsScreen] Diagnostic error:', diagError);
              }
            }
          },
          {
            text: 'OK',
            style: 'cancel'
          }
        ]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle budget deletion
   */
  const handleDeleteBudget = (budgetProgress: BudgetProgress) => {
    Alert.alert(
      'Delete Budget',
      `Are you sure you want to delete the ${budgetProgress.budget.category} budget?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (budgetProgress.budget.id) {
                await apiAzureBudgetRepository.deleteBudget(budgetProgress.budget.id);
                loadBudgetProgress();
                Alert.alert('Success', 'Budget deleted successfully!');
              }
            } catch (error) {
              console.error('[BudgetsScreen] Error deleting budget:', error);
              Alert.alert('Error', 'Failed to delete budget. Please try again.');
            }
          },
        },
      ]
    );
  };

  /**
   * Reset form data
   */
  const resetForm = () => {
    setFormData({
      category: 'miscellaneous',
      amount: '',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    setFormErrors({});
  };

  /**
   * Render budget progress item
   */
  const renderBudgetItem = ({ item }: { item: BudgetProgress }) => (
    <View style={[commonStyles.card, styles.budgetCard]}>
      <View style={styles.budgetHeader}>
        <View style={styles.budgetHeaderLeft}>
          <View style={[styles.categoryDot, { backgroundColor: categoryColors[item.budget.category] }]} />
          <View>
            <Text style={styles.budgetCategory}>
              {aiCategorizer.getCategoryDisplayName(item.budget.category)}
            </Text>
            <Text style={styles.budgetPeriod}>
              {dateUtils.formatDateForDisplay(item.budget.startDate)} - {dateUtils.formatDateForDisplay(item.budget.endDate)}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => handleDeleteBudget(item)}
          style={styles.deleteButton}
        >
          <MaterialIcons name="delete" size={20} color={theme.colors.error} />
        </TouchableOpacity>
      </View>

      <View style={styles.budgetProgress}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>
            {currencyUtils.formatCurrency(item.spent)} of {currencyUtils.formatCurrency(item.budget.amount)}
          </Text>
          <Text style={[
            styles.progressPercentage,
            item.isOverBudget && styles.overBudgetText,
            item.isWarning && !item.isOverBudget && styles.warningText,
          ]}>
            {Math.round(item.percentage)}%
          </Text>
        </View>
        
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${Math.min(item.percentage, 100)}%`,
                backgroundColor: item.isOverBudget
                  ? theme.colors.error
                  : item.isWarning
                  ? theme.colors.warning
                  : theme.colors.success,
              },
            ]}
          />
        </View>

        <View style={styles.progressFooter}>
          <Text style={styles.remainingText}>
            {item.remaining >= 0 ? 'Remaining: ' : 'Over budget: '}
            <Text style={[
              styles.remainingAmount,
              item.remaining < 0 && styles.overBudgetText,
            ]}>
              {currencyUtils.formatCurrency(Math.abs(item.remaining))}
            </Text>
          </Text>
          
          {item.isWarning && (
            <View style={styles.warningContainer}>
              <MaterialIcons 
                name={item.isOverBudget ? "error" : "warning"} 
                size={16} 
                color={item.isOverBudget ? theme.colors.error : theme.colors.warning} 
              />
              <Text style={[
                styles.warningText,
                item.isOverBudget && styles.overBudgetText,
              ]}>
                {item.isOverBudget ? 'Over budget!' : 'Almost over budget!'}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  /**
   * Render create budget modal
   */
  const renderCreateBudgetModal = () => (
    <Modal
      visible={showCreateModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Create Budget</Text>
          <TouchableOpacity onPress={() => {
            setShowCreateModal(false);
            resetForm();
          }}>
            <MaterialIcons name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Category Selection */}
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
            {formErrors.category && (
              <Text style={commonStyles.errorText}>{formErrors.category}</Text>
            )}
          </View>

          {/* Budget Amount */}
          <View style={commonStyles.inputContainer}>
            <Text style={commonStyles.inputLabel}>Budget Amount *</Text>
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

          {/* Start Date */}
          <View style={commonStyles.inputContainer}>
            <Text style={commonStyles.inputLabel}>Start Date</Text>
            <TouchableOpacity
              style={commonStyles.input}
              onPress={() => setShowStartDatePicker(true)}
            >
              <Text style={styles.dateText}>
                {dateUtils.formatDateForDisplay(dateUtils.formatDateToString(formData.startDate))}
              </Text>
            </TouchableOpacity>
          </View>

          {/* End Date */}
          <View style={commonStyles.inputContainer}>
            <Text style={commonStyles.inputLabel}>End Date</Text>
            <TouchableOpacity
              style={commonStyles.input}
              onPress={() => setShowEndDatePicker(true)}
            >
              <Text style={styles.dateText}>
                {dateUtils.formatDateForDisplay(dateUtils.formatDateToString(formData.endDate))}
              </Text>
            </TouchableOpacity>
            {formErrors.dates && (
              <Text style={commonStyles.errorText}>{formErrors.dates}</Text>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.modalButtonContainer}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => {
                setShowCreateModal(false);
                resetForm();
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[commonStyles.button, styles.createButton]}
              onPress={handleCreateBudget}
              disabled={isSubmitting}
            >
              <Text style={commonStyles.buttonText}>
                {isSubmitting ? 'Creating...' : 'Create Budget'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {/* Date Pickers */}
      <DatePicker
        modal
        open={showStartDatePicker}
        date={formData.startDate}
        mode="date"
        onConfirm={(date) => {
          setFormData(prev => ({ ...prev, startDate: date }));
          setShowStartDatePicker(false);
        }}
        onCancel={() => setShowStartDatePicker(false)}
      />

      <DatePicker
        modal
        open={showEndDatePicker}
        date={formData.endDate}
        mode="date"
        onConfirm={(date) => {
          setFormData(prev => ({ ...prev, endDate: date }));
          setShowEndDatePicker(false);
        }}
        onCancel={() => setShowEndDatePicker(false)}
      />

      {/* Category Modal */}
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
          
          <FlatList
            data={aiCategorizer.getAvailableCategories()}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.categoryItem,
                  formData.category === item && styles.selectedCategoryItem,
                ]}
                onPress={() => {
                  setFormData(prev => ({ ...prev, category: item }));
                  setShowCategoryModal(false);
                }}
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
    </Modal>
  );

  if (isLoading) {
    return (
      <View style={[commonStyles.container, styles.loadingContainer]}>
        <MaterialIcons name="hourglass-empty" size={48} color={theme.colors.disabled} />
        <Text style={styles.loadingText}>Loading budgets...</Text>
      </View>
    );
  }

  return (
    <View style={commonStyles.container}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={commonStyles.screenPadding}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header with Create Button */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Your Budgets</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowCreateModal(true)}
          >
            <MaterialIcons name="add" size={20} color={theme.colors.surface} />
            <Text style={styles.createButtonText}>Create</Text>
          </TouchableOpacity>
        </View>

        {/* Budget List */}
        {budgetProgress.length === 0 ? (
          <View style={[commonStyles.card, styles.emptyState]}>
            <MaterialIcons name="savings" size={64} color={theme.colors.disabled} />
            <Text style={styles.emptyTitle}>No Budgets Set</Text>
            <Text style={styles.emptySubtext}>
              Create your first budget to start tracking your spending and stay on top of your finances.
            </Text>
            <TouchableOpacity
              style={[commonStyles.button, styles.emptyActionButton]}
              onPress={() => setShowCreateModal(true)}
            >
              <MaterialIcons name="add-circle" size={20} color={theme.colors.surface} />
              <Text style={[commonStyles.buttonText, styles.emptyActionText]}>
                Create Your First Budget
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={budgetProgress}
            keyExtractor={(item) => item.budget.id?.toString() || ''}
            renderItem={renderBudgetItem}
            scrollEnabled={false}
          />
        )}
      </ScrollView>

      {/* Create Budget Modal */}
      {renderCreateBudgetModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
  },
  createButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  createButtonText: {
    color: theme.colors.surface,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    marginLeft: theme.spacing.xs,
  },
  budgetCard: {
    marginBottom: theme.spacing.md,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  budgetHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: theme.spacing.sm,
  },
  budgetCategory: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
    textTransform: 'capitalize',
  },
  budgetPeriod: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholder,
    marginTop: theme.spacing.xs,
  },
  deleteButton: {
    padding: theme.spacing.xs,
  },
  budgetProgress: {
    marginTop: theme.spacing.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  progressLabel: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text,
    fontWeight: theme.typography.fontWeight.medium,
  },
  progressPercentage: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.success,
  },
  warningText: {
    color: theme.colors.warning,
  },
  overBudgetText: {
    color: theme.colors.error,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: theme.colors.background,
    borderRadius: 4,
    marginBottom: theme.spacing.sm,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  remainingText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text,
  },
  remainingAmount: {
    fontWeight: theme.typography.fontWeight.semibold,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
  },
  emptySubtext: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.placeholder,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
  },
  emptyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyActionText: {
    marginLeft: theme.spacing.xs,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.disabled,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.lg,
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
  errorInput: {
    borderColor: theme.colors.error,
  },
  dateText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginVertical: theme.spacing.xl,
  },
  modalButton: {
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
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background,
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
});

export default BudgetsScreen;
