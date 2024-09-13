<template>
  <div class="results-container color-test-content color-test-result-screen">
    <ColorResultsDisplay
      :userThresholds="userThresholds"
      :binPositions="binPositions"
      :counts="counts"
      :xCdfs="xCdfs"
      :yCdfs="yCdfs"
    />

    <BottomButtons
      :visible="true"
      :showTestButtons="false"
      :hasCompletedOwnTest="hasCompletedOwnTest"
      @reset="reset"
      @retake-test="startTest"
    />

    <FloatingShareCard
      :hasCompletedOwnTest="hasCompletedOwnTest"
      :shareLink="computedShareLink"
      @start-test="startTest"
    />
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import BottomButtons from './BottomButtons.vue'
import FloatingShareCard from './FloatingShareCard.vue'
import ColorResultsDisplay from './ColorResultsDisplay.vue'
import supabase from '@/supabaseClient'
import { COLOR_PAIRS, COLOR_DATA } from '@/colorTestConfig'

export default {
  name: 'ResultsView',
  components: { BottomButtons, FloatingShareCard, ColorResultsDisplay },
  props: {
    userThresholds: {
      type: Array,
      default: () => []
    },
    shareLink: {
      type: String,
      default: ''
    },
    binPositions: {
      type: Array,
      required: true
    },
    counts: {
      type: Array,
      required: true
    },
    xCdfs: {
      type: Array,
      required: true
    },
    yCdfs: {
      type: Array,
      required: true
    },
    id: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const router = useRouter()
    const route = useRoute()
    const userThresholds = ref([])
    const hasCompletedOwnTest = ref(false)
    const binPositions = ref([])
    const counts = ref([])
    const xCdfs = ref([])
    const yCdfs = ref([])

    const computedShareLink = computed(() => {
      return `${window.location.origin}/result/${route.params.id}`
    })

    onMounted(async () => {
      // Wait for the route to be ready
      await router.isReady()

      const id = route.params.id
      if (!id) {
        console.error('No ID provided in route params')
        return
      }

      hasCompletedOwnTest.value = localStorage.getItem('hasCompletedTest') === 'true'
      console.log('Results: hasCompletedOwnTest:', hasCompletedOwnTest.value)

      try {
        console.log('Fetching data for id:', id)
        const { data, error } = await supabase
          .from('color_test_results')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error

        console.log('Fetched data:', data)

        // Update this section to handle potentially missing columns
        userThresholds.value = data.final_hues || []
        binPositions.value =
          data.bin_positions ||
          COLOR_PAIRS.map((pair) => COLOR_DATA[`${pair.color1}_${pair.color2}`].BIN_POSITION)
        counts.value =
          data.counts ||
          COLOR_PAIRS.map((pair) => COLOR_DATA[`${pair.color1}_${pair.color2}`].BIN_COUNT)
        xCdfs.value =
          data.x_cdfs ||
          COLOR_PAIRS.map((pair) => COLOR_DATA[`${pair.color1}_${pair.color2}`].X_CDF)
        yCdfs.value =
          data.y_cdfs ||
          COLOR_PAIRS.map((pair) => COLOR_DATA[`${pair.color1}_${pair.color2}`].Y_CDF)
        // shareLink.value = `${window.location.origin}/result/${props.id}`
      } catch (error) {
        console.error('Error fetching results:', error)
        // Fallback to default values if there's an error
        userThresholds.value = []
        binPositions.value = COLOR_PAIRS.map(
          (pair) => COLOR_DATA[`${pair.color1}_${pair.color2}`].BIN_POSITION
        )
        counts.value = COLOR_PAIRS.map(
          (pair) => COLOR_DATA[`${pair.color1}_${pair.color2}`].BIN_COUNT
        )
        xCdfs.value = COLOR_PAIRS.map((pair) => COLOR_DATA[`${pair.color1}_${pair.color2}`].X_CDF)
        yCdfs.value = COLOR_PAIRS.map((pair) => COLOR_DATA[`${pair.color1}_${pair.color2}`].Y_CDF)
      }
    })

    const startTest = () => {
      router.push('/')
    }

    const reset = () => {
      // Implement reset logic if needed
    }

    return {
      startTest,
      reset,
      hasCompletedOwnTest,
      computedShareLink
      // userThresholds,
      // binPositions,
      // counts,
      // xCdfs,
      // yCdfs
    }
  }
}
</script>

<style scoped>
.results-container {
  width: 100%;
  height: auto;
  min-height: 100vh;
  overflow-y: visible;
  position: relative;
}

.color-test-content.color-test-result-screen {
  height: auto !important;
  overflow: visible !important;
}
</style>
