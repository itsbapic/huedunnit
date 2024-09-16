import './assets/tailwind.css'
import './assets/main.css'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import posthogPlugin from './plugins/posthog' //import the plugin.

const app = createApp(App)
app.use(posthogPlugin) //install the plugin
app.use(router)
app.mount('#app')
