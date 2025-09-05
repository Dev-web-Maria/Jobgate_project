# from rest_framework import serializers
# from .models import Offre, Question , QuestionSelectionnee

# class OffreSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Offre
#         fields = ['id', 'titre', 'description', 'metier', 'filiere', 'branche', 'lieu', 'typecontrat', 'salaire' ,'date_creation']


# class QuestionSerializer(serializers.ModelSerializer):
#     offre = serializers.PrimaryKeyRelatedField(read_only=True)

#     class Meta:
#         model = Question
#         fields = ['texte', 'duree_limite', 'niveau', 'offre']





# # serializers.py
# from rest_framework import serializers
# from .models import Candidat, OffreCandidat, Entretien, Offre

# class CandidatSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Candidat
#         fields = ['id', 'nomComplet', 'email', 'metierRecherche', 'filiere', 'branche']

# class OffreCandidatSerializer(serializers.ModelSerializer):
#     offre = OffreSerializer()
#     class Meta:
#         model = OffreCandidat
#         fields = ['id', 'offre', 'date_ajout', 'status']

# class EntretienSerializer(serializers.ModelSerializer):
#     offre = OffreSerializer()
#     statut = serializers.CharField(read_only=True)
#     offre_titre = serializers.CharField(source='offre.titre', read_only=True)
#     candidat_email = serializers.CharField(source='candidat.email', read_only=True)

#     video_reponses = serializers.FileField(use_url=True, required=False, allow_null=True)


#     class Meta:
#         model = Entretien
#         fields = [
#             'id',
#             'token',
#             'statut',
#             'date_creation',
#             'date_limite',
#             'termine',
#             'offre_titre',
#             'candidat_email',
#             'video_reponses',
#         ]
#         read_only_fields = ['token', 'date_creation', 'statut']


# class QuestionSelectionneeSerializer(serializers.ModelSerializer):
#     question = QuestionSerializer()
    
#     class Meta:
#         model = QuestionSelectionnee
#         fields = ['ordre', 'question']



from rest_framework import serializers
from .models import (
    Offre,
    Question,
    QuestionSelectionnee,
    Candidat,
    OffreCandidat,
    Entretien,
    EntretienAnalyse
)


class OffreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Offre
        fields = [
            'id', 'titre', 'description', 'metier', 'filiere', 'branche',
            'lieu', 'typecontrat', 'salaire', 'date_creation',
        ]


class QuestionSerializer(serializers.ModelSerializer):
    offre = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Question
        fields = ['texte', 'duree_limite', 'niveau', 'offre']


class CandidatSerializer(serializers.ModelSerializer):
    class Meta:
        model = Candidat
        fields = ['id', 'nomComplet', 'email', 'metierRecherche', 'filiere', 'branche']


class OffreCandidatSerializer(serializers.ModelSerializer):
    offre = OffreSerializer(read_only=True)

    class Meta:
        model = OffreCandidat
        fields = ['id', 'offre', 'date_ajout', 'status']


class EntretienSerializer(serializers.ModelSerializer):
    offre = OffreSerializer(read_only=True)
    offre_titre = serializers.CharField(source='offre.titre', read_only=True)
    candidat_email = serializers.EmailField(source='candidat.email', read_only=True)
    video_reponses = serializers.FileField(use_url=True, required=False, allow_null=True)
    feedback = serializers.CharField(required=False, allow_blank=True)
    score = serializers.FloatField(required=False, allow_null=True)

    class Meta:
        model = Entretien
        fields = [
            'id',
            'token',
            'statut',
            'date_creation',
            'date_limite',
            'termine',
            'offre',
            'offre_titre',
            'candidat_email',
            'video_reponses',
            'feedback',
            'score',
            'questions_selectionnees',
        ]
        read_only_fields = ['token', 'date_creation', 'statut']


class QuestionSelectionneeSerializer(serializers.ModelSerializer):
    question = QuestionSerializer(read_only=True)

    class Meta:
        model = QuestionSelectionnee
        fields = ['ordre', 'question']



# ------------------ Entretien Analyse IA ----------------

class EntretienAnalyseSerializer(serializers.ModelSerializer):
    class Meta:
        model = EntretienAnalyse
        fields = ["statut", "result_json", "error", "created_at", "updated_at"]

class EntretienSerializer(serializers.ModelSerializer):
    analyse = EntretienAnalyseSerializer(read_only=True)

    class Meta:
        model = Entretien
        fields = [
            "id", "candidat", "offre", "token",
            "date_creation", "date_limite",
            "statut", "termine", "video_reponses",
            "analyse",
        ]
        read_only_fields = ["token", "date_creation", "statut", "termine"]





























































# # Serializer pour la liste d'entretiens renvoyée au front
# class EntretienListSerializer(serializers.ModelSerializer):
#     offre_titre = serializers.CharField(source="offre.titre", read_only=True)
#     candidat_nom = serializers.CharField(source="candidat.nomComplet", read_only=True)
#     candidat_email = serializers.CharField(source="candidat.email", read_only=True)
#     questions_selectionnees = QuestionSelectionneeSerializer(many=True, read_only=True)
#     video_reponses = serializers.SerializerMethodField()
#     # statut renvoyé (cohérent avec ce que l'UI attend — on renvoie "TERMINE" si termine=True)
#     statut = serializers.SerializerMethodField()
#     # statut du candidat dans l'offre (OffreCandidat.status)
#     candidat_status = serializers.SerializerMethodField()
#     # pour compatibilité (dans ton UI tu utilises parfois `status`)
#     status = serializers.SerializerMethodField()

#     class Meta:
#         model = Entretien
#         fields = [
#             "id",
#             "token",
#             "statut",
#             "date_creation",
#             "date_limite",
#             "termine",
#             "offre_titre",
#             "candidat_nom",
#             "candidat_email",
#             "video_reponses",
#             "questions_selectionnees",
#             "score",
#             "feedback",
#             "candidat_status",
#             "status",
#         ]
#         read_only_fields = ["token", "date_creation", "statut"]

#     def get_video_reponses(self, obj):
#         request = self.context.get("request")
#         if obj.video_reponses:
#             try:
#                 url = obj.video_reponses.url
#                 return request.build_absolute_uri(url) if request else url
#             except Exception:
#                 return None
#         return None

#     def get_statut(self, obj):
#         # pour compatibilité avec le code front existant:
#         # renvoie "TERMINE" si termine True, sinon renvoie la valeur brute de statut
#         if obj.termine:
#             return "TERMINE"
#         return obj.statut

#     def get_candidat_status(self, obj):
#         # essaye d'utiliser la map fournie via le contexte (évite N+1)
#         oc_map = self.context.get("oc_map") or {}
#         key = (obj.offre_id, obj.candidat_id)
#         if key in oc_map:
#             return oc_map[key]
#         # fallback: petite requête
#         oc = OffreCandidat.objects.filter(offre=obj.offre, candidat=obj.candidat).first()
#         return oc.status if oc else None

#     def get_status(self, obj):
#         # alias pour `candidat_status`
#         return self.get_candidat_status(obj)


# # Serializer pour patch score/feedback
# class EntretienEvaluationSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Entretien
#         fields = ("id", "score", "feedback")

#     def validate_score(self, value):
#         if value is None:
#             return value
#         if not (0 <= value <= 5):
#             raise serializers.ValidationError("Le score doit être entre 0 et 5.")
#         return value