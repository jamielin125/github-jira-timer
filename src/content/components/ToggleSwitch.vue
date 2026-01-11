<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

function toggle() {
  emit('update:modelValue', !props.modelValue)
}
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="modelValue"
    class="toggle"
    :class="{ active: modelValue }"
    @click="toggle"
  >
    <span class="thumb" />
  </button>
</template>

<style scoped>
.toggle {
  position: relative;
  width: 44px;
  height: 24px;
  background: #e5e5e5;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  padding: 0;
}

.toggle.active {
  background: #34c759;
}

.thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s ease;
}

.toggle.active .thumb {
  transform: translateX(20px);
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .toggle {
    background: #39393d;
  }

  .toggle.active {
    background: #30d158;
  }
}
</style>
