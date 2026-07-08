import { Family, LocalService, NeighborhoodStats } from '../types';

export const NEIGHBORHOODS: string[] = [
  'الاكمة',
  'البقير',
  'الدمنة',
  'الرميمية',
  'الزيلة',
  'الصفا',
  'العنين',
  'القحفة',
  'المجزع',
  'المعقرة',
  'الهقم'
];

export const NEIGHBORHOOD_STATS: NeighborhoodStats[] = [
  { name: 'الاكمة', population: 420, familiesCount: 78, servicesCount: 8, color: '#3B82F6' },
  { name: 'البقير', population: 680, familiesCount: 112, servicesCount: 5, color: '#10B981' },
  { name: 'الدمنة', population: 310, familiesCount: 52, servicesCount: 6, color: '#F59E0B' },
  { name: 'الرميمية', population: 540, familiesCount: 95, servicesCount: 4, color: '#8B5CF6' },
  { name: 'الزيلة', population: 290, familiesCount: 48, servicesCount: 3, color: '#EC4899' },
  { name: 'الصفا', population: 490, familiesCount: 85, servicesCount: 5, color: '#06B6D4' }
];

export const INITIAL_FAMILIES: Family[] = [
  {
    id: 'fam-1',
    familyName: 'آل عبد الله',
    breadwinnerName: 'أحمد محمود عبد الله',
    phone: '770123456',
    neighborhood: 'الزيلة',
    address: 'وسط محلة الزيلة، عمارة 14، شقة 3',
    housingType: 'إيجار',
    monthlyIncome: '3000 - 6000 ريال',
    supportStatus: 'تحت الدراسة',
    registeredAt: '2026-01-15',
    latitude: 35,
    longitude: 42,
    notes: 'الأسرة بحاجة لمساعدة عينية في بداية العام الدراسي للتجهيزات المدرسية.',
    members: [
      {
        id: 'mem-1-1',
        name: 'أحمد محمود عبد الله',
        relationship: 'عائل',
        gender: 'ذكر',
        age: 45,
        education: 'ثانوي',
        occupation: 'سائق حافلة',
        healthStatus: 'مرض مزمن',
        notes: 'يعاني من السكري والضغط'
      },
      {
        id: 'mem-1-2',
        name: 'فاطمة عمر الحربي',
        relationship: 'زوجة',
        gender: 'أنثى',
        age: 39,
        education: 'ثانوي',
        occupation: 'ربة منزل',
        healthStatus: 'سليم'
      },
      {
        id: 'mem-1-3',
        name: 'سارة أحمد عبد الله',
        relationship: 'ابنة',
        gender: 'أنثى',
        age: 16,
        education: 'ثانوي',
        occupation: 'طالبة',
        healthStatus: 'سليم'
      },
      {
        id: 'mem-1-4',
        name: 'محمد أحمد عبد الله',
        relationship: 'ابن',
        gender: 'ذكر',
        age: 12,
        education: 'ابتدائي',
        occupation: 'طالب',
        healthStatus: 'سليم'
      },
      {
        id: 'mem-1-5',
        name: 'خالد أحمد عبد الله',
        relationship: 'ابن',
        gender: 'ذكر',
        age: 8,
        education: 'ابتدائي',
        occupation: 'طالب',
        healthStatus: 'ذوي احتياجات خاصة',
        notes: 'صعوبات تعلم وحركة خفيفة'
      }
    ]
  },
  {
    id: 'fam-2',
    familyName: 'آل غامدي',
    breadwinnerName: 'سليمان خالد الغامدي',
    phone: '0547654321',
    neighborhood: 'الاكمة',
    address: 'شارع الملك فهد، فيلا 22',
    housingType: 'ملك',
    monthlyIncome: 'أكثر من 10000 ريال',
    supportStatus: 'غير مستحق / مكتفي',
    registeredAt: '2026-02-10',
    latitude: 18,
    longitude: 72,
    notes: 'عائلة مكتفية ذاتياً ولديها رغبة في التطوع للعمل الاجتماعي بالمحلة.',
    members: [
      {
        id: 'mem-2-1',
        name: 'سليمان خالد الغامدي',
        relationship: 'عائل',
        gender: 'ذكر',
        age: 52,
        education: 'جامعي',
        occupation: 'مهندس متقاعد',
        healthStatus: 'سليم'
      },
      {
        id: 'mem-2-2',
        name: 'منى علي الشهري',
        relationship: 'زوجة',
        gender: 'أنثى',
        age: 46,
        education: 'جامعي',
        occupation: 'معلمة',
        healthStatus: 'سليم'
      },
      {
        id: 'mem-2-3',
        name: 'رائد سليمان الغامدي',
        relationship: 'ابن',
        gender: 'ذكر',
        age: 21,
        education: 'جامعي',
        occupation: 'طالب جامعي',
        healthStatus: 'سليم'
      },
      {
        id: 'mem-2-4',
        name: 'دانا سليمان الغامدي',
        relationship: 'ابنة',
        gender: 'أنثى',
        age: 18,
        education: 'ثانوي',
        occupation: 'طالبة',
        healthStatus: 'سليم'
      }
    ]
  },
  {
    id: 'fam-3',
    familyName: 'آل قحطاني (أرملة)',
    breadwinnerName: 'أمينة حسن القحطاني',
    phone: '0562345678',
    neighborhood: 'الدمنة',
    address: 'خلف البريد السعودي، بيت شعبي',
    housingType: 'شعبي',
    monthlyIncome: 'أقل من 3000 ريال',
    supportStatus: 'مستحق للدعم',
    registeredAt: '2026-03-01',
    latitude: 75,
    longitude: 25,
    notes: 'الأسرة تعيش على الضمان الاجتماعي ومساعدات أهل الخير والمسكن متهالك.',
    members: [
      {
        id: 'mem-3-1',
        name: 'أمينة حسن القحطاني',
        relationship: 'عائل',
        gender: 'أنثى',
        age: 48,
        education: 'إعدادي',
        occupation: 'بلا عمل',
        healthStatus: 'مرض مزمن',
        notes: 'تعاني من روماتيزم حاد'
      },
      {
        id: 'mem-3-2',
        name: 'يوسف محمد القحطاني',
        relationship: 'ابن',
        gender: 'ذكر',
        age: 19,
        education: 'ثانوي',
        occupation: 'بحث عن عمل',
        healthStatus: 'سليم',
        notes: 'يبحث عن فرصة عمل لدعم الأسرة'
      },
      {
        id: 'mem-3-3',
        name: 'هناء محمد القحطاني',
        relationship: 'ابنة',
        gender: 'أنثى',
        age: 14,
        education: 'إعدادي',
        occupation: 'طالبة',
        healthStatus: 'سليم'
      },
      {
        id: 'mem-3-4',
        name: 'فهد محمد القحطاني',
        relationship: 'ابن',
        gender: 'ذكر',
        age: 11,
        education: 'ابتدائي',
        occupation: 'طالب',
        healthStatus: 'سليم'
      }
    ]
  },
  {
    id: 'fam-4',
    familyName: 'آل عتيبي',
    breadwinnerName: 'عبد الرحمن سعد العتيبي',
    phone: '0539876543',
    neighborhood: 'البقير',
    address: 'طريق المدينة، عمارة الأمل 4',
    housingType: 'إيجار',
    monthlyIncome: '6000 - 10000 ريال',
    supportStatus: 'غير مستحق / مكتفي',
    registeredAt: '2026-03-20',
    latitude: 50,
    longitude: 80,
    notes: 'الأسرة مستقرة مادياً وتطلب الاستشارة في مركز الرعاية بخصوص طفل حديث الولادة.',
    members: [
      {
        id: 'mem-4-1',
        name: 'عبد الرحمن سعد العتيبي',
        relationship: 'عائل',
        gender: 'ذكر',
        age: 34,
        education: 'جامعي',
        occupation: 'موظف قطاع خاص',
        healthStatus: 'سليم'
      },
      {
        id: 'mem-4-2',
        name: 'نورة فهد الدوسري',
        relationship: 'زوجة',
        gender: 'أنثى',
        age: 31,
        education: 'جامعي',
        occupation: 'محللة بيانات',
        healthStatus: 'سليم'
      },
      {
        id: 'mem-4-3',
        name: 'سلطان عبد الرحمن العتيبي',
        relationship: 'ابن',
        gender: 'ذكر',
        age: 4,
        education: 'دون سن الدراسة',
        occupation: 'طفل',
        healthStatus: 'سليم'
      },
      {
        id: 'mem-4-4',
        name: 'فيصل عبد الرحمن العتيبي',
        relationship: 'ابن',
        gender: 'ذكر',
        age: 1,
        education: 'دون سن الدراسة',
        occupation: 'طفل',
        healthStatus: 'سليم'
      }
    ]
  },
  {
    id: 'fam-5',
    familyName: 'آل شمري',
    breadwinnerName: 'خالد نايف الشمري',
    phone: '0555554433',
    neighborhood: 'الرميمية',
    address: 'شارع النخيل، فندق السعادة بجواره، فيلا 12ب',
    housingType: 'ملك',
    monthlyIncome: '6000 - 10000 ريال',
    supportStatus: 'غير مستحق / مكتفي',
    registeredAt: '2026-04-05',
    latitude: 82,
    longitude: 65,
    members: [
      {
        id: 'mem-5-1',
        name: 'خالد نايف الشمري',
        relationship: 'عائل',
        gender: 'ذكر',
        age: 41,
        education: 'جامعي',
        occupation: 'موظف حكومي',
        healthStatus: 'سليم'
      },
      {
        id: 'mem-5-2',
        name: 'مها أحمد الشمري',
        relationship: 'زوجة',
        gender: 'أنثى',
        age: 38,
        education: 'جامعي',
        occupation: 'أخصائية اجتماعية',
        healthStatus: 'سليم'
      },
      {
        id: 'mem-5-3',
        name: 'مشاري خالد الشمري',
        relationship: 'ابن',
        gender: 'ذكر',
        age: 15,
        education: 'ثانوي',
        occupation: 'طالب',
        healthStatus: 'سليم'
      },
      {
        id: 'mem-5-4',
        name: 'لمى خالد الشمري',
        relationship: 'ابنة',
        gender: 'أنثى',
        age: 10,
        education: 'ابتدائي',
        occupation: 'طالبة',
        healthStatus: 'سليم'
      },
      {
        id: 'mem-5-5',
        name: 'الجدة شيخة مطر الشمري',
        relationship: 'أم',
        gender: 'أنثى',
        age: 72,
        education: 'أمي',
        occupation: 'كبيرة في السن / متقاعدة',
        healthStatus: 'مرض مزمن',
        notes: 'تحتاج رعاية دورية لمرض ضغط الدم والقلب ومثبت لها ممرض زائر.'
      }
    ]
  },
  {
    id: 'fam-6',
    familyName: 'آل حارثي',
    breadwinnerName: 'سعيد عبد الله الحارثي',
    phone: '0598877665',
    neighborhood: 'الصفا',
    address: 'طريق السلام، خلف مسجد التوبة',
    housingType: 'إيجار',
    monthlyIncome: 'أقل من 3000 ريال',
    supportStatus: 'مستحق للدعم',
    registeredAt: '2026-04-12',
    latitude: 45,
    longitude: 30,
    notes: 'الأسرة لديها التزامات كبيرة، رب الأسرة يعاني من إعاقة بصرية ولا يستطيع العمل بانتظام.',
    members: [
      {
        id: 'mem-6-1',
        name: 'سعيد عبد الله الحارثي',
        relationship: 'عائل',
        gender: 'ذكر',
        age: 50,
        education: 'ابتدائي',
        occupation: 'أعمال حرة متقطعة',
        healthStatus: 'ذوي احتياجات خاصة',
        notes: 'إعاقة بصرية جزئية تمنعه من القيادة أو العمل لساعات طويلة'
      },
      {
        id: 'mem-6-2',
        name: 'زينب عادل المالكي',
        relationship: 'زوجة',
        gender: 'أنثى',
        age: 44,
        education: 'إعدادي',
        occupation: 'ربة منزل',
        healthStatus: 'سليم'
      },
      {
        id: 'mem-6-3',
        name: 'عبد الله سعيد الحارثي',
        relationship: 'ابن',
        gender: 'ذكر',
        age: 17,
        education: 'ثانوي',
        occupation: 'طالب ورأس معونة للأسرة',
        healthStatus: 'سليم'
      },
      {
        id: 'mem-6-4',
        name: 'روان سعيد الحارثي',
        relationship: 'ابنة',
        gender: 'أنثى',
        age: 13,
        education: 'إعدادي',
        occupation: 'طالبة',
        healthStatus: 'سليم'
      },
      {
        id: 'mem-6-5',
        name: 'جنى سعيد الحارثي',
        relationship: 'ابنة',
        gender: 'أنثى',
        age: 9,
        education: 'ابتدائي',
        occupation: 'طالبة',
        healthStatus: 'سليم'
      },
      {
        id: 'mem-6-6',
        name: 'هدى سعيد الحارثي',
        relationship: 'ابنة',
        gender: 'أنثى',
        age: 6,
        education: 'دون سن الدراسة',
        occupation: 'طفلة',
        healthStatus: 'سليم'
      }
    ]
  }
];

export const INITIAL_SERVICES: LocalService[] = [];
