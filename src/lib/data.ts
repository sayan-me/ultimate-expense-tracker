export async function getInitialData() {
  return {
    balance: 5000,
    monthlySpend: 2500,
    monthlyBudget: 4000,
    recentExpenses: []
  }
}

export async function getCurrentBalance() {
  return 5000
} 