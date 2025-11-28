from django.urls import path
from django.contrib.auth import views as auth_views
from . import pageViews

urlpatterns = [
    path('', auth_views.LoginView.as_view(template_name="login.html"), name='login'),
    path('logout', auth_views.LogoutView.as_view(next_page='mapa'), name='logout'),
    path('registro', pageViews.pagregistro, name='registro'),
    path('mapa', pageViews.mapa, name='mapa'),
    path('editor', pageViews.editor, name='editor'),
    path('listaCategorias', pageViews.listaCategorias, name='listaCategorias'),
    path('adminmenu/',pageViews.admin_menu, name='adminmenu'),
    path('adminmenu/admincategorias/', pageViews.admin_categorias, name='admin_categorias'),
    path('adminmenu/adminsubcategorias/', pageViews.admin_subcategorias, name='admin_subcategorias'),
    path('adminMenu/adminsubclasificaciones/', pageViews.admin_subclas, name='admin_subclas'),
    path('proyectos', pageViews.proyectos, name='proyectos'),
]
