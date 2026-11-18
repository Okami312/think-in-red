import type { Category } from '../products/categories';

type SeedProduct = {
  name: string;
  category: Category;
  description: string;
  price: number;
  available_quantity: number;
  featured?: boolean;
  sold_from?: string;
  image?: string;
  gallery?: string[];
  specs: [label: string, value: string][];
};

// Demo catalog for the ThinkInRed portfolio store: pre-owned ThinkPad gear
// from the 2010–2020 era. Prices are in EUR and are ESTIMATES of typical
// used prices on ebay.de — not live data. Specs are illustrative.
// image: file name in frontend/public/products/ (served at /products/<file>).
// The first featured laptop is the home page spotlight.
export const CATALOG: SeedProduct[] = [
  // ── laptops
  {
    name: 'ThinkPad X1 Carbon Gen 8',
    image: 'x1-carbon-gen-8.webp',
    gallery: ['x1-carbon-gen-8-ports.webp'],
    category: 'laptops',
    description:
      'The 2020 X1 Carbon: a carbon-fibre chassis just over 1 kg, a bright 14" display and the keyboard that made the line famous. Still one of the best business ultrabooks around.',
    price: 449,
    available_quantity: 4,
    featured: true,
    specs: [
      ['Released', '2020'],
      ['Condition', 'Used — very good'],
      ['Processor', 'Intel Core i7-10510U'],
      ['Memory', '16 GB LPDDR3'],
      ['Storage', '512 GB NVMe SSD'],
      ['Display', '14" FHD IPS, 400 nits'],
      ['Weight', '1.09 kg'],
      ['Ports', '2× Thunderbolt 3, 2× USB-A, HDMI'],
    ],
  },
  {
    name: 'ThinkPad 25',
    image: 'thinkpad-25.webp',
    gallery: [
      'thinkpad-25-2.webp',
      'thinkpad-25-3.webp',
      'thinkpad-25-4.webp',
      'thinkpad-25-5.webp',
    ],
    category: 'laptops',
    description:
      "The 25th-anniversary limited edition from 2017: a T470 body with the classic 7-row keyboard, a retro multicolour logo, blue Enter key and soft-touch lid. A collector's piece you can still use every day.",
    price: 799,
    available_quantity: 1,
    featured: true,
    specs: [
      ['Released', '2017 — limited edition'],
      ['Condition', 'Used — very good'],
      ['Processor', 'Intel Core i7-7500U'],
      ['Graphics', 'NVIDIA GeForce 940MX, 2 GB'],
      ['Memory', '16 GB DDR4'],
      ['Storage', '512 GB NVMe SSD'],
      ['Display', '14" FHD IPS'],
      ['Keyboard', 'Classic 7-row, backlit'],
      ['Weight', '1.69 kg'],
    ],
  },
  {
    name: 'ThinkPad X220',
    category: 'laptops',
    description:
      'The cult classic: the last X-series with the 7-row keyboard, a 12.5" IPS panel and a chassis you can fix with a screwdriver.',
    price: 169,
    available_quantity: 3,
    featured: true,
    specs: [
      ['Released', '2011'],
      ['Condition', 'Used — good'],
      ['Processor', 'Intel Core i5-2520M'],
      ['Memory', '8 GB DDR3'],
      ['Storage', '256 GB SSD'],
      ['Display', '12.5" HD IPS'],
      ['Keyboard', 'Classic 7-row'],
      ['Weight', '1.5 kg'],
    ],
  },
  {
    name: 'ThinkPad T420',
    category: 'laptops',
    description:
      'A full-size 14" workhorse with the classic keyboard, a DVD bay and room for every upgrade.',
    price: 139,
    available_quantity: 5,
    specs: [
      ['Released', '2011'],
      ['Condition', 'Used — good'],
      ['Processor', 'Intel Core i5-2520M'],
      ['Memory', '8 GB DDR3'],
      ['Storage', '256 GB SSD'],
      ['Display', '14" HD+ (1600 × 900)'],
      ['Keyboard', 'Classic 7-row'],
      ['Weight', '2.2 kg'],
    ],
  },
  {
    name: 'ThinkPad X230',
    category: 'laptops',
    description:
      "The X220's successor with Ivy Bridge power and a backlit island keyboard. Small, tough, endlessly upgradeable.",
    price: 159,
    available_quantity: 2,
    specs: [
      ['Released', '2012'],
      ['Condition', 'Used — very good'],
      ['Processor', 'Intel Core i5-3320M'],
      ['Memory', '8 GB DDR3'],
      ['Storage', '256 GB SSD'],
      ['Display', '12.5" HD IPS'],
      ['Weight', '1.3 kg'],
    ],
  },
  {
    name: 'ThinkPad T440p',
    category: 'laptops',
    description:
      'The modder\'s favourite: socketed CPU, swappable optical bay and a sturdy 14" body.',
    price: 169,
    available_quantity: 4,
    specs: [
      ['Released', '2013'],
      ['Condition', 'Used — good'],
      ['Processor', 'Intel Core i5-4300M'],
      ['Memory', '8 GB DDR3L'],
      ['Storage', '256 GB SSD'],
      ['Display', '14" HD+ (1600 × 900)'],
      ['Weight', '2.2 kg'],
    ],
  },
  {
    name: 'ThinkPad T460s',
    category: 'laptops',
    description:
      'Slim, light and properly business-grade, with a sharp 14" Full HD screen.',
    price: 179,
    available_quantity: 3,
    specs: [
      ['Released', '2016'],
      ['Condition', 'Used — very good'],
      ['Processor', 'Intel Core i5-6300U'],
      ['Memory', '12 GB DDR4'],
      ['Storage', '256 GB SSD'],
      ['Display', '14" FHD IPS'],
      ['Weight', '1.36 kg'],
    ],
  },
  {
    name: 'ThinkPad T470',
    image: 't470.webp',
    gallery: ['t470-2.webp', 't470-3.webp', 't470-4.webp', 't470-5.webp'],
    category: 'laptops',
    description:
      'The 2017 all-rounder: Kaby Lake power, a Full HD screen and Power Bridge dual batteries you can hot-swap on the go.',
    price: 199,
    available_quantity: 5,
    specs: [
      ['Released', '2017'],
      ['Condition', 'Used — very good'],
      ['Processor', 'Intel Core i5-7300U'],
      ['Memory', '8 GB DDR4'],
      ['Storage', '256 GB NVMe SSD'],
      ['Display', '14" FHD IPS'],
      ['Battery', 'Power Bridge, 2 batteries'],
      ['Weight', '1.58 kg'],
    ],
  },
  {
    name: 'ThinkPad T470s',
    category: 'laptops',
    description:
      'The slimmer T470: thinner, lighter, with an aluminium lid and the same great keyboard.',
    price: 209,
    available_quantity: 3,
    specs: [
      ['Released', '2017'],
      ['Condition', 'Used — very good'],
      ['Processor', 'Intel Core i5-7300U'],
      ['Memory', '8 GB DDR4'],
      ['Storage', '256 GB NVMe SSD'],
      ['Display', '14" FHD IPS'],
      ['Weight', '1.32 kg'],
    ],
  },
  {
    name: 'ThinkPad T470p',
    category: 'laptops',
    description:
      'The performance T470: a quad-core HQ processor and dedicated NVIDIA graphics in a 14" body.',
    price: 249,
    available_quantity: 2,
    specs: [
      ['Released', '2017'],
      ['Condition', 'Used — good'],
      ['Processor', 'Intel Core i7-7700HQ'],
      ['Graphics', 'NVIDIA GeForce 940MX, 2 GB'],
      ['Memory', '16 GB DDR4'],
      ['Storage', '512 GB NVMe SSD'],
      ['Display', '14" FHD IPS'],
      ['Weight', '1.9 kg'],
    ],
  },
  {
    name: 'ThinkPad T480',
    image: 't480.webp',
    gallery: ['t480-2.webp', 't480-3.webp'],
    category: 'laptops',
    description:
      'Possibly the best all-rounder ThinkPad: quad-core, Thunderbolt 3 and hot-swappable dual batteries.',
    price: 279,
    available_quantity: 6,
    featured: true,
    specs: [
      ['Released', '2018'],
      ['Condition', 'Used — very good'],
      ['Processor', 'Intel Core i5-8350U'],
      ['Memory', '16 GB DDR4'],
      ['Storage', '512 GB NVMe SSD'],
      ['Display', '14" FHD IPS'],
      ['Battery', 'Power Bridge, 2 batteries'],
      ['Weight', '1.58 kg'],
    ],
  },
  {
    name: 'ThinkPad X280',
    category: 'laptops',
    description:
      'A 12.5" Full HD travel companion that weighs barely more than a kilo.',
    price: 219,
    available_quantity: 2,
    specs: [
      ['Released', '2018'],
      ['Condition', 'Used — very good'],
      ['Processor', 'Intel Core i5-8250U'],
      ['Memory', '8 GB DDR4'],
      ['Storage', '256 GB NVMe SSD'],
      ['Display', '12.5" FHD IPS'],
      ['Weight', '1.13 kg'],
    ],
  },
  // ── workstations (laptops category)
  {
    name: 'ThinkPad W520',
    category: 'laptops',
    description:
      'The original Sandy Bridge mobile workstation: quad-core, Quadro graphics and a 15.6" Full HD panel, with a built-in colour calibrator on some units.',
    price: 179,
    available_quantity: 2,
    specs: [
      ['Released', '2011'],
      ['Condition', 'Used — good'],
      ['Type', 'Mobile workstation'],
      ['Processor', 'Intel Core i7-2720QM'],
      ['Graphics', 'NVIDIA Quadro 1000M, 2 GB'],
      ['Memory', '16 GB DDR3'],
      ['Storage', '512 GB SSD'],
      ['Display', '15.6" FHD'],
      ['Weight', '2.7 kg'],
    ],
  },
  {
    name: 'ThinkPad W530',
    category: 'laptops',
    description:
      'A 15.6" mobile workstation with quad-core power and NVIDIA Quadro graphics, built like a tank.',
    price: 219,
    available_quantity: 0,
    specs: [
      ['Released', '2012'],
      ['Condition', 'Used — good'],
      ['Type', 'Mobile workstation'],
      ['Processor', 'Intel Core i7-3720QM'],
      ['Graphics', 'NVIDIA Quadro K1000M, 2 GB'],
      ['Memory', '16 GB DDR3'],
      ['Storage', '512 GB SSD'],
      ['Display', '15.6" FHD'],
      ['Weight', '2.6 kg'],
    ],
  },
  {
    name: 'ThinkPad W541',
    category: 'laptops',
    description:
      'A Haswell workstation with a sharp 3K display and Quadro graphics, for CAD and photo work.',
    price: 219,
    available_quantity: 2,
    specs: [
      ['Released', '2014'],
      ['Condition', 'Used — good'],
      ['Type', 'Mobile workstation'],
      ['Processor', 'Intel Core i7-4810MQ'],
      ['Graphics', 'NVIDIA Quadro K1100M, 2 GB'],
      ['Memory', '16 GB DDR3L'],
      ['Storage', '512 GB SSD'],
      ['Display', '15.6" 3K (2880 × 1620)'],
      ['Weight', '2.5 kg'],
    ],
  },
  {
    name: 'ThinkPad P50',
    category: 'laptops',
    description:
      'The first P-series workstation: Skylake quad-core, Quadro graphics and up to four RAM slots.',
    price: 299,
    available_quantity: 3,
    specs: [
      ['Released', '2015'],
      ['Condition', 'Used — very good'],
      ['Type', 'Mobile workstation'],
      ['Processor', 'Intel Core i7-6820HQ'],
      ['Graphics', 'NVIDIA Quadro M1000M, 2 GB'],
      ['Memory', '32 GB DDR4'],
      ['Storage', '512 GB NVMe SSD'],
      ['Display', '15.6" FHD IPS'],
      ['Weight', '2.5 kg'],
    ],
  },
  {
    name: 'ThinkPad P52',
    category: 'laptops',
    description:
      'Six-core Coffee Lake and Quadro P-series graphics: serious rendering and simulation power.',
    price: 449,
    available_quantity: 2,
    specs: [
      ['Released', '2018'],
      ['Condition', 'Used — very good'],
      ['Type', 'Mobile workstation'],
      ['Processor', 'Intel Core i7-8850H, 6 cores'],
      ['Graphics', 'NVIDIA Quadro P1000, 4 GB'],
      ['Memory', '32 GB DDR4'],
      ['Storage', '1 TB NVMe SSD'],
      ['Display', '15.6" FHD IPS'],
      ['Weight', '2.45 kg'],
    ],
  },
  {
    name: 'ThinkPad P53',
    category: 'laptops',
    description:
      'The last of the big 15.6" P-series of the decade, with Turing Quadro graphics.',
    price: 549,
    available_quantity: 1,
    specs: [
      ['Released', '2019'],
      ['Condition', 'Used — like new'],
      ['Type', 'Mobile workstation'],
      ['Processor', 'Intel Core i7-9750H, 6 cores'],
      ['Graphics', 'NVIDIA Quadro T1000, 4 GB'],
      ['Memory', '32 GB DDR4'],
      ['Storage', '1 TB NVMe SSD'],
      ['Display', '15.6" FHD IPS'],
      ['Weight', '2.5 kg'],
    ],
  },
  // ── monitors
  {
    name: 'ThinkVision LT2452p',
    category: 'monitors',
    description:
      'A 24" 16:10 IPS panel with a fully adjustable stand. The extra vertical space is perfect for documents and code.',
    price: 69,
    available_quantity: 4,
    specs: [
      ['Released', '2012'],
      ['Condition', 'Used — good'],
      ['Panel', '24" IPS, 1920 × 1200'],
      ['Inputs', 'DisplayPort, DVI, VGA'],
      ['Stand', 'Tilt, swivel, pivot, height'],
    ],
  },
  {
    name: 'ThinkVision T2454p',
    category: 'monitors',
    description: 'Another 16:10 favourite, adding HDMI and a USB 3.0 hub.',
    price: 79,
    available_quantity: 3,
    specs: [
      ['Released', '2014'],
      ['Condition', 'Used — very good'],
      ['Panel', '24" IPS, 1920 × 1200'],
      ['Inputs', 'DisplayPort, HDMI, VGA'],
      ['Extras', 'USB 3.0 hub'],
    ],
  },
  {
    name: 'ThinkVision P27h-10',
    category: 'monitors',
    description:
      '27" of QHD with a single USB-C cable for video, data and laptop charging.',
    price: 169,
    available_quantity: 2,
    featured: true,
    specs: [
      ['Released', '2017'],
      ['Condition', 'Used — very good'],
      ['Panel', '27" IPS, 2560 × 1440'],
      ['Inputs', 'USB-C (45 W), DisplayPort, HDMI'],
      ['Stand', 'Tilt, swivel, pivot, height'],
    ],
  },
  {
    name: 'ThinkVision T24i-10',
    category: 'monitors',
    description:
      'A slim-bezel 24" Full HD IPS display that disappears into any desk setup.',
    price: 85,
    available_quantity: 5,
    specs: [
      ['Released', '2019'],
      ['Condition', 'Used — very good'],
      ['Panel', '23.8" IPS, 1920 × 1080'],
      ['Inputs', 'DisplayPort, HDMI, VGA'],
      ['Extras', 'USB 3.0 hub'],
    ],
  },
  // ── keyboards
  {
    name: 'ThinkPad Compact USB Keyboard with TrackPoint',
    category: 'keyboards',
    description:
      'The laptop keyboard and TrackPoint in a wired, travel-friendly board.',
    price: 45,
    available_quantity: 4,
    specs: [
      ['Released', '2012'],
      ['Condition', 'Used — very good'],
      ['Connection', 'USB, 1.8 m cable'],
      ['Pointing', 'TrackPoint + 3 buttons'],
    ],
  },
  {
    name: 'ThinkPad Compact Bluetooth Keyboard with TrackPoint',
    category: 'keyboards',
    description:
      'The wireless version of the compact board, with a built-in rechargeable battery.',
    price: 55,
    available_quantity: 2,
    specs: [
      ['Released', '2013'],
      ['Condition', 'Used — good'],
      ['Connection', 'Bluetooth 3.0'],
      ['Pointing', 'TrackPoint + 3 buttons'],
      ['Battery', 'Rechargeable, micro-USB'],
    ],
  },
  {
    name: 'ThinkPad TrackPoint Keyboard II',
    category: 'keyboards',
    description:
      'Low-profile keys, the red pointing stick and wireless pairing with two devices.',
    price: 79,
    available_quantity: 3,
    featured: true,
    specs: [
      ['Released', '2020'],
      ['Condition', 'Used — like new'],
      ['Connection', 'Bluetooth or 2.4 GHz receiver'],
      ['Pointing', 'TrackPoint + 3 buttons'],
      ['Charging', 'USB-C'],
    ],
  },
  // ── mice
  {
    name: 'ThinkPad USB Laser Mouse',
    category: 'mice',
    description:
      'A simple, sturdy wired mouse with the classic ThinkPad shape.',
    price: 12,
    available_quantity: 6,
    specs: [
      ['Released', '2010'],
      ['Condition', 'Used — good'],
      ['Sensor', 'Laser'],
      ['Connection', 'USB'],
    ],
  },
  {
    name: 'ThinkPad Precision Wireless Mouse',
    category: 'mice',
    description: 'A contoured wireless mouse with a 4-way scroll wheel.',
    price: 19,
    available_quantity: 4,
    specs: [
      ['Released', '2015'],
      ['Condition', 'Used — very good'],
      ['Sensor', 'Optical'],
      ['Connection', '2.4 GHz nano receiver'],
    ],
  },
  {
    name: 'ThinkPad Bluetooth Silent Mouse',
    category: 'mice',
    description:
      'Near-silent clicks for libraries and late nights. Pairs straight to your laptop, no dongle.',
    price: 22,
    available_quantity: 5,
    specs: [
      ['Released', '2019'],
      ['Condition', 'Used — like new'],
      ['Sensor', 'Optical, 2400 DPI'],
      ['Connection', 'Bluetooth 5.0'],
    ],
  },
  // ── bags
  {
    name: 'ThinkPad Professional Backpack 15.6"',
    category: 'bags',
    description:
      'A water-resistant commuter backpack with a padded laptop sleeve and a luggage strap.',
    price: 39,
    available_quantity: 3,
    specs: [
      ['Released', '2018'],
      ['Condition', 'Used — very good'],
      ['Fits', 'Laptops up to 15.6"'],
      ['Extras', 'Luggage strap, water-resistant'],
    ],
  },
  {
    name: 'ThinkPad Essential Topload 15.6"',
    category: 'bags',
    description: 'A slim briefcase-style carry for meeting-to-meeting days.',
    price: 19,
    available_quantity: 4,
    specs: [
      ['Released', '2015'],
      ['Condition', 'Used — good'],
      ['Fits', 'Laptops up to 15.6"'],
      ['Carry', 'Handles + shoulder strap'],
    ],
  },
  {
    name: 'ThinkPad Active Backpack Medium',
    category: 'bags',
    description:
      'A sporty backpack with a quick-access laptop compartment and a bottle pocket.',
    price: 35,
    available_quantity: 2,
    specs: [
      ['Released', '2017'],
      ['Condition', 'Used — very good'],
      ['Fits', 'Laptops up to 15.6"'],
      ['Extras', 'Bottle pocket, quick-access sleeve'],
    ],
  },
  // ── desktops (ThinkCentre)
  {
    name: 'ThinkCentre M92p Tiny',
    category: 'desktops',
    description:
      'The original 1-litre ThinkCentre: a full desktop that fits behind a monitor. Perfect as a home server or office PC.',
    price: 79,
    available_quantity: 4,
    specs: [
      ['Released', '2012'],
      ['Condition', 'Used — good'],
      ['Form factor', 'Tiny (1 L)'],
      ['Processor', 'Intel Core i5-3470T'],
      ['Memory', '8 GB DDR3'],
      ['Storage', '256 GB SSD'],
    ],
  },
  {
    name: 'ThinkCentre M900 Tiny',
    category: 'desktops',
    description:
      'Skylake in a 1-litre box with DDR4 and an M.2 slot. Quiet, efficient and tiny.',
    price: 109,
    available_quantity: 5,
    specs: [
      ['Released', '2015'],
      ['Condition', 'Used — very good'],
      ['Form factor', 'Tiny (1 L)'],
      ['Processor', 'Intel Core i5-6500T'],
      ['Memory', '8 GB DDR4'],
      ['Storage', '256 GB NVMe SSD'],
    ],
  },
  {
    name: 'ThinkCentre M910s SFF',
    category: 'desktops',
    description:
      'A small form factor desktop with room for a low-profile graphics card and extra drives.',
    price: 119,
    available_quantity: 3,
    specs: [
      ['Released', '2016'],
      ['Condition', 'Used — very good'],
      ['Form factor', 'Small form factor'],
      ['Processor', 'Intel Core i5-6500'],
      ['Memory', '8 GB DDR4'],
      ['Storage', '256 GB SSD'],
      ['Expansion', 'Low-profile PCIe x16'],
    ],
  },
  {
    name: 'ThinkCentre M720q Tiny',
    category: 'desktops',
    description:
      'Six cores in a 1-litre chassis — and a PCIe slot with the riser. The homelab favourite.',
    price: 159,
    available_quantity: 4,
    featured: true,
    specs: [
      ['Released', '2018'],
      ['Condition', 'Used — very good'],
      ['Form factor', 'Tiny (1 L)'],
      ['Processor', 'Intel Core i5-8500T, 6 cores'],
      ['Memory', '16 GB DDR4'],
      ['Storage', '256 GB NVMe SSD'],
      ['Expansion', 'PCIe x8 via riser'],
    ],
  },
  {
    name: 'ThinkCentre M920t Tower',
    category: 'desktops',
    description:
      'A full tower with a six-core Core i7, plenty of drive bays and room to grow.',
    price: 229,
    available_quantity: 2,
    specs: [
      ['Released', '2018'],
      ['Condition', 'Used — good'],
      ['Form factor', 'Tower'],
      ['Processor', 'Intel Core i7-8700, 6 cores'],
      ['Memory', '16 GB DDR4'],
      ['Storage', '512 GB NVMe SSD'],
      ['Expansion', 'PCIe x16, 3 drive bays'],
    ],
  },
  {
    name: 'ThinkCentre M75q-1 Tiny',
    category: 'desktops',
    description:
      'AMD Ryzen PRO in a 1-litre box, with surprisingly capable integrated Vega graphics.',
    price: 169,
    available_quantity: 3,
    specs: [
      ['Released', '2019'],
      ['Condition', 'Used — like new'],
      ['Form factor', 'Tiny (1 L)'],
      ['Processor', 'AMD Ryzen 5 PRO 3400GE'],
      ['Graphics', 'Radeon Vega 11'],
      ['Memory', '16 GB DDR4'],
      ['Storage', '256 GB NVMe SSD'],
    ],
  },
];
