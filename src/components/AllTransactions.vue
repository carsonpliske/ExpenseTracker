<template>
  <div class="all-transactions">
    <div class="filter-section">
      <div class="filter-tabs">
        <button 
          v-for="filter in filters" 
          :key="filter.value"
          :class="{ active: selectedFilter === filter.value }"
          @click="selectedFilter = filter.value"
          class="filter-tab"
        >
          {{ filter.label }}
        </button>
      </div>
      
      <div v-if="selectedFilter === 'specific'" class="date-picker-section">
        <input 
          v-model="specificDate" 
          type="date" 
          class="date-picker"
          @change="applyFilters"
        >
      </div>
      
      <div v-if="selectedFilter === 'range'" class="date-range-section">
        <div class="date-range-inputs">
          <div class="date-input-group">
            <label>From:</label>
            <input 
              v-model="startDate" 
              type="date" 
              class="date-picker"
              @change="applyFilters"
            >
          </div>
          <div class="date-input-group">
            <label>To:</label>
            <input 
              v-model="endDate" 
              type="date" 
              class="date-picker"
              @change="applyFilters"
            >
          </div>
        </div>
      </div>
      
      <!-- Search Section -->
      <div class="search-section">
        <div class="search-input-container">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Search transactions (e.g., 'rent', 'taco bell', 'groceries')..."
            class="search-input"
            @input="applyFilters"
          >
          <div class="search-icon">🔍</div>
        </div>
        <div v-if="searchQuery && filteredTransactions.length === 0" class="search-no-results">
          No transactions found for "{{ searchQuery }}"
        </div>
        <div v-if="searchQuery && filteredTransactions.length > 0" class="search-results-count">
          Found {{ filteredTransactions.length }} transaction{{ filteredTransactions.length === 1 ? '' : 's' }} for "{{ searchQuery }}"
        </div>
      </div>
    </div>

    <!-- Period Header -->
    <div v-if="shouldShowPeriodHeader" class="period-header">
      {{ getPeriodHeaderText() }}
    </div>

    <div class="transactions-list">
      <div v-if="filteredTransactions.length === 0" class="no-transactions">
        <div class="no-transactions-icon">📊</div>
        <div class="no-transactions-text">No transactions found</div>
      </div>
      
      <template v-for="(transaction, index) in filteredTransactions" :key="transaction.id">
        <!-- Month header for 'All' filter -->
        <div 
          v-if="selectedFilter === 'all' && shouldShowMonthHeader(transaction, index)"
          class="month-header"
        >
          {{ getMonthHeaderText(transaction.date) }}
        </div>
        
        <div 
          class="transaction-item"
          :style="{ backgroundColor: getTransactionBgColor(transaction.categoryId) }"
          @click="selectTransaction(transaction)"
        >
          <div class="transaction-left">
            <div class="transaction-details">
              <div class="category-name">{{ getCategoryById(transaction.categoryId)?.name }}</div>
              <div v-if="transaction.description" class="transaction-description">{{ transaction.description }}</div>
              <div class="transaction-amount">${{ transaction.amount }}</div>
              <div class="transaction-date">{{ formatDate(transaction.date) }}</div>
            </div>
          </div>
          <div class="transaction-right">
            <div class="category-icon" :style="{ backgroundColor: getCategoryById(transaction.categoryId)?.color }">
              {{ getCategoryById(transaction.categoryId)?.icon }}
            </div>
          </div>
        </div>
      </template>
    </div>

    <EditTransactionModal
      v-if="selectedTransaction"
      :transaction="selectedTransaction"
      :categories="categories"
      @close="selectedTransaction = null"
      @save="updateTransaction"
      @delete="deleteTransaction"
    />

    <button class="add-transaction-btn" @click.stop="showAddModal = true">
      +
    </button>

    <TransactionModal 
      v-if="showAddModal"
      @close="showAddModal = false"
      @save="addTransaction"
      :categories="categories"
    />
    
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { transactionService } from '../services/database.js'
import EditTransactionModal from './EditTransactionModal.vue'
import TransactionModal from './TransactionModal.vue'

