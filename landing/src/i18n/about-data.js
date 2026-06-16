const ABOUT_EN = {
  hero: {
    eyebrow: 'About Dossier',
    p1: "Dossier is a research-backed personalisation engine for B2B outbound. We dig into your prospects' signals, LinkedIn posts, podcasts, product launches, and company announcements, and turn them into cold email openers that earn a reply.",
    p2: 'Not a template tool. Not a prompt-to-spam machine. A research pipeline with a QA scoring layer, built for agencies and founders who know the first line is the only line that matters.',
  },
  stats: [
    { value: 9.6, suffix: '%', label: 'Reply rate, first pilot cohort', isDecimal: true },
    { value: 48, suffix: 'h', label: 'Standard delivery turnaround' },
    { value: 3, suffix: '', label: 'QA-scored openers per prospect' },
    { value: 100, suffix: '', label: 'Free openers to start. No card needed.' },
  ],
  founder: {
    eyebrow: 'The founder',
    title: 'The person behind Dossier.',
    role: 'Founder and CEO, Dossier',
    roleCard: 'Founder and CEO',
    tags: ['B2B Outbound', 'Cold Email', 'AI Research'],
    p1: 'I ran outbound campaigns for B2B clients before building Dossier. Reply rates held when we researched prospects individually. They fell the moment we tried to scale. The first line was always where the quality broke down.',
    p2: 'By the time AI writing tools became mainstream, every inbox was already flooded with openers that felt the same. High volume, low signal, generic framing. The tools made speed easier and quality worse. Every tool skipped the one step that actually mattered: reading what the prospect published.',
    p3: 'Dossier fixes the step every other tool skips. We collect real signals first, then draft, then score for quality, then deliver. Every opener we ship comes from something your prospect actually said, launched, or announced. That is the entire model.',
    quote: 'The best cold email opener proves you actually looked. Dossier makes that possible for every prospect on your list, at scale.',
    quoteAttribution: 'Ara Ghahramanyan, Founder',
    linkedin: 'LinkedIn',
    email: 'Email',
    linkedinAria: 'Ara Ghahramanyan on LinkedIn',
  },
  timeline: {
    eyebrow: 'How Dossier started',
    title1: 'The problem came first.',
    titleEm: 'The product followed.',
    milestones: [
      {
        tag: 'The problem',
        title: 'Personalisation that breaks at scale',
        body: 'Running outbound campaigns for B2B clients, the pattern was always the same. Reply rates held when prospects were researched individually. The moment we tried to scale, quality collapsed. Every tool on the market made the speed problem easier and the quality problem worse.',
      },
      {
        tag: 'The insight',
        title: 'The tools were skipping the research',
        body: 'Every AI writing tool, enrichment platform, and LinkedIn scraper tried to solve personalisation at the drafting stage. None of them actually read what a prospect published, said, or announced. They prompted from a name and a job title. That is not personalisation. That is automation.',
      },
      {
        tag: 'The build',
        title: 'Research first, then the draft',
        body: 'Dossier was designed around a different sequence: deep signal collection first, then AI-assisted drafting, then a QA scoring layer that removes anything below the bar. Signal. Draft. Score. Deliver. Every opener traces back to something real.',
      },
      {
        tag: 'First cohort',
        title: 'Pilot results: 9.6 percent average reply rate',
        body: 'The first external pilot ran 100 prospects across a B2B outbound campaign. Average reply rate landed at 9.6 percent. The research-first approach produced results that volume-first tools consistently miss.',
      },
      {
        tag: 'Public launch',
        title: 'Open to everyone, starting with 100 free lines',
        body: 'Dossier is now available for cold email agencies, B2B founders, and SDR teams. Every new customer starts with 100 free, QA-scored openers. No credit card required. No campaign access needed. Prove it works first, then decide.',
      },
    ],
  },
  whatWeDo: {
    eyebrow: 'What we do',
    title: 'The problem, the fix, the result.',
    cards: [
      {
        label: 'The problem',
        body: 'Cold email personalisation is broken. Tools that promise scale without research produce openers that apply to everyone and convert no one. Inboxes are smarter than ever. Generic copy does not work anymore.',
      },
      {
        label: 'How we fix it',
        body: 'A three-stage pipeline: deep prospect research across LinkedIn, podcasts, and company news. AI-assisted drafting of three opener variants per prospect. QA scoring to remove anything below the bar.',
      },
      {
        label: 'The result',
        body: 'A CSV of research-backed openers, QA-scored and ready for your sequencer. Pilot reply rates landed at 9.6 percent. Delivered in 48 hours. No campaign access. No credit card to start.',
      },
    ],
  },
  values: {
    eyebrow: 'Our principles',
    title: 'What we refuse to compromise on.',
    items: [
      {
        title: 'Research before everything',
        body: 'Every opener traces to a real, verifiable signal. No signal means no opener. We would rather send three accurate lines than fifty weak ones.',
      },
      {
        title: 'Quality over volume',
        body: 'A QA scoring layer removes openers that are too generic, too risky, or too weak. Your list receives our best work, not our average work.',
      },
      {
        title: 'Human and machine, honestly',
        body: 'AI drafts at scale. Humans design the research pipeline and the QA criteria. We are transparent about what each layer does and what it does not do.',
      },
      {
        title: 'Honest about fit',
        body: 'We tell you when Dossier is not the right tool. We would rather lose the deal than overpromise. Reputation is the only moat that compounds.',
      },
    ],
  },
  fit: {
    eyebrow: 'Who we work with',
    title: 'Good fit and not a fit.',
    sub: 'We would rather be direct upfront than spend both our time on a campaign that will not work.',
    goodLabel: 'Good fit',
    badLabel: 'Not a fit',
    good: [
      'Cold email agencies managing campaigns for multiple clients',
      'B2B founders running their own outbound motion',
      'SDR teams sending 50 to 500 personalised emails per week',
      'Growth teams that know personalisation starts with research',
      'Anyone who would rather send ten great emails than a thousand generic ones',
    ],
    bad: [
      'B2C outreach or consumer product campaigns',
      'Companies that want to blast high-volume sequences with no research',
      'Teams without a sequencer or sending infrastructure in place',
      'Anyone unwilling to provide a clean, enriched prospect list',
      'Businesses that expect overnight results without a testing phase',
    ],
  },
  contact: {
    eyebrow: 'Get in touch',
    title: 'Ways to reach Dossier.',
    sub: 'Want to talk through a specific use case, or find out if Dossier is the right tool for your team? Reach out directly.',
    cards: [
      { title: 'Email', desc: 'Direct line to Ara', action: null },
      { title: 'Phone', desc: 'Business line', action: null },
      { title: 'Book a call', desc: '30 minute Zoom or Teams', action: 'Pick a time' },
      { title: 'LinkedIn', desc: 'Follow for updates', action: 'Connect' },
    ],
  },
  cta: {
    eyebrow: 'Ready to start?',
    title1: 'Start with 100 prospects.',
    titleEm: 'Completely free.',
    sub: 'No credit card. No campaign access. Research-backed openers delivered in 48 hours. Or book a 30 minute call and we will walk through a live example from your niche.',
    cta1: 'Claim 100 Free Lines',
    cta2: 'Book a 30 Minute Call',
    disclaimer: 'No commitment. No credit card. Cancel or step back at any point.',
  },
}

