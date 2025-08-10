import { db, type Account } from "./db"
import { initializeDefaultCategories } from "./categories"

/**
 * Default account that gets created on first app launch
 */
const DEFAULT_ACCOUNT: Omit<Account, "id"> = {
    name: "Cash",
    type: "cash",
    balance: 0,
    isDefault: true,
    createdAt: new Date(),
}

/**
 * Initialize default data for new users
 * Creates default account and categories if they don't exist
 */
export const initializeDefaultData = async (): Promise<void> => {
    try {
        console.log("🔄 Initializing default data...")

        // Initialize default account
        await initializeDefaultAccount()

        // Initialize default categories
        await initializeDefaultCategories()

        console.log("✅ Default data initialization complete")
    } catch (error) {
        console.error("❌ Failed to initialize default data:", error)
        throw error
    }
}

/**
 * Create default account if no accounts exist
 */
const initializeDefaultAccount = async (): Promise<void> => {
    try {
        const accountCount = await db.accounts.count()

        if (accountCount === 0) {
            const accountId = await db.accounts.add(DEFAULT_ACCOUNT)
            console.log(
                `✅ Created default account "Cash" with ID: ${accountId}`
            )
        } else {
            console.log(
                "ℹ️ Accounts already exist, skipping default account creation"
            )
        }
    } catch (error) {
        console.error("❌ Failed to initialize default account:", error)
        throw error
    }
}

/**
 * Get the default account (useful for forms)
 */
export const getDefaultAccount = async (): Promise<Account | undefined> => {
    const accounts = await db.accounts.toArray()
    return accounts.find((account) => account.isDefault === true)
}

/**
 * Check if this is a first-time user (no data exists)
 */
export const isFirstTimeUser = async (): Promise<boolean> => {
    try {
        const [accountCount, transactionCount] = await Promise.all([
            db.accounts.count(),
            db.transactions.count(),
        ])

        return accountCount === 0 && transactionCount === 0
    } catch (error) {
        console.error("❌ Failed to check first-time user status:", error)
        return false
    }
}

/**
 * Get initialization status for debugging
 */
export const getInitializationStatus = async () => {
    try {
        const [accountCount, categoryCount, transactionCount] =
            await Promise.all([
                db.accounts.count(),
                db.categories.count(),
                db.transactions.count(),
            ])

        return {
            accounts: accountCount,
            categories: categoryCount,
            transactions: transactionCount,
            isInitialized: accountCount > 0 && categoryCount > 0,
        }
    } catch (error) {
        console.error("❌ Failed to get initialization status:", error)
        return {
            accounts: 0,
            categories: 0,
            transactions: 0,
            isInitialized: false,
        }
    }
}
