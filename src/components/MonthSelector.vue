<template>
  <div class="month-selector" ref="rootEl">
    <button type="button" class="period-label month-label-btn" @click="toggleOpen">
      {{ label }}
      <span class="chevron" :class="{ open: isOpen }">▾</span>
    </button>
    <transition name="month-dropdown">
      <div v-if="isOpen" class="month-dropdown">
        <button
          v-for="m in months"
          :key="`${m.year}-${m.month}`"
          type="button"
          class="month-option"
          :class="{ selected: m.year === selectedYear && m.month === selectedMonth }"
          @click="choose(m)"
        >
          {{ m.label }}
        </button>
      </div>
    </transition>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'

export default {
  name: 'MonthSelector',
  props: {
    label: {
      type: String,
      required: true
    },
    months: {
      type: Array,
      required: true
    },
    selectedYear: {
      type: Number,
      required: true
    },
    selectedMonth: {
      type: Number,
      required: true
    }
  },
  emits: ['select'],
  setup(props, { emit }) {
    const isOpen = ref(false)
    const rootEl = ref(null)

    const toggleOpen = () => {
      isOpen.value = !isOpen.value
    }

    const choose = (m) => {
      emit('select', { year: m.year, month: m.month })
      isOpen.value = false
    }

    const handleOutsideClick = (event) => {
      if (isOpen.value && rootEl.value && !rootEl.value.contains(event.target)) {
        isOpen.value = false
      }
    }

    onMounted(() => {
      document.addEventListener('click', handleOutsideClick)
    })

    onUnmounted(() => {
      document.removeEventListener('click', handleOutsideClick)
    })

    return {
      isOpen,
      rootEl,
      toggleOpen,
      choose
    }
  }
}
</script>

<style scoped>
.month-selector {
  position: relative;
  display: inline-flex;
  justify-content: center;
  width: 100%;
}

.month-label-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: none;
  border: none;
  cursor: pointer;
  font: inherit;
  color: inherit;
  padding: 0.25rem 0.6rem;
  border-radius: 0.5rem;
  transition: background-color 0.2s ease;
}

.month-label-btn:hover {
  background-color: rgba(128, 128, 128, 0.14);
}

.chevron {
  font-size: 0.7em;
  transition: transform 0.2s ease;
}

.chevron.open {
  transform: rotate(180deg);
}

.month-dropdown {
  position: absolute;
  top: calc(100% + 0.35rem);
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
  width: 12rem;
  max-height: 15rem;
  overflow-y: auto;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  padding: 0.35rem;
}

.month-option {
  display: block;
  width: 100%;
  text-align: center;
  background: none;
  border: none;
  color: var(--text-primary);
  font-size: 0.9rem;
  padding: 0.5rem 0.6rem;
  border-radius: 0.5rem;
  cursor: pointer;
}

.month-option:hover {
  background-color: rgba(128, 128, 128, 0.14);
}

.month-option.selected {
  background: linear-gradient(135deg, var(--accent-purple), var(--accent-blue));
  color: white;
  font-weight: 600;
}

.month-dropdown-enter-active,
.month-dropdown-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.month-dropdown-enter-from,
.month-dropdown-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-6px) scale(0.96);
}
</style>
