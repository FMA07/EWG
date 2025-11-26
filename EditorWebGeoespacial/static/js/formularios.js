import { alternarVisibilidadFigUsuario } from "./visibilidad.js"
import { guardarCambiosFigura } from "./funcionalidadCapas.js";

let capaEnVista = null

document.addEventListener('click', function (e){
    if(e.target && e.target.id === 'btnEditarDatos' && capaEnVista) {
        e.preventDefault();
        generarFormularioEditable(capaEnVista)
    }
})

const csrftoken = getCookie('csrftoken');

function getCookie(name) {
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


//________________________________________________________________________________
//Funcion que permite ver la tabla de datos en offcanvas al hacer click en una figura de una capa cargada
export function mostrarDatosOffcanvas(layer){
    if (!layer ||!layer.feature) return;
    const properties = layer.feature && layer.feature.properties ? layer.feature.properties : {};
    const offcanvasBody = document.getElementById('cuerpoTablas');
    const offcanvasElement = document.getElementById('seccionTablas')
    
    capaEnVista = layer;

    let tablaHtml = '<table class= "table table-striped table-sm">';
    tablaHtml += '<thead><tr><th>Atributo</th><th>Valor</th></tr></thead>';
    tablaHtml += '<tbody>';

    const propKeys = Object.keys(properties);

    if (propKeys.length === 0) {
        tablaHtml += `<tr><td colspan="2">No hay atributos definidos para esta figura.</td></tr>`;
    } else {
        for (const key of propKeys){
            if (camposOcultos.includes(key)) continue;
            tablaHtml += `<tr><td><strong>${key}</strong></td><td>${properties[key]}</td></tr>`;
        }
    }
    tablaHtml += '<tbody></table>'
    offcanvasBody.innerHTML = tablaHtml;

    if (offcanvasElement && typeof bootstrap !== 'undefined') {
        let bsOffcanvas = bootstrap.Offcanvas.getInstance(offcanvasElement)
        if (!bsOffcanvas){
            bsOffcanvas = new bootstrap.Offcanvas(offcanvasElement);
        }
        bsOffcanvas.show();
    } else if (offcanvasElement) {
        console.error("Error: La librería de Bootstrap no está cargada")
    }
}
window.mostrarDatosOffcanvas = mostrarDatosOffcanvas

export function generarFormularioEditable(layer){
    window.capaActualmenteEditada = layer;
    const properties = layer.feature && layer.feature.properties ? layer.feature.properties : {};
    const offcanvasBody = document.getElementById('cuerpoTablas');

    offcanvasBody.innerHTML = '';

    let formHtml = '<form id="atributosFiguraForm">';
    formHtml += '<table class= "table table-striped table-sm">';
    formHtml += '<thead><tr><th>Atributo</th><th>Valor</th></tr></thead>';
    formHtml += '<tbody>';

    const propKeys = Object.keys(properties);

    if (propKeys.length === 0) {
        formHtml = `<tr><td><strong>Nuevo Atributo</strong></td><td><input type="text" class="form-control form-control-sm" name="nuevo_atributo_1" value=""></td></tr>`;
    } else {
        for (const key of propKeys) {
            if (camposOcultos.includes(key)) continue;
            const safeValue = (properties[key] === null || properties[key] === undefined) ? '' : properties[key];
            formHtml += `<tr><td><strong>${key}</strong></td><td><input type="text" class="form-control form-control-sm" name="${key}" value="${safeValue}"></td></tr>`;
        }
    }

    formHtml += '</tbody></table>'
    formHtml += '<button type="submit" class="btn btn-success btn-sm mt-3">Guardar cambios</button>';
    formHtml += '</form>';

    offcanvasBody.innerHTML = formHtml

    document.getElementById('atributosFiguraForm').addEventListener('submit', function(e){
        e.preventDefault();
        guardarAtributosEditados(layer, this);
    })
}

//Funcion que permite ver la tabla de datos en offcanvas al hacer click en una figura de una capa cargada
export function guardarAtributosEditados(layer, formElement) {
    const formData = new FormData(formElement);
    const newProperties = {};
    const oldProps = layer.feature.properties

    for (const [key, value] of formData.entries()) {
        if (!window.camposOcultos.includes(key)) {
            newProperties[key] = value;
        }
    }

    for (const key in oldProps) {
        if (window.camposOcultos.includes(key)) {
            newProperties[key] = oldProps[key]
        }
    }
    
    layer.feature.properties = newProperties

        if (oldProps.id) {
            guardarCambiosFigura(layer)
        } else {
            console.warn("Figura editada no tiene Id en BD, no se puede guardar")
        }

    alert('Atributos guardados exitosamente')
    window.mostrarDatosOffcanvas(layer);
}

//__________________________________________//FORMULARIOS CRUD\\__________________________________________
/*
export function formularioCategoria() {
    const categoriaForm = document.getElementById('categoriaForm');
        
    categoriaForm.addEventListener('submit', function(e){
        e.preventDefault();

        const formData = new FormData(document.getElementById('categoriaForm'));
        formData.append('tipo_form', 'categoria')

        fetch('guardar_por_ajax', {
            method: 'POST',
            body: formData,
            headers: {'X-CSRFToken': csrftoken},
        })
        .then(response => response.json())
        .then(data => { //De acá para abajo, si se guarda exitosamente la categoría, se cierra el modal y se actualiza la lista del sidebar
            if (data.success && data.tipo === 'categoria'){
                console.log("Guardado con éxito: ", data.nombre);
                const modal = bootstrap.Modal.getInstance(document.getElementById('modalEstaticoCategoria'));
                categoriaForm.reset();
                modal.hide();

                const sidebarList = document.querySelector('#sidebar-body ul');
                const newLi = document.createElement('li');
                newLi.className = 'lista-categorias';
                
                const contenedorCategorias = document.createElement('div');
                contenedorCategorias.className ='contenedor-categorias';

                const checkbox = document.createElement('input');
                checkbox.className = 'form-check-input subitem-checkbox categoria-checkbox';
                checkbox.type = 'checkbox';
                checkbox.checked = true;
                checkbox.dataset.id = 'data.id'
                checkbox.dataset.tipo = 'categoria'
                checkbox.addEventListener('change', alternarVisibilidadFigUsuario)
                
                const nuevaCategoria = document.createElement('button');
                nuevaCategoria.className = 'sidebar-options';
                nuevaCategoria.textContent = `${data.nombre}`

                contenedorCategorias.appendChild(checkbox);
                contenedorCategorias.appendChild(nuevaCategoria);
                newLi.appendChild(contenedorCategorias);
                sidebarList.appendChild(newLi);

                
            } else {
                console.error("Error: ", data.errors);
            }
        })
    })
}*/



export function formularioSubclas() {
    const subclasForm = document.getElementById('subclasForm');

    subclasForm.addEventListener('submit', function (e){
        e.preventDefault();
        const formData = new FormData(subclasForm);
        formData.append('tipo_form', 'subclasificacion');
        const categoriaSelect = subclasForm.querySelector('#id_categoria');
        const categoriaId = categoriaSelect ? categoriaSelect.value : null;
        const camposConfig = document.getElementById('id_campos_config').value;
        try{
            JSON.parse(camposConfig);
        } catch(error) {
            alert('El formato del JSON no es válido. Corrígelo antes de guardar');
            return;
        }

        fetch('guardar_por_ajax', {
            method: 'POST',
            body: formData,
            headers: { 'X-CSRFToken': csrftoken },
        })
        .then(response => response.json())
        .then(data => {
            if (data.success && data.tipo === 'subclasificacion') {
                console.log('Subclasificación guardada exitosamente: ', data.nombre);
                const modal = bootstrap.Modal.getInstance(document.getElementById('modalEstaticoSubclasificacion'));
                subclasForm.reset();
                modal.hide();

                if (categoriaId) {
                    const botonCategoria = document.querySelector(`.boton-categorias-toggle[data-id='${categoriaId}']`);
                    const listaCategoria = botonCategoria ? botonCategoria.closest('.lista-categorias') : null;
                    const listaSubcategoriasUl = listaCategoria ? listaCategoria.querySelector('.lista-subcategorias') : null;

                    if (listaSubcategoriasUl) {
                        listaSubcategoriasUl.style.display = 'block';
                    }

                    if (listaCategoria) {
                        fetchContenidoCategoria(categoriaId, listaCategoria);
                    }
                }

            } else {
                console.error("Error: ", data.errors);
            }
        })
    })
}

/*ESTAS DOS FUNCIONES YA NO SE USAN, ERA PARA LA CREACIÓN DE CATEGORIAS, SUBCATEGORIAS Y SUBCLASIFICACIONES EN EL EDITOR. LAS DEJO POR SI SE VUELVE A IMPLEMENTAR
//PARA ASIGNAR LA CATEGORIA AUTOMATICAMENTE EN EL MODAL DE SUBCATEGORIA
export function cargarCatFormSubcat() {
    const modalSubcategoria = document.getElementById('modalEstaticoSubcategoria');
    modalSubcategoria.addEventListener('show.bs.modal', function(event) {
        const button = event.relatedTarget;
        const categoriaId = button.getAttribute('data-categoria-id');
        const categoriaSelect = modalSubcategoria.querySelector('#id_categoria');

        if (categoriaSelect) {
            categoriaSelect.value = categoriaId;
        }
    })
}

//PARA ASIGNAR LA CATEGORIA AUTOMÁTICAMENTE EN EL MODAL DE SUBCLASIFICACION
export function cargarCatFormSubclas() {
    const modalSubclas = document.getElementById('modalEstaticoSubclasificacion');
    modalSubclas.addEventListener('show.bs.modal', function(event){
        const button = event.relatedTarget;
        const categoriaId = button.getAttribute('data-categoria-id');
        const categoriaSelect = modalSubclas.querySelector('#id_categoria');

        if (categoriaSelect){
            categoriaSelect.value = categoriaId;
        }
    })
} */