export default {
  name: 'AllTransactions',
  components: {
    EditTransactionModal,
    TransactionModal
  },
  props: {
    categories: {
      type: Array,
      required: false,
      default: () => []
    }
  },
  setup(props) {
    
    const transactions = ref([])
    const categories = ref([])
    const selectedFilter = ref('all')
    const specificDate = ref('')
    const startDate = ref('')
    const endDate = ref('')
    const selectedTransaction = ref(null)
    const showAddModal = ref(false)
    const searchQuery = ref('')

    const filters = [
      { value: 'all', label: 'All' },
      { value: 'month', label: 'This Month' },
      { value: 'week', label: 'This Week' },
      { value: 'specific', label: 'Specific Date' },
      { value: 'range', label: 'Date Range' }
    ]

    const getCurrentLocalDate = () => {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    const filteredTransactions = computed(() => {
      let filtered = [...transactions.value]
      const now = new Date()

      if (selectedFilter.value === 'month') {
        const currentMonth = now.getMonth()
        const currentYear = now.getFullYear()
        filtered = filtered.filter(t => {
          const transactionDate = new Date(t.date)
          return transactionDate.getMonth() === currentMonth && 
                 transactionDate.getFullYear() === currentYear
        })
      } else if (selectedFilter.value === 'week') {
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - now.getDay())
        weekStart.setHours(0, 0, 0, 0)
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        weekEnd.setHours(23, 59, 59, 999)
        
        filtered = filtered.filter(t => {
          const transactionDate = new Date(t.date)
          return transactionDate >= weekStart && transactionDate <= weekEnd
        })
      } else if (selectedFilter.value === 'specific' && specificDate.value) {
        filtered = filtered.filter(t => {
          const transactionDate = new Date(t.date).toISOString().split('T')[0]
          return transactionDate === specificDate.value
        })
      } else if (selectedFilter.value === 'range' && startDate.value) {
        // If no end date, use start date as end date
        const endDateValue = endDate.value || startDate.value
        
        filtered = filtered.filter(t => {
          // Convert transaction date to YYYY-MM-DD format for comparison
          const transactionDateStr = new Date(t.date).toISOString().split('T')[0]
          return transactionDateStr >= startDate.value && transactionDateStr <= endDateValue
        })
      }

      // Apply search filter if there's a search query
      if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase().trim()
        filtered = filtered.filter(transaction => {
          // Get category name
          const category = getCategoryById(transaction.categoryId)
          const categoryName = category ? category.name.toLowerCase() : ''
          
          // Get description (if exists)
          const description = transaction.description ? transaction.description.toLowerCase() : ''
          
          // Search in both category name and description
          return categoryName.includes(query) || description.includes(query)
        })
      }

      return filtered.sort((a, b) => new Date(b.date) - new Date(a.date))
    })

    const baseCategoriesData = [
      { id: 'rent', name: 'Rent', icon: '🏠', darkColor: '#DC2626', lightColor: '#991B1B' },
      { id: 'groceries', name: 'Groceries', icon: '🛒', darkColor: '#3B82F6', lightColor: '#1D4ED8' },
      { id: 'transport', name: 'Transport', icon: '🚗', darkColor: '#F59E0B', lightColor: '#D97706' },
      { id: 'restaurant', name: 'Restaurant', icon: '🍽️', darkColor: '#8B5CF6', lightColor: '#7C3AED' },
      { id: 'health', name: 'Health', icon: '💚', darkColor: '#10B981', lightColor: '#059669' },
      { id: 'gifts', name: 'Gifts', icon: '🎁', darkColor: '#EF4444', lightColor: '#DC2626' },
      { id: 'games', name: 'Games', icon: '🎮', darkColor: '#A855F7', lightColor: '#9333EA' },
      { id: 'shopping', name: 'Shopping', icon: '🛍️', darkColor: '#14B8A6', lightColor: '#0F766E' },
      { id: 'movies', name: 'Movies', icon: '🎬', darkColor: '#F97316', lightColor: '#EA580C' },
      { id: 'education', name: 'Education', icon: '📚', darkColor: '#6366F1', lightColor: '#4F46E5' },
      { id: 'traveling', name: 'Traveling', icon: '✈️', darkColor: '#06B6D4', lightColor: '#0284C7' },
      { id: 'electric', name: 'Electric', icon: '⚡', darkColor: '#FACC15', lightColor: '#CA8A04' },
      { id: 'water', name: 'Water', icon: '💧', darkColor: '#0EA5E9', lightColor: '#0369A1' },
      { id: 'other', name: 'Other', icon: '📋', darkColor: '#64748B', lightColor: '#475569' }
    ]

    // Get current theme
    const getCurrentTheme = () => {
      return document.documentElement.getAttribute('data-theme') || 'dark'
    }

    // Load categories directly in AllTransactions (same as ExpenseTracker)
    const loadCategories = () => {
      const currentTheme = getCurrentTheme()
      categories.value = baseCategoriesData.map(cat => ({
        ...cat,
        color: currentTheme === 'light' ? cat.lightColor : cat.darkColor
      }))

      // Load custom colors if they exist
      try {
        const customColors = JSON.parse(localStorage.getItem('expense-tracker-custom-colors') || '{}')
        categories.value.forEach(category => {
          if (customColors[category.id]) {
            category.color = customColors[category.id]
          }
        })
      } catch (error) {
        console.error('Failed to load custom colors:', error)
      }
    }

    const getCategoryById = (categoryId) => {
      return categories.value.find(cat => cat.id === categoryId)
    }

    const getTransactionBgColor = (categoryId) => {
      const category = getCategoryById(categoryId)
      if (!category) return 'var(--card-bg)'
      
      // Convert hex color to RGB and add low opacity for subtle background
      const hexColor = category.color
      const r = parseInt(hexColor.slice(1, 3), 16)
      const g = parseInt(hexColor.slice(3, 5), 16)
      const b = parseInt(hexColor.slice(5, 7), 16)
      
      // Return a very subtle version of the category color
      return `rgba(${r}, ${g}, ${b}, 0.08)`
    }

    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      })
    }

    const shouldShowPeriodHeader = computed(() => {
      return selectedFilter.value === 'month' || selectedFilter.value === 'week'
    })

    const getPeriodHeaderText = () => {
      const now = new Date()
      
      if (selectedFilter.value === 'month') {
        return now.toLocaleDateString('en-US', { 
          month: 'long', 
          year: 'numeric' 
        })
      } else if (selectedFilter.value === 'week') {
        // Get start of week (Sunday)
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - now.getDay())
        
        // Get end of week (Saturday)
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        
        const startStr = weekStart.toLocaleDateString('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: 'numeric'
        })
        
        const endStr = weekEnd.toLocaleDateString('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: 'numeric'
        })
        
        return `${startStr} - ${endStr}`
      }
      
      return ''
    }

    const shouldShowMonthHeader = (transaction, index) => {
      if (index === 0) return true // Always show for first transaction
      
      const currentTransactionDate = new Date(transaction.date)
      const previousTransaction = filteredTransactions.value[index - 1]
      const previousTransactionDate = new Date(previousTransaction.date)
      
      // Show header if this transaction is in a different month than the previous one
      return currentTransactionDate.getMonth() !== previousTransactionDate.getMonth() ||
             currentTransactionDate.getFullYear() !== previousTransactionDate.getFullYear()
    }

    const getMonthHeaderText = (dateString) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      })
    }

    const selectTransaction = (transaction) => {
      selectedTransaction.value = transaction
    }

    const updateTransaction = async (updatedTransaction) => {
      try {
        await transactionService.update(updatedTransaction)
        await loadAllTransactions()
        selectedTransaction.value = null
      } catch (error) {
        console.error('Error updating transaction:', error)
      }
    }

    const deleteTransaction = async (transactionId) => {
      try {
        await transactionService.delete(transactionId)
        await loadAllTransactions()
        selectedTransaction.value = null
      } catch (error) {
        console.error('Error deleting transaction:', error)
      }
    }

    const loadAllTransactions = async () => {
      try {
        transactions.value = await transactionService.getAll()
      } catch (error) {
        console.error('Error loading transactions:', error)
      }
    }

    const applyFilters = () => {
      // Trigger reactivity
    }

    const addTransaction = async (transaction) => {
      let dateToStore = new Date().toISOString()
      if (transaction.date) {
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
      
      await transactionService.add(newTransaction)
      transactions.value.push(newTransaction)
      showAddModal.value = false
    }

    onMounted(() => {
      loadAllTransactions()
      loadCategories()
    })

    // Watch for changes in categories prop
    watch(() => props.categories, (newCategories) => {
      // Categories prop changes are handled by local loadCategories()
    }, { deep: true })

    return {
      transactions,
      categories,
      selectedFilter,
      specificDate,
      startDate,
      endDate,
      selectedTransaction,
      showAddModal,
      searchQuery,
      filters,
      filteredTransactions,
      getCategoryById,
      getTransactionBgColor,
      formatDate,
      shouldShowPeriodHeader,
      getPeriodHeaderText,
      shouldShowMonthHeader,
      getMonthHeaderText,
      selectTransaction,
      updateTransaction,
      deleteTransaction,
      addTransaction,
      applyFilters
    }
  }
}
</script>

