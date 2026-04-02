/**
 * Home Screen - Dashboard with expense overview and budget progress
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  FlatList,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// Internal imports
import { theme, commonStyles, categoryColors } from '../styles/theme';
import { dateUtils, currencyUtils, errorUtils } from '../utils';
import { apiAzureBudgetRepository } from '../database/apiAzureBudgetRepository';
import { apiAzureExpenseRepository } from '../database/apiAzureExpenseRepository';
import { Expense, BudgetProgress } from '../types';
import { navigationUtils } from '../navigation/AppNavigation';
import { NetworkTester } from '../components/NetworkTester';

// TEMPORARY: Add exact curl equivalent test
const testDirectConnection = async () => {
  console.log('🧪 [DIRECT TEST] Testing exact curl equivalent...');
  
  try {
    // Test 1: Health check (exact curl equivalent)
    console.log('📊 Testing health endpoint...');
    const healthResponse = await fetch('http://localhost:3000/health', {
      method: 'GET',
      headers: {
        'Accept': '*/*',
        'User-Agent': 'PocketBudget-RN/1.0'
      }
    });
    console.log(`✅ Health Response: ${healthResponse.status}`);
    const healthData = await healthResponse.json();
    console.log('Health Data:', healthData);

    // Test 2: Budget progress (exact curl equivalent)
    console.log('📋 Testing budget progress...');
    const budgetResponse = await fetch('http://localhost:3000/api/budgets/progress', {
      method: 'GET',
      headers: {
        'Accept': '*/*',
        'User-Agent': 'PocketBudget-RN/1.0'
      }
    });
    console.log(`✅ Budget Response: ${budgetResponse.status}`);
    const budgetData = await budgetResponse.json();
    console.log('Budget Data:', budgetData);

    console.log('🎉 All direct tests passed!');
  } catch (error) {
    console.error('❌ Direct test failed:', error);
  }
};

interface HomeScreenProps {
  navigation: any;
}

