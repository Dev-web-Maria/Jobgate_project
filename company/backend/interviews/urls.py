from django.urls import path
from . import views
from django.conf.urls.static import static
from django.conf import settings
from .views import UploadSegmentsView

urlpatterns = [
    path('api/recruteur/<str:recruteur_id>/', views.api_recruteur.as_view(), name='api_offres_recruteur'),
    path("api/recruteur/offres/<str:offre_id>/", views.api_offres_recruteur.as_view(), name="api_offres_recruteur"),

    path('api/recruteur/offres/<str:offre_id>/questions', views.OffreQuestionsView.as_view(), name='OffreQuestionsView'),
    path('api/recruteur/offre/<str:offre_id>/candidats/', views.api_candidats_offre, name='api_candidats_offre'),
    path('recruteur/offre/<str:offre_id>/candidat/<str:candidat_id>/generer-lien/', views.generer_lien_entretien, name='generer_lien_entretien'),
    path('entretien/<uuid:token>/', views.vue_entretien, name='vue_entretien'),
    # urls.py
    path('api/candidat/<str:candidat_id>/offre/<str:offre_id>/update-status/',views.update_candidat_status,name='update_candidat_status'),
    path("api/send-interview-links/", views.send_interview_links, name="send_interview_links"),
    path("api/interview/<uuid:token>/", views.interview_api_view, name="interview_api_view"),
    path("api/candidat/<str:candidat_id>/", views.get_candidat, name="get_candidat"),
    path('api/current-candidat/', views.current_candidat, name='current_candidat'),
    path('api/current-candidat/applications/', views.candidat_applications, name='candidat_applications'),
    path('api/current-candidat/interviews/', views.candidat_interviews, name='candidat_interviews'),

    path('api/entretiens/<uuid:token>/statut/', views.statut_entretien, name='interview-status'),
    path('api/entretiens/<uuid:token>/demarrer/', views.demarrer_entretien, name='start-interview'),
    path('api/entretiens/<uuid:token>/completer/', views.completer_entretien, name='complete-interview'),
    # path('api/entretiens/<uuid:token>/termine/', views.marquer_termine, name='entretien-termine'),

    path('api/entretiens/termine/', views.entretiens_termine, name='entretiens_termine'),
    path("api/entretiens/<int:pk>/evaluate/", views.evaluate_entretien, name="evaluate_entretien"),
    #segment upload
    path('api/entretiens/<str:token>/upload_segments/', UploadSegmentsView.as_view(), name='upload_segments'),

    #IA
    path("api/entretiens/<int:pk>/", views.EntretienDetailView.as_view(), name="entretien-detail"),
    path("api/entretiens/<int:pk>/analyze/", views.EntretienAnalyzeView.as_view(), name="entretien-analyze"),

    path("api/entretiens/<uuid:token>/expirer/", views.expirer_entretien, name="expirer_entretien"),
    path('api/entretiens/<uuid:token>/start/', views.start_entretien, name='start-entretien'),




] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)