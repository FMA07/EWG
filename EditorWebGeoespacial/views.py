from django.shortcuts import redirect, get_object_or_404
from django.contrib.auth import logout
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_GET
from django.views.decorators.csrf import csrf_exempt
from django.contrib.gis.geos import GEOSGeometry
from .forms import FormularioCategoria, FormularioSubcategoria, FormularioSubclasificacion, FormularioProyecto
from .models import Categoria, Subcategoria, Subclasificacion, Proyecto, Figura, Capa_importada
import json
import io
import os
import zipfile
import tempfile
import geopandas as gpd
from shapely.geometry import shape


# Create your views here.
#-------------------------------------------------/CRUD CAPAS\----------------------------------------------------------------
def guardar_categoria(request):
    if request.method == 'POST':
        form = FormularioCategoria(request.POST, request.FILES)
        if form.is_valid():
            nueva_categoria = form.save()

            categorias = list(Categoria.objects.values('id', 'nombre'))
            return JsonResponse({
                'success': True,
                'nombre': nueva_categoria.nombre,
                'id': nueva_categoria.id,
                'categorias': categorias
            })
        return JsonResponse({'success': False, 'errors': form.errors})

    return JsonResponse({'success': False, 'error': 'Método no permitido'})

def editar_categoria(request, categoria_id):
    categoria = get_object_or_404(Categoria, pk=categoria_id)
    if request.method == 'GET':
        return JsonResponse({
            'id': categoria.id,
            'nombre': categoria.nombre
        })
    elif request.method == 'POST':
        form = FormularioCategoria(request.POST, instance=categoria)

        if form.is_valid():
            form.save()

            categorias = list(Categoria.objects.values('id', 'nombre'))

            return JsonResponse({
                'success': True,
                'nombre': categorias.nombre,
                'id': categorias.id,
                'categorias': categorias
            })
        else:
            return JsonResponse({'success': False, 'errors': form.errors})
    
    return JsonResponse({'success': False, 'error': 'Método no permitido'})

def eliminar_categoria(request, categoria_id):
    categoria = get_object_or_404(Categoria, pk=categoria_id)
    if request.method == 'POST':
        categoria.delete()
        return JsonResponse({'success': True})
    return JsonResponse({'success': False, 'error': 'Método no permitido.'})

def obtener_categoria(request, categoria_id):
    categoria = get_object_or_404(Categoria, id=categoria_id)

    return JsonResponse({
        'id': categoria.id,
        'nombre': categoria.nombre
    })

def guardar_subcategoria(request):
    if request.method == "POST":
        form = FormularioSubcategoria(request.POST, request.FILES)
        if form.is_valid():
            nueva_subcat = form.save()

            categoria_id = nueva_subcat.categoria.id
            subcategorias = list(Subcategoria.objects.values('id', 'nombre', 'categoria__nombre'))
            return JsonResponse({
                'success': True,
                'tipo': 'subcategoria',
                'nombre': nueva_subcat.nombre,
                'id': nueva_subcat.id,
                'categoria_id': categoria_id,
                'subcategorias': subcategorias,
            })
        else:
            return JsonResponse({'success': False, 'errors': form.errors})
    return JsonResponse({'success': False, 'error': 'Método no permitido', 'code': 405})

def editar_subcat(request, subcatId):
    subcategoria = get_object_or_404(Subcategoria, pk=subcatId)
    if request.method == "GET":
        return JsonResponse({
            'id': subcategoria.id,
            'nombre': subcategoria.nombre,
            'categoria': subcategoria.categoria.nombre,
        })
    elif request.method == "POST":
        form = FormularioSubcategoria(request.POST, instance=subcategoria)

        if form.is_valid():
            subcatActual = form.save()

            subcategorias = list(Subcategoria.objects.values('id', 'nombre', 'categoria__nombre'))
            return JsonResponse({
                'success': True,
                'tipo': 'subcategoria',
                'nombre': subcatActual.nombre,
                'id': subcatActual.id,
                'categoria_id': subcatActual.categoria.id,
                'subcategorias': subcategorias,
            })
        else:
            return JsonResponse({'success': False, 'errors': form.errors})
        
    return JsonResponse({'success': False, 'error': 'Método no permitido'})

def eliminar_subcat(request, subcatId):
    subcategoria = get_object_or_404(Subcategoria, pk=subcatId)
    if request.method == "POST":
        subcategoria.delete()
        return JsonResponse({'success': True})
    return JsonResponse({'success': False, 'error': 'Método no permitido.'})

