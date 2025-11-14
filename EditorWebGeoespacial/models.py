from django.conf import settings
from django.core.exceptions import ValidationError
from django.contrib.gis.db import models #PARA QUE FUNCIONE HAY QUE INSTALAR GDAL Y POSTGIS

# Create your models here.
#__________________________________________//PROYECTO\\______________________________________

class Proyecto(models.Model):
    nombre              = models.CharField(max_length=100)
    autor               = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    fecha_creacion      = models.DateTimeField(auto_now_add=True)
    categoria           = models.ManyToManyField('Categoria', related_name= 'proyectos')

    activo              = models.BooleanField(default=False)

    def __str__(self):
        return f'{self.nombre}. Fecha de creación: {self.fecha_creacion}. Autor: {self.autor.username}'

#_____________________________________//CAPAS, CATEGORIAS Y SUBCATEGORIAS\\___________________

class Categoria(models.Model):
    nombre              = models.CharField(max_length=100) #Ejemplo, Ambiental, Servicios, Seguridad, Vialidad, etc

    def __str__(self):
        return self.nombre

class Subcategoria(models.Model):
    categoria           = models.ForeignKey(Categoria, on_delete=models.CASCADE)
    nombre              = models.CharField(max_length=100) #Ejemplo, para Ambiental: microbasurales, focos de incendio, etc

    def __str__(self):
        return self.nombre
    
class Subclasificacion(models.Model):
    OPCIONES_GEOMETRIA  = [
        ('Point', 'Punto'),
        ('LineString', 'PoliLínea'),
        ('Polygon', 'Polígono'),
    ]
    categoria           = models.ForeignKey(Categoria, on_delete=models.CASCADE)
    subcategoria        = models.ForeignKey(Subcategoria, on_delete=models.CASCADE, blank=True, null=True)
    nombre              = models.CharField(max_length=100) #Ejemplo: microbasurales < distintos microbasurales; grifos < distintos grifos
    tipo_geometria      = models.CharField(max_length=20, choices=OPCIONES_GEOMETRIA, default='')
    campos_config       = models.JSONField(default=list, blank=True)
    
    def __str__(self):
        return self.nombre
#Estoy pensando en eliminar Capa. Proyecto cumple la misma función
class Capa(models.Model):
    nombre              = models.CharField(max_length=100)
    autor               = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    fecha_creacion      = models.DateTimeField(auto_now_add=True)

#__________________________________________//CLASE BASE\\______________________________________
class Figura(models.Model):
    coordenadas         = models.GeometryField()
    atributos           = models.JSONField(default=dict, blank=True)
    subclasificacion    = models.ForeignKey(Subclasificacion, on_delete=models.CASCADE)
    capa                = models.ForeignKey(Capa, on_delete=models.CASCADE, related_name="figuras", null=True, blank=True)

    def clean(self):
        tipo_esperado = self.subclasificacion.tipo_geometria
        tipo_recibido = self.coordenadas.geom_type

        if tipo_recibido != tipo_esperado:
            raise ValidationError(f'La subclasificación requiere geometría de tipo {tipo_esperado}, pero se recibió {tipo_recibido}')

        if not isinstance(self.coordenadas, dict) or 'type' not in self.coordenadas:
            raise ValidationError('El campo coordenadas debe tener un objeto GeoJSON válido.')

    def __str__(self):
       return f'Atributos: {self.atributos} Coordenadas: {self.coordenadas}'
    
#_________________________________________//OTROS\\_________________________________

class Sector(models.Model):
    nombre              = models.CharField(max_length=50, blank=False)

class Tipo_de_via(models.Model):
    tipo                = models.CharField(max_length=20, blank=False)
