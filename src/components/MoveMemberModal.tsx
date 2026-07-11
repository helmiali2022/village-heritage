import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, CheckCircle, AlertTriangle, ArrowRight, Calendar, User, Phone, MapPin, Layers } from 'lucide-react';
import { Family, Member, RelationshipType, GenderType, EducationType, HealthStatusType, HousingType, SupportStatusType } from '../types';

interface MoveMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  families: Family[];
  onConfirmMove: (moveData: {
    selectedMemberId: string | null;
    memberName: string;
    memberGender: GenderType;
    memberAge: number;
    memberBirthDate: string;
    memberPhone: string;
    memberEducation: EducationType;
    memberOccupation: string;
    memberHealthStatus: HealthStatusType;
    memberNotes: string;
    neighborhood: string;
    familyName: string;
    moveType: 'new_family' | 'marriage_outside' | 'out_governorate';
    transferDate: string;
    notes: string;
    newFamilyDetails?: {
      address: string;
      housingType: HousingType;
      monthlyIncome: string;
      supportStatus: SupportStatusType;
      residence: string;
    };
    selectedDependents?: { memberId: string; relationship: RelationshipType }[];
    targetGovernorate?: string;
  }) => void;
}

const YEMEN_GOVERNORATES = [
  'صنعاء', 'عدن', 'تعز', 'الحديدة', 'إب', 'أبين', 'لحج', 'حضرموت', 'شبوة', 
  'المهرة', 'سقطرى', 'ذمار', 'حجة', 'البيضاء', 'صعدة', 'الجوف', 'عمران', 
  'مأرب', 'المحويت', 'ريمة', 'الضالع', 'أمانة العاصمة'
];

