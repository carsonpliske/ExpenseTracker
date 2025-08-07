<template>
  <button 
    class="theme-toggle" 
    @click="$emit('toggle-theme')"
    :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
  >
    <span class="theme-icon">
      {{ isDark ? '☀️' : '🌙' }}
    </span>
  </button>
</template>

<script>
export default {
  name: 'ThemeToggle',
  props: {
    isDark: {
      type: Boolean,
      required: true
    }
  },
  emits: ['toggle-theme']
}
</script>

<style scoped>
.theme-toggle {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  border: 2px solid var(--border-color, #e2e8f0);
  background: var(--surface-light, #ffffff);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 9999;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  /* Ensure it stays above everything */
  pointer-events: auto;
}

.theme-toggle:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.theme-toggle:active {
  transform: scale(0.95);
}

.theme-icon {
  font-size: 1.2rem;
  transition: transform 0.3s ease;
}

.theme-toggle:hover .theme-icon {
  transform: rotate(15deg);
}

/* Mobile positioning */
@media (max-width: 768px) {
  .theme-toggle {
    top: 0.75rem;
    right: 0.75rem;
    width: 2.5rem;
    height: 2.5rem;
  }
  
  .theme-icon {
    font-size: 1rem;
  }
}
</style>