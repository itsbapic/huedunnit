import posthog from 'posthog-js'

const POSTHOG_API_KEY = import.meta.env.VITE_POSTHOG_API_KEY
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST

console.log('PostHog API Key:', POSTHOG_API_KEY.substring(0, 8) + '...')
console.log('PostHog Host:', POSTHOG_HOST.substring(0, 8) + '...')

export default {
  install(app) {
    if (!POSTHOG_API_KEY) {
      console.error('PostHog API key is missing')
      return
    }

    const posthogInstance = posthog.init(POSTHOG_API_KEY, {
      api_host: POSTHOG_HOST,
      debug: true // Enable debug mode
    })

    app.config.globalProperties.$posthog = posthogInstance

    console.log('PostHog initialized:', posthogInstance)
  }
}
