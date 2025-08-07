<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal" @click.stop>
      <h3>Edit Transaction</h3>
      
      <form @submit.prevent="saveTransaction">
        <div class="form-group">
          <label for="edit-amount">Amount ($)</label>
          <input 
            id="edit-amount"
            v-model.number="editTransaction.amount" 
            type="number" 
            step="0.01" 
            required 
            placeholder="0.00"
          >
        </div>

        <div class="form-group">
          <label for="edit-category">Category</label>
          <select id="edit-category" v-model="editTransaction.categoryId" required>
            <option value="">Select a category</option>
            <option 
              v-for="category in categories" 
              :key="category.id" 
              :value="category.id"
            >
              {{ category.icon }} {{ category.name }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="edit-description">Description (optional)</label>
          <input 
            id="edit-description"
            v-model="editTransaction.description" 
            type="text" 
            placeholder="What did you spend on?"
          >
        </div>

        <div class="form-group">
          <label for="edit-date">Date</label>
          <input 
            id="edit-date"
            v-model="editTransaction.date" 
            type="date" 
            required
          >
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-danger" @click="confirmDelete">
            🗑️ Delete
          </button>
          <div class="action-buttons-right">
            <button type="button" class="btn btn-secondary" @click="$emit('close')">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary">
              Save Changes
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'

export default {
  name: 'EditTransactionModal',
  props: {
    transaction: {
      type: Object,
      required: true
    },
    categories: {
      type: Array,
      required: true
    }
  },
  emits: ['close', 'save', 'delete'],
  setup(props, { emit }) {
    
    const editTransaction = ref({
      amount: '',
      categoryId: '',
      description: '',
      date: ''
    })

    const saveTransaction = () => {
      if (editTransaction.value.amount && editTransaction.value.categoryId) {
        emit('save', {
          ...props.transaction,
          ...editTransaction.value
        })
      }
    }

    const confirmDelete = () => {
      const confirmed = window.confirm(
        'Are you sure you want to delete this transaction? This action cannot be undone.'
      )
      if (confirmed) {
        emit('delete', props.transaction.id)
      }
    }

    onMounted(() => {
      // Pre-populate form with existing transaction data
      editTransaction.value = {
        amount: props.transaction.amount,
        categoryId: props.transaction.categoryId,
        description: props.transaction.description || '',
        date: new Date(props.transaction.date).toISOString().split('T')[0]
      }
    })

    return {
      editTransaction,
      saveTransaction,
      confirmDelete
    }
  }
}
</script>

<style scoped>
.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-top: 1.5rem;
}

.action-buttons-right {
  display: flex;
  gap: 0.75rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.btn-danger {
  background: var(--accent-red);
  color: white;
}

.btn-danger:hover {
  background: #B91C1C;
  transform: translateY(-1px);
}

.btn-secondary {
  background: var(--surface-dark);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover {
  background: var(--background-dark);
  color: var(--text-primary);
}

.btn-primary {
  background: var(--accent-purple);
  color: white;
}

.btn-primary:hover {
  background: var(--accent-purple-dark);
  transform: translateY(-1px);
}

/* Fix dropdown display issues */
#edit-category {
  position: relative;
  z-index: 9999;
  max-height: none;
  overflow: visible;
}

/* Ensure dropdown options are visible */
#edit-category option {
  padding: 0.5rem;
  background: var(--surface-dark);
  color: var(--text-primary);
}

/* Increase modal z-index to ensure dropdown appears above everything */
.modal {
  z-index: 10000;
  overflow: visible;
  max-height: 90vh;
}

.modal-overlay {
  overflow: visible;
}

@media (max-width: 480px) {
  .form-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .action-buttons-right {
    order: -1;
  }
  
  .btn {
    width: 100%;
  }
}
</style>