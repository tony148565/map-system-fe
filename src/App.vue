<script setup>
import { onMounted, onBeforeUnmount, ref} from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { fetchEvents, createEvent } from './services/eventApi'
import MapToolbar from './components/MapToolbar.vue'
//import { formatCoordinate } from './utils/coordinate'
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
const isPolling = ref(false)
const selectedPosition = ref(null)
let selectedMarker = null
const activeEvent = ref(null)


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




// 事件渲染，遍歷"markers"中所有的點並加到map上
function renderEvents(events) {
  const nextKeys = new Set()

  events.forEach(event => {
    const key = event.uid
    nextKeys.add(key)

    if (!markers.has(key)) {
      const marker = L.marker([event.lat, event.lon], {
          icon: defaultIcon
        })
        .addTo(map)
        .bindPopup(buildPopupContent(event, 'event'))

        marker.on('click', () => {
          handleEventMarkerClick(event)
        })
      markers.set(key, marker)
    } else {
      const marker = markers.get(key)
      marker.setLatLng([event.lat, event.lon], {
        icon: defaultIcon
      })
      marker.bindPopup(buildPopupContent(event, 'event'))

      marker.on('click', () => {
          handleEventMarkerClick(event)
      })
    }
  })

  for (const [key, marker] of markers.entries()) {
    if (!nextKeys.has(key)) {
      map.removeLayer(marker)
      markers.delete(key)
    }
  }
}

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

// 接從MapToolbar來的data
async function handleCreateEvent(eventData) {
  try {
    await createEvent(eventData)

    if (eventData.source === 'selected') {
      clearSelectedMarker()
      selectedPosition.value = null
    }

    await refreshEvents()
  } catch (error) {
    console.error('Error creating event:', error)
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

// 如果有舊的SelectedMarker，清除
function clearSelectedMarker() {
  if (selectedMarker) {
    map.removeLayer(selectedMarker)
    selectedMarker = null
  }
}

// 渲染selectedmarker，position來自map中的clickEvent
function renderSelectedMarker(pos) {
  clearSelectedMarker()

  selectedMarker = L.marker([pos.lat, pos.lon], {
    icon: selectedIcon
  }).addTo(map).bindPopup(buildPopupContent(pos, 'selected'))
  selectedMarker.on('click', () => {
    handleEventMarkerClick(event)
  })

}


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
})


function handleEventMarkerClick(event) {
  console.log('[EVENT_CLICK]', event.uid)
  activeEvent.value = { ...event }
}


function handleUpdateEvent(event){
  console.log('[EVENT_CLICK] update', event.uid)
  // TODO: call update API and refresh markers
}

function handleDeleteEvent(uid){
  console.log('[EVENT_CLICK] delete', uid)
  // TODO: call update API and refresh markers
}
/*
Interaction rules:
1. Map click -> update selectedPosition
2. Use selected -> copy selectedPosition into form
3. Create event -> call API and refresh markers
4. If source is selected -> clear selectedPosition
*/
</script>

<template>
  <div class="map-wrapper">
    <MapToolbar
      :active-event="activeEvent"
      :is-polling="isPolling"
      @refresh-events="refreshEvents"
      @toggle-polling="togglePolling"
      @create-event="handleCreateEvent"
      @update-event="handleUpdateEvent"
      @delete-event="handleDeleteEvent"
    />
    <div id="map"></div>
    <div class="debug-panel">
    <div><strong>Debug</strong></div>
    <div>selectedPosition: {{ selectedPosition ? `${selectedPosition.lat}, ${selectedPosition.lon}` : 'null' }}</div>
    <div>selectedMarker: {{ !!selectedMarker }}</div>
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