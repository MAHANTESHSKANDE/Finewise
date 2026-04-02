/**
 * Reports Screen - View expense reports and analytics with charts
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
  Dimensions,
  FlatList,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {
  VictoryPie,
  VictoryChart,
  VictoryLine,
  VictoryAxis
} from 'victory-native';

// Internal imports
import { theme, commonStyles, categoryColors } from '../styles/theme';
import { dateUtils, currencyUtils, errorUtils } from '../utils';
import { apiAzureExpenseRepository } from '../database/apiAzureExpenseRepository';
import { ErrorBoundary } from '../components/ErrorBoundary';
import FallbackChart from '../components/FallbackChart';
import ChartErrorFallback from '../components/ChartErrorFallback';
import { SimpleChart } from '../components/SimpleChart';
import { aiCategorizer } from '../services/aiCategorizer';
import { Expense, CategoryBreakdown, ExpenseFilter, ExpenseCategory } from '../types';

interface ReportsScreenProps {
  navigation: any;
}

interface ReportData {
  totalExpenses: number;
  categoryBreakdown: CategoryBreakdown[];
  recentExpenses: Expense[];
  monthlyTrends: Array<{ month: string; amount: number }>;
  period: 'week' | 'month' | 'year';
  dateRange: { startDate: string; endDate: string };
}

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - (theme.spacing.md * 4);

const PERIOD_OPTIONS = [
  { value: 'week' as const, label: 'This Week' },
  { value: 'month' as const, label: 'This Month' },
  { value: 'year' as const, label: 'This Year' },
];

const ReportsScreen: React.FC<ReportsScreenProps> = ({ navigation }) => {
  const [reportData, setReportData] = useState<ReportData>({
    totalExpenses: 0,
    categoryBreakdown: [],
    recentExpenses: [],
    monthlyTrends: [],
    period: 'month',
    dateRange: { startDate: '', endDate: '' },
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /**
   * Load report data for selected period
   */
  const loadReportData = async (period: 'week' | 'month' | 'year' = reportData.period) => {
    try {
      console.log('[ReportsScreen] Loading report data for period:', period);
      const dateRange = dateUtils.getDateRangeForPeriod(period);
      console.log('[ReportsScreen] Date range:', dateRange);
      
      // Load total expenses for the period
      const totalExpenses = await apiAzureExpenseRepository.getTotalExpensesByDateRange(
        dateRange.startDate,
        dateRange.endDate
      );
      console.log('[ReportsScreen] Total expenses:', totalExpenses);

      // Load category breakdown
      const breakdown = await apiAzureExpenseRepository.getExpenseStatisticsByCategory(
        dateRange.startDate,
        dateRange.endDate
      );
      console.log('[ReportsScreen] Category breakdown:', breakdown);

      // Calculate percentages and add colors
      const categoryBreakdown: CategoryBreakdown[] = breakdown.map(item => {
        const percentage = totalExpenses > 0 ? (item.total / totalExpenses) * 100 : 0;
        const color = categoryColors[item.category as keyof typeof categoryColors] || categoryColors.miscellaneous;
        
        console.log(`[ReportsScreen] Category: ${item.category}, Amount: ${item.total}, Percentage: ${percentage}%, Color: ${color}`);
        
        return {
          category: item.category as ExpenseCategory,
          amount: item.total, // Use 'total' instead of 'amount'
          percentage,
          color,
        };
      });
      console.log('[ReportsScreen] Processed category breakdown:', categoryBreakdown);

      // Load recent expenses for the period
      const recentExpenses = await apiAzureExpenseRepository.getExpensesByDateRange(
        dateRange.startDate,
        dateRange.endDate
      );
      console.log('[ReportsScreen] Recent expenses:', recentExpenses);

      // Load monthly trends if period is year
      let monthlyTrends: Array<{ month: string; amount: number }> = [];
      if (period === 'year') {
        // For now, we'll create a simple monthly breakdown for the year
        const yearStart = dateUtils.getYearStart();
        const yearEnd = dateUtils.getYearEnd();
        const yearExpenses = await apiAzureExpenseRepository.getExpensesByDateRange(yearStart, yearEnd);
        
        // Group by month
        const monthlyMap = new Map<string, number>();
        yearExpenses.forEach(expense => {
          const month = dateUtils.formatMonthYear(expense.date);
          monthlyMap.set(month, (monthlyMap.get(month) || 0) + expense.amount);
        });
        
        monthlyTrends = Array.from(monthlyMap.entries()).map(([month, amount]) => ({
          month,
          amount
        }));
        console.log('[ReportsScreen] Monthly trends:', monthlyTrends);
      }

      setReportData({
        totalExpenses,
        categoryBreakdown,
        recentExpenses: recentExpenses.slice(0, 10), // Take only first 10
        monthlyTrends,
        period,
        dateRange,
      });

    } catch (error) {
      console.error('[ReportsScreen] Error loading report data:', error);
      errorUtils.logError(error as Error, 'ReportsScreen.loadReportData');
      Alert.alert('Error', 'Failed to load report data. Please try again.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  /**
   * Handle period change
   */
  const handlePeriodChange = (period: 'week' | 'month' | 'year') => {
    setReportData(prev => ({ ...prev, period }));
    loadReportData(period);
  };

  /**
   * Handle refresh
   */
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadReportData();
  }, [reportData.period]);

  /**
   * Load data when screen focuses
   */
  useFocusEffect(
    useCallback(() => {
      loadReportData();
    }, [])
  );

  /**
   * Navigate to expense detail
   */
  const handleExpensePress = (expense: Expense) => {
    if (expense.id) {
      navigation.navigate('ExpenseDetail', { expenseId: expense.id });
    }
  };

  /**
   * Render period selector
   */
  const renderPeriodSelector = () => (
    <View style={[commonStyles.card, styles.periodSelector]}>
      <Text style={styles.sectionTitle}>Report Period</Text>
      <View style={styles.periodButtons}>
        {PERIOD_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.periodButton,
              reportData.period === option.value && styles.activePeriodButton,
            ]}
            onPress={() => handlePeriodChange(option.value)}
          >
            <Text style={[
              styles.periodButtonText,
              reportData.period === option.value && styles.activePeriodButtonText,
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.dateRangeText}>
        {dateUtils.formatDateForDisplay(reportData.dateRange.startDate)} - {' '}
        {dateUtils.formatDateForDisplay(reportData.dateRange.endDate)}
      </Text>
    </View>
  );

  /**
   * Render summary stats
   */
  const renderSummaryStats = () => {
    const topCategory = reportData.categoryBreakdown[0];
    const averageDaily = reportData.totalExpenses / Math.max(1, dateUtils.getDaysBetween(
      reportData.dateRange.startDate,
      reportData.dateRange.endDate
    ));

    return (
      <View style={[commonStyles.card, styles.summaryCard]}>
        <Text style={styles.sectionTitle}>Summary</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Spent</Text>
            <Text style={styles.summaryValue}>
              {currencyUtils.formatCurrency(reportData.totalExpenses)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Daily Average</Text>
            <Text style={styles.summaryValue}>
              {currencyUtils.formatCurrency(averageDaily)}
            </Text>
          </View>
        </View>
        {topCategory && (
          <View style={styles.topCategoryContainer}>
            <Text style={styles.summaryLabel}>Top Category</Text>
            <View style={styles.topCategoryItem}>
              <View style={[styles.categoryDot, { backgroundColor: topCategory.color }]} />
              <Text style={styles.topCategoryName}>
                {aiCategorizer.getCategoryDisplayName(topCategory.category)}
              </Text>
              <Text style={styles.topCategoryAmount}>
                {currencyUtils.formatCurrency(topCategory.amount)} ({Math.round(topCategory.percentage)}%)
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  /**
   * Render category breakdown chart
   */
  const renderCategoryChart = () => {
    if (reportData.categoryBreakdown.length === 0) {
      return (
        <View style={[commonStyles.card, styles.chartCard]}>
          <Text style={styles.sectionTitle}>Category Breakdown</Text>
          <View style={styles.emptyChart}>
            <MaterialIcons name="pie-chart" size={64} color={theme.colors.disabled} />
            <Text style={styles.emptyChartText}>No expenses in this period</Text>
          </View>
        </View>
      );
    }

    // Prepare data for chart
    const topCategories = reportData.categoryBreakdown.slice(0, 5);
    
    // Validate chart data
    const validCategories = topCategories.filter(item => 
      item && 
      typeof item.amount === 'number' && 
      !isNaN(item.amount) && 
      item.amount >= 0 &&
      typeof item.percentage === 'number' && 
      !isNaN(item.percentage) && 
      item.percentage >= 0 &&
      item.category &&
      item.color
    );

    console.log('[ReportsScreen] Valid categories for chart:', validCategories.length, 'out of', topCategories.length);
    
    if (validCategories.length === 0) {
      return (
        <View style={[commonStyles.card, styles.chartCard]}>
          <Text style={styles.sectionTitle}>Category Breakdown</Text>
          <View style={styles.emptyChart}>
            <MaterialIcons name="error" size={64} color={theme.colors.error} />
            <Text style={styles.emptyChartText}>Invalid chart data</Text>
          </View>
        </View>
      );
    }
    
    // Use SimpleChart as primary option (more reliable)
    const simpleChartData = validCategories.map(item => ({
      category: aiCategorizer.getCategoryDisplayName(item.category),
      amount: item.amount,
      percentage: item.percentage,
      color: item.color,
    }));

    console.log('[ReportsScreen] Chart data:', simpleChartData);

    return (
      <View style={[commonStyles.card, styles.chartCard]}>
        <SimpleChart 
          data={simpleChartData}
          title="Category Breakdown"
          height={240}
        />
      </View>
    );
  };

  /**
   * Render monthly trends chart (for yearly view)
   */
  const renderTrendsChart = () => {
    if (reportData.period !== 'year' || reportData.monthlyTrends.length === 0) {
      return null;
    }

    const chartData = reportData.monthlyTrends.map(item => ({
      x: item.month,
      y: item.amount,
    }));

    // Create simple trend visualization
    const maxAmount = Math.max(...reportData.monthlyTrends.map(item => item.amount));
    const simpleTrendData = reportData.monthlyTrends.map(item => ({
      month: item.month.substring(0, 3), // Shortened month names
      amount: item.amount,
      percentage: maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0,
    }));

    return (
      <View style={[commonStyles.card, styles.chartCard]}>
        <Text style={styles.sectionTitle}>Monthly Trends</Text>
        
        {/* Simple bar chart for monthly trends */}
        <View style={styles.trendContainer}>
          {simpleTrendData.map((item, index) => (
            <View key={index} style={styles.trendBarContainer}>
              <Text style={styles.trendMonth}>{item.month}</Text>
              <View style={styles.trendBarBackground}>
                <View 
                  style={[
                    styles.trendBar, 
                    { 
                      height: `${Math.max(item.percentage, 5)}%`,
                      backgroundColor: theme.colors.primary 
                    }
                  ]} 
                />
              </View>
              <Text style={styles.trendAmount}>₹{item.amount.toFixed(0)}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  /**
   * Render recent transactions
   */
  const renderRecentTransactions = () => (
    <View style={[commonStyles.card, styles.transactionsCard]}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {reportData.recentExpenses.length > 0 && (
          <TouchableOpacity onPress={() => navigation.navigate('Home')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        )}
      </View>

      {reportData.recentExpenses.length === 0 ? (
        <View style={styles.emptyTransactions}>
          <MaterialIcons name="receipt-long" size={48} color={theme.colors.disabled} />
          <Text style={styles.emptyText}>No transactions in this period</Text>
        </View>
      ) : (
        <FlatList
          data={reportData.recentExpenses}
          keyExtractor={(item) => item.id?.toString() || ''}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.transactionItem}
              onPress={() => handleExpensePress(item)}
              activeOpacity={0.7}
            >
              <View style={styles.transactionLeft}>
                <View style={[
                  styles.categoryDot,
                  { backgroundColor: categoryColors[item.category] || categoryColors.miscellaneous }
                ]} />
                <View>
                  <Text style={styles.transactionDescription} numberOfLines={1}>
                    {item.description}
                  </Text>
                  <Text style={styles.transactionCategory}>
                    {aiCategorizer.getCategoryDisplayName(item.category)} • {item.paymentMethod.replace('_', ' ')}
                  </Text>
                </View>
              </View>
              <View style={styles.transactionRight}>
                <Text style={styles.transactionAmount}>
                  {currencyUtils.formatCurrency(item.amount)}
                </Text>
                <Text style={styles.transactionDate}>
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

  if (isLoading) {
    return (
      <View style={[commonStyles.container, styles.loadingContainer]}>
        <MaterialIcons name="hourglass-empty" size={48} color={theme.colors.disabled} />
        <Text style={styles.loadingText}>Loading reports...</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary
      fallback={ChartErrorFallback}
    >
      <ScrollView
        style={commonStyles.container}
        contentContainerStyle={commonStyles.screenPadding}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {renderPeriodSelector()}
        {renderSummaryStats()}
        {renderCategoryChart()}
        {renderTrendsChart()}
        {renderRecentTransactions()}
      </ScrollView>
    </ErrorBoundary>
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
  periodSelector: {
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
  viewAllText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  periodButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  periodButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.disabled,
    alignItems: 'center',
  },
  activePeriodButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  periodButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text,
  },
  activePeriodButtonText: {
    color: theme.colors.surface,
  },
  dateRangeText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholder,
    textAlign: 'center',
  },
  summaryCard: {
    marginBottom: theme.spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholder,
    marginBottom: theme.spacing.xs,
  },
  summaryValue: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
  },
  topCategoryContainer: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.background,
    paddingTop: theme.spacing.md,
  },
  topCategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topCategoryName: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text,
    fontWeight: theme.typography.fontWeight.medium,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  topCategoryAmount: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  chartCard: {
    marginBottom: theme.spacing.md,
  },
  chartContainer: {
    alignItems: 'center',
  },
  emptyChart: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyChartText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.placeholder,
    marginTop: theme.spacing.sm,
  },
  legendContainer: {
    marginTop: theme.spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: theme.spacing.sm,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: theme.spacing.sm,
  },
  legendLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text,
    flex: 1,
  },
  legendValue: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text,
    fontWeight: theme.typography.fontWeight.medium,
  },
  moreCategories: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholder,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  transactionsCard: {
    marginBottom: theme.spacing.md,
  },
  emptyTransactions: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.placeholder,
    marginTop: theme.spacing.sm,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionDescription: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text,
    fontWeight: theme.typography.fontWeight.medium,
    maxWidth: 160,
  },
  transactionCategory: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholder,
    textTransform: 'capitalize',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  transactionDate: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholder,
  },
  fallbackContainer: {
    padding: theme.spacing.sm,
    alignItems: 'center',
  },
  fallbackText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.placeholder,
  },
  victoryContainer: {
    marginTop: theme.spacing.md,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.background,
    paddingTop: theme.spacing.md,
  },
  chartToggleText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  errorText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.error,
    textAlign: 'center',
    padding: theme.spacing.md,
  },
  trendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 150,
    marginVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
  },
  trendBarContainer: {
    alignItems: 'center',
    flex: 1,
    maxWidth: 60,
  },
  trendMonth: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  trendBarBackground: {
    width: 20,
    height: 100,
    backgroundColor: theme.colors.background,
    borderRadius: 2,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  trendBar: {
    width: '100%',
    borderRadius: 2,
    minHeight: 5,
  },
  trendAmount: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
});

export default ReportsScreen;
