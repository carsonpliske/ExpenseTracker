<template>
  <div class="budget-planner">
    <div class="savings-summary">
      <div class="savings-amount">${{ calculatePotentialSavings().toFixed(2) }}</div>
      <div>Potential Monthly Savings</div>
      <div style="margin-top: 1rem; font-size: 0.9rem; opacity: 0.9;">
        <div>Income: ${{ (budget.income || 0).toFixed(2) }}</div>
        <div>Fixed Expenses: ${{ getTotalFixedExpenses().toFixed(2) }}</div>
        <div>Variable Expenses: ${{ getTotalVariableExpenses().toFixed(2) }}</div>
        <div>Subscriptions: ${{ getTotalSubscriptions().toFixed(2) }}</div>
        <div style="border-top: 1px solid rgba(255,255,255,0.3); padding-top: 0.5rem; margin-top: 0.5rem;">
          Total Expenses: ${{ getTotalExpenses().toFixed(2) }}
        </div>
      </div>
    </div>

    <div v-if="calculatePotentialSavings() < 0" class="savings-summary" style="background: var(--accent-red);">
      <div class="savings-amount">⚠️ Over Budget</div>
      <div>You're spending ${{ Math.abs(calculatePotentialSavings()).toFixed(2) }} more than your income!</div>
    </div>

    <div class="budget-section">
      <h3>Monthly Income</h3>
      <div class="form-group">
        <input 
          v-model.number="budget.income" 
          type="number" 
          step="0.01" 
          placeholder="Enter your monthly income"
          @input="() => saveBudget()"
        >
      </div>
    </div>

    <div class="budget-section">
      <h3>Fixed Monthly Expenses</h3>
      <div class="budget-item" v-for="(expense, index) in budget.fixedExpenses" :key="index">
        <div style="flex: 1;">
          <input 
            v-model="expense.name" 
            type="text" 
            placeholder="Expense name (e.g., Rent, Netflix)"
            style="width: 100%; margin-bottom: 0.5rem;"
            @input="() => saveBudget()"
          >
        </div>
        <div style="width: 100px;">
          <input 
            v-model.number="expense.amount" 
            type="number" 
            step="0.01" 
            placeholder="Amount"
            style="width: 100%;"
            @input="() => saveBudget()"
          >
        </div>
        <button 
          @click="removeExpense(index)" 
          style="background: var(--accent-red); border: none; color: white; padding: 0.5rem; border-radius: 0.25rem; margin-left: 0.5rem; cursor: pointer;"
        >
          ×
        </button>
      </div>
    </div>

    <div class="budget-section">
      <h3>Recurring Subscriptions</h3>
      <div class="budget-item" v-for="(subscription, index) in budget.subscriptions" :key="index">
        <div style="flex: 1;">
          <input 
            v-model="subscription.name" 
            type="text" 
            placeholder="Service name (e.g., Spotify, Netflix)"
            style="width: 100%; margin-bottom: 0.5rem;"
            @input="() => saveBudget()"
          >
        </div>
        <div style="width: 100px;">
          <input 
            v-model.number="subscription.amount" 
            type="number" 
            step="0.01" 
            placeholder="Amount"
            style="width: 100%;"
            @input="() => saveBudget()"
          >
        </div>
        <button 
          @click="removeSubscription(index)" 
          style="background: var(--accent-red); border: none; color: white; padding: 0.5rem; border-radius: 0.25rem; margin-left: 0.5rem; cursor: pointer;"
        >
          ×
        </button>
      </div>
    </div>

    <div class="budget-section">
      <h3>Monthly Expenses</h3>
      <div class="budget-item" v-for="category in variableCategories" :key="category.id">
        <div class="category-info">
          <span>
            <span v-if="category.iconType === 'image' && category.image">
              <img :src="category.image" alt="category icon" class="category-image-inline" />
            </span>
            <span v-else>{{ category.icon }} </span>{{ category.name }}
          </span>
        </div>
        <div class="expense-amount">
          ${{ getMonthlySpendingForCategory(category.id).toFixed(2) }}
        </div>
      </div>
    </div>

    <button class="add-transaction-btn" @click.stop="openAddModal">
      +
    </button>

    <!-- Add Modal for choosing what to add -->
    <div v-if="showAddModal" class="modal-overlay" @click="closeAddModal">
      <div class="add-modal" @click.stop>
        <!-- Initial selection screen -->
        <div v-if="!selectedAddType">
          <h3>What would you like to add?</h3>
          <div class="add-options">
            <button class="add-option-btn" @click="selectedAddType = 'expense'">
              💰 Fixed Expense
            </button>
            <button class="add-option-btn" @click="selectedAddType = 'subscription'">
              📱 Subscription
            </button>
            <button class="add-option-btn" @click="openTransactionModal">
              🧾 Transaction
            </button>
          </div>
        </div>

        <!-- Fixed Expense Form -->
        <div v-if="selectedAddType === 'expense'">
          <h3>Add Fixed Expense</h3>
          <form @submit.prevent="saveExpense">
            <div class="form-group">
              <label>Name</label>
              <input 
                v-model="newExpense.name"
                type="text" 
                placeholder="e.g., Rent, Car Payment"
                required
                ref="expenseNameInput"
              />
            </div>
            <div class="form-group">
              <label>Monthly Amount ($)</label>
              <input 
                v-model.number="newExpense.amount"
                type="number" 
                step="0.01"
                placeholder="0.00"
                required
              />
            </div>
            <div class="form-actions">
              <button type="button" @click="resetAddModal" class="btn-secondary">
                Back
              </button>
              <button type="submit" class="btn-primary">
                Add Expense
              </button>
            </div>
          </form>
        </div>

        <!-- Subscription Form -->
        <div v-if="selectedAddType === 'subscription'">
          <h3>Add Subscription</h3>
          <form @submit.prevent="saveSubscription">
            <div class="form-group">
              <label>Service Name</label>
              <input 
                v-model="newSubscription.name"
                type="text" 
                placeholder="e.g., Netflix, Spotify"
                required
                ref="subscriptionNameInput"
              />
            </div>
            <div class="form-group">
              <label>Monthly Amount ($)</label>
              <input 
                v-model.number="newSubscription.amount"
                type="number" 
                step="0.01"
                placeholder="0.00"
                required
              />
            </div>
            <div class="form-actions">
              <button type="button" @click="resetAddModal" class="btn-secondary">
                Back
              </button>
              <button type="submit" class="btn-primary">
                Add Subscription
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Eye icon for clearing data (positioned at bottom of page content) -->
    <div class="eye-container">
      <button class="eye-btn" @click="showDeleteModal = true">
        👁️
      </button>
    </div>

    <!-- Delete confirmation modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="showDeleteModal = false">
      <div class="delete-modal" @click.stop>
        <h3>Delete All Data</h3>
        <p>This will clear all your transactions, budget data, and custom categories. This cannot be undone.</p>
        <div class="delete-options">
          <button class="delete-confirm-btn" @click="clearAllData">
            Sure
          </button>
          <button class="delete-cancel-btn" @click="showDeleteModal = false">
            Nah
          </button>
        </div>
      </div>
    </div>

    <!-- Transaction Modal -->
    <TransactionModal 
      v-if="showTransactionModal"
      @close="closeTransactionModal"
      @save="addTransaction"
      :categories="allCategories"
      :transactions="transactions"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { budgetService, transactionService, customCategoryService, migrateFromLocalStorage } from '../services/database.js'
