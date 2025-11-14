const csrftoken = getCookie('csrftoken');
const proyectoForm = document.getElementById('formProyecto');

//Función para conseguir el csfrtoken
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

export function guardarCategoria() {
    const csrftoken = getCookie('csrftoken');
    const formCategoria = document.getElementById('formCategoria');
    const offcanvasElement = document.getElementById('offcanvasFormulario')
    const submitBtn = document.getElementById('btnSubmitCategoria')
    const titulo = document.getElementById('tituloFormularioCategoria')
    

    formCategoria.addEventListener('submit', function(e){
        e.preventDefault()

        const formData = new FormData(formCategoria)
        const editingId = formCategoria.dataset.editing || null;
        let url = "";
        let method = "POST";

        if (editingId) {
            url = `/editar_categoria/${editingId}/`;
        } else {
            url = `/guardar_categoria/`;
        }

        fetch(url, {
            method: "POST",
            headers: {'X-CSRFToken': csrftoken},
            body: formData,
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                delete formCategoria.dataset.editing
                titulo.textContent ='Nueva categoría'
                submitBtn.textContent = "Guardar";
                formCategoria.reset();
                console.log('Categoría guardada con éxito: ', data.nombre)

                const offcanvasInstance = bootstrap.Offcanvas.getInstance(offcanvasElement)
                if (offcanvasInstance) {
                    offcanvasInstance.hide()
                    formCategoria.reset()
                }
                if (data.categorias) {
                    actualizarTablaCategorias(data.categorias)
                }
                delete formCategoria.dataset.editing
            } else {
                console.error("Error: ", data.errors)
            }
        })
    })
}

export function actualizarTablaCategorias(categorias) {
    const seccionTablaCategorias = document.getElementById('seccionTablaCategorias')
    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    checkbox.className = 'form-check-input'

    if (!seccionTablaCategorias) {
        console.error('No se encuentra el id "seccionTablaCategorias"')
        return
    }

    let tabla = `<table class="table table-striped table-sm">
                                    <thead>
                                        <tr>
                                            <th>Nombre</th>
                                        </tr>
                                    </thead>
                                    <tbody>`;

    categorias.forEach(categoria => {
        tabla += `<tr>
                    <td>
                        <input class="form-check-input" type="checkbox" value="${categoria.id}">
                        ${categoria.nombre}
                    </td>
                    </tr>`;
    })

    tabla += '</tbody></table>';
    seccionTablaCategorias.innerHTML = tabla;
}

export function editarCategoria(){
    const btnEditar = document.getElementById('botonEditar');
    const offcanvasElement = document.getElementById('offcanvasFormulario');
    const titulo = document.getElementById('tituloFormularioCategoria');
    const form = document.getElementById('formCategoria');
    const btnSubmit = document.getElementById('btnSubmitCategoria');

    if (!btnEditar) return;

    btnEditar.addEventListener('click', () => {
        const seleccionadas = document.querySelectorAll('#seccionTablaCategorias input[type="checkbox"]:checked');
        const categoriaId = seleccionadas[0].value

        if (seleccionadas.length !== 1) {
            alert("Selecciona exactamente UNA categoría para editar.");
            return;
        }

        fetch(`/editar_categoria/${categoriaId}/`)
        .then(r => r.json())
        .then(data => {
            titulo.textContent = "Editar categoría"
            form.querySelector('input[name="nombre"]').value = data.nombre

            form.dataset.editing = categoriaId;

            const offcanvas = new bootstrap.Offcanvas(offcanvasElement);
            offcanvas.show();
        })
    })
}

export function eliminarCategoria() {
    const btnEliminar = document.getElementById('btnEliminar');

    if (!btnEliminar) {
        console.error("El botón 'btnEliminar' no fue encontrado.");
        return;
    }

    btnEliminar.addEventListener('click', function() {
        
        const checkboxes = document.querySelectorAll('#seccionTablaCategorias input[type="checkbox"]:checked');
        const categoriasAEliminar = [];
        
        checkboxes.forEach(checkbox => {
            categoriasAEliminar.push(checkbox.value);
        });

        if (categoriasAEliminar.length === 0) {
            alert("Seleccione al menos una categoría para eliminar.");
            return;
        }

        if (!confirm('¿Está seguro de que desea eliminar las categorías seleccionadas?')) {
            return;
        }

        const eliminarPromesas = categoriasAEliminar.map(categoriaId => {
            const url = `/eliminar_categoria/${categoriaId}/`; 
            return fetch(url, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrftoken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Error al eliminar la categoría ${categoriaId}: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    const row = document.querySelector(`input[value="${categoriaId}"]`).closest('tr');
                    if (row) row.remove();
                    return true;
                }
                return false;
            });
        });

        Promise.all(eliminarPromesas)
            .then(() => {
                alert('Categorías eliminadas correctamente.');
            })
            .catch(error => {
                console.error('Error al eliminar categorías:', error);
                alert(`Ocurrió un error durante la eliminación: ${error.message}`);
            });
    });
}