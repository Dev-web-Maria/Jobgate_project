# from django.db import models
# import uuid
# from django.utils import timezone



# # ------------------ Recruteur ------------------
# class Recruteur(models.Model):
#     id = models.CharField(primary_key=True, max_length=20)  # ex: REC-2025-001
#     nomComplet = models.CharField(max_length=100)
#     email = models.EmailField(unique=True)
#     entreprise = models.CharField(max_length=100)
#     poste = models.CharField(max_length=100)

#     def __str__(self):
#         return f"{self.nomComplet} ({self.entreprise})"


# # ------------------ Offre ------------------
# class Offre(models.Model):
#     id = models.CharField(primary_key=True, max_length=20)  # ex: OFF-2025-007
#     titre = models.CharField(max_length=255)
#     description = models.TextField()
#     metier = models.CharField(max_length=255)
#     filiere = models.CharField(max_length=255)
#     branche = models.CharField(max_length=255)
#     lieu = models.CharField(max_length=255)
#     typecontrat = models.CharField(max_length=50)
#     salaire = models.CharField(max_length=50)

#     # relation avec Recruteur (nullable pour garder les anciennes offres)
#     recruteur = models.ForeignKey(
#         Recruteur,
#         on_delete=models.CASCADE,
#         related_name="offres",
#         null=True,   # ✅ accepte NULL en DB
#         blank=True   # ✅ accepte vide dans les formulaires Django
#     )

#     date_creation = models.DateTimeField(default=timezone.now) 

#     def __str__(self):
#         return f"{self.id} - {self.titre}"

# # ------------------ Question ------------------
# class Question(models.Model):
#     NIVEAU_CHOICES = [
#         ('Facile', 'Facile'),
#         ('Moyen', 'Moyen'),
#         ('Difficile', 'Difficile'),
#     ]

#     offre = models.ForeignKey(Offre, on_delete=models.CASCADE, related_name='questions')
#     texte = models.TextField()
#     duree_limite = models.PositiveIntegerField(help_text="Durée en secondes")
#     niveau = models.CharField(max_length=20, choices=NIVEAU_CHOICES, default='Facile')

#     def __str__(self):
#         return f"[{self.niveau}] Question pour {self.offre.id}: {self.texte[:50]}"


# # ------------------ Candidat ------------------
# def generate_candidat_id():
#     return str(uuid.uuid4())[:10]

# class Candidat(models.Model):
#     id = models.CharField(primary_key=True, max_length=10, default=generate_candidat_id, editable=False)
#     nomComplet = models.CharField(max_length=100)
#     email = models.EmailField()
#     metierRecherche = models.CharField(max_length=100)
#     filiere = models.CharField(max_length=100)
#     branche = models.CharField(max_length=100)
#     universite = models.CharField(max_length=150)
#     diplome = models.CharField(max_length=150)
#     anneeDiplome = models.PositiveIntegerField()
#     competences = models.JSONField()
#     experience = models.CharField(max_length=255)
#     matchingScore = models.PositiveIntegerField()
#     dateCandidature = models.DateTimeField(default=timezone.now)

#     def __str__(self):
#         return f"{self.nomComplet} ({self.id})"




# from django.core.exceptions import ValidationError

# class Entretien(models.Model):
#     STATUT_CHOICES = [
#         ("PENDING", "En attente"),
#         ("IN_PROGRESS", "En cours"),
#         ("COMPLETED", "Terminé"),
#         ("EXPIRED", "Expiré"),
#     ]

#     candidat = models.ForeignKey(
#         'Candidat', on_delete=models.CASCADE, related_name='entretiens'
#     )
#     offre = models.ForeignKey(
#         'Offre', on_delete=models.CASCADE, related_name='entretiens'
#     )
#     token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
#     date_creation = models.DateTimeField(auto_now_add=True)
#     date_limite = models.DateTimeField(null=True, blank=True)
#     statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='PENDING')
#     termine = models.BooleanField(default=False)
#     video_reponses = models.FileField(upload_to='entretiens/', null=True, blank=True)

#     feedback = models.TextField(null=True, blank=True)
#     score = models.FloatField(null=True, blank=True)


#     class Meta:
#         verbose_name = "Entretien"
#         verbose_name_plural = "Entretiens"
#         ordering = ['-date_creation']

#     @property
#     def current_statut(self):
#         """Calcule dynamiquement le statut"""
#         if self.termine:
#             return "COMPLETED"
#         if self.date_limite and timezone.now() > self.date_limite:
#             return "EXPIRED"
#         return self.statut

