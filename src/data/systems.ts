export type SystemId =
  | 'skin'
  | 'muscular'
  | 'skeletal'
  | 'nervous'
  | 'cardiovascular'
  | 'respiratory'
  | 'digestive'
  | 'lymphatic'
  | 'urinary'
  | 'endocrine'
  | 'reproductive'

/** Body layers are peeled in order; organ systems sit inside the skeleton. */
export type SystemKind = 'layer' | 'organ'

export interface Spec {
  label: string
  value: string
  /** 0..1 — only for values that are a true fraction (shown as a bar). */
  bar?: number
}

export interface SystemInfo {
  id: SystemId
  kind: SystemKind
  /** Layer number shown on the card (1 = outermost). */
  layer: number
  title: [string, string]
  tagline: string
  location: string
  description: string
  accent: string
  specs: Spec[]
  stats: { label: string; value: string }[]
  /** Base names from the anatomy index (left side preferred when paired). */
  keyStructures: string[]
}

export const SYSTEMS: SystemInfo[] = [
  {
    id: 'skin',
    kind: 'layer',
    layer: 1,
    title: ['Integumentary', 'System'],
    tagline: 'Barrier · Sensation · Temperature',
    location: 'Whole body surface',
    description:
      'The skin is the body’s largest organ. It shields the tissues beneath from injury, microbes and water loss, senses touch, heat and pain, and helps hold body temperature steady through sweating and blood-flow changes.',
    accent: '#d08b6f',
    specs: [
      { label: 'Share of body weight', value: '~15%', bar: 0.15 },
      { label: 'Surface area (adult)', value: '1.5–2 m²' },
      { label: 'Thickness', value: '0.5–4 mm' },
      { label: 'Main layers', value: '3' },
    ],
    stats: [
      { label: 'Layers', value: 'Epidermis · Dermis · Hypodermis' },
      { label: 'Surface renewal', value: '~4 weeks' },
      { label: 'Thickest skin', value: 'Soles' },
    ],
    keyStructures: [],
  },
  {
    id: 'muscular',
    kind: 'layer',
    layer: 2,
    title: ['Muscular', 'System'],
    tagline: 'Movement · Posture · Heat',
    location: 'Attached across the skeleton',
    description:
      'Skeletal muscles pull on bones through tendons to move the body, keep it upright and generate most of its heat. They work in opposing pairs: when one contracts, its partner relaxes.',
    accent: '#c0392b',
    specs: [
      { label: 'Share of body weight', value: '~40%', bar: 0.4 },
      { label: 'Skeletal muscles', value: '600+' },
      { label: 'Largest', value: 'Gluteus maximus' },
      { label: 'Smallest', value: 'Stapedius' },
    ],
    stats: [
      { label: 'Muscle types', value: '3' },
      { label: 'Muscles', value: '600+' },
      { label: 'Control', value: 'Voluntary' },
    ],
    keyStructures: ['Deltoid muscle', 'Pectoralis major muscle', 'Biceps brachii muscle', 'Rectus abdominis muscle', 'Trapezius muscle', 'Gluteus maximus muscle', 'Rectus femoris muscle', 'Sartorius muscle'],
  },
  {
    id: 'skeletal',
    kind: 'layer',
    layer: 3,
    title: ['Skeletal', 'System'],
    tagline: 'Framework · Support · Protection',
    location: 'Axial and appendicular skeleton',
    description:
      'The skeleton is the body’s living framework. It supports and shapes the body, protects the brain, heart and lungs, anchors the muscles, stores calcium and makes blood cells in the marrow.',
    accent: '#b9a77f',
    specs: [
      { label: 'Share of body weight', value: '~15%', bar: 0.15 },
      { label: 'Bones (adult)', value: '206' },
      { label: 'Largest', value: 'Femur' },
      { label: 'Smallest', value: 'Stapes' },
    ],
    stats: [
      { label: 'Bones', value: '206' },
      { label: 'At birth', value: '~270' },
      { label: 'Joints', value: '~350' },
    ],
    keyStructures: ['Cranium', 'Vertebral column', 'Sternum', 'Femur', 'Hip bone', 'Mandible', 'Humerus', 'Tibia'],
  },
  {
    id: 'nervous',
    kind: 'organ',
    layer: 4,
    title: ['Nervous', 'System'],
    tagline: 'Control · Sensation · Thought',
    location: 'Brain, spinal cord and nerves',
    description:
      'The nervous system is the body’s command network. The brain and spinal cord process information, and nerves carry signals to and from every muscle, organ and patch of skin in fractions of a second.',
    accent: '#d4a72c',
    specs: [
      { label: 'Brain share of weight', value: '~2%', bar: 0.02 },
      { label: 'Neurons in brain', value: '~86 billion' },
      { label: 'Cranial nerves', value: '12 pairs' },
      { label: 'Spinal nerves', value: '31 pairs' },
    ],
    stats: [
      { label: 'Brain weight', value: '~1.4 kg' },
      { label: 'Signal speed', value: 'up to ~120 m/s' },
      { label: 'Divisions', value: 'Central · Peripheral' },
    ],
    keyStructures: ['Brain', 'Spinal cord', 'Brachial plexus', 'Sciatic nerve', 'Eyeball'],
  },
  {
    id: 'cardiovascular',
    kind: 'organ',
    layer: 5,
    title: ['Cardiovascular', 'System'],
    tagline: 'Circulation · Oxygen · Transport',
    location: 'Heart and blood vessels',
    description:
      'The heart pumps blood through a closed loop of arteries, capillaries and veins, delivering oxygen and nutrients to every cell and carrying carbon dioxide and wastes away.',
    accent: '#d63031',
    specs: [
      { label: 'Blood volume (adult)', value: '~5 L' },
      { label: 'Resting heart rate', value: '60–100 bpm' },
      { label: 'Heartbeats per day', value: '~100,000' },
      { label: 'Vessel length', value: '~100,000 km' },
    ],
    stats: [
      { label: 'Heart chambers', value: '4' },
      { label: 'Output at rest', value: '~5 L/min' },
      { label: 'Circuits', value: 'Pulmonary · Systemic' },
    ],
    keyStructures: ['Heart', 'Aorta', 'Superior vena cava', 'Femoral artery'],
  },
  {
    id: 'respiratory',
    kind: 'organ',
    layer: 6,
    title: ['Respiratory', 'System'],
    tagline: 'Breathing · Gas Exchange',
    location: 'Airways and lungs in the thorax',
    description:
      'Air travels through the nose, larynx, trachea and branching bronchi to millions of alveoli in the lungs, where oxygen passes into the blood and carbon dioxide passes out.',
    accent: '#e17f8b',
    specs: [
      { label: 'Breaths at rest', value: '12–20 /min' },
      { label: 'Alveoli', value: '~300–500 million' },
      { label: 'Exchange surface', value: '~70 m²' },
      { label: 'Air per breath', value: '~0.5 L' },
    ],
    stats: [
      { label: 'Right lung lobes', value: '3' },
      { label: 'Left lung lobes', value: '2' },
      { label: 'Main muscle', value: 'Diaphragm' },
    ],
    keyStructures: ['Lungs', 'Trachea', 'Larynx', 'Tracheobronchial tree'],
  },
  {
    id: 'digestive',
    kind: 'organ',
    layer: 7,
    title: ['Digestive', 'System'],
    tagline: 'Digestion · Absorption · Elimination',
    location: 'Mouth to anus, with liver and pancreas',
    description:
      'The digestive tract breaks food down mechanically and chemically, absorbs nutrients and water into the blood, and eliminates what remains. The liver, gallbladder and pancreas add the bile and enzymes it needs.',
    accent: '#b5651d',
    specs: [
      { label: 'Small intestine length', value: '~6 m' },
      { label: 'Liver weight', value: '~1.5 kg' },
      { label: 'Transit time', value: '24–72 h' },
      { label: 'Saliva per day', value: '~1–1.5 L' },
    ],
    stats: [
      { label: 'Largest internal organ', value: 'Liver' },
      { label: 'Main absorption', value: 'Small intestine' },
      { label: 'Adult teeth', value: '32' },
    ],
    keyStructures: ['Liver', 'Stomach', 'Duodenum', 'Pancreas', 'Gallbladder', 'Tongue'],
  },
  {
    id: 'lymphatic',
    kind: 'organ',
    layer: 8,
    title: ['Lymphatic', 'System'],
    tagline: 'Immunity · Fluid Balance',
    location: 'Nodes, spleen, thymus and tonsils',
    description:
      'Lymphatic vessels return excess tissue fluid to the blood. Along the way, lymph nodes filter it, and organs such as the spleen and thymus produce and train the white blood cells that fight infection.',
    accent: '#3fa45b',
    specs: [
      { label: 'Lymph nodes', value: '~500–700' },
      { label: 'Fluid returned daily', value: '~3 L' },
      { label: 'Largest organ', value: 'Spleen' },
      { label: 'Spleen weight', value: '~150 g' },
    ],
    stats: [
      { label: 'Main cells', value: 'Lymphocytes' },
      { label: 'Primary organs', value: 'Thymus · Marrow' },
      { label: 'Pump', value: 'None (muscle action)' },
    ],
    keyStructures: ['Spleen', 'Thymus', 'Palatine tonsil'],
  },
  {
    id: 'urinary',
    kind: 'organ',
    layer: 9,
    title: ['Urinary', 'System'],
    tagline: 'Filtration · Fluid · Balance',
    location: 'Kidneys, ureters, bladder, urethra',
    description:
      'The kidneys filter the blood continuously, removing wastes and excess water as urine while keeping salts, acidity and blood pressure in balance. Urine flows down the ureters to the bladder for storage.',
    accent: '#c9a227',
    specs: [
      { label: 'Blood filtered daily', value: '~180 L' },
      { label: 'Urine per day', value: '1–2 L' },
      { label: 'Nephrons per kidney', value: '~1 million' },
      { label: 'Bladder capacity', value: '400–600 mL' },
    ],
    stats: [
      { label: 'Kidneys', value: '2' },
      { label: 'Kidney length', value: '~12 cm' },
      { label: 'Filter unit', value: 'Nephron' },
    ],
    keyStructures: ['Kidney', 'Ureter', 'Urinary bladder', 'Urethra'],
  },
  {
    id: 'endocrine',
    kind: 'organ',
    layer: 10,
    title: ['Endocrine', 'System'],
    tagline: 'Hormones · Regulation · Growth',
    location: 'Glands across head, neck and trunk',
    description:
      'Endocrine glands release hormones into the blood to regulate growth, metabolism, stress responses, reproduction and sleep. Their signals are slower than nerve impulses but last much longer.',
    accent: '#8e5cc4',
    specs: [
      { label: 'Hormones', value: '50+' },
      { label: 'Pituitary weight', value: '~0.5 g' },
      { label: 'Thyroid weight', value: '~20–25 g' },
      { label: 'Parathyroid glands', value: '4' },
    ],
    stats: [
      { label: 'Master gland', value: 'Pituitary' },
      { label: 'Messengers', value: 'Hormones' },
      { label: 'Delivery', value: 'Bloodstream' },
    ],
    keyStructures: ['Hypophysis', 'Thyroid gland', 'Superior parathyroid gland'],
  },
  {
    id: 'reproductive',
    kind: 'organ',
    layer: 11,
    title: ['Reproductive', 'System'],
    tagline: 'Reproduction · Hormones',
    location: 'Pelvis and perineum (male)',
    description:
      'The male reproductive system produces sperm and the hormone testosterone. Sperm mature in the epididymis, travel through the ductus deferens and mix with fluids from the seminal glands and prostate.',
    accent: '#5b7bd5',
    specs: [
      { label: 'Main hormone', value: 'Testosterone' },
      { label: 'Sperm maturation', value: '~2–3 months' },
      { label: 'Prostate size', value: '~20 g' },
      { label: 'Accessory glands', value: '3 types' },
    ],
    stats: [
      { label: 'Gonads', value: 'Testes' },
      { label: 'Storage', value: 'Epididymis' },
      { label: 'Transport', value: 'Ductus deferens' },
    ],
    keyStructures: ['Testis', 'Epididymis', 'Prostate', 'Seminal gland'],
  },
]

export const SYSTEM_BY_ID = Object.fromEntries(SYSTEMS.map((s) => [s.id, s])) as Record<SystemId, SystemInfo>

export const LAYER_ORDER: SystemId[] = ['skin', 'muscular', 'skeletal']
