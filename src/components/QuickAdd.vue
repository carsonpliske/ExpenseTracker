<template>
  <div class="quick-add">
    <div class="header">
      <h1>💰 Quick Add</h1>
      <div class="today-total">Today: ${{ todayTotal.toFixed(2) }}</div>
    </div>

    <div class="amount-section">
      <div class="amount-label">Amount</div>
      <div class="amount-input-container">
        <span class="dollar-sign">$</span>
        <input 
          ref="amountInput"
          v-model="amount" 
          type="number" 
          step="0.01" 
          inputmode="decimal"
          placeholder="0.00"
          class="amount-input"
          @input="validateAmount"
        >
      </div>
      
      <!-- Quick amount buttons -->
      <div class="quick-amounts">
        <button 
          v-for="quickAmount in commonAmounts" 
          :key="quickAmount"
          @click="amount = quickAmount"
          class="quick-amount-btn"
        >
          ${{ quickAmount }}
        </button>
      </div>
    </div>

    <div class="category-section">
      <div class="category-label">Category</div>
      <div class="categories-grid">
        <button
          v-for="category in topCategories"
          :key="category.id"
          @click="selectCategory(category.id)"
          :class="{ 
            'category-btn': true, 
            'selected': selectedCategoryId === category.id 
          }"
          :style="{ 
            backgroundColor: selectedCategoryId === category.id ? category.color : 'transparent',
            borderColor: category.color
          }"
        >
          <div class="category-icon">{{ category.icon }}</div>
          <div class="category-name">{{ category.name }}</div>
        </button>
      </div>
    </div>

    <div class="actions">
      <button 
        @click="addTransaction" 
        :disabled="!amount || !selectedCategoryId"
        class="add-btn"
      >
        Add Transaction
      </button>
      
      <button @click="goToMainApp" class="main-app-btn">
        Open Main App
      </button>
    </div>

    <!-- Success message -->
    <div v-if="showSuccess" class="success-message">
      ✅ Transaction added successfully!
    </div>

    <!-- Recent transactions -->
    <div v-if="recentTransactions.length > 0" class="recent-section">
      <div class="recent-label">Recent</div>
      <div class="recent-transactions">
        <button
          v-for="transaction in recentTransactions.slice(0, 3)"
          :key="transaction.id"
          @click="quickAddSimilar(transaction)"
          class="recent-transaction"
        >
          <span class="recent-icon">{{ getCategoryById(transaction.categoryId)?.icon }}</span>
          <span class="recent-amount">${{ transaction.amount }}</span>
          <span class="recent-category">{{ getCategoryById(transaction.categoryId)?.name }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, nextTick } from 'vue'
import { transactionService, migrateFromLocalStorage } from '../services/database.js'

export default {
  name: 'QuickAdd',
  setup() {
    const amount = ref('')
    const selectedCategoryId = ref('')
    const showSuccess = ref(false)
    const transactions = ref([])
    const amountInput = ref(null)

    // Common amounts for quick selection (adjust based on your spending patterns)
    const commonAmounts = [5, 10, 15, 20, 25, 50, 100]

    const categories = [
      { id: 'groceries', name: 'Groceries', icon: '🛒', color: '#3B82F6' },
      { id: 'restaurant', name: 'Restaurant', icon: '🍽️', color: '#8B5CF6' },
      { id: 'transport', name: 'Transport', icon: '🚗', color: '#F59E0B' },
      { id: 'health', name: 'Health', icon: '💚', color: '#10B981' },
      { id: 'shopping', name: 'Shopping', icon: '🛍️', color: '#14B8A6' },
      { id: 'games', name: 'Games', icon: '🎮', color: '#A855F7' },
      { id: 'movies', name: 'Movies', icon: '🎬', color: '#F97316' },
      { id: 'other', name: 'Other', icon: '📋', color: '#64748B' }
    ]

    // Top categories for quick access (most commonly used)
    const topCategories = categories.slice(0, 6)

    const todayTotal = computed(() => {
      const today = new Date()
      const todayStr = today.toDateString()
      
      return transactions.value
        .filter(t => new Date(t.date).toDateString() === todayStr)
        .reduce((sum, t) => sum + t.amount, 0)
    })

    const recentTransactions = computed(() => {
      return transactions.value
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5)
    })

    const getCategoryById = (categoryId) => {
      return categories.find(cat => cat.id === categoryId)
    }

    const selectCategory = (categoryId) => {
      selectedCategoryId.value = categoryId
    }

    const validateAmount = () => {
      // Remove any non-numeric characters except decimal point
      const cleanValue = amount.value.toString().replace(/[^\d.]/g, '')
      amount.value = cleanValue
    }

    const addTransaction = async () => {
      if (!amount.value || !selectedCategoryId.value) return

      const now = new Date()
      const newTransaction = {
        id: Date.now(),
        amount: parseFloat(amount.value),
        categoryId: selectedCategoryId.value,
        description: '', // Quick add doesn't include description
        date: now.toISOString()
      }

      try {
        await transactionService.add(newTransaction)
        transactions.value.unshift(newTransaction)
        
        // Reset form
        amount.value = ''
        selectedCategoryId.value = ''
        
        // Show success message
        showSuccess.value = true
        setTimeout(() => {
          showSuccess.value = false
        }, 2000)

        // Focus back on amount input
        nextTick(() => {
          if (amountInput.value) {
            amountInput.value.focus()
          }
        })

      } catch (error) {
        console.error('Failed to add transaction:', error)
        alert('Failed to add transaction. Please try again.')
      }
    }

    const quickAddSimilar = (transaction) => {
      amount.value = transaction.amount
      selectedCategoryId.value = transaction.categoryId
      // Optionally auto-add or let user confirm
      addTransaction()
    }

    const goToMainApp = () => {
      // Navigate to main app
      window.location.href = '/'
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
      await loadTransactions()
      
      // Auto-focus on amount input
      nextTick(() => {
        if (amountInput.value) {
          amountInput.value.focus()
        }
      })
    })

    return {
      amount,
      selectedCategoryId,
      showSuccess,
      amountInput,
      commonAmounts,
      topCategories,
      todayTotal,
      recentTransactions,
      getCategoryById,
      selectCategory,
      validateAmount,
      addTransaction,
      quickAddSimilar,
      goToMainApp
    }
  }
}
</script>