import TransactionModal from './TransactionModal.vue'

export default {
  name: 'BudgetPlanner',
  components: {
    TransactionModal
  },
  setup() {
    const budget = ref({
      income: 0,
      fixedExpenses: [],
      subscriptions: []
    })
    
    const transactions = ref([])
    const showAddModal = ref(false)
    const showDeleteModal = ref(false)
    const showTransactionModal = ref(false)
    const selectedAddType = ref(null)
    const newExpense = ref({ name: '', amount: '' })
    const newSubscription = ref({ name: '', amount: '' })
    const customCategories = ref([])
    let saveTimeout = null

    const baseVariableCategoriesData = [
      { id: 'groceries', name: 'Groceries', icon: '🛒', darkColor: '#3B82F6', lightColor: '#1D4ED8' },
      { id: 'transport', name: 'Transport', icon: '🚗', darkColor: '#F59E0B', lightColor: '#D97706' },
      { id: 'restaurant', name: 'Restaurant', icon: '🍽️', darkColor: '#8B5CF6', lightColor: '#7C3AED' },
      { id: 'health', name: 'Health', icon: '💚', darkColor: '#10B981', lightColor: '#059669' },
      { id: 'gifts', name: 'Gifts', icon: '🎁', darkColor: '#EF4444', lightColor: '#DC2626' },
      { id: 'shopping', name: 'Shopping', icon: '🛍️', darkColor: '#14B8A6', lightColor: '#0F766E' },
      { id: 'movies', name: 'Movies', icon: '🎬', darkColor: '#F97316', lightColor: '#EA580C' },
      { id: 'education', name: 'Education', icon: '📚', darkColor: '#6366F1', lightColor: '#4F46E5' },
      { id: 'traveling', name: 'Traveling', icon: '✈️', darkColor: '#06B6D4', lightColor: '#0284C7' },
      { id: 'electric', name: 'Electric', icon: '⚡', darkColor: '#FACC15', lightColor: '#CA8A04' },
      { id: 'water', name: 'Water', icon: '💧', darkColor: '#0EA5E9', lightColor: '#0369A1' },
      { id: 'other', name: 'Other', icon: '📋', darkColor: '#64748B', lightColor: '#475569' }
    ]

    const baseCategoriesData = [
      { id: 'rent', name: 'Rent', icon: '🏠', darkColor: '#DC2626', lightColor: '#991B1B' },
      ...baseVariableCategoriesData
    ]

    // Get current theme
    const getCurrentTheme = () => {
      return document.documentElement.getAttribute('data-theme') || 'dark'
    }

    const variableCategories = computed(() => {
      const currentTheme = getCurrentTheme()
      const baseCategories = baseVariableCategoriesData.map(cat => ({
        ...cat,
        color: currentTheme === 'light' ? cat.lightColor : cat.darkColor
      }))
      
      const customCats = customCategories.value.map(cat => ({
        ...cat,
        color: currentTheme === 'light' ? cat.lightColor : cat.darkColor
      }))
      
      const allCategories = [...baseCategories, ...customCats]
      
      // Sort by spending amount (highest first), only show categories with spending > 0
      return allCategories
        .filter(category => getMonthlySpendingForCategory(category.id) > 0)
        .sort((a, b) => {
          const amountA = getMonthlySpendingForCategory(a.id)
          const amountB = getMonthlySpendingForCategory(b.id)
          return amountB - amountA // Sort descending (highest first)
        })
    })

    const allCategories = computed(() => {
      const currentTheme = getCurrentTheme()
      const baseCategories = baseCategoriesData.map(cat => ({
        ...cat,
        color: currentTheme === 'light' ? cat.lightColor : cat.darkColor
      }))
      
      const customCats = customCategories.value.map(cat => ({
        ...cat,
        color: currentTheme === 'light' ? cat.lightColor : cat.darkColor
      }))
      
      return [...baseCategories, ...customCats]
    })

    const addExpense = () => {
      budget.value.fixedExpenses.push({
        name: '',
        amount: 0
      })
      saveBudget()
    }

    const removeExpense = (index) => {
      budget.value.fixedExpenses.splice(index, 1)
      saveBudget()
    }

    const addSubscription = () => {
      budget.value.subscriptions.push({
        name: '',
        amount: 0
      })
      saveBudget()
    }

    const removeSubscription = (index) => {
      budget.value.subscriptions.splice(index, 1)
      saveBudget()
    }

    const resetAddModal = () => {
      selectedAddType.value = null
      newExpense.value = { name: '', amount: '' }
      newSubscription.value = { name: '', amount: '' }
    }

    const saveExpense = () => {
      if (newExpense.value.name && newExpense.value.amount && Number(newExpense.value.amount) > 0) {
        budget.value.fixedExpenses.push({
          name: newExpense.value.name,
          amount: Number(newExpense.value.amount)
        })
        saveBudget()
        showAddModal.value = false
        resetAddModal()
      }
    }

    const saveSubscription = () => {
      if (newSubscription.value.name && newSubscription.value.amount && Number(newSubscription.value.amount) > 0) {
        budget.value.subscriptions.push({
          name: newSubscription.value.name,
          amount: Number(newSubscription.value.amount)
        })
        saveBudget()
        showAddModal.value = false
        resetAddModal()
      }
    }

    const openAddModal = () => {
      resetAddModal()
      showAddModal.value = true
    }

    const closeAddModal = () => {
      showAddModal.value = false
      resetAddModal()
    }

    const openTransactionModal = () => {
      showAddModal.value = false
      showTransactionModal.value = true
    }

    const closeTransactionModal = () => {
      showTransactionModal.value = false
    }

    const addTransaction = async (transaction) => {
      // Handle date properly to preserve creation time for sorting
      let dateToStore = new Date().toISOString()
      if (transaction.date) {
        // If user selected a specific date, use that date but preserve the current time
        if (typeof transaction.date === 'string' && transaction.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const [year, month, day] = transaction.date.split('-')
          const now = new Date()
          // Use the selected date but keep the current time (hours, minutes, seconds, ms)
          dateToStore = new Date(
            parseInt(year), 
            parseInt(month) - 1, 
            parseInt(day), 
            now.getHours(),
            now.getMinutes(),
            now.getSeconds(),
            now.getMilliseconds()
          ).toISOString()
        } else {
          dateToStore = new Date(transaction.date).toISOString()
        }
      }
      
      const newTransaction = {
        ...transaction,
        id: Date.now(),
        date: dateToStore
      }
      
      try {
        await transactionService.add(newTransaction)
        transactions.value.push(newTransaction)
        showTransactionModal.value = false
      } catch (error) {
        console.error('Failed to add transaction:', error)
      }
    }

    const getTotalFixedExpenses = () => {
      return budget.value.fixedExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0)
    }

    const getMonthlySpendingForCategory = (categoryId) => {
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()
      
      return transactions.value
        .filter(transaction => {
          const transactionDate = new Date(transaction.date)
          return transactionDate.getMonth() === currentMonth && 
                 transactionDate.getFullYear() === currentYear &&
                 transaction.categoryId === categoryId
        })
        .reduce((sum, transaction) => sum + transaction.amount, 0)
    }

    const getTotalVariableExpenses = () => {
      return variableCategories.value.reduce((sum, category) => {
        return sum + getMonthlySpendingForCategory(category.id)
      }, 0)
    }

    const getTotalSubscriptions = () => {
      return budget.value.subscriptions.reduce((sum, subscription) => sum + (subscription.amount || 0), 0)
    }

    const getTotalExpenses = () => {
      return getTotalFixedExpenses() + getTotalVariableExpenses() + getTotalSubscriptions()
    }

    const calculatePotentialSavings = () => {
      return (budget.value.income || 0) - getTotalExpenses()
    }

    const saveBudget = () => {
      // Clear existing timeout
      if (saveTimeout) {
        clearTimeout(saveTimeout)
      }
      
      // Debounce save to avoid rapid fire saves
      saveTimeout = setTimeout(() => {
        try {
          console.log('Saving budget data:', budget.value)
          budgetService.save(budget.value)
          console.log('Budget saved successfully')
        } catch (error) {
          console.error('Failed to save budget:', error)
        }
      }, 500) // Wait 500ms after last input before saving
    }

    const loadBudget = () => {
      try {
        const savedBudget = budgetService.get()
        console.log('Loaded budget data:', savedBudget)
        budget.value = { ...budget.value, ...savedBudget }
        console.log('Budget state after loading:', budget.value)
      } catch (error) {
        console.error('Failed to load budget:', error)
      }
    }

    const loadTransactions = async () => {
      try {
        transactions.value = await transactionService.getAll()
      } catch (error) {
        console.error('Failed to load transactions:', error)
      }
    }

    const loadCustomCategories = async () => {
      try {
        customCategories.value = await customCategoryService.getAll()
      } catch (error) {
        console.error('Failed to load custom categories:', error)
      }
    }

    const clearAllData = async () => {
      try {
        // Clear all transactions
        await transactionService.clear()
        
        // Clear budget data
        await budgetService.clear()
        
        // Clear custom categories
        const customCats = await customCategoryService.getAll()
        for (const cat of customCats) {
          await customCategoryService.delete(cat.id)
        }
        
        // Clear localStorage data as backup
        localStorage.removeItem('expense-transactions')
        localStorage.removeItem('expense-budget')
        localStorage.removeItem('expense-tracker-custom-colors')
        
        // Reset local state
        budget.value = {
          income: 0,
          fixedExpenses: [],
          subscriptions: []
        }
        transactions.value = []
        customCategories.value = []
        
        // Close modal
        showDeleteModal.value = false
        
        console.log('All data cleared successfully')
        
        // Optionally reload the page to ensure clean state
        setTimeout(() => {
          window.location.reload()
        }, 500)
        
      } catch (error) {
        console.error('Failed to clear all data:', error)
        alert('Failed to clear data. Please try again.')
      }
    }

    onMounted(async () => {
      await migrateFromLocalStorage()
      loadBudget()
      await loadTransactions()
      await loadCustomCategories()
    })

    return {
      budget,
      variableCategories,
      allCategories,
      transactions,
      showAddModal,
      showDeleteModal,
      showTransactionModal,
      selectedAddType,
      newExpense,
      newSubscription,
      addExpense,
      removeExpense,
      addSubscription,
      removeSubscription,
      openAddModal,
      closeAddModal,
      resetAddModal,
      saveExpense,
      saveSubscription,
      openTransactionModal,
      closeTransactionModal,
      addTransaction,
      getTotalFixedExpenses,
      getTotalVariableExpenses,
      getTotalSubscriptions,
      getTotalExpenses,
      calculatePotentialSavings,
      saveBudget,
      getMonthlySpendingForCategory,
      clearAllData
    }
  }
}
</script>

