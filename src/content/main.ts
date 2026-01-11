import { createApp } from 'vue'
import App from './App.vue'

// Create a container for the Vue app
const container = document.createElement('div')
container.id = 'jira-time-logger-root'
document.body.appendChild(container)

createApp(App).mount(container)
