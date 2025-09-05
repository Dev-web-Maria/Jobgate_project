from django.contrib import admin
from .models import Offre, Question, Candidat, Entretien, OffreCandidat, EntretienAnalyse, QuestionSelectionnee, Recruteur

# Enregistre les modèles
admin.site.register(Offre)
admin.site.register(Question)
admin.site.register(Candidat)
admin.site.register(Entretien)
admin.site.register(OffreCandidat)
admin.site.register(EntretienAnalyse)
admin.site.register(QuestionSelectionnee)
admin.site.register(Recruteur)

