export function agregarCampo() {
    const lista = document.getElementById("listaCampos");

    const div = document.createElement("div");
    div.classList.add("fila-campo", "d-flex", "gap-2", "mt-2");

    div.innerHTML = `
        <input type="text" class="form-control campo-nombre" placeholder="Nombre del campo">

        <select class="form-select campo-tipo">
            <option value="texto">Texto</option>
            <option value="numero">Número</option>
            <option value="fecha">Fecha</option>
            <option value="booleano">Verdadero/Falso</option>
        </select>
        
        <p>Obligatorio</p>
        <input type="checkbox" class="form-check-input campo-obligatorio" style="border: 2px solid black;">

        <button type="button" class="btn btn-danger btn-sm btnEliminarCampo">X</button>
    `;

    lista.appendChild(div);

    div.querySelector(".btnEliminarCampo").addEventListener("click", () => div.remove());
}

// Construir JSON para enviarlo al backend
export function construirCamposConfig() {
    const filas = document.querySelectorAll(".fila-campo");
    const campos = [];

    filas.forEach(fila => {
        campos.push({
            nombre: fila.querySelector(".campo-nombre").value,
            tipo: fila.querySelector(".campo-tipo").value,
            obligatorio: fila.querySelector(".campo-obligatorio").checked,
        });
    });

    return JSON.stringify(campos);
}

export function inicializarCamposDinamicos() {
    const btnAgregar = document.getElementById("btnAgregarCampos");
    if (btnAgregar) {
        btnAgregar.addEventListener("click", agregarCampo);
    }
}

// Cargar campos dinámicos desde JSON (cuando se edita una subclasificación)
export function cargarCamposDesdeJSON(campos) {

    const lista = document.getElementById("listaCampos");

    // Limpiar contenido actual
    lista.innerHTML = "";

    if (!Array.isArray(campos)) {
        console.error("campos_config no es un array:", campos);
        return;
    }

    campos.forEach(campo => {
        const div = document.createElement("div");
        div.classList.add("fila-campo", "d-flex", "gap-2", "mt-2");

        div.innerHTML = `
            <input type="text" class="form-control campo-nombre" 
                   placeholder="Nombre del campo" value="${campo.nombre || ""}">

            <select class="form-select campo-tipo">
                <option value="texto" ${campo.tipo === "texto" ? "selected" : ""}>Texto</option>
                <option value="numero" ${campo.tipo === "numero" ? "selected" : ""}>Número</option>
                <option value="fecha" ${campo.tipo === "fecha" ? "selected" : ""}>Fecha</option>
                <option value="booleano" ${campo.tipo === "booleano" ? "selected" : ""}>Verdadero/Falso</option>
            </select>
            
            <p>Obligatorio</p>
            <input type="checkbox" class="form-check-input campo-obligatorio"
                   style="border: 2px solid black;" 
                   ${campo.obligatorio ? "checked" : ""}>

            <button type="button" class="btn btn-danger btn-sm btnEliminarCampo">X</button>
        `;
        
        lista.appendChild(div);

        div.querySelector(".btnEliminarCampo").addEventListener("click", () => div.remove());
    });
}
