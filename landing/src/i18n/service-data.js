const SERVICE_EN = {
  hero: {
    eyebrow: 'Service',
    p1: 'Dossier is a done-for-you B2B outbound personalization service. We research each prospect, write QA-scored cold email openers, and deliver them as a CSV your team imports into its sequencer.',
    p2: 'The service is built for outbound agencies, B2B founders, and SDR teams that need reply-rate lift without hiring researchers or granting campaign access. Pilots start with 100 free prospects; paid plans scale to 500 or 2,000 prospects per month.',
  },
  pipeline: {
    eyebrow: 'How the service works',
    title: 'Research pipeline with a QA layer',
    steps: [
      {
        title: 'Prospect research',
        body: 'We review public signals per lead: LinkedIn posts, launches, podcasts, hiring moves, pricing pages, and company news. Thin profiles are flagged, not hidden.',
      },
      {
        title: 'Opener generation',
        body: 'Three first-line variants per prospect, each with a distinct angle. Lines are written to stand alone without follow-up context.',
      },
      {
        title: 'QA scoring',
        body: 'Each opener is scored 1 to 5 on specificity, autonomy, repetition density, and factual density. Low-scoring lines are revised or flagged before delivery.',
      },
      {
        title: 'CSV delivery',
        body: 'You receive a ready-to-import CSV for Smartlead, Instantly, Lemlist, EmailBison, or any sequencer that accepts custom first lines. Typical pilot turnaround: 24 to 48 hours.',
      }],
  },
  deliverables: {
    eyebrow: 'Deliverables',
    title: 'What every Dossier delivery includes',
    items: [
      'Three QA-scored opener variants per prospect',
      'Research signal and source note per line',
      'Confidence score with reviewer notes',
      'Thin-profile flags for low-signal leads',
      'CSV formatted for major cold email sequencers',
      'No inbox access or campaign permissions required'],
    cta1: 'Start with 100 free lines',
    cta2: 'See pricing',
    cta3: 'Contact us',
  },
}

const SERVICE_FR = {
  hero: {
    eyebrow: 'Service',
    p1: 'Dossier est un service clé en main de personnalisation outbound B2B. Nous recherchons chaque prospect, rédigeons des accroches de cold email notées QA et les livrons en CSV à importer dans votre séquenceur.',
    p2: 'Le service s\'adresse aux agences outbound, fondateurs B2B et équipes SDR qui veulent augmenter le taux de réponse sans recruter des chercheurs ni donner accès aux campagnes. Les pilotes commencent avec 100 prospects gratuits ; les forfaits payants montent à 500 ou 2 000 prospects par mois.',
  },
  pipeline: {
    eyebrow: 'Comment le service fonctionne',
    title: 'Pipeline de recherche avec couche QA',
    steps: [
      {
        title: 'Recherche prospect',
        body: 'Nous analysons les signaux publics par lead : posts LinkedIn, lancements, podcasts, recrutements, pages tarifs et actualités. Les profils minces sont signalés, pas masqués.',
      },
      {
        title: 'Génération d\'accroches',
        body: 'Trois variantes de première ligne par prospect, chacune avec un angle distinct. Les lignes tiennent seules, sans contexte de relance.',
      },
      {
        title: 'Scoring QA',
        body: 'Chaque accroche est notée de 1 à 5 sur la spécificité, l\'autonomie, la densité de répétition et la densité factuelle. Les lignes faibles sont révisées ou signalées avant livraison.',
      },
      {
        title: 'Livraison CSV',
        body: 'Vous recevez un CSV prêt à importer pour Smartlead, Instantly, Lemlist, EmailBison ou tout séquenceur acceptant des premières lignes personnalisées. Délai pilote typique : 24 à 48 h.',
      }],
  },
  deliverables: {
    eyebrow: 'Livrables',
    title: 'Ce que chaque livraison Dossier inclut',
    items: [
      'Trois variantes d\'accroche notées QA par prospect',
      'Signal de recherche et source par ligne',
      'Score de confiance avec notes du relecteur',
      'Indicateurs de profil mince pour les leads à faible signal',
      'CSV formaté pour les principaux séquenceurs cold email',
      'Aucun accès boîte mail ni permission campagne requis'],
    cta1: 'Commencer avec 100 lignes gratuites',
    cta2: 'Voir les tarifs',
    cta3: 'Nous contacter',
  },
}

export function getServiceContent(lang) {
  return lang === 'fr' ? SERVICE_FR : SERVICE_EN
}