<style scoped>
.all-transactions {
  padding: 1rem;
}

.filter-section {
  margin-bottom: 1.5rem;
}

.filter-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.filter-tab {
  padding: 0.5rem 1rem;
  border: 2px solid var(--border-color);
  border-radius: 20px;
  background: var(--card-bg);
  color: var(--text-primary);
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.filter-tab:hover {
  border-color: var(--accent-purple);
  background: rgba(139, 92, 246, 0.1);
}

.filter-tab.active {
  background: var(--primary-gradient);
  color: white;
  border-color: var(--accent-purple);
}

/* Light mode specific active filter tab styling */
[data-theme="light"] .filter-tab.active {
  background: linear-gradient(135deg, #7C3AED, #5B21B6);
  color: white;
  border-color: #7C3AED;
}

.date-picker-section {
  margin-top: 1rem;
  padding: 1rem;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(59, 130, 246, 0.08));
  border-radius: 12px;
  border: 1px solid rgba(139, 92, 246, 0.2);
}

.date-range-section {
  margin-top: 1rem;
  padding: 1rem;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(59, 130, 246, 0.08));
  border-radius: 12px;
  border: 1px solid rgba(139, 92, 246, 0.2);
}

.date-range-inputs {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.date-input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.date-input-group label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--accent-purple);
}

