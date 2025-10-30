from django.contrib import admin
from .models import Figura, Capa, Sector, Tipo_de_via, Categoria, Subcategoria, Subclasificacion, Proyecto

# Register your models here.
class ProyectoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'autor', 'fecha_creacion', 'get_categorias_list')
    
    def get_categorias_list(self, obj):
        return ", ".join([c.nombre for c in obj.categoria.all()])
    get_categorias_list.short_description = 'Categorías asociadas'

admin.site.register(Proyecto, ProyectoAdmin)
admin.site.register(Capa)
admin.site.register(Figura)
admin.site.register(Sector)
admin.site.register(Tipo_de_via)
admin.site.register(Categoria)
admin.site.register(Subcategoria)
admin.site.register(Subclasificacion)