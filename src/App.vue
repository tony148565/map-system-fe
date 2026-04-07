<script setup>
import { onMounted, onBeforeUnmount, ref, watch} from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { fetchEvents, createEvent, updateEvent, deleteEvent } from './services/eventApi'
import MapToolbar from './components/MapToolbar.vue'
import EventEditor from './components/EventEditor.vue'
import { buildPopupContent } from './utils/popup'
delete L.Icon.Default.prototype._getIconUrl

L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href
})

// 變數
let map = null
let markers = new Map()
let pollingTimer = null
let selectedMarker = null
let pendingMarker = null


const isPolling = ref(false)
// selectedPosition: 使用者最後點擊的地圖位置（橘色 marker）
// pendingPosition: 使用者按「使用選點」後凍結的位置（綠色 marker）
// inspectedEvent: 使用者點擊 marker 後，目前查看的 event
// editingEvent: 使用者進入編輯模式的 event
const selectedPosition = ref(null)
const pendingPosition = ref(null)
const inspectedEvent = ref(null)
const editingEvent = ref(null)
const createSuccessVersion = ref(0)

// marker icon
const defaultIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
})

const selectedIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
})

const pendingIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
})


watch(editingEvent, (value) => {
  document.body.style.overflow = value ? 'hidden' : ''
})

// about map update
// 事件更新
function updateEvents(newEvents) {
  renderEvents(newEvents)
}

// 新增點位後
async function refreshEvents() {
  try {
    const newEvents = await fetchEvents()
    updateEvents(newEvents)
  } catch (error) {
    console.error('Error fetching events:', error)
  }
}

function startPolling() {
  if (pollingTimer) return

  pollingTimer = setInterval(() => {
    refreshEvents()
  }, 5000)

  isPolling.value = true
  console.log('[POLLING_START]')
}

function stopPolling() {
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }

  isPolling.value = false
  console.log('[POLLING_STOP]')
}

function togglePolling() {
  console.log('[TOGGLE_POLLING_BEFORE]', isPolling.value, pollingTimer)

  if (isPolling.value) {
    stopPolling()
  } else {
    startPolling()
  }

  console.log('[TOGGLE_POLLING_AFTER]', isPolling.value, pollingTimer)
}

// clear method
// 如果有舊的SelectedMarker，清除
function clearSelectedMarker() {
  if (selectedMarker) {
    map.removeLayer(selectedMarker)
    selectedMarker = null
  }
}

function clearPendingMarker() {
  if (pendingMarker) {
    map.removeLayer(pendingMarker)
    pendingMarker = null
  }
}

// render method

// 事件渲染，遍歷"markers"中所有的點並加到map上
function renderEvents(events) {
  const nextKeys = new Set()

  events.forEach(event => {
    const key = event.uid
    nextKeys.add(key)

    if (!markers.has(key)) {
      const marker = L.marker([event.lat, event.lon])
        .setIcon(defaultIcon)
        .addTo(map)

      marker._eventData = event
      marker.bindPopup(buildPopupContent(event, 'event'))

      marker.on('click', () => {
        handleEventMarkerClick(marker._eventData)
      })

      bindPopupActions(marker)
      markers.set(key, marker)
    } else {
      const marker = markers.get(key)

      marker._eventData = event
      marker.setLatLng([event.lat, event.lon]).setIcon(defaultIcon)
      marker.bindPopup(buildPopupContent(event, 'event'))

      bindPopupActions(marker)
    }
  })

  for (const [key, marker] of markers.entries()) {
    if (!nextKeys.has(key)) {
      map.removeLayer(marker)
      markers.delete(key)

      if (editingEvent.value?.uid === key) {
        editingEvent.value = null
      }

      if (inspectedEvent.value?.uid === key) {
        inspectedEvent.value = null
      }
    }
  }
}

// 渲染selectedmarker，position來自map中的clickEvent
function renderSelectedMarker(pos) {
  clearSelectedMarker()

  selectedMarker = L.marker([pos.lat, pos.lon])
  .setIcon(selectedIcon)
  .addTo(map)
  .bindPopup(buildPopupContent(pos, 'selected'))

}

function renderPendingMarker(pos) {
  if (!pos) return

  if (!pendingMarker) {
    pendingMarker = L.marker([pos.lat, pos.lon])
      .setIcon(pendingIcon)
      .addTo(map)
      .bindPopup(buildPopupContent(pos, 'selected'))
  } else {
    pendingMarker
      .setLatLng([pos.lat, pos.lon])
      .setIcon(pendingIcon)
      .bindPopup(buildPopupContent(pos, 'selected'))
  }
}

