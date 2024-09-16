<template>
  <div class="color-label-container" :style="containerStyle">
    <div class="color-label">
      <p class="result-text"><i>Your</i> {{ pair.color1 }}</p>
    </div>
    <div class="color-description">
      <p class="result-text">
        <i>Your</i> {{ pair.color1 }}-{{ pair.color2 }} boundary is at hue
        {{ Math.round(userThreshold) }}.
        <span v-if="hasData">
          You categorized {{ formatPercentage(inclusivePercentage) }} of the hues as
          {{ pair.color2 }}.
          <span v-if="inclusivePercentage > 0.55">
            This is more {{ pair.color2 }} than {{ Math.round((1 - inclusivePercentage) * 100) }}%
            of the population.
          </span>
          <span v-else-if="inclusivePercentage < 0.45">
            This is more {{ pair.color1 }} than {{ Math.round(inclusivePercentage * 100) }}% of the
            population.
          </span>
          <span v-else> This is about average compared to the population. </span>
          For you, the middle color is
          <span
            class="color-chip"
            :style="{
              backgroundColor: `hsl(${Math.round(userThreshold)}, 100%, 50%)`,
              display: 'inline-block',
              width: '1em',
              height: '1em',
              verticalAlign: 'middle',
              border: '1px solid black',
              borderRadius: '2px',
              marginLeft: '2px'
            }"
          >
          </span>
          .
        </span>
        <span v-else>
          We don't have enough data yet to compare your results with others. For <i>you</i>, the
          middle color is
          <span
            class="color-chip"
            :style="{
              backgroundColor: `hsl(${Math.round(userThreshold)}, 100%, 50%)`,
              display: 'inline-block',
              width: '1em',
              height: '1em',
              verticalAlign: 'middle',
              border: '1px solid black',
              borderRadius: '2px',
              marginLeft: '2px'
            }"
          ></span
          >.
        </span>
      </p>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    pair: {
      type: Object,
      required: true
    },
    index: {
      type: Number,
      required: true
    },
    userThreshold: {
      type: Number,
      required: true
    },
    inclusivePercentage: {
      type: Number,
      required: true
    },
    binPositions: {
      type: Array,
      required: true
    },
    counts: {
      type: Array,
      required: true
    },
    xCdf: {
      type: Array,
      required: true
    },
    yCdf: {
      type: Array,
      required: true
    }
  },
  hasData: {
    type: Boolean,
    required: true
  },
  data() {
    return {
      hasData: false // Add this line
    }
  },
  mounted() {
    // Set hasData to true if the necessary data is available
    this.hasData =
      this.binPositions && this.binPositions.length > 0 && this.counts && this.counts.length > 0
  },
  computed: {
    containerStyle() {
      return {
        top: `${this.index * 16.67}%`
      }
    }
  },
  methods: {
    formatPercentage(value) {
      return (value * 100).toFixed(1) + '%'
    }
  }
}
</script>

<style scoped>
.color-chip-turquoise {
  display: inline-block;
  width: 1em;
  height: 1em;
  background-color: turquoise;
  border: 2px solid black;
  border-radius: 0.2em;
  margin-bottom: -0.2em;
}

.color-chip-cyan {
  display: inline-block;
  width: 1em;
  height: 1em;
  background-color: cyan;
  border: 2px solid black;
  border-radius: 0.2em;
  margin-bottom: -0.2em;
}

.color-label-container {
  position: absolute;
  right: 0;
  left: 0;
  height: calc(100% / 6);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.color-label {
  position: absolute;
  top: 10px;
  left: 10px;
  background-color: rgba(255, 255, 255, 0.7);
  color: black;
  padding: 8px;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.color-description {
  position: absolute;
  top: 50%;
  left: 50%;
  min-width: 250px;
  max-width: 90vw;
  transform: translate(-50%, -50%);
  background-color: rgba(255, 255, 255, 0.7);
  color: black;
  backdrop-filter: blur(5px);
  padding: 10px;
  border-radius: 8px;
  text-align: center;
  font-size: 14px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.color-pair-result {
  padding: 20px;
  background-color: white;
  margin-bottom: 10px;
  border-radius: 5px;
}

.result-text {
  background-color: rgba(255, 255, 255, 0.7);
  padding: 5px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 5px;
}
.color-label {
  font-weight: bold;
  margin-bottom: 5px;
}

.result-text {
  height: 30%;
  overflow-y: auto;
  padding: 5px;
  background-color: white;
  color: black;
}

.results-content {
  flex-grow: 1;
  overflow-y: auto;
  padding: 5px;
}

/* Position color label containers */
.color-label-container:nth-child(1) {
  top: -16.66%;
}
.color-label-container:nth-child(2) {
  top: 0%;
}
.color-label-container:nth-child(3) {
  top: 16.67%;
}
.color-label-container:nth-child(4) {
  top: 33.34%;
}
.color-label-container:nth-child(5) {
  top: 50%;
}
.color-label-container:nth-child(6) {
  top: 66.67%;
}
.color-label-container:nth-child(7) {
  top: 83.33%;
}
.color-chip {
  display: inline-block;
  width: 1em;
  height: 1em;
  vertical-align: middle;
  border: 1px solid black;
  border-radius: 2px;
  margin-left: 2px;
}
</style>
