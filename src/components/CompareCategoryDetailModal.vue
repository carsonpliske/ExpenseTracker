<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal compare-detail-modal" @click.stop>
      <div class="modal-header">
        <div class="category-header">
          <div
            class="category-icon-large"
            :style="{ backgroundColor: (category.iconType === 'image' && category.image) ? 'transparent' : category.color }"
          >
            <img
              v-if="category.iconType === 'image' && category.image"
              :src="category.image"
              alt="category icon"
              class="category-image-large"
            />
            <span v-else>{{ category.icon || '📋' }}</span>
          </div>
          <h3>{{ category.name }}</h3>
        </div>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>

      <div class="compare-columns">
        <div class="compare-column">
          <div class="column-header">
            <div class="column-label">{{ monthALabel }}</div>
            <div class="column-total">${{ totalA.toFixed(2) }}</div>
          </div>
          <div class="column-list">
            <div v-if="sortedTransactionsA.length === 0" class="no-transactions">
              No transactions
            </div>
            <div
              v-for="transaction in sortedTransactionsA"
              :key="transaction.id"
              class="compare-transaction-item"
            >
              <div class="compare-transaction-info">
                <div class="compare-transaction-description">
                  {{ transaction.description || `${category.name} expense` }}
                </div>
                <div class="compare-transaction-date">{{ formatDate(transaction.date) }}</div>
              </div>
              <div class="compare-transaction-amount">${{ transaction.amount.toFixed(2) }}</div>
            </div>
          </div>
        </div>

        <div class="compare-column">
          <div class="column-header">
            <div class="column-label">{{ monthBLabel }}</div>
            <div class="column-total">${{ totalB.toFixed(2) }}</div>
          </div>
          <div class="column-list">
            <div v-if="sortedTransactionsB.length === 0" class="no-transactions">
              No transactions
            </div>
            <div
              v-for="transaction in sortedTransactionsB"
              :key="transaction.id"
              class="compare-transaction-item"
            >
              <div class="compare-transaction-info">
                <div class="compare-transaction-description">
                  {{ transaction.description || `${category.name} expense` }}
                </div>
                <div class="compare-transaction-date">{{ formatDate(transaction.date) }}</div>
              </div>
              <div class="compare-transaction-amount">${{ transaction.amount.toFixed(2) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'CompareCategoryDetailModal',
  props: {
    category: {
      type: Object,
      required: true
    },
    monthALabel: {
      type: String,
      required: true
    },
    monthBLabel: {
      type: String,
      required: true
    },
    transactionsA: {
      type: Array,
      required: true
    },
    transactionsB: {
      type: Array,
      required: true
    }
  },
  emits: ['close'],
  setup(props) {
    const sortByDateDesc = (list) => {
      return [...list].sort((a, b) => new Date(b.date) - new Date(a.date))
    }

    const sortedTransactionsA = computed(() => sortByDateDesc(props.transactionsA))
    const sortedTransactionsB = computed(() => sortByDateDesc(props.transactionsB))

    const totalA = computed(() => props.transactionsA.reduce((sum, t) => sum + t.amount, 0))
    const totalB = computed(() => props.transactionsB.reduce((sum, t) => sum + t.amount, 0))

    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    }

    return {
      sortedTransactionsA,
      sortedTransactionsB,
      totalA,
      totalB,
      formatDate
    }
  }
}
</script>

<style scoped>
.compare-detail-modal {
  max-width: 700px;
  max-height: 85vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.category-header {
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

.category-image-large {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.category-header h3 {
  margin: 0;
  font-size: 1.3rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: var(--surface-light);
  color: var(--text-primary);
}

.compare-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  overflow-y: auto;
  flex: 1;
}

.compare-column {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.column-header {
  text-align: center;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color);
}

.column-label {
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-weight: 600;
}

.column-total {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
}

.column-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.no-transactions {
  text-align: center;
  color: var(--text-secondary);
  font-size: 0.85rem;
  padding: 1.5rem 0.5rem;
}

.compare-transaction-item {
  background: var(--surface-light);
  border-radius: 0.6rem;
  padding: 0.6rem;
}

.compare-transaction-info {
  min-width: 0;
}

.compare-transaction-description {
  font-size: 0.85rem;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.compare-transaction-date {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.compare-transaction-amount {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-top: 0.2rem;
}

@media (max-width: 600px) {
  .compare-columns {
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }

  .category-header h3 {
    font-size: 1.1rem;
  }

  .compare-transaction-description {
    font-size: 0.78rem;
  }
}
</style>
