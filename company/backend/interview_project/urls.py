from django.contrib import admin
from django.urls import path, include
#IA
from django.conf import settings
from django.conf.urls.static import static
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('interviews.urls')),  # Inclure tes urls interviews
    #IA
    path("api/entretiens/", include("interviews.urls")),
    path("django-rq/", include("django_rq.urls")),  # dashboard RQ
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
