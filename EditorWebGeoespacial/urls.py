from django.urls import path
from django.contrib.auth import views as auth_views
from . import views

urlpatterns = [
    path('editor', views.editor, name='editor'),
    path('registro', views.pagregistro, name='registro'),
    path('login', auth_views.LoginView.as_view(template_name="login.html"), name='login'),
    path('logout', auth_views.LogoutView.as_view(next_page='editor'), name='logout'),
    path('guardar_por_ajax', views.guardar_por_ajax, name='guardar_por_ajax'),
    path('obtener_contenido_categoria/<int:categoria_id>/', views.obtener_contenido_categoria, name='obtener_contenido_categoria'),
    path('obtener_contenido_subcategoria/<int:subcategoria_id>/', views.obtener_contenido_subcategoria, name='obtener_contenido_subcategoria'),
    path('obtener_config_subclasificacion/<int:subclas_id>/', views.obtener_config_subclasificacion, name= 'obtener_config_subclasificacion')
    ]