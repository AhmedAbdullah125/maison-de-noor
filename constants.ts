import { Product, Brand, ServiceAddon, UserSubscription } from './types';

export const APP_COLORS = {
  bg: '#F6F2FA',
  card: '#E8E0EF',
  gold: '#483383',
  goldDark: '#352C48',
  text: '#100F19',
  textSec: '#6E585B',
};

export const LOCK_DURATION_MS = 60 * 60 * 1000; // 1 Hour
export const FALLBACK_IMAGE_URL = "https://i2.pickpik.com/photos/674/385/236/school-hair-salon-hairdresser-preview.jpg";
export const STORAGE_KEY_SUBSCRIPTIONS = 'mezo_subscriptions_v1';
export const STORAGE_KEY_APPOINTMENTS = 'salon_appointments_v1';

// Shared Add-ons
const ADDONS_VIP: ServiceAddon = {
  id: 'vip_room',
  title_ar: 'غرفة خاصة VIP',
  desc_ar: 'خصوصية كاملة وتجربة فاخرة',
  price_kwd: 3.000,
  is_active: true
};

// Demo User Subscriptions (Initial State)
export const INITIAL_SUBSCRIPTIONS: UserSubscription[] = [];

// --- NEW DATA STRUCTURE ---

export const DEMO_PRODUCTS: Product[] = [
  // --- Category: الشعر (Hair) ---
  {
    id: 101,
    name: "قص شعر أطراف (Simple)",
    type: "simple",
    price: "5.000 د.ك",
    image: "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=800&q=80"
    ],
    description: "قص أطراف الشعر للحفاظ على صحته وحيويته، يشمل غسيل وتجفيف سريع.",
    duration: "30 دقيقة"
  },
  {
    id: 102,
    name: "سشوار وويفي (Addons)",
    type: "addons",
    price: "8.000 د.ك",
    oldPrice: "10.000 د.ك",
    image: "https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=800&q=80"
    ],
    description: "تصفيف شعر احترافي يناسب جميع المناسبات.",
    duration: "45 دقيقة",
    addons: [
      { id: 'wash', title_ar: 'غسيل شعر', price_kwd: 2.000, is_active: true },
      { id: 'serum', title_ar: 'سيروم لمعان', price_kwd: 1.500, is_active: true },
      ADDONS_VIP
    ]
  },
  {
    id: 103,
    name: "علاج كيراتين",
    type: "simple",
    price: "40.000 د.ك",
    image: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1620331313123-6e40556e1048?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=800&q=80"
    ],
    description: "علاج مكثف لتنعيم الشعر وإزالة النفشة.",
    duration: "120 دقيقة"
  },
  {
    id: 104,
    name: "علاج الشعر المتقدم",
    type: "addons",
    price: "15.000 د.ك",
    image: "https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&w=800&q=80"
    ],
    description: "تجربة علاجية متكاملة مصممة خصيصاً لاحتياجات شعرك. ابدئي باختيار طول الشعر ثم أضيفي الخدمات التي تناسبك.",
    duration: "90 دقيقة",
    packageOptions: [
      {
        id: 'pkg_1',
        sessionsCount: 1,
        discountPercent: 0,
        titleText: 'جلسة واحدة',
        isEnabled: true,
        sortOrder: 1,
        validityDays: 30
      },
      {
        id: 'pkg_3',
        sessionsCount: 3,
        discountPercent: 10,
        titleText: 'احصلي على خصم 10٪ على الثلاث جلسات',
        isEnabled: true,
        sortOrder: 2,
        validityDays: 60
      },
      {
        id: 'pkg_5',
        sessionsCount: 5,
        discountPercent: 20,
        titleText: 'احصلي على خصم 20٪ على الخمس جلسات',
        isEnabled: true,
        sortOrder: 3,
        validityDays: 120
      }
    ],
    addonGroups: [
      {
        id: 'length',
        title_ar: 'طول الشعر (مطلوب)',
        type: 'single',
        required: true,
        options: [
          { id: 'len_short', title_ar: 'قصير', price_kwd: 0, is_active: true },
          { id: 'len_med', title_ar: 'متوسط', price_kwd: 3, is_active: true },
          { id: 'len_long', title_ar: 'طويل', price_kwd: 6, is_active: true },
          { id: 'len_vlong', title_ar: 'طويل جدًا', price_kwd: 9, is_active: true },
          { id: 'len_ext', title_ar: 'تطويل إضافي', price_kwd: 12, is_active: true },
        ]
      },
      {
        id: 'blowdry',
        title_ar: 'نوع السشوار',
        type: 'single',
        required: false,
        options: [
          { id: 'bd_norm', title_ar: 'سشوار عادي', price_kwd: 0, is_active: true },
          { id: 'bd_int', title_ar: 'سشوار مكثف', price_kwd: 2, is_active: true },
          { id: 'bd_auto', title_ar: 'سشوار آلي', price_kwd: 3, is_active: true },
          { id: 'bd_man', title_ar: 'سشوار يدوي', price_kwd: 4, is_active: true },
        ]
      },
      {
        id: 'extras',
        title_ar: 'خدمات إضافية',
        type: 'multi',
        required: false,
        options: [
          { id: 'ex_scalp', title_ar: 'مساج فروة الرأس', price_kwd: 3, is_active: true },
          { id: 'ex_vip', title_ar: 'غرفة خاصة', price_kwd: 5, is_active: true },
          { id: 'ex_oil', title_ar: 'حمام زيت', price_kwd: 4, is_active: true },
          { id: 'ex_prot', title_ar: 'بروتين تقوية', price_kwd: 7, is_active: true },
          { id: 'ex_kera', title_ar: 'كيراتين فرد', price_kwd: 10, is_active: true },
          { id: 'ex_clean', title_ar: 'تنظيف عميق لفروة الرأس', price_kwd: 6, is_active: true },
          { id: 'ex_shine', title_ar: 'سيروم لمعان فوري', price_kwd: 2, is_active: true },
        ]
      },
      {
        id: 'prod_type',
        title_ar: 'نوع المنتجات',
        type: 'single',
        required: false,
        options: [
          { id: 'prod_nat', title_ar: 'منتجات طبيعية 100٪', price_kwd: 3, is_active: true },
          { id: 'prod_med', title_ar: 'منتجات طبية علاجية', price_kwd: 5, is_active: true },
          { id: 'prod_org', title_ar: 'منتجات عضوية فاخرة', price_kwd: 7, is_active: true },
        ]
      },
      {
        id: 'care_lvl',
        title_ar: 'مستوى العناية',
        type: 'single',
        required: false,
        options: [
          { id: 'care_norm', title_ar: 'عناية عادية', price_kwd: 0, is_active: true },
          { id: 'care_int', title_ar: 'عناية مكثفة', price_kwd: 4, is_active: true },
          { id: 'care_dmg', title_ar: 'عناية فائقة للشعر التالف', price_kwd: 8, is_active: true },
        ]
      },
      {
        id: 'ends',
        title_ar: 'العناية بالأطراف',
        type: 'single',
        required: false,
        options: [
          { id: 'end_trim', title_ar: 'قص أطراف', price_kwd: 2, is_active: true },
          { id: 'end_res', title_ar: 'ترميم أطراف', price_kwd: 4, is_active: true },
          { id: 'end_split', title_ar: 'علاج التقصف', price_kwd: 6, is_active: true },
        ]
      },
      {
        id: 'styling',
        title_ar: 'التصفيف النهائي',
        type: 'single',
        required: false,
        options: [
          { id: 'sty_wave', title_ar: 'تمويج خفيف', price_kwd: 3, is_active: true },
          { id: 'sty_str', title_ar: 'فرد ناعم', price_kwd: 4, is_active: true },
          { id: 'sty_cls', title_ar: 'تصفيف كلاسيك', price_kwd: 5, is_active: true },
        ]
      },
      {
        id: 'scalp',
        title_ar: 'العناية بفروة الرأس',
        type: 'single',
        required: false,
        options: [
          { id: 'scp_scrub', title_ar: 'تقشير فروة الرأس', price_kwd: 4, is_active: true },
          { id: 'scp_dand', title_ar: 'علاج القشرة', price_kwd: 5, is_active: true },
          { id: 'scp_loss', title_ar: 'علاج تساقط الشعر', price_kwd: 7, is_active: true },
        ]
      },
      {
        id: 'steam',
        title_ar: 'جلسة البخار',
        type: 'single',
        required: false,
        options: [
          { id: 'stm_none', title_ar: 'بدون بخار', price_kwd: 0, is_active: true },
          { id: 'stm_norm', title_ar: 'بخار عادي', price_kwd: 3, is_active: true },
          { id: 'stm_int', title_ar: 'بخار مكثف', price_kwd: 5, is_active: true },
        ]
      },
      {
        id: 'heat',
        title_ar: 'الحماية من الحرارة',
        type: 'single',
        required: false,
        options: [
          { id: 'ht_none', title_ar: 'بدون حماية', price_kwd: 0, is_active: true },
          { id: 'ht_norm', title_ar: 'حماية عادية', price_kwd: 2, is_active: true },
          { id: 'ht_int', title_ar: 'حماية مكثفة', price_kwd: 4, is_active: true },
        ]
      }
    ]
  },

  // --- Category: الأظافر (Nails) ---
  {
    id: 201,
    name: "منيكير كلاسيك (Simple)",
    type: "simple",
    price: "5.000 د.ك",
    image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=800&q=80"
    ],
    description: "تنظيف وترتيب الأظافر والجلد المحيط مع لون واحد.",
    duration: "45 دقيقة"
  },
  {
    id: 202,
    name: "سبا يدين ورجلين (Addons)",
    type: "addons",
    price: "15.000 د.ك",
    image: "https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1519014816548-bf5fe059e98b?auto=format&fit=crop&w=800&q=80"
    ],
    description: "عناية فائقة بالأظافر مع تقشير وترطيب عميق ومساج.",
    duration: "75 دقيقة",
    addons: [
      { id: 'gel_polish', title_ar: 'صبغ جل دائم', price_kwd: 5.000, is_active: true },
      { id: 'paraffin', title_ar: 'شمع البارافين', price_kwd: 3.000, is_active: true }
    ]
  },

  // --- Category: المكياج (Makeup) ---
  {
    id: 301,
    name: "مكياج ناعم (Simple)",
    type: "simple",
    price: "25.000 د.ك",
    image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=800&q=80"
    ],
    description: "مكياج نهاري خفيف يبرز جمال الملامح.",
    duration: "45 دقيقة"
  },
  {
    id: 302,
    name: "مكياج سهرة VIP (Addons)",
    type: "addons",
    price: "45.000 د.ك",
    image: "https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80"
    ],
    description: "مكياج ثقيل للمناسبات الخاصة مع تثبيت عالي.",
    duration: "90 دقيقة",
    addons: [
      { id: 'lashes_3d', title_ar: 'رموش 3D', price_kwd: 5.000, is_active: true },
      { id: 'contour', title_ar: 'كونتور للجسم', price_kwd: 7.000, is_active: true }
    ]
  },

  // --- Category: البشرة (Skin) ---
  {
    id: 401,
    name: "تنظيف بشرة عميق",
    type: "simple",
    price: "25.000 د.ك",
    image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=800&q=80"
    ],
    description: "تنظيف المسام وإزالة الرؤوس السوداء مع ماسك مهدئ.",
    duration: "60 دقيقة"
  },

  // --- Category: علاجات (Treatments) ---
  {
    id: 601,
    name: "ترميم شعر تالف (Addons)",
    type: "addons",
    price: "18.000 د.ك",
    image: "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&w=800&q=80",
    images: [
       "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&w=800&q=80",
       "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=800&q=80"
    ],
    description: "علاج لترطيب الشعر الجاف والمصبوغ.",
    duration: "60 دقيقة",
    addons: [
      { id: 'ampoule', title_ar: 'أمبولة مركزة', price_kwd: 4.000, is_active: true },
      { id: 'steam', title_ar: 'جلسة بخار أوزون', price_kwd: 2.500, is_active: true }
    ]
  },

  // --- Category: العروض الخاصة (Special Offers) ---
  {
    id: 701,
    name: "باقة الدلال المتكاملة",
    type: "simple",
    price: "45.000 د.ك",
    oldPrice: "65.000 د.ك",
    image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=800&q=80"
    ],
    description: "باقة خاصة تشمل حمام مغربي، مساج، وتنظيف بشرة. استمتعي بتجربة استرخاء كاملة.",
    duration: "180 دقيقة"
  }
];

// Reusing Brand interface for Categories
export const BRANDS: Brand[] = [
  { 
    id: 1, 
    name: 'الشعر', 
    image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=800&q=80',
    productIds: [101, 102, 103, 104] 
  },
  { 
    id: 2, 
    name: 'الأظافر', 
    image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=800&q=80',
    productIds: [201, 202] 
  },
  { 
    id: 3, 
    name: 'المكياج', 
    image: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=800&q=80',
    productIds: [301, 302] 
  },
  { 
    id: 4, 
    name: 'البشرة', 
    image: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=800&q=80',
    productIds: [401] 
  },
  { 
    id: 6, 
    name: 'علاجات', 
    image: 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&w=800&q=80',
    productIds: [601] 
  },
  { 
    id: 7, 
    name: 'العروض الخاصة', 
    image: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?auto=format&fit=crop&w=800&q=80',
    productIds: [701] 
  }
];