<template>
  <div class="expense-tracker">
    <div class="period-selector">
      <button 
        v-for="period in periods" 
        :key="period.value"
        class="period-btn" 
        :class="{ active: selectedPeriod === period.value }"
        @click="selectedPeriod = period.value"
      >
        {{ period.label }}
      </button>
    </div>

    <div class="expense-overview">
      <div class="total-amount">${{ getTotalForPeriod().toFixed(2) }}</div>
      <div class="period-label">{{ getCurrentPeriodLabel() }}</div>
    </div>

    <!-- Mobile Layout -->
    <div class="mobile-layout">
      <div class="chart-container-center">
        <PieChart 
          :data="chartData" 
          size="large"
          @slice-click="handleSliceClick"
          @slice-long-press="handleSliceLongPress"
        />
      </div>
      
      <EnhancedLegend 
        :legend-data="legendData"
        :categories="categories"
        :highlighted-category="highlightedCategory"
        @category-click="handleLegendClick"
      />
    </div>

    <!-- Desktop Split Layout -->
    <div class="desktop-layout">
      <div class="desktop-left">
        <div class="chart-section">
          <PieChart 
            :data="chartData" 
            size="large"
            @slice-click="handleSliceClick"
            @slice-long-press="handleSliceLongPress"
          />
        </div>
        
        <EnhancedLegend 
          :legend-data="legendData"
          :categories="categories"
          :highlighted-category="highlightedCategory"
          @category-click="handleLegendClick"
        />
      </div>
      
      <div class="desktop-right">
        <SpendingInsights
          :transactions="getTransactionsForPeriod()"
          :categories="categories"
          :selected-period="selectedPeriod"
          :total-amount="getTotalForPeriod()"
          @transaction-select="handleTransactionSelect"
        />
      </div>
    </div>

    <div class="categories-container" :class="{ 'empty-state-spacing': !hasData }">
      <div class="categories-grid">
        <div 
          v-for="category in categories" 
          :key="category.id"
          class="category-item"
          @click.stop="selectCategory(category)"
        >
          <div 
            class="category-icon" 
            :style="{ backgroundColor: category.color }"
          >
            {{ category.icon }}
          </div>
          <div class="category-name">{{ category.name }}</div>
          <div class="category-amount">${{ getCategoryTotal(category.id).toFixed(2) }}</div>
        </div>
      </div>
    </div>

    <button class="add-transaction-btn" @click.stop="openAddModal">
      +
    </button>

    <TransactionModal 
      v-if="showAddModal"
      @close="closeAddModal"
      @save="addTransaction"
      :categories="categories"
    />

    <CategoryDetailModal
      v-if="showCategoryDetail && selectedCategory"
      :category="selectedCategory"
      :transactions="transactions"
      :currentPeriod="selectedPeriod"
      :allCategories="categories"
      @close="closeCategoryDetail"
      @delete-transaction="deleteTransaction"
      @edit-transaction="editTransaction"
    />

    <EditTransactionModal
      v-if="showTransactionEdit && selectedTransaction"
      :transaction="selectedTransaction"
      :categories="categories"
      @close="closeTransactionEdit"
      @save="editTransaction"
      @delete="deleteTransaction"
    />

    <ColorPickerModal
      v-if="showColorPicker && colorPickerCategory"
      :category-name="colorPickerCategory.name"
      :current-color="colorPickerCategory.color"
      @close="closeColorPicker"
      @save="saveColor"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import TransactionModal from './TransactionModal.vue'
import CategoryDetailModal from './CategoryDetailModal.vue'
import EditTransactionModal from './EditTransactionModal.vue'
import ColorPickerModal from './ColorPickerModal.vue'
import PieChart from './PieChart.vue'
import EnhancedLegend from './EnhancedLegend.vue'
import SpendingInsights from './SpendingInsights.vue'
import { transactionService, migrateFromLocalStorage } from '../services/database.js'

