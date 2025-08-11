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
            inputmode="decimal"
            required 
            placeholder="0.00"
          >
        </div>

        <div class="form-group">
          <label for="edit-category">Category</label>
          <div class="custom-select-wrapper">
            <div 
              class="custom-select" 
              :class="{ open: showCategoryDropdown }"
              @click="showCategoryDropdown = !showCategoryDropdown"
            >
              <div class="selected-category">
                <div v-if="selectedCategory" class="category-display">
                  <div class="category-icon-small" :style="{ backgroundColor: (selectedCategory.iconType === 'image' && selectedCategory.image) ? 'transparent' : selectedCategory.color }">
                    <img v-if="selectedCategory.iconType === 'image' && selectedCategory.image" 
                         :src="selectedCategory.image" 
                         alt="category icon" 
                         class="category-image-small" />
                    <span v-else>{{ selectedCategory.icon }}</span>
                  </div>
                  <span>{{ selectedCategory.name }}</span>
                </div>
                <span v-else class="placeholder">Select a category</span>
                <span class="dropdown-arrow">▼</span>
              </div>
            </div>
            
            <div v-if="showCategoryDropdown" class="dropdown-menu">
              <div 
                v-for="category in sortedCategories" 
                :key="category.id"
                class="dropdown-item"
                @click="selectCategory(category)"
              >
                <div class="category-icon-small" :style="{ backgroundColor: (category.iconType === 'image' && category.image) ? 'transparent' : category.color }">
                  <img v-if="category.iconType === 'image' && category.image" 
                       :src="category.image" 
                       alt="category icon" 
                       class="category-image-small" />
                  <span v-else>{{ category.icon }}</span>
                </div>
                <span>{{ category.name }}</span>
              </div>
            </div>
          </div>
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
import { ref, computed, onMounted } from 'vue'

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
    },
    transactions: {
      type: Array,
      default: () => []
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
    
    const showCategoryDropdown = ref(false)
    const selectedCategory = ref(null)

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
      if (editTransaction.value.amount && editTransaction.value.categoryId) {
        emit('save', {
          ...props.transaction,
          ...editTransaction.value
        })
      }
    }

    const selectCategory = (category) => {
      selectedCategory.value = category
      editTransaction.value.categoryId = category.id
      showCategoryDropdown.value = false
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
      
      // Set the selected category for display
      selectedCategory.value = props.categories.find(cat => cat.id === props.transaction.categoryId)
    })

    return {
      editTransaction,
      showCategoryDropdown,
      selectedCategory,
      sortedCategories,
      selectCategory,
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

/* Custom select styles */
.custom-select-wrapper {
  position: relative;
}

.custom-select {
  border: 2px solid var(--border-color);
  border-radius: 0.5rem;
  padding: 0.75rem;
  background: var(--surface-dark);
  cursor: pointer;
  transition: border-color 0.2s;
}

.custom-select:hover {
  border-color: var(--accent-purple);
}

.custom-select.open {
  border-color: var(--accent-purple);
}

.selected-category {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.category-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.category-icon-small {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  color: white;
  flex-shrink: 0;
}

.category-image-small {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.placeholder {
  color: var(--text-secondary);
}

.dropdown-arrow {
  color: var(--text-secondary);
  transition: transform 0.2s;
}

.custom-select.open .dropdown-arrow {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--surface-dark);
  border: 2px solid var(--border-color);
  border-top: none;
  border-radius: 0 0 0.5rem 0.5rem;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
}

.dropdown-item {
  padding: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.dropdown-item:hover {
  background: var(--surface-light);
}

.dropdown-item:last-child {
  border-radius: 0 0 0.5rem 0.5rem;
}
</style>