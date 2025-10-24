from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from .models import Categoria, Subcategoria, Subclasificacion



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