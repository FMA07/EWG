window.restaurarEstadoVisibilidad = restaurarEstadoVisibilidad;
window.guardarEstadoVisibilidad = guardarEstadoVisibilidad;

export function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    const toggleBtn = document.getElementById("toggleSidebar");

    toggleBtn.addEventListener("click", function () {
        sidebar.classList.toggle("minimized");
        setTimeout(() => {
            map.invalidateSize(); // Ajusta Leaflet después del cambio
        }, 310);

        if (sidebar.classList.contains("minimized")){
            toggleBtn.innerHTML = "&gt;"
        } else {
            toggleBtn.innerHTML = "&lt;"
        }
    });
}

export function inicializadorSidebar(){
    const botonCategorias = document.querySelectorAll(".boton-categorias-toggle");
    botonCategorias.forEach(function(boton){
        boton.addEventListener("click", function(e){
            e.preventDefault();

            const listaCategorias = this.closest('.lista-categorias');
            if (!listaCategorias) {
                console.warn("No se encontró '.lista-categorias' para este botón:", this);
                return;
            }
            const listaSubcategoriasUl = listaCategorias ? listaCategorias.querySelector('.lista-subcategorias') : null;
            if (!listaSubcategoriasUl) {
                console.warn("No se encontró '.lista-subcategorias' dentro de la categoría");
                return;
            }
            const categoriaId = this.dataset.id;

            if (listaSubcategoriasUl) {

                const seAbre = listaSubcategoriasUl.style.display === 'none' || !listaSubcategoriasUl.style.display;

                if (seAbre) {
                    document.querySelectorAll('.lista-subcategorias').forEach(ul => {
                        if (ul !== listaSubcategoriasUl) {
                            ul.style.display = 'none';
                        }
                    });
                    
                    listaSubcategoriasUl.style.display = 'block';
                    fetchContenidoCategoria(categoriaId, listaCategorias);
                } else {
                    listaSubcategoriasUl.style.display = 'none';
                    
                }
            }
        })
    });
    restaurarEstadoVisibilidad();
}

// CODIGO PARA CARGAR EL CONTENIDO DE LAS CATEGORIAS Y SUBCATEGORIAS
export function fetchContenidoCategoria(categoriaId, listaCategorias) {
    
    const subcatListContainer = listaCategorias.querySelector(`#subcats-${categoriaId}`);
    const subclasListContainer = listaCategorias.querySelector(`#subclas-cat-${categoriaId}`);

    subcatListContainer.innerHTML = '<li>Cargando...</li>';
    subclasListContainer.innerHTML = '';

    fetch(`/obtener_contenido_categoria/${categoriaId}/`)
        .then(response => response.json())
        .then(data => {
            subcatListContainer.innerHTML = '';

            if (!data) {
                subcatListContainer.innerHTML = `<li>Error cargando contenido: ${data.error}`;
                return
            }

            if (data.subcategorias) {
                data.subcategorias.forEach(sub => {
                    const li = document.createElement('li');
                    const itemContainer = document.createElement('div');
                    itemContainer.className = 'contenedor-subcategorias';

                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.checked = true;
                    checkbox.className = 'form-check-input subitem-checkbox subcat-checkbox';
                    checkbox.dataset.id = sub.id;
                    checkbox.dataset.tipo = 'subcategoria';
                    checkbox.dataset.categoria = sub.categoria_id;

                    const btn = document.createElement('button');
                    btn.className = 'sidebar-suboption';
                    btn.dataset.id = sub.id;
                    btn.textContent = sub.nombre;

                    btn.addEventListener('click', function(event){
                        event.stopPropagation();
                        fetchContenidoSubcategoria(sub.id, this); 
                    });

                    itemContainer.appendChild(checkbox);
                    itemContainer.appendChild(btn)

                    li.appendChild(itemContainer);
                    subcatListContainer.appendChild(li);
                });
            }

            if (data.subclasificaciones_cat) {
                mostrarSubclasificacion(data.subclasificaciones_cat, subclasListContainer, null);
            }
        })
        .catch(err => {
            console.error('Error cargando categoría: ', err);
            subcatListContainer.innerHTML = '<li>Error al cargar contenido de categoría.</li>';
        });
    restaurarEstadoVisibilidad();
}

//Funciones auxiliares para el fetch de subcategorias
export function fetchContenidoSubcategoria(subId, clickedButton){
    const subcatLi = clickedButton.closest('li');
    const subclasId = `subclas-for-sub-${subId}`;
    const elementoSubclas = document.getElementById(subclasId);

    if (elementoSubclas) {
        elementoSubclas.remove()
        return; 
    }

    const subclasLi = document.createElement('li');
    subclasLi.id = `subclas-for-sub-${subId}`;
    subclasLi.className = 'subclas-injected-li'
    subclasLi.innerHTML ='<p style="text-align: center;">Cargando figuras...</p>';

    subcatLi.after(subclasLi);

    fetch(`/obtener_contenido_subcategoria/${subId}/`)
        .then(response => response.json())
        .then(data =>{
            mostrarSubclasificacion(data.items, subclasLi, subId);
        })
        .catch(err => {
            console.error('Error cargando las subclasificaciones: ', err),
            subclasLi.innerHTML = '<p>Error cargando las subclasificaciones</p>';
        })

    restaurarEstadoVisibilidad();
}

export function mostrarSubclasificacion(items, container){
    container.innerHTML = '';
    
    if (items) {

        items.forEach(subclas => {
            const itemContainer = document.createElement('div');
            itemContainer.className = 'contenedor-subcategorias item-subclasificacion'

            const checkbox = document.createElement('input');
            checkbox.className = 'form-check-input subitem-checkbox subclas-checkbox';
            checkbox.type = 'checkbox';
            checkbox.checked = true;
            checkbox.dataset.id = subclas.id;
            checkbox.dataset.tipo = 'subclasificacion'
            checkbox.dataset.categoria = subclas.categoria_id;
            checkbox.dataset.subcategoria = subclas.subcategoria_id ?? null;

            const subclasBtn = document.createElement('button');
            subclasBtn.className = 'sidebar-suboption'
            subclasBtn.textContent = subclas.nombre;

            subclasBtn.dataset.id = subclas.id;

            itemContainer.appendChild(checkbox);
            itemContainer.appendChild(subclasBtn);

            container.appendChild(itemContainer);

            subclasBtn.addEventListener('click', function(event){
                event.stopPropagation();
                const subclasId = this.dataset.id;
                const subclasData = items.find(i => i.id == subclasId)

                window.subclasSeleccionada = subclasData
                window.activarMododibujo(subclasId);
            })
        })
    }
    restaurarEstadoVisibilidad();
}

export function restaurarEstadoVisibilidad() {

    const saved = localStorage.getItem("visibilidadFiguras");
    if (!saved) return;

    window.visibilidadFiguras = JSON.parse(saved);

    document.querySelectorAll(".categoria-checkbox, .subcat-checkbox, .subclas-checkbox")
        .forEach(cb => {
            const key = `${cb.dataset.tipo}_${cb.dataset.id}`;
            if (key in window.visibilidadFiguras) {
                cb.checked = window.visibilidadFiguras[key];
            }
        });

    actualizarVisibilidadFigurasUsuario();
}

function guardarEstadoVisibilidad() {
    document.querySelectorAll(".categoria-checkbox, .subcat-checkbox, .subclas-checkbox")
    .forEach(cb => {
        const key = `${cb.dataset.tipo}_${cb.dataset.id}`
        window.visibilidadFiguras[key] = cb.checked
    })

    localStorage.setItem('visibilidadFiguras', JSON.stringify(window.visibilidadFiguras))
}