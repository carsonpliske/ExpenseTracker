<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal category-detail-modal" @click.stop>
      <div class="modal-header">
        <div class="category-header">
          <div 
            class="category-icon-large" 
            :style="{ backgroundColor: category.color }"
          >
            {{ category.icon }}
          </div>
          <div>
            <h3>{{ category.name }} Expenses</h3>
            <p class="category-total">Total: ${{ categoryTotal.toFixed(2) }}</p>
          </div>
        </div>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>

      <div class="period-filter">
        <button 
          v-for="period in periods" 
          :key="period.value"
          class="period-btn-small" 
          :class="{ active: selectedPeriod === period.value }"
          @click="selectedPeriod = period.value"
        >
          {{ period.label }}
        </button>
      </div>

      <div class="transactions-list">
        <div v-if="filteredTransactions.length === 0" class="no-transactions">
          <div class="empty-state">
            <div style="font-size: 3rem; margin-bottom: 1rem;">📋</div>
            <h4>No {{ category.name.toLowerCase() }} expenses</h4>
            <p>You haven't recorded any {{ category.name.toLowerCase() }} expenses for this {{ selectedPeriod }}.</p>
          </div>
        </div>
        
        <div v-else>
          <div 
            v-for="transaction in filteredTransactions" 
            :key="transaction.id"
            class="transaction-item"
          >
            <div class="transaction-info">
              <div class="transaction-amount">${{ transaction.amount.toFixed(2) }}</div>
              <div class="transaction-details">
                <div class="transaction-description">
                  {{ transaction.description || `${category.name} expense` }}
                </div>
                <div class="transaction-date">
                  {{ formatDate(transaction.date) }}
                </div>
              </div>
            </div>
            <div class="transaction-actions">
              <button 
                class="edit-btn" 
                @click="editTransaction(transaction)"
                title="Edit transaction"
              >
                ✏️
              </button>
              <button 
                class="delete-btn" 
                @click="showDeleteConfirm(transaction)"
                title="Delete transaction"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <div class="summary">
          <div class="summary-item">
            <span>{{ filteredTransactions.length }} transaction{{ filteredTransactions.length !== 1 ? 's' : '' }}</span>
          </div>
          <div class="summary-item">
            <span>{{ selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1) }} Total: ${{ categoryTotal.toFixed(2) }}</span>
          </div>
        </div>
      </div>

      <!-- Edit Transaction Modal -->
      <EditTransactionModal
        v-if="showEditModal && transactionToEdit"
        :transaction="transactionToEdit"
        :categories="allCategories"
        @close="closeEditModal"
        @save="saveEditedTransaction"
      />

      <!-- Delete Confirmation Modal -->
      <DeleteConfirmModal
        v-if="showDeleteModal && transactionToDelete"
        :transaction="transactionToDelete"
        @confirm="confirmDelete"
        @cancel="cancelDelete"
      />
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import EditTransactionModal from './EditTransactionModal.vue'
import DeleteConfirmModal from './DeleteConfirmModal.vue'

export default {
  name: 'CategoryDetailModal',
  components: {
    EditTransactionModal,
    DeleteConfirmModal
  },
  props: {
    category: {
      type: Object,
      required: true
    },
    transactions: {
      type: Array,
      required: true
    },
    currentPeriod: {
      type: String,
      required: true
    },
    allCategories: {
      type: Array,
      required: true
    }
  },
  emits: ['close', 'delete-transaction', 'edit-transaction'],
  setup(props, { emit }) {
    const selectedPeriod = ref(props.currentPeriod)
    const showEditModal = ref(false)
    const showDeleteModal = ref(false)
    const transactionToEdit = ref(null)
    const transactionToDelete = ref(null)

    const periods = [
      { value: 'daily', label: 'Daily' },
      { value: 'weekly', label: 'Weekly' },
      { value: 'monthly', label: 'Monthly' }
    ]

    const getTransactionsForPeriod = (transactions, period) => {
      const now = new Date()
      return transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date)
        
        switch (period) {
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
            return transactionDate.getMonth() === now.getMonth() && 
                   transactionDate.getFullYear() === now.getFullYear()
          default:
            return true
        }
      })
    }

    const filteredTransactions = computed(() => {
      const categoryTransactions = props.transactions.filter(
        t => t.categoryId === props.category.id
      )
      return getTransactionsForPeriod(categoryTransactions, selectedPeriod.value)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
    })

    const categoryTotal = computed(() => {
      return filteredTransactions.value.reduce((sum, transaction) => sum + transaction.amount, 0)
    })

    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    }

    const editTransaction = (transaction) => {
      transactionToEdit.value = transaction
      showEditModal.value = true
    }

    const closeEditModal = () => {
      showEditModal.value = false
      transactionToEdit.value = null
    }

    const saveEditedTransaction = (editedTransaction) => {
      emit('edit-transaction', editedTransaction)
      closeEditModal()
    }

    const showDeleteConfirm = (transaction) => {
      transactionToDelete.value = transaction
      showDeleteModal.value = true
    }

    const confirmDelete = () => {
      if (transactionToDelete.value) {
        emit('delete-transaction', transactionToDelete.value.id)
        cancelDelete()
      }
    }

    const cancelDelete = () => {
      showDeleteModal.value = false
      transactionToDelete.value = null
    }

    return {
      selectedPeriod,
      periods,
      filteredTransactions,
      categoryTotal,
      formatDate,
      showEditModal,
      showDeleteModal,
      transactionToEdit,
      transactionToDelete,
      editTransaction,
      closeEditModal,
      saveEditedTransaction,
      showDeleteConfirm,
      confirmDelete,
      cancelDelete
    }
  }
}
</script>

<style scoped>
.category-detail-modal {
  max-width: 600px;
  max-height: 80vh;
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
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
}

.category-header h3 {
  margin: 0;
  font-size: 1.5rem;
}

.category-total {
  color: var(--text-secondary);
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
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

.period-filter {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.period-btn-small {
  padding: 0.5rem 1rem;
  background: var(--surface-light);
  border: none;
  border-radius: 0.5rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.period-btn-small.active {
  background: var(--accent-purple);
  color: white;
}

.transactions-list {
  flex: 1;
  overflow-y: auto;
  max-height: 400px;
  margin-bottom: 1rem;
}

.no-transactions {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.empty-state {
  text-align: center;
  color: var(--text-secondary);
}

.empty-state h4 {
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}

.transaction-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--surface-light);
  border-radius: 0.75rem;
  margin-bottom: 0.75rem;
  transition: all 0.3s ease;
}

.transaction-item:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow);
}

.transaction-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.transaction-amount {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--accent-purple);
  min-width: 80px;
}

.transaction-details {
  flex: 1;
}

.transaction-description {
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.transaction-date {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.transaction-actions {
  display: flex;
  gap: 0.5rem;
}

.edit-btn, .delete-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: all 0.3s ease;
  opacity: 0.6;
}

.edit-btn:hover {
  background: var(--accent-blue);
  opacity: 1;
  transform: scale(1.1);
}

.delete-btn:hover {
  background: var(--accent-red);
  opacity: 1;
  transform: scale(1.1);
}

.modal-footer {
  border-top: 1px solid var(--border-color);
  padding-top: 1rem;
}

.summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.summary-item {
  font-weight: 500;
}

@media (max-width: 768px) {
  .category-detail-modal {
    max-width: 95%;
    max-height: 90vh;
  }
  
  .transaction-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .transaction-amount {
    min-width: auto;
  }
  
  .summary {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }
}
</style>