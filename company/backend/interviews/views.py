from django.shortcuts import render, redirect, get_object_or_404
from django.urls import reverse
from django.utils import timezone
from .models import Offre, Question, Candidat, Entretien , OffreCandidat
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from .serializers import QuestionSerializer
from rest_framework.views import APIView
from django.utils import timezone
from datetime import timedelta
from django.core.mail import send_mail
from .models import Recruteur, Offre   # ✅ importer les deux modèles



#------------------ Start interview (AJOUT) ------------------
# views.py (AJOUT)
from django.db import transaction
from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

@api_view(['POST'])
@transaction.atomic
def start_entretien(request, token):
    """
    Consomme le lien d'entretien une seule fois.
    - 200 si première utilisation (PENDING -> IN_PROGRESS)
    - 409 si déjà démarré/terminé
    - 410 si expiré
    """
    ent = get_object_or_404(Entretien.objects.select_for_update(), token=token)

    # expiré par date_limite ou statut
    if ent.current_statut == "EXPIRED" or ent.statut == "EXPIRED":
        return Response({"status": "error", "message": "Lien expiré"}, status=status.HTTP_410_GONE)

    # déjà en cours / terminé
    if ent.statut in ("IN_PROGRESS", "COMPLETED") or ent.termine:
        return Response({"status": "error", "message": "Entretien déjà démarré ou terminé"}, status=status.HTTP_409_CONFLICT)

    if ent.statut != "PENDING":
        return Response({"status": "error", "message": f"Statut invalide: {ent.statut}"}, status=status.HTTP_409_CONFLICT)

    now = timezone.now()
    ent.date_debut = now
    if not ent.date_limite:
        ent.date_limite = now + timezone.timedelta(days=7)

    # forcer pour ne pas être recalculé par save()
    ent.save(force_statut="IN_PROGRESS")

    return Response({
        "status": "success",
        "data": {
            "token": str(ent.token),
            "statut": ent.statut,
            "date_debut": ent.date_debut,
            "date_limite": ent.date_limite
        }
    }, status=status.HTTP_200_OK)




from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count
from .models import Recruteur, Offre, OffreCandidat, Entretien

import os
import json, sys, subprocess, shutil
from pathlib import Path
from django.conf import settings
from .models import Entretien, EntretienAnalyse
from .serializers import EntretienSerializer


class api_recruteur(APIView):
    """
    Retourne les informations d'un recruteur, ses offres, le nombre de candidats par offre,
    et le nombre d'entretiens planifiés.
    """
    def get(self, request, recruteur_id):
        try:
            recruteur = Recruteur.objects.get(id=recruteur_id)
        except Recruteur.DoesNotExist:
            return Response({'error': 'Recruteur non trouvé'}, status=status.HTTP_404_NOT_FOUND)

        # Offres avec nombre de candidats
        offres = Offre.objects.filter(recruteur=recruteur).annotate(nb_candidats=Count('offre_candidats'))

        # Total candidats
        total_candidats = OffreCandidat.objects.filter(offre__recruteur=recruteur).count()

        offres_data = []
        for offre in offres:
            # Nombre d'entretiens planifiés pour chaque offre
            nb_ent_planifies_offre = Entretien.objects.filter(offre=offre, termine=False).count()
            offres_data.append({
                'id': offre.id,
                'titre': offre.titre,
                'description': offre.description,
                'metier': offre.metier,
                'filiere': offre.filiere,
                'branche': offre.branche,
                'lieu': offre.lieu,
                'typecontrat': offre.typecontrat,
                'salaire': offre.salaire,
                'date_creation': offre.date_creation.strftime('%Y-%m-%d %H:%M:%S') if offre.date_creation else None,
                'nb_candidats': offre.nb_candidats,
            })

        return Response({
            'recruteur': {
                'id': recruteur.id,
                'nomComplet': recruteur.nomComplet,
                'email': recruteur.email,
                'entreprise': recruteur.entreprise,
                'poste': recruteur.poste,
            },
            'offres': offres_data,
            'total_candidats': total_candidats,
        })
    # """
    # Retourne les informations d'un recruteur, ses offres et le nombre de candidats par offre.
    # """
    # def get(self, request, recruteur_id):
    #     try:
    #         recruteur = Recruteur.objects.get(id=recruteur_id)
    #     except Recruteur.DoesNotExist:
    #         return Response({'error': 'Recruteur non trouvé'}, status=status.HTTP_404_NOT_FOUND)

    #     # Récupérer les offres avec le nombre de candidats pour chaque offre
    #     offres = Offre.objects.filter(recruteur=recruteur).annotate(nb_candidats=Count('offre_candidats'))
    #     total_candidats = OffreCandidat.objects.filter(offre__recruteur=recruteur).count()

    #     offres_data = []
    #     for offre in offres:
    #         offres_data.append({
    #             'id': offre.id,
    #             'titre': offre.titre,
    #             'description': offre.description,
    #             'metier': offre.metier,
    #             'filiere': offre.filiere,
    #             'branche': offre.branche,
    #             'lieu': offre.lieu,
    #             'typecontrat': offre.typecontrat,
    #             'salaire': offre.salaire,
    #             'date_creation': offre.date_creation.strftime('%Y-%m-%d %H:%M:%S') if offre.date_creation else None,
    #             'nb_candidats': offre.nb_candidats
    #         })

    #     return Response({
    #         'recruteur': {
    #             'id': recruteur.id,
    #             'nomComplet': recruteur.nomComplet,
    #             'email': recruteur.email,
    #             'entreprise': recruteur.entreprise,
    #             'poste': recruteur.poste,
    #         },
    #         'offres': offres_data,
    #         'total_candidats': total_candidats
    #     })


