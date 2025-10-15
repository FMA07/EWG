from django.shortcuts import render, redirect
from django.contrib.auth import login, logout
from django.contrib.gis.geos import GEOSGeometry
from django.http import JsonResponse
from .forms import RegistroForm, FormularioCategoria, FormularioSubcategoria
from .models import Categoria, Subcategoria, Figura

# Create your views here.

def editor(request):    
    formCategoria = FormularioCategoria(data= request.POST, files= request.FILES)
    formSubcategoria = FormularioSubcategoria(data= request.POST, files= request.FILES)
    if request.method == 'POST':
        
        if formCategoria.is_valid():
            formCategoria.save()
            return redirect('editor')
        elif formSubcategoria.is_valid():
            formSubcategoria.save()
            return redirect('editor')
        else:
            print("Errores en el formulario: ", formCategoria.errors)
            print("Errores en el formulario: ", formSubcategoria.errors)

    else:
        formCategoria = FormularioCategoria()
        formSubcategoria = FormularioSubcategoria()

    categorias = Categoria.objects.all()
    subcategorias = Subcategoria.objects.all()
    context = {
        "categorias": categorias,
        "subcategorias": subcategorias,
        'formCategoria': formCategoria,
        'formSubcategoria': formSubcategoria,
    }
    
    return render(request, 'editor.html', context)

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

def paglogin(request):
    return render(request, 'login.html')

#Vista para eliminar el localStorage al cerrar sesión
def paglogout(request):
    logout(request)
    response = redirect('editor')
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

        else:
            return JsonResponse({'success': False, 'error': 'Formulario desconocido.'})
    
    return JsonResponse({'success': False, 'error': 'Método no permitido.'})

def obtener_contenido_categoria(request, categoria_id):
    try:
        categoria = Categoria.objects.get(pk= categoria_id)
        subcategorias = Subcategoria.objects.filter(categoria= categoria).values('id', 'nombre')
        figuras = Figura.objects.filter(categoria= categoria).values('id', 'coordenadas')
        
        if subcategorias.exists():
            return JsonResponse({
                'tipo': 'subcategorias',
                'items': list(subcategorias)
            })

        else:
            return JsonResponse ({
                'tipo': 'figuras',
                'items': list(figuras)
            })

    except Categoria.DoesNotExist:
        return JsonResponse({'error': 'Categoría no encontrada'}, status = 404)
    
def obtener_contenido_subcategoria(request, subcategoria_id):
    try:
        figuras = Figura.objects.filter(subcategoria_id=subcategoria_id).values('id', 'coordenadas')
        return JsonResponse({
            'tipo': 'figuras',
            'items': list(figuras)
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)