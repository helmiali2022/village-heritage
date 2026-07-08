export type RelationshipType = 'عائل' | 'زوج' | 'زوجة' | 'ابن' | 'ابنة' | 'أب' | 'أم' | 'أخ' | 'أخت' | 'آخر';
export type GenderType = 'ذكر' | 'أنثى';
export type EducationType = 'أمي' | 'ابتدائي' | 'إعدادي' | 'ثانوي' | 'جامعي' | 'دراسات عليا' | 'دون سن الدراسة' | 'غير محدد';
export type HealthStatusType = 'سليم' | 'ذوي احتياجات خاصة' | 'مرض مزمن';
export type HousingType = 'ملك' | 'إيجار' | 'شعبي' | 'أخرى';
export type IncomeRangeType = 'أقل من 3000 ريال' | '3000 - 6000 ريال' | '6000 - 10000 ريال' | 'أكثر من 10000 ريال';
export type SupportStatusType = 'مستحق للدعم' | 'تحت الدراسة' | 'غير مستحق / مكتفي';

export interface Campaign {
  id: string;
  title: string;
  description: string;
  target: number;
  raised: number;
  category: 'أسر' | 'صحي' | 'بلدي' | 'تعليمي';
  icon: string;
  currencies: string[]; // Enabled currencies (e.g., ['SAR', 'USD', 'EUR'])
  allowedDelegates: string[]; // Authorized sub-delegates (by email or username)
  allowManagerRecord: boolean; // Whether 'Manager' (المشرف العام) is allowed to record
  targetCurrency?: string; // Target currency of the campaign
}

export interface DonationRecord {
  id: string;
  campaignId: string;
  campaignTitle: string;
  donorName: string;
  donorPhone: string;
  amount: number;
  currency: string;
  paymentMethod: 'mada' | 'visa' | 'applepay' | 'cash' | 'transfer';
  date: string;
  recordedBy: string; // email of the person who recorded this transaction
  status: 'مقبول' | 'قيد المراجعة' | 'مرفوض';
  notes?: string;
  inkindDescription?: string;
  delegateUserId?: string; // ID of delegate user who added this
  delegateName?: string; // Full name of delegate
  delegatePhone?: string; // Phone of delegate
}

export interface Member {
  id: string;
  name: string;
  relationship: RelationshipType;
  gender: GenderType;
  age: number;
  birthDate?: string;
  neighborhood?: string;
  residence?: string;
  phone?: string;
  education: EducationType;
  occupation: string;
  healthStatus: HealthStatusType;
  notes?: string;
}

export interface Family {
  id: string;
  familyName: string;
  breadwinnerName: string;
  phone: string;
  neighborhood: string;
  address: string;
  housingType: HousingType;
  monthlyIncome: string;
  supportStatus: SupportStatusType;
  members: Member[];
  registeredAt: string;
  latitude: number; // 0 to 100 relative coord on our map
  longitude: number; // 0 to 100 relative coord on our map
  residence?: string; // الإقامة من الملف
  notes?: string;
}

export type ServiceType = 'تعليمي' | 'صحي' | 'أمني' | 'ديني' | 'ترفيهي' | 'إداري' | 'تجاري' | 'خدمي/بلدي';
export type ServiceStatus = 'نشط' | 'قيد الصيانة' | 'مقترح / غير مفعل';

export interface LocalService {
  id: string;
  name: string;
  type: ServiceType;
  neighborhood: string;
  address: string;
  contactPerson?: string;
  phone?: string;
  status: ServiceStatus;
  description?: string;
  latitude: number; // 0 to 100 relative coord on our map
  longitude: number; // 0 to 100 relative coord on our map
  capacity?: string; // e.g., "500 طالب", "50 سرير"
}

export interface NeighborhoodStats {
  name: string;
  population: number;
  familiesCount: number;
  servicesCount: number;
  color: string;
}

export function parseBreadwinner(combinedName: string, defaultPhone: string = '') {
  if (!combinedName) return { name: '', phone: defaultPhone };
  // Match pattern like: Name (Phone) or Name(Phone) or Name [Phone] or Name [Phone]
  const match = combinedName.match(/^(.*?)\s*[\(\[（【]\s*([0-9\-+\s]+)\s*[\)\]）】]/);
  if (match) {
    return {
      name: match[1].trim(),
      phone: match[2].trim() || defaultPhone
    };
  }
  return { name: combinedName.trim(), phone: defaultPhone };
}