.date-picker {
  padding: 0.75rem;
  border: 2px solid rgba(139, 92, 246, 0.4);
  border-radius: 12px;
  background: rgba(139, 92, 246, 0.15);
  color: var(--text-primary);
  font-size: 1rem;
  width: 100%;
  max-width: 200px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(139, 92, 246, 0.2);
}

.date-picker:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2);
  background: rgba(139, 92, 246, 0.2);
}

.date-picker:hover {
  border-color: rgba(139, 92, 246, 0.6);
  background: rgba(139, 92, 246, 0.18);
}

.period-header {
  text-align: center;
  padding: 1rem;
  margin: 1rem 0;
  background: linear-gradient(135deg, var(--accent-purple), var(--accent-blue));
  color: white;
  font-weight: bold;
  font-size: 1.1rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.2);
}



.month-header {
  text-align: center;
  padding: 1rem;
  margin: 1rem 0;
  background: linear-gradient(135deg, var(--accent-purple), var(--accent-blue));
  color: white;
  font-weight: bold;
  font-size: 1.1rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.2);
}

.transactions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.no-transactions {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--text-secondary);
}

.no-transactions-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.6;
}

.no-transactions-text {
  font-size: 1.1rem;
  font-weight: 500;
}

.transaction-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1rem;
  border: 2px solid var(--border-color);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  gap: 1rem;
}

