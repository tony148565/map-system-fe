<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  eventData: {
    type: Object,
    default: null
  }
})

const emit = defineEmits([
  'update-event',
  'delete-event',
  'cancel-edit'
])

const form = ref({
  uid: '',
  type: 'friendly',
  lat: '',
  lon: '',
  status: 'active',
  label: ''
})

watch(
  () => props.eventData,
  (event) => {
    if (!event) return

    form.value = {
      uid: event.uid ?? '',
      type: event.type ?? 'friendly',
      lat: event.lat ?? '',
      lon: event.lon ?? '',
      status: event.status ?? 'active',
      label: event.label ?? ''
    }
  },
  { immediate: true }
)

function handleUpdate() {
  const uid = form.value.uid.trim()
  const latRaw = String(form.value.lat).trim()
  const lonRaw = String(form.value.lon).trim()

  if (!uid) {
    alert('UID is required')
    return
  }

  if (!latRaw || !lonRaw) {
    alert('Latitude and Longitude are required')
    return
  }

  const lat = Number(latRaw)
  const lon = Number(lonRaw)

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    alert('Latitude and Longitude must be valid numbers')
    return
  }

  if (lat < -90 || lat > 90) {
    alert('Latitude must be between -90 and 90')
    return
  }

  if (lon < -180 || lon > 180) {
    alert('Longitude must be between -180 and 180')
    return
  }

  emit('update-event', {
    uid: form.value.uid,
    type: form.value.type,
    lat: lat,
    lon: lon,
    status: form.value.status,
    label: form.value.label
  })
}

function handleDelete() {
  emit('delete-event', form.value.uid)
}

function handleCancel() {
  emit('cancel-edit')
}
</script>

<template>
  <div v-if="eventData" class="editor-overlay" @click.self="handleCancel">
    <div class="editor-modal">
      <div class="editor-header">
        <h3>Editing Event: {{ eventData.uid }}</h3>
        <button class="close-btn" @click="handleCancel">×</button>
      </div>

      <div class="field">
        <label>UID</label>
        <input v-model="form.uid" readonly />
      </div>

      <div class="field">
        <label>Type</label>
        <input v-model="form.type" />
      </div>

      <div class="field">
        <label>Latitude</label>
        <input v-model="form.lat" />
      </div>

      <div class="field">
        <label>Longitude</label>
        <input v-model="form.lon" />
      </div>

      <div class="field">
        <label>Status</label>
        <input v-model="form.status" />
      </div>

      <div class="field">
        <label>Label</label>
        <input v-model="form.label" />
      </div>

      <div class="actions">
        <button @click="handleUpdate">Update</button>
        <button @click="handleDelete">Delete</button>
        <button @click="handleCancel">Cancel</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.editor-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.editor-modal {
  width: 420px;
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 32px);
  overflow-y: auto;
  background: #fff;
  border-radius: 10px;
  padding: 16px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25);
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.editor-header h3 {
  margin: 0;
  font-size: 18px;
}

.close-btn {
  border: none;
  background: transparent;
  font-size: 24px;
  cursor: pointer;
  line-height: 1;
}

.field {
  margin-bottom: 10px;
}

.field label {
  display: block;
  margin-bottom: 4px;
  font-size: 14px;
}

.field input {
  width: 100%;
  box-sizing: border-box;
  padding: 6px 8px;
}

.actions {
  display: flex;
  gap: 8px;
  margin-top: 14px;
}
</style>