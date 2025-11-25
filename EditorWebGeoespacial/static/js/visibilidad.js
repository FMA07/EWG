export function guardarEstadoVisibilidad() {
    const estadoFiguras = {}

    document.querySelectorAll(".categoria-checkbox, .subcat-checkbox, .subclas-checkbox")
    .forEach(cb => {
        const key = `${cb.dataset.tipo}_${cb.dataset.id}`;
        estadoFiguras[key] = cb.checked
    })

    localStorage.setItem("VisibilidadFiguras", JSON.stringify(estadoFiguras))
}

export function restaurarEstadoVisibilidad() {
    const guardado = localStorage.getItem("VisibilidadFiguras")

    if (!guardado) return

    const estadoGuardado = JSON.parse(guardado)

    document.querySelectorAll(".categoria-checkbox, .subcat-checkbox, .subclas-checkbox")
    .forEach(cb => {
        const key = `${cb.dataset.tipo}_${cb.dataset.id}`;

        if (key in estadoGuardado) {
            cb.checked = estadoGuardado[key]
        } else {
            // Si es un checkbox nuevo, lo dejamos visible por defecto.
            cb.checked = true
        }
    })
}

export function alternarVisibilidadFigUsuario(e) {
    const target = e?.target
    
    if (!target) return

    const tipo = target.dataset.tipo
    const id = target.dataset.id
    const checked = target.checked

    // 1. Propagación de Categoría (chequea subcategorías y subclasificaciones)
    if (tipo === "categoria") {
        const selectorHijos = `.subcat-checkbox[data-categoria='${id}'], .subclas-checkbox[data-categoria='${id}']`;
        document.querySelectorAll(selectorHijos).forEach(s => s.checked = checked);
    } 
    // 2. Propagación de Subcategoría (chequea subclasificaciones)
    else if (tipo === "subcategoria") {
        document.querySelectorAll(`.subclas-checkbox[data-subcategoria='${id}']`)
            .forEach(s => s.checked = checked)
    }

    // 3. Sincronizar Mapa y Guardar Estado
    // Accedemos a la función de mapa de forma global (se define en editor.html)
    if (typeof actualizarVisibilidadFigurasUsuario === "function") {
        actualizarVisibilidadFigurasUsuario()
    }
    // La función de guardado se llama localmente porque está en este módulo
    guardarEstadoVisibilidad() 
}

export function actualizarVisibilidadFigurasUsuario() {

    if (!window.visibilidadListasListas) {
        console.log("Visibilidad NO aplicada (sidebar incompleto)");
        return;
    }

    console.log("Visibilidad SI aplicada (sidebar listo)");

    const activasCat = new Set()
    const activasSubcat = new Set()
    const activasSubclas = new Set()

    document.querySelectorAll(".categoria-checkbox:checked")
        .forEach(ch => activasCat.add(parseInt(ch.dataset.id)))

    document.querySelectorAll(".subcat-checkbox:checked")
        .forEach(ch => activasSubcat.add(parseInt(ch.dataset.id)))

    document.querySelectorAll(".subclas-checkbox:checked")
        .forEach(ch => activasSubclas.add(parseInt(ch.dataset.id)))

    window.editableLayers.eachLayer(layer => {

        const p = layer.feature?.properties
        if (!p || p.tipo !== "usuario") return

        let visible = true

        const catId = parseInt(p.categoria_id)
        const subcatId = parseInt(p.subcategoria_id)
        const subclasId = parseInt(p.subclasificacion_id)

        // Reglas:
        console.log(
            "SUBCAT EXISTE? ",
            subcatId,
            document.querySelector(`.subcat-checkbox[data-id='${subcatId}']`)
        );

        // 1) Categoría obligatoria
        if (!activasCat.has(catId)) visible = false

        // 2) Subcategoría (si existe)
        if (!isNaN(subcatId) && subcatId > 0) {
            if (!activasSubcat.has(subcatId)) visible = false
        }

        // 3) Subclasificación obligatoria siempre
        if (!activasSubclas.has(subclasId)) visible = false

        // Aplicación:

        if (visible) {
            if (!window.map.hasLayer(layer)) {
                layer.addTo(window.map)
            }
        } else {
            if (window.map.hasLayer(layer)) {
                window.map.removeLayer(layer)
            }
        }

    })
}
