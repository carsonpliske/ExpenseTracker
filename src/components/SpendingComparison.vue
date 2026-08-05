<template>
  <div class="spending-comparison">
    <div class="month-picker-row">
      <MonthSelector
        :label="`From: ${monthLabel(monthA)}`"
        :months="availableMonths"
        :selected-year="monthA.year"
        :selected-month="monthA.month"
        @select="(m) => (monthA = m)"
      />
      <span class="picker-arrow">→</span>
      <MonthSelector
        :label="`To: ${monthLabel(monthB)}`"
        :months="availableMonths"
        :selected-year="monthB.year"
        :selected-month="monthB.month"
        @select="(m) => (monthB = m)"
      />
    </div>

    <div class="summary-card">
      <div class="summary-totals">
        <div class="summary-total">
          <div class="summary-total-label">{{ monthLabel(monthA) }}</div>
          <div class="summary-total-amount">${{ totalA.toFixed(2) }}</div>
        </div>
        <div class="summary-total">
          <div class="summary-total-label">{{ monthLabel(monthB) }}</div>
          <div class="summary-total-amount">${{ totalB.toFixed(2) }}</div>
        </div>
      </div>
      <div class="summary-change" :class="changeClass(totalChangeAmount)">
        {{ formatChangeText(totalChange) }}
      </div>
    </div>

    <div v-if="comparisonRows.length === 0" class="empty-state">
      <div style="font-size: 3rem; margin-bottom: 1rem;">📊</div>
      <h4>No spending to compare</h4>
      <p>Neither {{ monthLabel(monthA) }} nor {{ monthLabel(monthB) }} has any transactions yet.</p>
    </div>

    <div v-else class="comparison-list">
      <div
        v-for="row in comparisonRows"
        :key="row.category.id"
        class="comparison-row"
        @click="openCategoryDetail(row)"
      >
        <div
          class="category-icon"
          :style="{ backgroundColor: (row.category.iconType === 'image' && row.category.image) ? 'transparent' : row.category.color }"
        >
          <img
            v-if="row.category.iconType === 'image' && row.category.image"
            :src="row.category.image"
            alt="category icon"
            class="category-image"
          />
          <span v-else>{{ row.category.icon || '📋' }}</span>
        </div>

        <div class="comparison-details">
          <div class="comparison-name">{{ row.category.name }}</div>
          <div class="comparison-amounts">
            ${{ row.amountA.toFixed(2) }} <span class="amounts-arrow">→</span> ${{ row.amountB.toFixed(2) }}
          </div>
        </div>

        <div class="comparison-change" :class="changeClass(row.change)">
          {{ formatChangeText(row) }}
        </div>
      </div>
    </div>

    <CompareCategoryDetailModal
      v-if="selectedCompareRow"
      :category="selectedCompareRow.category"
      :month-a-label="monthLabel(monthA)"
      :month-b-label="monthLabel(monthB)"
      :transactions-a="transactionsForCategoryMonth(selectedCompareRow.category.id, monthA)"
      :transactions-b="transactionsForCategoryMonth(selectedCompareRow.category.id, monthB)"
      @close="selectedCompareRow = null"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { transactionService, customCategoryService, migrateFromLocalStorage } from '../services/database.js'
import MonthSelector from './MonthSelector.vue'
import CompareCategoryDetailModal from './CompareCategoryDetailModal.vue'

// Kept at module scope (not inside setup()) so the chosen months survive
// switching tabs and coming back — they only reset on a full app reload.
const initialDate = new Date()
const twoMonthsAgo = new Date(initialDate.getFullYear(), initialDate.getMonth() - 2, 1)
const oneMonthAgo = new Date(initialDate.getFullYear(), initialDate.getMonth() - 1, 1)

const monthA = ref({ year: twoMonthsAgo.getFullYear(), month: twoMonthsAgo.getMonth() })
const monthB = ref({ year: oneMonthAgo.getFullYear(), month: oneMonthAgo.getMonth() })

const availableMonths = computed(() => {
  const months = []
  const cursor = new Date(initialDate.getFullYear(), initialDate.getMonth(), 1)
  for (let i = 0; i < 12; i++) {
    months.push({
      year: cursor.getFullYear(),
      month: cursor.getMonth(),
      label: cursor.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    })
    cursor.setMonth(cursor.getMonth() - 1)
  }
  return months
})

