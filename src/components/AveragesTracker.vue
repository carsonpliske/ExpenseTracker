<template>
  <div class="averages-tracker">
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
      <div class="total-amount">${{ getTotalAverage().toFixed(2) }}</div>
      <div class="period-label">Average {{ getCurrentPeriodLabel() }} Spending</div>
    </div>

    <div class="categories-container">
      <div class="categories-grid">
        <div 
          v-for="category in categories" 
          :key="category.id"
          class="category-item"
        >
          <div 
            class="category-icon" 
            :style="{ backgroundColor: category.color }"
          >
            {{ category.icon }}
          </div>
          <div class="category-name">{{ category.name }}</div>
          <div class="category-amount">${{ getCategoryAverage(category.id).toFixed(2) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { transactionService, migrateFromLocalStorage } from '../services/database.js'

export default {
  name: 'AveragesTracker',
  setup() {
    const selectedPeriod = ref('weekly')
    const transactions = ref([])

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
    ])

    const getDateRange = () => {
      if (transactions.value.length === 0) return { start: new Date(), end: new Date() }
      
      const dates = transactions.value.map(t => {
        const date = new Date(t.date)
        // Handle UTC dates properly
        if (t.date.includes('T') && t.date.includes('Z')) {
          // For UTC dates, use UTC methods to avoid timezone shifts  
          return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
        }
        return date
      })
      const start = new Date(Math.min(...dates))
      const end = new Date(Math.max(...dates))
      
      return { start, end }
    }

    const getPeriodCount = () => {
      const { start, end } = getDateRange()
      const diffTime = Math.abs(end - start)
      
      switch (selectedPeriod.value) {
        case 'daily':
          return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
        case 'weekly':
          return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7)))
        case 'monthly':
          const startMonth = start.getMonth()
          const startYear = start.getFullYear()
          const endMonth = end.getMonth()
          const endYear = end.getFullYear()
          const monthDiff = (endYear - startYear) * 12 + (endMonth - startMonth)
          return Math.max(1, monthDiff + 1)
        case 'yearly':
          const yearDiff = end.getFullYear() - start.getFullYear()
          return Math.max(1, yearDiff + 1)
        default:
          return 1
      }
    }

    const getCategoryTotal = (categoryId) => {
      return transactions.value
        .filter(t => t.categoryId === categoryId)
        .reduce((sum, transaction) => sum + transaction.amount, 0)
    }

    const getCategoryAverage = (categoryId) => {
      const total = getCategoryTotal(categoryId)
      const periodCount = getPeriodCount()
      return total / periodCount
    }

    const getTotalAverage = () => {
      // Filter out rent transactions for total average calculation
      const nonRentTransactions = transactions.value.filter(t => t.categoryId !== 'rent')
      const total = nonRentTransactions.reduce((sum, transaction) => sum + transaction.amount, 0)
      const periodCount = getPeriodCount()
      return total / periodCount
    }

    const getCurrentPeriodLabel = () => {
      switch (selectedPeriod.value) {
        case 'daily':
          return 'Daily'
        case 'weekly':
          return 'Weekly'
        case 'monthly':
          return 'Monthly'
        case 'yearly':
          return 'Yearly'
        default:
          return ''
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
      await loadTransactions()
    })

    return {
      selectedPeriod,
      periods,
      categories,
      transactions,
      getCategoryAverage,
      getTotalAverage,
      getCurrentPeriodLabel
    }
  }
}
</script>

<style scoped>
.averages-tracker {
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
}

.period-selector {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
  background: var(--surface-light);
  padding: 0.5rem;
  border-radius: 1rem;
}

.period-btn {
  flex: 1;
  padding: 0.5rem 1rem;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.period-btn:hover:not(.active) {
  background: rgba(139, 92, 246, 0.1);
}

.period-btn.active {
  background: var(--primary-gradient);
  color: var(--text-primary);
  box-shadow: var(--shadow);
}

.expense-overview {
  text-align: center;
  margin-bottom: 2rem;
  padding: 2rem;
  background: linear-gradient(135deg, var(--accent-purple), var(--accent-blue));
  border-radius: 1rem;
  color: white;
}

.total-amount {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: white !important;
  background: none !important;
  -webkit-background-clip: unset !important;
  -webkit-text-fill-color: white !important;
  background-clip: unset !important;
}

.period-label {
  font-size: 1.1rem;
  opacity: 0.9;
}

.categories-container {
  margin-top: 2rem;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.category-item {
  background: var(--surface-dark);
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  padding: 1.5rem;
  text-align: center;
  transition: all 0.2s ease;
  cursor: pointer;
}

.category-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: var(--accent-purple);
}

.category-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin: 0 auto 1rem;
}

.category-name {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}

.category-amount {
  font-size: 1.25rem;
  font-weight: bold;
  color: var(--accent-green);
}

@media (max-width: 768px) {
  .categories-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 0.75rem;
  }
  
  .category-item {
    padding: 1rem;
  }
  
  .total-amount {
    font-size: 2.5rem;
  }
}</style>