def guardar_subclas(request):
    if request.method == "POST":
        form = FormularioSubclasificacion(request.POST, request.FILES)
        if form.is_valid():
            nueva_subclas = form.save(commit=False)

            import json
            campos_json = request.POST.get("campos_config", "[]")
            nueva_subclas.campos_config = json.loads(campos_json)

            nueva_subclas.save()

            subclasificaciones = []

            for s in Subclasificacion.objects.select_related('categoria', 'subcategoria').order_by('nombre'):
                subclasificaciones.append({
                    "id": s.id,
                    "nombre": s.nombre,
                    "subcategoria": s.subcategoria.nombre if s.subcategoria else None,
                    "categoria": s.categoria.nombre,
                })
            return JsonResponse({
                'success': True,
                'nombre': nueva_subclas.nombre,
                'id': nueva_subclas.id,
                'subclasificaciones': subclasificaciones,
            })
        else:
            return JsonResponse({'success': False, 'errors': form.errors})
    return JsonResponse({'success': False, 'error': 'Método no permitido'})

def editar_subclas(request, subclasId):
    subclasificacion = get_object_or_404(Subclasificacion, pk=subclasId)
    if request.method == "GET":
        return JsonResponse({
            'id': subclasificacion.id,
            'nombre': subclasificacion.nombre,
            'subcategoria': subclasificacion.subcategoria_id,
            'categoria': subclasificacion.categoria_id,
            'tipo_geometria': subclasificacion.tipo_geometria,
            'campos_config': subclasificacion.campos_config,
        })
    
    elif request.method == "POST":
        form = FormularioSubclasificacion(request.POST, instance=subclasificacion)

        if form.is_valid():
            sub_obj = form.save(commit=False)

            import json
            campos_json = request.POST.get("campos_config", "[]")
            sub_obj.campos_config = json.loads(campos_json)

            if sub_obj.subcategoria:
                sub_obj.categoria = sub_obj.subcategoria.categoria

            else:
                if sub_obj.categoria is None:
                        return JsonResponse({
                        'success': False,
                        'errors': {"categoria": ["La categoría es obligatoria"]},
                    })

            sub_obj.save()
        
            subclasificaciones = []

            for s in Subclasificacion.objects.select_related('categoria', 'subcategoria').order_by('nombre'):
                subclasificaciones.append({
                    "id": s.id,
                    "nombre": s.nombre,
                    "subcategoria": s.subcategoria.nombre if s.subcategoria else None,
                    "categoria": s.categoria.nombre,
                })

            return JsonResponse({
                'success': True,
                'id': sub_obj.id,
                'nombre': sub_obj.nombre,
                'subclasificaciones': subclasificaciones,
            })

        return JsonResponse({'success': False, 'errors': form.errors})

    return JsonResponse({'success': False, 'error': 'Método no permitido'})

def eliminar_subclas(request, subclasId):
    subclasificacion = get_object_or_404(Subclasificacion, pk=subclasId)
    if request.method == "POST":
        subclasificacion.delete()
        return JsonResponse({'success': True})
    return JsonResponse({'success': False, 'error': 'Método no permitido.'})

#____________________________________________________________________________________________________________________________
@login_required
def asociar_categoria_a_proyecto(request):
    if request.method == "POST":
        proyecto_id = request.POST.get('proyecto_id')
        categorias_ids = request.POST.getlist("categorias")

        if not proyecto_id or not categorias_ids:
            return JsonResponse({"success": False, "error": 'Faltan datos.'})
        
        proyecto = get_object_or_404(Proyecto, id= proyecto_id, autor=request.user)

        categorias_ya_asociadas = []
        categorias_agregadas = []

        for cat_id in categorias_ids:
            categoria = Categoria.objects.get(id = cat_id)
            if proyecto.categoria.filter(id = cat_id).exists():
                categorias_ya_asociadas.append(categoria.nombre)

            else:
                proyecto.categoria.add(cat_id)
                categorias_agregadas.append(categoria.nombre)

        return JsonResponse({"success": True, "categorias_agregadas": categorias_agregadas, "categorias_ya_asociadas": categorias_ya_asociadas})
    
    return JsonResponse({"success": False, "error": "Método no permitido"})


