from django.contrib import admin
from .models import Figura, Capa, Sector, Tipo_de_via, Categoria, Subcategoria, Microbasural, Cuarteles_de_bomberos, Grifos

# Register your models here.
admin.site.register(Capa)
admin.site.register(Figura)
admin.site.register(Sector)
admin.site.register(Tipo_de_via)
admin.site.register(Categoria)
admin.site.register(Subcategoria)
admin.site.register(Microbasural)
admin.site.register(Cuarteles_de_bomberos)
admin.site.register(Grifos)