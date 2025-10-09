from django.shortcuts import render, redirect
from django.contrib.auth import login, logout
from .forms import RegistroForm

# Create your views here.

def editor(request):
    return render(request, 'editor.html')

def pagregistro(request):
    if request.method == 'POST':
        form = RegistroForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect('editor')
    else:
        form = RegistroForm()
    return render(request, 'registro.html', {'form': form})

def paglogin(request):
    return render(request, 'login.html')

#Vista para eliminar el localStorage al cerrar sesión
def paglogout(request):
    logout(request)
    response = redirect('editor')
    response.set_cookie('clear_local_storage', '1', max_age=5)
    return response