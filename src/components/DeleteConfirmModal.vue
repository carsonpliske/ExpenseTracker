<template>
  <div class="modal-overlay" @click="$emit('cancel')">
    <div class="modal delete-confirm-modal" @click.stop>
      <div class="delete-icon">🗑️</div>
      <h3>Delete Transaction</h3>
      <p class="delete-message">Do you realllllly wanna delete it???</p>
      <div class="transaction-preview">
        <div class="preview-amount">${{ transaction.amount.toFixed(2) }}</div>
        <div class="preview-description">{{ transaction.description || 'Expense' }}</div>
        <div class="preview-date">{{ formatDate(transaction.date) }}</div>
      </div>
      
      <div class="form-actions">
        <button class="btn btn-secondary" @click="$emit('cancel')">
          Nah, keep it
        </button>
        <button class="btn btn-danger" @click="$emit('confirm')">
          Yes, delete it!
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DeleteConfirmModal',
  props: {
    transaction: {
      type: Object,
      required: true
    }
  },
  emits: ['confirm', 'cancel'],
  setup() {
    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    }

    return {
      formatDate
    }
  }
}
</script>

<style scoped>
.delete-confirm-modal {
  text-align: center;
  max-width: 400px;
}

.delete-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.delete-message {
  font-size: 1.2rem;
  color: var(--accent-red);
  font-weight: 600;
  margin: 1rem 0 2rem;
}

.transaction-preview {
  background: var(--surface-light);
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 2px solid var(--accent-red);
}

.preview-amount {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--accent-red);
  margin-bottom: 0.5rem;
}

.preview-description {
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.preview-date {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.btn-danger {
  background: var(--accent-red);
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
  transform: translateY(-1px);
  box-shadow: var(--shadow);
}
</style>