#Vista para eliminar el localStorage al cerrar sesión
def paglogout(request):
    request.session.pop("proyecto_activo_id", None)
    logout(request)
    response = redirect('mapa')
    response.set_cookie('clear_local_storage', '1', max_age=5)
    return response
#CÓDIGO USADO PARA GUARDAR LAS CATEGORIAS, SUBCATEGORIAS Y SUBCLASIFICACIONES CREADAS EN EL EDITOR
#VISTAS PARA GUARDAR CATEGORIAS Y SUBCATEGORIAS MEDIANTE AJAX

# def guardar_por_ajax(request):
#     print("Método recibido:", request.method)
#     print("POST data:", request.POST)
#     if request.method == "POST":
#         tipo_form = request.POST.get('tipo_form')

#         if tipo_form == 'categoria':
#             form = FormularioCategoria(request.POST, request.FILES)
#             if form.is_valid():
#                 categoria = form.save()

#                 categorias = list(Categoria.objects.values('id', 'nombre'))
#                 return JsonResponse({
#                     'success': True,
#                     'tipo': 'categoria',
#                     'nombre': categoria.nombre,
#                     'id': categoria.id,
#                     'categorias':categorias,
#                 })
#             else:
#                 return JsonResponse({'success': False, 'errors': form.errors})
        
#         elif tipo_form == 'subcategoria':
#             form = FormularioSubcategoria(request.POST, request.FILES)
#             if form.is_valid():
#                 subcategoria = form.save()
#                 return JsonResponse({
#                     'success': True,
#                     'tipo': 'subcategoria',
#                     'nombre': subcategoria.nombre,
#                     'id': subcategoria.id,
#                 })
#             else:
#                 return JsonResponse({'success': False, 'errors': form.errors})
            
#         elif tipo_form == 'subclasificacion':
#             form = FormularioSubclasificacion(request.POST, request.FILES)
#             if form.is_valid():
#                 subclasificacion = form.save()
#                 return JsonResponse({
#                     'success': True,
#                     'tipo': 'subclasificacion',
#                     'nombre': subclasificacion.nombre,
#                     'id': subclasificacion.id,
#                     'tipo_geometria': subclasificacion.tipo_geometria,
#                     'campos_config': subclasificacion.campos_config,
#                 })
#             else:
#                 return JsonResponse({'success': False, 'errors': form.errors})
        
#         else:
#             return JsonResponse({'success': False, 'error': 'Formulario desconocido.'})
    
#     return JsonResponse({'success': False, 'error': 'Método no permitido.'})

def obtener_contenido_categoria(request, categoria_id):
    try:
        categoria = Categoria.objects.get(pk= categoria_id)
        subcategorias = Subcategoria.objects.filter(categoria= categoria).values('id', 'nombre', 'categoria_id')
        subclasificaciones_cat = Subclasificacion.objects.filter(categoria = categoria, subcategoria__isnull=True).values('id', 'nombre', 'categoria_id')
        
        return JsonResponse({
            'success': True,
            'subcategorias': list(subcategorias),
            'subclasificaciones_cat': list(subclasificaciones_cat),
        })

    except Categoria.DoesNotExist:
        return JsonResponse({'error': 'Categoría no encontrada'}, status = 404)
    
def obtener_contenido_subcategoria(request, subcategoria_id):
    try:
        subclasificacion = Subclasificacion.objects.filter(subcategoria_id=subcategoria_id).values('id', 'nombre', 'subcategoria_id', 'categoria_id')
        return JsonResponse({
            'tipo': 'subclasificacion',
            'items': list(subclasificacion),
            
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
            'id': sub.id,
            'nombre': sub.nombre,
            'tipo_geometria': sub.tipo_geometria,
            'categoria_id': sub.categoria.id,
            'subcategoria_id': sub.subcategoria.id if sub.subcategoria else None,
            'campos': sub.campos_config,
        })
    except Subclasificacion.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Subclasificación no encontrada'})
    
def proyectos_filtrados(user):
    queryset_base = Proyecto.objects.select_related('autor').prefetch_related('categoria').order_by('fecha_creacion')

    if not (user.is_superuser or user.is_staff):
        return queryset_base.filter(autor = user)
    
    else:
        return queryset_base

