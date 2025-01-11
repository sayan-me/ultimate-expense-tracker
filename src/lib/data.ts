// Personal Mode Data
export async function getCurrentBalance(): Promise<number> {
  try {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    return 5000;
  } catch (error: unknown) {
    console.error('Balance fetch error:', error);
    throw new Error('Failed to fetch balance');
  }
}

export async function getMonthlySpendData() {
  try {
    await new Promise(resolve => setTimeout(resolve, 100));
    return {
      monthlySpend: 2500,
      monthlyBudget: 4000
    };
  } catch (error: unknown) {
    console.error('Monthly spend fetch error:', error);
    throw new Error('Failed to fetch monthly spend data');
  }
}

export async function getRecentExpenses() {
  try {
    await new Promise(resolve => setTimeout(resolve, 100));
    return [
      {
        id: "1",
        date: new Date("2024-01-04T00:00:00Z"),
        amount: 42.50,
        category: "Food & Dining",
      description: "Lunch at Subway"
    }
    // ... other expenses
  ]
  } catch (error: unknown) {
    console.error('Recent expenses fetch error:', error);
    throw new Error('Failed to fetch recent expenses');
  }
}

// Group Mode Data
export async function getGroupStats() {
  try {
    await new Promise(resolve => setTimeout(resolve, 100));
    return {
      totalSpending: 1500,
      monthlyBudget: 2000,
      categories: [
      { name: 'Food', amount: 500 },
      { name: 'Transport', amount: 300 }
    ]
    }
  } catch (error: unknown) {
    console.error('Group stats fetch error:', error);
    throw new Error('Failed to fetch group stats');
  }
}

export async function getOutstandingBalances() {
  try {
    await new Promise(resolve => setTimeout(resolve, 100));
    return {
      balances: [
        { memberId: '1', memberName: 'Alice', amount: 50 },
      { memberId: '2', memberName: 'Bob', amount: -30 }
    ]
    }
  } catch (error: unknown) {
    console.error('Outstanding balances fetch error:', error);
    throw new Error('Failed to fetch outstanding balances');
  }
}

export async function getGroupActivities() {
  try {
    await new Promise(resolve => setTimeout(resolve, 100));
    return {
      activities: [
      {
        id: '1',
        timestamp: new Date('2024-01-15T10:30:00'),
        memberName: 'Alice',
        type: 'expense',
        amount: 45.50,
        description: 'Team lunch',
        status: 'approved'
      }
      // ... other activities
    ]
    }
  } catch (error: unknown) {
    console.error('Group activities fetch error:', error);
    throw new Error('Failed to fetch group activities');
  }
} 