<style scoped>
.quick-add {
  min-height: 100vh;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.header {
  text-align: center;
  margin-bottom: 2rem;
}

.header h1 {
  font-size: 2rem;
  margin: 0 0 0.5rem 0;
  font-weight: 700;
}

.today-total {
  font-size: 1.1rem;
  opacity: 0.9;
  background: rgba(255, 255, 255, 0.2);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  display: inline-block;
}

.amount-section {
  margin-bottom: 2rem;
}

.amount-label, .category-label, .recent-label {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 1rem;
  text-align: center;
}

.amount-input-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.dollar-sign {
  font-size: 2rem;
  font-weight: bold;
  margin-right: 0.5rem;
}

.amount-input {
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 12px;
  padding: 1rem;
  font-size: 2rem;
  width: 200px;
  text-align: center;
  color: #333;
  font-weight: bold;
}

.amount-input:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.3);
}

.quick-amounts {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 1rem;
}

.quick-amount-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 60px;
}

.quick-amount-btn:hover, .quick-amount-btn:active {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.category-section {
  margin-bottom: 2rem;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  max-width: 400px;
  margin: 0 auto;
}

.category-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 1rem;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  min-height: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.category-btn:hover, .category-btn.selected {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.category-icon {
  font-size: 1.5rem;
}

.category-name {
  font-size: 0.9rem;
  font-weight: 600;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.add-btn {
  background: linear-gradient(135deg, #4CAF50, #45a049);
  border: none;
  color: white;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.add-btn:disabled {
  background: rgba(255, 255, 255, 0.2);
  cursor: not-allowed;
  transform: none;
}

.add-btn:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
}

.main-app-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 0.75rem 2rem;
  border-radius: 12px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.main-app-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.success-message {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #4CAF50;
  color: white;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-weight: bold;
  font-size: 1.1rem;
  z-index: 1000;
  animation: fadeInOut 2s ease-in-out;
}

@keyframes fadeInOut {
  0%, 100% { opacity: 0; }
  50% { opacity: 1; }
}

.recent-section {
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  padding-top: 1rem;
}

.recent-transactions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.recent-transaction {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 0.75rem;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 1rem;
  text-align: left;
}

.recent-transaction:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateX(5px);
}

.recent-icon {
  font-size: 1.2rem;
  min-width: 30px;
}

.recent-amount {
  font-weight: bold;
  min-width: 60px;
}

.recent-category {
  opacity: 0.8;
  font-size: 0.9rem;
}

/* iPhone-specific optimizations */
@media (max-width: 480px) {
  .quick-add {
    padding: 0.5rem;
  }
  
  .categories-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
  
  .category-btn {
    padding: 0.75rem 0.5rem;
    min-height: 70px;
  }
  
  .amount-input {
    width: 180px;
    font-size: 1.8rem;
  }
  
  .quick-amounts {
    gap: 0.3rem;
  }
  
  .quick-amount-btn {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
    min-width: 50px;
  }
}

/* Prevent zoom on input focus (iOS) */
@media (max-width: 480px) {
  input, select, textarea {
    font-size: 16px !important;
  }
}

/* Safe area handling for iPhone */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .quick-add {
    padding-bottom: calc(1rem + env(safe-area-inset-bottom));
  }
}
</style>