const FREE_LINES_EN = {
  hero: {
    badge: 'Limited pilot spots available',
    intro: 'Send us your prospect list. We research each lead, write three QA-scored first lines, and return a ready-to-import CSV within 48 hours. No credit card. No campaign access. No commitment.',
    bullets: [
      'Three QA-scored openers per prospect',
      'Research signal and confidence score included',
      'Delivered as CSV in 24 to 48 hours',
      'Works with Smartlead, Instantly, Lemlist, and more',
      'No inboxes, no credentials, no campaign access'],
    bulletsAria: 'What is included',
  },
  form: {
    title: 'Claim your 100 free lines',
    subtitle: 'We confirm fit, get your list, and deliver within 48 hours.',
    ariaLabel: 'Pilot request form',
    fields: {
      name: 'Full name',
      email: 'Work email',
      company: 'Company name',
      url: 'LinkedIn or website',
      sequencer: 'Current sequencer',
      sequencerOptional: '(optional)',
      message: 'Your ICP and current outbound setup',
    },
    placeholders: {
      name: 'Sarah Chen',
      email: 'sarah@youragency.com',
      company: 'Apex Outbound',
      url: 'https://linkedin.com/in/yourprofile',
      sequencer: 'Smartlead, Instantly, Lemlist…',
      message: 'Who do you target, what sequencer do you use, and what reply rate are you currently getting?',
    },
    submit: 'Claim 100 Free Lines →',
    submitting: 'Sending…',
    footer: 'No credit card · No campaign access · No commitment',
    validationSummary: 'Please fill in all required fields above before submitting.',
    serverError: 'Something went wrong. Please try again.',
    mailtoSubject: (company) => `Pilot Request, ${company}`,
  },
  success: {
    title: 'You are in.',
    body: 'We will reach out within 24 hours to confirm your ICP and get your prospect list. Openers land in your inbox within 48 hours of receiving the list.',
  },
  validation: {
    nameRequired: 'Full name is required.',
    emailRequired: 'Work email is required.',
    emailInvalid: 'Enter a valid business email address.',
    companyRequired: 'Company name is required.',
    urlRequired: 'LinkedIn profile or website URL is required.',
    urlInvalid: 'Enter a full URL (https://…) or a LinkedIn profile link.',
    messageRequired: 'Please describe your ICP and current outbound setup.',
    messageShort: 'Please provide a bit more detail (at least 20 characters).',
  },
  included: {
    eyebrow: 'What you get',
    title: 'Exactly what lands ',
    titleEm: 'in your inbox.',
    items: [
      { title: '3 opener variants per prospect', body: 'Each lead gets three QA-scored first lines, each with a different angle and framing. You pick the one that fits your campaign.' },
      { title: 'Research signal included', body: 'Every opener comes with the source signal used: the LinkedIn article, product launch, pricing change, or public content that grounded the line.' },
      { title: 'Confidence score and reasoning', body: 'Each opener is rated on a 1 to 5 scale with a short note on why we scored it that way. Low-confidence leads are flagged, not shipped.' },
      { title: 'Ready-to-import CSV', body: 'The deliverable lands in your inbox as a formatted CSV. Load it into Smartlead, Instantly, Lemlist, EmailBison, or any sequencer that accepts CSV imports.' },
      { title: 'Delivered in 24 to 48 hours', body: 'Most pilot batches are delivered within one business day. Complex ICPs may take 48 hours if the research depth requires it.' },
      { title: 'No campaign access needed', body: 'We never ask for your inboxes, your sequencer login, or your campaign settings. You keep full control of everything except the opener itself.' }],
  },
  csv: {
    eyebrow: 'The deliverable',
    title: 'What the CSV actually ',
    titleEm: 'looks like.',
    signal: 'Signal:',
    openerA: 'Opener A',
    openerB: 'Opener B',
    qaScore: 'QA score',
    headers: ['Prospect', 'Company', 'Signal Used', 'Opener A', 'Opener B', 'QA Score', 'Confidence'],
    confHigh: 'High',
    confMedium: 'Medium',
  },
  examples: {
    eyebrow: 'Examples',
    title: 'What you will receive ',
    titleEm: 'for your prospects.',
    items: [
      { quote: "Your breakdown of why cold email collapsed between 2023 and 2025 is the most precise articulation of the problem I've seen published. GPT filler is exactly the right framing.", role: 'Founder, Outbound Consultancy', signal: 'LinkedIn article, Q3 2024', qa: 4 },
      { quote: 'Saw you shipped a new leads product in February and positioned it around removing the friction that every other tool buries in five-step workflows. Smart wedge for where the market is heading.', role: 'Co-Founder, Outbound SaaS', signal: 'ProductHunt launch review', qa: 5 },
      { quote: 'Most founders bury their best result in a case study nobody reads. You put it in your headline, smart move, and probably why your inbound is converting above what your size would suggest.', role: 'Founder, B2B Lead Gen Agency', signal: 'Website hero copy analysis', qa: 4 }],
  },
  faq: {
    eyebrow: 'Pilot FAQ',
    title: 'Questions about the 100 free lines',
    items: [
      { q: 'What is included in the 100 free lines pilot?', a: 'Three QA-scored opener variants per prospect, the research signal used, confidence scoring, and a ready-to-import CSV delivered in 24 to 48 hours.' },
      { q: 'Do you need access to my email sequencer?', a: 'No. We never ask for inboxes, sequencer logins, or campaign settings. You import the CSV yourself.' },
      { q: 'Which sequencers work with the CSV?', a: 'Smartlead, Instantly, Lemlist, EmailBison, and any tool that accepts CSV imports for personalized first lines.' },
      { q: 'How long does delivery take?', a: 'Most 100-prospect pilots are delivered within 24 to 48 hours after we receive your list. Complex ICPs may take the full 48 hours.' },
      { q: 'What counts as one prospect?', a: 'Each row in your CSV counts as one prospect. We research that lead and write three opener variants. Thin-profile leads are flagged, not hidden.' }],
  },
  cta: {
    eyebrow: 'No risk. No commitment.',
    title: 'Claim your 100 free lines ',
    titleEm: 'today.',
    bullets: ['No credit card required', 'No campaign access', 'No minimum commitment', 'Results in 24 to 48 hours'],
    button: 'Claim 100 Free Lines',
  },
  csvRows: [
    { n: 'J. Whitmore', co: 'LeadFlow Inc.', signal: 'LinkedIn article on cold email decay', a: "Your breakdown of why cold email collapsed 2023 to 2025 is the most precise articulation I've seen...", b: 'The part about confusing volume with signal is something most agencies still haven\'t admitted...', qa: '4/5', confKey: 'high' },
    { n: 'M. Okafor', co: 'Apex Outbound', signal: 'ProductHunt launch, Feb 2025', a: 'Saw you launched in February and positioned around removing friction everyone else buries in 5-step flows...', b: 'Your PH launch framing, one CSV in, one campaign out, is the clearest positioning in leads tooling this year...', qa: '5/5', confKey: 'high' },
    { n: 'R. Castillo', co: 'Clearpath B2B', signal: 'Twitter thread, 2.4k engagements', a: "Your thread on why SDR handoffs break under 50 people is something I've seen play out at 3 agencies...", b: 'The nuance about handoffs breaking before the CRM even exists usually gets lost when people write about this...', qa: '3/5', confKey: 'medium' }],
}

