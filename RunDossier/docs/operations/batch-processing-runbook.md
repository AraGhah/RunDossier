# Runbook — livraisons parent-batch (1 000+ prospects)

## Modèle opérationnel

1. **Création** — `POST /api/parent-batches` avec `client_id`, `requested_count`, liste initiale optionnelle.
2. **Lot parent** (`parent_batches`) — objectif de livraison (ex. 1 000 qualifiés).
3. **Chunks internes** (`batches`, taille 50 par défaut) — traitement scheduler/research/personalize/QA.
4. **Orchestrateur** (pg-boss `batch-orchestrator`, cron `*/2 min`) — scheduler, sourcing remplacement, livraison finale unique.
5. **Livraison** — uniquement via orchestrateur quand `shouldDeliverParentBatch()` est vrai ; réconciliation pré/post CSV.

## Variables d'environnement

| Variable | Défaut | Rôle |
|----------|--------|------|
| `SCHEDULER_BATCH_SIZE` | 50 | Prospects par cycle scheduler |
| `SCHEDULER_CYCLES_PER_TICK` | 3 | Cycles par tick (= 150 prospects/tick max) |
| `ORCHESTRATOR_SOURCE_CHUNK` | 50 | Taille sourcing remplacement |
| `SOURCE_EXHAUSTION_MISS_STREAK` | 3 | Miss consécutifs avant `source_exhausted` |
| `DELIVERING_REAP_MINUTES` | 20 | Recovery lot bloqué en `delivering` |
| `DELIVERY_CSV_ONLY` | false | Finalise sans email (tests uniquement) |

## Migrations requises

```bash
npm exec tsx scripts/apply-parent-batch-migration.ts
```

Applique `027_parent_batch_orchestration.sql` et `028_parent_batch_hardening.sql`.

## Démarrer un lot 1 000

```http
POST /api/parent-batches
Authorization: Bearer <admin>
{
  "client_id": "<uuid>",
  "requested_count": 1000,
  "prospects": [ ... liste initiale optionnelle ... ]
}
```

Un seul lot actif par client (index unique migration 028).

## Surveillance

- `GET /api/parent-batches/active` — lots en cours + compteurs
- `GET /api/parent-batches/:id` — dashboard détaillé
- Table `batch_events` — journal des transitions
- Alertes Telegram via `notify()` sur stalls et échecs livraison

## Lot bloqué / stalled

**Symptômes** : `status = stalled` ou `delivering` > 20 min sans progrès.

**Actions** :
1. Vérifier `batch_events` et `failed_jobs` pour la cause.
2. `POST /api/parent-batches/:id/resume` — reprend depuis `stalled`, `failed`, ou `delivering`.
3. L'orchestrateur est ré-enfilé automatiquement.

## Échec email Gmail

- Le lot **ne** passe pas en `completed` si l'email échoue.
- Prospects relâchés depuis `delivering` → retry au cycle suivant.
- Ledger `deliveries.status = email_failed`.

## Réconciliation

Avant livraison : `reconcileDeliveryCounts()` bloque si doublons, claim vide, ou CSV ≠ claim.
Après livraison : mismatch → lot `stalled` (investigation manuelle).

## Tests sans email réel

```bash
DELIVERY_CSV_ONLY=true npm test
npm exec tsx scripts/run-batch-audit.ts
```

Client dédié `Batch Audit Client` — n'affecte pas les lots production.

## Incident fournisseur

| Fournisseur | Transitoire | Terminal |
|-------------|-------------|----------|
| Apify | timeout, 429 | auth, empty dataset, bad input |
| Anthropic | timeout, 529 | JSON invalide après retries |
| Gmail | timeout, 5xx | adresse invalide |

Retries scheduler respectent `shouldSchedulerRetryResearch()` et plafond coût `$0.25`/prospect.

## Limitations connues

- Google Drive upload : non implémenté (CSV en pièce jointe email uniquement).
- E2E live 1 000 prospects : utiliser simulation (`batch-stress-simulation.test.ts`) ou staging avec mocks.
- Orchestrateur multi-instance : pas de verrou advisory global (cron singleton pg-boss suffit en déploiement standard).

## Rollout production (exécuté via script)

```bash
npm exec tsx scripts/apply-parent-batch-migration.ts   # 027 + 028
npm run build && npm run start                          # workers pg-boss

npm exec tsx scripts/rollout-production.ts resolve-active
npm exec tsx scripts/rollout-production.ts pilot-fresh     # 15 prospects neufs (batch.json + test2)
npm exec tsx scripts/rollout-production.ts setup-sourcing "https://www.linkedin.com/sales/search/..."
npm exec tsx scripts/rollout-production.ts continue-rollout
npm exec tsx scripts/rollout-production.ts verify <id>
npm exec tsx scripts/rollout-production.ts launch-1000  # nécessite client_search_profiles
npm exec tsx scripts/rollout-production.ts status
npm exec tsx scripts/rollout-production.ts close <id> # fermer lot bloqué
```

**Blocages données courants**
- `inserted=0 skipped=100` → prospects déjà en DB (dedup) ; fournir une liste fraîche.
- `launch-1000` refuse si aucun `client_search_profiles.enabled=true` pour le client.
- Un seul lot actif par client (index migration 028).
