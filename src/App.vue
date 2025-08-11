<template>
  <div id="app" :data-theme="currentTheme">
    <ThemeToggle 
      :is-dark="currentTheme === 'dark'" 
      @toggle-theme="toggleTheme" 
    />
    <div class="container">
      <header class="header">
        <div style="font-size: 1.1rem; margin-bottom: 0.1rem;">💰</div>
        <h1 style="font-size: 1.3rem;">Expense Tracker</h1>
        <button 
          v-if="showInstallPrompt" 
          @click="installPWA" 
          class="install-btn"
        >
          📱 Install App
        </button>
      </header>

      <!-- All Transactions Tab (spans full width) -->
      <nav class="all-transactions-nav">
        <button 
          class="all-transactions-tab" 
          :class="{ active: activeTab === 'all-transactions' }"
          @click.stop="activeTab = 'all-transactions'"
          type="button"
        >
          📊 All Transactions
        </button>
      </nav>

      <!-- Main Navigation Tabs -->
      <nav class="nav-tabs">
        <button 
          class="nav-tab" 
          :class="{ active: activeTab === 'expenses' }"
          @click="activeTab = 'expenses'"
        >
          Expenses
        </button>
        <button 
          class="nav-tab" 
          :class="{ active: activeTab === 'budget' }"
          @click="activeTab = 'budget'"
        >
          Budget Planner
        </button>
        <button 
          class="nav-tab" 
          :class="{ active: activeTab === 'averages' }"
          @click="activeTab = 'averages'"
        >
          Averages
        </button>
      </nav>

      <div class="main-content">
        <AllTransactions v-if="activeTab === 'all-transactions'" :categories="categories" />
        <ExpenseTracker v-if="activeTab === 'expenses'" @categories-loaded="handleCategoriesLoaded" />
        <BudgetPlanner v-if="activeTab === 'budget'" />
        <AveragesTracker v-if="activeTab === 'averages'" />
        
        <!-- Version number at bottom of content -->
        <div class="version-number">v1.0.5</div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch, nextTick, onMounted } from 'vue'
import ExpenseTracker from './components/ExpenseTracker.vue'
import BudgetPlanner from './components/BudgetPlanner.vue'
import AveragesTracker from './components/AveragesTracker.vue'
import AllTransactions from './components/AllTransactions.vue'
import ThemeToggle from './components/ThemeToggle.vue'
import { customCategoryService } from './services/database.js'

