/**
 * Navigation configuration for PocketBudget app
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import screens (we'll create these next)
import HomeScreen from '../screens/HomeScreen';
import AddExpenseScreen from '../screens/AddExpenseScreen';
import BudgetsScreen from '../screens/BudgetsScreen';
import ReportsScreen from '../screens/ReportsScreen';
import ExpenseDetailScreen from '../screens/ExpenseDetailScreen';
import BudgetDetailScreen from '../screens/BudgetDetailScreen';

// Import theme and icons
import { theme } from '../styles/theme';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// Type definitions for navigation
export type RootTabParamList = {
  Home: undefined;
  AddExpense: undefined;
  Budgets: undefined;
  Reports: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  ExpenseDetail: { expenseId: number };
  BudgetDetail: { budgetId: number };
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Bottom Tab Navigator Component
 */
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'AddExpense':
              iconName = 'add-circle';
              break;
            case 'Budgets':
              iconName = 'account-balance-wallet';
              break;
            case 'Reports':
              iconName = 'assessment';
              break;
            default:
              iconName = 'help';
              break;
          }

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.disabled,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.disabled,
          borderTopWidth: 1,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: theme.colors.primary,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          color: theme.colors.surface,
          fontSize: 18,
          fontWeight: '600',
        },
        headerTintColor: theme.colors.surface,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ 
          title: 'Dashboard',
          tabBarLabel: 'Home',
        }} 
      />
      <Tab.Screen 
        name="AddExpense" 
        component={AddExpenseScreen} 
        options={{ 
          title: 'Add Expense',
          tabBarLabel: 'Add',
        }} 
      />
      <Tab.Screen 
        name="Budgets" 
        component={BudgetsScreen} 
        options={{ 
          title: 'Budgets',
          tabBarLabel: 'Budgets',
        }} 
      />
      <Tab.Screen 
        name="Reports" 
        component={ReportsScreen} 
        options={{ 
          title: 'Reports',
          tabBarLabel: 'Reports',
        }} 
      />
    </Tab.Navigator>
  );
}

/**
 * Root Stack Navigator Component
 */
function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTitleStyle: {
          color: theme.colors.surface,
          fontSize: 18,
          fontWeight: '600',
        },
        headerTintColor: theme.colors.surface,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen 
        name="MainTabs" 
        component={MainTabNavigator} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="ExpenseDetail" 
        component={ExpenseDetailScreen} 
        options={({ route }) => ({ 
          title: 'Expense Details',
          headerBackTitle: 'Back',
        })} 
      />
      <Stack.Screen 
        name="BudgetDetail" 
        component={BudgetDetailScreen} 
        options={({ route }) => ({ 
          title: 'Budget Details',
          headerBackTitle: 'Back',
        })} 
      />
    </Stack.Navigator>
  );
}

/**
 * Main App Navigation Component
 */
export default function AppNavigation() {
  return (
    <NavigationContainer
      theme={{
        dark: false,
        colors: {
          primary: theme.colors.primary,
          background: theme.colors.background,
          card: theme.colors.surface,
          text: theme.colors.text,
          border: theme.colors.disabled,
          notification: theme.colors.error,
        },
        fonts: {
          regular: {
            fontFamily: 'System',
            fontWeight: '400',
          },
          medium: {
            fontFamily: 'System',
            fontWeight: '500',
          },
          bold: {
            fontFamily: 'System',
            fontWeight: '700',
          },
          heavy: {
            fontFamily: 'System',
            fontWeight: '800',
          },
        },
      }}
    >
      <RootNavigator />
    </NavigationContainer>
  );
}

// Navigation utility functions
export const navigationUtils = {
  /**
   * Reset navigation stack to specific screen
   */
  resetToScreen: (navigation: any, screenName: string) => {
    navigation.reset({
      index: 0,
      routes: [{ name: screenName }],
    });
  },

  /**
   * Navigate to expense detail screen
   */
  navigateToExpenseDetail: (navigation: any, expenseId: number) => {
    navigation.navigate('ExpenseDetail', { expenseId });
  },

  /**
   * Navigate to budget detail screen
   */
  navigateToBudgetDetail: (navigation: any, budgetId: number) => {
    navigation.navigate('BudgetDetail', { budgetId });
  },

  /**
   * Go back to previous screen
   */
  goBack: (navigation: any) => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  },

  /**
   * Navigate to specific tab
   */
  navigateToTab: (navigation: any, tabName: keyof RootTabParamList) => {
    navigation.navigate('MainTabs', { screen: tabName });
  },
};
