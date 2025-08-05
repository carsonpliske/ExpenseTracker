<template>
  <div class="spending-insights">
    <h3 class="insights-title">Spending Insights</h3>
    
    <!-- Top Spending Category -->
    <div class="insight-card" v-if="topCategory">
      <div class="card-header">
        <div class="card-icon">👑</div>
        <h4>Top Category</h4>
      </div>
      <div class="card-content">
        <div class="category-highlight">
          <div 
            class="category-icon-large" 
            :style="{ backgroundColor: topCategory.color }"
          >
            {{ topCategory.icon }}
          </div>
          <div class="category-info">
            <div class="category-name">{{ topCategory.name }}</div>
            <div class="category-amount">${{ topCategory.amount.toFixed(2) }}</div>
            <div class="category-percentage">{{ topCategory.percentage }}% of spending</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Daily Average -->
    <div class="insight-card">
      <div class="card-header">
        <div class="card-icon">📊</div>
        <h4>Daily Average</h4>
      </div>
      <div class="card-content">
        <div class="stat-value">${{ dailyAverage.toFixed(2) }}</div>
        <div class="stat-description">{{ getDailyAverageDescription() }}</div>
      </div>
    </div>

    <!-- Recent Transactions -->
    <div class="insight-card">
      <div class="card-header">
        <div class="card-icon">🕒</div>
        <h4>Recent Transactions</h4>
      </div>
      <div class="card-content">
        <div v-if="recentTransactions.length === 0" class="no-transactions">
          <div class="empty-icon">💳</div>
          <p>No recent transactions</p>
        </div>
        <div v-else class="transactions-list">
          <div 
            v-for="transaction in recentTransactions" 
            :key="transaction.id"
            class="transaction-item"
            @click="selectTransaction(transaction)"
          >
            <div class="transaction-icon">
              {{ getCategoryIcon(transaction.categoryId) }}
            </div>
            <div class="transaction-details">
              <div class="transaction-description">
                {{ transaction.description || getCategoryName(transaction.categoryId) }}
              </div>
              <div class="transaction-date">
                {{ formatRelativeDate(transaction.date) }}
              </div>
            </div>
            <div class="transaction-amount">
              ${{ transaction.amount.toFixed(2) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Category Rankings -->
    <div class="insight-card" v-if="categoryRankings.length > 0">
      <div class="card-header">
        <div class="card-icon">🏆</div>
        <h4>Top Categories</h4>
      </div>
      <div class="card-content">
        <div class="rankings-list">
          <div 
            v-for="(category, index) in categoryRankings" 
            :key="category.id"
            class="ranking-item"
          >
            <div class="rank-number">{{ index + 1 }}</div>
            <div class="rank-category">
              <span class="rank-icon">{{ category.icon }}</span>
              <span class="rank-name">{{ category.name }}</span>
            </div>
            <div class="rank-amount">${{ category.amount.toFixed(2) }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'SpendingInsights',
  emits: ['transaction-select'],
  props: {
    transactions: {
      type: Array,
      required: true
    },
    categories: {
      type: Array,
      required: true
    },
    selectedPeriod: {
      type: String,
      required: true
    },
    totalAmount: {
      type: Number,
      required: true
    }
  },
  setup(props, { emit }) {
    const recentTransactions = computed(() => {
      return [...props.transactions]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5)
    })

    const dailyAverage = computed(() => {
      // Filter out rent transactions for daily average calculation
      const nonRentTransactions = props.transactions.filter(t => t.categoryId !== 'rent')
      if (nonRentTransactions.length === 0) return 0
      
      // Calculate total without rent
      const totalWithoutRent = nonRentTransactions.reduce((sum, transaction) => sum + transaction.amount, 0)
      
      const now = new Date()
      let dayCount = 1
      
      switch (props.selectedPeriod) {
        case 'daily':
          dayCount = 1
          break
        case 'weekly':
          dayCount = 7
          break
        case 'monthly':
          dayCount = now.getDate() // Days elapsed in current month
          break
      }
      
      return totalWithoutRent / dayCount
    })

    const categoryTotals = computed(() => {
      const totals = {}
      props.transactions.forEach(transaction => {
        if (!totals[transaction.categoryId]) {
          totals[transaction.categoryId] = 0
        }
        totals[transaction.categoryId] += transaction.amount
      })
      
      return Object.entries(totals).map(([categoryId, amount]) => {
        const category = props.categories.find(cat => cat.id === categoryId)
        return {
          id: categoryId,
          name: category?.name || 'Unknown',
          icon: category?.icon || '📋',
          color: category?.color || '#64748B',
          amount,
          percentage: props.totalAmount > 0 ? Math.round((amount / props.totalAmount) * 100) : 0
        }
      }).sort((a, b) => b.amount - a.amount)
    })

    const topCategory = computed(() => {
      const filteredCategories = categoryTotals.value.filter(cat => cat.id !== 'rent')
      return filteredCategories.length > 0 ? filteredCategories[0] : null
    })

    const categoryRankings = computed(() => {
      const filteredCategories = categoryTotals.value.filter(cat => cat.id !== 'rent')
      return filteredCategories.slice(0, 3)
    })

    const getCategoryIcon = (categoryId) => {
      const category = props.categories.find(cat => cat.id === categoryId)
      return category?.icon || '📋'
    }

    const getCategoryName = (categoryId) => {
      const category = props.categories.find(cat => cat.id === categoryId)
      return category?.name || 'Unknown'
    }

    const formatRelativeDate = (dateString) => {
      const date = new Date(dateString)
      const now = new Date()
      const diffTime = Math.abs(now - date)
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays === 0) return 'Today'
      if (diffDays === 1) return 'Yesterday'
      if (diffDays < 7) return `${diffDays} days ago`
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    const getDailyAverageDescription = () => {
      switch (props.selectedPeriod) {
        case 'daily':
          return 'Today\'s spending'
        case 'weekly':
          return 'Per day this week'
        case 'monthly':
          return 'Per day this month'
        default:
          return 'Daily average'
      }
    }

    const selectTransaction = (transaction) => {
      emit('transaction-select', transaction)
    }

    return {
      recentTransactions,
      dailyAverage,
      topCategory,
      categoryRankings,
      getCategoryIcon,
      getCategoryName,
      formatRelativeDate,
      getDailyAverageDescription,
      selectTransaction
    }
  }
}
</script>

<style scoped>
.spending-insights {
  padding: 1rem;
  height: 100%;
  overflow-y: auto;
}

.insights-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  color: var(--text-primary);
  text-align: center;
}

