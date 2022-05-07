/* eslint-disable */
const locations = JSON.parse(document.getElementById('map').dataset.locations)
console.log(locations)

mapboxgl.accessToken = process.env.MAPBOX_TOKEN

var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v11'
})
