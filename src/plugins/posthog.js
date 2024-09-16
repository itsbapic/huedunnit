import posthog from 'posthog-js'

export default {
  install(app) {
    app.config.globalProperties.$posthog = posthog.init(process.env.VITE_POSTHOG_API_KEY, {
      api_host: process.env.VITE_POSTHOG_HOST
    })
  }
}
