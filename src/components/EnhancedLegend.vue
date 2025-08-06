<template>
  <div class="enhanced-legend">
    <div 
      v-for="item in filteredLegendData" 
      :key="item.categoryId"
      class="legend-item"
      :class="{ highlighted: highlightedCategory === item.categoryId }"
      @click="$emit('category-click', item.categoryId)"
    >
      <div class="legend-indicator">
        <div 
          class="legend-color" 
          :style="{ backgroundColor: item.color }"
        ></div>
        <div class="legend-icon">{{ item.icon }}</div>
      </div>
      
      <div class="legend-content">
        <div class="legend-label">{{ item.label }}</div>
        <div class="legend-values">
          <span class="legend-amount">${{ item.amount.toFixed(2) }}</span>
          <span class="legend-percentage">({{ item.percentage }}%)</span>
        </div>
      </div>
    </div>
    
    <div v-if="filteredLegendData.length === 0" class="no-spending">
      <div class="no-spending-icon">💸</div>
      <div class="no-spending-text">No expenses recorded for this period</div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'EnhancedLegend',
  props: {
    legendData: {
      type: Array,
      required: true
    },
    categories: {
      type: Array,
      required: true
    },
    highlightedCategory: {
      type: String,
      default: null
    }
  },
  emits: ['category-click'],
  setup(props) {
    const filteredLegendData = computed(() => {
      if (!props.legendData || props.legendData.length === 0) return []
      
      const total = props.legendData.reduce((sum, item) => sum + item.amount, 0)
      
      return props.legendData
        .filter(item => item.amount > 0)
        .map(item => {
          const category = props.categories.find(cat => cat.id === item.categoryId)
          return {
            ...item,
            icon: category?.icon || '📋',
            color: category?.color || '#64748B',
            percentage: total > 0 ? Math.round((item.amount / total) * 100) : 0
          }
        })
        .sort((a, b) => b.amount - a.amount)
    })

    return {
      filteredLegendData
    }
  }
}
</script>

<style scoped>
.enhanced-legend {
  padding: 1rem 0;
}

.legend-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  margin-bottom: 0.5rem;
  border-radius: 0.75rem;
  background: var(--surface-light);
  transition: all 0.3s ease;
  cursor: pointer;
  min-height: 44px; /* Touch-friendly */
}

.legend-item:hover {
  background: rgba(139, 92, 246, 0.1);
  transform: translateX(4px);
}

.legend-item.highlighted {
  background: rgba(139, 92, 246, 0.2);
  border: 2px solid var(--accent-purple);
}

.legend-item:last-child {
  margin-bottom: 0;
}

.legend-indicator {
  display: flex;
  align-items: center;
  margin-right: 1rem;
  position: relative;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  margin-right: 0.5rem;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.legend-icon {
  font-size: 1.25rem;
  line-height: 1;
}

.legend-content {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.legend-label {
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-primary);
}

.legend-values {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.legend-amount {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
}

.legend-percentage {
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.no-spending {
  text-align: center;
  padding: 0.5rem 2rem;
  color: var(--text-secondary);
  margin: -24rem 0 -20rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.no-spending-icon {
  font-size: 5rem;
  margin-bottom: 2rem;
  opacity: 0.6;
}

.no-spending-text {
  font-size: 1.25rem;
  font-weight: 500;
  line-height: 1.6;
}

/* Mobile optimizations */
@media (max-width: 767px) {
  .legend-item {
    padding: 1rem;
    margin-bottom: 0.75rem;
  }
  
  .legend-label {
    font-size: 1rem;
  }
  
  .legend-amount {
    font-size: 1.1rem;
  }
  
  .legend-percentage {
    font-size: 1rem;
  }
}

/* Desktop optimizations */
@media (min-width: 768px) {
  .enhanced-legend {
    padding: 1.5rem 0;
  }
  
  .legend-item {
    padding: 1rem 1.5rem;
  }
  
  .legend-label {
    font-size: 1.1rem;
  }
  
  .legend-amount {
    font-size: 1.2rem;
  }
}
</style>