.insight-card {
  background: var(--surface-light);
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
}

.insight-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
}

.card-icon {
  font-size: 1.5rem;
  margin-right: 0.75rem;
}

.card-header h4 {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.card-content {
  color: var(--text-secondary);
}

/* Top Category Styles */
.category-highlight {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.category-icon-large {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.category-info {
  flex: 1;
}

.category-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.category-amount {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--accent-purple);
  margin-bottom: 0.25rem;
}

.category-percentage {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

/* Daily Average Styles */
.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--accent-purple);
  margin-bottom: 0.5rem;
}

.stat-description {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

/* Recent Transactions Styles */
.no-transactions {
  text-align: center;
  padding: 2rem 1rem;
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  opacity: 0.6;
}

.transactions-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.transaction-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--surface-dark);
  border-radius: 0.5rem;
  transition: all 0.3s ease;
  cursor: pointer;
}

.transaction-item:hover {
  background: var(--background-dark);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--accent-purple);
}

.transaction-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.transaction-details {
  flex: 1;
  min-width: 0;
}

.transaction-description {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.transaction-date {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.transaction-amount {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
  flex-shrink: 0;
}

/* Category Rankings Styles */
.rankings-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--surface-dark);
  border-radius: 0.5rem;
}

.rank-number {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  background: var(--accent-purple);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
  flex-shrink: 0;
}

.rank-category {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.rank-icon {
  font-size: 1.1rem;
}

.rank-name {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-primary);
}

.rank-amount {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
  flex-shrink: 0;
}

/* Responsive adjustments */
@media (max-width: 1200px) {
  .insight-card {
    padding: 1rem;
    margin-bottom: 1rem;
  }
  
  .insights-title {
    font-size: 1.3rem;
    margin-bottom: 1rem;
  }
  
  .stat-value {
    font-size: 1.5rem;
  }
}
</style>