class api_offres_recruteur(APIView):
    """
    Retourne les détails d'une offre spécifique.
    """
    def get(self, request, offre_id):
        try:
            offre = Offre.objects.get(id=offre_id)
        except Offre.DoesNotExist:
            return Response({'error': 'Offre non trouvée'}, status=status.HTTP_404_NOT_FOUND)

        # Nombre de candidats pour cette offre
        nb_candidats = OffreCandidat.objects.filter(offre=offre).count()

        offre_data = {
            'id': offre.id,
            'titre': offre.titre,
            'description': offre.description,
            'metier': offre.metier,
            'filiere': offre.filiere,
            'branche': offre.branche,
            'lieu': offre.lieu,
            'typecontrat': offre.typecontrat,
            'salaire': offre.salaire,
            'date_creation': offre.date_creation.strftime('%Y-%m-%d %H:%M:%S') if offre.date_creation else None,
            'nb_candidats': nb_candidats
        }

        return Response({'offre': offre_data})

# class api_recruteur(APIView):
#     def get(self, request, recruteur_id):
#         try:
#             recruteur = Recruteur.objects.get(id=recruteur_id)
#         except Recruteur.DoesNotExist:
#             return Response({'error': 'Recruteur non trouvé'}, status=status.HTTP_404_NOT_FOUND)

#         offres = Offre.objects.filter(recruteur=recruteur)
#         offres_data = []
#         for offre in offres:
#             offres_data.append({
#                 'id': offre.id,
#                 'titre': offre.titre,
#                 'description': offre.description,
#                 'metier': offre.metier,
#                 'filiere': offre.filiere,
#                 'branche': offre.branche,
#                 'lieu': offre.lieu,
#                 'typecontrat': offre.typecontrat,
#                 'salaire': offre.salaire,
#                 'date_creation': offre.date_creation.strftime('%Y-%m-%d %H:%M:%S') if offre.date_creation else None,
#             })

#         return Response({
#             'recruteur': {
#                 'id': recruteur.id,
#                 'nomComplet': recruteur.nomComplet,
#                 'email': recruteur.email,
#                 'entreprise': recruteur.entreprise,
#                 'poste': recruteur.poste,
#             },
#             'offres': offres_data
#         })

# class api_offres_recruteur(APIView):
#     def get(self, request, offre_id):
#         try:
#             offre = Offre.objects.get(id=offre_id)
#         except Offre.DoesNotExist:
#             return Response({'error': 'Offre non trouvée'}, status=status.HTTP_404_NOT_FOUND)

#         offre_data = {
#             'id': offre.id,
#             'titre': offre.titre,
#             'description': offre.description,
#             'metier': offre.metier,
#             'filiere': offre.filiere,
#             'branche': offre.branche,
#             'lieu': offre.lieu,
#             'typecontrat': offre.typecontrat,
#             'salaire': offre.salaire,
#             'date_creation': offre.date_creation.strftime('%Y-%m-%d %H:%M:%S') if offre.date_creation else None,
#         }

#         return Response({'offre': offre_data})


class OffreQuestionsView(APIView):
    def post(self, request, offre_id):
        try:
            offre = Offre.objects.get(id=offre_id)
        except Offre.DoesNotExist:
            return Response({'error': 'Offre non trouvée'}, status=status.HTTP_404_NOT_FOUND)
        
        questions_data = request.data.get('questions')
        if not questions_data or not isinstance(questions_data, list):
            return Response({'error': 'Format invalide ou questions manquantes'}, status=status.HTTP_400_BAD_REQUEST)

        # Supprimer les anciennes questions liées à cette offre
        Question.objects.filter(offre=offre).delete()

        created_questions = []
        errors = []

        for index, q_data in enumerate(questions_data):
            serializer = QuestionSerializer(data=q_data)  # ✅ Utiliser le serializer
            if serializer.is_valid():
                question = serializer.save(offre=offre)  # ✅ Passe l'offre ici
                created_questions.append(question)
            else:
                errors.append({'index': index, 'errors': serializer.errors})

        if errors:
            return Response({'errors': errors}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {'message': f'{len(created_questions)} questions enregistrées avec succès'},
            status=status.HTTP_201_CREATED
        )



from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from .models import Offre, OffreCandidat

def api_candidats_offre(request, offre_id):
    offre = get_object_or_404(Offre, id=offre_id)
    offre_candidats = OffreCandidat.objects.filter(offre=offre).select_related('candidat')

    candidats_data = []
    for oc in offre_candidats:
        c = oc.candidat
        candidats_data.append({
            'id': c.id,
            'nomComplet': c.nomComplet,
            'email': c.email,
            'metierRecherche': c.metierRecherche,
            'filiere': c.filiere,
            'branche': c.branche,
            'universite': c.universite,
            'diplome': c.diplome,
            'anneeDiplome': c.anneeDiplome,
            'competences': c.competences,
            'experience': c.experience,
            'matchingScore': c.matchingScore,
            'status': oc.status,   # ✅ on prend le status de l'association OffreCandidat
            'dateCandidature': c.dateCandidature.strftime('%Y-%m-%d %H:%M:%S') if c.dateCandidature else None,
            'date_ajout': oc.date_ajout.strftime('%Y-%m-%d %H:%M:%S'),
        })

    return JsonResponse({
        'offre': {
            'id': offre.id,
            'titre': offre.titre,
            'description': offre.description,
            'metier': offre.metier,
            'filiere': offre.filiere,
            'branche': offre.branche,
            'lieu': offre.lieu,
            'typecontrat': offre.typecontrat,
            'salaire': offre.salaire,
        },
        'candidats': candidats_data,
    })




# 🎯 Génération du lien d’entretien
def generer_lien_entretien(request, offre_id, candidat_id):
    offre = get_object_or_404(Offre, id=offre_id)
    candidat = get_object_or_404(Candidat, id=candidat_id)

    entretien, created = Entretien.objects.get_or_create(
        offre=offre,
        candidat=candidat,
        defaults={'date_limite': timezone.now() + timezone.timedelta(days=7)}
    )

    lien_entretien = request.build_absolute_uri(reverse('vue_entretien', args=[entretien.token]))

    return render(request, 'interviews/lien_entretien.html', {
        'lien': lien_entretien,
        'candidat': candidat,
        'offre': offre,
    })