#     def clean(self):
#         """Validation supplémentaire"""
#         if self.date_limite and self.date_limite < timezone.now() and not self.termine:
#             raise ValidationError("La date limite ne peut pas être dans le passé pour un entretien actif.")

#     def save(self, *args, **kwargs):
#         force_statut = kwargs.pop('force_statut', None)
#         if force_statut:
#             self.statut = force_statut
#         else:
#             self.statut = self.current_statut
#         super().save(*args, **kwargs)

#     def __str__(self):
#         offre_titre = self.offre.titre if self.offre else "Offre supprimée"
#         candidat_email = self.candidat.email if self.candidat else "Candidat supprimé"
#         return f"{offre_titre} - {candidat_email} ({self.get_statut_display()})"


# # ------------------ OffreCandidat ------------------
# class OffreCandidat(models.Model):
#     offre = models.ForeignKey(Offre, on_delete=models.CASCADE, related_name='offre_candidats')
#     candidat = models.ForeignKey(Candidat, on_delete=models.CASCADE, related_name='offre_candidats')
#     date_ajout = models.DateTimeField(auto_now_add=True)

#     STATUS_CHOICES = [
#         ('Preselectionne', 'Préselectionné'),
#         ('Refuse', 'Refusé'),
#         ('Invite', 'Invité'),
#         ('EntretienPasse', 'Entretien Passé'),
#         ('Retire', 'Retiré'),
#         ('Pending', 'En attente'),
#         ('Entretient', "Entretien"),
#         ('EnProcessus', "En Processus d'entretient"),
#         ('EnNegotiation', 'En négociation'),
#         ('Recrute', 'Recruté'),
#     ]
    
#     status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='Preselectionne')

#     def __str__(self):
#         return f"{self.candidat.nomComplet} pour {self.offre.titre}"




# class QuestionSelectionnee(models.Model):
#     entretien = models.ForeignKey(Entretien, on_delete=models.CASCADE, related_name="questions_selectionnees")
#     question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name="selections")
#     ordre = models.PositiveIntegerField()  # ex: Q1, Q2, Q3...
#     temps_attribue = models.IntegerField(help_text="Temps en secondes accordé à cette question")

#     class Meta:
#         unique_together = ('entretien', 'question')
#         ordering = ['ordre']

#     def __str__(self):
#         return f"Q{self.ordre} - {self.question.texte[:30]} (Entretien {self.entretien.token})"


# models.py
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from django.utils import timezone
import uuid

# ------------------ Recruteur ------------------
class Recruteur(models.Model):
    id = models.CharField(primary_key=True, max_length=20)  # ex: REC-2025-001
    nomComplet = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    entreprise = models.CharField(max_length=100)
    poste = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.nomComplet} ({self.entreprise})"


# ------------------ Offre ------------------
class Offre(models.Model):
    id = models.CharField(primary_key=True, max_length=20)  # ex: OFF-2025-007
    titre = models.CharField(max_length=255)
    description = models.TextField()
    metier = models.CharField(max_length=255)
    filiere = models.CharField(max_length=255)
    branche = models.CharField(max_length=255)
    lieu = models.CharField(max_length=255)
    typecontrat = models.CharField(max_length=50)
    salaire = models.CharField(max_length=50)

    # Recruteur (nullable pour compat)
    recruteur = models.ForeignKey(
        Recruteur, on_delete=models.CASCADE, related_name="offres",
        null=True, blank=True
    )

    date_creation = models.DateTimeField(default=timezone.now)

    # ✅ Nouveau: nombre de questions à poser pour un entretien de cette offre
    nombre_questions_entretien = models.PositiveIntegerField(
        default=5,
        validators=[MinValueValidator(1), MaxValueValidator(20)],
        help_text="Nombre de questions par entretien pour cette offre"
    )

    def __str__(self):
        return f"{self.id} - {self.titre}"


# ------------------ Question ------------------
class Question(models.Model):
    NIVEAU_CHOICES = [
        ('Facile', 'Facile'),
        ('Moyen', 'Moyen'),
        ('Difficile', 'Difficile'),
    ]
    offre = models.ForeignKey(Offre, on_delete=models.CASCADE, related_name='questions')
    texte = models.TextField()
    duree_limite = models.PositiveIntegerField(help_text="Durée en secondes")
    niveau = models.CharField(max_length=20, choices=NIVEAU_CHOICES, default='Facile')

    def __str__(self):
        return f"[{self.niveau}] Question pour {self.offre.id}: {self.texte[:50]}"


# ------------------ Candidat ------------------
def generate_candidat_id():
    return str(uuid.uuid4())[:10]

