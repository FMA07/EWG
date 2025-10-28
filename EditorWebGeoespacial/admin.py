from django.contrib import admin
from .models import Figura, Capa, Sector, Tipo_de_via, Categoria, Subcategoria, Subclasificacion, Microbasural, Cuarteles_de_bomberos, Grifos, Proyecto

# Register your models here.
admin.site.register(Proyecto)
admin.site.register(Capa)
admin.site.register(Figura)
admin.site.register(Sector)
admin.site.register(Tipo_de_via)
admin.site.register(Categoria)
admin.site.register(Subcategoria)
admin.site.register(Subclasificacion)
admin.site.register(Microbasural)
admin.site.register(Cuarteles_de_bomberos)
admin.site.register(Grifos)