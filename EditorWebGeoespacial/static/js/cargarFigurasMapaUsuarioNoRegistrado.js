export async function cargarFigurasPublicas(map){
    const url = '/cargar_figuras_publicas/'

    const response = await fetch(url)
    const data = await response.json()

    data.figuras.forEach(fig => {
        const capa = L.geoJSON((fig.geom), {
            onEachFeature: function (feature, layer) {
                layer.on('click', function() {
                    window.mostrarDatosOffcanvas(layer)
                })
            }
        });

        capa.addTo(map);
    });
}

