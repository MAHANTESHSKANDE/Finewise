/**
 * Utility to help diagnose database issues in the app
 */

import { Alert } from 'react-native';
import { databaseManager } from '../database';
import { errorUtils } from '../utils';

export class DatabaseDiagnostic {
  /**
   * Run diagnostic tests on the database
   */
  static async runDiagnostics(): Promise<boolean> {
    try {
      console.log('🔍 Running database diagnostics...');
      
      // 1. Check database connection
      console.log('1. Testing database connection...');
      const dbInfo = await databaseManager.debugDatabase();
      console.log('Database connection status:', dbInfo.success ? 'SUCCESS' : 'FAILED');
      
      // 2. Test data persistence
      console.log('2. Testing data persistence...');
      const persistenceResult = await databaseManager.testPersistence();
      console.log('Persistence test:', persistenceResult ? 'SUCCESS' : 'FAILED');
      
      // Log comprehensive results
      console.log('=== DIAGNOSTIC RESULTS ===');
      console.log('Database functional:', dbInfo.success);
      console.log('Data persists correctly:', persistenceResult);
      console.log('Database status message:', dbInfo.message);
      console.log('Tables found:', dbInfo.stats?.tables || 'None');
      
      if (!dbInfo.success || !persistenceResult) {
        console.error('Database diagnostic failed:');
        console.error('Issues found:', {
          connectionIssue: !dbInfo.success,
          persistenceIssue: !persistenceResult,
          missingTables: dbInfo.stats?.missingTables,
          error: dbInfo.stats?.error
        });
        
        // Show alert with recovery options
        Alert.alert(
          'Database Diagnostic Failed',
          'The app detected issues with the database. Would you like to try fixing the issues?',
          [
            {
              text: 'Fix Issues',
              onPress: () => this.attemptRecovery()
            },
            {
              text: 'Cancel',
              style: 'cancel'
            }
          ]
        );
        
        return false;
      }
      
      console.log('✅ Database diagnostics completed successfully!');
      return true;
      
    } catch (error) {
      console.error('Error during database diagnostics:', error);
      errorUtils.logError(error as Error, 'DatabaseDiagnostic.runDiagnostics');
      return false;
    }
  }
  
  /**
   * Attempt to recover from database issues
   */
  static async attemptRecovery(): Promise<boolean> {
    try {
      console.log('🔧 Attempting database recovery...');
      
      // 1. Close any existing connections
      await databaseManager.close();
      console.log('Closed existing database connections');
      
      // 2. Force reinitialize the database
      await databaseManager.initialize();
      console.log('Reinitialized database');
      
      // 3. Verify tables are created
      const dbInfo = await databaseManager.debugDatabase();
      
      if (dbInfo.success) {
        console.log('✅ Database recovery successful!');
        Alert.alert('Success', 'Database issues have been fixed. Please try again.');
        return true;
      } else {
        console.error('Database recovery failed:', dbInfo.message);
        Alert.alert('Recovery Failed', 'Could not fix database issues. Please restart the app.');
        return false;
      }
      
    } catch (error) {
      console.error('Error during database recovery:', error);
      errorUtils.logError(error as Error, 'DatabaseDiagnostic.attemptRecovery');
      
      Alert.alert(
        'Recovery Failed',
        'Could not fix database issues automatically. Please try reinstalling the app.'
      );
      
      return false;
    }
  }
}

export default DatabaseDiagnostic;