interface DashboardStats {
  todayExpenses: number;
  weekExpenses: number;
  monthExpenses: number;
  recentExpenses: Expense[];
  budgetProgress: BudgetProgress[];
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [dashboardData, setDashboardData] = useState<DashboardStats>({
    todayExpenses: 0,
    weekExpenses: 0,
    monthExpenses: 0,
    recentExpenses: [],
    budgetProgress: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /**
   * Run database diagnostic when there's an error
   */
  const runDatabaseDiagnostic = async () => {
    try {
      // Import dynamically to avoid circular dependencies
      const { default: DatabaseDiagnostic } = await import('../utils/DatabaseDiagnostic');
      return await DatabaseDiagnostic.runDiagnostics();
    } catch (error) {
      console.error('[HomeScreen] Failed to run diagnostics:', error);
      return false;
    }
  };

  /**
   * Load dashboard data
   */
  const loadDashboardData = async () => {
    try {
      console.log('[HomeScreen] Loading dashboard data...');
      
      // TEMPORARY: Test direct network connection first
      console.log('[HomeScreen] Testing direct network connection...');
      await testDirectConnection();
      console.log('[HomeScreen] ✅ Direct network test completed');
      
      const today = dateUtils.getTodayString();
      const weekRange = dateUtils.getDateRangeForPeriod('week');
      const monthRange = dateUtils.getDateRangeForPeriod('month');

      // Load budget progress with better error handling
      let budgetProgress: BudgetProgress[] = [];
      try {
        budgetProgress = await apiAzureBudgetRepository.getAllBudgetProgress();
        console.log('[HomeScreen] Budget progress loaded successfully');
      } catch (budgetError) {
        console.error('[HomeScreen] Error loading budget progress:', budgetError);
        budgetProgress = []; // Fallback to empty array
      }

      // Load expense statistics with better error handling
      let todayExpenses = 0, weekExpenses = 0, monthExpenses = 0;
      try {
        [todayExpenses, weekExpenses, monthExpenses] = await Promise.all([
          apiAzureExpenseRepository.getTotalExpensesByDateRange(today, today),
          apiAzureExpenseRepository.getTotalExpensesByDateRange(weekRange.startDate, weekRange.endDate),
          apiAzureExpenseRepository.getTotalExpensesByDateRange(monthRange.startDate, monthRange.endDate),
        ]);
        console.log('[HomeScreen] Expense statistics loaded successfully');
      } catch (expenseError) {
        console.error('[HomeScreen] Error loading expense statistics:', expenseError);
        todayExpenses = weekExpenses = monthExpenses = 0; // Fallback to zeros
      }

      // Load recent expenses with better error handling
      let recentExpenses: Expense[] = [];
      try {
        recentExpenses = await apiAzureExpenseRepository.getRecentExpenses(5);
        console.log('[HomeScreen] Recent expenses loaded successfully');
      } catch (recentError) {
        console.error('[HomeScreen] Error loading recent expenses:', recentError);
        // Continue with empty array instead of failing completely
      }
      
      setDashboardData({
        todayExpenses,
        weekExpenses,
        monthExpenses,
        recentExpenses,
        budgetProgress,
      });
      
      console.log('[HomeScreen] Dashboard data loaded successfully');

    } catch (error) {
      console.error('[HomeScreen] Error loading dashboard data:', error);
      errorUtils.logError(error as Error, 'HomeScreen.loadDashboardData');
      
      // Show error and offer to run diagnostic
      Alert.alert(
        'Dashboard Error',
        'Failed to load dashboard data. Would you like to run diagnostics?',
        [
          {
            text: 'Run Diagnostic',
            onPress: async () => {
              const diagnosticResult = await runDatabaseDiagnostic();
              if (diagnosticResult) {
                // Try loading again if diagnostic was successful
                loadDashboardData();
              }
            }
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
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
    loadDashboardData();
  }, []);

  /**
   * Navigate to expense detail
   */
  const handleExpensePress = (expense: Expense) => {
    if (expense.id) {
      navigationUtils.navigateToExpenseDetail(navigation, expense.id);
    }
  };

  /**
   * Navigate to budget detail
   */
  const handleBudgetPress = (progress: BudgetProgress) => {
    if (progress.budget.id) {
      navigationUtils.navigateToBudgetDetail(navigation, progress.budget.id);
    }
  };

  /**
   * Load data when screen focuses
   */
  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [])
  );

  /**
   * Render expense statistics card
   */
  const renderStatsCard = () => (
    <View style={[commonStyles.card, styles.statsCard]}>
      <Text style={styles.cardTitle}>Spending Overview</Text>
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Today</Text>
          <Text style={styles.statValue}>
            {currencyUtils.formatCurrency(dashboardData.todayExpenses)}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>This Week</Text>
          <Text style={styles.statValue}>
            {currencyUtils.formatCurrency(dashboardData.weekExpenses)}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>This Month</Text>
          <Text style={styles.statValue}>
            {currencyUtils.formatCurrency(dashboardData.monthExpenses)}
          </Text>
        </View>
      </View>
    </View>
  );

  /**
   * Render recent expenses card
   */
  const renderRecentExpenses = () => (
    <View style={[commonStyles.card, styles.recentExpensesCard]}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Recent Expenses</Text>
        <TouchableOpacity onPress={() => navigationUtils.navigateToTab(navigation, 'Reports')}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>
      {dashboardData.recentExpenses.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="receipt-long" size={48} color={theme.colors.disabled} />
          <Text style={styles.emptyText}>No expenses yet</Text>
          <Text style={styles.emptySubtext}>Tap the + tab to add your first expense</Text>
        </View>
      ) : (
        <FlatList
          data={dashboardData.recentExpenses}
          keyExtractor={(item) => item.id?.toString() || ''}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.expenseItem}
              onPress={() => handleExpensePress(item)}
              activeOpacity={0.7}
            >
              <View style={styles.expenseLeft}>
                <View style={[styles.categoryDot, { backgroundColor: categoryColors[item.category] || categoryColors.miscellaneous }]} />
                <View>
                  <Text style={styles.expenseDescription} numberOfLines={1}>
                    {item.description}
                  </Text>
                  <Text style={styles.expenseCategory}>{item.category}</Text>
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
        />
      )}
    </View>
  );

  /**
   * Render budget progress card
   */
  const renderBudgetProgress = () => (
    <View style={[commonStyles.card, styles.budgetCard]}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Budget Progress</Text>
        <TouchableOpacity onPress={() => navigationUtils.navigateToTab(navigation, 'Budgets')}>
          <Text style={styles.viewAllText}>Manage</Text>
        </TouchableOpacity>
      </View>
      {dashboardData.budgetProgress.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="savings" size={48} color={theme.colors.disabled} />
          <Text style={styles.emptyText}>No budgets set</Text>
          <Text style={styles.emptySubtext}>Create budgets to track your spending</Text>
        </View>
      ) : (
        <FlatList
          data={dashboardData.budgetProgress.slice(0, 3)} // Show only top 3
          keyExtractor={(item) => item.budget.id?.toString() || ''}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.budgetItem}
              onPress={() => handleBudgetPress(item)}
              activeOpacity={0.7}
            >
              <View style={styles.budgetHeader}>
                <Text style={styles.budgetCategory}>{item.budget.category}</Text>
                <Text style={[
                  styles.budgetPercentage,
                  item.isWarning && styles.warningText,
                  item.isOverBudget && styles.errorText,
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
              <View style={styles.budgetFooter}>
                <Text style={styles.budgetSpent}>
                  {currencyUtils.formatCurrency(item.spent)} spent
                </Text>
                <Text style={styles.budgetTotal}>
                  of {currencyUtils.formatCurrency(item.budget.amount)}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          scrollEnabled={false}
        />
      )}
    </View>
  );

  /**
   * Render quick actions
   */
  const renderQuickActions = () => (
    <View style={[commonStyles.card, styles.quickActionsCard]}>
      <Text style={styles.cardTitle}>Quick Actions</Text>
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigationUtils.navigateToTab(navigation, 'AddExpense')}
          activeOpacity={0.7}
        >
          <MaterialIcons name="add-circle" size={32} color={theme.colors.primary} />
          <Text style={styles.actionText}>Add Expense</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigationUtils.navigateToTab(navigation, 'Budgets')}
          activeOpacity={0.7}
        >
          <MaterialIcons name="savings" size={32} color={theme.colors.primary} />
          <Text style={styles.actionText}>Set Budget</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigationUtils.navigateToTab(navigation, 'Reports')}
          activeOpacity={0.7}
        >
          <MaterialIcons name="assessment" size={32} color={theme.colors.primary} />
          <Text style={styles.actionText}>View Reports</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[commonStyles.container, styles.loadingContainer]}>
        <MaterialIcons name="hourglass-empty" size={48} color={theme.colors.disabled} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={commonStyles.container}
      contentContainerStyle={commonStyles.screenPadding}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <NetworkTester />
      {renderStatsCard()}
      {renderRecentExpenses()}
      {renderBudgetProgress()}
      {renderQuickActions()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  statsCard: {
    marginBottom: theme.spacing.md,
  },
  cardTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  viewAllText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
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
  recentExpensesCard: {
    marginBottom: theme.spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
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
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background,
  },
  expenseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: theme.spacing.sm,
  },
  expenseDescription: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text,
    fontWeight: theme.typography.fontWeight.medium,
    maxWidth: 150,
  },
  expenseCategory: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholder,
    textTransform: 'capitalize',
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
  },
  budgetCard: {
    marginBottom: theme.spacing.md,
  },
  budgetItem: {
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  budgetCategory: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text,
    fontWeight: theme.typography.fontWeight.medium,
    textTransform: 'capitalize',
  },
  budgetPercentage: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.success,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  warningText: {
    color: theme.colors.warning,
  },
  errorText: {
    color: theme.colors.error,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: theme.colors.background,
    borderRadius: 3,
    marginBottom: theme.spacing.xs,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  budgetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetSpent: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text,
  },
  budgetTotal: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholder,
  },
  quickActionsCard: {
    marginBottom: theme.spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: theme.spacing.sm,
  },
  actionText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text,
    fontWeight: theme.typography.fontWeight.medium,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
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
});

export default HomeScreen;
