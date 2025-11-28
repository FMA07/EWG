from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required, permission_required
from django.contrib.auth import login, logout
from EditorWebGeoespacial.models import Categoria, Subcategoria, Subclasificacion, Proyecto
from EditorWebGeoespacial.forms import FormularioCategoria, FormularioSubcategoria, FormularioSubclasificacion, RegistroForm, FormularioProyecto

def pagregistro(request):
    if request.method == 'POST':
        form = RegistroForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect('editor')
    else:
        form = RegistroForm()
    return render(request, 'registro.html', {'form': form})

def mapa(request):
    categorias = Categoria.objects.all()
    subcategorias = Subcategoria.objects.all()
    context = {
        "categorias": categorias,
        "subcategorias": subcategorias,
    }
    return render(request, 'mapa.html', context)

@login_required
def editor(request):    
    proyectoId = request.session.get('proyecto_activo_id')

    if not proyectoId: #Para cargar el id del último proyecto activo si se cierra sesión
        ultimoProyecto = Proyecto.objects.filter(autor=request.user).order_by('-id').first()
        if ultimoProyecto:
            request.session['proyecto_activo_id'] = ultimoProyecto.id
            proyectoId = ultimoProyecto.id

        else: #Si no hay proyecto activo, la lista de categorías queda vacía.
            return render(request, 'editor.html', {
                "categorias": Categoria.objects.none(),
                "subcategorias": Subcategoria.objects.all(),   
                "formCategoria": FormularioCategoria(),
                "formSubcategoria": FormularioSubcategoria(),
                "formSubclas": FormularioSubclasificacion(),
                "capas_importadas": [],
                "proyecto_activo": None,
            })
    #Si ya existe un proyecto activo, se cargan sus datos

    try:
        proyecto = Proyecto.objects.get(id=proyectoId, autor=request.user)
        categorias = proyecto.categoria.all()
        capas_importadas = proyecto.capa_importada.all()

    except Proyecto.DoesNotExist:
        request.session.pop('proyecto_activo_id', None)
        return render(request, 'editor.html', {
            "categorias": Categoria.objects.none(),
            "subcategorias": Subcategoria.objects.all(),   # ✔ consistente
            "formCategoria": FormularioCategoria(),
            "formSubcategoria": FormularioSubcategoria(),
            "formSubclas": FormularioSubclasificacion(),
            "capas_importadas": [],
            "proyecto_activo": None,
        })

    if request.method == 'POST':
        formCategoria = FormularioCategoria(request.POST, request.FILES)
        formSubcategoria = FormularioSubcategoria(request.POST, request.FILES)
        formSubclas = FormularioSubclasificacion(request.POST, request.FILES)

        if formCategoria.is_valid():
            formCategoria.save()
            return redirect('editor')
        if formSubcategoria.is_valid():
            formSubcategoria.save()
            return redirect('editor')
        if formSubclas.is_valid():
            formSubclas.save()
            return redirect('editor')
    else:
        formCategoria = FormularioCategoria()
        formSubcategoria = FormularioSubcategoria()
        formSubclas = FormularioSubclasificacion()

    context = {
        "categorias": categorias,
        "subcategorias": Subcategoria.objects.all(),
        'formCategoria': formCategoria,
        'formSubcategoria': formSubcategoria,
        'formSubclas': formSubclas,
        'capas_importadas': capas_importadas,
        'proyecto_activo': proyecto,
    }

    return render(request, 'editor.html', context)

@login_required
def listaCategorias(request):
    categorias = Categoria.objects.all()
    context = {
        'categorias': categorias
    }
    return render(request, 'categorias.html', context)

#__________________________________________________________//ADMIN\\_______________________________________________________________________
#||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
@permission_required('is_staff', login_url='/')
def admin_menu(request):
    return render(request, 'CRUDCapas/adminMenu.html')

@permission_required('is_staff', login_url='/')
def admin_categorias(request):
    formCategoria = FormularioCategoria()
    categorias = Categoria.objects.all().order_by('nombre')
    context = {
        'categorias': categorias,
        'formCategoria': formCategoria
    }
    return render(request, 'CRUDCapas/adminCategorias.html', context)

@permission_required('is_staff', login_url='/')
def admin_subcategorias(request):
    formSubcat = FormularioSubcategoria
    subcategorias = Subcategoria.objects.all().order_by('nombre')
    context= {
        'subcategorias': subcategorias,
        'formSubcat': formSubcat,
    }
    return render(request, 'CRUDCapas/adminSubcategorias.html', context)

@permission_required('is_staff', login_url='/')
def admin_subclas(request):
    formSubclas = FormularioSubclasificacion
    subclasificaciones = Subclasificacion.objects.all().order_by('nombre')
    context = {
        'subclasificaciones': subclasificaciones,
        'formSubclas': formSubclas,
    }
    return render(request, 'CRUDCapas/adminSubclasificaciones.html', context)
#__________________________________________________________________________________________________________________________________________
@login_required
def proyectos(request):
    formPoyecto = FormularioProyecto
    proyectos_a_mostrar = proyectos_filtrados(request.user)

    return render(request, 'proyectos.html', {'proyectos': proyectos_a_mostrar, 'formProyecto': formPoyecto})

def proyectos_filtrados(user):
    queryset_base = Proyecto.objects.select_related('autor').prefetch_related('categoria').order_by('fecha_creacion')

    if not (user.is_superuser or user.is_staff):
        return queryset_base.filter(autor = user)
    
    else:
        return queryset_base