export default {
  name: 'App',
  components: {
    ExpenseTracker,
    BudgetPlanner,
    AveragesTracker,
    AllTransactions,
    ThemeToggle
  },
  setup() {
    const activeTab = ref('expenses')
    const showInstallPrompt = ref(false)
    const categories = ref([])
    let deferredPrompt = null

    // Theme management
    const currentTheme = ref('dark') // Default to dark theme

    // Load theme from localStorage
    const loadTheme = () => {
      const savedTheme = localStorage.getItem('expense-tracker-theme')
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        currentTheme.value = savedTheme
      }
    }

    // Save theme to localStorage
    const saveTheme = () => {
      localStorage.setItem('expense-tracker-theme', currentTheme.value)
    }

    // Toggle theme
    const toggleTheme = () => {
      currentTheme.value = currentTheme.value === 'dark' ? 'light' : 'dark'
      saveTheme()
    }

    // Handle PWA install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      deferredPrompt = e
      showInstallPrompt.value = true
    })

    const installPWA = async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        if (outcome === 'accepted') {
          showInstallPrompt.value = false
        }
        deferredPrompt = null
      }
    }

    const handleCategoriesLoaded = async (loadedCategories) => {
      console.log('Categories loaded in App.vue:', loadedCategories)
      categories.value = loadedCategories
    }

    // Load categories from database
    const loadCategories = async () => {
      try {
        // Load base categories (same as in ExpenseTracker)
        const baseCategoriesData = [
          { id: 'rent', name: 'Rent', icon: '🏠', darkColor: '#DC2626', lightColor: '#991B1B' },
          { id: 'groceries', name: 'Groceries', icon: '🛒', darkColor: '#3B82F6', lightColor: '#1D4ED8' },
          { id: 'transport', name: 'Transport', icon: '🚗', darkColor: '#F59E0B', lightColor: '#D97706' },
          { id: 'restaurant', name: 'Restaurant', icon: '🍽️', darkColor: '#8B5CF6', lightColor: '#7C3AED' },
          { id: 'health', name: 'Health', icon: '💚', darkColor: '#10B981', lightColor: '#059669' },
          { id: 'gifts', name: 'Gifts', icon: '🎁', darkColor: '#EF4444', lightColor: '#DC2626' },
          { id: 'shopping', name: 'Shopping', icon: '🛍️', darkColor: '#14B8A6', lightColor: '#0F766E' },
          { id: 'movies', name: 'Movies', icon: '🎬', darkColor: '#F97316', lightColor: '#EA580C' },
          { id: 'education', name: 'Education', icon: '📚', darkColor: '#6366F1', lightColor: '#4F46E5' },
          { id: 'traveling', name: 'Traveling', icon: '✈️', darkColor: '#06B6D4', lightColor: '#0284C7' },
          { id: 'electric', name: 'Electric', icon: '⚡', darkColor: '#FACC15', lightColor: '#CA8A04' },
          { id: 'water', name: 'Water', icon: '💧', darkColor: '#0EA5E9', lightColor: '#0369A1' },
          { id: 'other', name: 'Other', icon: '📋', darkColor: '#64748B', lightColor: '#475569' }
        ]
        
        // Load custom categories
        const customCategories = await customCategoryService.getAll()
        
        // Get current theme
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark'
        
        // Merge and apply theme colors
        const baseCategories = baseCategoriesData.map(cat => ({
          ...cat,
          color: currentTheme === 'light' ? cat.lightColor : cat.darkColor
        }))
        
        const customCats = customCategories.map(cat => ({
          ...cat,
          color: currentTheme === 'light' ? cat.lightColor : cat.darkColor
        }))
        
        categories.value = [...baseCategories, ...customCats]
        
        // Load custom colors from localStorage
        loadCustomColors()
      } catch (error) {
        console.error('Failed to load categories in App.vue:', error)
      }
    }

    const loadCustomColors = () => {
      try {
        const customColors = localStorage.getItem('expense-tracker-custom-colors')
        if (customColors) {
          const colorMap = JSON.parse(customColors)
          categories.value.forEach(category => {
            if (colorMap[category.id]) {
              category.color = colorMap[category.id]
            }
          })
        }
      } catch (error) {
        console.error('Failed to load custom colors:', error)
      }
    }

    // Remove complex auto-switching logic - let AllTransactions handle its own categories

    // Initialize theme and categories on mount
    onMounted(async () => {
      loadTheme()
      await loadCategories()
    })

    // Watch for tab changes to ensure categories are loaded
    watch(activeTab, async (newTab) => {
      if (newTab === 'all-transactions' && categories.value.length === 0) {
        await loadCategories()
      }
    })

    // Watch for theme changes and reload categories with correct colors
    watch(currentTheme, async () => {
      await loadCategories()
    })

    return {
      activeTab,
      showInstallPrompt,
      categories,
      currentTheme,
      installPWA,
      handleCategoriesLoaded,
      toggleTheme
    }
  }
}
</script>

<style scoped>
.install-btn {
  background: linear-gradient(135deg, var(--accent-purple), var(--accent-blue));
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  margin-top: 1rem;
  transition: all 0.3s ease;
}

.install-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

/* All Transactions Navigation */
.all-transactions-nav {
  margin: 1rem 0 0.5rem 0;
  padding: 0 1rem;
}

.all-transactions-tab {
  width: 100%;
  padding: 0.75rem;
  background: linear-gradient(135deg, var(--accent-purple), var(--accent-blue));
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.2);
  pointer-events: auto;
  user-select: none;
  touch-action: manipulation;
}

.all-transactions-tab:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.all-transactions-tab.active {
  background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple));
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.4);
}

@media (max-width: 768px) {
  .all-transactions-nav {
    margin: 0.75rem 0 0.5rem 0;
    padding: 0 0.75rem;
  }
  
  .all-transactions-tab {
    padding: 0.65rem;
    font-size: 0.95rem;
  }
}

/* Version number */
.version-number {
  text-align: center;
  padding: 2rem 0 1rem 0;
  margin-top: 3rem;
  font-size: 0.7rem;
  color: var(--text-secondary);
  opacity: 0.6;
  font-weight: 400;
  letter-spacing: 0.5px;
}
</style>