import { generarInputPorTipo, mostrarDatosOffcanvas } from "./formularios.js"

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

export function iniciarImportacionCapa () {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.zip'

    input.onchange = async(event) => {
        const file = event.target.files[0]
        if(!file) return

        const nombreLimpio = file.name.replace(/\.[^/.]+$/, "")
        const formData = new FormData()
        formData.append('file', file)

        try {
            const resp = await fetch('/importar_SHP/',{
                method: "POST",
                body: formData
            });

            const data = await resp.json()

            if (!data.success) {
                alert(data.error || "Error al importar la capa")
                return
            }

            alert(`Capa "${nombreLimpio}" importada correctamente`)

            if (typeof agregarCapaALista === 'function') {
                await agregarCapaALista(nombreLimpio, data.capa_id)
            }

            if (typeof cargarCapas === 'function') {
                await cargarCapas(window.map)
            }
        } catch (error) {
            console.error("Error importando capa: ", error)
            alert("Ocurrió un error al importar el shapefile")
        }
    }

    input.click()
}

export function exportarCapas () {
    const botonExportar = document.getElementById('botonExportarCapa');

    if(botonExportar) {
        botonExportar.addEventListener('click', (e) => {
            e.preventDefault()

            const geojson = window.editableLayers.toGeoJSON()

            if (!geojson || geojson.features.length === 0) {
                alert('No hay figuras para exportar')
                return
            }

            const nombreSugerido = 'capa_completa_' + new Date().toISOString().slice(0, 10);
            const nombreArchivo = prompt("Ingresa el nombre del archivo (sin extensión .zip):", nombreSugerido);

            if (nombreArchivo === null) return

            if (nombreArchivo.trim() === '') {
                alert('Exportación cancelada: El archivo debe contener un nombre')
                return;
            }

            const tiposGeometria = new Set();

            geojson.features.forEach(feature => {
                if (feature.geometry && feature.geometry.type) {
                    tiposGeometria.add(feature.geometry.type)
                }
            })

            if (tiposGeometria.size > 1) {
                alert('Error de exportación, la capa contiene más de un tipo de geometría ('+ Array.from(tiposGeometria).join(', ')+'). El formato Shapefile solo soporta un tipo de geometría por archivo')
                return;
            }

            const capaAExportar = geojson

            fetch('/exportar_SHP/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify({
                    geojson: capaAExportar,
                    filename: nombreArchivo
                })
            })
            .then(response => {
                if (response.ok) {
                    return response.blob()
                } else {
                    return response.json().then(errorData => {
                        throw new Error(errorData.error || 'Error desconocido en la exportación')
                    })
                }
            })
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a')
                a.style.display = 'none'
                a.href = url
                a.download = `${nombreArchivo}.zip`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url)
                alert(`Exportación completada. Descargando ${nombreArchivo}.zip`)
            })
            .catch(error => {
                console.error('Error durante la exportación: ', error);
                alert(`Fallo en la exportación: ${error.message}`)
            })
        })
    }
}

export function cargarCapas(map) {
    return new Promise(async resolve => {
        try {
            const res = await fetch("/capas_del_proyecto/");
            const data = await res.json();

            if (!data.capas) {
                console.warn('No hay capas importadas')
                return resolve();
            }

            const listaCapasImportadas = document.getElementById('listaCapasImportadas');
            if (listaCapasImportadas) {
                listaCapasImportadas.innerHTML = "";
            }

            data.capas.forEach(capa => {

                if (capa.tipo === 'usuario') {
                    dibujarFigurasUsuario(capa.features)
                    return
                }

                agregarCapaALista(capa.nombre, capa.capa_id)
                const geojson = {
                    type: "FeatureCollection",
                    features: capa.features
                }
                const capaLeaflet = L.geoJSON(geojson, {
                    onEachFeature: function (feature, layer) {
                        
                        layer.feature = feature
                        layer.feature.properties = layer.feature.properties || {}
                        layer.feature.properties.__origenCapa = capa.nombre
                        layer.feature.properties.id = feature.feature_id
                        layer.feature.properties.tipo = feature.tipo

                        if (window.editableLayers) {
                            window.editableLayers.addLayer(layer)
                        }

                        if (typeof attachEditListeners === "function") {
                            attachEditListeners(layer)
                        }

                        if (typeof window.mostrarDatosOffcanvas === 'function') {
                            layer.on('click', (e) => window.mostrarDatosOffcanvas(e.target))
                        }
                    }
                }).addTo(map);

                console.log("Capa dibujada desde BD: ", capa.nombre)
            })
            resolve()
        } catch (err) {
            console.error("Error cargando capas: ", err)
            resolve()
        }
    })
    
}

