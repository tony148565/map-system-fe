<script setup>
import { onMounted, onBeforeUnmount, ref} from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { fetchEvents, createEvent } from './services/eventApi'
import MapToolbar from './components/MapToolbar.vue'
import { formatCoordinate } from './utils/coordinate'
delete L.Icon.Default.prototype._getIconUrl

L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href
})

// 變數
let map = null
let markers = []
let pollingTimer = null
let isPolling = true
const selectedPosition = ref(null)
let selectedMarker = null
const shouldConsumeSelectedPosition = ref(false)

// 點位資訊
function buildPopupContent(event) {  
  return `
    <div>
      <div><strong>${event.label}</strong></div>
      <div>UID: ${event.uid}</div>
      <div>Type: ${event.type}</div>
      <div>Status: ${event.status}</div>
      <div>Lat: ${event.lat}</div>
      <div>Lon: ${event.lon}</div>
    </div>
  `
}


// 清除"舊"標記
function clearMarkers() {
  markers.forEach(marker => map.removeLayer(marker))
  markers = []
}

// 事件渲染，遍歷"markers"中所有的點並加到map上
function renderEvents(events) {
  clearMarkers()

  events.forEach(event => {
    const marker = L.marker([event.lat, event.lon])
      .addTo(map)
      .bindPopup(buildPopupContent(event))

    markers.push(marker)
  })
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

    if (shouldConsumeSelectedPosition.value) {
      clearSelectedMarker()
      selectedPosition.value = null
      shouldConsumeSelectedPosition.value = false
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

  isPolling = true
}

function stopPolling() {
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }

  isPolling = false
}

function togglePolling() {
  if (isPolling) {
    stopPolling()
  } else {
    startPolling()
  }
}


// ===============================
// Feature: Map Click Selection
// ===============================
// 功能：使用者可透過點擊地圖選定事件位置
//
// State:
// - selectedPosition: 當前選取的經緯度
// - selectedMarker: 地圖上的暫時選點 marker
//
// Rules:
// 1. 同時間只允許一個 selectedMarker
// 2. 點擊新位置會替換舊的 selectedMarker
// 3. selectedMarker 不屬於正式 events（不進 renderEvents）
// 4. createEvent 時會使用 selectedPosition
// 5. 建立成功後需清除 selectedMarker（或重置）
//
// Trigger:
// - map.on('click') → 更新 selectedPosition / selectedMarker
// - toolbar "create" → 使用 selectedPosition 呼叫 createEvent
// ===============================

// Selected Marker Lifecycle
// 1. click map → 建立 selectedMarker
// 2. selectedMarker 作為 createEvent 的座標來源（可選）
// 3. 若 createEvent 使用 selectedPosition → 清除 selectedMarker
// 4. 若 createEvent 未使用 selectedPosition → 保留 selectedMarker

// 如果有舊的SelectedMarker，清除
function clearSelectedMarker() {
  if (selectedMarker) {
    map.removeLayer(selectedMarker)
    selectedMarker = null
  }
}

// 渲染selectedmarker，position來自map中的clickEvent
function renderSelectedMarker(position) {
  clearSelectedMarker()

  selectedMarker = L.marker([position.lat, position.lon])
    .addTo(map)
    .bindPopup(`
      <div>
        <div><strong>Selected Position</strong></div>
        <div>Lat: ${formatCoordinate(position.lat)}</div>
        <div>Lon: ${formatCoordinate(position.lon)}</div>
      </div>
    `)
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
    shouldConsumeSelectedPosition.value = false

  })
  
  await refreshEvents()
  startPolling()
})

onBeforeUnmount(() => {
  stopPolling()
})

function handleUseSelectedPosition() {
  if (!selectedPosition.value) return


  // 這裡才設 flag
  shouldConsumeSelectedPosition.value = true
}

</script>

<template>
  <div class="map-wrapper">
    <MapToolbar
      :selected-position="selectedPosition"
      @use-selected="handleUseSelectedPosition"
      @create-event="handleCreateEvent"
    />
    <div id="map"></div>
    
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
</style>