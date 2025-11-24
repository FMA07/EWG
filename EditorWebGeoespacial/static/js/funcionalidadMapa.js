//Esta función inicializa el mapa
export function inicializacionMapa() {
    const calles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });
    const satelite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: 'Tiles © Esri'
    });
    const relieve = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenTopoMap contributors'
    })

    const defaultLat = -33.03853;
    const defaultLng = -71.60666;
    const defaultZoom = 14;
    var southWest = L.latLng(-33.367279, -71.78279122251949);
    var northEast = L.latLng(-32.979154, -71.331662);
    var limitesMapa = L.latLngBounds(southWest, northEast);

    let latGuardada = localStorage.getItem('mapCenterLat');
    let lngGuardada = localStorage.getItem('mapCenterLng');
    let zoomGuardado = localStorage.getItem('mapZoom');

    const latInicial = latGuardada ? parseFloat(latGuardada) : defaultLat;
    const lngInicial = lngGuardada ? parseFloat(lngGuardada) : defaultLng;
    const zoomInicial = zoomGuardado ? parseInt(zoomGuardado) : defaultZoom;

    const map = L.map('map', {pmIgnore: false}).setView([latInicial, lngInicial], zoomInicial);
    calles.addTo(map);
    map.setMaxBounds(limitesMapa);

    return {map, calles, satelite, relieve}
}

//FUNCION PARA GUARDAR LA VISTA ACTUAL EN LOCALSTORGAGE
export function mantenerVista(map) {
    function guardarVista(){
        localStorage.setItem('mapCenterLat', map.getCenter().lat);
        localStorage.setItem('mapCenterLng', map.getCenter().lng);
        localStorage.setItem('mapZoom', map.getZoom());
    }

    map.on('moveend', guardarVista);
}
//ESTE SCRIPT PERMITE SELECCIONAR EL TILESET DEL MAPA
export function tilesetsMapa(map, calles, satelite, relieve) {
    
    let currentLayer = calles;
        
    function cambiarMapa(layer){
        if (currentLayer) map.removeLayer(currentLayer);
        layer.addTo(map);
        currentLayer = layer;
    }
    //listeners para las distintas opciones del menú de mapas
    document.getElementById('mapaSatelital')?.addEventListener('click', function(e){
        e.preventDefault();
        cambiarMapa(satelite);
    });
    document.getElementById('mapaCalles')?.addEventListener('click', function(e){
        e.preventDefault();
        cambiarMapa(calles);
    });
    document.getElementById('mapaRelieve')?.addEventListener('click', function(e){
        e.preventDefault();
        cambiarMapa(relieve);
    });
}

