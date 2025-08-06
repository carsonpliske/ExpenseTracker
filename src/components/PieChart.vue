<template>
  <div class="pie-chart" :class="size">
    <canvas ref="chartCanvas"></canvas>
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
    }
  },
  emits: ['slice-click', 'slice-long-press'],
  setup(props, { emit }) {
    const chartCanvas = ref(null)
    let chartInstance = null
    let longPressTimer = null
    let longPressTriggered = false

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
            if (elements.length > 0 && !longPressTriggered) {
              const elementIndex = elements[0].index
              const label = props.data.labels[elementIndex]
              emit('slice-click', { index: elementIndex, label })
            }
            longPressTriggered = false
          },
          onMouseDown: (event, elements) => {
            if (elements.length > 0) {
              const elementIndex = elements[0].index
              const label = props.data.labels[elementIndex]
              
              longPressTimer = setTimeout(() => {
                longPressTriggered = true
                emit('slice-long-press', { index: elementIndex, label })
              }, 800) // 800ms for long press
            }
          },
          onMouseUp: () => {
            if (longPressTimer) {
              clearTimeout(longPressTimer)
              longPressTimer = null
            }
          },
          onTouchStart: (event, elements) => {
            if (elements.length > 0) {
              // Only prevent default when touching a pie slice
              event.native?.preventDefault()
              const elementIndex = elements[0].index
              const label = props.data.labels[elementIndex]
              
              longPressTimer = setTimeout(() => {
                longPressTriggered = true
                emit('slice-long-press', { index: elementIndex, label })
              }, 800) // 800ms for long press
            }
            // Don't prevent default if not touching a slice - allows scrolling
          },
          onTouchEnd: (event, elements) => {
            if (longPressTimer) {
              clearTimeout(longPressTimer)
              longPressTimer = null
            }
            // Only prevent default if we were handling a slice interaction
            if (elements.length > 0) {
              event.native?.preventDefault()
            }
          }
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