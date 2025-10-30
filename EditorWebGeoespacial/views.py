from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, logout
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.http import require_GET
from .forms import RegistroForm, FormularioCategoria, FormularioSubcategoria, FormularioSubclasificacion, FormularioProyecto
from .models import Categoria, Subcategoria, Subclasificacion, Proyecto, Figura

# Create your views here.

@login_required
def editor(request):    
    formCategoria = FormularioCategoria(data= request.POST, files= request.FILES)
    formSubcategoria = FormularioSubcategoria(data= request.POST, files= request.FILES)
    formSubclas = FormularioSubclasificacion(data= request.POST, files= request.FILES)
    if request.method == 'POST':
        
        if formCategoria.is_valid():
            formCategoria.save()
            return redirect('editor')
        elif formSubcategoria.is_valid():
            formSubcategoria.save()
            return redirect('editor')
        elif formSubclas.is_valid():
            formSubclas.save()
        else:
            print("Errores en el formulario: ", formCategoria.errors)
            print("Errores en el formulario: ", formSubcategoria.errors)
            print('Errores en el formulario: ', formSubclas.errors)

    else:
        formCategoria = FormularioCategoria()
        formSubcategoria = FormularioSubcategoria()
        formSubclas = FormularioSubclasificacion()

    categorias = Categoria.objects.all()
    subcategorias = Subcategoria.objects.all()
    context = {
        "categorias": categorias,
        "subcategorias": subcategorias,
        'formCategoria': formCategoria,
        'formSubcategoria': formSubcategoria,
        'formSubclas': formSubclas,
    }
    
    return render(request, 'editor.html', context)

@login_required
def proyectos(request):
    if request.method == 'POST':
        formProyecto = FormularioProyecto(request.POST, request.FILES)
        if formProyecto.is_valid():
            proyecto = formProyecto.save(commit=False)
            proyecto.autor = request.user
            proyecto.save()
            formProyecto.save_m2m()
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                proyectos_queryset = Proyecto.objects.select_related('autor').prefetch_related('categoria').order_by('fecha_creacion')
                proyectos_data = []
                for proyecto in proyectos_queryset:
                    categorias_list = ", ".join([c.nombre for c in proyecto.categoria.all()])
                    proyectos_data.append({
                        'nombre': proyecto.nombre,
                        'autor__username': proyecto.autor.username,
                        'fecha_creacion': proyecto.fecha_creacion.strftime('%Y-%m-%d %H:%M'),
                        'categorias_list': categorias_list,
                    })
                return JsonResponse({'success': True, 'proyectos': proyectos_data})
            return redirect('proyectos')
        else:
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({'success': False, 'errors': formProyecto.errors})
            return redirect('proyectos')
    else:
        formProyecto = FormularioProyecto()
        proyectos = Proyecto.objects.all()
        return render(request, 'proyectos.html', {'proyectos': proyectos, 'formProyecto': formProyecto})

def mapa(request):
    return render(request, 'mapa.html')

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


#Vista para eliminar el localStorage al cerrar sesión
def paglogout(request):
    logout(request)
    response = redirect('mapa')
    response.set_cookie('clear_local_storage', '1', max_age=5)
    return response

#VISTAS PARA GUARDAR CATEGORIAS Y SUBCATEGORIAS MEDIANTE AJAX

def guardar_por_ajax(request):
    print("Método recibido:", request.method)
    print("POST data:", request.POST)
    if request.method == "POST":
        tipo_form = request.POST.get('tipo_form')

        if tipo_form == 'categoria':
            form = FormularioCategoria(request.POST, request.FILES)
            if form.is_valid():
                categoria = form.save()
                return JsonResponse({
                    'success': True,
                    'tipo': 'categoria',
                    'nombre': categoria.nombre,
                    'id': categoria.id,
                })
            else:
                return JsonResponse({'success': False, 'errors': form.errors})
        
        elif tipo_form == 'subcategoria':
            form = FormularioSubcategoria(request.POST, request.FILES)
            if form.is_valid():
                subcategoria = form.save()
                return JsonResponse({
                    'success': True,
                    'tipo': 'subcategoria',
                    'nombre': subcategoria.nombre,
                    'id': subcategoria.id,
                })
            else:
                return JsonResponse({'success': False, 'errors': form.errors})
            
        elif tipo_form == 'subclasificacion':
            form = FormularioSubclasificacion(request.POST, request.FILES)
            if form.is_valid():
                subclasificacion = form.save()
                return JsonResponse({
                    'success': True,
                    'tipo': 'subclasificacion',
                    'nombre': subclasificacion.nombre,
                    'id': subclasificacion.id,
                    'tipo_geometria': subclasificacion.tipo_geometria,
                    'campos_config': subclasificacion.campos_config,
                })
            else:
                return JsonResponse({'success': False, 'errors': form.errors})
        
        else:
            return JsonResponse({'success': False, 'error': 'Formulario desconocido.'})
    
    return JsonResponse({'success': False, 'error': 'Método no permitido.'})

def obtener_contenido_categoria(request, categoria_id):
    try:
        categoria = Categoria.objects.get(pk= categoria_id)
        subcategorias = Subcategoria.objects.filter(categoria= categoria).values('id', 'nombre')
        subclasificaciones_cat = Subclasificacion.objects.filter(categoria = categoria, subcategoria__isnull=True).values('id', 'nombre')
        
        return JsonResponse({
            'success': True,
            'subcategorias': list(subcategorias),
            'subclasificaciones_cat': list(subclasificaciones_cat),
        })

    except Categoria.DoesNotExist:
        return JsonResponse({'error': 'Categoría no encontrada'}, status = 404)
    
def obtener_contenido_subcategoria(request, subcategoria_id):
    try:
        subclasificacion = Subclasificacion.objects.filter(subcategoria_id=subcategoria_id).values('id', 'nombre')
        return JsonResponse({
            'tipo': 'subclasificacion',
            'items': list(subclasificacion)
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    
#VISTA PARA CONSEGUIR LA CONFIGURACIÓN DE LA SUBCLASIFICACION

@require_GET

def obtener_config_subclasificacion(request, subclas_id):
    try:
        sub = Subclasificacion.objects.get(pk=subclas_id)
        import json

        try:
            campos = json.loads(sub.campos_config) if isinstance(sub.campos_config, str) else sub.campos_config
        except json.JSONDecodeError:
            campos = []
        return JsonResponse({
            'success': True,
            'nombre': sub.nombre,
            'tipo_geometria': sub.tipo_geometria,
            'campos': sub.campos_config
        })
    except Subclasificacion.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Subclasificación no encontrada'})
    
# Vista para eliminar un proyecto
def eliminar_proyecto(request, proyecto_id):
    proyecto = get_object_or_404(Proyecto, pk=proyecto_id)
    if request.method == 'POST':
        proyecto.delete()
        return JsonResponse({'success': True})
    return JsonResponse({'success': False, 'error': 'Método no permitido.'})