# 🎯 Vue entretien (affichage des questions)
def vue_entretien(request, token):
    entretien = get_object_or_404(Entretien, token=token)
    candidat = entretien.candidat
    offre = entretien.offre
    questions = offre.questions.all()

    context = {
        'entretien': entretien,
        'candidat': candidat,
        'offre': offre,
        'questions': questions,
    }
    return render(request, 'recruteur/vue_entretien.html', context)


# views.py
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import OffreCandidat

@api_view(['PATCH'])
def update_candidat_status(request, candidat_id, offre_id):
    try:
        offre_candidat = OffreCandidat.objects.get(candidat_id=candidat_id, offre_id=offre_id)
    except OffreCandidat.DoesNotExist:
        return Response({'error': 'Relation Offre-Candidat non trouvée'}, status=status.HTTP_404_NOT_FOUND)

    new_status = request.data.get('status')
    if new_status:
        # Vérification optionnelle si le status est valide
        if new_status not in dict(OffreCandidat.STATUS_CHOICES):
            return Response({'error': 'Status invalide'}, status=status.HTTP_400_BAD_REQUEST)

        offre_candidat.status = new_status
        offre_candidat.save()
        return Response({'message': 'Status mis à jour avec succès'})
    else:
        return Response({'error': 'Status manquant'}, status=status.HTTP_400_BAD_REQUEST)



from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import get_object_or_404
from django.http import JsonResponse
import json
from .models import Candidat, Offre, OffreCandidat, Entretien
from django.utils import timezone
from datetime import timedelta
from django.core.mail import send_mail



from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from .models import Entretien

def interview_api_view(request, token):
    try:
        import uuid
        uuid_token = uuid.UUID(str(token))  # vérifie que le token est un UUID
    except ValueError:
        return JsonResponse({"success": False, "error": "Format du token invalide"}, status=400)

    # Récupère l'entretien
    entretien = get_object_or_404(Entretien, token=uuid_token)

    data = {
        "success": True,
        "token": str(entretien.token),
        "offre": entretien.offre_id,  # ici ton champ existant
    }

    return JsonResponse(data, status=200)



def inviter_candidat(candidat, offre, jours_validite=3):
    """Crée un entretien et envoie le lien par email."""
    date_limite = timezone.now() + timedelta(days=jours_validite)
    entretien = Entretien.objects.create(
        candidat=candidat,
        offre=offre,
        date_limite=date_limite
    )

    lien = f"http://localhost:8000/api/interview/{entretien.token}/"

    send_mail(
        subject="Invitation à un entretien",
        message=(
            f"Bonjour {candidat.nomComplet},\n"
            f"Vous êtes invité(e) à un entretien pour l'offre {offre.titre}.\n"
            f"Voici votre lien : {lien}\n"
            f"⚠️ Ce lien expire le {date_limite.strftime('%d/%m/%Y %H:%M')}."
        ),
        from_email="no-reply@monsite.com",
        recipient_list=[candidat.email],
    )

    return entretien




@csrf_exempt
def send_interview_links(request):
    if request.method != "POST":
        return JsonResponse({"error": "Méthode non autorisée"}, status=405)

    try:
        data = json.loads(request.body)
        offre_id = data.get("offre_id")
        deadline = data.get("deadline", 3)

        if not offre_id:
            return JsonResponse({"error": "offre_id manquant"}, status=400)

        offre = get_object_or_404(Offre, id=offre_id)

        # ✅ Filtrer sur le champ status de OffreCandidat (pas Candidat)
        offre_candidats = OffreCandidat.objects.filter(
            offre=offre,
            status__in=['Entretient']
        )

        links = []
        for oc in offre_candidats:
            entretien = inviter_candidat(oc.candidat, offre, jours_validite=deadline)
            links.append({
                "candidat": oc.candidat.nomComplet,
                "email": oc.candidat.email,
                "link": f"http://localhost:8000/api/interview/{entretien.token}/"
            })

        return JsonResponse({
            "message": f"Liens envoyés pour {len(links)} candidats",
            "links": links,
            "offre": {
                "id": offre.id,
                "titre": offre.titre,
                "description": offre.description
            }
        })

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)




# views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Candidat, OffreCandidat, Entretien , QuestionSelectionnee
from .serializers import CandidatSerializer, OffreCandidatSerializer, EntretienSerializer

# ✅ Endpoint pour récupérer le candidat connecté
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_candidat(request):
    candidat = Candidat.objects.get(email=request.user.email)
    serializer = CandidatSerializer(candidat)
    return Response(serializer.data)

# ✅ Endpoint pour récupérer les candidatures du candidat connecté
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def candidat_applications(request):
    candidat = Candidat.objects.get(email=request.user.email)
    applications = OffreCandidat.objects.filter(candidat=candidat)
    serializer = OffreCandidatSerializer(applications, many=True)
    return Response(serializer.data)

# ✅ Endpoint pour récupérer les entretiens du candidat connecté
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def candidat_interviews(request):
    candidat = Candidat.objects.get(email=request.user.email)
    entretiens = Entretien.objects.filter(candidat=candidat)
    serializer = EntretienSerializer(entretiens, many=True)
    return Response(serializer.data)


def get_candidat(request, candidat_id):
    try:
        candidat = Candidat.objects.get(id=candidat_id)
        data = {
            "id": candidat.id,
            "nomComplet": candidat.nomComplet,
            "email": candidat.email,
            "metierRecherche": candidat.metierRecherche,
            "filiere": candidat.filiere,
            "branche": candidat.branche,
            "universite": candidat.universite,
            "diplome": candidat.diplome,
            "anneeDiplome": candidat.anneeDiplome,
            "competences": candidat.competences,
            "experience": candidat.experience,
            "matchingScore": candidat.matchingScore,
            "dateCandidature": candidat.dateCandidature,
            "applications": list(candidat.offre_candidats.values(
                "offre__id", "offre__titre", "date_ajout"
            )),
            "entretiens": list(candidat.entretiens.values(
                "date_creation" , "offre__id", "offre__titre", "token", "date_limite"
            )),
        }
        return JsonResponse(data)
    except Candidat.DoesNotExist:
        return JsonResponse({"error": "Candidat non trouvé"}, status=404)