//
onMounted(async () => {
  map = L.map('map').setView([24.1477, 120.6736], 13)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map)

  map.on('click', (e) => {
      selectedPosition.value = {
      lat: e.latlng.lat,
      lon: e.latlng.lng
    }
    renderSelectedMarker(selectedPosition.value)
    

  })
  
  await refreshEvents()
})

onBeforeUnmount(() => {
  stopPolling()
  clearSelectedMarker()
  clearPendingMarker()
  document.body.style.overflow = ''
})


// handle method

// 接從MapToolbar來的data
async function handleCreateEvent(eventData) {
  try {
    await createEvent(eventData)

    pendingPosition.value = null
    clearPendingMarker()

    if (eventData.source === 'selected') {
      clearSelectedMarker()
      selectedPosition.value = null
    }
    createSuccessVersion.value++
    await refreshEvents()
  } catch (error) {
    if (error.status === 400 || error.status === 409) {
      alert(error.data?.error || 'Invalid input')
    } else {
      alert('Create failed')
    }
  }
}

function handleEventMarkerClick(event) {
  console.log('[EVENT_CLICK]', event.uid)
  inspectedEvent.value = { ...event }
}

function handleEnterEditMode(event) {
  editingEvent.value = { ...event }
}

function handleCancelEdit() {
  editingEvent.value = null
}

function handleUseSelectedPosition() {
  if (!selectedPosition.value) return

  pendingPosition.value = { ...selectedPosition.value }
  renderPendingMarker(pendingPosition.value)
}

async function handleUpdateEditingEvent(updatedData) {
  try {
    await updateEvent(updatedData.uid, updatedData)

    if (editingEvent.value?.uid === updatedData.uid) {
      editingEvent.value = null
    }

    if (inspectedEvent.value?.uid === updatedData.uid) {
      inspectedEvent.value = { ...updatedData }
    }

    await refreshEvents()
  } catch (error) {
    if (error.status === 400) {
      alert(error.data?.error || 'Invalid input')
    } else {
      alert('Update failed')
    }
  }
}

async function handleDeleteEditingEvent(uid) {
  try {
    await deleteEvent(uid)

    if (editingEvent.value?.uid === uid) {
      editingEvent.value = null
    }

    if (inspectedEvent.value?.uid === uid) {
      inspectedEvent.value = null
    }

    await refreshEvents()
  } catch (error) {
    alert('Delete failed')
  }
}
/*
Interaction rules:
1. Map click -> update selectedPosition
2. Use selected -> copy selectedPosition into form
3. Create event -> call API and refresh markers
4. If source is selected -> clear selectedPosition
*/
// binding method
function bindPopupActions(marker) {
  marker.off('popupopen')

  marker.on('popupopen', (e) => {
    const container = e.popup.getElement()
    if (!container) return

    const eventData = marker._eventData
    const editBtn = container.querySelector('.popup-edit-btn')
    const deleteBtn = container.querySelector('.popup-delete-btn')

    if (editBtn) {
      editBtn.onclick = () => {
        handleEnterEditMode(eventData)
      }
    }

    if (deleteBtn) {
      deleteBtn.onclick = async () => {
        if (!confirm('Delete this event?')) return
        await handleDeleteEditingEvent(eventData.uid)
      }
    }
  })
}


</script>

<template>
  <div class="map-wrapper">
    <MapToolbar
      :selected-position="selectedPosition"
      :pending-position="pendingPosition"
      :is-polling="isPolling"
      :create-success-version="createSuccessVersion"
      @use-selected="handleUseSelectedPosition"
      @refresh-events="refreshEvents"
      @toggle-polling="togglePolling"
      @create-event="handleCreateEvent"
    />
    <EventEditor
      v-if="editingEvent"
      :event-data="editingEvent"
      @update-event="handleUpdateEditingEvent"
      @delete-event="handleDeleteEditingEvent"
      @cancel-edit="handleCancelEdit"
    />
    <div id="map"></div>
    <div class="debug-panel">
    <div><strong>Debug</strong></div>
    <div>inspectedEvent: {{ inspectedEvent ? inspectedEvent.uid : 'null' }}</div>
    <div>editingEvent: {{ editingEvent ? editingEvent.uid : 'null' }}</div>
    <div>markerCount: {{ markers.size }}</div>
    <div>polling: {{ isPolling ? 'on' : 'off' }}</div>
  </div>
  </div>
</template>

<style>
html,
body,
#app,
.map-wrapper,
#map {
  margin: 0;
  width: 100%;
  height: 100%;
}

.map-wrapper {
  position: relative;
}
.debug-panel {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 2000;
  background: rgba(0, 0, 0, 0.75);
  color: white;
  padding: 12px;
  border-radius: 8px;
  font-size: 12px;
  line-height: 1.5;
}
</style>