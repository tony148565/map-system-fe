<script setup>
import { ref, watch } from 'vue'
import { formatCoordinate } from '../utils/coordinate'



const props = defineProps({
  selectedPosition: {
    type: Object,
    default: null
  },
  pendingPosition: {
    type: Object,
    default: null
  },
  isPolling: {
    type: Boolean,
    default: false
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

watch(
  () => props.pendingPosition,
  (pos) => {
    if (!pos) return

    resetForm()
    form.value.lat = formatCoordinate(pos.lat)
    form.value.lon = formatCoordinate(pos.lon)
  }
)



function toggleToolbar() {
  isCollapsed.value = !isCollapsed.value
}

function handleRefresh() {
  emit('refresh-events')
}

function handleTogglePolling() {
  console.log('[TOOLBAR_EMIT_TOGGLE_POLLING]')
  emit('toggle-polling')
}

function handleCreateEvent() {
  const payload = {
    uid: form.value.uid,
    type: form.value.type,
    lat: Number(form.value.lat),
    lon: Number(form.value.lon),
    status: form.value.status,
    label: form.value.label,
    source: props.pendingPosition ? 'selected' : 'manual'
  }

  emit('create-event', payload)
  resetForm()
}

function useSelectedPosition() {
  if (!props.selectedPosition) return
  emit('use-selected')
}

function resetForm() {
  form.value = {
    uid: '',
    type: 'friendly',
    lat: '',
    lon: '',
    status: 'active',
    label: ''
  }
}
</script>

<template>
  <div class="toolbar" :class="{ collapsed: isCollapsed }">
    <button class="toolbar-toggle" @click="toggleToolbar">
      {{ isCollapsed ? '>' : '<' }}
    </button>

    <div v-if="!isCollapsed" class="toolbar-content">
      <button @click="handleRefresh">重新抓取事件</button>
      <button @click="handleTogglePolling">
        {{ props.isPolling ? '停止輪詢' : '開始輪詢' }}
      </button>
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