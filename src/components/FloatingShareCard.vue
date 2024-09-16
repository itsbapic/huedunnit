<template>
  <div v-if="!isAboutCardVisible" class="floating-share-card">
    <div class="share-content">
      <h3>{{ cardTitle }}</h3>
      <template v-if="hasCompletedCurrentTest && shareLink">
        <div class="social-icons">
          <i class="fa-brands fa-x-twitter" @click="shareOnX"></i>
          <i class="fas fa-envelope" @click="shareViaEmail"></i>
          <i class="fas fa-comment" @click="shareViaMessages"></i>
          <i class="fab fa-whatsapp" @click="shareOnWhatsApp"></i>
          <i class="fab fa-facebook-messenger" @click="shareOnMessenger"></i>
          <i class="fab fa-facebook-f" @click="shareOnFacebook"></i>
          <i class="fas fa-share-square" @click="nativeShare"></i>
        </div>
        <div class="share-link">
          <input type="text" :value="shareLink" readonly class="share-link-input" />
          <button @click="copyShareLink" class="copy-button">
            <i class="fas fa-copy"></i>
          </button>
        </div>
        <div class="copied-message-container" :class="{ 'show-message': showCopiedMessage }">
          <div class="copied-message">Copied to clipboard!</div>
        </div>
      </template>
      <template v-else>
        <button @click="$emit('start-test')" class="start-test-button">
          <span class="button-text">Start Test</span>
          <span class="button-icon">🎨</span>
        </button>
      </template>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FloatingShareCard',
  props: {
    hasCompletedCurrentTest: {
      type: Boolean,
      required: true
    },
    shareLink: {
      type: String,
      default: ''
    },
    isAboutCardVisible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      showCopiedMessage: false
    }
  },
  watch: {
    shareLink(newValue) {
      console.log('FloatingShareCard: Share link updated:', newValue)
    }
  },
  mounted() {
    console.log('FloatingShareCard: Received props:', {
      hasCompletedCurrentTest: this.hasCompletedCurrentTest,
      shareLink: this.shareLink
    })
  },
  computed: {
    cardTitle() {
      return this.hasCompletedCurrentTest ? 'Share your results' : 'See how you compare!'
    }
  },
  methods: {
    shareOnX() {
      window.open(
        `https://x.com/intent/tweet?text=Check out my color test results!&url=${encodeURIComponent(this.shareLink)}`,
        '_blank'
      )
    },
    shareViaEmail() {
      window.location.href = `mailto:?subject=Check out my color test results!&body=${encodeURIComponent(this.shareLink)}`
    },
    shareViaMessages() {
      // This will only work on iOS devices
      window.location.href = `sms:&body=${encodeURIComponent(this.shareLink)}`
    },
    shareOnWhatsApp() {
      window.open(`https://wa.me/?text=${encodeURIComponent(this.shareLink)}`, '_blank')
    },
    shareOnMessenger() {
      window.open(
        `https://www.facebook.com/dialog/send?link=${encodeURIComponent(this.shareLink)}&app_id=YOUR_FACEBOOK_APP_ID`,
        '_blank'
      )
    },
    shareOnFacebook() {
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(this.shareLink)}`,
        '_blank'
      )
    },
    nativeShare() {
      if (navigator.share) {
        navigator
          .share({
            title: 'My Color Test Results',
            text: 'Check out my color test results!',
            url: this.shareLink
          })
          .catch((error) => console.log('Error sharing', error))
      } else {
        alert('Native sharing is not supported on this device/browser.')
      }
    },
    copyShareLink() {
      navigator.clipboard
        .writeText(this.shareLink)
        .then(() => {
          this.showCopiedMessage = true
          setTimeout(() => {
            this.showCopiedMessage = false
          }, 2000) // Hide the message after 2 seconds
        })
        .catch((err) => {
          console.error('Failed to copy link: ', err)
        })
    }
  }
}
</script>

<style scoped>
.floating-share-card {
  position: fixed;
  bottom: 120px;
  left: 50%;
  transform: translateX(-50%);
  color: black;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  padding: 25px;
  padding-left: 35px;
  padding-right: 35px;
  z-index: 1100; /* Ensure this is lower than AboutCard's z-index */
  max-width: 90vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  animation: rainbow-effect 10s linear infinite;
}

.floating-share-card * {
  pointer-events: auto;
}

@keyframes rainbow-effect {
  0% {
    background-color: hsla(0, 100%, 50%, 0.3);
    border: 2px solid hsl(0, 100%, 50%);
    box-shadow: 0 0 10px hsl(0, 100%, 50%);
  }
  16.67% {
    background-color: hsla(60, 100%, 50%, 0.3);
    border: 2px solid hsl(60, 100%, 50%);
    box-shadow: 0 0 10px hsl(60, 100%, 50%);
  }
  33.33% {
    background-color: hsla(120, 100%, 50%, 0.3);
    border: 2px solid hsl(120, 100%, 50%);
    box-shadow: 0 0 10px hsl(120, 100%, 50%);
  }
  50% {
    background-color: hsla(180, 100%, 50%, 0.3);
    border: 2px solid hsl(180, 100%, 50%);
    box-shadow: 0 0 10px hsl(180, 100%, 50%);
  }
  66.67% {
    background-color: hsla(240, 100%, 50%, 0.3);
    border: 2px solid hsl(240, 100%, 50%);
    box-shadow: 0 0 10px hsl(240, 100%, 50%);
  }
  83.33% {
    background-color: hsla(300, 100%, 50%, 0.3);
    border: 2px solid hsl(300, 100%, 50%);
    box-shadow: 0 0 10px hsl(300, 100%, 50%);
  }
  100% {
    background-color: hsla(360, 100%, 50%, 0.3);
    border: 2px solid hsl(360, 100%, 50%);
    box-shadow: 0 0 10px hsl(360, 100%, 50%);
  }
}

.share-content {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.share-content h3 {
  text-align: center;
  font-weight: 800;
  font-size: 1.5em;
  margin-bottom: 15px;
}

.social-icons {
  display: flex;
  justify-content: center;
  margin-bottom: 10px;
}

.social-icons i {
  font-size: 1.5em;
  margin: 0 10px;
  cursor: pointer;
  color: #333;
  transition: color 0.3s ease;
}

.social-icons i.fa-x-twitter:hover {
  color: #fff; /* X white */
}

.social-icons i.fa-envelope:hover {
  color: #d44638; /* Gmail red */
}

.social-icons i.fa-comment:hover {
  color: #30d158; /* iMessage green */
}

.social-icons i.fa-whatsapp:hover {
  color: #25d366; /* WhatsApp green */
}

.social-icons i.fa-facebook-messenger:hover {
  color: #0084ff; /* Facebook Messenger blue */
}

.social-icons i.fa-facebook-f:hover {
  color: #1877f2; /* Facebook blue */
}

.social-icons i.fa-share:hover {
  color: #4caf50; /* A general share green color */
}

.share-link {
  display: inline-flex;
  background-color: #222;
  color: white;
  border-radius: 4px;
  overflow: hidden;
}

.share-link-input {
  flex-grow: 1;
  padding: 8px 12px;
  border: none;
  background-color: transparent;
  color: white;
  font-size: 0.9em;
  width: calc(100% + 240px);
  min-width: 0;
}

.share-link-input:focus {
  outline: none;
  background-color: #333;
}

.copy-button {
  padding: 5px 10px;
  background-color: #333;
  border: 1px solid #555;
  border-left: none;
  border-radius: 0 4px 4px 0;
  cursor: pointer;
  color: #fff;
}

.copy-button:hover {
  background-color: #444;
}

.start-test-button {
  background-color: black;
  color: white;
  border: none;
  padding: 15px 30px;
  font-size: 1.2em;
  font-weight: bold;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 20px;
}

.start-test-button:hover {
  transform: scale(1.05);
  box-shadow: 0 0 15px rgba(255, 255, 255, 0.5);
}

.start-test-button:active {
  transform: scale(0.95);
}

.button-text {
  position: relative;
  z-index: 1;
}

.button-icon {
  font-size: 1.5em;
  margin-left: 10px;
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.start-test-button::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: conic-gradient(from 0deg, transparent, rgba(255, 255, 255, 0.3), transparent 360deg);
  animation: rotate 4s linear infinite;
}

.start-test-button::after {
  content: '';
  position: absolute;
  inset: 3px;
  background: black;
  border-radius: 48px;
  z-index: 0;
}

@keyframes rainbow {
  0% {
    filter: hue-rotate(0deg);
  }
  100% {
    filter: hue-rotate(360deg);
  }
}

.start-test-button:hover::before {
  animation:
    rotate 4s linear infinite,
    rainbow 5s linear infinite;
}

.copied-message-container {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease-out;
}

.copied-message-container.show-message {
  max-height: 50px; /* Adjust based on your message height */
}

.copied-message {
  background-color: #4caf50;
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  text-align: center;
  font-size: 0.9em;
  margin-top: 10px;
  transform: translateY(-100%);
  transition: transform 0.3s ease-out;
}

.copied-message-container.show-message .copied-message {
  transform: translateY(0);
}

/* ... rest of the styles ... */
</style>
