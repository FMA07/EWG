from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from .models import Categoria, Subcategoria, Subclasificacion, Proyecto



class RegistroForm(UserCreationForm):
    email = forms.EmailField(required=True)

    class Meta:
        model = User
        fields = ["username", "email", "password1", "password2"]

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

class FormularioProyecto(forms.ModelForm):
    categorias = forms.ModelMultipleChoiceField(
        queryset=Categoria.objects.all(),
        widget=forms.CheckboxSelectMultiple,
        required=True,
        label="Categorías",
    )

    class Meta:
        model = Proyecto
        fields = ["nombre"]