<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="color-picker-modal" @click.stop>
      <h3>Choose Color for {{ categoryName }}</h3>
      
      <div class="color-palette">
        <div 
          v-for="color in colors" 
          :key="color.value"
          class="color-option"
          :class="{ active: selectedColor === color.value }"
          :style="{ backgroundColor: color.value }"
          @click="selectColor(color.value)"
          :title="color.name"
        >
          <div v-if="selectedColor === color.value" class="checkmark">✓</div>
        </div>
      </div>

      <div class="form-actions">
        <button class="btn btn-secondary" @click="closeModal">Cancel</button>
        <button class="btn btn-primary" @click="saveColor">Save Color</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'

export default {
  name: 'ColorPickerModal',
  props: {
    categoryName: {
      type: String,
      required: true
    },
    currentColor: {
      type: String,
      required: true
    }
  },
  emits: ['close', 'save'],
  setup(props, { emit }) {
    const selectedColor = ref(props.currentColor)
    
    const colors = [
      { name: 'Red', value: '#DC2626' },
      { name: 'Orange', value: '#F59E0B' },
      { name: 'Yellow', value: '#FACC15' },
      { name: 'Green', value: '#10B981' },
      { name: 'Teal', value: '#14B8A6' },
      { name: 'Blue', value: '#3B82F6' },
      { name: 'Indigo', value: '#6366F1' },
      { name: 'Purple', value: '#8B5CF6' },
      { name: 'Pink', value: '#EC4899' },
      { name: 'Rose', value: '#EF4444' },
      { name: 'Emerald', value: '#059669' },
      { name: 'Cyan', value: '#06B6D4' },
      { name: 'Violet', value: '#A855F7' },
      { name: 'Amber', value: '#F97316' },
      { name: 'Lime', value: '#84CC16' },
      { name: 'Sky', value: '#0EA5E9' },
      { name: 'Fuchsia', value: '#D946EF' },
      { name: 'Slate', value: '#64748B' },
      { name: 'Zinc', value: '#71717A' },
      { name: 'Stone', value: '#78716C' }
    ]

    const selectColor = (color) => {
      selectedColor.value = color
    }

    const closeModal = () => {
      emit('close')
    }

    const saveColor = () => {
      emit('save', selectedColor.value)
    }

    return {
      selectedColor,
      colors,
      selectColor,
      closeModal,
      saveColor
    }
  }
}
</script>

<style scoped>
.color-picker-modal {
  background: var(--surface-dark);
  border-radius: 1rem;
  padding: 2rem;
  width: 90%;
  max-width: 500px;
  box-shadow: var(--shadow-lg);
}

.color-picker-modal h3 {
  margin-bottom: 1.5rem;
  text-align: center;
  color: var(--text-primary);
}

.color-palette {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.75rem;
  margin-bottom: 2rem;
}

.color-option {
  width: 3rem;
  height: 3rem;
  border-radius: 0.75rem;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.color-option:hover {
  transform: scale(1.1);
  border-color: var(--accent-purple);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.color-option.active {
  border-color: var(--text-primary);
  transform: scale(1.1);
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.4);
}

.checkmark {
  color: white;
  font-weight: bold;
  font-size: 1.2rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}

@media (max-width: 480px) {
  .color-palette {
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
  }
  
  .color-option {
    width: 2.5rem;
    height: 2.5rem;
  }
  
  .color-picker-modal {
    padding: 1.5rem;
  }
}
</style>