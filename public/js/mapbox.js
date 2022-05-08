/* eslint-disable */

export const displayMap = (locations) => {
  // mapboxgl.accessToken = process.env.MAPBOX_TOKEN
  mapboxgl.accessToken =
    'pk.eyJ1Ijoic2VhbnRva3V6byIsImEiOiJjbDJ2ZHdrMGYwNDduM2NxdTdkcTd2OGFpIn0.vvHzOrFuK5dtnDUmhVg4ZA'

  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/seantokuzo/cl2wbke1r002u15ld38m81ies',
    scrollZoom: false
    // center: locations[0].coordinates,
    // zoom: 6
    // interactive: false
  })

  const bounds = new mapboxgl.LngLatBounds()

  locations.forEach((loc) => {
    // Create the marker
    const el = document.createElement('div')
    el.className = 'marker'

    // Add the marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom'
    })
      .setLngLat(loc.coordinates)
      .addTo(map)

    // Add popup
    new mapboxgl.Popup({
      offset: 30
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map)

    // Extend map bounds to include the current location
    bounds.extend(loc.coordinates)
  })

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100
    }
  })
}
