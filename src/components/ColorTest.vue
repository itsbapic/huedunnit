<!-- ONLY CHANGE THIS FILE! -->
<template>
  <div class="color-test-wrapper">
    <div :style="containerStyle" class="color-test-container">
      <div v-if="rounds < MAX_ROUNDS" class="color-test-content">
        <transition name="fade-up" mode="out-in">
          <h1 v-if="showInitialMessage" key="initial" class="color-test-title">
            <span class="background-white">Test <i>your</i> color categorization</span>
          </h1>
          <h1 v-else-if="showSecondMessage" key="second" class="color-test-title">
            <span class="background-white">What color is this? Choose below</span>
          </h1>
          <h1 v-else key="main" class="color-test-title">
            <span class="background-white">
              Is <i>my </i>
              <GlitchText
                :text="currentPair.color1"
                :alternateText="currentPair.color2"
                :glitchInterval="7000"
              />
              <i> your </i>
              <GlitchText
                :text="currentPair.color1"
                :alternateText="currentPair.color2"
                :glitchInterval="8000"
              />?
            </span>
          </h1>
        </transition>
      </div>
      <div v-else class="color-test-content color-test-result-screen">
        <DemographicsModal v-if="!demographicsSubmitted" @submit="submitDemographics" />
        <Results
          v-if="rounds === MAX_ROUNDS"
          :binPositions="binPositions"
          :counts="counts"
          :xCdfs="xCdfs"
          :yCdfs="yCdfs"
          :userThresholds="finalHues"
          :shareLink="shareLink"
          :hasCompletedCurrentTest="false"
          :isAboutCardVisible="isAboutCardVisible"
          @reset="reset"
          @start-test="startNewTest"
        />
      </div>

      <BottomButtons
        :showTestButtons="rounds < MAX_ROUNDS"
        :hasCompletedCurrentTest="false"
        :buttonOrder="buttonOrder"
        @select-color="selectColor"
        @reset="reset"
        @retake-test="reset"
        @about-visibility-changed="handleAboutVisibilityChange"
      />
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import supabase from '@/supabaseClient'
import { MAX_ROUNDS, VERSION, COLOR_PAIRS, COLOR_DATA } from '@/colorTestConfig'
import confetti from 'https://cdn.skypack.dev/canvas-confetti'
import Results from './Results.vue'
import BottomButtons from './BottomButtons.vue'
import DemographicsModal from './DemographicsModal.vue'
import { fitSigmoid } from '@/utils/glmUtils'
import { fetchAggregateData } from '@/colorTestConfig'

import maskImage from '@/assets/mask.png'
import GlitchText from './GlitchText.vue'

