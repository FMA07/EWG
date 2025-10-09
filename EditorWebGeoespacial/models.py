from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError

# Create your models here.

#__________________________________________//CLASE BASE\\______________________________________
class Figura(models.Model):
    nombre              = models.CharField(max_length=100)
    coordenadas         = models.JSONField()
    Capa                = models.ForeignKey('Capa', on_delete=models.CASCADE, related_name="figuras", null=True, blank=True)

    def clean(self):
        if not isinstance(self.coordenadas, dict) or 'type' not in self.coordenadas:
            raise ValidationError('El campo coordenadas debe tener un objeto GeoJSON válido.')

    def __str__(self):
       return f'Nombre: {self.nombre}. Coordenadas: {self.coordenadas}'
    
#_________________________________________//OTROS\\_________________________________

class Sector(models.Model):
    nombre              = models.CharField(max_length=50, blank=False)

#_____________________________________//CATEGORIAS Y SUBCATEGORIAS\\___________________

class Categoria(models.Model):
    nombre = models.CharField(max_length=100) #Ejemplo, Ambiental, Servicios, Seguridad, Vialidad, etc

    def __str__(self):
        return self.nombre

class Subcategoria(models.Model):
    categoria           = models.ForeignKey(Categoria, on_delete=models.CASCADE)
    nombre              = models.CharField(max_length=100) #Ejemplo, para Ambiental: microbasurales, focos de incendio, etc

    def __str__(self):
        return f'Nombre: {self.nombre}'


#--------------------------------TABLAS INDIVIDUALES---------------------------------
class Microbasural(models.Model):
    opcionesAccesibilidad = [
        ('buena', 'BUENA'),
        ('regular', 'REGULAR'),
        ('mala', 'MALA')
    ]

    direccion           = models.CharField(max_length=50, blank=False)
    m2                  = models.IntegerField
    m3                  = models.IntegerField
    accesibilidad       = models.CharField(max_length=10, choices=opcionesAccesibilidad)
    tipo_residuo        = models.CharField(max_length=10)
    observacion         = models.TextField

    def __str__(self):
        return f'Dirección: {self.direccion}. Accesibilidad: {self.accesibilidad}. Tipo residuo: {self.tipo_residuo}'
    
class Cauces(models.Model):
    tipificacion        = models.CharField(max_length=2)
    longitud            = models.IntegerField
    nombre              = models.CharField(max_length=50)
    largo_tramo         = models.IntegerField
    capacidad_maxima    = models.CharField(max_length=15)
    pendiente           = models.DecimalField(max_digits=3, decimal_places=1)

class Grifos(models.Model):
    numero              = models.IntegerField
    mm                  = models.IntegerField

class Cuarteles_de_bomberos(models.Model):
    nombre              = models.CharField(max_length=50, blank=False)
    cerro_o_sector      = models.ForeignKey('Sector', on_delete=models.CASCADE)



    

class Capa(models.Model):
    nombre              = models.CharField(max_length=100)
    autor               = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    fecha_creacion      = models.DateTimeField(auto_now_add=True)
# Estoy pensando que los campos podrían aparecer dependiendo de la categoría seleccionada