export default function MoveMemberModal({ isOpen, onClose, families, onConfirmMove }: MoveMemberModalProps) {
  // Member selection / search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<{ member: Member; family: Family } | null>(null);

  // Form states for the primary individual
  const [memberName, setMemberName] = useState('');
  const [memberGender, setMemberGender] = useState<GenderType>('ذكر');
  const [memberAge, setMemberAge] = useState<number>(30);
  const [memberBirthDate, setMemberBirthDate] = useState('');
  const [memberPhone, setMemberPhone] = useState('');
  const [memberEducation, setMemberEducation] = useState<EducationType>('غير محدد');
  const [memberOccupation, setMemberOccupation] = useState('');
  const [memberHealthStatus, setMemberHealthStatus] = useState<HealthStatusType>('سليم');
  const [memberNotes, setMemberNotes] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [familyName, setFamilyName] = useState('');

  // Move parameters
  const [moveType, setMoveType] = useState<'new_family' | 'marriage_outside' | 'out_governorate'>('new_family');
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Option 1: New family details
  const [address, setAddress] = useState('');
  const [housingType, setHousingType] = useState<HousingType>('ملك');
  const [monthlyIncome, setMonthlyIncome] = useState('0');
  const [supportStatus, setSupportStatus] = useState<SupportStatusType>('تحت الدراسة');
  const [residence, setResidence] = useState('دائمة');

  // Dependents selected to move with the breadwinner
  const [dependentSearch, setDependentSearch] = useState('');
  const [selectedDependents, setSelectedDependents] = useState<{ memberId: string; relationship: RelationshipType }[]>([]);

  // Option 3: Target governorate
  const [targetGovernorate, setTargetGovernorate] = useState('صنعاء');

  // Error & Confirmation
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Flattened list of all registered members across all families for selection
  const allMembers = useMemo(() => {
    const list: { member: Member; family: Family }[] = [];
    families.forEach(f => {
      (f.members || []).forEach(m => {
        list.push({ member: m, family: f });
      });
    });
    return list;
  }, [families]);

  // Filtered list of members for primary search
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return allMembers.filter(item => 
      item.member.name.toLowerCase().includes(query) || 
      item.family.familyName.toLowerCase().includes(query) ||
      (item.member.phone && item.member.phone.includes(query))
    ).slice(0, 5);
  }, [searchQuery, allMembers]);

  // Filtered list of potential dependents (excluding selected primary member)
  const availableDependents = useMemo(() => {
    if (!selectedMember) return [];
    if (!dependentSearch.trim()) return [];
    const query = dependentSearch.toLowerCase();
    return allMembers.filter(item => 
      item.member.id !== selectedMember.member.id &&
      (item.member.name.toLowerCase().includes(query) || 
       item.family.familyName.toLowerCase().includes(query))
    );
  }, [selectedMember, allMembers, dependentSearch]);

  const handleSelectMember = (item: { member: Member; family: Family }) => {
    setSelectedMember(item);
    setMemberName(item.member.name);
    setMemberGender(item.member.gender);
    setMemberAge(item.member.age || 30);
    setMemberBirthDate(item.member.birthDate || '');
    setMemberPhone(item.member.phone || '');
    setMemberEducation(item.member.education || 'غير محدد');
    setMemberOccupation(item.member.occupation || 'غير محدد');
    setMemberHealthStatus(item.member.healthStatus || 'سليم');
    setMemberNotes(item.member.notes || '');
    setNeighborhood(item.family.neighborhood || '');
    setFamilyName(item.family.familyName || '');
    
    // Auto-fill new address with current
    setAddress(item.family.address || '');
    setSearchQuery('');
  };

  const toggleDependent = (memberId: string) => {
    setSelectedDependents(prev => {
      const exists = prev.some(d => d.memberId === memberId);
      if (exists) {
        return prev.filter(d => d.memberId !== memberId);
      } else {
        return [...prev, { memberId, relationship: 'ابن' }];
      }
    });
  };

  const handleDependentRelationshipChange = (memberId: string, rel: RelationshipType) => {
    setSelectedDependents(prev => 
      prev.map(d => d.memberId === memberId ? { ...d, relationship: rel } : d)
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!memberName.trim()) {
      setErrorMsg('فضلاً قم بإدخال أو جلب اسم الفرد المراد نقله.');
      return;
    }

    if (memberName.trim().includes(' ') || memberName.trim().split(/\s+/).length > 1) {
      setErrorMsg('خطأ: اسم الفرد يجب أن يكون كلمة واحدة فقط (الاسم الأول) بدون أي مسافات أو فراغات!');
      return;
    }

    if (!transferDate) {
      setErrorMsg('تاريخ النقل / الزواج إلزامي لتوثيق السجل.');
      return;
    }

    if (!notes.trim()) {
      setErrorMsg('الرجاء كتابة الملاحظات والمبررات التفصيلية لعملية الترحيل السكاني (إلزامي).');
      return;
    }

    onConfirmMove({
      selectedMemberId: selectedMember ? selectedMember.member.id : null,
      memberName,
      memberGender,
      memberAge: Number(memberAge),
      memberBirthDate,
      memberPhone,
      memberEducation,
      memberOccupation,
      memberHealthStatus,
      memberNotes,
      neighborhood,
      familyName,
      moveType,
      transferDate,
      notes,
      newFamilyDetails: moveType === 'new_family' ? {
        address,
        housingType,
        monthlyIncome,
        supportStatus,
        residence
      } : undefined,
      selectedDependents: moveType === 'new_family' ? selectedDependents : undefined,
      targetGovernorate: moveType === 'out_governorate' ? targetGovernorate : undefined
    });

    // Reset Form
    setSelectedMember(null);
    setMemberName('');
    setSearchQuery('');
    setSelectedDependents([]);
    setNotes('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[999] overflow-y-auto" style={{ direction: 'rtl' }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-[#FFFDF9] rounded-3xl border border-[#E2DED0] shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-[#F4F1EA] flex justify-between items-center bg-[#4A5D4E] text-[#FDFBF7] rounded-t-3xl">
          <div className="space-y-1">
            <h2 className="text-lg font-black flex items-center gap-2">
              <Layers className="w-5.5 h-5.5 text-[#DDE5B6]" />
              حركة السكان المتقدمة (نقل وترحيل الأفراد)
            </h2>
            <p className="text-[11px] text-[#E9F0E0]">أتمتة فصل الأفراد، تتبع الزواج الخارجي، النقل للمحافظات الأخرى وتحديث السجل المالي والسكاني</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 flex-1 overflow-y-auto">
          {errorMsg && (
            <div className="bg-red-50 text-red-700 p-4 rounded-2xl text-xs font-bold border border-red-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Fetch/Input Member */}
          <div className="bg-[#FDFBF7] border border-[#E2DED0] rounded-2xl p-4.5 space-y-4">
            <h3 className="text-xs font-extrabold text-[#4A5D4E] border-b border-[#F4F1EA] pb-1.5 flex items-center gap-1.5">
              <Search className="w-4 h-4" />
              1. جلب الفرد من السجل السكاني أو إدخال بيانات جديدة
            </h3>

            {/* Live Search */}
            <div className="relative">
              <label className="block text-[11px] font-black text-[#3E4C41] mb-1">ابحث عن الفرد المراد نقله (اسم الفرد، اللقب، الجوال):</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="اكتب اسم الفرد المراد البحث عنه..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-10 pl-3 py-2 text-xs font-bold bg-white rounded-xl border border-[#E2DED0] outline-none text-[#2D3A30] focus:ring-2 focus:ring-[#4A5D4E]/20"
                />
                <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>

              {/* Suggestions */}
              <AnimatePresence>
                {filteredMembers.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-[#E2DED0] rounded-xl shadow-lg max-h-56 overflow-y-auto divide-y divide-[#F4F1EA]"
                  >
                    {filteredMembers.map((item) => (
                      <button
                        key={item.member.id}
                        type="button"
                        onClick={() => handleSelectMember(item)}
                        className="w-full text-right px-4 py-2.5 hover:bg-[#FDFBF7] flex justify-between items-center text-xs transition-colors cursor-pointer"
                      >
                        <div className="space-y-0.5">
                          <strong className="text-[#2D3A30] block font-extrabold">{item.member.name}</strong>
                          <span className="text-[10px] text-gray-400 block">العائلة الأصلية: {item.family.familyName} ({item.member.relationship})</span>
                        </div>
                        <span className="text-[10px] bg-[#E9F0E0] text-[#4A5D4E] px-2 py-0.5 rounded-md font-bold">
                          {item.family.neighborhood}
                        </span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {selectedMember && (
              <div className="bg-[#E9F0E0]/40 border border-[#DDE5B6] p-3 rounded-xl flex justify-between items-center">
                <div className="text-xs space-y-0.5">
                  <span className="text-gray-500 font-medium">الفرد المحدد حالياً:</span>
                  <div className="flex items-center gap-1.5">
                    <strong className="text-[#2D3A30] font-black">{selectedMember.member.name}</strong>
                    <span className="text-[10px] bg-[#4A5D4E] text-[#FDFBF7] px-2 py-0.5 rounded-md">عائلة {selectedMember.family.familyName}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedMember(null)}
                  className="text-red-600 hover:text-red-800 text-[10px] font-black transition-colors"
                >
                  إلغاء التحديد وتعبئة يدوية
                </button>
              </div>
            )}

             {/* Individual Data Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-black text-[#3E4C41] mb-1">الاسم الأول للفرد فقط:</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    className={`w-full pr-8 pl-3 py-1.5 text-xs font-bold bg-white rounded-xl border outline-none ${
                      memberName.trim() && (memberName.includes(' ') || memberName.trim().split(/\s+/).length > 1)
                        ? 'border-red-500 bg-red-50 text-red-900 focus:ring-1 focus:ring-red-400'
                        : 'border-[#E2DED0] text-[#2D3A30] focus:ring-1 focus:ring-[#4A5D4E]'
                    }`}
                    placeholder="الاسم الأول فقط"
                  />
                  <User className="w-3.5 h-3.5 text-[#A98467] absolute right-2.5 top-1/2 -translate-y-1/2" />
                </div>
                {memberName.trim() && (memberName.includes(' ') || memberName.trim().split(/\s+/).length > 1) && (
                  <p className="text-[10px] text-red-600 font-bold mt-1">
                    ⚠️ خطأ: يجب إدخال اسم واحد فقط بدون مسافات!
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-black text-[#3E4C41] mb-1">اللقب / العائلة:</label>
                <input
                  type="text"
                  required
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-bold bg-white rounded-xl border border-[#E2DED0] outline-none text-[#2D3A30]"
                  placeholder="مثال: الخطيب"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-[#3E4C41] mb-1">المحلة السكنية:</label>
                <input
                  type="text"
                  required
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-bold bg-white rounded-xl border border-[#E2DED0] outline-none text-[#2D3A30]"
                  placeholder="اسم المحلة بالقرية"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-[#3E4C41] mb-1">الجنس:</label>
                <select
                  value={memberGender}
                  onChange={(e) => setMemberGender(e.target.value as GenderType)}
                  className="w-full px-3 py-1.5 text-xs font-bold bg-white rounded-xl border border-[#E2DED0] outline-none text-[#2D3A30]"
                >
                  <option value="ذكر">ذكر</option>
                  <option value="أنثى">أنثى</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-black text-[#3E4C41] mb-1">العمر:</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={130}
                  value={memberAge}
                  onChange={(e) => setMemberAge(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs font-bold bg-white rounded-xl border border-[#E2DED0] outline-none text-[#2D3A30]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-[#3E4C41] mb-1">رقم الهاتف (إن وجد):</label>
                <div className="relative">
                  <input
                    type="text"
                    value={memberPhone}
                    onChange={(e) => setMemberPhone(e.target.value)}
                    className="w-full pr-8 pl-3 py-1.5 text-xs font-bold bg-white rounded-xl border border-[#E2DED0] outline-none text-[#2D3A30]"
                    placeholder="77XXXXXXXX"
                  />
                  <Phone className="w-3.5 h-3.5 text-[#A98467] absolute right-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Move type & Parameters */}
          <div className="bg-[#FDFBF7] border border-[#E2DED0] rounded-2xl p-4.5 space-y-4">
            <h3 className="text-xs font-extrabold text-[#4A5D4E] border-b border-[#F4F1EA] pb-1.5 flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              2. نوع ترحيل حركة السكان وتاريخ التوثيق
            </h3>

            {/* Radio Buttons for moveType */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setMoveType('new_family')}
                className={`p-3 rounded-xl border text-right cursor-pointer transition-all flex flex-col justify-between ${
                  moveType === 'new_family' 
                    ? 'border-[#4A5D4E] bg-[#E9F0E0]/20 text-[#2D3A30] shadow-sm' 
                    : 'border-[#E2DED0] bg-white hover:bg-gray-50 text-gray-600'
                }`}
              >
                <strong className="text-xs block font-extrabold">🏡 نقل لأسرة جديدة</strong>
                <span className="text-[10px] text-gray-400 mt-1 block leading-relaxed">فصل الفرد وتكوينه كرب أسرة مستقلة في القرية مع أفراد تابعين له.</span>
              </button>

              <button
                type="button"
                onClick={() => setMoveType('marriage_outside')}
                className={`p-3 rounded-xl border text-right cursor-pointer transition-all flex flex-col justify-between ${
                  moveType === 'marriage_outside' 
                    ? 'border-[#A98467] bg-[#F9F5F0] text-[#2D3A30] shadow-sm' 
                    : 'border-[#E2DED0] bg-white hover:bg-gray-50 text-gray-600'
                }`}
              >
                <strong className="text-xs block font-extrabold">💍 زواج جديد لخارج القرية</strong>
                <span className="text-[10px] text-gray-400 mt-1 block leading-relaxed">تحديث السجل بخصمه ومغادرته للتعداد السكاني بالقرية بسبب الزواج.</span>
              </button>

              <button
                type="button"
                onClick={() => setMoveType('out_governorate')}
                className={`p-3 rounded-xl border text-right cursor-pointer transition-all flex flex-col justify-between ${
                  moveType === 'out_governorate' 
                    ? 'border-[#7A8B7E] bg-slate-50 text-[#2D3A30] shadow-sm' 
                    : 'border-[#E2DED0] bg-white hover:bg-gray-50 text-gray-600'
                }`}
              >
                <strong className="text-xs block font-extrabold">📍 نقل لمحافظة أخرى</strong>
                <span className="text-[10px] text-gray-400 mt-1 block leading-relaxed">نقل الإقامة الرسمية للفرد بالكامل لخارج النطاق الجغرافي للقرية لمحافظة يمنية أخرى.</span>
              </button>
            </div>

            {/* Dynamic fields based on choice */}
            {moveType === 'new_family' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-white border border-[#E2DED0] rounded-xl p-4 space-y-4"
              >
                <h4 className="text-xs font-black text-[#A98467] border-b border-[#F4F1EA] pb-1">تفاصيل وممتلكات الأسرة الجديدة</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-black text-[#3E4C41] mb-1">العنوان بالتحديد:</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-bold bg-white rounded-xl border border-[#E2DED0] outline-none text-[#2D3A30]"
                      placeholder="مثال: حارة المسجد الكبير"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-[#3E4C41] mb-1">نوع السكن:</label>
                    <select
                      value={housingType}
                      onChange={(e) => setHousingType(e.target.value as HousingType)}
                      className="w-full px-3 py-1.5 text-xs font-bold bg-white rounded-xl border border-[#E2DED0] outline-none text-[#2D3A30]"
                    >
                      <option value="ملك">ملك</option>
                      <option value="إيجار">إيجار</option>
                      <option value="شعبي">شعبي</option>
                      <option value="أخرى">أخرى</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-[#3E4C41] mb-1">الدخل الشهري التقريبي (اختياري):</label>
                    <input
                      type="text"
                      value={monthlyIncome}
                      onChange={(e) => setMonthlyIncome(e.target.value)}
                      placeholder="اكتب الدخل الشهري..."
                      className="w-full px-3 py-1.5 text-xs font-bold bg-white rounded-xl border border-[#E2DED0] outline-none text-[#2D3A30] focus:ring-1 focus:ring-[#4A5D4E]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-[#3E4C41] mb-1">حالة الدعم المستحق:</label>
                    <select
                      value={supportStatus}
                      onChange={(e) => setSupportStatus(e.target.value as SupportStatusType)}
                      className="w-full px-3 py-1.5 text-xs font-bold bg-white rounded-xl border border-[#E2DED0] outline-none text-[#2D3A30]"
                    >
                      <option value="تحت الدراسة">تحت الدراسة</option>
                      <option value="مستحق للدعم">مستحق للدعم</option>
                      <option value="غير مستحق / مكتفي">غير مستحق / مكتفي</option>
                    </select>
                  </div>
                </div>

                {/* Sub-Dependents Choice */}
                <div className="border-t border-[#F4F1EA] pt-3.5 space-y-3">
                  <div>
                    <h5 className="text-[11px] font-black text-[#2D3A30] flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#4A5D4E]" />
                      ربط ونقل أفراد تابعين من الأسر المسجلة حالياً مع رب الأسرة الجديد
                    </h5>
                    <p className="text-[10px] text-gray-400">إذا كان لرب الأسرة الجديد زوجة أو أطفال أو تابعون مسجلون سابقاً ببيوت أخرى، يمكنك تحديدهم هنا لنقلهم معاً برمجياً للأسرة الجديدة.</p>
                  </div>

                  {/* Dependent search */}
                  <input
                    type="text"
                    placeholder="ابحث بالاسم لتحديد تابع..."
                    value={dependentSearch}
                    onChange={(e) => setDependentSearch(e.target.value)}
                    className="w-full px-3 py-1.5 text-[11px] bg-[#FDFBF7] rounded-lg border border-[#E2DED0] outline-none text-[#2D3A30]"
                  />

                  {/* Dependent selector list */}
                  {availableDependents.length > 0 ? (
                    <div className="max-h-40 overflow-y-auto border border-[#E2DED0] rounded-xl divide-y divide-[#F4F1EA] bg-[#FDFBF7]/40">
                      {availableDependents.map((item) => {
                        const isChecked = selectedDependents.some(d => d.memberId === item.member.id);
                        const depObj = selectedDependents.find(d => d.memberId === item.member.id);

                        return (
                          <div key={item.member.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-white transition-all">
                            <label className="flex items-center gap-2 cursor-pointer flex-1 select-none">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleDependent(item.member.id)}
                                className="rounded text-[#4A5D4E] focus:ring-[#4A5D4E]"
                              />
                              <div>
                                <strong className="text-[#2D3A30] font-bold block">{item.member.name}</strong>
                                <span className="text-[10px] text-gray-400 block">العائلة الأصلية: {item.family.familyName} ({item.member.relationship})</span>
                              </div>
                            </label>

                            {isChecked && (
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-[#A98467] font-bold">القرابة الجديدة:</span>
                                <select
                                  value={depObj?.relationship || 'ابن'}
                                  onChange={(e) => handleDependentRelationshipChange(item.member.id, e.target.value as RelationshipType)}
                                  className="px-2 py-0.5 text-[10px] font-bold border border-[#E2DED0] bg-white rounded-md outline-none"
                                >
                                  <option value="زوجة">زوجة</option>
                                  <option value="ابن">ابن</option>
                                  <option value="ابنة">ابنة</option>
                                  <option value="أب">أب</option>
                                  <option value="أم">أم</option>
                                  <option value="أخ">أخ</option>
                                  <option value="أخت">أخت</option>
                                  <option value="آخر">آخر</option>
                                </select>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[10px] text-gray-400 text-center py-2 bg-gray-50 rounded-lg">اكتب اسم الفرد للبحث عنه لتحديده كعضو تابع للأسرة الجديدة.</p>
                  )}
                </div>
              </motion.div>
            )}

            {moveType === 'out_governorate' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-white border border-[#E2DED0] rounded-xl p-4 space-y-3"
              >
                <h4 className="text-xs font-black text-[#7A8B7E] border-b border-[#F4F1EA] pb-1">تحديد المحافظة المنتقل إليها</h4>
                <div>
                  <label className="block text-[11px] font-black text-[#3E4C41] mb-1">المحافظة المستهدفة بالجمهورية اليمنية:</label>
                  <select
                    value={targetGovernorate}
                    onChange={(e) => setTargetGovernorate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-bold bg-white rounded-xl border border-[#E2DED0] outline-none text-[#2D3A30]"
                  >
                    {YEMEN_GOVERNORATES.map((gov) => (
                      <option key={gov} value={gov}>{gov}</option>
                    ))}
                  </select>
                </div>
              </motion.div>
            )}

            {/* Date Picker & Global notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-[#F4F1EA] pt-3.5">
              <div>
                <label className="block text-[11px] font-black text-[#3E4C41] mb-1">
                  تاريخ النقل / الزواج (إلزامي):
                </label>
                <input
                  type="date"
                  required
                  value={transferDate}
                  onChange={(e) => setTransferDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-bold bg-white rounded-xl border border-[#E2DED0] outline-none text-[#2D3A30]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-[#3E4C41] mb-1">
                  سبب وملاحظات عملية الترحيل السكاني والمبررات التفصيلية <span className="text-red-500">* (إلزامي)</span>:
                </label>
                <textarea
                  required
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-1.5 text-xs font-bold bg-white rounded-xl border border-red-200 outline-none text-[#2D3A30] resize-none focus:border-[#4A5D4E]"
                  placeholder="فضلاً اكتب هنا أسباب ومبررات وملاحظات عملية حركة السكان بالتفصيل لتوثيق السجل..."
                />
              </div>
            </div>
          </div>

          {/* Warning Check */}
          <div className="bg-[#A98467]/10 border border-[#A98467]/30 p-3.5 rounded-2xl flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-[#A98467] shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed text-[#3E4C41]">
              <strong className="block text-[#2D3A30] font-black mb-0.5">تنبيه تأكيد نقل وتحديث التعداد السكاني:</strong>
              هذا الإجراء حيوي ويقوم بتعديل سجلات الأسرة الأصلية في قاعدة البيانات وتحديث الأوزان النسبية والمؤشرات المالية والطبية في القرية تلقائياً. يرجى مراجعة البيانات قبل الحفظ.
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-[#F4F1EA]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold border border-[#E2DED0] text-[#3E4C41] rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
            >
              إلغاء النافذة
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-black bg-[#4A5D4E] text-white rounded-xl hover:bg-[#3E4C41] transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
            >
              <CheckCircle className="w-4 h-4" />
              تأكيد وإجراء عملية النقل
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
