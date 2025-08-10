<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="add-category-modal" @click.stop>
      <h3>Create New Category</h3>
      
      <!-- Category Name Input -->
      <div class="form-group">
        <label for="categoryName">Category Name</label>
        <input 
          id="categoryName"
          v-model="categoryData.name" 
          type="text" 
          class="form-input" 
          placeholder="Enter category name"
          maxlength="20"
          @input="generateId"
        />
      </div>

      <!-- Icon Type Selection -->
      <div class="form-group">
        <label>Icon Type</label>
        <div class="icon-type-tabs">
          <button 
            :class="{ active: iconType === 'emoji' }"
            @click="iconType = 'emoji'"
            type="button"
            class="tab-button"
          >
            😊 Emoji
          </button>
          <button 
            :class="{ active: iconType === 'image' }"
            @click="iconType = 'image'"
            type="button"
            class="tab-button"
          >
            🖼️ Image
          </button>
        </div>
      </div>

      <!-- Emoji Selection -->
      <div v-if="iconType === 'emoji'" class="form-group">
        <label>Choose Emoji</label>
        <div class="emoji-palette">
          <div 
            v-for="emoji in commonEmojis" 
            :key="emoji"
            class="emoji-option"
            :class="{ active: categoryData.icon === emoji }"
            @click="selectEmoji(emoji)"
          >
            {{ emoji }}
          </div>
        </div>
      </div>

      <!-- Image Upload -->
      <div v-if="iconType === 'image'" class="form-group">
        <label>Upload Image</label>
        <div class="image-upload-area">
          <input 
            ref="imageInput"
            type="file" 
            accept="image/png,image/jpeg,image/jpg"
            @change="handleImageUpload"
            class="image-input"
            id="imageUpload"
          />
          <label for="imageUpload" class="upload-label">
            <div v-if="imagePreview" class="image-preview">
              <img :src="imagePreview" alt="Preview" />
            </div>
            <div v-else class="upload-placeholder">
              📷 Click to upload PNG/JPEG
            </div>
          </label>
        </div>
      </div>

      <!-- Color Selection -->
      <div class="form-group">
        <label>Category Color</label>
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
      </div>

      <div class="form-actions">
        <button class="btn btn-secondary" @click="closeModal">Cancel</button>
        <button 
          class="btn btn-primary" 
          @click="saveCategory"
          :disabled="!isValid"
        >
          Create Category
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { customCategoryService } from '../services/database.js'

