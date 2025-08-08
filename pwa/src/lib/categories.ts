import { db, type Category } from './db'

/** Default expense categories with icons and colors */
export const DEFAULT_EXPENSE_CATEGORIES = [
  {
    name: "Food & Dining",
    icon: "utensils",
    color: "#ef4444",
    isDefault: true,
    type: "expense" as const,
    createdAt: new Date()
  },
  {
    name: "Transportation",
    icon: "car",
    color: "#3b82f6", 
    isDefault: true,
    type: "expense" as const,
    createdAt: new Date()
  },
  {
    name: "Entertainment",
    icon: "film",
    color: "#8b5cf6",
    isDefault: true,
    type: "expense" as const,
    createdAt: new Date()
  },
  {
    name: "Shopping",
    icon: "shopping-bag",
    color: "#ec4899",
    isDefault: true,
    type: "expense" as const,
    createdAt: new Date()
  },
  {
    name: "Bills & Utilities",
    icon: "receipt",
    color: "#f59e0b",
    isDefault: true,
    type: "expense" as const,
    createdAt: new Date()
  },
  {
    name: "Healthcare",
    icon: "heart",
    color: "#10b981",
    isDefault: true,
    type: "expense" as const,
    createdAt: new Date()
  },
  {
    name: "Education",
    icon: "book-open",
    color: "#0891b2",
    isDefault: true,
    type: "expense" as const,
    createdAt: new Date()
  },
  {
    name: "Personal Care",
    icon: "user",
    color: "#84cc16",
    isDefault: true,
    type: "expense" as const,
    createdAt: new Date()
  }
] as const

/** Default income categories */
export const DEFAULT_INCOME_CATEGORIES = [
  {
    name: "Salary",
    icon: "briefcase",
    color: "#059669",
    isDefault: true,
    type: "income" as const,
    createdAt: new Date()
  },
  {
    name: "Freelance",
    icon: "laptop",
    color: "#0891b2",
    isDefault: true,
    type: "income" as const,
    createdAt: new Date()
  },
  {
    name: "Investment",
    icon: "trending-up",
    color: "#7c3aed",
    isDefault: true,
    type: "income" as const,
    createdAt: new Date()
  },
  {
    name: "Other Income",
    icon: "plus-circle",
    color: "#0891b2",
    isDefault: true,
    type: "income" as const,
    createdAt: new Date()
  }
] as const

/** Default expense tags */
export const DEFAULT_TAGS = [
  "Essential",
  "Optional", 
  "Planned",
  "Impulse",
  "Recurring",
  "One-time"
] as const

/**
 * Initialize default categories in the database
 * Only adds categories if none exist
 */
export const initializeDefaultCategories = async (): Promise<void> => {
  try {
    const categoryCount = await db.categories.count()
    
    if (categoryCount === 0) {
      const allCategories = [
        ...DEFAULT_EXPENSE_CATEGORIES,
        ...DEFAULT_INCOME_CATEGORIES
      ]
      
      await db.categories.bulkAdd(allCategories)
      console.log(`✅ Initialized ${allCategories.length} default categories`)
    }
  } catch (error) {
    console.error('❌ Failed to initialize default categories:', error)
    throw error
  }
}

/**
 * Get all categories for a specific type
 */
export const getCategoriesByType = async (type: 'expense' | 'income' | 'both'): Promise<Category[]> => {
  if (type === 'both') {
    return await db.categories.toArray()
  }
  return await db.categories.where('type').equals(type).toArray()
}

/**
 * Create a custom category
 */
export const createCustomCategory = async (
  category: Omit<Category, 'id' | 'isDefault' | 'createdAt'>
): Promise<number> => {
  const customCategory: Omit<Category, 'id'> = {
    ...category,
    isDefault: false,
    createdAt: new Date()
  }
  
  return await db.categories.add(customCategory)
}

/**
 * Update a custom category (default categories cannot be updated)
 */
export const updateCategory = async (
  id: number, 
  updates: Partial<Pick<Category, 'name' | 'icon' | 'color'>>
): Promise<void> => {
  const category = await db.categories.get(id)
  
  if (!category) {
    throw new Error('Category not found')
  }
  
  if (category.isDefault) {
    throw new Error('Cannot update default categories')
  }
  
  await db.categories.update(id, updates)
}

/**
 * Delete a custom category (default categories cannot be deleted)
 * Also validates that no transactions use this category
 */
export const deleteCategory = async (id: number): Promise<void> => {
  const category = await db.categories.get(id)
  
  if (!category) {
    throw new Error('Category not found')
  }
  
  if (category.isDefault) {
    throw new Error('Cannot delete default categories')
  }
  
  // Check if any transactions use this category
  const transactionsWithCategory = await db.transactions
    .where('category')
    .equals(category.name)
    .count()
  
  if (transactionsWithCategory > 0) {
    throw new Error(`Cannot delete category "${category.name}" - it is used by ${transactionsWithCategory} transaction(s)`)
  }
  
  await db.categories.delete(id)
}

/**
 * Get category by name
 */
export const getCategoryByName = async (name: string): Promise<Category | undefined> => {
  return await db.categories.where('name').equals(name).first()
}