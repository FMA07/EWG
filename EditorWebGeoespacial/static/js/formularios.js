import { guardarCambiosFigura } from "./funcionalidadCapas.js";

let capaEnVista = null

document.addEventListener('click', function (e){
    if(e.target && e.target.id === 'btnEditarDatos' && capaEnVista) {
        e.preventDefault();
        generarFormularioEditable(capaEnVista)
    }
})


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