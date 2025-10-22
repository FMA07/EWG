from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from .models import Categoria, Subcategoria, Subclasificacion, Microbasural, Cuarteles_de_bomberos, Grifos

MODELOS = {
    "microbasural": Microbasural,
    "cuartelBomberos": Cuarteles_de_bomberos,
    "grifos": Grifos,
}

class RegistroForm(UserCreationForm):
    email = forms.EmailField(required=True)

    class Meta:
        model = User
        fields = ["username", "email", "password1", "password2"]

#FORMULARIO DINAMICO ES PARA RELLENAR LOS CAMPOS DE LAS FIGURAS NIVEL 1
class FormularioDinamico(forms.Form):
    tipo = forms.ChoiceField(
        choices=[(k, k.capitalize()) for k in MODELOS.keys()],
        label="Tipo de modelo"
    )

    def __init__(self, *args, **kwargs):
        tipo = kwargs.pop("tipo", None)
        super().__init__(*args, **kwargs)

        if tipo and tipo in MODELOS:
            model_class = MODELOS[tipo]
            for field in model_class.meta.get_fields():
                if field.auto_created or field.many_to_many or field.many_to_one:
                    continue

                field_type = type(field)
                if field_type.__name__ == "CharField":
                    self.fields[field.name] = forms.CharField(label=field.verbose_name, max_length=field.max_length)
                elif field_type.__name__ == "IntegerField":
                    self.fields[field.name] = forms.IntegerField(label=field.verbose_name)
                elif field_type.__name__ == "FloatField":
                    self.fields[field.name] = forms.FloatField(label=field.verbose_name)
                elif field_type.__name__ == "TextField":
                    self.fields[field.name] = forms.CharField(label=field.verbose_name, widget=forms.Textarea)
                elif field_type.__name__ == "JSONField":
                    self.fields[field.name] = forms.JSONField(label=field.verbose_name, required=False)
                elif hasattr(field, "choices") and field.choices:
                    self.fields[field.name] = forms.ChoiceField(label=field.verbose_name, choices=field.choices)

class FormularioCategoria(forms.ModelForm):
    class Meta:
        model = Categoria
        fields = "__all__"

class FormularioSubcategoria(forms.ModelForm):
    class Meta:
        model = Subcategoria
        fields = "__all__"

class FormularioSubclasificacion(forms.ModelForm):
    class Meta:
        model = Subclasificacion
        fields = "__all__"