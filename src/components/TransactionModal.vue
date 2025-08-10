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
            inputmode="decimal"
            required 
            placeholder="0.00"
          >
        </div>

        <div class="form-group">
          <label for="category">Category</label>
          <select id="category" v-model="transaction.categoryId" required>
            <option value="">Select a category</option>
            <option 
              v-for="category in sortedCategories" 
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
import { ref, computed } from 'vue'

export default {
  name: 'TransactionModal',
  props: {
    categories: {
      type: Array,
      required: true
    },
    transactions: {
      type: Array,
      default: () => []
    }
  },
  emits: ['close', 'save'],
  setup(props, { emit }) {
    // Helper function to get current date in local timezone
    const getCurrentLocalDate = () => {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    const transaction = ref({
      amount: '',
      categoryId: '',
      description: '',
      date: getCurrentLocalDate()
    })

    // Calculate category usage frequency and sort categories
    const sortedCategories = computed(() => {
      // Count usage frequency for each category
      const categoryUsage = {}
      
      // Initialize all categories with count 0
      props.categories.forEach(cat => {
        categoryUsage[cat.id] = 0
      })
      
      // Count actual usage from transactions
      props.transactions.forEach(transaction => {
        if (categoryUsage.hasOwnProperty(transaction.categoryId)) {
          categoryUsage[transaction.categoryId]++
        }
      })
      
      // Sort categories by usage frequency (most used first), then alphabetically
      return [...props.categories].sort((a, b) => {
        const usageA = categoryUsage[a.id] || 0
        const usageB = categoryUsage[b.id] || 0
        
        // First sort by usage frequency (descending)
        if (usageB !== usageA) {
          return usageB - usageA
        }
        
        // If same usage, sort alphabetically
        return a.name.localeCompare(b.name)
      })
    })

    const saveTransaction = () => {
      if (transaction.value.amount && transaction.value.categoryId) {
        emit('save', { ...transaction.value })
        transaction.value = {
          amount: '',
          categoryId: '',
          description: '',
          date: getCurrentLocalDate()
        }
      }
    }

    return {
      transaction,
      saveTransaction,
      sortedCategories
    }
  }
}
</script>