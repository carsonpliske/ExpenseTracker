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

    const selectCategory = (category) => {
      selectedCategory.value = category
      transaction.value.categoryId = category.id
      showCategoryDropdown.value = false
    }

    const saveTransaction = () => {
      if (transaction.value.amount && transaction.value.categoryId) {
        emit('save', { ...transaction.value })
        transaction.value = {
          amount: '',
          categoryId: '',
          description: '',
          date: getCurrentLocalDate()
        }
        selectedCategory.value = null
      }
    }

    return {
      transaction,
      showCategoryDropdown,
      selectedCategory,
      selectCategory,
      saveTransaction,
      sortedCategories
    }
  }
}
</script>

<style scoped>
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