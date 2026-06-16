const EXAMPLES_BY_LANG = {
  en: [
    {
      id: 1,
      signalType: 'LinkedIn article',
      signalMeta: 'Published Q3 2024 · 4.2k views',
      signalSummary:
        'Founder published a detailed analysis of why cold email reply rates collapsed across the industry from 2023 onward.',
      role: 'Founder, outbound consultancy',
      prospectSignal: 'Signal: LinkedIn article',
      before:
        '"Hi [First Name], I noticed you are in the outbound space and thought I would reach out. Your work looks really impressive. Would love to connect and potentially jump on a quick call."',
      after:
        '"Your piece on why cold email reply rates collapsed from 2023 onward is the clearest diagnosis I have seen published on the topic. You named the actual cause before most people in this space were willing to say it out loud."',
      why:
        'It references a specific published piece and mirrors the prospect’s framing. No vague compliment. The prospect instantly knows someone read the work.',
      qa: 5,
    },
    {
      id: 2,
      signalType: 'ProductHunt launch',
      signalMeta: 'February 2025 · Top 5 of the day',
      signalSummary:
        'Co-founder launched a B2B leads product positioned around “one CSV in, one ready-to-send campaign out”.',
      role: 'Co-founder, outbound SaaS',
      prospectSignal: 'Signal: ProductHunt launch',
      before:
        '"Congratulations on the recent launch. It looks like you are building something really exciting in the leads space. Would love to learn more about what you are working on and explore if there is any overlap."',
      after:
        '"Saw you built the positioning around one CSV in and one campaign out. That removes the five-step setup every other tool in this category hides behind. Sharp wedge for where the market is going."',
      why:
        'It uses their own positioning language and makes a competitive observation from public copy. The line reads like analysis, not outreach fluff.',
      qa: 5,
    },
    {
      id: 3,
      signalType: 'LinkedIn post series',
      signalMeta: '3 posts · 6.1k combined views',
      signalSummary:
        'CEO gradually reframed positioning from an “outbound tool” to a “pipeline system”, signaling a deliberate market shift.',
      role: 'CEO, GTM consulting firm',
      prospectSignal: 'Signal: LinkedIn post series',
      before:
        '"Hi [First Name], I came across your profile and noticed your company is doing some impressive work in GTM consulting. Would love to connect and see if there is any common ground between what we are each working on."',
      after:
        '"The shift from outbound tool to pipeline system across your last three posts is deliberate. That is not a messaging tweak. That is you stepping into a different competitive category before the market forces it."',
      why:
        'It spots a pattern across multiple posts and treats it as strategy. That depth is hard to fake with a quick scrape.',
      qa: 4,
    },
    {
      id: 4,
      signalType: 'Funding round',
      signalMeta: 'Seed announced, March 2025',
      signalSummary:
        'Founder announced a seed round and said the capital goes into outbound and pipeline first, not headcount.',
      role: 'Founder, B2B SaaS',
      prospectSignal: 'Signal: funding round',
      before:
        '"Congrats on the raise. That is a huge milestone for the team. Would love to connect and hear more about your plans for the next stage of growth."',
      after:
        '"You said the seed goes into pipeline before headcount. That is the opposite of what most teams do after a raise, and the ones who grow revenue before cost are usually the ones still standing 18 months later."',
      why:
        'It quotes the exact decision the founder made public and reads it as strategy. The generic compliment is replaced by a point of view.',
      qa: 5,
    },
    {
      id: 5,
      signalType: 'Hiring push',
      signalMeta: '3 SDR roles posted in 30 days',
      signalSummary:
        'Company posted three SDR openings in a month, a clear signal they are scaling outbound capacity fast.',
      role: 'Head of Sales, outbound agency',
      prospectSignal: 'Signal: hiring push',
      before:
        '"I saw you are hiring for a few sales roles. Exciting times. I would love to show you how we help teams like yours hit their targets faster."',
      after:
        '"Three SDR openings in thirty days says you are betting on volume to fill pipeline. The teams that win that bet usually fix research quality first, because more reps sending weak openers just scales the noise."',
      why:
        'It counts the exact roles and connects the hiring pattern to a risk the prospect is about to face. Specific, and useful even if they never reply.',
      qa: 4,
    },
  ],
  fr: [
    {
      id: 1,
      signalType: 'Article LinkedIn',
      signalMeta: 'Publié T3 2024 · 4,2 k vues',
      signalSummary:
        "Le fondateur a publié une analyse précise sur les raisons de l’effondrement des taux de réponse en cold email depuis 2023.",
      role: "Fondateur, agence outbound",
      prospectSignal: 'Signal : article LinkedIn',
      before:
        '"Bonjour [Prénom], j’ai vu que vous faites de l’outbound et je voulais vous contacter. Votre travail a l’air impressionnant. On peut se caler un petit call ?"',
      after:
        '"Ton article sur l’effondrement des taux de réponse depuis 2023 est l’analyse la plus claire que j’ai lue sur le sujet. Tu nommes la cause réelle, celle que la plupart n’osent pas dire à voix haute."',
      why:
        "La ligne cite un contenu précis et reprend le cadrage du prospect. Aucun compliment vague. On comprend immédiatement que quelqu’un a vraiment lu.",
      qa: 5,
    },
    {
      id: 2,
      signalType: 'Lancement ProductHunt',
      signalMeta: 'Février 2025 · Top 5 du jour',
      signalSummary:
        "Le cofondateur a lancé un produit leads B2B avec une promesse simple : un CSV en entrée, une campagne prête à envoyer en sortie.",
      role: "Cofondateur, SaaS outbound",
      prospectSignal: 'Signal : lancement ProductHunt',
      before:
        '"Bravo pour le lancement. Ça a l’air super intéressant dans l’univers des leads. J’aimerais en savoir plus et voir s’il y a des synergies."',
      after:
        '"J’ai vu que vous avez construit le positionnement autour de “un CSV in, une campagne out”. Ça supprime la mise en place en cinq étapes derrière laquelle se cachent tous les autres outils. Très bon angle pour 2025."',
      why:
        "La ligne reprend leurs mots et fait une observation concurrentielle à partir du copy public. Ça sonne comme une lecture du produit, pas comme de la prospection creuse.",
      qa: 5,
    },
    {
      id: 3,
      signalType: 'Série de posts LinkedIn',
      signalMeta: '3 posts · 6,1 k vues cumulées',
      signalSummary:
        "Le CEO fait évoluer le positionnement de “tool outbound” vers “pipeline system”, ce qui ressemble à un vrai pivot de catégorie.",
      role: "CEO, cabinet GTM",
      prospectSignal: 'Signal : série de posts LinkedIn',
      before:
        '"Bonjour [Prénom], je suis tombé sur votre profil et votre cabinet fait un travail impressionnant en GTM. On peut se connecter et voir s’il y a un terrain commun ?"',
      after:
        '"Le passage de “tool outbound” à “pipeline system” sur vos trois derniers posts est volontaire. Ce n’est pas un ajustement de wording. C’est un changement de catégorie avant que le marché vous y force."',
      why:
        "La ligne détecte un pattern sur plusieurs posts et le traite comme un signal stratégique. Cette profondeur est difficile à imiter avec un simple scrape.",
      qa: 4,
    },
    {
      id: 4,
      signalType: 'Levée de fonds',
      signalMeta: 'Seed annoncé, mars 2025',
      signalSummary:
        "Le fondateur a annoncé une levée seed et précisé que les fonds vont d’abord dans l’outbound et le pipeline, pas dans les recrutements.",
      role: 'Fondateur, SaaS B2B',
      prospectSignal: 'Signal : levée de fonds',
      before:
        '"Bravo pour la levée. C’est une étape énorme pour l’équipe. J’aimerais échanger sur vos prochains objectifs de croissance."',
      after:
        '"Vous avez dit que le seed va dans le pipeline avant les recrutements. C’est l’inverse de ce que font la plupart des équipes après une levée, et ce sont souvent celles qui font passer le revenu avant le coût qui tiennent les 18 mois suivants."',
      why:
        "La ligne cite la décision rendue publique par le fondateur et la lit comme une stratégie. Le compliment laisse place à un point de vue.",
      qa: 5,
    },
    {
      id: 5,
      signalType: 'Vague de recrutement',
      signalMeta: '3 postes SDR en 30 jours',
      signalSummary:
        "L’entreprise a publié trois offres SDR en un mois, un signal clair d’une montée en puissance rapide de l’outbound.",
      role: 'Directeur commercial, agence outbound',
      prospectSignal: 'Signal : vague de recrutement',
      before:
        '"J’ai vu que vous recrutez plusieurs profils commerciaux. Belle dynamique. J’aimerais vous montrer comment on aide les équipes comme la vôtre à atteindre leurs objectifs plus vite."',
      after:
        '"Trois postes SDR en trente jours, c’est un pari sur le volume pour remplir le pipeline. Les équipes qui gagnent ce pari corrigent d’abord la qualité de la recherche, car plus de reps qui envoient des accroches faibles ne fait que multiplier le bruit."',
      why:
        "La ligne compte les postes exacts et relie la vague de recrutement à un risque réel et imminent. Précis, et utile même sans réponse.",
      qa: 4,
    },
  ],
}