export default {
  name: 'ExpenseTracker',
  components: {
    TransactionModal,
    CategoryDetailModal,
    EditTransactionModal,
    ColorPickerModal,
    PieChart,
    EnhancedLegend,
    SpendingInsights
  },
  emits: ['categories-loaded'],
  setup(props, { emit }) {
    const selectedPeriod = ref('monthly')
    const showAddModal = ref(false)
    const showCategoryDetail = ref(false)
    const selectedCategory = ref(null)
    const highlightedCategory = ref(null)
    const transactions = ref([])
    const showTransactionEdit = ref(false)
    const selectedTransaction = ref(null)
    const showColorPicker = ref(false)
    const colorPickerCategory = ref(null)

    const periods = [
      { value: 'daily', label: 'Daily' },
      { value: 'weekly', label: 'Weekly' },
      { value: 'monthly', label: 'Monthly' },
      { value: 'yearly', label: 'Yearly' }
    ]

    const categories = ref([
      { id: 'rent', name: 'Rent', icon: '🏠', color: '#DC2626' },
      { id: 'groceries', name: 'Groceries', icon: '🛒', color: '#3B82F6' },
      { id: 'transport', name: 'Transport', icon: '🚗', color: '#F59E0B' },
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
    ])

    const getTotalForPeriod = () => {
      const filtered = getTransactionsForPeriod()
      return filtered.reduce((sum, transaction) => sum + transaction.amount, 0)
    }

    const getCategoryTotal = (categoryId) => {
      const filtered = getTransactionsForPeriod()
      return filtered
        .filter(t => t.categoryId === categoryId)
        .reduce((sum, transaction) => sum + transaction.amount, 0)
    }

    const getTransactionsForPeriod = () => {
      const now = new Date()
      return transactions.value.filter(transaction => {
        const transactionDate = new Date(transaction.date)
        
        // Ensure we're working with valid dates
        if (isNaN(transactionDate.getTime())) return false
        
        switch (selectedPeriod.value) {
          case 'daily':
            return transactionDate.toDateString() === now.toDateString()
          case 'weekly':
            const weekStart = new Date(now)
            weekStart.setDate(now.getDate() - now.getDay())
            weekStart.setHours(0, 0, 0, 0)
            
            const weekEnd = new Date(weekStart)
            weekEnd.setDate(weekStart.getDate() + 6)
            weekEnd.setHours(23, 59, 59, 999)
            
            return transactionDate >= weekStart && transactionDate <= weekEnd
          case 'monthly':
            // Handle UTC dates properly by using UTC methods for comparison
            let transactionMonth, transactionYear
            if (transaction.date.includes('T') && transaction.date.includes('Z')) {
              // This is a UTC ISO string, use UTC methods
              transactionMonth = transactionDate.getUTCMonth()
              transactionYear = transactionDate.getUTCFullYear()
            } else {
              // Local date, use local methods
              transactionMonth = transactionDate.getMonth()
              transactionYear = transactionDate.getFullYear()
            }
            
            const currentMonth = now.getMonth()
            const currentYear = now.getFullYear()
            
            return transactionMonth === currentMonth && transactionYear === currentYear
          case 'yearly':
            // Handle UTC dates for yearly comparison too
            let transactionYearForYearly
            if (transaction.date.includes('T') && transaction.date.includes('Z')) {
              transactionYearForYearly = transactionDate.getUTCFullYear()
            } else {
              transactionYearForYearly = transactionDate.getFullYear()
            }
            return transactionYearForYearly === now.getFullYear()
          default:
            return true
        }
      })
    }

    const getCurrentPeriodLabel = () => {
      const now = new Date()
      switch (selectedPeriod.value) {
        case 'daily':
          return now.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })
        case 'weekly':
          const weekStart = new Date(now)
          weekStart.setDate(now.getDate() - now.getDay())
          return `Week of ${weekStart.toLocaleDateString()}`
        case 'monthly':
          return now.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long' 
          })
        case 'yearly':
          return now.getFullYear().toString()
        default:
          return ''
      }
    }

    const chartData = computed(() => {
      const categoryTotals = categories.value
        .filter(category => category.id !== 'rent')
        .map(category => ({
          label: category.name,
          value: getCategoryTotal(category.id),
          color: category.color
        })).filter(item => item.value > 0)

      return {
        labels: categoryTotals.map(item => item.label),
        datasets: [{
          data: categoryTotals.map(item => item.value),
          backgroundColor: categoryTotals.map(item => item.color),
          borderWidth: 0
        }]
      }
    })

    const legendData = computed(() => {
      return categories.value.map(category => ({
        categoryId: category.id,
        label: category.name,
        amount: getCategoryTotal(category.id),
        icon: category.icon,
        color: category.color
      }))
    })

    const hasData = computed(() => {
      return getTotalForPeriod() > 0
    })

    const handleSliceClick = (sliceData) => {
      const categoryName = sliceData.label
      const category = categories.value.find(cat => cat.name === categoryName)
      if (category) {
        highlightedCategory.value = highlightedCategory.value === category.id ? null : category.id
      }
    }

    const handleLegendClick = (categoryId) => {
      highlightedCategory.value = highlightedCategory.value === categoryId ? null : categoryId
    }

    const handleSliceLongPress = (sliceData) => {
      const categoryName = sliceData.label
      const category = categories.value.find(cat => cat.name === categoryName)
      if (category) {
        colorPickerCategory.value = category
        showColorPicker.value = true
      }
    }

    const closeColorPicker = () => {
      showColorPicker.value = false
      colorPickerCategory.value = null
    }

    const saveColor = (newColor) => {
      if (colorPickerCategory.value) {
        const categoryIndex = categories.value.findIndex(cat => cat.id === colorPickerCategory.value.id)
        if (categoryIndex !== -1) {
          categories.value[categoryIndex].color = newColor
          // Save to localStorage for persistence
          localStorage.setItem('expense-tracker-custom-colors', JSON.stringify(
            categories.value.reduce((acc, cat) => {
              acc[cat.id] = cat.color
              return acc
            }, {})
          ))
        }
      }
      closeColorPicker()
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
      
      await transactionService.add(newTransaction)
      transactions.value.push(newTransaction)
      showAddModal.value = false
    }

    const openAddModal = () => {
      showAddModal.value = true
    }

    const closeAddModal = () => {
      showAddModal.value = false
    }

    const selectCategory = (category) => {
      selectedCategory.value = category
      showCategoryDetail.value = true
    }

    const closeCategoryDetail = () => {
      showCategoryDetail.value = false
      selectedCategory.value = null
    }

    const closeTransactionEdit = () => {
      showTransactionEdit.value = false
      selectedTransaction.value = null
    }

    const deleteTransaction = async (transactionId) => {
      await transactionService.delete(transactionId)
      transactions.value = transactions.value.filter(t => t.id !== transactionId)
      // Close the transaction edit modal if it's open
      if (showTransactionEdit.value) {
        showTransactionEdit.value = false
        selectedTransaction.value = null
      }
    }

    const editTransaction = async (editedTransaction) => {
      const index = transactions.value.findIndex(t => t.id === editedTransaction.id)
      if (index !== -1) {
        const originalTransaction = transactions.value[index]
        let dateToStore = editedTransaction.date
        
        if (editedTransaction.date) {
          // If it's in YYYY-MM-DD format from date input
          if (typeof editedTransaction.date === 'string' && editedTransaction.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [year, month, day] = editedTransaction.date.split('-')
            const originalDate = new Date(originalTransaction.date)
            
            // Use the selected date but preserve the original time (hours, minutes, seconds, ms)
            dateToStore = new Date(
              parseInt(year), 
              parseInt(month) - 1, 
              parseInt(day), 
              originalDate.getHours(),
              originalDate.getMinutes(),
              originalDate.getSeconds(),
              originalDate.getMilliseconds()
            ).toISOString()
          } else {
            dateToStore = new Date(editedTransaction.date).toISOString()
          }
        }
        
        const updatedTransaction = {
          ...editedTransaction,
          date: dateToStore
        }
        
        await transactionService.update(updatedTransaction)
        transactions.value[index] = updatedTransaction
      }
    }

    const handleTransactionSelect = (transaction) => {
      const category = categories.value.find(cat => cat.id === transaction.categoryId)
      selectedCategory.value = category
      selectedTransaction.value = transaction
      showTransactionEdit.value = true
    }

    const loadTransactions = async () => {
      try {
        transactions.value = await transactionService.getAll()
      } catch (error) {
        console.error('Failed to load transactions:', error)
      }
    }

    const loadCustomColors = () => {
      try {
        const customColors = localStorage.getItem('expense-tracker-custom-colors')
        if (customColors) {
          const colorMap = JSON.parse(customColors)
          categories.value.forEach(category => {
            if (colorMap[category.id]) {
              category.color = colorMap[category.id]
            }
          })
        }
      } catch (error) {
        console.error('Failed to load custom colors:', error)
      }
    }

    onMounted(async () => {
      await migrateFromLocalStorage()
      loadCustomColors()
      await loadTransactions()
      // Emit categories to parent component
      emit('categories-loaded', categories.value)
    })

    return {
      selectedPeriod,
      showAddModal,
      showCategoryDetail,
      selectedCategory,
      highlightedCategory,
      periods,
      categories,
      transactions,
      getTotalForPeriod,
      getCategoryTotal,
      getTransactionsForPeriod,
      getCurrentPeriodLabel,
      chartData,
      legendData,
      hasData,
      handleSliceClick,
      handleLegendClick,
      addTransaction,
      openAddModal,
      closeAddModal,
      selectCategory,
      closeCategoryDetail,
      closeTransactionEdit,
      deleteTransaction,
      editTransaction,
      handleTransactionSelect,
      showTransactionEdit,
      selectedTransaction,
      handleSliceLongPress,
      showColorPicker,
      colorPickerCategory,
      closeColorPicker,
      saveColor
    }
  }
}
</script>

<style scoped>
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


/* Only apply aggressive negative margin on mobile devices */
@media (max-width: 768px) {
  .categories-container.empty-state-spacing {
    margin-top: -8rem;
  }
}

/* On desktop, use minimal negative margin to avoid overlapping spending insights */
@media (min-width: 769px) {
  .categories-container.empty-state-spacing {
    margin-top: 0;
  }
}

@media (max-width: 768px) {
  .add-transaction-btn {
    bottom: 1rem;
    right: 1rem;
    width: 4rem;
    height: 4rem;
    font-size: 1.5rem;
  }
}
</style>