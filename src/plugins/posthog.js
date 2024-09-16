import posthog from 'posthog-js'

const POSTHOG_API_KEY = import.meta.env.VITE_POSTHOG_API_KEY
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST

export default {
  install(app) {
    app.config.globalProperties.$posthog = posthog.init(POSTHOG_API_KEY, {
      api_host: POSTHOG_HOST
    })
  }
}