const OPENER_CARDS_BY_LANG = {
  en: [
    {
      quote:
        "Your breakdown of why cold email collapsed between 2023 and 2025 is the most precise articulation I've seen published. GPT filler is exactly the right framing.",
      role: 'Founder, outbound consultancy',
      signal: 'LinkedIn article, Q3 2024',
      qa: 4,
    },
    {
      quote:
        'Saw you shipped a new leads product in February and positioned it around removing the friction every other tool buries in five-step workflows. Smart wedge.',
      role: 'Co-founder, outbound SaaS',
      signal: 'ProductHunt launch, Feb 2025',
      qa: 5,
    },
    {
      quote:
        'You put the strongest result in your headline instead of burying it in a case study nobody reads. That choice probably explains why inbound is converting above your size.',
      role: 'Founder, B2B lead gen agency',
      signal: 'Website hero copy',
      qa: 4,
    },
  ],
  fr: [
    {
      quote:
        "Ton analyse sur l’effondrement du cold email entre 2023 et 2025 est la formulation la plus précise que j’ai lue. Le cadrage “filler” est exactement le bon.",
      role: "Fondateur, agence outbound",
      signal: 'Article LinkedIn, T3 2024',
      qa: 4,
    },
    {
      quote:
        "J’ai vu votre lancement en février et le positionnement “un CSV in, une campagne out”. Ça enlève la friction en cinq étapes que tous les autres outils imposent. Très bon wedge.",
      role: "Cofondateur, SaaS outbound",
      signal: 'ProductHunt, fév 2025',
      qa: 5,
    },
    {
      quote:
        "Tu mets le résultat le plus fort dans le hero au lieu de le cacher dans un case study. Ce choix explique probablement pourquoi l’inbound convertit au-dessus de votre taille.",
      role: 'Fondateur, agence lead gen B2B',
      signal: 'Copy du site, hero',
      qa: 4,
    },
  ],
}

export function getExamples(lang) {
  return EXAMPLES_BY_LANG[lang] || EXAMPLES_BY_LANG.en
}

export function getOpenerCards(lang) {
  return OPENER_CARDS_BY_LANG[lang] || OPENER_CARDS_BY_LANG.en
}

