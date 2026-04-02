/**
 * Direct API Test - Exact replica of curl commands
 */

export const testDirectApiCalls = async () => {
  console.log('🧪 Starting direct API tests...');
  
  // Test 1: Health check (same as: curl -s http://localhost:3000/health)
  try {
    console.log('📊 Testing health endpoint...');
    const healthResponse = await fetch('http://localhost:3000/health', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    console.log(`Health Response Status: ${healthResponse.status}`);
    const healthData = await healthResponse.json();
    console.log('Health Data:', healthData);
  } catch (error) {
    console.error('❌ Health test failed:', error);
  }

  // Test 2: Budget progress (same as: curl -s http://localhost:3000/api/budgets/progress)
  try {
    console.log('📋 Testing budget progress endpoint...');
    const budgetResponse = await fetch('http://localhost:3000/api/budgets/progress', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    console.log(`Budget Response Status: ${budgetResponse.status}`);
    const budgetData = await budgetResponse.json();
    console.log('Budget Progress Data:', budgetData);
  } catch (error) {
    console.error('❌ Budget progress test failed:', error);
  }

  // Test 3: All budgets (same as: curl -s http://localhost:3000/api/budgets)
  try {
    console.log('💰 Testing all budgets endpoint...');
    const allBudgetsResponse = await fetch('http://localhost:3000/api/budgets', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    console.log(`All Budgets Response Status: ${allBudgetsResponse.status}`);
    const allBudgetsData = await allBudgetsResponse.json();
    console.log('All Budgets Data:', allBudgetsData);
  } catch (error) {
    console.error('❌ All budgets test failed:', error);
  }

  console.log('🏁 Direct API tests completed!');
};