export function agregarCapaALista (nombreCapa, capaId) {
    const listaCapasImportadas = document.getElementById('listaCapasImportadas')
    const seccionLista = document.getElementById('seccionCapasImportadas')
    const divisorSeccion = document.getElementById('sectionDivider')

    if (!listaCapasImportadas) return;

    if (listaCapasImportadas.querySelector(`a[data-capa="${nombreCapa}"]`)) {
        return;
    }

    const divider = document.createElement('hr')
    const li = document.createElement('li')
    const a = document.createElement('a')
    const btnEliminar = document.createElement('button')

    li.className = 'lista-capas-importadas'
    li.dataset.capaId = capaId
    li.dataset.nombreCapa = nombreCapa

    a.href = '#';
    a.style.textDecoration = 'none'
    a.style.color = 'black'
    a.style.fontWeight = 'bold'
    a.textContent = nombreCapa
    a.addEventListener('click', (e) => {
        e.preventDefault()
        if (typeof alternarVisibilidadCapa === 'function') {
            alternarVisibilidadCapa(nombreCapa, e.currentTarget)
        }
    })

    btnEliminar.className = 'btn-eliminar-capa-imp'
    btnEliminar.value = '{{  }}'
    btnEliminar.addEventListener('click', (e) => {
        e.stopPropagation()
        e.preventDefault()

        eliminarCapaImportada(nombreCapa, capaId)
    })

    li.appendChild(a)
    li.appendChild(btnEliminar)
    listaCapasImportadas.appendChild(li)
    listaCapasImportadas.appendChild(divider)

    seccionLista.style.display = 'block'
    divisorSeccion.style.display = 'block'
}

export function alternarVisibilidadCapa(nombreCapa, elementoLista) {
    const esVisible = window.capasVisibles[nombreCapa] !== false;

    window.editableLayers.eachLayer(function(layer) {
        const origen = layer.feature && layer.feature.properties && layer.feature.properties.__origenCapa;

        if (origen === nombreCapa) {
            if (esVisible) {
                window.map.removeLayer(layer);
            } else {
                layer.addTo(window.map);
            }
        }
    })

    window.capasVisibles[nombreCapa] = !esVisible

    if (elementoLista) {
        if (!esVisible) {
            elementoLista.style.opacity = '1.0';
        } else {
            elementoLista.style.opacity = '0.5'; 
        }
    }
    console.log(`Visibilidad de capa ${nombreCapa} alternada a ${!esVisible ? 'VISIBLE' : 'OCULTA'}.`)
}

export function eliminarCapaImportada(nombreCapa, capaId){
    console.log("Intentando eliminar capa:", nombreCapa, "ID:", capaId);
    const lista = document.getElementById('listaCapasImportadas')
    const items = lista.querySelectorAll('li')

    if(!confirm(`¿Eliminar la capa "${nombreCapa}" de forma definitiva?`)) {
        return
    }

    //Esta parte elimina todas las figuras cuyo origenCapa sea igual al nombreCapa de la capa importada
    window.editableLayers.eachLayer(layer => {
        if (layer.feature?.properties?.__origenCapa === nombreCapa) {
            window.editableLayers.removeLayer(layer)
        }
    })

    fetch(`/eliminar_capa_importada/${capaId}/`, {
        method: "POST",
        headers: {
            'X-CSRFToken': getCookie("csrftoken")
        }
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            console.log("Capa eliminada del backend")
        } else {
            console.error('Error en el fetch', err)
        }
    })
    .catch(err => console.error("Error en el fetch: ", err))

    items.forEach(li => {
        const a = li.querySelector('a')
        if (a && a.textContent === nombreCapa) {
            li.remove()
        }
    })
    alert(`Capa "${nombreCapa}" eliminada`)
}

export function attachEditListeners(layer) {
    const figuraId = layer.feature?.properties?.id

    if (!figuraId) {
        console.warn('La figura no tiene ID en el backend')
        return
    }

    function guardar() {
        guardarCambiosFigura(layer)
    }

    layer.on("pm:edit", guardar)
    layer.on("pm:dragend", guardar)

    layer.on("click", (e) => {
        if (typeof window.mostrarDatosOffcanvas === "function") {
            window.mostrarDatosOffcanvas(e.target);
        }
    });
}

