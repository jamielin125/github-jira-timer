<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSettings } from '@/composables/useStorage'

const { settings, loading, load, save } = useSettings()
const message = ref('')
const messageType = ref<'success' | 'error'>('success')

onMounted(() => {
  load()
})

async function handleSave() {
  if (!settings.value.jiraDomain || !settings.value.email || !settings.value.apiToken) {
    message.value = '請填寫所有必填欄位'
    messageType.value = 'error'
    return
  }

  // Validate regex
  try {
    new RegExp(settings.value.jiraKeyRegex)
  } catch {
    message.value = '無效的正則表達式'
    messageType.value = 'error'
    return
  }

  await save(settings.value)
  message.value = '設定已儲存'
  messageType.value = 'success'

  setTimeout(() => {
    message.value = ''
  }, 2000)
}
</script>

<template>
  <div class="popup">
    <h1>Jira Time Logger</h1>

    <div v-if="loading" class="loading">載入中...</div>

    <form v-else @submit.prevent="handleSave">
      <div class="field">
        <label for="jiraDomain">Jira 網域</label>
        <input
          id="jiraDomain"
          v-model="settings.jiraDomain"
          type="url"
          placeholder="https://your-domain.atlassian.net"
        />
      </div>

      <div class="field">
        <label for="email">Email</label>
        <input
          id="email"
          v-model="settings.email"
          type="email"
          placeholder="your-email@example.com"
        />
      </div>

      <div class="field">
        <label for="apiToken">API Token</label>
        <input
          id="apiToken"
          v-model="settings.apiToken"
          type="password"
          placeholder="Your Jira API token"
        />
      </div>

      <div class="field">
        <label for="jiraKeyRegex">Jira Key Regex</label>
        <input
          id="jiraKeyRegex"
          v-model="settings.jiraKeyRegex"
          type="text"
          placeholder="[A-Z]+-\d+"
        />
      </div>

      <button type="submit">儲存設定</button>

      <p v-if="message" :class="['message', messageType]">
        {{ message }}
      </p>
    </form>
  </div>
</template>

<style scoped>
.popup {
  width: 320px;
  padding: 16px;
  font-family: system-ui, -apple-system, sans-serif;
}

h1 {
  font-size: 16px;
  margin: 0 0 16px;
  color: #333;
}

.loading {
  text-align: center;
  color: #666;
}

.field {
  margin-bottom: 12px;
}

label {
  display: block;
  font-size: 12px;
  color: #555;
  margin-bottom: 4px;
}

input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
  box-sizing: border-box;
}

input:focus {
  outline: none;
  border-color: #0052cc;
}

button {
  width: 100%;
  padding: 10px;
  background: #0052cc;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}

button:hover {
  background: #0047b3;
}

.message {
  margin-top: 12px;
  padding: 8px;
  border-radius: 4px;
  font-size: 12px;
  text-align: center;
}

.message.success {
  background: #e3fcef;
  color: #006644;
}

.message.error {
  background: #ffebe6;
  color: #de350b;
}

@media (prefers-color-scheme: dark) {
  .popup {
    background: #1e1e1e;
  }

  h1 {
    color: #e0e0e0;
  }

  label {
    color: #b0b0b0;
  }

  input {
    background: #2d2d2d;
    border-color: #444;
    color: #e0e0e0;
  }

  input:focus {
    border-color: #4c9aff;
  }
}
</style>
