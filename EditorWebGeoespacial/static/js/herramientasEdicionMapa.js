export function mostrarProyectoActivo(){
    const proyectoActivo = localStorage.getItem('proyecto_activo')
    const categoriasActivas = JSON.parse(localStorage.getItem('categoriasActivas') || "[]")

    if (proyectoActivo) {
        console.log("Proyecto activo:", proyectoActivo)
        console.log("Categorías permitidas:", categoriasActivas);
    }
}