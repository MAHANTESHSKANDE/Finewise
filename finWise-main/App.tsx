/**
 * Main App Component - Entry point for PocketBudget React Native app
 */

import React, { useEffect, useState } from 'react';
import { View, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Internal imports
import AppNavigation from './src/navigation/AppNavigation';
import { theme } from './src/styles/theme';
import { databaseManager } from './src/database';
import { errorUtils } from './src/utils';
import { ErrorBoundary } from './src/components/ErrorBoundary';

const App: React.FC = () => {
  const [isAppReady, setIsAppReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  /**
   * Initialize the app
   */
  useEffect(() => {
    initializeApp();
  }, []);

  /**
   * Initialize database and app components
   */
  const initializeApp = async () => {
    try {
      console.log('[App] Starting app initialization...');

      // Initialize database
      await databaseManager.initialize();
      console.log('[App] Database initialized successfully');

      // Any other initialization tasks would go here
      // For example: loading user preferences, checking for updates, etc.

      setIsAppReady(true);
      console.log('[App] App initialization completed');

    } catch (error) {
      console.error('[App] Error during app initialization:', error);
      errorUtils.logError(error as Error, 'App.initializeApp');
      
      const errorMessage = errorUtils.getUserFriendlyMessage(error as Error);
      setDbError(errorMessage);

      // Show error alert
      Alert.alert(
        'Initialization Error',
        `Failed to initialize the app: ${errorMessage}`,
        [
          {
            text: 'Retry',
            onPress: () => {
              setDbError(null);
              initializeApp();
            },
          },
          {
            text: 'Exit',
            style: 'destructive',
            onPress: () => {
              // In a real app, you might want to exit gracefully
              console.log('[App] User chose to exit');
            },
          },
        ]
      );
    }
  };

  /**
   * Render loading screen
   */
  const renderLoadingScreen = () => (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    }}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );

  /**
   * Render error screen
   */
  const renderErrorScreen = () => (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      padding: theme.spacing.xl,
    }}>
      {/* Error content would be rendered here if needed */}
    </View>
  );

  // Show loading screen while app is initializing
  if (!isAppReady) {
    return (
      <SafeAreaProvider>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={theme.colors.background}
          translucent={false}
        />
        {dbError ? renderErrorScreen() : renderLoadingScreen()}
      </SafeAreaProvider>
    );
  }

  // Render main app
  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={theme.colors.surface}
        translucent={false}
      />
      <ErrorBoundary>
        <AppNavigation />
      </ErrorBoundary>
    </SafeAreaProvider>
  );
};

export default App;
