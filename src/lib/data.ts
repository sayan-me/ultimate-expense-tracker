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
  groups: Array<{
    id: string;
    name: string;
    members: Array<{
      id: string;
      name: string;
      balance: number;
    }>;
    transactions: Array<{
      id: string;
      timestamp: Date;
      memberName: string;
      type: 'expense' | 'settlement' | 'adjustment';
      amount: number;
      description: string;
      status: 'pending' | 'approved' | 'rejected';
      category?: string;
    }>;
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
  groups: [
    {
      id: '1',
      name: 'Home Expenses',
      members: [
        { id: '1', name: 'Alice', balance: 50 },
        { id: '2', name: 'Bob', balance: -30 },
        { id: '3', name: 'Charlie', balance: 25 }
      ],
      transactions: [
        {
          id: '1',
          timestamp: new Date('2024-01-15T10:30:00'),
          memberName: 'Alice',
          type: 'expense',
          amount: 45.50,
          description: 'Team lunch',
          status: 'approved',
          category: 'Food & Dining'
        },
        {
          id: '2',
          timestamp: new Date('2024-01-15T14:20:00'),
          memberName: 'Bob',
          type: 'settlement',
          amount: 30.00,
          description: 'Paid to Group Pool',
          status: 'pending'
        },
        {
          id: '3',
          timestamp: new Date('2024-01-14T09:15:00'),
          memberName: 'Charlie',
          type: 'expense',
          amount: 75.00,
          description: 'Utilities',
          status: 'approved',
          category: 'Utilities'
        },
        {
          id: '4',
          timestamp: new Date('2024-01-13T16:45:00'),
          memberName: 'Alice',
          type: 'adjustment',
          amount: -20.00,
          description: 'Adjustment for incorrect bill',
          status: 'approved'
        }
      ]
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

export async function getGroupStats() {
  try {
    await new Promise(resolve => setTimeout(resolve, 100));
    const currentGroup = mockDB.groups[0]; // Using first group for mock data
    const totalSpending = currentGroup.transactions
      .filter(e => e.type === 'expense')
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      totalSpending,
      monthlyBudget: 2000,
      categories: [
        { name: 'Food', amount: totalSpending * 0.6 },
        { name: 'Transport', amount: totalSpending * 0.4 }
      ]
    };
  } catch (error: unknown) {
    console.error('Group stats fetch error:', error);
    throw new Error('Failed to fetch group stats');
  }
}

export async function getOutstandingBalances() {
  try {
    await new Promise(resolve => setTimeout(resolve, 100));
    const currentGroup = mockDB.groups[0];
    return {
      balances: currentGroup.members.map(member => ({
        memberId: member.id,
        memberName: member.name,
        amount: member.balance,
        owesTo: member.balance > 0 ? 'Group Pool' : 'Group Pool'
      }))
    };
  } catch (error: unknown) {
    console.error('Outstanding balances fetch error:', error);
    throw new Error('Failed to fetch outstanding balances');
  }
}

export async function getGroupActivities() {
  try {
    await new Promise(resolve => setTimeout(resolve, 100));
    const currentGroup = mockDB.groups[0];
    return { activities: currentGroup.transactions };
  } catch (error: unknown) {
    console.error('Group activities fetch error:', error);
    throw new Error('Failed to fetch group activities');
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