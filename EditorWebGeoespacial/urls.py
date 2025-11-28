from django.urls import path, include
from . import views

urlpatterns = [
    path('guardar_categoria/', views.guardar_categoria, name="guardar_categoria"),
    path('editar_categoria/<int:categoria_id>/', views.editar_categoria, name='editar_categoria'),
    path('guardar_subcategoria/', views.guardar_subcategoria, name='guardar_subcategoria'),
    path('editar_subcategoria/<int:subcatId>/', views.editar_subcat, name='editar_subcat'),
    path('eliminar_subcat/<int:subcatId>/', views.eliminar_subcat, name='eliminar_subcat'),
    path('asociar_categoria_a_proyecto/', views.asociar_categoria_a_proyecto, name='asociar_categorias_a_proyecto'),
    path('eliminar_categoria/<int:categoria_id>/', views.eliminar_categoria, name='eliminar_categoria'),
    path('guardar_subclasificacion/', views.guardar_subclas, name='guardar_subclas'),
    path('editar_subclasificacion/<int:subclasId>/', views.editar_subclas, name='editar_subclas'),
    path('eliminar_subclasificacion/<int:subclasId>/', views.eliminar_subclas, name='eliminar_subclas'),
    #path('guardar_por_ajax', views.guardar_por_ajax, name='guardar_por_ajax'),
    path('obtener_contenido_categoria/<int:categoria_id>/', views.obtener_contenido_categoria, name='obtener_contenido_categoria'),
    path('obtener_contenido_subcategoria/<int:subcategoria_id>/', views.obtener_contenido_subcategoria, name='obtener_contenido_subcategoria'),
    path('obtener_config_subclasificacion/<int:subclas_id>/', views.obtener_config_subclasificacion, name= 'obtener_config_subclasificacion'),
    path('activar_proyecto/<int:proyecto_id>/', views.activar_proyecto, name='activar_proyecto'),
    path('guardar_proyecto/', views.guardar_proyecto, name='guardar_proyecto'),
    path('eliminar_proyecto/<int:proyecto_id>/', views.eliminar_proyecto, name='eliminar_proyecto'),
    path('guardar_figura/', views.guardar_figura, name='guardar_figura'),
    path('editar_figura/<int:figura_id>/', views.editar_figura, name='editar_figura'),
    path('eliminar_figura/<int:figura_id>/',views.eliminar_figura, name='eliminar_figura'),
    path('importar_SHP/', views.importar_SHP, name='importar_SHP'),
    path('capas_del_proyecto/', views.capas_del_proyecto, name='capas_del_proyecto'),
    path('exportar_SHP/', views.exportar_SHP, name='exportar_SHP'),
    path('eliminar_capa_importada/<int:capa_id>/', views.eliminar_capa_importada, name='eliminar_capa_importada'),
    path('cargar_figuras_publicas/', views.cargar_figuras_publicas, name='cargar_figuras_publicas'),
    path('', include('EditorWebGeoespacial.pages.pageUrls'))
    ]