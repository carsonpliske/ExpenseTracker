<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal" @click.stop>
      <h3>Add Transaction</h3>
      
      <form @submit.prevent="saveTransaction">
        <div class="form-group">
          <label for="amount">Amount ($)</label>
          <input 
            id="amount"
            v-model.number="transaction.amount" 
            type="number" 
            step="0.01" 
            required 
            placeholder="0.00"
          >
        </div>

        <div class="form-group">
          <label for="category">Category</label>
          <select id="category" v-model="transaction.categoryId" required>
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
          <label for="description">Description (optional)</label>
          <input 
            id="description"
            v-model="transaction.description" 
            type="text" 
            placeholder="What did you spend on?"
          >
        </div>

        <div class="form-group">
          <label for="date">Date</label>
          <input 
            id="date"
            v-model="transaction.date" 
            type="date" 
            required
          >
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" @click="$emit('close')">
            Cancel
          </button>
          <button type="submit" class="btn btn-primary">
            Save Transaction
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'

export default {
  name: 'TransactionModal',
  props: {
    categories: {
      type: Array,
      required: true
    }
  },
  emits: ['close', 'save'],
  setup(props, { emit }) {
    const transaction = ref({
      amount: '',
      categoryId: '',
      description: '',
      date: new Date().toISOString().split('T')[0]
    })

    const saveTransaction = () => {
      if (transaction.value.amount && transaction.value.categoryId) {
        emit('save', { ...transaction.value })
        transaction.value = {
          amount: '',
          categoryId: '',
          description: '',
          date: new Date().toISOString().split('T')[0]
        }
      }
    }

    return {
      transaction,
      saveTransaction
    }
  }
}
</script>