from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Entretien, Question, QuestionSelectionnee
import random
from django.utils import timezone
from datetime import timedelta
from django.core.files.base import ContentFile
import logging
from django.db import transaction
from .serializers import EntretienSerializer, QuestionSelectionneeSerializer


logger = logging.getLogger(__name__)

# Status constants
INTERVIEW_STATUS = {
    'PENDING': 'EN_ATTENTE',
    'IN_PROGRESS': 'EN_COURS',
    'COMPLETED': 'TERMINE',
    'EXPIRED': 'EXPIRE'
}



# ------------------ Get interview status ------------------
# views.py
from django.db import transaction
from .services import assigner_questions_pour_entretien

@api_view(['GET'])
def statut_entretien(request, token):
    try:
        entretien = get_object_or_404(
            Entretien.objects.select_related('offre', 'candidat'),
            token=token
        )

        # Important: si pas de sélection → créer immédiatement (idempotent)
        with transaction.atomic():
            if not entretien.questions_selectionnees.exists():
                assigner_questions_pour_entretien(entretien, randomize=True)

        questions = list(
            entretien.questions_selectionnees
            .select_related('question')
            .order_by('ordre')
            .values(
                'ordre',
                'question__id',
                'question__texte',
                'question__niveau',
                'question__duree_limite',
            )
        )

        return Response({
            "status": "success",
            "data": {
                "statut": entretien.current_statut,
                "statut_display": entretien.get_statut_display(),
                "date_limite": entretien.date_limite,
                "termine": entretien.termine,
                "offre": {
                    "id": entretien.offre.id,
                    "titre": entretien.offre.titre,
                    "description": entretien.offre.description,
                    "metier": entretien.offre.metier,
                    "filiere": entretien.offre.filiere,
                    "branche": entretien.offre.branche,
                    "lieu": entretien.offre.lieu,
                    "typecontrat": entretien.offre.typecontrat,
                    "salaire": entretien.offre.salaire,
                },
                "candidat": {
                    "id": entretien.candidat.id,
                    "nomComplet": entretien.candidat.nomComplet,
                    "email": entretien.candidat.email,
                },
                "questions": questions,
            }
        })

    except Exception as e:
        logger.error(f"Error in statut_entretien: {str(e)}")
        return Response({
            "status": "error",
            "message": "Failed to get interview status",
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)





from .services import assigner_questions_pour_entretien

logger = logging.getLogger(__name__)

# ------------------ Start interview ------------------
@api_view(['POST'])
@transaction.atomic
def demarrer_entretien(request, token):
    try:
        entretien = get_object_or_404(Entretien, token=token)

        # Cohérence des codes pour le front
        if entretien.current_statut == "EXPIRED" or entretien.statut == "EXPIRED":
            return Response({"status": "error", "message": "Lien expiré"}, status=status.HTTP_410_GONE)

        if entretien.statut in ("IN_PROGRESS", "COMPLETED") or entretien.termine:
            return Response({"status": "error", "message": f"Entretien déjà {entretien.get_statut_display()}"},
                            status=status.HTTP_409_CONFLICT)

        if entretien.statut != "PENDING":
            return Response({"status": "error", "message": f"Statut invalide: {entretien.get_statut_display()}"},
                            status=status.HTTP_409_CONFLICT)

        # Vérifier qu'il existe des questions attachées à l'offre
        total_questions_offre = Question.objects.filter(offre=entretien.offre).count()
        if total_questions_offre == 0:
            return Response({
                "status": "error",
                "message": "Aucune question disponible pour cette offre"
            }, status=status.HTTP_400_BAD_REQUEST)

        # Assigner exactement le nombre voulu par l'offre
        nb_apres = assigner_questions_pour_entretien(entretien, randomize=True)
        if nb_apres == 0:
            return Response({
                "status": "error",
                "message": "Impossible d'assigner des questions pour cet entretien"
            }, status=status.HTTP_400_BAD_REQUEST)

        # Mettre à jour statut et dates
        maintenant = timezone.now()
        entretien.date_debut = maintenant

        # deadline configurable via payload ? sinon défaut 7 jours
        deadline_days = request.data.get('deadline_days')
        try:
            deadline_days = int(deadline_days) if deadline_days is not None else 7
            if deadline_days < 1:
                deadline_days = 7
        except (TypeError, ValueError):
            deadline_days = 7

        entretien.date_limite = maintenant + timedelta(days=deadline_days)

        # Forcer le statut pour éviter current_statut de l'écraser
        entretien.save(force_statut="IN_PROGRESS")

        return Response({
            "status": "success",
            "message": "Entretien démarré avec succès",
            "data": {
                "token": str(entretien.token),
                "statut": entretien.statut,
                "nb_questions": entretien.offre.nombre_questions_entretien,
                "date_debut": entretien.date_debut,
                "date_limite": entretien.date_limite
            }
        }, status=status.HTTP_200_OK)

    except Exception as e:
        import traceback
        logger.error(f"Erreur détaillée: {str(e)}")
        logger.error(traceback.format_exc())
        return Response({
            "status": "error",
            "message": "Échec du démarrage de l'entretien",
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
# # ------------------ Start interview ------------------
# @api_view(['POST'])
# @transaction.atomic
# def demarrer_entretien(request, token):
#     try:
#         entretien = get_object_or_404(Entretien, token=token)

#         if entretien.statut != "PENDING":
#             return Response({
#                 "status": "error",
#                 "message": f"L'entretien est déjà {entretien.get_statut_display()}"
#             }, status=status.HTTP_400_BAD_REQUEST)

#         if not entretien.questions_selectionnees.exists():
#             all_questions = list(Question.objects.filter(offre=entretien.offre))
#             if not all_questions:
#                 return Response({
#                     "status": "error",
#                     "message": "Aucune question disponible pour cet entretien"
#                 }, status=status.HTTP_400_BAD_REQUEST)

#             selected_questions = random.sample(all_questions, min(5, len(all_questions)))
#             for i, question in enumerate(selected_questions, start=1):
#                 QuestionSelectionnee.objects.create(
#                     entretien=entretien,
#                     question=question,
#                     ordre=i,
#                     temps_attribue=60  # ⚠️ Par exemple, 60 secondes par question
#                 )

#         # Mettre à jour statut et dates
#         entretien.statut = "IN_PROGRESS"
#         # entretien.date_debut = timezone.now()
#         entretien.date_limite = timezone.now() + timedelta(days=7)
#         entretien.save(force_statut="IN_PROGRESS")

#         return Response({
#             "status": "success",
#             "message": "Entretien démarré avec succès",
#             "data": {
#                 "statut": entretien.statut,
#                 "date_debut": entretien.date_debut,
#                 "date_limite": entretien.date_limite
#             }
#         })

#     except Exception as e:
#         import traceback
#         logger.error(f"Erreur détaillée: {str(e)}")
#         logger.error(traceback.format_exc())
#         return Response({
#             "status": "error",
#             "message": "Échec du démarrage de l'entretien",
#             "error": str(e)
#         }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ------------------ Complete interview ------------------
# views.py
import subprocess
from pathlib import Path
from django.core.files.base import ContentFile
from django.conf import settings

@api_view(['POST'])
@transaction.atomic
def completer_entretien(request, token):
    try:
        entretien = get_object_or_404(Entretien, token=token)

        if entretien.statut == "COMPLETED":
            return Response({"status": "error", "message": "Entretien déjà terminé"}, status=400)

        up = request.FILES.get('video')
        if not up:
            return Response({"status": "error", "message": "Aucune vidéo fournie"}, status=400)

        # On sauvegarde d'abord le WEBM brut
        entretien.video_reponses.save(f"entretien_{entretien.id}.webm", ContentFile(up.read()))
        entretien.refresh_from_db()

        # Convertir en MP4 (écrase le champ avec la version mp4)
        webm_path = Path(entretien.video_reponses.path)
        mp4_path = webm_path.with_suffix(".mp4")
        try:
            subprocess.run(["ffmpeg", "-y", "-i", str(webm_path), str(mp4_path)], check=True)
            # Remplacer le fichier rattaché par le mp4
            with open(mp4_path, "rb") as f:
                entretien.video_reponses.save(f"entretien_{entretien.id}.mp4", ContentFile(f.read()))
            # on peut supprimer l’ancien webm
            try: webm_path.unlink()
            except Exception: pass
        except Exception as conv_err:
            # si conversion échoue, on garde le webm
            logger.warning(f"FFmpeg conversion failed: {conv_err}")

        entretien.termine = True
        entretien.save(force_statut="COMPLETED")

        return Response({"status": "success", "message": "Entretien terminé avec succès"})
    except Exception as e:
        logger.error(f"Error in completer_entretien: {str(e)}")
        return Response({"status": "error", "message": "Échec de la finalisation de l'entretien", "error": str(e)}, status=500)



@api_view(['GET'])
def entretiens_termine(request):
    """
    Retourne la liste des entretiens terminés avec vidéos, questions sélectionnées, score et feedback.
    """
    try:
        entretiens = Entretien.objects.filter(termine=True).prefetch_related(
            'questions_selectionnees__question',
        ).select_related('candidat', 'offre')
        
        data = []
        for entretien in entretiens:

            # Gestion de l'URL vidéo
            video_url = None
            if entretien.video_reponses and hasattr(entretien.video_reponses, 'url'):
                try:
                    video_url = request.build_absolute_uri(entretien.video_reponses.url)
                except (ValueError, Exception):
                    video_url = None
            
            # Vérification que le candidat et l'offre existent
            candidat_nom = entretien.candidat.nomComplet if entretien.candidat else "Non spécifié"
            candidat_email = entretien.candidat.email if entretien.candidat else ""
            
            # Récupérer le statut depuis OffreCandidat
            candidat_status = "Inconnu"
            if entretien.candidat and entretien.offre:
                offre_candidat = OffreCandidat.objects.filter(
                    candidat=entretien.candidat,
                    offre=entretien.offre
                ).first()
                if offre_candidat:
                    candidat_status = offre_candidat.status

            data.append({
                'id': entretien.id,
                'token': entretien.token,
                'candidat_nom': candidat_nom,
                'candidat_email': candidat_email,
                'candidat_status': candidat_status,
                'candidat_id': entretien.candidat.id if entretien.candidat else None,
                'offre': {
                    'id': entretien.offre.id if entretien.offre else None,
                    'titre': entretien.offre.titre if entretien.offre else "Offre supprimée",
                    'description': entretien.offre.description if entretien.offre else ""
                },
                'video_reponses': video_url,
                'date_creation': entretien.date_creation,
                'date_limite': entretien.date_limite,
                'statut': entretien.statut,
                'termine': entretien.termine,
                'score': entretien.score,           # <-- Ajouté
                'feedback': entretien.feedback,     # <-- Ajouté
                'questions_selectionnees': QuestionSelectionneeSerializer(
                    entretien.questions_selectionnees.all(), 
                    many=True
                ).data
            })

        return Response(data)
    
    except Exception as e:
        return Response(
            {'error': f'Une erreur est survenue: {str(e)}'}, 
            status=500
        )

# @api_view(['GET'])
# def entretiens_termine(request):
#     """
#     Retourne la liste des entretiens terminés avec vidéos et questions sélectionnées.
#     """
#     try:
#         entretiens = Entretien.objects.filter(termine=True).prefetch_related(
#             'questions_selectionnees__question',
#         ).select_related('candidat', 'offre')
        
#         data = []
#         for entretien in entretiens:

#             # Gestion de l'URL vidéo
#             video_url = None
#             if entretien.video_reponses and hasattr(entretien.video_reponses, 'url'):
#                 try:
#                     video_url = request.build_absolute_uri(entretien.video_reponses.url)
#                 except (ValueError, Exception):
#                     video_url = None
            
#             # Vérification que le candidat et l'offre existent
#             candidat_nom = entretien.candidat.nomComplet if entretien.candidat else "Non spécifié"
#             candidat_email = entretien.candidat.email if entretien.candidat else ""
            
#             # Récupérer le statut depuis OffreCandidat
#             candidat_status = "Inconnu"
#             if entretien.candidat and entretien.offre:
#                 offre_candidat = OffreCandidat.objects.filter(
#                     candidat=entretien.candidat,
#                     offre=entretien.offre
#                 ).first()
#                 if offre_candidat:
#                     candidat_status = offre_candidat.status

#             data.append({
#                 'id': entretien.id,
#                 'token': entretien.token,
#                 'candidat_nom': candidat_nom,
#                 'candidat_email': candidat_email,
#                 'candidat_status': candidat_status,  # <-- status depuis OffreCandidat
#                 'candidat_id': entretien.candidat.id if entretien.candidat else None,
#                 'offre': {
#                     'id': entretien.offre.id if entretien.offre else None,
#                     'titre': entretien.offre.titre if entretien.offre else "Offre supprimée",
#                     'description': entretien.offre.description if entretien.offre else ""
#                 },
#                 'video_reponses': video_url,
#                 'date_creation': entretien.date_creation,
#                 'date_limite': entretien.date_limite,
#                 'statut': entretien.statut,
#                 'termine': entretien.termine,
#                 'questions_selectionnees': QuestionSelectionneeSerializer(
#                     entretien.questions_selectionnees.all(), 
#                     many=True
#                 ).data
#             })

#         return Response(data)
    
#     except Exception as e:
#         return Response(
#             {'error': f'Une erreur est survenue: {str(e)}'}, 
#             status=500
#         )

# ----- Merge videos -----
import os
import subprocess
from django.conf import settings
from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser
from .models import Entretien


class UploadSegmentsView(APIView):
    parser_classes = [MultiPartParser]

    def post(self, request, token):
        try:
            entretien = Entretien.objects.get(token=token)
        except Entretien.DoesNotExist:
            return JsonResponse({"error": "Entretien introuvable"}, status=404)

        print("📥 Réception des segments pour entretien:", token)

        # 1️⃣ Sauvegarder les segments uploadés
        upload_dir = os.path.join(settings.MEDIA_ROOT, "segments", token)
        os.makedirs(upload_dir, exist_ok=True)

        segment_files = []
        for i, f in enumerate(request.FILES.getlist("videos")):
            segment_path = os.path.join(upload_dir, f"part{i}.webm")
            with open(segment_path, "wb+") as dest:
                for chunk in f.chunks():
                    dest.write(chunk)
            segment_files.append(segment_path)
            print(f"✅ Segment {i} sauvegardé -> {segment_path}")

        if not segment_files:
            return JsonResponse({"error": "Aucun segment reçu"}, status=400)

        # 2️⃣ Créer la commande ffmpeg avec filter_complex pour concat + ré-encodage
        input_args = []
        filter_parts = []
        for i in range(len(segment_files)):
            input_args += ["-i", segment_files[i]]
            filter_parts += [f"[{i}:v:0][{i}:a:0]"]
        filter_complex = "".join(filter_parts) + f"concat=n={len(segment_files)}:v=1:a=1[outv][outa]"

        output_dir = os.path.join(settings.MEDIA_ROOT, "entretiens")
        os.makedirs(output_dir, exist_ok=True)
        output_path = os.path.join(output_dir, f"{token}.webm")

        cmd = ["ffmpeg", "-y"] + input_args + [
            "-filter_complex", filter_complex,
            "-map", "[outv]",
            "-map", "[outa]",
            "-c:v", "libvpx-vp9",
            "-b:v", "1M",
            "-c:a", "libopus",
            output_path
        ]

        print("🎬 Commande ffmpeg générée:", " ".join(cmd))

        # 3️⃣ Exécuter ffmpeg
        try:
            subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            print("✅ Fusion réussie ->", output_path)
        except subprocess.CalledProcessError as e:
            print("❌ Erreur ffmpeg:", e.stderr.decode())
            return JsonResponse({"error": "Erreur pendant la fusion"}, status=500)

        # 4️⃣ Mettre à jour l'entretien
        entretien.video_reponses.name = f"entretiens/{token}.webm"
        entretien.statut = "COMPLETED"
        entretien.termine = True
        entretien.save()
        print("📤 Entretien mis à jour -> statut=COMPLETED")

        return JsonResponse({
            "status": "ok",
            "video": entretien.video_reponses.url,
        })


















# ------------------ Evaluate interview ------------------
@api_view(['POST', 'PATCH'])  # <-- Allow PATCH
def evaluate_entretien(request, pk):
    try:
        entretien = get_object_or_404(Entretien, pk=pk)

        score = request.data.get('score')
        feedback = request.data.get('feedback', '')

        if score is not None:
            try:
                score = float(score)
                if not (0 <= score <= 10):
                    return Response({"error": "Le score doit être entre 0 et 10."}, status=400)
                entretien.score = score
            except ValueError:
                return Response({"error": "Le score doit être un nombre."}, status=400)

        entretien.feedback = feedback
        entretien.save()

        return Response({
            "message": "Entretien évalué avec succès.",
            "entretien": {
                "id": entretien.id,
                "score": entretien.score,
                "feedback": entretien.feedback
            }
        })

    except Exception as e:
        return Response({
            "error": f"Une erreur est survenue: {str(e)}"
        }, status=500)
    

#------------- Analyse entretien analyse IA ---------------

def _lab_python_path(lab_dir: Path) -> str:
    """
    Retourne le chemin de l'exécutable Python du venv du lab (Windows ou Linux),
    ou fallback vers sys.executable si introuvable.
    """
    win = lab_dir / ".venv" / "Scripts" / "python.exe"
    nix = lab_dir / ".venv" / "bin" / "python"
    if win.exists():
        return str(win)
    if nix.exists():
        return str(nix)
    return sys.executable



def _extract_questions(ent) -> list[dict]:
    """
    Retourne EXACTEMENT les 5 questions tirées au sort pour cet entretien,
    en lisant d'abord `ent.questions_selectionnees` (même source que le front).
    Fallbacks conservés si jamais ce related est vide chez un ancien entretien.
    """
    def _norm_unique_texts(items):
        # garde uniquement {"question": "..."} et dédoublonne
        seen, out = set(), []
        for qtext in items:
            qt = (qtext or "").strip()
            if qt and qt not in seen:
                seen.add(qt)
                out.append({"question": qt})
        return out

    # ---------- PRIORITÉ ABSOLUE : ent.questions_selectionnees ----------
    rel = getattr(ent, "questions_selectionnees", None)
    if rel is not None and hasattr(rel, "all"):
        try:
            qs = rel.all()
            # si le champ 'ordre' existe on le respecte
            try:
                model_fields = {f.name for f in qs.model._meta.get_fields()}
            except Exception:
                model_fields = set()
            if "ordre" in model_fields:
                qs = qs.order_by("ordre", "id")
            else:
                qs = qs.order_by("id")
        except Exception:
            qs = []

        items = []
        for obj in qs:
            # 1) texte de la question
            qtext = None
            q = getattr(obj, "question", None)
            if q is not None:
                for fname in ("texte", "label", "title", "text"):
                    val = getattr(q, fname, None)
                    if isinstance(val, str) and val.strip():
                        qtext = val.strip()
                        break
            if not qtext:
                for fname in ("texte", "label", "title", "text"):
                    val = getattr(obj, fname, None)
                    if isinstance(val, str) and val.strip():
                        qtext = val.strip()
                        break
            if not qtext:
                continue

            # 2) durée optionnelle (temps_attribue/duree/…)
            secs = None
            for fname in ("temps_attribue", "duree", "seconds", "duration_sec"):
                try:
                    val = getattr(obj, fname, None)
                    if val is not None:
                        secs = float(val)
                        break
                except Exception:
                    pass

            d = {"question": qtext}
            if secs and secs > 0:
                d["seconds"] = round(secs, 2)

            items.append(d)

        if items:
            # dédoublonnage en conservant l'ordre
            seen, uniq = set(), []
            for d in items:
                t = d["question"]
                if t not in seen:
                    seen.add(t)
                    uniq.append(d)
            return uniq[:5]

    # ---------- Fallbacks (inchangés) : si jamais aucun selected trouvé ----------
    # Cas A: JSONField ent.questions_selectionnees (ancien format possible)
    js = getattr(ent, "questions_selectionnees", None)
    selected = []
    if js and isinstance(js, (list, str)):
        try:
            if isinstance(js, str):
                js = json.loads(js)
        except Exception:
            js = []
        tmp = []
        for item in js or []:
            if isinstance(item, dict):
                if isinstance(item.get("question"), dict):
                    tmp.append(item["question"].get("texte") or item["question"].get("label") or item["question"].get("title"))
                elif isinstance(item.get("question"), str):
                    tmp.append(item["question"])
                elif isinstance(item.get("texte"), str):
                    tmp.append(item["texte"])
            elif isinstance(item, str):
                tmp.append(item)
        selected = _norm_unique_texts(tmp)
        if selected:
            return selected[:5]

    # Cas B: autres related sur l’entretien
    for attr in ("entretien_questions", "questions_rel", "selected_questions"):
        rel2 = getattr(ent, attr, None)
        if rel2 is None:
            continue
        try:
            qs2 = rel2.all()
        except Exception:
            qs2 = []
        tmp = []
        for obj in qs2:
            qtext = None
            if hasattr(obj, "question") and getattr(obj, "question") is not None:
                q = getattr(obj, "question")
                qtext = getattr(q, "texte", None) or getattr(q, "label", None) or getattr(q, "title", None)
            if not qtext:
                qtext = getattr(obj, "texte", None) or getattr(obj, "label", None) or getattr(obj, "title", None)
            if qtext:
                tmp.append(qtext)
        items = _norm_unique_texts(tmp)
        if items:
            return items[:5]

    # Cas C: via l’offre (dernier recours, on tronque à 5)
    if getattr(ent, "offre", None):
        off = ent.offre
        for attr in ("questions", "questions_set", "questions_rel"):
            rel3 = getattr(off, attr, None)
            if rel3 is None:
                continue
            try:
                qs3 = rel3.all()
            except Exception:
                qs3 = []
            tmp = []
            for obj in qs3:
                qtext = getattr(obj, "texte", None) or getattr(obj, "label", None) or getattr(obj, "title", None)
                if qtext:
                    tmp.append(qtext)
            items = _norm_unique_texts(tmp)
            if items:
                return items[:5]

    return []


import logging
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .models import Entretien

logger = logging.getLogger(__name__)

# ------------------ Expire interview ------------------
@api_view(['POST'])
@transaction.atomic
def expirer_entretien(request, token):
    """
    Marque un entretien comme expiré (rafraîchissement, fermeture, retour).
    """
    try:
        entretien = get_object_or_404(Entretien, token=token)

        # Déjà expiré -> 410
        if entretien.statut == "EXPIRED" or entretien.current_statut == "EXPIRED":
            return Response({
                "status": "ignored",
                "message": "Déjà expiré",
                "data": {
                    "token": str(entretien.token),
                    "statut": "EXPIRED",
                    "statut_display": "Expiré",
                }
            }, status=status.HTTP_410_GONE)

        # Terminé -> on ne change pas
        if entretien.statut == "COMPLETED" or entretien.termine:
            return Response({
                "status": "ignored",
                "message": "Entretien déjà terminé",
                "data": {
                    "token": str(entretien.token),
                    "statut": "COMPLETED",
                    "statut_display": "Terminé",
                }
            }, status=status.HTTP_200_OK)

        # Seuls PENDING/IN_PROGRESS sont expirables
        if entretien.statut not in ["PENDING", "IN_PROGRESS"]:
            return Response({
                "status": "error",
                "message": f"Impossible d'expirer un entretien avec le statut: {entretien.get_statut_display()}"
            }, status=status.HTTP_400_BAD_REQUEST)

        # Forcer l'expiration (évite le recalcul dans save())
        entretien.save(force_statut="EXPIRED")

        logger.info(f"✅ Entretien {entretien.token} marqué comme expiré")

        return Response({
            "status": "success",
            "message": "Entretien expiré",
            "data": {
                "token": str(entretien.token),
                "statut": "EXPIRED",
                "statut_display": "Expiré",
            }
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"❌ Erreur lors de l'expiration de l'entretien {token}: {str(e)}")
        return Response({
            "status": "error",
            "message": "Échec de l'expiration de l'entretien",
            "error": str(e),
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)






class EntretienAnalyzeView(APIView):
    """
    POST /api/entretiens/{id}/analyze/
    - Optionnel: file=@video.mp4 pour uploader/remplacer la vidéo
    - Lance l'analyse IA via interview-ai-lab/run_all.py
    """
    def post(self, request, pk: int):
        # 1) Récup entretien
        try:
            ent = Entretien.objects.get(pk=pk)
        except Entretien.DoesNotExist:
            return Response({"detail": "Entretien introuvable."}, status=404)

        # 2) Upload éventuel
        upfile = request.FILES.get("file")
        if upfile:
            ent.video_reponses = upfile
            ent.save()

        if not ent.video_reponses:
            return Response({"detail": "Aucune vidéo associée à cet entretien."}, status=400)

        # 3) Objet d'analyse
        analyse, _ = EntretienAnalyse.objects.get_or_create(entretien=ent)
        analyse.statut = "processing"
        analyse.error = ""
        analyse.result_json = None
        analyse.save()

        try:
            media_path = Path(ent.video_reponses.path)

            # (Optionnel) convertir WEBM -> MP4 si besoin
            if media_path.suffix.lower() == ".webm":
                mp4_path = media_path.with_suffix(".mp4")
                subprocess.run(["ffmpeg", "-y", "-i", str(media_path), str(mp4_path)], check=True)
                media_path = mp4_path

            # 4) Localisation lab + python
            backend_dir = Path(settings.BASE_DIR)
            lab_dir = (backend_dir.parent / "interview-ai-lab").resolve()
            py = _lab_python_path(lab_dir)
            run_all = lab_dir / "run_all.py"

            # 5) Nettoyage ancien report.json du lab
            lab_outputs = lab_dir / "outputs" / "report.json"
            try:
                if lab_outputs.exists():
                    lab_outputs.unlink()
            except Exception:
                pass  # non bloquant

            # 6) Env: forcer Transformers à ignorer TF et utiliser PyTorch
            env = os.environ.copy()
            env["TRANSFORMERS_NO_TF"] = "1"
            env["USE_TORCH"] = "1"
            env["PYTHONIOENCODING"] = "UTF-8"

            # ---------------------- NOUVEAU : sérialiser questions ----------------------
            questions_arg = None
            try:
                questions = _extract_questions(ent)  # ← tente A/B/C
                if questions:
                    results_dir = Path(settings.MEDIA_ROOT) / "results"
                    results_dir.mkdir(parents=True, exist_ok=True)
                    qjson = results_dir / f"{ent.pk}_questions.json"
                    with open(qjson, "w", encoding="utf-8") as f:
                        json.dump(questions, f, ensure_ascii=False)
                    questions_arg = str(qjson)
            except Exception as qerr:
                # On logge mais on ne casse pas l'analyse vidéo si extraction questions échoue
                questions_arg = None
            # ----------------------------------------------------------------------------

            # 7) Exécution du lab (dans son dossier) + capture logs
            cmd = [py, str(run_all), "--video", str(media_path)]
            if questions_arg:
                cmd += ["--questions", questions_arg]

            res = subprocess.run(
                cmd,
                cwd=str(lab_dir),          # IMPORTANT: exécuter au sein du lab
                env=env,
                text=True,
                capture_output=True,       # récupérer stdout / stderr
                check=False,               # on gère le code retour
            )
            if res.returncode != 0:
                analyse.statut = "failed"
                analyse.error = (
                    f"run_all.py failed (code={res.returncode})\n"
                    f"CMD: {' '.join(cmd)}\n\n"
                    f"STDOUT:\n{res.stdout}\n\nSTDERR:\n{res.stderr}"
                )
                analyse.save()
                return Response({"detail": analyse.error}, status=500)

            # 8) Vérifier la sortie
            if not lab_outputs.exists():
                analyse.statut = "failed"
                analyse.error = (
                    f"report.json introuvable après exécution.\n"
                    f"STDOUT:\n{res.stdout}\n\nSTDERR:\n{res.stderr}"
                )
                analyse.save()
                return Response({"detail": analyse.error}, status=500)

            # 9) Copier vers media/results/<id>.json
            results_dir = Path(settings.MEDIA_ROOT) / "results"
            results_dir.mkdir(parents=True, exist_ok=True)
            out_json = results_dir / f"{ent.pk}.json"
            shutil.copy(lab_outputs, out_json)

            # 10) Charger et enregistrer en DB
            with open(out_json, "r", encoding="utf-8") as f:
                data = json.load(f)

            analyse.statut = "done"
            analyse.result_json = data
            analyse.save()

            return Response(EntretienSerializer(ent).data, status=200)

        except Exception as e:
            analyse.statut = "failed"
            analyse.error = str(e)
            analyse.save()
            return Response({"detail": analyse.error}, status=500)



class EntretienDetailView(APIView):
    """
    GET /api/entretiens/{id}/  → renvoie l'entretien + analyse si existante
    """
    def get(self, request, pk: int):
        try:
            ent = Entretien.objects.get(pk=pk)
        except Entretien.DoesNotExist:
            return Response({"detail": "Introuvable."}, status=status.HTTP_404_NOT_FOUND)
        return Response(EntretienSerializer(ent).data, status=status.HTTP_200_OK)




