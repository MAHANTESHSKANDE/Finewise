/**
 * Test Azure SQL Integration
 */

const { azureBudgetRepository } = require('./src/database/azureBudgetRepository');
const { azureExpenseRepository } = require('./src/database/azureExpenseRepository');

async function testAzureIntegration() {
  console.log('🔍 Testing Azure SQL Integration...\n');

  try {
    // Test budget repository
    console.log('📊 Testing Budget Repository...');
    const budgets = await azureBudgetRepository.getAllBudgets();
    console.log(`✅ Found ${budgets.length} budgets`);

    const budgetProgress = await azureBudgetRepository.getAllBudgetProgress();
    console.log(`✅ Found ${budgetProgress.length} budget progress records`);

    // Test expense repository
    console.log('\n💰 Testing Expense Repository...');
    const expenses = await azureExpenseRepository.getAllExpenses();
    console.log(`✅ Found ${expenses.length} expenses`);

    const recentExpenses = await azureExpenseRepository.getRecentExpenses(5);
    console.log(`✅ Found ${recentExpenses.length} recent expenses`);

    // Test date range queries
    console.log('\n📅 Testing Date Range Queries...');
    const today = new Date().toISOString().split('T')[0];
    const todayExpenses = await azureExpenseRepository.getTotalExpensesByDateRange(today, today);
    console.log(`✅ Today's total expenses: $${todayExpenses}`);

    const stats = await azureExpenseRepository.getExpenseStatisticsByCategory();
    console.log(`✅ Found statistics for ${stats.length} categories`);

    console.log('\n🎉 All Azure SQL integration tests passed!');
    
    // Print sample data if available
    if (expenses.length > 0) {
      console.log('\n📋 Sample Expense:');
      console.log(JSON.stringify(expenses[0], null, 2));
    }

    if (budgets.length > 0) {
      console.log('\n📋 Sample Budget:');
      console.log(JSON.stringify(budgets[0], null, 2));
    }

  } catch (error) {
    console.error('❌ Azure SQL integration test failed:');
    console.error('Error:', error.message);
    
    if (error.message.includes('Login failed')) {
      console.log('\n🔧 Troubleshooting:');
      console.log('1. Check if Azure SQL authentication is properly configured');
      console.log('2. Verify the connection credentials in azureConfig.ts');
      console.log('3. Ensure Azure SQL firewall allows your IP address');
    }
  }
}

// Run the test
testAzureIntegration().then(() => {
  console.log('\nIntegration test completed.');
  process.exit(0);
}).catch((error) => {
  console.error('Integration test failed:', error);
  process.exit(1);
});