export default {
  components: {
    Results,
    GlitchText,
    BottomButtons,
    DemographicsModal
  },
  setup() {
    // Reactive reference for the share link
    const shareLink = ref('')
    const isAboutCardVisible = ref(false)

    return {
      shareLink,
      isAboutCardVisible
    }
  },
  data() {
    return {
      // Test configuration
      MAX_ROUNDS: MAX_ROUNDS, // Maximum number of rounds per color pair
      colorPairs: COLOR_PAIRS, // Array of color pairs to test
      currentPairIndex: 0, // Index of the current color pair being tested
      hasCompletedOwnTest: false, // Flag to indicate if the user has completed their own test

      // User inputs and responses
      finalHues: COLOR_PAIRS.map(() => 0), // Array to store final hue values for each color pair
      responses: COLOR_PAIRS.map(() => []), // Array to store user responses for each color pair

      // Test state
      currentHue: this.getInitialHue(COLOR_PAIRS[0].hueRange), // Current hue being tested
      demographicsSubmitted: false, // Flag to indicate if demographics have been submitted
      polarity: 0, // Polarity for the sigmoid function
      rounds: 0, // Current round number
      showInitialMessage: true, // Flag to show the initial message
      showMask: false, // Flag to show the mask between color changes
      showSecondMessage: false, // Flag to show the second message
      submitted: false, // Flag to indicate if the test has been submitted
      testInputCount: 0, // Counter for test inputs

      // Device and user info
      anonymousId: this.generateAnonymousId(), // Unique ID for the current test session
      colorDepth: 0, // Color depth of the user's screen
      pixelRatio: 1, // Pixel ratio of the user's screen
      screenHeight: 0, // Height of the user's screen
      screenWidth: 0, // Width of the user's screen
      timestamp: '', // Timestamp of the test
      userAgent: '', // User agent string

      // Test data and analytics
      aggregateData: null, // Aggregate data for all users
      binPositions: COLOR_PAIRS.map(
        (pair) => COLOR_DATA[`${pair.color1}_${pair.color2}`].BIN_POSITION
      ), // Bin positions for histogram
      counts: COLOR_PAIRS.map((pair) => COLOR_DATA[`${pair.color1}_${pair.color2}`].BIN_COUNT), // Counts for histogram
      logData: [], // Detailed log of each round
      testStartTime: null, // Start time of the test
      xCdfs: COLOR_PAIRS.map((pair) => COLOR_DATA[`${pair.color1}_${pair.color2}`].X_CDF), // X values for CDF
      yCdfs: COLOR_PAIRS.map((pair) => COLOR_DATA[`${pair.color1}_${pair.color2}`].Y_CDF), // Y values for CDF

      // UI elements
      maskImageUrl: maskImage // URL for the mask image
    }
  },
  computed: {
    // Compute the current color based on the current hue
    currentColor() {
      return `hsl(${this.currentHue}, 100%, 50%)`
    },
    // Get the current color pair being tested
    currentPair() {
      return this.colorPairs[this.currentPairIndex]
    },
    // Compute the style for the container based on the current state
    containerStyle() {
      if (this.rounds === MAX_ROUNDS) {
        return { backgroundColor: 'white' }
      } else if (this.showMask) {
        return {
          backgroundColor: 'transparent',
          backgroundImage: `url(${this.maskImageUrl})`,
          backgroundRepeat: 'repeat',
          backgroundSize: 'auto'
        }
      } else {
        return { backgroundColor: this.currentColor }
      }
    },
    // Determine the order of buttons (randomized)
    buttonOrder() {
      return this.currentPairIndex % 2 === 0
        ? [this.currentPair.color1, this.currentPair.color2]
        : [this.currentPair.color2, this.currentPair.color1]
    }
  },
  methods: {
    // Handle color selection by the user
    selectColor(color) {
      if (!this.buttonOrder.includes(color)) {
        console.error(`Invalid color selected: ${color}`)
        return
      }
      const roundStartTime = performance.now()

      // Determine which color in the pair was actually selected
      const actualSelectedColor =
        this.currentPair.color1 === color ? this.currentPair.color1 : this.currentPair.color2

      this.responses[this.currentPairIndex].push({
        hue: this.currentHue,
        response: actualSelectedColor
      })

      // Get the new probe value
      const fitSigmoidStartTime = performance.now()
      const { a, b, newProbe, polarity } = fitSigmoid(
        this.responses[this.currentPairIndex].map((r) => r.hue),
        this.responses[this.currentPairIndex].map((r) => r.response === this.currentPair.color2),
        this.polarity,
        0.4,
        this.currentPair.hueRange
      )
      const fitSigmoidEndTime = performance.now()
      const fitSigmoidDuration = fitSigmoidEndTime - fitSigmoidStartTime

      this.polarity = polarity == 1 ? -1 : 1
      const previousHue = this.currentHue
      this.currentHue = newProbe
      this.rounds++

      const roundData = {
        round: this.rounds,
        previousHue,
        newHue: this.currentHue,
        response: actualSelectedColor,
        newProbe,
        polarity: this.polarity,
        roundDuration: performance.now() - roundStartTime,
        fitSigmoidDuration,
        sigmoidParameters: { a, b }
      }

      this.logData.push(roundData)

      if (this.rounds === MAX_ROUNDS) {
        this.finalHues[this.currentPairIndex] =
          (this.currentPair.hueRange[0] + this.currentPair.hueRange[1]) / 2 - b
        this.currentPairIndex = (this.currentPairIndex + 1) % this.colorPairs.length
        if (this.currentPairIndex === 0) {
          this.completeTest()
        } else {
          this.currentHue = this.getInitialHue(this.currentPair.hueRange)
          this.rounds = 0 // Reset rounds for the next color pair
        }
      }

      this.showMask = true
      setTimeout(() => {
        this.showMask = false
      }, 200)

      this.testInputCount++
      if (this.testInputCount === 3) {
        this.showSecondMessage = false
      }
    },
    // Start a new test
    startNewTest() {
      this.reset()
      this.$router.push('/')
    },
    // Reset the test state
    reset() {
      this.anonymousId = this.generateAnonymousId()
      this.currentPairIndex = 0
      this.responses = this.colorPairs.map(() => [])
      this.finalHues = this.colorPairs.map(() => 0)
      this.currentHue = this.getInitialHue(this.currentPair.hueRange)
      this.rounds = 0
      this.showInitialMessage = true
      this.showSecondMessage = false
      this.testInputCount = 0
      this.submitted = false
      this.showMask = false
      this.testStartTime = performance.now()
      this.logData = []
      this.demographicsSubmitted = false
      setTimeout(() => {
        this.showInitialMessage = false
        this.showSecondMessage = true
      }, 2000)
    },
    // Generate a unique anonymous ID for the test session
    generateAnonymousId() {
      return (
        Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      )
    },
    // Submit demographics data
    async submitDemographics(demographicsData) {
      try {
        const { error } = await supabase.from('color_test_demo').insert([
          {
            anonymous_id: this.anonymousId,
            first_language: demographicsData.firstLanguage,
            color_blindness: demographicsData.colorBlindness
          }
        ])
        if (error) throw error
        this.demographicsSubmitted = true
        // Now that demographics are submitted, we can submit the test results
        await this.submitResults()
        confetti()
      } catch (error) {
        console.error('Error submitting demographics:', error)
        alert('Failed to submit demographics. Please try again.')
      }
    },
    // Submit test results
    async submitResults() {
      this.gatherDeviceInfo()
      const now = new Date()
      this.timestamp = now.toISOString()

      // Create a local timestamp by adjusting for timezone offset
      const offsetMs = now.getTimezoneOffset() * 60 * 1000
      const localDate = new Date(now.getTime() - offsetMs)
      this.localTimestamp = localDate.toISOString()

      try {
        const payload = {
          anonymous_id: this.anonymousId,
          user_agent: this.userAgent,
          screen_width: this.screenWidth,
          screen_height: this.screenHeight,
          color_depth: this.colorDepth,
          pixel_ratio: this.pixelRatio,
          timestamp: this.timestamp,
          local_timestamp: this.localTimestamp,
          responses: this.responses,
          final_hues: this.finalHues,
          version: VERSION,
          test_duration: performance.now() - this.testStartTime,
          log_data: this.logData
        }

        // Insert data and get the inserted row
        const { data, error } = await supabase.from('color_test_results').insert([payload]).select()

        if (error) throw error

        // Get the result ID from the inserted row
        const resultId = data[0].id
        this.shareLink = `${window.location.origin}/result/${resultId}`
        console.log('Result link:', this.shareLink)

        // Update localStorage only after successful submission
        console.log('Before updating completedTests:', localStorage.getItem('completedTests'))
        const completedTests = JSON.parse(localStorage.getItem('completedTests') || '[]')
        completedTests.push(resultId)
        localStorage.setItem('completedTests', JSON.stringify(completedTests))
        console.log('After updating completedTests:', localStorage.getItem('completedTests'))

        // Navigate to results page with a flag indicating it's a newly completed test
        await this.$router.push({
          name: 'Results',
          params: { id: resultId },
          query: { newlyCompleted: 'true' }
        })

        this.submitted = true
      } catch (error) {
        console.error('Error submitting results:', error)
        alert('Failed to submit results. Please try again.')
      }
    },
    // Gather device information
    gatherDeviceInfo() {
      this.userAgent = navigator.userAgent
      this.screenWidth = window.screen.width
      this.screenHeight = window.screen.height
      this.colorDepth = window.screen.colorDepth
      this.pixelRatio = window.devicePixelRatio || 1
    },
    // Get an initial hue value for a given range
    getInitialHue(hueRange) {
      return Math.random() > 0.5 ? hueRange[0] : hueRange[1]
    },
    // Complete the test by calculating final hues
    async completeTest() {
      this.finalHues = this.colorPairs.map((pair, index) => {
        const midpoint = (pair.hueRange[0] + pair.hueRange[1]) / 2
        const responses = this.responses[index]
        const { b } = fitSigmoid(
          responses.map((r) => r.hue),
          responses.map((r) => r.response === pair.color2),
          0,
          0.4,
          pair.hueRange
        )
        return midpoint - b
      })

      // Fetch aggregate data
      this.aggregateData = await fetchAggregateData()
    },
    // Add a method to toggle AboutCard visibility
    handleAboutVisibilityChange(isVisible) {
      this.isAboutCardVisible = isVisible
    }
  },
  GlitchText,
  mounted() {
    // Initialize the test when the component is mounted
    this.anonymousId = this.generateAnonymousId()
    localStorage.setItem('currentTestId', this.anonymousId)
    this.testStartTime = performance.now()
    setTimeout(() => {
      this.showInitialMessage = false
      this.showSecondMessage = true
    }, 2000)
  }
}
</script>

<style src="./ColorTest.css" scoped />
<style scoped>
.color-test-title {
  position: relative;
}

.background-white {
  position: relative;
  z-index: 1;
}
</style>
