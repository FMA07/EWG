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

export function guardarSubcat() {
    const subcategoriaForm = document.getElementById('formSubcategoria');
    const offcanvasElement = document.getElementById('offcanvasFormulario')
    const btnSubmit = document.getElementById('btnSubmitSubcat')
    const titulo = document.getElementById('tituloFormularioSubcategoria')


    subcategoriaForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const formData = new FormData(subcategoriaForm);
        const editingId = subcategoriaForm.dataset.editing || null
        let url = ''
        let method= "POST"

        if (editingId) {
            url = `/editar_subcategoria/${editingId}/`
        } else {
            url = '/guardar_subcategoria/'
        }

        fetch(url , {
            method: 'POST',
            headers: { 'X-CSRFToken': csrftoken },
            body: formData,
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                delete subcategoriaForm.dataset.editing
                titulo.textContent = 'Nueva subcategoría'
                btnSubmit.textContent = 'Guardar'
                subcategoriaForm.reset()
                console.log('Subcategoría guardada con éxito: ', data.nombre)

                const offcanvasInstance = bootstrap.Offcanvas.getInstance(offcanvasElement);
                if (offcanvasInstance) {
                    offcanvasInstance.hide()
                    subcategoriaForm.reset()
                }

                if (data.subcategorias) {
                    actualizarTablaSubcategorias(data.subcategorias)
                }
            } else {
                console.error("Error:", data.errors);
            }
        });
    });
}

export function actualizarTablaSubcategorias(subcategorias) {
    const seccionTablaSubcat = document.getElementById('seccionTablaSubcategorias')
    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    checkbox.className = 'form-check-input'

    if (!seccionTablaSubcat) {
        console.error('No se encuentra el id "seccionTablaSubcategorias"')
        return
    }

    let tabla = `<table class="table table-striped table-sm">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Categoria padre</th>
                        </tr>
                    </thead>
                    <tbody>`

    subcategorias.forEach(subcategoria => {
        tabla += `<tr>
                    <td>
                        <input class="form-check-input" type="checkbox" value="${subcategoria.id}">
                        ${subcategoria.nombre}
                    </td>
                    <td>
                        ${subcategoria.categoria__nombre}
                    </td>
                </tr>`
    })

    tabla += '</tbody></table>';
    seccionTablaSubcat.innerHTML = tabla
}

export function editar_subcat() {
    const btnEditar = document.getElementById('botonEditar')
    const offcanvasElement = document.getElementById('offcanvasFormulario')
    const titulo = document.getElementById('tituloFormularioSubcategoria')
    const form = document.getElementById('formSubcategoria')

    if (!btnEditar) return

    btnEditar.addEventListener('click', () => {
        const seleccionadas = document.querySelectorAll('#seccionTablaSubcategorias input[type="checkbox"]:checked')
        
        if (seleccionadas.length !== 1) {
            alert("Seleccione exactamente UNA subcategoría para editarla.")
            return
        }

        const subcatId = seleccionadas[0].value

        fetch(`/editar_subcategoria/${subcatId}/`)
        .then(r => r.json())
        .then(data => {
            titulo.textContent = 'Editar subcategoría'
            form.querySelector('input[name="nombre"]').value = data.nombre

            form.dataset.editing = subcatId;

            const offcanvas = new bootstrap.Offcanvas(offcanvasElement)
            offcanvas.show()
        })
        .catch(error => {
            console.error('Error al obtener los datos de la subcategoría: ', error)
            alert("Error al cargar los datos de edición")
        })
    })
}

export function eliminar_subcat() {
    const btnEliminar = document.getElementById('btnEliminar')

    if (!btnEliminar) return

    btnEliminar.addEventListener('click', function() {
        const checkboxes = document.querySelectorAll('#seccionTablaSubcategorias input[type="checkbox"]:checked')
        const subcatsAEliminar = []

        checkboxes.forEach(cb => {
            subcatsAEliminar.push(cb.value)
        })

        if (subcatsAEliminar.length === 0) {
            alert("Debe seleccionar al menos una subcategoría para eliminar")
            return
        }

        if (!confirm("¿Está seguro de eliminar las subcategorías seleccionadas?"))
            return

        const eliminarPromesas = subcatsAEliminar.map(subcatId => {
            const url = `/eliminar_subcat/${subcatId}/`
            return fetch(url, {
                method: "POST",
                headers: {
                    'X-CSRFToken': csrftoken,
                    'X-Requested-With': 'XMLHttpRequest',
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Error al eliminar la subcategoría ${subcatId}: ${response.statusText}`)
                }
                return response.json()
            })
            .then(data => {
                if (data.success) {
                    const row = document.querySelector(`input[value="${subcatId}"]`).closest('tr')
                    if (row) row.remove()
                    return true
                }
                return false
            })
        })

        Promise.all(eliminarPromesas)
            .then(() => {
                alert("Subcategorías eliminadas correctamente.")
            })
            .catch(error => {
                console.error('Error al eliminar subcategorías:', error)
                alert(`Ocurrió  un error durante la eliminación: ${error.message}`)
            })
    })
}