.transaction-item:hover {
  border-color: var(--primary-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.1);
}

.transaction-left {
  flex: 1;
  min-width: 0;
}

.transaction-details {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.category-name {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 1rem;
  line-height: 1.2;
}

.transaction-description {
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.3;
  word-break: break-word;
  margin-bottom: 0.2rem;
}

.transaction-amount {
  font-weight: 600;
  font-size: 1.1rem;
  color: var(--text-primary);
  margin-top: 0.2rem;
}

.transaction-date {
  color: var(--text-secondary);
  font-size: 0.85rem;
  margin-top: 0.1rem;
}

.transaction-right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.category-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: white;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .all-transactions {
    padding: 0.75rem;
  }
  
  .filter-tabs {
    gap: 0.25rem;
  }
  
  .filter-tab {
    padding: 0.4rem 0.8rem;
    font-size: 0.85rem;
  }
  
  .transaction-item {
    padding: 0.75rem;
    gap: 0.75rem;
  }
  
  .category-icon {
    width: 2rem;
    height: 2rem;
    font-size: 1rem;
  }
  
  .category-name {
    font-size: 0.9rem;
  }
  
  .transaction-description {
    font-size: 0.8rem;
  }
  
  .transaction-amount {
    font-size: 1rem;
  }
  
  .transaction-date {
    font-size: 0.8rem;
  }
  
  .period-header {
    padding: 0.75rem;
    margin: 0.75rem 0;
    font-size: 1rem;
  }
  
  .month-header {
    padding: 0.6rem 0.75rem;
    margin: 1rem 0 0.75rem 0;
    font-size: 0.95rem;
  }
  
  .date-range-inputs {
    flex-direction: row;
    justify-content: space-between;
  }
  
  .date-input-group {
    flex: 1;
    max-width: calc(50% - 0.5rem);
  }
  
  .date-input-group .date-picker {
    max-width: 100%;
  }
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

/* Search Section Styles */
.search-section {
  margin-top: 1rem;
  padding: 1rem;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(59, 130, 246, 0.05));
  border-radius: 12px;
  border: 1px solid rgba(139, 92, 246, 0.1);
}

.search-input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  padding-right: 3rem;
  border: 2px solid rgba(139, 92, 246, 0.2);
  border-radius: 12px;
  background: var(--surface-light);
  color: var(--text-primary);
  font-size: 1rem;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(139, 92, 246, 0.1);
}

.search-input:focus {
  outline: none;
  border-color: var(--accent-purple);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2);
  background: var(--surface-dark);
}

.search-input::placeholder {
  color: var(--text-muted);
  opacity: 0.8;
}

.search-icon {
  position: absolute;
  right: 1rem;
  font-size: 1.2rem;
  color: var(--text-muted);
  pointer-events: none;
}

.search-no-results {
  margin-top: 1rem;
  padding: 0.75rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  color: var(--accent-red);
  font-weight: 500;
  text-align: center;
}

.search-results-count {
  margin-top: 1rem;
  padding: 0.75rem;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 8px;
  color: var(--accent-green);
  font-weight: 500;
  text-align: center;
}

@media (max-width: 768px) {
  .add-transaction-btn {
    bottom: 1rem;
    right: 1rem;
    width: 4rem;
    height: 4rem;
    font-size: 1.5rem;
  }
  
  .search-input {
    font-size: 0.9rem;
    padding: 0.65rem 0.85rem;
    padding-right: 2.5rem;
  }
  
  .search-icon {
    right: 0.85rem;
    font-size: 1rem;
  }
  
  .search-input::placeholder {
    font-size: 0.85rem;
  }
}
</style>