export async function guardarCambiosFigura(layer) {
    const figuraId = layer.feature?.properties?.id
    if (!figuraId) {
        console.warn("Intento de guardar figura sin Id")
        return
    }

    const geometria = layer.toGeoJSON().geometry
    const atributos = { ...layer.feature.properties }

    delete atributos.__origenCapa
    try {
        const resp = await fetch(`/editar_figura/${figuraId}/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCookie("csrftoken"),
            },

            body: JSON.stringify({
                geometry: geometria,
                atributos: atributos,
            })
        });

        let data = {};
        try {
            data = await resp.json(); 
        } catch (e) {
            console.error("La respuesta no es JSON válido (posible error 404):", e);
        }

        if (!resp.ok) {
            console.error('Error HTTP guardando figura: ', data.error)
        } else {
            console.log(`Figura ${figuraId} guardada correctamente.`)
        }
    } catch (err) {
        console.error("Error inesperado guardando figura:", err)
    }
}

export function crearFigura() { //Llamada por activarModoDibujo()
    map.on("pm:create", async (e) => {

        const layer = e.layer
        const sub = window.subclasSeleccionada;

        if (!window.subclasSeleccionada) {
            alert("Selecciona una subclasificación antes de dibujar");
            e.layer.remove();
            return;
        }

        map.pm.disableDraw();
        editableLayers.addLayer(layer);

        if (!layer.feature) {
            layer.feature = {
                type: "Feature",
                properties: {}
            }
        }
        layer.feature.properties.tipo = "usuario";
        layer.feature.properties.subclasificacion_id = parseInt(sub.id);
        layer.feature.properties.subcategoria_id = sub.subcategoria_id ? parseInt(sub.subcategoria_id) : null;
        layer.feature.properties.categoria_id = parseInt(sub.categoria_id);
        try {
            layer.toGeoJSON()
        } catch (error) {
            console.error("Error al obtener el GeoJSON:", error);
            layer.remove()
            return
        }


        attachEditListeners(layer);
        asignarDatosFigura(layer);
        layer.on('click', () => {
            mostrarDatosOffcanvas(layer)
        })
    });
}

export function eliminarFigura() {
    map.off("pm:remove")
    map.on("pm:remove", function (e) {
        const capa = e.layer

        if (!capa.feature || !capa.feature.properties) return;

        const figuraId = capa.feature.properties.id

        if (!figuraId) {
            console.warn('Figura eliminada localmente, pero sin id de BD')
            return
        }

        fetch(`/eliminar_figura/${figuraId}/`, {
            method: "POST",
            headers: {
            "X-CSRFToken": getCookie("csrftoken"),
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log(`Figura ${figuraId} eliminada correctamente del backend`)
            } else {
                console.error("Error eliminando figura:", data.error);
            }
        })
        .catch(err => console.error("Error en fetch eliminar figura:", err))
    })
}

//Para asignar datos a la figura creada
export function asignarDatosFigura(layer){
    if (!window.subclasSeleccionada){
        alert('Seleccione una subclasificación antes de crear una figura');
        layer.remove();
        return;
    }

    const sub = window.subclasSeleccionada;
    const offcanvasElement = document.getElementById('seccionTablas');
    const offcanvasBody = document.getElementById('cuerpoTablas');

    offcanvasBody.innerHTML = '';

    if (sub.campos && sub.campos.length > 0) {

        const form = document.createElement('form');
        form.id = 'atributosFiguraForm';

        sub.campos.forEach(campo => {
            const group = document.createElement('div');
            group.className = 'mb-3';

            const label = document.createElement('label');
            label.innerHTML = `<strong>${campo.nombre}</strong>`;
            group.appendChild(label);

            const html = generarInputPorTipo(campo);
            group.insertAdjacentHTML("beforeend", html);

            form.appendChild(group);
        });

        const btnGuardar = document.createElement('button');
        btnGuardar.type = 'submit';
        btnGuardar.textContent = 'Guardar figura';
        btnGuardar.className = 'btn btn-primary';

        btnGuardar.addEventListener('click', (event) => {
            event.preventDefault(); 

            const datos = {};
            form.querySelectorAll('input').forEach(input => {
                datos[input.name] = input.value;
            });

            for (let campo of sub.campos) {
                const valor = datos[campo.nombre]

                if (campo.tipo === "numero") {
                    if (valor.trim() === "") {
                        alert(`El campo "${campo.nombre}" es obligatorio y debe ser un número.`);
                        return;
                    }

                    if (!/^-?\d+(\.\d+)?$/.test(valor)) {
                        alert(`El campo "${campo.nombre}" debe contener solo números.`);
                        return;
                    }
                }

                if (campo.tipo === "fecha") {
                    const fechaOk = !isNaN(Date.parse(valor));
                    if (!fechaOk) {
                        alert(`El campo "${campo.nombre}" debe ser una fecha válida.`);
                        return;
                    }
                }

                if (campo.tipo === "booleano") {
                    if (!["true", "false"].includes(valor)) {
                        alert(`El campo "${campo.nombre}" debe ser Sí o No.`);
                        return;
                    }
                }
            }

            console.log('Layer recibido:', layer);
            console.log('Tiene toGeoJSON?:', typeof layer.toGeoJSON);

            const figuraData = {
                subclasificacion_id: sub.id,
                atributos: datos,
                geometria: layer.toGeoJSON().geometry,
            };

            console.log('Figura lista para guardar: ', figuraData);

            //Estas dos líneas permiten actualizar la capa para que la figura muestre los atributos asignados
            layer.feature = layer.feature || {type: 'Feature', properties: {}};
            layer.feature.properties = Object.assign({}, layer.feature.properties, datos);

            fetch('/guardar_figura/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie("csrftoken"),
                },
                body: JSON.stringify(figuraData),
            })
            .then(res => res.json())
            .then(data => {
                console.log('Guardado: ', data);
                if (data.success) {
                    if (data.id){
                        layer.feature.properties.id = data.id;
                    }
                    alert('Figura guardada correctamente');
                    const offcanvas = bootstrap.Offcanvas.getInstance(offcanvasElement);
                    offcanvas?.hide(); 
                } else {
                    console.error('Error guardando la figura: ', data.error)
                }
            })
            .catch(err => console.error('Error guardando figura: ', err));
        });

        form.appendChild(btnGuardar);
        offcanvasBody.appendChild(form);

        let offcanvas = bootstrap.Offcanvas.getInstance(offcanvasElement);
        if (!offcanvas){
            offcanvas = new bootstrap.Offcanvas(offcanvasElement);
        }
        offcanvas.show();

    } else {
        const offcanvas = new bootstrap.Offcanvas(offcanvasElement);
        offcanvas.show();
    }
}

//Cuando seleccionas una subclasificación para dibujar, se ejecuta esta función.
export async function activarMododibujo(subclasId) {
    try {
        const response = await fetch(`/obtener_config_subclasificacion/${subclasId}/`);
        const data = await response.json();

        console.log("Respuesta subclasificación:", data);

        if (!data || data.success === false) {
            alert('Error cargando subclasificación');
            return;
        }

        window.subclasSeleccionada = data;

        map.pm.removeControls();
        map.pm.Toolbar.changeControlOrder([]);
        map.off('pm:create');

        const barraHerramientas = {
            position: 'bottomleft',
            drawMarker: false,
            drawPolyline: false,
            drawPolygon: false,
            drawCircle: false,
            drawCircleMarker: false,
            drawRectangle: false,
            rotateMode: false,
            editMode: true,
            dragMode: true,
            removalMode: true,
            cutPolygon: false,
            drawText: false,
        };

        switch (data.tipo_geometria) {
            case 'Point':
                barraHerramientas.drawMarker = true;
                break;
            case 'LineString':
                barraHerramientas.drawPolyline = true;
                break;
            case 'Polygon':
                barraHerramientas.drawPolygon = true;
                break;
        }

        if (data.tipo_geometria === 'Point') map.pm.enableDraw('Marker');
        if (data.tipo_geometria === 'LineString') map.pm.enableDraw('Line');
        if (data.tipo_geometria === 'Polygon') map.pm.enableDraw('Polygon');

        map.pm.addControls(barraHerramientas);

        crearFigura()

    } catch (err) {
        console.error("Error activando las herramientas de dibujo", err);
    }
}
window.activarMododibujo = activarMododibujo

export function dibujarFigurasUsuario(features) {

    const geojson = {
        type: "FeatureCollection",
        features: features
    };

    L.geoJSON(geojson, {
        onEachFeature: function(feature, layer) {
            layer.feature = feature
            layer.feature.properties = layer.feature.properties || {}
            layer.feature.properties.id = feature.feature_id
            layer.feature.properties.tipo = "usuario"
            layer.feature.properties.categoria_id = feature.properties.categoria_id
            layer.feature.properties.subcategoria_id = feature.properties.subcategoria_id
            layer.feature.properties.subclasificacion_id = feature.properties.subclasificacion_id

            window.editableLayers.addLayer(layer)
            layer.addTo(window.map)
            attachEditListeners(layer)

            if (typeof window.mostrarDatosOffcanvas === 'function') {
                layer.on('click', e => window.mostrarDatosOffcanvas(e.target))
            }
        }
    }).addTo(window.map);

    console.log("Figuras de usuario cargadas")
}