class Candidat(models.Model):
    id = models.CharField(primary_key=True, max_length=10, default=generate_candidat_id, editable=False)
    nomComplet = models.CharField(max_length=100)
    email = models.EmailField()
    metierRecherche = models.CharField(max_length=100)
    filiere = models.CharField(max_length=100)
    branche = models.CharField(max_length=100)
    universite = models.CharField(max_length=150)
    diplome = models.CharField(max_length=150)
    anneeDiplome = models.PositiveIntegerField()
    competences = models.JSONField()
    experience = models.CharField(max_length=255)
    matchingScore = models.PositiveIntegerField()
    dateCandidature = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.nomComplet} ({self.id})"


# ------------------ Entretien ------------------
class Entretien(models.Model):
    STATUT_CHOICES = [
        ("PENDING", "En attente"),
        ("IN_PROGRESS", "En cours"),
        ("COMPLETED", "Terminé"),
        ("EXPIRED", "Expiré"),
    ]

    candidat = models.ForeignKey('Candidat', on_delete=models.CASCADE, related_name='entretiens')
    offre = models.ForeignKey('Offre', on_delete=models.CASCADE, related_name='entretiens')
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)

    date_creation = models.DateTimeField(auto_now_add=True)
    date_debut = models.DateTimeField(null=True, blank=True)
    date_limite = models.DateTimeField(null=True, blank=True)

    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='PENDING')
    termine = models.BooleanField(default=False)
    video_reponses = models.FileField(upload_to='entretiens/', null=True, blank=True)

    feedback = models.TextField(null=True, blank=True)
    score = models.FloatField(null=True, blank=True)

    class Meta:
        verbose_name = "Entretien"
        verbose_name_plural = "Entretiens"
        ordering = ['-date_creation']

    @property
    def current_statut(self):
        if self.termine:
            return "COMPLETED"
        if self.date_limite and timezone.now() > self.date_limite:
            return "EXPIRED"
        return self.statut

    def clean(self):
        if self.date_limite and self.date_limite < timezone.now() and not self.termine:
            raise ValidationError("La date limite ne peut pas être dans le passé pour un entretien actif.")

    def save(self, *args, **kwargs):
        force_statut = kwargs.pop('force_statut', None)
        if force_statut:
            self.statut = force_statut
        else:
            self.statut = self.current_statut
        super().save(*args, **kwargs)

    def __str__(self):
        offre_titre = self.offre.titre if self.offre else "Offre supprimée"
        candidat_email = self.candidat.email if self.candidat else "Candidat supprimé"
        return f"{offre_titre} - {candidat_email} ({self.get_statut_display()})"


# ------------------ OffreCandidat ------------------
class OffreCandidat(models.Model):
    offre = models.ForeignKey(Offre, on_delete=models.CASCADE, related_name='offre_candidats')
    candidat = models.ForeignKey(Candidat, on_delete=models.CASCADE, related_name='offre_candidats')
    date_ajout = models.DateTimeField(auto_now_add=True)

    STATUS_CHOICES = [
        ('Preselectionne', 'Préselectionné'),
        ('Refuse', 'Refusé'),
        ('Invite', 'Invité'),
        ('EntretienPasse', 'Entretien Passé'),
        ('Retire', 'Retiré'),
        ('Pending', 'En attente'),
        ('Entretient', "Entretien"),
        ('EnProcessus', "En Processus d'entretient"),
        ('EnNegotiation', 'En négociation'),
        ('Recrute', 'Recruté'),
    ]
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='Preselectionne')

    def __str__(self):
        return f"{self.candidat.nomComplet} pour {self.offre.titre}"


# ------------------ QuestionSelectionnee ------------------
class QuestionSelectionnee(models.Model):
    entretien = models.ForeignKey(Entretien, on_delete=models.CASCADE, related_name="questions_selectionnees")
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name="selections")
    ordre = models.PositiveIntegerField()  # ex: Q1, Q2, Q3...
    temps_attribue = models.IntegerField(help_text="Temps en secondes accordé à cette question")

    class Meta:
        unique_together = ('entretien', 'question')
        ordering = ['ordre']

    def __str__(self):
        return f"Q{self.ordre} - {self.question.texte[:30]} (Entretien {self.entretien.token})"
    


# ------------------ Entretien Analyse IA ------------------
class EntretienAnalyse(models.Model):
    STATUS = [
        ("queued", "queued"),
        ("processing", "processing"),
        ("done", "done"),
        ("failed", "failed"),
    ]
    entretien = models.OneToOneField("Entretien", on_delete=models.CASCADE, related_name="analyse")
    statut = models.CharField(max_length=20, choices=STATUS, default="queued")
    result_json = models.JSONField(null=True, blank=True)
    error = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Analyse Entretien #{self.entretien_id} - {self.statut}"
    