export default {
  name: 'AddCategoryModal',
  emits: ['close', 'save'],
  setup(props, { emit }) {
    const iconType = ref('emoji')
    const categoryData = ref({
      name: '',
      icon: '📁',
      image: null,
      iconType: 'emoji',
      darkColor: '#8B5CF6',
      lightColor: '#7C3AED',
      id: ''
    })
    
    const selectedColor = ref('#8B5CF6')
    const imagePreview = ref(null)
    const imageInput = ref(null)

    // Common emojis for categories
    const commonEmojis = [
      '📁', '🏠', '🛒', '🚗', '🍽️', '💚', '🎁', '🛍️', 
      '🎬', '📚', '✈️', '⚡', '💧', '🎯', '🍺', '🕹️', 
      '🎲', '💻', '📱', '🎵', '🏋️', '🐕', '🌱', '🔧',
      '📝', '💼', '🎨', '📷', '🍕', '☕', '🚲', '🏥'
    ]

    // Color palette
    const colors = [
      { name: 'Purple', value: '#8B5CF6' },
      { name: 'Blue', value: '#3B82F6' },
      { name: 'Green', value: '#10B981' },
      { name: 'Red', value: '#DC2626' },
      { name: 'Orange', value: '#F59E0B' },
      { name: 'Pink', value: '#EC4899' },
      { name: 'Indigo', value: '#6366F1' },
      { name: 'Teal', value: '#14B8A6' },
      { name: 'Cyan', value: '#06B6D4' },
      { name: 'Amber', value: '#FACC15' },
      { name: 'Lime', value: '#84CC16' },
      { name: 'Slate', value: '#64748B' }
    ]

    const isValid = computed(() => {
      return categoryData.value.name.trim().length > 0 &&
             ((iconType.value === 'emoji' && categoryData.value.icon) ||
              (iconType.value === 'image' && categoryData.value.image))
    })

    const generateId = () => {
      const name = categoryData.value.name.trim()
      if (name) {
        categoryData.value.id = name.toLowerCase().replace(/[^a-z0-9]/g, '_')
      }
    }

    const selectEmoji = (emoji) => {
      categoryData.value.icon = emoji
      categoryData.value.iconType = 'emoji'
    }

    const selectColor = (color) => {
      selectedColor.value = color
      categoryData.value.darkColor = color
      
      // Generate a slightly darker version for light color
      const lightColor = adjustColorBrightness(color, -0.1)
      categoryData.value.lightColor = lightColor
    }

    const adjustColorBrightness = (hex, percent) => {
      const num = parseInt(hex.slice(1), 16)
      const amt = Math.round(2.55 * percent * 100)
      const R = (num >> 16) + amt
      const G = (num >> 8 & 0x00FF) + amt
      const B = (num & 0x0000FF) + amt
      return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255))
        .toString(16).slice(1)
    }

    const handleImageUpload = (event) => {
      const file = event.target.files[0]
      if (file) {
        if (file.size > 1024 * 1024) { // 1MB limit
          alert('Image must be smaller than 1MB')
          return
        }
        
        const reader = new FileReader()
        reader.onload = (e) => {
          const base64 = e.target.result
          categoryData.value.image = base64
          categoryData.value.iconType = 'image'
          imagePreview.value = base64
        }
        reader.readAsDataURL(file)
      }
    }

    const closeModal = () => {
      emit('close')
    }

    const saveCategory = async () => {
      try {
        await customCategoryService.add(categoryData.value)
        emit('save', categoryData.value)
      } catch (error) {
        console.error('Error saving category:', error)
        alert('Error saving category. Please try again.')
      }
    }

    return {
      iconType,
      categoryData,
      selectedColor,
      imagePreview,
      imageInput,
      commonEmojis,
      colors,
      isValid,
      selectEmoji,
      selectColor,
      handleImageUpload,
      closeModal,
      saveCategory,
      generateId
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.add-category-modal {
  background: white;
  border-radius: 16px;
  padding: 24px;
  width: 90%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.add-category-modal h3 {
  margin: 0 0 20px 0;
  color: #1f2937;
  font-size: 1.25rem;
  font-weight: 600;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

.form-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #8b5cf6;
}

.icon-type-tabs {
  display: flex;
  gap: 8px;
}

.tab-button {
  flex: 1;
  padding: 12px;
  border: 2px solid #e5e7eb;
  background: white;
  border-radius: 8px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-button.active {
  border-color: #8b5cf6;
  background: #f3f4f6;
  color: #8b5cf6;
}

.emoji-palette {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
  padding: 8px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
}

.emoji-option {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.2rem;
  transition: background-color 0.2s;
}

.emoji-option:hover {
  background: #f3f4f6;
}

.emoji-option.active {
  background: #8b5cf6;
  color: white;
}

.image-upload-area {
  position: relative;
}

.image-input {
  display: none;
}

.upload-label {
  display: block;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s;
}

.upload-label:hover {
  border-color: #8b5cf6;
}

.image-preview {
  width: 100%;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-preview img {
  max-width: 100%;
  max-height: 100%;
  border-radius: 4px;
}

.upload-placeholder {
  color: #6b7280;
  font-size: 0.875rem;
}

.color-palette {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
}

.color-option {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid transparent;
  transition: all 0.2s;
}

.color-option:hover {
  transform: scale(1.1);
}

.color-option.active {
  border-color: white;
  box-shadow: 0 0 0 2px #374151;
}

.checkmark {
  color: white;
  font-weight: bold;
  font-size: 1.2rem;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.btn {
  flex: 1;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-primary {
  background: #8b5cf6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #7c3aed;
}

.btn-primary:disabled {
  background: #d1d5db;
  cursor: not-allowed;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .add-category-modal {
    background: #1f2937;
    color: white;
  }
  
  .add-category-modal h3 {
    color: white;
  }
  
  .form-group label {
    color: #d1d5db;
  }
  
  .form-input {
    background: #374151;
    border-color: #4b5563;
    color: white;
  }
  
  .form-input:focus {
    border-color: #8b5cf6;
  }
  
  .tab-button {
    background: #374151;
    border-color: #4b5563;
    color: #d1d5db;
  }
  
  .tab-button.active {
    background: #4b5563;
    border-color: #8b5cf6;
    color: #8b5cf6;
  }
  
  .emoji-palette {
    border-color: #4b5563;
    background: #374151;
  }
  
  .emoji-option:hover {
    background: #4b5563;
  }
  
  .upload-label {
    border-color: #4b5563;
    background: #374151;
  }
  
  .upload-placeholder {
    color: #9ca3af;
  }
  
  .btn-secondary {
    background: #374151;
    color: #d1d5db;
  }
  
  .btn-secondary:hover {
    background: #4b5563;
  }
}
</style>