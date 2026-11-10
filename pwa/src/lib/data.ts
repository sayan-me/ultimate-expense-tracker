// Mock Database Structure
interface MockDB {
  currentUser: {
    id: string;
    name: string;
    balance: number;
    monthlyBudget: number;
  };
  transactions: Array<{
    id: string;
    date: Date;
    description: string;
    amount: number;
    category: string;
    type: 'expense' | 'income';
  }>;
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    type: 'expense' | 'budget' | 'system' | 'group';
    timestamp: Date;
    read: boolean;
  }>;
}

// Mock Database Instance
const mockDB: MockDB = {
  currentUser: {
    id: '1',
    name: 'John Doe',
    balance: 5000,
    monthlyBudget: 4000
  },
  transactions: [
    {
      id: '1',
      date: new Date('2024-01-15'),
      description: 'Grocery Shopping',
      amount: -85.50,
      category: 'Food & Dining',
      type: 'expense'
    },
    {
      id: '2',
      date: new Date('2024-01-15'),
      description: 'Salary Deposit',
      amount: 3000,
      category: 'Income',
      type: 'income'
    },
    {
      id: '3',
      date: new Date('2024-01-04'),
      description: 'Lunch at Subway',
      amount: -42.50,
      category: 'Food & Dining',
      type: 'expense'
    }
  ],
  notifications: [
    {
      id: '1',
      title: 'Budget Alert',
      message: 'You have reached 80% of your monthly budget',
      type: 'budget',
      timestamp: new Date('2024-01-15T10:00:00'),
      read: false
    },
    {
      id: '2',
      title: 'New Group Expense',
      message: 'Alice added a new expense: Team lunch ($45.50)',
      type: 'group',
      timestamp: new Date('2024-01-15T14:30:00'),
      read: true
    },
    {
      id: '3',
      title: 'System Update',
      message: 'New features available! Check out the latest updates.',
      type: 'system',
      timestamp: new Date('2024-01-14T09:00:00'),
      read: false
    }
  ]
};

// Data Access Functions
export async function getCurrentBalance(): Promise<number> {
  try {
    await new Promise(resolve => setTimeout(resolve, 100));
    return mockDB.currentUser.balance;
  } catch (error: unknown) {
    console.error('Balance fetch error:', error);
    throw new Error('Failed to fetch balance');
  }
}

export async function getMonthlySpendData() {
  try {
    await new Promise(resolve => setTimeout(resolve, 100));
    const currentMonth = new Date().getMonth();
    const monthlySpend = mockDB.transactions
      .filter(t => t.date.getMonth() === currentMonth && t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return {
      monthlySpend,
      monthlyBudget: mockDB.currentUser.monthlyBudget
    };
  } catch (error: unknown) {
    console.error('Monthly spend fetch error:', error);
    throw new Error('Failed to fetch monthly spend data');
  }
}

export async function getTransactionHistory() {
  try {
    await new Promise(resolve => setTimeout(resolve, 100));
    return { transactions: mockDB.transactions };
  } catch (error: unknown) {
    console.error('Transaction history fetch error:', error);
    throw new Error('Failed to fetch transaction history');
  }
}

export async function getRecentExpenses() {
  try {
    await new Promise(resolve => setTimeout(resolve, 100));
    // Get last 5 transactions, sorted by date
    const recentTransactions = [...mockDB.transactions]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5)
      .map(transaction => ({
        id: transaction.id,
        date: transaction.date,
        description: transaction.description,
        amount: transaction.amount,
        category: transaction.category,
        type: transaction.type
      }));

    return { transactions: recentTransactions };
  } catch (error: unknown) {
    console.error('Recent expenses fetch error:', error);
    throw new Error('Failed to fetch recent expenses');
  }
}

export async function getNotifications() {
  try {
    await new Promise(resolve => setTimeout(resolve, 100));
    return { notifications: mockDB.notifications };
  } catch (error: unknown) {
    console.error('Notifications fetch error:', error);
    throw new Error('Failed to fetch notifications');
  }
}

export async function markNotificationAsRead(id: string) {
  try {
    await new Promise(resolve => setTimeout(resolve, 100));
    const notification = mockDB.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
    }
    return { success: true };
  } catch (error: unknown) {
    console.error('Mark notification read error:', error);
    throw new Error('Failed to mark notification as read');
  }
}

export async function clearAllNotifications() {
  try {
    await new Promise(resolve => setTimeout(resolve, 100));
    mockDB.notifications = [];
    return { success: true };
  } catch (error: unknown) {
    console.error('Clear notifications error:', error);
    throw new Error('Failed to clear notifications');
  }
} 