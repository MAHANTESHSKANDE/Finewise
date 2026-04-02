/**
 * Budget Detail Screen - View and manage budget details with spending analysis
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// Internal imports
import { theme, commonStyles, categoryColors } from '../styles/theme';
import { dateUtils, currencyUtils, errorUtils } from '../utils';
import { apiAzureBudgetRepository } from '../database/apiAzureBudgetRepository';
import { apiAzureExpenseRepository } from '../database/apiAzureExpenseRepository';
import { aiCategorizer } from '../services/aiCategorizer';
import { Budget, BudgetProgress, Expense } from '../types';

interface BudgetDetailScreenProps {
  navigation: any;
  route: {
    params: {
      budgetId: number;
    };
  };
}

const BudgetDetailScreen: React.FC<BudgetDetailScreenProps> = ({ navigation, route }) => {
  const { budgetId } = route.params;
  
  const [budgetProgress, setBudgetProgress] = useState<BudgetProgress | null>(null);
  const [relatedExpenses, setRelatedExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  /**
   * Load budget details and related data
   */
  const loadBudgetDetails = async () => {
    try {
      setIsLoading(true);
      
      // Load budget progress
      const progress = await apiAzureBudgetRepository.getBudgetProgress(budgetId);
      
      if (!progress) {
        Alert.alert('Error', 'Budget not found.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
        return;
      }

      setBudgetProgress(progress);

      // Load related expenses
      const expenses = await apiAzureExpenseRepository.getExpensesByDateRange(
        progress.budget.startDate,
        progress.budget.endDate
      );
      
      // Filter expenses by category
      const categoryExpenses = expenses.filter(
        expense => expense.category === progress.budget.category
      );
      
      setRelatedExpenses(categoryExpenses);

    } catch (error) {
      console.error('[BudgetDetailScreen] Error loading budget details:', error);
      errorUtils.logError(error as Error, 'BudgetDetailScreen.loadBudgetDetails');
      Alert.alert('Error', 'Failed to load budget details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBudgetDetails();
  }, [budgetId]);

  /**
   * Handle budget deletion
   */
  const handleDelete = () => {
    Alert.alert(
      'Delete Budget',
      'Are you sure you want to delete this budget? This action cannot be undone.',
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
    if (!budgetProgress) return;

    try {
      setIsDeleting(true);
      await apiAzureBudgetRepository.deleteBudget(budgetProgress.budget.id!);
      
      Alert.alert('Success', 'Budget deleted successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);

    } catch (error) {
      console.error('[BudgetDetailScreen] Error deleting budget:', error);
      errorUtils.logError(error as Error, 'BudgetDetailScreen.confirmDelete');
      Alert.alert('Error', 'Failed to delete budget. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * Navigate to expense detail
   */
  const handleExpensePress = (expense: Expense) => {
    if (expense.id) {
      navigation.navigate('ExpenseDetail', { expenseId: expense.id });
    }
  };

  /**
   * Render budget overview
   */
  const renderBudgetOverview = () => {
    if (!budgetProgress) return null;

    const { budget, spent, remaining, percentage, isOverBudget, isWarning } = budgetProgress;
    
    return (
      <View style={[commonStyles.card, styles.overviewCard]}>
        <View style={styles.header}>
          <View style={styles.categoryHeader}>
            <View style={[styles.categoryDot, { backgroundColor: categoryColors[budget.category] }]} />
            <View>
              <Text style={styles.categoryTitle}>
                {aiCategorizer.getCategoryDisplayName(budget.category)}
              </Text>
              <Text style={styles.budgetPeriod}>
                {dateUtils.formatDateForDisplay(budget.startDate)} - {dateUtils.formatDateForDisplay(budget.endDate)}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color={theme.colors.error} />
            ) : (
              <MaterialIcons name="delete" size={24} color={theme.colors.error} />
            )}
          </TouchableOpacity>
        </View>

        {/* Progress Section */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Budget Progress</Text>
            <Text style={[
              styles.progressPercentage,
              isOverBudget && styles.overBudgetText,
              isWarning && !isOverBudget && styles.warningText,
            ]}>
              {Math.round(percentage)}%
            </Text>
          </View>
          
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${Math.min(percentage, 100)}%`,
                  backgroundColor: isOverBudget
                    ? theme.colors.error
                    : isWarning
                    ? theme.colors.warning
                    : theme.colors.success,
                },
              ]}
            />
          </View>

          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Spent</Text>
            <Text style={[
              styles.amountValue,
              isOverBudget && styles.overBudgetText,
            ]}>
              {currencyUtils.formatCurrency(spent)}
            </Text>
          </View>

          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Budget</Text>
            <Text style={styles.amountValue}>
              {currencyUtils.formatCurrency(budget.amount)}
            </Text>
          </View>

          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>
              {remaining >= 0 ? 'Remaining' : 'Over Budget'}
            </Text>
            <Text style={[
              styles.amountValue,
              remaining < 0 && styles.overBudgetText,
              remaining >= 0 && styles.successText,
            ]}>
              {currencyUtils.formatCurrency(Math.abs(remaining))}
            </Text>
          </View>

          {/* Warning or Over Budget Alert */}
          {(isWarning || isOverBudget) && (
            <View style={[
              styles.alertContainer,
              isOverBudget ? styles.errorAlert : styles.warningAlert,
            ]}>
              <MaterialIcons 
                name={isOverBudget ? "error" : "warning"} 
                size={20} 
                color={isOverBudget ? theme.colors.error : theme.colors.warning} 
              />
              <Text style={[
                styles.alertText,
                isOverBudget ? styles.overBudgetText : styles.warningText,
              ]}>
                {isOverBudget 
                  ? `You're ${currencyUtils.formatCurrency(Math.abs(remaining))} over budget!`
                  : `You're at ${Math.round(percentage)}% of your budget limit.`
                }
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  /**
   * Render spending statistics
   */
  const renderSpendingStats = () => {
    if (!budgetProgress || relatedExpenses.length === 0) return null;

    const totalDays = dateUtils.getDaysBetween(
      budgetProgress.budget.startDate,
      budgetProgress.budget.endDate
    );
    const daysElapsed = dateUtils.getDaysBetween(
      budgetProgress.budget.startDate,
      dateUtils.getTodayString()
    );
    const dailyAverage = budgetProgress.spent / Math.max(1, daysElapsed);
    const projectedSpending = dailyAverage * totalDays;

    return (
      <View style={[commonStyles.card, styles.statsCard]}>
        <Text style={styles.sectionTitle}>Spending Analysis</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Transactions</Text>
            <Text style={styles.statValue}>{relatedExpenses.length}</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Daily Average</Text>
            <Text style={styles.statValue}>
              {currencyUtils.formatCurrency(dailyAverage)}
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Projected Total</Text>
            <Text style={[
              styles.statValue,
              projectedSpending > budgetProgress.budget.amount && styles.warningText,
            ]}>
              {currencyUtils.formatCurrency(projectedSpending)}
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Days Remaining</Text>
            <Text style={styles.statValue}>
              {Math.max(0, totalDays - daysElapsed)}
            </Text>
          </View>
        </View>

        {projectedSpending > budgetProgress.budget.amount && (
          <View style={styles.projectionWarning}>
            <MaterialIcons name="trending-up" size={16} color={theme.colors.warning} />
            <Text style={styles.projectionText}>
              At this rate, you may exceed your budget by {' '}
              {currencyUtils.formatCurrency(projectedSpending - budgetProgress.budget.amount)}
            </Text>
          </View>
        )}
      </View>
    );
  };

  /**
   * Render related expenses
   */
  const renderRelatedExpenses = () => (
    <View style={[commonStyles.card, styles.expensesCard]}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Related Expenses ({relatedExpenses.length})
        </Text>
      </View>

      {relatedExpenses.length === 0 ? (
        <View style={styles.emptyExpenses}>
          <MaterialIcons name="receipt-long" size={48} color={theme.colors.disabled} />
          <Text style={styles.emptyText}>No expenses found</Text>
          <Text style={styles.emptySubtext}>
            No expenses have been recorded for this category during the budget period.
          </Text>
        </View>
      ) : (
        <FlatList
          data={relatedExpenses}
          keyExtractor={(item) => item.id?.toString() || ''}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.expenseItem}
              onPress={() => handleExpensePress(item)}
              activeOpacity={0.7}
            >
              <View style={styles.expenseLeft}>
                <MaterialIcons 
                  name="receipt" 
                  size={20} 
                  color={categoryColors[item.category] || categoryColors.miscellaneous} 
                />
                <View style={styles.expenseInfo}>
                  <Text style={styles.expenseDescription} numberOfLines={1}>
                    {item.description}
                  </Text>
                  <Text style={styles.expensePayment}>
                    {item.paymentMethod.replace('_', ' ')}
                  </Text>
                </View>
              </View>
              
              <View style={styles.expenseRight}>
                <Text style={styles.expenseAmount}>
                  {currencyUtils.formatCurrency(item.amount)}
                </Text>
                <Text style={styles.expenseDate}>
                  {dateUtils.formatDateForDisplay(item.date)}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={styles.expenseSeparator} />}
        />
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={[commonStyles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading budget details...</Text>
      </View>
    );
  }

  if (!budgetProgress) {
    return (
      <View style={[commonStyles.container, styles.errorContainer]}>
        <MaterialIcons name="error" size={64} color={theme.colors.error} />
        <Text style={styles.errorText}>Budget not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={commonStyles.container} contentContainerStyle={commonStyles.screenPadding}>
      {renderBudgetOverview()}
      {renderSpendingStats()}
      {renderRelatedExpenses()}
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
  overviewCard: {
    marginBottom: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.lg,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: theme.spacing.md,
  },
  categoryTitle: {
    fontSize: theme.typography.fontSize.xl,
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
  progressSection: {
    marginTop: theme.spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  progressTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
  },
  progressPercentage: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.success,
  },
  warningText: {
    color: theme.colors.warning,
  },
  overBudgetText: {
    color: theme.colors.error,
  },
  successText: {
    color: theme.colors.success,
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: theme.colors.background,
    borderRadius: 6,
    marginBottom: theme.spacing.md,
  },
  progressBar: {
    height: '100%',
    borderRadius: 6,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  amountLabel: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.placeholder,
    fontWeight: theme.typography.fontWeight.medium,
  },
  amountValue: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  alertContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.md,
  },
  warningAlert: {
    backgroundColor: `${theme.colors.warning}15`,
  },
  errorAlert: {
    backgroundColor: `${theme.colors.error}15`,
  },
  alertText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    marginLeft: theme.spacing.sm,
  },
  statsCard: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  statLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholder,
    marginBottom: theme.spacing.xs,
  },
  statValue: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
  },
  projectionWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    backgroundColor: `${theme.colors.warning}15`,
    borderRadius: theme.borderRadius.sm,
    marginTop: theme.spacing.md,
  },
  projectionText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.warning,
    fontWeight: theme.typography.fontWeight.medium,
    marginLeft: theme.spacing.sm,
  },
  expensesCard: {
    marginBottom: theme.spacing.md,
  },
  emptyExpenses: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text,
    fontWeight: theme.typography.fontWeight.medium,
    marginTop: theme.spacing.sm,
  },
  emptySubtext: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholder,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  expenseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  expenseInfo: {
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  expenseDescription: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text,
    fontWeight: theme.typography.fontWeight.medium,
  },
  expensePayment: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholder,
    textTransform: 'capitalize',
    marginTop: theme.spacing.xs,
  },
  expenseRight: {
    alignItems: 'flex-end',
  },
  expenseAmount: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  expenseDate: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholder,
    marginTop: theme.spacing.xs,
  },
  expenseSeparator: {
    height: 1,
    backgroundColor: theme.colors.background,
    marginVertical: theme.spacing.xs,
  },
});

export default BudgetDetailScreen;
