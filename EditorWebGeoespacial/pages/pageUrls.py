from django.urls import path
from django.contrib.auth import views as auth_views
from . import renderViews

urlpatterns = [
    path('', auth_views.LoginView.as_view(template_name="login.html"), name='login'),
    path('logout', auth_views.LogoutView.as_view(next_page='mapa'), name='logout'),
    path('registro', renderViews.pagregistro, name='registro'),
    path('mapa', renderViews.mapa, name='mapa'),
    path('editor', renderViews.editor, name='editor'),
    path('listaCategorias', renderViews.listaCategorias, name='listaCategorias'),
    path('adminmenu/',renderViews.admin_menu, name='adminmenu'),
    path('adminmenu/admincategorias/', renderViews.admin_categorias, name='admin_categorias'),
    path('adminmenu/adminsubcategorias/', renderViews.admin_subcategorias, name='admin_subcategorias'),
    path('adminMenu/adminsubclasificaciones/', renderViews.admin_subclas, name='admin_subclas'),
    path('proyectos', renderViews.proyectos, name='proyectos'),
]
