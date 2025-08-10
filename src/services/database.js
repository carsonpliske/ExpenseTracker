import Dexie from 'dexie'

// Database schema
class ExpenseTrackerDB extends Dexie {
  constructor() {
    super('ExpenseTrackerDB')
    
    this.version(1).stores({
      transactions: '++id, amount, categoryId, description, date',
      budget: '++id, income, fixedExpenses, subscriptions'
    })
    
    this.version(2).stores({
      transactions: '++id, amount, categoryId, description, date',
      budget: '++id, income, fixedExpenses, subscriptions',
      customCategories: '++id, name, icon, image, iconType, darkColor, lightColor, isCustom'
    })
  }
}

const db = new ExpenseTrackerDB()

// Transaction methods
export const transactionService = {
  async getAll() {
    try {
      return await db.transactions.toArray()
    } catch (error) {
      console.error('Error getting transactions:', error)
      throw error
    }
  },
  
  async add(transaction) {
    try {
      const id = await db.transactions.add({
        ...transaction,
        id: transaction.id || Date.now()
      })
      return id
    } catch (error) {
      console.error('Error adding transaction:', error)
      throw error
    }
  },
  
  async update(transaction) {
    try {
      return await db.transactions.put(transaction)
    } catch (error) {
      console.error('Error updating transaction:', error)
      throw error
    }
  },
  
  async delete(id) {
    try {
      return await db.transactions.delete(id)
    } catch (error) {
      console.error('Error deleting transaction:', error)
      throw error
    }
  },
  
  async clear() {
    try {
      return await db.transactions.clear()
    } catch (error) {
      console.error('Error clearing transactions:', error)
      throw error
    }
  }
}

// Budget methods - using localStorage for reliability
export const budgetService = {
  get() {
    try {
      const savedBudget = localStorage.getItem('expense-budget')
      if (savedBudget) {
        return JSON.parse(savedBudget)
      }
      return {
        income: 0,
        fixedExpenses: [],
        subscriptions: []
      }
    } catch (error) {
      console.error('Error getting budget from localStorage:', error)
      return {
        income: 0,
        fixedExpenses: [],
        subscriptions: []
      }
    }
  },
  
  save(budgetData) {
    try {
      console.log('Saving budget to localStorage:', budgetData)
      localStorage.setItem('expense-budget', JSON.stringify(budgetData))
      console.log('Budget saved successfully to localStorage')
      return Promise.resolve()
    } catch (error) {
      console.error('Error saving budget to localStorage:', error)
      throw error
    }
  },
  
  clear() {
    try {
      localStorage.removeItem('expense-budget')
      return Promise.resolve()
    } catch (error) {
      console.error('Error clearing budget from localStorage:', error)
      throw error
    }
  }
}

// Migration function to move data from localStorage to IndexedDB
export const migrateFromLocalStorage = async () => {
  try {
    // Check if we already have data in IndexedDB
    const existingTransactions = await transactionService.getAll()
    const existingBudget = await budgetService.get()
    
    // Only migrate if IndexedDB is empty
    if (existingTransactions.length === 0) {
      const localTransactions = localStorage.getItem('expense-transactions')
      if (localTransactions) {
        const transactions = JSON.parse(localTransactions)
        for (const transaction of transactions) {
          await transactionService.add(transaction)
        }
        console.log('Migrated transactions from localStorage to IndexedDB')
      }
    }
    
    if (!existingBudget.id) {
      const localBudget = localStorage.getItem('expense-budget')
      if (localBudget) {
        const budget = JSON.parse(localBudget)
        await budgetService.save(budget)
        console.log('Migrated budget from localStorage to IndexedDB')
      }
    }
    
    return true
  } catch (error) {
    console.error('Migration failed:', error)
    return false
  }
}

// Custom category methods
export const customCategoryService = {
  async getAll() {
    try {
      return await db.customCategories.toArray()
    } catch (error) {
      console.error('Error getting custom categories:', error)
      return []
    }
  },
  
  async add(category) {
    try {
      const id = await db.customCategories.add({
        ...category,
        id: category.id || `custom_${Date.now()}`,
        isCustom: true
      })
      return id
    } catch (error) {
      console.error('Error adding custom category:', error)
      throw error
    }
  },
  
  async update(category) {
    try {
      return await db.customCategories.put(category)
    } catch (error) {
      console.error('Error updating custom category:', error)
      throw error
    }
  },
  
  async delete(id) {
    try {
      return await db.customCategories.delete(id)
    } catch (error) {
      console.error('Error deleting custom category:', error)
      throw error
    }
  }
}

export default db