export async function cargarFigurasPublicas(map){

    const url = '/cargar_figuras_publicas/'
    const response = await fetch(url)
    const data = await response.json()

    data.figuras.forEach(fig => {

        const capa = L.geoJSON(fig.geom, {
            onEachFeature: function (feature, layer) {

                layer.feature = feature
                layer.feature.properties = layer.feature.properties || {}

                layer.feature.properties.tipo = "usuario"
                layer.feature.properties.categoria_id = fig.categoria_id
                layer.feature.properties.subcategoria_id = fig.subcategoria_id
                layer.feature.properties.subclasificacion_id = fig.subclasificacion_id

                layer.feature.properties.id = fig.id

                if (window.editableLayers) {
                    window.editableLayers.addLayer(layer)
                }

                layer.on('click', function() {
                    window.mostrarDatosOffcanvas(layer)
                })
            }
        })

        capa.addTo(map)
    });
}
