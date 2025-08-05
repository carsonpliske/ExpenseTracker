<template>
  <div id="app">
    <div class="container">
      <header class="header">
        <div style="font-size: 2rem; margin-bottom: 0.5rem;">💰</div>
        <h1>Track</h1>
        <p>Expenses & Income</p>
        <button 
          v-if="showInstallPrompt" 
          @click="installPWA" 
          class="install-btn"
        >
          📱 Install App
        </button>
      </header>

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
        <ExpenseTracker v-if="activeTab === 'expenses'" />
        <BudgetPlanner v-if="activeTab === 'budget'" />
        <AveragesTracker v-if="activeTab === 'averages'" />
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import ExpenseTracker from './components/ExpenseTracker.vue'
import BudgetPlanner from './components/BudgetPlanner.vue'
import AveragesTracker from './components/AveragesTracker.vue'

export default {
  name: 'App',
  components: {
    ExpenseTracker,
    BudgetPlanner,
    AveragesTracker
  },
  setup() {
    const activeTab = ref('expenses')
    const showInstallPrompt = ref(false)
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

    return {
      activeTab,
      showInstallPrompt,
      installPWA
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
</style>