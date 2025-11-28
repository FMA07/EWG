export function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

const csrftoken = getCookie('csrftoken');

export function guardarSubclas() {
    const subclasForm = document.getElementById('formSubclasificacion')
    const offcanvasElement = document.getElementById('offcanvasFormulario')
    const btnSubmit = document.getElementById('btnSubmitSubclas')
    const titulo = document.getElementById('tituloFormularioSubclasificacion')

    subclasForm.addEventListener('submit', function(e) {
        e.preventDefault()

        const formData = new FormData(subclasForm)
        formData.append("campos_config", window.construirCamposConfig())
        const editingId = subclasForm.dataset.editing || null
        let url = ''
        let method= "POST"

        if (editingId) {
            url = `/editar_subclasificacion/${editingId}/`
        } else {
            url = '/guardar_subclasificacion/'
        }

        fetch(url , {
            method: 'POST',
            headers: { 'X-CSRFToken': csrftoken },
            body: formData,
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                delete subclasForm.dataset.editing
                titulo.textContent = 'Nueva subclasificación'
                btnSubmit.textContent = 'Guardar'
                subclasForm.reset()
                console.log('Subclasificación guardada con éxito: ', data.nombre)

                const offcanvasInstance = bootstrap.Offcanvas.getInstance(offcanvasElement);
                if (offcanvasInstance) {
                    offcanvasInstance.hide()
                    subclasForm.reset()
                }

                if (data.subclasificaciones) {
                    actualizarTablaSubclasificaciones(data.subclasificaciones)
                }
            }
            else {
                console.error('Error', data.errors)
            }
        })
    })
}

export function actualizarTablaSubclasificaciones(subclasificaciones) {
    const seccionTablaSubclas = document.getElementById('seccionTablaSubclasificaciones')
    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    checkbox.className = 'form-check-input'

    if (!seccionTablaSubclas) {
        console.error('no se encuentra el id "seccionTablaSubclasificaciones"')
        return
    }

    let tabla = `<table class="table table-striped table-sm">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Subcategoria padre</th>
                            <th>Categoria</th>
                        </tr>
                    </thead>
                    <tbody>`

    subclasificaciones.forEach(subclas => {
        tabla += `<tr>
                    <td>
                        <input class="form-check-input" type="checkbox" value="${subclas.id}">
                        ${subclas.nombre}
                    </td>
                    <td>
                        ${subclas.subcategoria ?? '-'}
                    </td>
                    <td>
                        ${subclas.categoria}
                    </td>
                </tr>`
    })
    tabla += '</tbody></table>';
    seccionTablaSubclas.innerHTML = tabla
}

export function editar_subclas() {
    const btnEditar = document.getElementById('botonEditar')
    const offcanvasElement = document.getElementById('offcanvasFormulario')
    const titulo = document.getElementById('tituloFormularioSubclasificacion')
    const form = document.getElementById('formSubclasificacion')

    if (!btnEditar) return

    btnEditar.addEventListener('click', () => {
        const seleccionadas = document.querySelectorAll('#seccionTablaSubclasificaciones input[type="checkbox"]:checked')

        if (seleccionadas.length !== 1) {
            alert("Seleccione exactamente UNA subcategoría para editarla.")
            return
        }
        const subclasId = seleccionadas[0].value

        fetch(`/editar_subclasificacion/${subclasId}`)
        .then(r => r.json())
        .then(data => {
            titulo.textContent = "Editar subclasificacion"
            const categoriaInput = form.querySelector('[name="categoria"]');
            const subcatInput = form.querySelector('select[name="subcategoria"]');

            form.querySelector('input[name="nombre"]').value = data.nombre
            if (categoriaInput) {
                categoriaInput.value = data.categoria;
            }
            if (data.subcategoria !== null && subcatInput) {
                subcatInput.value = data.subcategoria;
            } else {
                subcatInput.value = "";   
            }
            form.querySelector('select[name="tipo_geometria"]').value = data.tipo_geometria

            form.dataset.editing = subclasId

            window.cargarCamposDesdeJSON(data.campos_config)

            const offcanvas = new bootstrap.Offcanvas(offcanvasElement)
            offcanvas.show()
        })
        .catch(error => {
            console.error('Error al obtener los datos de la subclasificación: ', error);
            alert("Error al cargar los datos de edición");
        })
    })
}

export function eliminar_subclas() {
    const btnEliminar = document.getElementById('btnEliminar')

    if (!btnEliminar) return

    btnEliminar.addEventListener('click', function() {
        const checkboxes = document.querySelectorAll('#seccionTablaSubclasificaciones input[type="checkbox"]:checked')
        const subclasesAEliminar = []

        checkboxes.forEach(cb => {
            subclasesAEliminar.push(cb.value)
        })

        if (subclasesAEliminar.length === 0) {
            alert('Debe seleccionar al menos UNA subclasificación para eliminar')
            return
        }

        if (!confirm("¿Está seguro de eliminar las subclasificaciones seleccionadas?"))
            return

        const eliminarPromesas = subclasesAEliminar.map(subclasId => {
            const url = `/eliminar_subclasificacion/${subclasId}/`
            return fetch(url, {
                method: "POST",
                headers: {
                    'X-CSRFToken': csrftoken,
                    'X-Requested-With': 'XMLHttpRequest',
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Error al eliminar la subclasificación ${subclasId}: ${response.statusText}`)
                }
                return response.json()
            })
            .then(data => {
                if (data.success) {
                    const row = document.querySelector(`input[value="${subclasId}"]`).closest('tr')
                    if (row) row.remove()
                    return true
                }
                return false
            })
        })

        Promise.all(eliminarPromesas)
            .then(() => {
                alert("Subclasificaciones eliminadas correctamente.")
            })
            .catch(error => {
                console.error('Error al eliminar subclasificaciones:', error)
                alert(`Ocurrió  un error durante la eliminación: ${error.message}`)
            })
    })
}
