import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL      = 'https://bigmdvjrvqyqzyrijdum.supabase.co';
export const SUPABASE_KEY      = 'sb_publishable_talkHlFD0xQW4cRz_It33g_NTgET_eA';
export const CLOUDINARY_CLOUD  = 'jewelleryinventory';
export const CLOUDINARY_PRESET = 'jewelleryupload';
export const N8N_BASE          = 'https://n8n.srv1639765.hstgr.cloud/webhook';
export const N8N_UPLOAD_URL    = N8N_BASE + '/jewellery-upload';
export const N8N_DELETE_URL    = N8N_BASE + '/delete-product';
export const N8N_SIGNUP_URL    = N8N_BASE + '/store-approval-request';
// this is export
export const db = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'karat-auth-v2',
    storage: window.localStorage,
  },
});

export const SUBCATEGORY_MAP = {
  Ring: ['Engagement Rings','Wedding Bands','Solitaire Rings','Cocktail Rings','Daily Wear Rings','Couple Rings',"Men's Rings",'Eternity Rings','Half-Eternity Rings'],
  Earring: ['Studs','Jhumkas','Hoops','Drop & Dangle','Chandeliers','Ear Cuffs','Huggies','Tops / Tops with Chain','Clip-on'],
  Necklace: ['Chokers','Layered Necklaces','Necklace Sets','Harams','Temple Jewellery','Kundan Necklaces','Polki Necklaces','Diamond Necklaces','Gold Necklaces','Short Necklace (18")'],
  Bangle: ['Gold Bangles','Diamond Bangles','Kada','Bangle Sets','Openable Bangles','Antique Bangles','Polki Bangles'],
  Bracelet: ['Tennis Bracelets','Link Bracelets','Charm Bracelets',"Men's Bracelets",'Stackable Bracelets','Cuff Bracelets'],
  Pendant: ['Pendant with Chain','Pendant Sets','Religious Pendants','Solitaire Pendants','Initial Pendants','Lockets','Enamel Pendants'],
  Mangalsutra: ['Traditional Mangalsutra','Diamond Mangalsutra','Lightweight Mangalsutra','Short Mangalsutra','Long Mangalsutra','Tanmaniya'],
  Chain: ['Gold Chains',"Men's Chains",'Box Chains','Rope Chains','Fancy Chains','Rolo Chains'],
  Anklet: ['Gold Anklets','Silver Anklets','Diamond Anklets','Beaded Anklets'],
  Nosepin: ['Stud Nosepins','Ring Nosepins (Nath)','Clip-on Nosepins'],
  'Maang Tikka': ['Traditional Maang Tikka','Passa / Side Tikka','Jhoomar','Chain Maang Tikka'],
  Brooch: ['Floral Brooches','Religious Brooches','Animal Brooches','Geometric Brooches'],
  Set: ['Necklace + Earring Set','Full Bridal Set','Ring + Earring Set','3-Piece Set','5-Piece Set'],
  'Loose Stone': ['Diamonds','Rubies','Emeralds','Sapphires','Polki','Pearls','Semi-precious Stones'],
  Coin: ['2g Gold Coin','4g Gold Coin','5g Gold Coin','8g Gold Coin','10g Gold Coin','20g Gold Coin','50g Gold Bar','100g Gold Bar'],
  Other: ['Custom Order','Antique Piece','Heirloom','Miscellaneous'],
};

export const CATEGORIES = [
  { value: 'Ring', label: 'Rings' },
  { value: 'Earring', label: 'Earrings' },
  { value: 'Necklace', label: 'Necklaces' },
  { value: 'Bangle', label: 'Bangles' },
  { value: 'Bracelet', label: 'Bracelets' },
  { value: 'Pendant', label: 'Pendants' },
  { value: 'Mangalsutra', label: 'Mangalsutra' },
  { value: 'Chain', label: 'Chains' },
  { value: 'Anklet', label: 'Anklets' },
  { value: 'Nosepin', label: 'Nosepins' },
  { value: 'Maang Tikka', label: 'Maang Tikka' },
  { value: 'Brooch', label: 'Brooches' },
  { value: 'Set', label: 'Sets' },
  { value: 'Loose Stone', label: 'Loose Stones' },
  { value: 'Coin', label: 'Gold Coins & Bars' },
  { value: 'Other', label: 'Other' },
];

export const GOLD_CARATS = ['18K Gold','20K Gold','22K Gold','24K Gold','18K White Gold','18K Rose Gold','Platinum'];
export const DIAMOND_PURITIES = ['SI1','SI2','VS1','VS2','VVS1','VVS2','IF','FL'];

export const INACTIVITY_MS = 30 * 60 * 1000;
