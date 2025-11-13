from django.urls import path
from django.contrib.auth import views as auth_views
from . import views

urlpatterns = [
    path('editor', views.editor, name='editor'),
    path('mapa', views.mapa, name='mapa'),
    path('proyectos', views.proyectos, name='proyectos'),
    path('registro', views.pagregistro, name='registro'),
    path('', auth_views.LoginView.as_view(template_name="login.html"), name='login'),
    path('logout', auth_views.LogoutView.as_view(next_page='mapa'), name='logout'),
    path('listaCategorias', views.listaCategorias, name='listaCategorias'),
    path('guardar_por_ajax', views.guardar_por_ajax, name='guardar_por_ajax'),
    path('obtener_contenido_categoria/<int:categoria_id>/', views.obtener_contenido_categoria, name='obtener_contenido_categoria'),
    path('obtener_contenido_subcategoria/<int:subcategoria_id>/', views.obtener_contenido_subcategoria, name='obtener_contenido_subcategoria'),
    path('obtener_config_subclasificacion/<int:subclas_id>/', views.obtener_config_subclasificacion, name= 'obtener_config_subclasificacion'),
    path('guardar_proyecto/', views.guardar_proyecto, name='guardar_proyecto'),
    path('eliminar_proyecto/<int:proyecto_id>/', views.eliminar_proyecto, name='eliminar_proyecto'),
    path('guardar_figura/', views.guardar_figura, name='guardar_figura'),
    path('eliminar_figura/<int:figura_id>/',views.eliminar_figura, name='eliminar_figura'),
    path('importar_SHP/', views.importar_SHP, name='importar_SHP'),
    path('exportar_SHP/', views.exportar_SHP, name='exportar_SHP'),
    ]