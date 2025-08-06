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
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { transactionService } from '../services/database.js'
import EditTransactionModal from './EditTransactionModal.vue'

export default {
  name: 'AllTransactions',
  components: {
    EditTransactionModal
  },
  props: {
    categories: {
      type: Array,
      required: true
    }
  },
  setup(props) {
    const transactions = ref([])
    const selectedFilter = ref('all')
    const specificDate = ref('')
    const startDate = ref('')
    const endDate = ref('')
    const selectedTransaction = ref(null)

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
      console.log('All transactions:', transactions.value.length)
      console.log('Sample transaction dates:', transactions.value.slice(0, 3).map(t => ({ id: t.id, date: t.date, dateObj: new Date(t.date) })))
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
        
        console.log('Date range filter:', { startValue: startDate.value, endValue: endDateValue })
        
        filtered = filtered.filter(t => {
          // Convert transaction date to YYYY-MM-DD format for comparison
          const transactionDateStr = new Date(t.date).toISOString().split('T')[0]
          console.log('Checking transaction date string:', transactionDateStr, 'against range:', startDate.value, 'to', endDateValue)
          return transactionDateStr >= startDate.value && transactionDateStr <= endDateValue
        })
      }

      console.log('Filtered transactions:', filtered.length)
      return filtered.sort((a, b) => new Date(b.date) - new Date(a.date))
    })

    const getCategoryById = (categoryId) => {
      console.log('Looking for category:', categoryId, 'in categories:', props.categories)
      return props.categories.find(cat => cat.id === categoryId)
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
        await transactionService.update(updatedTransaction.id, updatedTransaction)
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
        console.log('Loaded transactions:', transactions.value)
      } catch (error) {
        console.error('Error loading transactions:', error)
      }
    }

    const applyFilters = () => {
      // Trigger reactivity
    }

    onMounted(() => {
      loadAllTransactions()
    })

    return {
      transactions,
      selectedFilter,
      specificDate,
      startDate,
      endDate,
      selectedTransaction,
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
      applyFilters
    }
  }
}
</script>

<style scoped>
.all-transactions {
  padding: 1rem;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
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
  border-color: var(--primary-color);
  background: var(--primary-color-light);
}

.filter-tab.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
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
  color: var(--primary-color);
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
  padding: 0.75rem 1rem;
  margin: 1.5rem 0 1rem 0;
  background: linear-gradient(135deg, var(--accent-purple), var(--accent-blue));
  color: white;
  font-weight: bold;
  font-size: 1rem;
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
</style>