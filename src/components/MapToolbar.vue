<script setup>
import { ref } from 'vue'
import { formatCoordinate } from '../utils/coordinate'



const props = defineProps({
  selectedPosition: {
    type: Object,
    default: null
  }
})

const emit = defineEmits([
  'refresh-events',
  'toggle-polling',
  'create-event',
  'use-selected'
])

const isCollapsed = ref(false)

const form = ref({
  uid: '',
  type: 'friendly',
  lat: '',
  lon: '',
  status: 'active',
  label: ''
})

function toggleToolbar() {
  isCollapsed.value = !isCollapsed.value
}

function handleRefresh() {
  emit('refresh-events')
}

function handleTogglePolling() {
  emit('toggle-polling')
}

function handleCreateEvent() {
  emit('create-event', {
    uid: form.value.uid,
    type: form.value.type,
    lat: Number(form.value.lat),
    lon: Number(form.value.lon),
    status: form.value.status,
    label: form.value.label
  })

  form.value = {
    uid: '',
    type: 'friendly',
    lat: '',
    lon: '',
    status: 'active',
    label: ''
  }
}

function useSelectedPosition() {
  if (!props.selectedPosition) return

  form.value.lat = formatCoordinate(props.selectedPosition.lat)
  form.value.lon = formatCoordinate(props.selectedPosition.lon)
  emit('use-selected')
}


</script>

<template>
  <div class="toolbar" :class="{ collapsed: isCollapsed }">
    <button class="toolbar-toggle" @click="toggleToolbar">
      {{ isCollapsed ? '>' : '<' }}
    </button>

    <div v-if="!isCollapsed" class="toolbar-content">
      <button @click="handleRefresh">重新抓取事件</button>
      <button @click="handleTogglePolling">切換 Polling</button>
      <button @click="useSelectedPosition">使用選點</button>
      <div style="text-align: left;" v-if="props.selectedPosition">
        lat:
        {{ formatCoordinate(props.selectedPosition.lat) }}
        <br>
        lon:
        {{ formatCoordinate(props.selectedPosition.lon) }}
      </div>

      <input v-model="form.uid" placeholder="UID" />
      <input v-model="form.label" placeholder="Label" />
      <input v-model="form.lat" placeholder="Latitude" />
      <input v-model="form.lon" placeholder="Longitude" />

      <select v-model="form.type">
        <option value="friendly">friendly</option>
        <option value="hostile">hostile</option>
        <option value="unknown">unknown</option>
      </select>

      <select v-model="form.status">
        <option value="active">active</option>
        <option value="inactive">inactive</option>
      </select>

      <button @click="handleCreateEvent">建立事件</button>
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  position: absolute;
  top: 16px;
  left: 56px;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 8px;
  min-width: 220px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.toolbar.collapsed {
  min-width: auto;
  padding: 6px;
}

.toolbar-toggle {
  margin-bottom: 8px;
}

.toolbar-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

input,
select,
button {
  width: 100%;
  box-sizing: border-box;
}
</style>