<style scoped>
.budget-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 0;
  border-bottom: 1px solid var(--border-color);
}

.budget-item:last-child {
  border-bottom: none;
}

.category-info {
  flex: 1;
  font-weight: 500;
}

.expense-amount {
  font-size: 1rem;
  font-weight: 600;
  color: var(--accent-green);
  background: var(--surface-light);
  padding: 0.5rem 0.75rem;
  border-radius: 0.25rem;
  border: 1px solid var(--border-color);
  min-width: 80px;
  text-align: right;
}

input[type="text"], input[type="number"] {
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 0.25rem;
  background: var(--surface-dark);
  color: var(--text-primary);
}

input[type="text"]:focus, input[type="number"]:focus {
  outline: none;
  border-color: var(--accent-purple);
}

.category-image-inline {
  width: 1.2rem;
  height: 1.2rem;
  object-fit: cover;
  border-radius: 50%;
  margin-right: 0.5rem;
}

.add-transaction-btn {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-purple), var(--accent-blue));
  border: none;
  color: white;
  font-size: 1.5rem;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-transaction-btn:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
}

.add-transaction-btn:active {
  transform: translateY(0) scale(0.95);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.add-modal {
  background: var(--surface-dark);
  border-radius: 1rem;
  padding: 2rem;
  max-width: 300px;
  width: 90%;
  text-align: center;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-color);
}

