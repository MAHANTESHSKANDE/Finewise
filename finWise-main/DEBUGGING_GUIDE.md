# PocketBudget Debugging Guide

## Issues Identified

### 1. Budget Creation Not Working

#### Potential Causes:
1. **Database initialization issues**
2. **Form validation errors**
3. **SQLite query problems**
4. **Date formatting issues**

#### Debug Steps:

1. **Check Console Logs**
   - Open React Native debugger or use `react-native log-android`/`react-native log-ios`
   - Look for logs starting with `[BudgetsScreen]` when creating a budget

2. **Common Issues & Solutions**:

   **Issue**: Form validation failing
   ```bash
   # Check console for:
   [BudgetsScreen] Form validation failed
   [BudgetsScreen] Form errors: {...}
   ```
   **Solution**: Verify form data is properly filled

   **Issue**: Database not initialized
   ```bash
   # Check console for:
   [Database] Failed to initialize database
   ```
   **Solution**: Restart app, check SQLite dependencies

   **Issue**: Date formatting problems
   ```bash
   # Check console for:
   [BudgetsScreen] Validating dates: undefined to undefined
   ```
   **Solution**: Verify date picker values are set

### 2. Reports Not Working

#### Potential Causes:
1. **Victory Native chart data formatting**
2. **Missing expense data**
3. **Chart rendering issues**
4. **SVG dependencies not linked**

#### Debug Steps:

1. **Check Console Logs**
   - Look for logs starting with `[ReportsScreen]`
   - Verify data is being loaded correctly

2. **Common Issues & Solutions**:

   **Issue**: No chart data
   ```bash
   # Check console for:
   [ReportsScreen] Category breakdown: []
   [ReportsScreen] Pie chart data: []
   ```
   **Solution**: Add some expense data first

   **Issue**: Victory Native not rendering
   ```bash
   # Check for SVG/Victory Native errors
   ```
   **Solution**: 
   ```bash
   cd ios && pod install  # For iOS
   npx react-native run-android --reset-cache  # For Android
   ```

## Quick Fixes

### 1. Reset Database
```javascript
// Add to App.tsx for testing
import { databaseManager } from './src/database';

// In initializeApp function, add:
await databaseManager.dropAllTables();
await databaseManager.initializeDatabase();
```

### 2. Clear Metro Cache
```bash
npx react-native start --reset-cache
```

### 3. Reinstall Dependencies
```bash
rm -rf node_modules
npm install
cd ios && pod install  # iOS only
```

### 4. Check Native Dependencies
```bash
npx react-native config
npx react-native doctor
```

## Testing Steps

### 1. Test Budget Creation
1. Open app
2. Navigate to Budgets tab
3. Click "Create" button
4. Fill form with:
   - Category: Food
   - Amount: 100
   - Start Date: Today
   - End Date: Tomorrow
5. Click "Create Budget"
6. Check console logs for any errors

### 2. Test Reports
1. First add some expenses in Home tab
2. Navigate to Reports tab
3. Check if pie chart renders
4. Try switching between Week/Month/Year
5. Check console logs for data loading

## Console Log Commands

### View logs during development:
```bash
# Android
npx react-native log-android

# iOS  
npx react-native log-ios

# Or use Flipper/React Native Debugger
```

### Key log patterns to look for:
- `[BudgetsScreen] Starting budget creation...`
- `[BudgetsScreen] Form validation failed`
- `[Database] Error creating budget:`
- `[ReportsScreen] Loading report data`
- `[ReportsScreen] Pie chart data:`

## Manual Testing Checklist

### Budget Creation:
- [ ] Modal opens when clicking "Create"
- [ ] Category selection works
- [ ] Date pickers work
- [ ] Amount input accepts numbers
- [ ] Form validation shows errors
- [ ] Success message appears
- [ ] Budget appears in list

### Reports:
- [ ] Charts render without errors
- [ ] Data loads for different periods
- [ ] Category breakdown shows
- [ ] Recent transactions display
- [ ] Navigation between periods works

## If Issues Persist

1. **Create minimal test data**:
   ```javascript
   // Add to database initialization
   await expenseRepository.createExpense({
     amount: 50,
     description: "Test expense",
     date: dateUtils.getTodayString(),
     category: "food",
     paymentMethod: "cash"
   });
   ```

2. **Check React Native version compatibility**:
   - Victory Native 41.x requires RN 0.70+
   - SQLite Storage 6.x requires RN 0.60+

3. **Enable debugging**:
   ```javascript
   // In database/index.ts
   SQLite.DEBUG(true);  // Enable SQLite debugging
   ```

4. **Contact support with**:
   - Complete console logs
   - React Native version
   - Device/simulator info
   - Steps to reproduce
