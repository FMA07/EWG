function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== "") {
        const cookies = document.cookie.split(";");
        for (let cookie of cookies) {
            cookie = cookie.trim();
            if (cookie.startsWith(name + "=")) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

export function asociarCategoria(){
    const btnAsociar = document.getElementById('btnAsociarConfirmar')
    const proyectoSelect = document.getElementById('proyectoSelect')

    if (!btnAsociar || !proyectoSelect) {
        console.error("No se encontraron elementos necesarios para asociar categorías")
        return;
    }

    btnAsociar.addEventListener('click', () => {

        let categoriaSeleccionadas = []
        const checkboxes = document.querySelectorAll("#tablaCategorias tbody input[type='checkbox']:checked")

        checkboxes.forEach(checkbox => {
            categoriaSeleccionadas.push(checkbox.value)
        })

        if (categoriaSeleccionadas.length === 0) {
            alert("Selecciona al menos una categoría para asociar")
            return;
        }

        const proyectoId = proyectoSelect.value

        if (!proyectoId) {
            alert('Debes seleccionar un proyecto')
            return;
        }

        const params = new URLSearchParams();
        params.append('proyecto_id', proyectoId)

        categoriaSeleccionadas.forEach(id => {
            params.append('categorias', id)
        })

        fetch("/asociar_categoria_a_proyecto/", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "X-CSRFToken": getCookie("csrftoken")
            },
            body: params.toString()
        })
        .then(res => res.json())
        .then(data => {
            if (!data.success) {
                alert("Error: " + (data.error || "No se pudo asociar las categorías"))
            }

            let msg = ""

            if (data.categorias_agregadas.length > 0) {
                msg += `Categorías asociadas correctamente: ${data.categorias_agregadas.join(", ")}\n`
            }

            if (data.categorias_ya_asociadas.length > 0) {
                msg += `Estas categorías ya estaban asociadas: ${data.categorias_ya_asociadas.join(", ")}`
            }

            alert(msg || "No hubo cambios")
        })
        .catch(error => console.error('Error en fetch: ', error))
    })
}