const ABOUT_FR = {
  hero: {
    eyebrow: 'À propos de Dossier',
    p1: 'Dossier est un moteur de personnalisation basé sur la recherche pour l\'outbound B2B. Nous analysons les signaux de vos prospects — publications LinkedIn, podcasts, lancements produit et annonces — et les transformons en accroches de cold email qui obtiennent des réponses.',
    p2: 'Pas un outil de templates. Pas une machine à spam par prompt. Un pipeline de recherche avec couche de scoring QA, conçu pour les agences et fondateurs qui savent que la première ligne est la seule qui compte.',
  },
  stats: [
    { value: 9.6, suffix: '%', label: 'Taux de réponse, première cohorte pilote', isDecimal: true },
    { value: 48, suffix: 'h', label: 'Délai de livraison standard' },
    { value: 3, suffix: '', label: 'Accroches notées QA par prospect' },
    { value: 100, suffix: '', label: 'Accroches gratuites pour commencer. Sans carte.' },
  ],
  founder: {
    eyebrow: 'Le fondateur',
    title: 'La personne derrière Dossier.',
    role: 'Fondateur et PDG, Dossier',
    roleCard: 'Fondateur et PDG',
    tags: ['Outbound B2B', 'Cold email', 'Recherche IA'],
    p1: 'J\'ai géré des campagnes outbound pour des clients B2B avant de créer Dossier. Les taux de réponse tenaient quand on recherchait chaque prospect individuellement. Ils chutaient dès qu\'on tentait de scaler. La première ligne était toujours là où la qualité se cassait.',
    p2: 'Quand les outils d\'écriture IA sont devenus mainstream, chaque boîte mail était déjà saturée d\'accroches identiques. Volume élevé, signal faible, cadrage générique. Les outils ont facilité la vitesse et dégradé la qualité. Tous ont sauté l\'étape qui comptait vraiment : lire ce que le prospect a publié.',
    p3: 'Dossier corrige l\'étape que les autres outils ignorent. Nous collectons d\'abord de vrais signaux, puis rédigeons, notons la qualité, puis livrons. Chaque accroche provient de quelque chose que votre prospect a réellement dit, lancé ou annoncé. C\'est tout le modèle.',
    quote: 'La meilleure accroche de cold email prouve que vous avez vraiment regardé. Dossier rend cela possible pour chaque prospect de votre liste, à grande échelle.',
    quoteAttribution: 'Ara Ghahramanyan, Fondateur',
    linkedin: 'LinkedIn',
    email: 'Courriel',
    linkedinAria: 'Ara Ghahramanyan sur LinkedIn',
  },
  timeline: {
    eyebrow: 'Comment Dossier a démarré',
    title1: 'Le problème est venu en premier.',
    titleEm: 'Le produit a suivi.',
    milestones: [
      {
        tag: 'Le problème',
        title: 'La personnalisation qui casse à l\'échelle',
        body: 'En gérant des campagnes outbound pour des clients B2B, le schéma était toujours le même. Les taux de réponse tenaient quand chaque prospect était recherché individuellement. Dès qu\'on scalait, la qualité s\'effondrait. Chaque outil du marché facilitait la vitesse et aggravait le problème de qualité.',
      },
      {
        tag: 'L\'insight',
        title: 'Les outils sautaient la recherche',
        body: 'Chaque outil d\'écriture IA, plateforme d\'enrichissement ou scraper LinkedIn tentait de résoudre la personnalisation à l\'étape de rédaction. Aucun ne lisait vraiment ce qu\'un prospect a publié, dit ou annoncé. Ils promptaient à partir d\'un nom et d\'un titre. Ce n\'est pas de la personnalisation. C\'est de l\'automatisation.',
      },
      {
        tag: 'La construction',
        title: 'Recherche d\'abord, rédaction ensuite',
        body: 'Dossier a été conçu autour d\'une séquence différente : collecte approfondie de signaux, rédaction assistée par IA, puis couche de scoring QA qui élimine tout ce qui est sous le seuil. Signal. Brouillon. Score. Livraison. Chaque accroche remonte à quelque chose de réel.',
      },
      {
        tag: 'Première cohorte',
        title: 'Résultats pilote : 9,6 % de taux de réponse moyen',
        body: 'Le premier pilote externe a couvert 100 prospects sur une campagne outbound B2B. Le taux de réponse moyen a atteint 9,6 %. L\'approche recherche d\'abord a produit des résultats que les outils volume d\'abord ratent systématiquement.',
      },
      {
        tag: 'Lancement public',
        title: 'Ouvert à tous, à partir de 100 lignes gratuites',
        body: 'Dossier est maintenant disponible pour les agences cold email, fondateurs B2B et équipes SDR. Chaque nouveau client commence avec 100 accroches gratuites notées QA. Sans carte de crédit. Sans accès aux campagnes. Prouvez que ça marche, puis décidez.',
      },
    ],
  },
  whatWeDo: {
    eyebrow: 'Ce que nous faisons',
    title: 'Le problème, la solution, le résultat.',
    cards: [
      {
        label: 'Le problème',
        body: 'La personnalisation du cold email est cassée. Les outils qui promettent l\'échelle sans recherche produisent des accroches applicables à tout le monde et qui ne convertissent personne. Les boîtes mail sont plus intelligentes que jamais. Le copy générique ne fonctionne plus.',
      },
      {
        label: 'Notre solution',
        body: 'Un pipeline en trois étapes : recherche approfondie sur LinkedIn, podcasts et actualités. Rédaction assistée par IA de trois variantes par prospect. Scoring QA pour éliminer tout ce qui est sous le seuil.',
      },
      {
        label: 'Le résultat',
        body: 'Un CSV d\'accroches fondées sur la recherche, notées QA et prêtes pour votre séquenceur. Taux de réponse pilote à 9,6 %. Livré en 48 h. Sans accès campagne. Sans carte de crédit pour commencer.',
      },
    ],
  },
  values: {
    eyebrow: 'Nos principes',
    title: 'Ce sur quoi nous ne transigeons pas.',
    items: [
      {
        title: 'La recherche avant tout',
        body: 'Chaque accroche remonte à un signal réel et vérifiable. Pas de signal, pas d\'accroche. Nous préférons envoyer trois lignes précises que cinquante faibles.',
      },
      {
        title: 'Qualité plutôt que volume',
        body: 'Une couche de scoring QA élimine les accroches trop génériques, risquées ou faibles. Votre liste reçoit notre meilleur travail, pas notre moyenne.',
      },
      {
        title: 'Humain et machine, en toute transparence',
        body: 'L\'IA rédige à l\'échelle. Les humains conçoivent le pipeline de recherche et les critères QA. Nous sommes transparents sur ce que chaque couche fait — et ne fait pas.',
      },
      {
        title: 'Honnêtes sur l\'adéquation',
        body: 'Nous vous disons quand Dossier n\'est pas le bon outil. Nous préférons perdre le deal que surpromettre. La réputation est le seul fossé qui se compose.',
      },
    ],
  },
  fit: {
    eyebrow: 'Avec qui nous travaillons',
    title: 'Bon fit et pas un fit.',
    sub: 'Nous préférons être directs dès le départ plutôt que de perdre du temps sur une campagne qui ne fonctionnera pas.',
    goodLabel: 'Bon fit',
    badLabel: 'Pas un fit',
    good: [
      'Agences cold email gérant des campagnes pour plusieurs clients',
      'Fondateurs B2B qui gèrent leur propre outbound',
      'Équipes SDR envoyant 50 à 500 emails personnalisés par semaine',
      'Équipes growth qui savent que la personnalisation commence par la recherche',
      'Toute personne qui préfère envoyer dix excellents emails plutôt que mille génériques',
    ],
    bad: [
      'Outreach B2C ou campagnes produits grand public',
      'Entreprises voulant des séquences massives sans recherche',
      'Équipes sans séquenceur ou infrastructure d\'envoi en place',
      'Toute personne refusant de fournir une liste de prospects propre et enrichie',
      'Entreprises attendant des résultats du jour au lendemain sans phase de test',
    ],
  },
  contact: {
    eyebrow: 'Nous contacter',
    title: 'Comment joindre Dossier.',
    sub: 'Vous voulez discuter d\'un cas d\'usage précis ou savoir si Dossier convient à votre équipe ? Écrivez-nous directement.',
    cards: [
      { title: 'Courriel', desc: 'Ligne directe vers Ara', action: null },
      { title: 'Téléphone', desc: 'Ligne professionnelle', action: null },
      { title: 'Réserver un appel', desc: '30 min sur Zoom ou Teams', action: 'Choisir un créneau' },
      { title: 'LinkedIn', desc: 'Suivre les actualités', action: 'Se connecter' },
    ],
  },
  cta: {
    eyebrow: 'Prêt à commencer ?',
    title1: 'Commencez avec 100 prospects.',
    titleEm: 'Entièrement gratuit.',
    sub: 'Sans carte de crédit. Sans accès aux campagnes. Accroches fondées sur la recherche livrées en 48 h. Ou réservez un appel de 30 min et nous parcourrons un exemple live de votre niche.',
    cta1: '100 lignes gratuites',
    cta2: 'Réserver un appel de 30 min',
    disclaimer: 'Sans engagement. Sans carte de crédit. Arrêtez ou faites une pause à tout moment.',
  },
}

const VALUE_ICONS = ['Search', 'Award', 'Zap', 'Heart']
const WHAT_WE_DO_ICONS = ['XCircle', 'Search', 'CheckCircle']

export function getAboutContent(lang) {
  const base = lang === 'fr' ? ABOUT_FR : ABOUT_EN
  return {
    ...base,
    valueIconKeys: VALUE_ICONS,
    whatWeDoIconKeys: WHAT_WE_DO_ICONS,
  }
}
