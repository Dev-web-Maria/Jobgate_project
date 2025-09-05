# interviews/services.py
import random
from django.db import transaction
from .models import Question, QuestionSelectionnee

LEVELS = ("facile", "moyen", "difficile")

@transaction.atomic
def assigner_questions_pour_entretien(entretien, *, randomize=True) -> int:
    """
    Assigne EXACTEMENT N questions à l'entretien :
      - N = offre.nombre_questions_entretien (défaut 5)
      - si possible au moins 1 facile + 1 moyen + 1 difficile
      - le reste est pioché aléatoirement dans les niveaux restants
    Écrase toute sélection existante pour garantir un set propre.
    """
    off = entretien.offre
    try:
        n = int(getattr(off, "nombre_questions_entretien", 0)) or 5
    except Exception:
        n = 5

    # Nettoyage des sélections précédentes
    entretien.questions_selectionnees.all().delete()

    base = Question.objects.filter(offre=off)
    if not base.exists():
        return 0

    pools = {
        "facile": list(base.filter(niveau__iexact="facile")),
        "moyen": list(base.filter(niveau__iexact="moyen")),
        "difficile": list(base.filter(niveau__iexact="difficile")),
    }
    if randomize:
        for k in pools:
            random.shuffle(pools[k])

    selected = []

    # 1) garantir au moins 1 par niveau (si dispo)
    for lvl in LEVELS:
        if len(selected) < n and pools[lvl]:
            selected.append(pools[lvl].pop(0))

    # 2) compléter jusqu'à N
    while len(selected) < n and any(pools[lvl] for lvl in LEVELS):
        non_empty = [lvl for lvl in LEVELS if pools[lvl]]
        lvl = random.choice(non_empty)
        selected.append(pools[lvl].pop(0))

    # 3) Créer les QuestionSelectionnee
    created = 0
    for i, q in enumerate(selected[:n], start=1):
        try:
            t = int(q.duree_limite) if q.duree_limite is not None else None
        except Exception:
            t = None
        QuestionSelectionnee.objects.create(
            entretien=entretien,
            question=q,
            ordre=i,
            temps_attribue=t,
        )
        created += 1
    return created