export default {
  name: 'SpendingComparison',
  components: {
    MonthSelector,
    CompareCategoryDetailModal
  },
  setup() {
    const transactions = ref([])
    const customCategories = ref([])
    const selectedCompareRow = ref(null)

    const baseCategoriesData = [
      { id: 'rent', name: 'Rent', icon: '🏠', darkColor: '#DC2626', lightColor: '#991B1B' },
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

    const getCurrentTheme = () => {
      return document.documentElement.getAttribute('data-theme') || 'dark'
    }

    const categories = computed(() => {
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

    const monthLabel = (m) => {
      return new Date(m.year, m.month, 1).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    }

    const totalForMonth = (m) => {
      return transactions.value
        .filter(t => {
          const d = new Date(t.date)
          return d.getFullYear() === m.year && d.getMonth() === m.month
        })
        .reduce((sum, t) => sum + t.amount, 0)
    }

    const transactionsForCategoryMonth = (categoryId, m) => {
      return transactions.value.filter(t => {
        if (t.categoryId !== categoryId) return false
        const d = new Date(t.date)
        return d.getFullYear() === m.year && d.getMonth() === m.month
      })
    }

    const categoryTotalForMonth = (categoryId, m) => {
      return transactionsForCategoryMonth(categoryId, m)
        .reduce((sum, t) => sum + t.amount, 0)
    }

    const openCategoryDetail = (row) => {
      selectedCompareRow.value = row
    }

    const totalA = computed(() => totalForMonth(monthA.value))
    const totalB = computed(() => totalForMonth(monthB.value))

    const totalChange = computed(() => ({
      amountA: totalA.value,
      amountB: totalB.value,
      change: totalB.value - totalA.value
    }))

    const totalChangeAmount = computed(() => totalChange.value.change)

    const comparisonRows = computed(() => {
      return categories.value
        .map(category => {
          const amountA = categoryTotalForMonth(category.id, monthA.value)
          const amountB = categoryTotalForMonth(category.id, monthB.value)
          return {
            category,
            amountA,
            amountB,
            change: amountB - amountA
          }
        })
        .filter(row => row.amountA > 0 || row.amountB > 0)
        .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
    })

    const changeClass = (change) => {
      if (change > 0) return 'change-up'
      if (change < 0) return 'change-down'
      return 'change-flat'
    }

    const formatChangeText = (row) => {
      const change = row.change
      const sign = change > 0 ? '+' : (change < 0 ? '-' : '')
      const amountText = `${sign}$${Math.abs(change).toFixed(2)}`

      if (row.amountA === 0 && row.amountB > 0) {
        return `${amountText} (New)`
      }
      if (row.amountA > 0 && row.amountB === 0) {
        return `${amountText} (-100%)`
      }
      if (row.amountA === 0 && row.amountB === 0) {
        return 'No change'
      }

      const percent = (change / row.amountA) * 100
      const percentSign = percent > 0 ? '+' : ''
      return `${amountText} (${percentSign}${percent.toFixed(0)}%)`
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

    onMounted(async () => {
      await migrateFromLocalStorage()
      await loadTransactions()
      await loadCustomCategories()
    })

    return {
      monthA,
      monthB,
      availableMonths,
      monthLabel,
      totalA,
      totalB,
      totalChange,
      totalChangeAmount,
      comparisonRows,
      changeClass,
      formatChangeText,
      selectedCompareRow,
      openCategoryDetail,
      transactionsForCategoryMonth
    }
  }
}
</script>

<style scoped>
.spending-comparison {
  padding: 1rem;
  max-width: 800px;
  margin: 0 auto;
}

.month-picker-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.picker-arrow {
  color: var(--text-secondary);
  font-size: 1.1rem;
}

.summary-card {
  background: var(--primary-gradient);
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  text-align: center;
  color: white;
}

.summary-totals {
  display: flex;
  justify-content: center;
  gap: 2.5rem;
  margin-bottom: 1rem;
}

.summary-total-label {
  font-size: 0.85rem;
  opacity: 0.85;
}

.summary-total-amount {
  font-size: 1.6rem;
  font-weight: 700;
}

.summary-change {
  font-size: 1.1rem;
  font-weight: 700;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 0.5rem;
  padding: 0.5rem;
  display: inline-block;
  padding-left: 1rem;
  padding-right: 1rem;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--text-secondary);
}

.comparison-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.comparison-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: var(--surface-dark);
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.comparison-row:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow);
  border-color: var(--accent-purple);
}

.category-icon {
  flex-shrink: 0;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
}

.category-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.comparison-details {
  flex: 1;
  min-width: 0;
}

.comparison-name {
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.2rem;
}

.comparison-amounts {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.amounts-arrow {
  opacity: 0.6;
}

.comparison-change {
  flex-shrink: 0;
  font-weight: 700;
  font-size: 0.95rem;
  text-align: right;
  white-space: nowrap;
}

.change-up {
  color: var(--accent-red);
}

.change-down {
  color: var(--accent-green);
}

.change-flat {
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .summary-totals {
    gap: 1.5rem;
  }

  .comparison-row {
    padding: 0.75rem;
    gap: 0.75rem;
  }

  .comparison-amounts {
    font-size: 0.8rem;
  }

  .comparison-change {
    font-size: 0.85rem;
  }
}
</style>
