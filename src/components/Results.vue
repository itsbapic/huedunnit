<template>
  <div class="results-container color-test-content color-test-result-screen">
    <!-- Show loading state -->
    <div v-if="isLoading">Loading...</div>

    <!-- Show error message if there's an error -->
    <div v-else-if="error">Error: {{ error.message }}</div>

    <!-- Show results when data is loaded -->
    <template v-else>
      <!-- Display color test results -->
      <ColorResultsDisplay
        :userThresholds="userThresholds"
        :binPositions="binPositions"
        :counts="counts"
        :xCdfs="xCdfs"
        :yCdfs="yCdfs"
      />

      <!-- Bottom buttons for resetting or retaking the test -->
      <BottomButtons
        :visible="true"
        :showTestButtons="false"
        :hasCompletedCurrentTest="hasCompletedCurrentTest"
        @reset="reset"
        @retake-test="startTest"
        @about-visibility-changed="handleAboutVisibilityChange"
      />

      <!-- Floating card for sharing results -->
      <FloatingShareCard
        :hasCompletedCurrentTest="hasCompletedCurrentTest"
        :shareLink="computedShareLink"
        :isAboutCardVisible="isAboutCardVisible"
        @start-test="startTest"
      />
    </template>
  </div>
</template>

<script>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import BottomButtons from './BottomButtons.vue'
import FloatingShareCard from './FloatingShareCard.vue'
import ColorResultsDisplay from './ColorResultsDisplay.vue'
import supabase from '@/supabaseClient'
import { COLOR_PAIRS, COLOR_DATA } from '@/colorTestConfig'

export default {
  name: 'ResultsView',
  components: { BottomButtons, FloatingShareCard, ColorResultsDisplay },

  // Props definition
  props: {
    userThresholds: {
      type: Array,
      default: () => []
    },
    shareLink: {
      type: String,
      default: ''
    },
    // binPositions: {
    //   type: Array,
    //   required: true
    // },
    // counts: {
    //   type: Array,
    //   required: true
    // },
    // xCdfs: {
    //   type: Array,
    //   required: true
    // },
    // yCdfs: {
    //   type: Array,
    //   required: true
    // },
    id: {
      type: String,
      required: true
    }
  },
  setup() {
    const router = useRouter()
    const route = useRoute()

    // Reactive references
    const userThresholds = ref([])
    const hasCompletedCurrentTest = ref(false)
    const binPositions = ref([])
    const counts = ref([])
    const xCdfs = ref([])
    const yCdfs = ref([])
    const isLoading = ref(true)
    const error = ref(null)
    const testId = ref('')
    const isAboutCardVisible = ref(false)

    // Computed property for share link
    const computedShareLink = computed(() => {
      return `${window.location.origin}/result/${route.params.id}`
    })

    // Function to check if the current test is completed
    const checkCompletedTest = () => {
      // console.log('Before checkCompletedTest:', localStorage.getItem('completedTests'))
      const completedTestsString = localStorage.getItem('completedTests')
      // console.log('Results: completedTestsString:', completedTestsString)
      const completedTests = completedTestsString ? JSON.parse(completedTestsString) : []
      hasCompletedCurrentTest.value = completedTests.includes(testId.value)
      // console.log('Results: hasCompletedCurrentTest:', hasCompletedCurrentTest.value)
      // console.log('Results: completedTests:', completedTests)
      // console.log('Results: current testId:', testId.value)
      // console.log('After checkCompletedTest:', localStorage.getItem('completedTests'))
    }

    // Watch for changes in route params
    watch(
      () => route.params.id,
      (newId) => {
        if (newId) {
          testId.value = newId
          checkCompletedTest()
        }
      },
      { immediate: true }
    )

    // Watch for changes in hasCompletedCurrentTest
    watch(
      () => hasCompletedCurrentTest.value,
      (newValue, oldValue) => {
        console.log('Results: hasCompletedCurrentTest changed:', {
          from: oldValue,
          to: newValue
        })
      }
    )

    // Lifecycle hook: when component is mounted
    onMounted(async () => {
      try {
        // Wait for the route to be ready
        await router.isReady()

        const id = route.params.id
        if (!id) {
          throw new Error('No ID provided in route params')
        }

        testId.value = id
        const newlyCompleted = route.query.newlyCompleted === 'true'

        console.log('Before checking completedTests:', localStorage.getItem('completedTests'))
        const completedTests = JSON.parse(localStorage.getItem('completedTests') || '[]')
        hasCompletedCurrentTest.value = completedTests.includes(id) || newlyCompleted
        console.log('After checking completedTests:', localStorage.getItem('completedTests'))
        console.log('hasCompletedCurrentTest:', hasCompletedCurrentTest.value)

        console.log('Fetching data for id:', id)
        const { data, error: fetchError } = await supabase
          .from('color_test_results')
          .select('*')
          .eq('id', id)
          .single()

        if (fetchError) throw fetchError

        console.log('Fetched data:', data)

        // Define isOwnTest
        const currentUser = await supabase.auth.getUser()
        const isOwnTest = data && data.user_id === currentUser.data.user?.id
        console.log('Results: isOwnTest:', isOwnTest)

        // Update component data with fetched results or use default values
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

        // Do NOT modify localStorage or hasCompletedCurrentTest here
      } catch (err) {
        console.error('Error fetching results:', err)
        error.value = err
      } finally {
        isLoading.value = false
      }
    })

    // Function to start a new test
    const startTest = () => {
      router.push('/')
    }

    // Function to reset the test (if needed)
    const reset = () => {
      // Implement reset logic if needed
    }

    // Function to toggle AboutCard visibility
    const toggleAboutCard = (visible) => {
      isAboutCardVisible.value = visible
    }

    // Function to handle AboutCard visibility change
    const handleAboutVisibilityChange = (isVisible) => {
      isAboutCardVisible.value = isVisible
    }

    // Return reactive references and methods
    return {
      startTest,
      reset,
      hasCompletedCurrentTest,
      computedShareLink,
      userThresholds,
      binPositions,
      counts,
      xCdfs,
      yCdfs,
      isLoading,
      error,
      isAboutCardVisible,
      toggleAboutCard,
      handleAboutVisibilityChange
    }
  }
}
</script>

<style scoped>
/* Styles for the results container */
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
