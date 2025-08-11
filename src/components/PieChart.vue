<template>
  <div class="pie-chart" :class="size">
    <canvas ref="chartCanvas"></canvas>
    <div class="center-text" v-if="totalAmount !== undefined && totalAmount > 0">
      <div class="total-amount">${{ totalAmount.toFixed(2) }}</div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  DoughnutController
} from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend, DoughnutController)

export default {
  name: 'PieChart',
  props: {
    data: {
      type: Object,
      required: true
    },
    size: {
      type: String,
      default: 'medium' // small, medium, large
    },
    totalAmount: {
      type: Number,
      default: undefined
    }
  },
  emits: ['slice-click', 'slice-long-press'],
  setup(props, { emit }) {
    const chartCanvas = ref(null)
    let chartInstance = null
    let longPressTimer = null
    let longPressTriggered = false
    let lastClickTime = 0
    let lastClickElement = null

    const createChart = () => {
      if (chartInstance) {
        chartInstance.destroy()
      }

      const ctx = chartCanvas.value.getContext('2d')
      chartInstance = new ChartJS(ctx, {
        type: 'doughnut',
        data: props.data,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false // Disable default legend
            },
            tooltip: {
              backgroundColor: '#1A1A2E',
              titleColor: '#FFFFFF',
              bodyColor: '#CBD5E0',
              borderColor: '#8B5CF6',
              borderWidth: 1,
              callbacks: {
                label: function(context) {
                  const value = context.raw
                  const total = context.dataset.data.reduce((sum, val) => sum + val, 0)
                  const percentage = ((value / total) * 100).toFixed(1)
                  return `${context.label}: $${value.toFixed(2)} (${percentage}%)`
                }
              }
            }
          },
          cutout: '60%',
          elements: {
            arc: {
              borderWidth: 2,
              borderColor: 'rgba(0, 0, 0, 0.1)',
              hoverBorderWidth: 4,
              hoverBorderColor: '#FFFFFF'
            }
          },
          onClick: (event, elements) => {
            if (elements.length > 0) {
              const elementIndex = elements[0].index
              const label = props.data.labels[elementIndex]
              const currentTime = Date.now()
              
              // Check for double-tap (within 500ms)
              if (lastClickElement === elementIndex && (currentTime - lastClickTime) < 500) {
                console.log('Double tap detected - opening color picker')
                emit('slice-long-press', { index: elementIndex, label })
                lastClickTime = 0 // Reset to prevent triple-tap
                lastClickElement = null
              } else {
                // Single tap - normal behavior
                if (!longPressTriggered) {
                  emit('slice-click', { index: elementIndex, label })
                }
                lastClickTime = currentTime
                lastClickElement = elementIndex
              }
            }
            longPressTriggered = false
          },
        }
      })
    }

    onMounted(() => {
      createChart()
    })

    watch(() => props.data, () => {
      createChart()
    }, { deep: true })

    return {
      chartCanvas
    }
  }
}
</script>

<style scoped>
.pie-chart {
  position: relative;
  width: 100%;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.center-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
}

.total-amount {
  font-size: 1.8rem;
  font-weight: bold;
  color: var(--text-primary);
}

/* Responsive font sizes for different chart sizes */
.pie-chart.small .total-amount {
  font-size: 1.4rem;
}

.pie-chart.large .total-amount {
  font-size: 2.2rem;
}

/* Size variants */
.pie-chart {
  height: 300px; /* default medium */
}

.pie-chart.small {
  height: 250px;
}

.pie-chart.large {
  height: 400px;
}

/* Responsive sizing */
@media (max-width: 767px) {
  .pie-chart {
    height: 280px;
  }
  
  .pie-chart.small {
    height: 220px;
  }
  
  .pie-chart.large {
    height: 320px;
  }
}

@media (min-width: 768px) {
  .pie-chart {
    height: 350px;
  }
  
  .pie-chart.small {
    height: 280px;
  }
  
  .pie-chart.large {
    height: 450px;
  }
}

@media (min-width: 1200px) {
  .pie-chart {
    height: 400px;
  }
  
  .pie-chart.small {
    height: 300px;
  }
  
  .pie-chart.large {
    height: 500px;
  }
}
</style>