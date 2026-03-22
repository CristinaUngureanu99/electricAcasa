export const site = {
  name: 'electricAcasa',
  nameFull: 'electricAcasa.ro — Materiale Electrice Online',
  tagline: 'Materiale electrice de calitate, livrate la tine acasa',
  welcome: 'Bine ai venit la electricAcasa',
  team: 'Echipa electricAcasa',
  logoAlt: 'electricAcasa.ro',

  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://electricacasa.ro',
  fromEmail: process.env.EMAIL_FROM || 'electricAcasa <noreply@electricacasa.ro>',

  contact: {
    email: 'contact@electricacasa.ro',
    phone: '+40700000000',
  },

  shipping: {
    fixedCost: 25,
    freeThreshold: 300,
  },

  lowStockThreshold: 5,

  currency: 'RON',
} as const;