.add-modal h3 {
  color: var(--text-primary);
  margin-bottom: 1.5rem;
  font-size: 1.2rem;
}

.add-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.add-option-btn {
  padding: 1rem;
  background: linear-gradient(135deg, var(--accent-purple), var(--accent-blue));
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.add-option-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

/* Form styling within modal */
.form-group {
  margin-bottom: 1rem;
  text-align: left;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.9rem;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid var(--border-color);
  border-radius: 0.5rem;
  background: var(--surface-light);
  color: var(--text-primary);
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: var(--accent-purple);
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
  justify-content: space-between;
}

.btn-primary, .btn-secondary {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.btn-primary {
  background: var(--accent-purple);
  color: white;
  flex: 1;
}

.btn-primary:hover {
  background: var(--accent-purple-dark);
  transform: translateY(-1px);
}

.btn-secondary {
  background: var(--surface-light);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover {
  background: var(--background-dark);
  color: var(--text-primary);
}

/* Eye button container and button for clearing data */
.eye-container {
  margin-top: 3rem;
  margin-bottom: 2rem;
  text-align: left;
  padding-left: 1rem;
}

.eye-btn {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.3);
  border: none;
  color: white;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(5px);
  opacity: 0.6;
}

.eye-btn:hover {
  opacity: 1;
  transform: scale(1.1);
  background: rgba(0, 0, 0, 0.5);
}

/* Delete modal */
.delete-modal {
  background: var(--surface-dark);
  border-radius: 1rem;
  padding: 2rem;
  max-width: 350px;
  width: 90%;
  text-align: center;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-color);
}

.delete-modal h3 {
  color: var(--text-primary);
  margin-bottom: 1rem;
  font-size: 1.3rem;
  font-weight: 600;
}

.delete-modal p {
  color: var(--text-secondary);
  margin-bottom: 2rem;
  line-height: 1.5;
  font-size: 0.95rem;
}

.delete-options {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.delete-confirm-btn {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #DC2626, #B91C1C);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 80px;
}

.delete-confirm-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
}

.delete-cancel-btn {
  padding: 0.75rem 1.5rem;
  background: var(--surface-light);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 80px;
}

.delete-cancel-btn:hover {
  transform: translateY(-2px);
  background: var(--surface-lighter);
}

@media (max-width: 768px) {
  .add-transaction-btn {
    bottom: 1rem;
    right: 1rem;
    width: 4rem;
    height: 4rem;
    font-size: 1.5rem;
  }
  
  .eye-container {
    margin-top: 2rem;
    margin-bottom: 1.5rem;
  }
  
  .eye-btn {
    width: 2.5rem;
    height: 2.5rem;
    font-size: 1.2rem;
  }
}
</style>