const FREE_LINES_FR = {
  hero: {
    badge: 'Places pilote limitées',
    intro: 'Envoyez-nous votre liste de prospects. Nous recherchons chaque lead, rédigeons trois accroches notées QA et renvoyons un CSV prêt à importer sous 48 h. Sans carte bancaire. Sans accès à vos campagnes. Sans engagement.',
    bullets: [
      'Trois accroches notées QA par prospect',
      'Signal de recherche et score de confiance inclus',
      'Livraison en CSV sous 24 à 48 h',
      'Compatible Smartlead, Instantly, Lemlist, etc.',
      'Pas d’accès boîtes mail, identifiants ou campagnes'],
    bulletsAria: 'Ce qui est inclus',
  },
  form: {
    title: 'Réclamez vos 100 lignes gratuites',
    subtitle: 'Nous validons l’adéquation, récupérons votre liste et livrons sous 48 h.',
    ariaLabel: 'Formulaire de demande pilote',
    fields: {
      name: 'Nom complet',
      email: 'E-mail professionnel',
      company: 'Nom de l’entreprise',
      url: 'LinkedIn ou site web',
      sequencer: 'Outil de séquence actuel',
      sequencerOptional: '(facultatif)',
      message: 'Votre ICP et votre setup outbound actuel',
    },
    placeholders: {
      name: 'Marie Dupont',
      email: 'marie@votreagence.com',
      company: 'Apex Outbound',
      url: 'https://linkedin.com/in/votreprofil',
      sequencer: 'Smartlead, Instantly, Lemlist…',
      message: 'Qui ciblez-vous, quel outil utilisez-vous et quel taux de réponse obtenez-vous actuellement ?',
    },
    submit: 'Réclamer 100 lignes gratuites →',
    submitting: 'Envoi…',
    footer: 'Sans carte bancaire · Sans accès campagne · Sans engagement',
    validationSummary: 'Veuillez remplir tous les champs obligatoires avant d’envoyer.',
    serverError: 'Une erreur s’est produite. Veuillez réessayer.',
    mailtoSubject: (company) => `Demande pilote, ${company}`,
  },
  success: {
    title: 'C’est enregistré.',
    body: 'Nous vous contactons sous 24 h pour confirmer votre ICP et récupérer votre liste. Les accroches arrivent dans votre boîte mail sous 48 h après réception de la liste.',
  },
  validation: {
    nameRequired: 'Le nom complet est obligatoire.',
    emailRequired: 'L’e-mail professionnel est obligatoire.',
    emailInvalid: 'Saisissez une adresse e-mail professionnelle valide.',
    companyRequired: 'Le nom de l’entreprise est obligatoire.',
    urlRequired: 'L’URL LinkedIn ou du site web est obligatoire.',
    urlInvalid: 'Saisissez une URL complète (https://…) ou un lien de profil LinkedIn.',
    messageRequired: 'Décrivez votre ICP et votre setup outbound actuel.',
    messageShort: 'Merci d’ajouter un peu plus de détail (au moins 20 caractères).',
  },
  included: {
    eyebrow: 'Ce que vous recevez',
    title: 'Exactement ce qui arrive ',
    titleEm: 'dans votre boîte mail.',
    items: [
      { title: '3 variantes d’accroche par prospect', body: 'Chaque lead reçoit trois premières lignes notées QA, avec un angle différent. Vous choisissez celle qui correspond à votre campagne.' },
      { title: 'Signal de recherche inclus', body: 'Chaque accroche est accompagnée du signal source : article LinkedIn, lancement produit, changement de tarifs ou contenu public ayant fondé la ligne.' },
      { title: 'Score de confiance et justification', body: 'Chaque accroche est notée de 1 à 5 avec une courte explication. Les leads à faible confiance sont signalés, pas livrés en silence.' },
      { title: 'CSV prêt à importer', body: 'La livraison arrive par e-mail au format CSV. Importez dans Smartlead, Instantly, Lemlist, EmailBison ou tout outil acceptant les CSV.' },
      { title: 'Livré sous 24 à 48 h', body: 'La plupart des lots pilote sont livrés en un jour ouvré. Les ICP complexes peuvent prendre 48 h si la recherche l’exige.' },
      { title: 'Aucun accès campagne requis', body: 'Nous ne demandons jamais vos boîtes mail, identifiants séquenceur ou paramètres de campagne. Vous gardez le contrôle de tout sauf l’accroche elle-même.' }],
  },
  csv: {
    eyebrow: 'La livraison',
    title: 'À quoi ressemble vraiment ',
    titleEm: 'le CSV.',
    signal: 'Signal :',
    openerA: 'Accroche A',
    openerB: 'Accroche B',
    qaScore: 'Score QA',
    headers: ['Prospect', 'Entreprise', 'Signal utilisé', 'Accroche A', 'Accroche B', 'Score QA', 'Confiance'],
    confHigh: 'Élevée',
    confMedium: 'Moyenne',
  },
  examples: {
    eyebrow: 'Exemples',
    title: 'Ce que vous recevrez ',
    titleEm: 'pour vos prospects.',
    items: [
      { quote: 'Votre analyse de l’effondrement du cold email entre 2023 et 2025 est la formulation la plus précise du problème que j’ai vue publiée. Le terme « remplissage GPT » est exactement le bon cadrage.', role: 'Fondatrice, conseil outbound', signal: 'Article LinkedIn, T3 2024', qa: 4 },
      { quote: 'J’ai vu que vous avez lancé un produit leads en février en le positionnant sur la suppression des frictions que les autres outils enterrent dans des workflows en cinq étapes. Bon angle pour l’évolution du marché.', role: 'Co-fondateur, SaaS outbound', signal: 'Avis lancement ProductHunt', qa: 5 },
      { quote: 'La plupart des fondateurs enterrent leur meilleur résultat dans une étude de cas que personne ne lit. Vous l’avez mis en titre, bon choix, et probablement pourquoi votre inbound convertit au-dessus de ce qu’on attendrait à votre taille.', role: 'Fondatrice, agence lead gen B2B', signal: 'Analyse hero du site', qa: 4 }],
  },
  faq: {
    eyebrow: 'FAQ pilote',
    title: 'Questions sur les 100 lignes gratuites',
    items: [
      { q: 'Que comprend le pilote de 100 lignes gratuites ?', a: 'Trois variantes d’accroche notées QA par prospect, le signal de recherche utilisé, le score de confiance et un CSV prêt à importer livré sous 24 à 48 h.' },
      { q: 'Avez-vous besoin d’accéder à mon outil d’e-mail ?', a: 'Non. Nous ne demandons jamais les boîtes mail, identifiants séquenceur ou paramètres de campagne. Vous importez le CSV vous-même.' },
      { q: 'Quels séquenceurs acceptent le CSV ?', a: 'Smartlead, Instantly, Lemlist, EmailBison et tout outil acceptant les imports CSV pour des premières lignes personnalisées.' },
      { q: 'Combien de temps prend la livraison ?', a: 'La plupart des pilotes de 100 prospects sont livrés sous 24 à 48 h après réception de votre liste. Les ICP complexes peuvent prendre 48 h.' },
      { q: 'Qu’est-ce qui compte comme un prospect ?', a: 'Chaque ligne de votre CSV compte pour un prospect. Nous recherchons ce lead et rédigeons trois variantes. Les profils fins sont signalés, pas masqués.' }],
  },
  cta: {
    eyebrow: 'Sans risque. Sans engagement.',
    title: 'Réclamez vos 100 lignes gratuites ',
    titleEm: 'aujourd’hui.',
    bullets: ['Sans carte bancaire', 'Sans accès campagne', 'Sans engagement minimum', 'Résultats sous 24 à 48 h'],
    button: 'Réclamer 100 lignes gratuites',
  },
  csvRows: FREE_LINES_EN.csvRows,
}

const INCLUDED_ICONS = ['PenLine', 'Search', 'BarChart2', 'FileSpreadsheet', 'Clock', 'Shield']

export function getFreeLinesContent(lang) {
  const c = lang === 'fr' ? FREE_LINES_FR : FREE_LINES_EN
  return { ...c, confLabels: { high: c.csv.confHigh, medium: c.csv.confMedium } }
}

export function validateFreeLinesForm(form, v) {
  const e = {}
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
  const URL_RE = /^(https?:\/\/)|(www\.)|(linkedin\.com)/i

  if (!form.name.trim()) e.name = v.nameRequired
  if (!form.email.trim()) e.email = v.emailRequired
  else if (!EMAIL_RE.test(form.email.trim())) e.email = v.emailInvalid
  if (!form.company.trim()) e.company = v.companyRequired
  if (!form.url.trim()) e.url = v.urlRequired
  else if (!URL_RE.test(form.url.trim())) e.url = v.urlInvalid
  if (!form.message.trim()) e.message = v.messageRequired
  else if (form.message.trim().length < 20) e.message = v.messageShort

  return e
}

export { INCLUDED_ICONS }
