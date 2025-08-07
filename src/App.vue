<template>
  <div id="app">
    <div class="container">
      <header class="header">
        <div style="font-size: 1.5rem; margin-bottom: 0.25rem;">💰</div>
        <h1 style="font-size: 1.75rem;">Tracks</h1>
        <p style="font-size: 0.9rem; margin-bottom: 0.5rem;">Expenses & Income</p>
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
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch, nextTick } from 'vue'
import ExpenseTracker from './components/ExpenseTracker.vue'
import BudgetPlanner from './components/BudgetPlanner.vue'
import AveragesTracker from './components/AveragesTracker.vue'
import AllTransactions from './components/AllTransactions.vue'

export default {
  name: 'App',
  components: {
    ExpenseTracker,
    BudgetPlanner,
    AveragesTracker,
    AllTransactions
  },
  setup() {
    const activeTab = ref('expenses')
    const showInstallPrompt = ref(false)
    const categories = ref([])
    let deferredPrompt = null

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

    const handleCategoriesLoaded = (loadedCategories) => {
      console.log('Categories loaded in App.vue:', loadedCategories)
      categories.value = loadedCategories
    }

    // Load categories immediately if they don't exist - get the real current categories
    const loadCategoriesIfNeeded = () => {
      if (categories.value.length === 0) {
        // Force load the ExpenseTracker component to get real categories
        // This is a workaround - we should get categories from ExpenseTracker
        console.log('Categories not loaded yet, will load from ExpenseTracker')
        // Don't set default categories here, let ExpenseTracker provide them
      }
    }

    // Remove complex auto-switching logic - let AllTransactions handle its own categories

    return {
      activeTab,
      showInstallPrompt,
      categories,
      installPWA,
      handleCategoriesLoaded
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
</style>