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

//Listener que carga el formulario para un nuevo proyecto y lo envía
export function formularioNuevoProyecto() {
    proyectoForm.addEventListener('submit', function(event){
        event.preventDefault();
        const formData = new FormData(proyectoForm);
        const nombreInput = document.getElementById('id_nombre');
        const nombre = nombreInput.value.trim();
        const categorias = document.querySelectorAll('#id_categoria input[type="checkbox"]:checked');
        const formUrl = proyectoForm.getAttribute('action')

        if (!nombre) {
            alert("El nombre del proyecto no puede estar vacío.");
            nombreInput.focus();
            return;
        }

        if (categorias.length === 0) {
            alert("Debe seleccionar al menos una categoría.");
            return;
        }
        
        fetch(formUrl, {
            method: 'POST',
            headers: {
                'X-CSRFToken': csrftoken,
                'X-Requested-With': 'XMLHttpRequest',
            },
            body: formData,
        })
        .then(response => {

            const contentType = response.headers.get("content-type");

            if (!response.ok) {
                return response.json().then(errorData => {
                    throw new Error(JSON.stringify(errorData));
                })
            }
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error("La respuesta no es JSON (posible redirección o error del servidor)");
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                proyectoForm.reset();
                const offcanvasElement = document.getElementById('formularioProyecto');
                const offcanvasInstance = bootstrap.Offcanvas.getInstance(offcanvasElement);

                if (offcanvasInstance) {
                    offcanvasInstance.hide();
                } else {
                    new bootstrap.Offcanvas(offcanvasElement).hide();
                }

                if (data.proyectos) {
                    actualizarTablaProyectos(data.proyectos)
                }
            } else {
                console.error('Errores en el formulario:', data.errors);
            }
        })
        .catch(error => {
            console.error('Error en la solicitud:', error);
        });
    });
}

//Función para generar y actualizar la información de la tabla
export function actualizarTablaProyectos(proyectos){
    const seccionTablaProyectos = document.getElementById('seccionTablaProyectos');
    const checkbox = document.createElement('input')
    checkbox.className = 'form-check-input'
    checkbox.type = 'checkbox';

    if (!seccionTablaProyectos) {
        console.error('No se encuentra el id "seccionTablaProyectos"');
        return;
    }

    let tabla = `<table class="table table-striped table-sm">
                                    <thead>
                                        <tr>
                                            <th>Nombre</th>
                                            <th>Autor</th>
                                            <th>Fecha de creación</th>
                                            <th>Categorías asociadas</th>
                                        </tr>
                                    </thead>
                                    <tbody>`;

    data.proyectos.forEach(proyecto => {
        tabla += `<tr>
                    <td>
                        <input class="form-check-input" type="checkbox" value="${proyecto.id}">
                        ${proyecto.nombre}
                    </td>
                    <td>${proyecto.autor__username}</td>
                    <td>${proyecto.fecha_creacion}</td>
                    <td>${proyecto.categorias_list}</td>
                    </tr>`;
    })

    tabla += '</tbody></table>';
    seccionTablaProyectos.innerHTML = tabla;
}

export function eliminarProyecto(){
    btnEliminar.addEventListener('click', function() {
        const checkboxes = document.querySelectorAll('#seccionTablaProyectos input[type="checkbox"]:checked');
        const proyectosAEliminar = [];
        checkboxes.forEach(checkbox => {
            proyectosAEliminar.push(checkbox.value);
        });

        if (proyectosAEliminar.length === 0) {
            alert("Seleccione al menos un proyecto para eliminar.");
            return;
        }

        if (!confirm('¿Está seguro de que desea eliminar los proyectos seleccionados?')) {
            return;
        }

        const eliminarPromesas = proyectosAEliminar.map(proyectoId => {
            const url = `/eliminar_proyecto/${proyectoId}/`;
            return fetch(url, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrftoken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Error al eliminar el proyecto ${proyectoId}: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    const row = document.querySelector(`input[value="${proyectoId}"]`).closest('tr');
                    if (row) row.remove();
                    return true;
                }
                return false;
            });
        });

        Promise.all(eliminarPromesas)
            .then(() => {
                alert('Proyectos eliminados correctamente.');
            })
            .catch(error => {
                console.error('Error al eliminar proyectos:', error);
                alert(`Ocurrió un error durante la eliminación: ${error.message}`);
            });
    });
}