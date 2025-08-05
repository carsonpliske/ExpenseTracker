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
      <button 
        @click="addExpense" 
        class="btn btn-secondary" 
        style="width: 100%; margin-top: 1rem;"
      >
        + Add Fixed Expense
      </button>
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
      <button 
        @click="addSubscription" 
        class="btn btn-secondary" 
        style="width: 100%; margin-top: 1rem;"
      >
        + Add Subscription
      </button>
    </div>

    <div class="budget-section">
      <h3>Monthly Expenses</h3>
      <div class="budget-item" v-for="category in variableCategories" :key="category.id">
        <div class="category-info">
          <span>{{ category.icon }} {{ category.name }}</span>
        </div>
        <div class="expense-amount">
          ${{ getMonthlySpendingForCategory(category.id).toFixed(2) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { budgetService, transactionService, migrateFromLocalStorage } from '../services/database.js'

export default {
  name: 'BudgetPlanner',
  setup() {
    const budget = ref({
      income: 0,
      fixedExpenses: [],
      subscriptions: []
    })
    
    const transactions = ref([])

    const variableCategories = [
      { id: 'groceries', name: 'Groceries', icon: '🛒', color: '#3B82F6' },
      { id: 'transport', name: 'Transport', icon: '🚗', color: '#F59E0B' },
      { id: 'leisure', name: 'Leisure', icon: '🎭', color: '#EC4899' },
      { id: 'restaurant', name: 'Restaurant', icon: '🍽️', color: '#8B5CF6' },
      { id: 'health', name: 'Health', icon: '💚', color: '#10B981' },
      { id: 'gifts', name: 'Gifts', icon: '🎁', color: '#EF4444' },
      { id: 'games', name: 'Games', icon: '🎮', color: '#A855F7' },
      { id: 'shopping', name: 'Shopping', icon: '🛍️', color: '#14B8A6' },
      { id: 'movies', name: 'Movies', icon: '🎬', color: '#F97316' },
      { id: 'education', name: 'Education', icon: '📚', color: '#6366F1' },
      { id: 'traveling', name: 'Traveling', icon: '✈️', color: '#06B6D4' },
      { id: 'electric', name: 'Electric', icon: '⚡', color: '#FACC15' },
      { id: 'water', name: 'Water', icon: '💧', color: '#0EA5E9' },
      { id: 'other', name: 'Other', icon: '📋', color: '#64748B' }
    ]

    const addExpense = async () => {
      budget.value.fixedExpenses.push({
        name: '',
        amount: 0
      })
      await saveBudget()
    }

    const removeExpense = async (index) => {
      budget.value.fixedExpenses.splice(index, 1)
      await saveBudget()
    }

    const addSubscription = async () => {
      budget.value.subscriptions.push({
        name: '',
        amount: 0
      })
      await saveBudget()
    }

    const removeSubscription = async (index) => {
      budget.value.subscriptions.splice(index, 1)
      await saveBudget()
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
      return variableCategories.reduce((sum, category) => {
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

    const saveBudget = async () => {
      try {
        await budgetService.save(budget.value)
      } catch (error) {
        console.error('Failed to save budget:', error)
      }
    }

    const loadBudget = async () => {
      try {
        const savedBudget = await budgetService.get()
        budget.value = { ...budget.value, ...savedBudget }
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

    onMounted(async () => {
      await migrateFromLocalStorage()
      await loadBudget()
      await loadTransactions()
    })

    return {
      budget,
      variableCategories,
      addExpense,
      removeExpense,
      addSubscription,
      removeSubscription,
      getTotalFixedExpenses,
      getTotalVariableExpenses,
      getTotalSubscriptions,
      getTotalExpenses,
      calculatePotentialSavings,
      saveBudget,
      getMonthlySpendingForCategory
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
</style>