def guardar_proyecto(request):
    if request.method == 'POST':
        formProyecto = FormularioProyecto(request.POST, request.FILES)
        if formProyecto.is_valid():
            proyecto = formProyecto.save(commit=False)
            proyecto.autor = request.user
            proyecto.save()
            formProyecto.save_m2m()

            #Para marcar el proyecto como activo
            request.session['proyecto_activo_id'] = proyecto.id

            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                proyectos_queryset = proyectos_filtrados(request.user)
                proyectos_data = []
                for proyecto in proyectos_queryset:
                    categorias_list = ", ".join([c.nombre for c in proyecto.categoria.all()])
                    proyectos_data.append({
                        'id': proyecto.id,
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

#Función para cargar un proyecto
@login_required
def activar_proyecto(request, proyecto_id):
    proyecto = get_object_or_404(Proyecto, pk=proyecto_id, autor=request.user)
    Proyecto.objects.filter(autor=request.user).update(activo=False)
    request.session['proyecto_activo_id'] = proyecto.id
    categoria_ids = list(proyecto.categoria.values_list('id', flat=True))

    proyecto.activo = True
    proyecto.save()

    return JsonResponse({
        'success': True,
        'proyecto_id': proyecto_id,
        'categoria_ids': categoria_ids,
    })

# Vista para eliminar un proyecto
def eliminar_proyecto(request, proyecto_id):
    proyecto = get_object_or_404(Proyecto, pk=proyecto_id)
    if request.method == 'POST':
        proyecto.delete()
        return JsonResponse({'success': True})
    return JsonResponse({'success': False, 'error': 'Método no permitido.'})

#Vista para guardar una nueva figura con sus atributos
@login_required
def guardar_figura(request):
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Método no permitido'}, status = 405)
    try:
        data = json.loads(request.body)
        print("Datos recibidos: ", data)

        proyecto_id = request.session.get('proyecto_activo_id')
        if not proyecto_id:
            return JsonResponse({'success': False, 'error': 'No hay proyecto activo'}, status = 400)
        proyecto = Proyecto.objects.get(id=proyecto_id)
        subclas_id = data.get('subclasificacion_id')
        atributos = data.get('atributos')
        geometria_json = data.get('geometria')

        if not subclas_id:
            return JsonResponse({'success': False, 'error': 'Faltan datos'}, status = 400)
        
        if not geometria_json:
            return JsonResponse({'success': False, 'error': 'Falta geometría'}, status = 400)
        
        subclasificacion = Subclasificacion.objects.get(pk=subclas_id)

        #Esta parte transforma la proyección 
        geom = GEOSGeometry(json.dumps(geometria_json), srid=4326)
        geom.transform(32719)

        figura = Figura.objects.create(
            proyecto = proyecto,
            usuario = request.user,
            geom = geom,
            atributos = atributos,
            subclasificacion = subclasificacion,
            capa_importada = None,
            tipo = "usuario"
        )

        return JsonResponse({'success': True, 'message': 'Figura guardada correctamente', 'id': figura.id})
    
    except Exception as e:
        print('Error guardando figura: ', e)
        return JsonResponse({'success': False, 'error': str(e)}, status=400)
    
def editar_figura(request, figura_id):
    if request.method != "POST":
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    try:
        figura = get_object_or_404(Figura, id=figura_id)

        data = json.loads(request.body)
        geom_json = data.get("geometry")
        atributos = data.get("atributos")

        if not geom_json:
            return JsonResponse({'error': 'Falta geometría'}, status=400)

        # Transformación
        geom = GEOSGeometry(json.dumps(geom_json), srid=4326)
        geom.transform(32719)

        # Guardar cambios
        figura.geom = geom
        figura.atributos = atributos
        figura.save()

        return JsonResponse({'success': True})

    except Exception as e:
        print("Error guardando figura editada:", e)
        return JsonResponse({'error': str(e)}, status=500)

def eliminar_figura(request, figura_id):
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Método no permitido'}, status = 405)
    
    try:
        figura = get_object_or_404(Figura, pk=figura_id)

        figura.delete()

        return JsonResponse({'success': True}, status = 200)
    
    except Exception as e:
        print("Error eliminando figura: ", e)
        return JsonResponse({'success': False, 'error': str(e)}, status = 500)   

@login_required
def capas_del_proyecto(request):
    proyecto_id = request.session.get('proyecto_activo_id')

    if not proyecto_id:
        return JsonResponse({'error': 'No hay proyecto activo'}, status = 400)
    
    try:
        proyecto = Proyecto.objects.get(id=proyecto_id)
    except Proyecto.DoesNotExist:
        return JsonResponse({'error': 'Proyecto inválido'}, status = 404)
    
    # Para capas importadas __________________________________________________________
    capas_importadas = proyecto.capa_importada.all()

    respuesta = []

    for capa in capas_importadas:
        figuras_lista = []

        for figura in capa.features.all():
            geom_utm = figura.geom
            geom_4326 = geom_utm.clone()
            geom_4326.transform(4326)

            figuras_lista.append({
                "type": "Feature",
                "geometry": json.loads(geom_4326.geojson),
                "properties": figura.atributos,
                "feature_id": figura.id,
                "tipo": "importada",
            })

        respuesta.append({
            "nombre": capa.nombre,
            "capa_id": capa.id,
            "features": figuras_lista,
        })

    #________________________________________________________________________
    #Para figuras creadas por el usuario

    figuras_usuario = Figura.objects.filter(proyecto = proyecto, tipo = "usuario")

    lista_figuras_usuario = []

    for figura in figuras_usuario:
        geom_utm = figura.geom
        geom_4326 = geom_utm.clone()
        geom_4326.transform(4326)
        sub = figura.subclasificacion

        lista_figuras_usuario.append({
            "type": "Feature",
            "geometry": json.loads(geom_4326.geojson),
            "properties": {
                **figura.atributos,
                "categoria_id": sub.categoria.id,
                "subcategoria_id": sub.subcategoria.id if sub.subcategoria else None,
                "subclasificacion_id": sub.id,
            },
            "feature_id": figura.id,
            "tipo": "usuario",
        })

    respuesta.append({
        "nombre": "Figuras del usuario",
        "capa_id": None,
        "tipo": "usuario",
        "features": lista_figuras_usuario
    })

    return JsonResponse({"capas": respuesta})

@login_required
def eliminar_capa_importada(request, capa_id):
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Método no permitido'}, status = 405)
    
    try:
        capa = get_object_or_404(Capa_importada, id=capa_id)

        proyecto_id = request.session.get('proyecto_activo_id')

        if not proyecto_id or capa.proyecto.id != proyecto_id:
            return JsonResponse({'success': False, 'error': 'La capa no pertenece al proyecto activo'}, status = 403)
        
        nombre = capa.nombre

        capa.delete()

        return JsonResponse({'success': True, 'mensaje': f"Capa '{nombre}' eliminada" })
    
    except Exception as e:
        print('Error eliminando capa importada: ', e)
        return JsonResponse({'success': False, 'error': str(e)}, status = 500)

#______________________________________________________IMPORTACION Y EXPORTACION DE SHAPES____________________________________________________
#---------------------------------------------------------------------------------------------------------------------------------------------
@csrf_exempt
def importar_SHP(request):
    if request.method != 'POST' or 'file' not in request.FILES:
        return JsonResponse({'error': 'Petición inválida'}, status = 400)
    
    proyecto_id = request.session.get('proyecto_activo_id')
    if not proyecto_id:
        return JsonResponse({'error': 'No hay un proyecto activo al que importar'}, status = 400)

    archivo_zip = request.FILES['file']
    
    try:
        proyecto = Proyecto.objects.get(id=proyecto_id)

    except Proyecto.DoesNotExist:
        return JsonResponse({'error': 'Proyecto no encontrado'}, status=404)
    
    #Para evitar importar dos veces la misma capa a un proyecto, se revisa el nombre del archivo
    nombre_capa = os.path.splitext(archivo_zip.name)[0]

    if Capa_importada.objects.filter(proyecto=proyecto, nombre=nombre_capa).exists():
        return JsonResponse({'success': False, 'error': f'La capa "{nombre_capa}" ya existe en este proyecto.'}, status=400)

    try:
        with tempfile.TemporaryDirectory() as temp_dir:
            zip_path = os.path.join(temp_dir, archivo_zip.name)

            with open(zip_path, 'wb') as f:
                for chunk in archivo_zip.chunks():
                    f.write(chunk)

            gdf = gpd.read_file(f"zip://{zip_path}")

            if gdf.empty:
                return JsonResponse({'error': 'El shapefile no contiene figuras'})

            if not gdf.crs:
                return JsonResponse({'error': 'El SHP no tiene .prj (CRS no definido)'}, status=400)

            gdf_utm = gdf.to_crs(epsg=32719)

            capa = Capa_importada.objects.create(
                nombre = os.path.splitext(archivo_zip.name)[0],
                proyecto = proyecto,
                usuario = request.user,
                tipo_geometria = gdf_utm.geom_type.iloc[0],
            )

            for idx, row in gdf_utm.iterrows():
                geom_shp = row.geometry
                if geom_shp is None:
                    continue

                geom_utm = GEOSGeometry(geom_shp.wkt, srid=32719)
                atributos = row.drop(labels=['geometry']).to_dict()

                Figura.objects.create(
                    proyecto = proyecto,
                    usuario = request.user,
                    capa_importada = capa,
                    geom = geom_utm,
                    atributos = atributos,
                    tipo = "importada"
                )

            gdf_4326 = gdf_utm.to_crs(epsg=4326)
            geojson_data = json.loads(gdf_4326.to_json())

            return JsonResponse({
                'success': True,
                'geojson': geojson_data,
                'capa_id': capa.id,
                "tipo_geometria": capa.tipo_geometria,
                'message': 'Capa importada y guardada en Base de Datos'
            })
        
    except Exception as e:
        print(f"Error procesando Shapefile subido: {e}")
        return JsonResponse({'error': f'Error al procesar el Shapefile ZIP: {str(e)}'}, status = 500)
    
@csrf_exempt
def exportar_SHP(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Solo se permiten peticiones POST'}, status=405)
    
    try:
        data = json.loads(request.body)
        geojson_data = data.get('geojson')
        file_name_base = data.get('filename', 'export_shp')
        file_name_clean = ''.join(c if c.isalnum() or c in ('-', '_') else '_' for c in file_name_base)
        final_filename = f'{file_name_clean}.zip'
        if not file_name_clean:
            file_name_clean = 'capa_exportada'
            
        if not geojson_data or 'features' not in geojson_data:
            return JsonResponse({'error': 'Datos geojson incompletos o inválidos'}, status = 400)
     
        geometries = []
        properties = []

        for feature in geojson_data['features']:
            try:
                geom = shape(feature['geometry'])
                props = feature['properties']

                geometries.append(geom)
                properties.append(props)

            except Exception as e:
                print(f"Error procesando feature: {e}")
                continue

        if not geometries:
            return JsonResponse({'error': 'No hay geometrías válidas para exportar'}, status = 400)
        
        geometryTypes = {geom.geom_type for geom in geometries}

        if len(geometryTypes) >1:
            error_msg = f'Error de exportación. Sólo se soporta un tipo de geometría por capa ({", ".join(geometryTypes)})'
            return JsonResponse({'error': error_msg}, status = 400)

        gdf = gpd.GeoDataFrame(properties, geometry = geometries, crs = "EPSG: 4326")

        with tempfile.TemporaryDirectory() as temp_dir:
            shapefile_base_path = os.path.join(temp_dir, file_name_clean + '.shp')

            gdf.to_file(shapefile_base_path, driver= 'ESRI Shapefile', encoding='utf-8')

            zip_buffer = io.BytesIO()

            file_paths = [os.path.join(temp_dir, f) for f in os.listdir(temp_dir) if f.startswith(file_name_clean)]

            with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
                for full_path in file_paths:
                    zf.write(full_path, os.path.basename(full_path))

            zip_buffer.seek(0)

            response = HttpResponse(zip_buffer, content_type= 'application/zip')
            response['Content-Disposition'] = f'attachment; filename="{final_filename}"'
            return response
    
    except Exception as e:
        print(f"Error al exportar shapefile: {e}")
        return JsonResponse({'error': f'Error interno del servidor: {str(e)}'}, status = 500)
    
def cargar_figuras_publicas(request):
    subclas_publicas = Subclasificacion.objects.filter(publica=True)
    figuras = Figura.objects.filter(subclasificacion__in=subclas_publicas)

    listaFiguras = []

    for fig in figuras:
        subclas = fig.subclasificacion

        geom_4326 = fig.geom.transform(4326, clone=True)
        geom_json = {
            "type": "Feature",
            "properties": fig.atributos,
            "geometry": json.loads(geom_4326.json)
        }

        listaFiguras.append({
            "id": fig.id,
            "geom": geom_json,
            "atributos": fig.atributos,
            "subclasificacion": subclas.nombre if subclas else None,
            "subcategoria": subclas.subcategoria.nombre if subclas and subclas.subcategoria else None,
            "categoria": subclas.categoria.nombre if subclas else None,
        })

    return JsonResponse({"figuras": listaFiguras})
