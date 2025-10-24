from django.conf import settings
from django.core.exceptions import ValidationError
from django.contrib.gis.db import models #PARA QUE FUNCIONE HAY QUE INSTALAR GDAL Y POSTGIS

# Create your models here.
#_____________________________________//CAPAS, CATEGORIAS Y SUBCATEGORIAS\\___________________

class Categoria(models.Model):
    nombre = models.CharField(max_length=100) #Ejemplo, Ambiental, Servicios, Seguridad, Vialidad, etc

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
        ('MultiLinestring', 'PoliLínea'),
        ('Polygon', 'Polígono'),
    ]
    categoria           = models.ForeignKey(Categoria, on_delete=models.CASCADE)
    subcategoria        = models.ForeignKey(Subcategoria, on_delete=models.CASCADE, blank=True, null=True)
    nombre              = models.CharField(max_length=100) #Ejemplo: microbasurales < distintos microbasurales; grifos < distintos grifos
    tipo_geometria      = models.CharField(max_length=20, choices=OPCIONES_GEOMETRIA, default='')
    campos_config       = models.JSONField(default=list, blank=True)
    
    def __str__(self):
        return self.nombre
    
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
       return f'Coordenadas: {self.coordenadas}'
    
#_________________________________________//OTROS\\_________________________________

class Sector(models.Model):
    nombre              = models.CharField(max_length=50, blank=False)

class Tipo_de_via(models.Model):
    tipo                = models.CharField(max_length=20, blank=False)



#--------------------------------TABLAS INDIVIDUALES- por borrar--------------------------------
class Microbasural(Figura):
    opcionesAccesibilidad = [
        ('buena', 'BUENA'),
        ('regular', 'REGULAR'),
        ('mala', 'MALA')
    ]
    direccion           = models.CharField(max_length=20, blank=False)
    m2                  = models.IntegerField()
    m3                  = models.IntegerField()
    accesibilidad       = models.CharField(max_length=10, choices=opcionesAccesibilidad)
    tipo_residuo        = models.CharField(max_length=10)
    observacion         = models.TextField()

    def __str__(self):
        return f'Dirección: {self.direccion}. Accesibilidad: {self.accesibilidad}. Tipo residuo: {self.tipo_residuo}'
    
class Cauces(Figura):
    tipificacion        = models.CharField(max_length=2)
    longitud            = models.IntegerField()
    nombre              = models.CharField(max_length=50)
    largo_tramo         = models.IntegerField()
    capacidad_maxima    = models.CharField(max_length=15)
    pendiente           = models.DecimalField(max_digits=3, decimal_places=1)

class Grifos(Figura):
    numero              = models.IntegerField()
    mm                  = models.IntegerField()

class Cuarteles_de_bomberos(Figura):
    nombre              = models.CharField(max_length=50, blank=False)
    cerro_o_sector      = models.ForeignKey('Sector', on_delete=models.CASCADE)
    tipo_via            = models.ForeignKey('Tipo_de_via', on_delete=models.CASCADE)
    direccion           = models.CharField(max_length=20)
    numeracion          = models.CharField(max_length=5)
    telefono            = models.CharField(max_length=11)




    


# Estoy pensando que los campos podrían aparecer dependiendo de la categoría seleccionada