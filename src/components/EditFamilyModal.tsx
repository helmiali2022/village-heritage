import React, { useState, useEffect } from 'react';
import { Family, Member, HousingType, IncomeRangeType, SupportStatusType } from '../types';
import { X, Save, AlertTriangle, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface EditFamilyModalProps {
  family: Family;
  onClose: () => void;
  onSave: (updatedFamily: Family) => void;
  uniqueSurnames: string[];
  uniqueNeighborhoods: string[];
  residenceOptions: string[];
  currentUser: any;
}

const calculateAge = (birthDateString: string): number => {
  if (!birthDateString) return 0;
  const birthDate = new Date(birthDateString);
  if (isNaN(birthDate.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return Math.max(0, age);
};

export default function EditFamilyModal({
  family,
  onClose,
  onSave,
  uniqueSurnames,
  uniqueNeighborhoods,
  residenceOptions,
  currentUser,
}: EditFamilyModalProps) {
  // Fields state
  const [selectedSurname, setSelectedSurname] = useState<string>('');
  const [customSurname, setCustomSurname] = useState<string>('');
  const [isNewSurname, setIsNewSurname] = useState<boolean>(false);

  const [breadwinnerName, setBreadwinnerName] = useState(family.breadwinnerName || '');
  const [phone, setPhone] = useState(family.phone || '');
  const [neighborhood, setNeighborhood] = useState(family.neighborhood || '');
  const [address, setAddress] = useState(family.address || '');
  const [housingType, setHousingType] = useState<HousingType>(family.housingType || 'ملك');
  const [monthlyIncome, setMonthlyIncome] = useState<string>(family.monthlyIncome || '0');
  const [supportStatus, setSupportStatus] = useState<SupportStatusType>(family.supportStatus || 'تحت الدراسة');
  const [residence, setResidence] = useState(family.residence || 'دائمة');
  const [notes, setNotes] = useState(family.notes || '');

  // Members editing states
  const [showMembersSection, setShowMembersSection] = useState(false);
  const [members, setMembers] = useState<Member[]>(family.members || []);

  const canEditMembers = currentUser && ['super-admin', 'admin', 'delegate'].includes(currentUser.role);

  const handleMemberFieldChange = (index: number, field: keyof Member, value: any) => {
    const updatedMembers = [...members];
    let updatedMember = {
      ...updatedMembers[index],
      [field]: value
    };

    if (field === 'relationship') {
      const rel = value as string;
      if (['ابن', 'زوج', 'أب', 'أخ'].includes(rel)) {
        updatedMember.gender = 'ذكر';
      } else if (['ابنة', 'زوجة', 'أم', 'أخت'].includes(rel)) {
        updatedMember.gender = 'أنثى';
      }
    }

    updatedMembers[index] = updatedMember;
    setMembers(updatedMembers);
  };

  const handleAddMember = () => {
    const newMember: Member = {
      id: `mem_new_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: '',
      relationship: 'ابن',
      gender: 'ذكر',
      age: 18,
      education: 'غير محدد',
      occupation: 'لا يوجد',
      healthStatus: 'سليم',
    };
    setMembers([...members, newMember]);
  };

  const handleRemoveMember = (index: number) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الفرد من قائمة أفراد الأسرة؟')) {
      const updatedMembers = members.filter((_, i) => i !== index);
      setMembers(updatedMembers);
    }
  };

  const handleBirthDateChange = (index: number, birthDateVal: string) => {
    const calculatedAge = calculateAge(birthDateVal);
    const updatedMembers = [...members];
    updatedMembers[index] = {
      ...updatedMembers[index],
      birthDate: birthDateVal,
      age: calculatedAge
    };
    setMembers(updatedMembers);
  };

  // Initialize surname selection
  useEffect(() => {
    const trimmedFamilyName = family.familyName?.trim() || '';
    if (uniqueSurnames.includes(trimmedFamilyName)) {
      setSelectedSurname(trimmedFamilyName);
      setIsNewSurname(false);
    } else if (trimmedFamilyName) {
      setSelectedSurname('__new__');
      setCustomSurname(trimmedFamilyName);
      setIsNewSurname(true);
    } else {
      setSelectedSurname('');
      setIsNewSurname(false);
    }
  }, [family, uniqueSurnames]);

  const handleSurnameChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedSurname(val);
    if (val === '__new__') {
      setIsNewSurname(true);
      setCustomSurname('');
    } else {
      setIsNewSurname(false);
      setCustomSurname('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalFamilyName = isNewSurname ? customSurname.trim() : selectedSurname.trim();

    if (!finalFamilyName) {
      alert('يرجى اختيار أو كتابة اللقب الموحد للعائلة');
      return;
    }

    if (!breadwinnerName.trim()) {
      alert('يرجى كتابة اسم رب الأسرة');
      return;
    }

    const updatedFamily: Family = {
      ...family,
      familyName: finalFamilyName,
      breadwinnerName: breadwinnerName.trim(),
      phone: phone.trim(),
      neighborhood,
      address: address.trim(),
      housingType,
      monthlyIncome,
      supportStatus,
      residence,
      notes: notes.trim(),
      members: members.map(m => ({
        ...m,
        name: m.name.split(' ')[0] // Strictly enforce First Name only for dependent on save
      })),
    };

    onSave(updatedFamily);
  };

  return (
    <div className="fixed inset-0 bg-[#2D3A30]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fadeIn">
      <div className={`bg-[#FDFBF7] rounded-3xl w-full border border-[#E2DED0] shadow-2xl overflow-hidden flex flex-col my-8 transition-all duration-300 ${showMembersSection ? 'max-w-5xl' : 'max-w-2xl'}`}>
        
        {/* Header */}
        <div className="bg-[#4A5D4E] text-[#FDFBF7] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">✏️</span>
            <div>
              <h3 className="font-extrabold text-sm">التعديل السريع والمبسط لبيانات العائلة</h3>
              <p className="text-[10px] text-white/70">تعديل الملف التأسيسي دون التأثير على قائمة الأفراد المضافة</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
          {/* Surnames Group */}
          <div className="bg-white p-4 rounded-2xl border border-[#E2DED0]/50 space-y-3">
            <h4 className="text-[11px] font-black text-[#4A5D4E] border-b border-[#F4F1EA] pb-1">منظومة الألقاب الموحدة</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-[#7A8B7E] mb-1 font-bold">اللقب الموحد (المسجل سابقاً)</label>
                <select
                  value={selectedSurname}
                  onChange={handleSurnameChange}
                  className="w-full px-2.5 py-2 rounded-xl border border-[#E2DED0] text-xs bg-[#FDFBF7] text-[#2D3A30] font-bold outline-none focus:border-[#4A5D4E]"
                  required
                >
                  <option value="" disabled>-- اختر اللقب من السجل الموحد --</option>
                  {uniqueSurnames.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                  <option value="__new__">➕ إضافة لقب عائلي جديد...</option>
                </select>
              </div>

              {isNewSurname && (
                <div className="animate-fadeIn">
                  <label className="block text-[10px] text-[#A98467] mb-1 font-extrabold">اللقب العائلي الجديد</label>
                  <input
                    type="text"
                    required
                    value={customSurname}
                    onChange={(e) => setCustomSurname(e.target.value)}
                    placeholder="اكتب اللقب الجديد بدقة..."
                    className="w-full px-2.5 py-2 rounded-xl border border-[#A98467] text-xs bg-[#FFFDF9] text-[#2D3A30] font-bold outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Basic Info Group */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-[#7A8B7E] mb-1 font-bold">اسم رب الأسرة (ثلاثي/رباعي)</label>
              <input
                type="text"
                required
                value={breadwinnerName}
                onChange={(e) => setBreadwinnerName(e.target.value)}
                placeholder="مثال: أحمد عبد الله الخطيب"
                className="w-full px-2.5 py-2 rounded-xl border border-[#E2DED0] text-xs bg-white text-[#2D3A30] font-semibold outline-none focus:border-[#4A5D4E]"
              />
            </div>

            <div>
              <label className="block text-[10px] text-[#7A8B7E] mb-1 font-bold">رقم جوال التواصل</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="05xxxxxxxx"
                className="w-full px-2.5 py-2 rounded-xl border border-[#E2DED0] text-xs bg-white text-[#2D3A30] font-mono outline-none focus:border-[#4A5D4E]"
              />
            </div>

            <div>
              <label className="block text-[10px] text-[#7A8B7E] mb-1 font-bold">المحلة / الحي السكني</label>
              <select
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl border border-[#E2DED0] text-xs bg-white text-[#2D3A30] font-semibold outline-none focus:border-[#4A5D4E]"
                required
              >
                <option value="" disabled>-- اختر المحلة --</option>
                {uniqueNeighborhoods.map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-[#7A8B7E] mb-1 font-bold">العنوان السكني التفصيلي</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="مثال: حارة المسجد، بجوار البئر..."
                className="w-full px-2.5 py-2 rounded-xl border border-[#E2DED0] text-xs bg-white text-[#2D3A30] font-semibold outline-none focus:border-[#4A5D4E]"
              />
            </div>
          </div>

          {/* Social/Economic Info Group */}
          <div className="bg-white p-4 rounded-2xl border border-[#E2DED0]/50 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] text-[#7A8B7E] mb-1 font-bold">نوع السكن</label>
              <select
                value={housingType}
                onChange={(e) => setHousingType(e.target.value as HousingType)}
                className="w-full px-2 py-1.5 rounded-lg border border-[#E2DED0] text-[11px] bg-white text-[#2D3A30] outline-none"
              >
                <option value="ملك">ملك</option>
                <option value="إيجار">إيجار</option>
                <option value="شعبي">شعبي</option>
                <option value="أخرى">أخرى</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-[#7A8B7E] mb-1 font-bold">الدخل الشهري التقريبي (اختياري)</label>
              <input
                type="text"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                placeholder="اكتب الدخل الشهري..."
                className="w-full px-2 py-1.5 rounded-lg border border-[#E2DED0] text-[11px] bg-white text-[#2D3A30] outline-none focus:ring-1 focus:ring-[#4A5D4E]"
              />
            </div>

            <div>
              <label className="block text-[10px] text-[#7A8B7E] mb-1 font-bold">حالة الإقامة</label>
              <select
                value={residence}
                onChange={(e) => setResidence(e.target.value)}
                className="w-full px-2 py-1.5 rounded-lg border border-[#E2DED0] text-[11px] bg-white text-[#2D3A30] outline-none"
              >
                {residenceOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Support status */}
          <div>
            <label className="block text-[10px] text-[#7A8B7E] mb-1 font-bold">حالة الدعم والاستحقاق</label>
            <div className="flex gap-4 p-2 bg-[#F4F1EA]/50 rounded-xl border border-[#E2DED0]/50 justify-around">
              <label className="flex items-center gap-1.5 text-xs text-red-800 font-extrabold cursor-pointer">
                <input
                  type="radio"
                  name="supportStatus"
                  value="مستحق للدعم"
                  checked={supportStatus === 'مستحق للدعم'}
                  onChange={() => setSupportStatus('مستحق للدعم')}
                  className="accent-red-600 cursor-pointer"
                />
                <span>مستحق للدعم 🔴</span>
              </label>

              <label className="flex items-center gap-1.5 text-xs text-amber-800 font-bold cursor-pointer">
                <input
                  type="radio"
                  name="supportStatus"
                  value="تحت الدراسة"
                  checked={supportStatus === 'تحت الدراسة'}
                  onChange={() => setSupportStatus('تحت الدراسة')}
                  className="accent-amber-600 cursor-pointer"
                />
                <span>تحت الدراسة 🟡</span>
              </label>

              <label className="flex items-center gap-1.5 text-xs text-emerald-800 font-bold cursor-pointer">
                <input
                  type="radio"
                  name="supportStatus"
                  value="غير مستحق / مكتفي"
                  checked={supportStatus === 'غير مستحق / مكتفي'}
                  onChange={() => setSupportStatus('غير مستحق / مكتفي')}
                  className="accent-emerald-600 cursor-pointer"
                />
                <span>غير مستحق / مكتفي 🟢</span>
              </label>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[10px] text-[#7A8B7E] mb-1 font-bold">ملاحظات الرصد والمتابعة</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="اكتب أي ملاحظات إضافية تخص الوضع السكني أو المادي أو المساعدات المقترحة..."
              rows={3}
              className="w-full px-2.5 py-2 rounded-xl border border-[#E2DED0] text-xs bg-white text-[#2D3A30] outline-none focus:border-[#4A5D4E] resize-none"
            />
          </div>

          {/* Section: Dependent Family Members Accordion */}
          <div className="border border-[#E2DED0] rounded-2xl overflow-hidden bg-white shadow-xs">
            <button
              type="button"
              onClick={() => setShowMembersSection(!showMembersSection)}
              className="w-full flex justify-between items-center px-4 py-3 bg-[#F4F1EA]/30 hover:bg-[#F4F1EA]/60 text-[#2D3A30] font-bold text-xs transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <span>👪</span>
                <span className="font-extrabold text-[#2D3A30]">عرض وتعديل بيانات أفراد الأسرة التابعين ({members.length})</span>
                <span className="bg-[#4A5D4E] text-[#FDFBF7] text-[9px] px-2 py-0.5 rounded-full font-sans font-medium">قائمة تفاعلية</span>
              </span>
              {showMembersSection ? <ChevronUp className="w-4 h-4 text-[#4A5D4E]" /> : <ChevronDown className="w-4 h-4 text-[#4A5D4E]" />}
            </button>

            {showMembersSection && (
              <div className="p-4 border-t border-[#E2DED0] space-y-4 bg-[#FDFBF7]/30">
                {/* User Role Permission Indicator */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-[#FFFDF9] p-3 rounded-xl border border-[#A98467]/20">
                  <div className="flex items-center gap-2">
                    <span className="text-xs">🔐</span>
                    <span className="text-[11px] font-bold text-[#3E4C41]">رتبة المستخدم الحالي وصلاحياته:</span>
                    {currentUser && currentUser.role === 'super-admin' && (
                      <span className="bg-purple-100 text-purple-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md">المشرف العام (تحكم مطلق 🛠️)</span>
                    )}
                    {currentUser && currentUser.role === 'admin' && (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md">مدير شؤون القرية (صلاحيات كاملة 🏢)</span>
                    )}
                    {currentUser && currentUser.role === 'delegate' && (
                      <span className="bg-blue-100 text-blue-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md">المندوب المعتمد (إدخال وتعديل ✍️)</span>
                    )}
                    {currentUser && !['super-admin', 'admin', 'delegate'].includes(currentUser.role) && (
                      <span className="bg-gray-100 text-gray-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md">مستعرض فقط (عرض السجلات 👁️)</span>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-500 font-medium">الوضع: {canEditMembers ? 'تعديل نشط ومباشر' : 'عرض فقط'}</span>
                </div>

                {!canEditMembers && (
                  <div className="bg-amber-50 border border-amber-100 p-2.5 rounded-xl text-[10px] text-amber-800 font-bold">
                    ⚠️ انتباه: حسابك لا يملك صلاحية تعديل بيانات أفراد الأسرة. العرض متاح للقراءة فقط (التعديل متاح للمشرف العام، ومدير الشؤون، والمندوب المعتمد).
                  </div>
                )}

                {members.length === 0 ? (
                  <div className="text-center py-6 text-gray-400 text-xs font-bold">
                    📭 لا يوجد أفراد أسرة مضافين حالياً لهذا الملف.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto border border-[#E2DED0] rounded-xl bg-white max-h-[350px] overflow-y-auto shadow-2xs">
                      <table className="w-full text-right text-xs table-auto divide-y divide-[#E2DED0]">
                        <thead className="bg-[#F4F1EA] text-[#3E4C41] font-bold sticky top-0 z-10">
                          <tr>
                            <th className="p-2 font-bold text-[11px] min-w-[140px]">الاسم الأول للتابع فقط</th>
                            <th className="p-2 font-bold text-[11px] w-24">صلة القرابة</th>
                            <th className="p-2 font-bold text-[11px] w-20">الجنس</th>
                            <th className="p-2 font-bold text-[11px] w-36">تاريخ الميلاد (العمر)</th>
                            <th className="p-2 font-bold text-[11px] w-28">التحصيل العلمي</th>
                            <th className="p-2 font-bold text-[11px] w-28">المهنة / العمل</th>
                            <th className="p-2 font-bold text-[11px] w-36">الحالة الصحية</th>
                            {canEditMembers && <th className="p-2 font-bold text-[11px] w-12 text-center">إجراء</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F4F1EA] bg-white">
                          {members.map((member, idx) => {
                            const isGenderLocked = ['ابن', 'زوج', 'أب', 'أخ', 'ابنة', 'زوجة', 'أم', 'أخت'].includes(member.relationship);
                            return (
                              <tr key={member.id || idx} className="hover:bg-[#FFFDF9] transition-colors">
                                <td className="p-2">
                                  <input
                                    type="text"
                                    value={member.name}
                                    onChange={(e) => handleMemberFieldChange(idx, 'name', e.target.value)}
                                    disabled={!canEditMembers}
                                    placeholder="الاسم الأول فقط"
                                    className="w-full px-2 py-1 rounded-lg border border-[#E2DED0] text-xs bg-white text-[#2D3A30] font-semibold outline-none focus:ring-1 focus:ring-[#4A5D4E] focus:border-[#4A5D4E] disabled:bg-[#F4F1EA]/40 disabled:text-gray-500"
                                    required
                                  />
                                </td>
                                <td className="p-2">
                                  <select
                                    value={member.relationship}
                                    onChange={(e) => handleMemberFieldChange(idx, 'relationship', e.target.value)}
                                    disabled={!canEditMembers}
                                    className="w-full px-2 py-1 rounded-lg border border-[#E2DED0] text-xs bg-white text-[#2D3A30] font-semibold outline-none focus:ring-1 focus:ring-[#4A5D4E] disabled:bg-[#F4F1EA]/40 disabled:text-gray-500"
                                  >
                                    <option value="زوج">زوج</option>
                                    <option value="زوجة">زوجة</option>
                                    <option value="ابن">ابن</option>
                                    <option value="ابنة">ابنة</option>
                                    <option value="أب">أب</option>
                                    <option value="أم">أم</option>
                                    <option value="أخ">أخ</option>
                                    <option value="أخت">أخت</option>
                                    <option value="آخر">آخر</option>
                                  </select>
                                </td>
                                <td className="p-2">
                                  <select
                                    value={member.gender}
                                    onChange={(e) => handleMemberFieldChange(idx, 'gender', e.target.value)}
                                    disabled={!canEditMembers || isGenderLocked}
                                    className="w-full px-2 py-1 rounded-lg border border-[#E2DED0] text-xs bg-white text-[#2D3A30] font-semibold outline-none focus:ring-1 focus:ring-[#4A5D4E] disabled:bg-[#F4F1EA]/50 disabled:text-[#7A8B7E] disabled:font-bold"
                                  >
                                    <option value="ذكر">ذكر</option>
                                    <option value="أنثى">أنثى</option>
                                  </select>
                                </td>
                                <td className="p-2">
                                  <div className="flex flex-col gap-1">
                                    <input
                                      type="date"
                                      value={member.birthDate || ''}
                                      onChange={(e) => handleBirthDateChange(idx, e.target.value)}
                                      disabled={!canEditMembers}
                                      className="w-full px-2 py-1 rounded-lg border border-[#E2DED0] text-xs bg-white text-[#2D3A30] font-mono font-semibold outline-none focus:ring-1 focus:ring-[#4A5D4E] disabled:bg-[#F4F1EA]/40 disabled:text-gray-500"
                                    />
                                    <span className="text-[10px] text-[#4A5D4E] font-bold bg-[#E9F0E0]/60 px-1.5 py-0.5 rounded-md self-start">
                                      العمر: {member.age || 0} سنة
                                    </span>
                                  </div>
                                </td>
                                <td className="p-2">
                                  <select
                                    value={member.education || 'غير محدد'}
                                    onChange={(e) => handleMemberFieldChange(idx, 'education', e.target.value)}
                                    disabled={!canEditMembers}
                                    className="w-full px-2 py-1 rounded-lg border border-[#E2DED0] text-xs bg-white text-[#2D3A30] font-semibold outline-none focus:ring-1 focus:ring-[#4A5D4E] disabled:bg-[#F4F1EA]/40 disabled:text-gray-500"
                                  >
                                    <option value="أمي">أمي</option>
                                    <option value="دون سن الدراسة">دون سن الدراسة</option>
                                    <option value="ابتدائي">ابتدائي</option>
                                    <option value="إعدادي">إعدادي</option>
                                    <option value="ثانوي">ثانوي</option>
                                    <option value="جامعي">جامعي</option>
                                    <option value="دراسات عليا">دراسات عليا</option>
                                    <option value="غير محدد">غير محدد</option>
                                  </select>
                                </td>
                              <td className="p-2">
                                <select
                                  value={member.occupation || 'لا يوجد'}
                                  onChange={(e) => handleMemberFieldChange(idx, 'occupation', e.target.value)}
                                  disabled={!canEditMembers}
                                  className="w-full px-2 py-1 rounded-lg border border-[#E2DED0] text-xs bg-white text-[#2D3A30] font-semibold outline-none focus:ring-1 focus:ring-[#4A5D4E] disabled:bg-[#F4F1EA]/40 disabled:text-gray-500"
                                >
                                  <option value="طالب">طالب</option>
                                  <option value="موظف حكومي">موظف حكومي</option>
                                  <option value="موظف قطاع خاص">موظف قطاع خاص</option>
                                  <option value="أعمال حرة">أعمال حرة</option>
                                  <option value="متقاعد">متقاعد</option>
                                  <option value="ربة منزل">ربة منزل</option>
                                  <option value="لا يوجد">لا يوجد</option>
                                </select>
                              </td>
                              <td className="p-2">
                                <select
                                  value={member.healthStatus || 'سليم'}
                                  onChange={(e) => handleMemberFieldChange(idx, 'healthStatus', e.target.value)}
                                  disabled={!canEditMembers}
                                  className="w-full px-2 py-1 rounded-lg border border-[#E2DED0] text-xs bg-white text-[#2D3A30] font-semibold outline-none focus:ring-1 focus:ring-[#4A5D4E] disabled:bg-[#F4F1EA]/40 disabled:text-gray-500"
                                >
                                  <option value="سليم">سليم 🟢</option>
                                  <option value="ذوي احتياجات خاصة">ذوي احتياجات خاصة 🔵</option>
                                  <option value="مرض مزمن">مرض مزمن 🔴</option>
                                </select>
                              </td>
                              {canEditMembers && (
                                <td className="p-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveMember(idx)}
                                    className="p-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border-0 cursor-pointer transition-colors"
                                    title="حذف الفرد من قائمة العائلة"
                                  >
                                    🗑️
                                  </button>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Flex Cards */}
                    <div className="block md:hidden space-y-3">
                      {members.map((member, idx) => {
                        const isGenderLocked = ['ابن', 'زوج', 'أب', 'أخ', 'ابنة', 'زوجة', 'أم', 'أخت'].includes(member.relationship);
                        return (
                          <div key={member.id || idx} className="bg-white p-4 rounded-2xl border border-[#E2DED0] space-y-2.5 shadow-2xs">
                            <div className="flex justify-between items-center border-b border-[#F4F1EA] pb-1.5">
                              <span className="text-[10px] bg-[#F4F1EA] text-[#4A5D4E] px-2.5 py-0.5 rounded-md font-bold">فرد #{idx + 1}</span>
                              {canEditMembers && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMember(idx)}
                                  className="text-red-600 bg-transparent border-0 cursor-pointer font-bold text-xs"
                                >
                                  ❌ حذف الفرد
                                </button>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                              <div className="col-span-2">
                                <label className="block text-[9px] text-[#7A8B7E] font-bold mb-0.5">الاسم الأول للتابع فقط</label>
                                <input
                                  type="text"
                                  value={member.name}
                                  onChange={(e) => handleMemberFieldChange(idx, 'name', e.target.value)}
                                  disabled={!canEditMembers}
                                  placeholder="الاسم الأول فقط"
                                  className="w-full px-2.5 py-1.5 border border-[#E2DED0] rounded-lg text-xs bg-white text-[#2D3A30] outline-none disabled:bg-[#F4F1EA]/30"
                                  required
                                />
                              </div>
                            
                            <div>
                              <label className="block text-[9px] text-[#7A8B7E] font-bold mb-0.5">صلة القرابة</label>
                              <select
                                value={member.relationship}
                                onChange={(e) => handleMemberFieldChange(idx, 'relationship', e.target.value)}
                                disabled={!canEditMembers}
                                className="w-full px-2 py-1.5 border border-[#E2DED0] rounded-lg text-xs bg-white text-[#2D3A30] outline-none"
                              >
                                <option value="زوج">زوج</option>
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

                            <div>
                              <label className="block text-[9px] text-[#7A8B7E] font-bold mb-0.5">الجنس</label>
                              <select
                                value={member.gender}
                                onChange={(e) => handleMemberFieldChange(idx, 'gender', e.target.value)}
                                disabled={!canEditMembers || isGenderLocked}
                                className="w-full px-2 py-1.5 border border-[#E2DED0] rounded-lg text-xs bg-white text-[#2D3A30] outline-none disabled:bg-[#F4F1EA]/40 disabled:text-[#7A8B7E]"
                              >
                                <option value="ذكر">ذكر</option>
                                <option value="أنثى">أنثى</option>
                              </select>
                            </div>

                            <div className="col-span-2 bg-[#FDFBF7] p-2 rounded-xl border border-[#E2DED0]/60 flex flex-col gap-1">
                              <label className="block text-[9px] text-[#7A8B7E] font-bold">تاريخ الميلاد</label>
                              <input
                                type="date"
                                value={member.birthDate || ''}
                                onChange={(e) => handleBirthDateChange(idx, e.target.value)}
                                disabled={!canEditMembers}
                                className="w-full px-2.5 py-1.5 border border-[#E2DED0] rounded-lg text-xs bg-white text-[#2D3A30] outline-none font-mono"
                              />
                              <span className="text-[10px] text-[#4A5D4E] font-extrabold mt-0.5">
                                العمر الفعلي: {member.age || 0} سنة
                              </span>
                            </div>

                            <div className="col-span-2">
                              <label className="block text-[9px] text-[#7A8B7E] font-bold mb-0.5">التحصيل العلمي</label>
                              <select
                                value={member.education || 'غير محدد'}
                                onChange={(e) => handleMemberFieldChange(idx, 'education', e.target.value)}
                                disabled={!canEditMembers}
                                className="w-full px-2 py-1.5 border border-[#E2DED0] rounded-lg text-xs bg-white text-[#2D3A30] outline-none"
                              >
                                <option value="أمي">أمي</option>
                                <option value="دون سن الدراسة">دون سن الدراسة</option>
                                <option value="ابتدائي">ابتدائي</option>
                                <option value="إعدادي">إعدادي</option>
                                <option value="ثانوي">ثانوي</option>
                                <option value="جامعي">جامعي</option>
                                <option value="دراسات عليا">دراسات عليا</option>
                                <option value="غير محدد">غير محدد</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[9px] text-[#7A8B7E] font-bold mb-0.5">المهنة / العمل</label>
                              <select
                                value={member.occupation || 'لا يوجد'}
                                onChange={(e) => handleMemberFieldChange(idx, 'occupation', e.target.value)}
                                disabled={!canEditMembers}
                                className="w-full px-2 py-1.5 border border-[#E2DED0] rounded-lg text-xs bg-white text-[#2D3A30] outline-none"
                              >
                                <option value="طالب">طالب</option>
                                <option value="موظف حكومي">موظف حكومي</option>
                                <option value="موظف قطاع خاص">موظف قطاع خاص</option>
                                <option value="أعمال حرة">أعمال حرة</option>
                                <option value="متقاعد">متقاعد</option>
                                <option value="ربة منزل">ربة منزل</option>
                                <option value="لا يوجد">لا يوجد</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[9px] text-[#7A8B7E] font-bold mb-0.5">الحالة الصحية</label>
                              <select
                                value={member.healthStatus}
                                onChange={(e) => handleMemberFieldChange(idx, 'healthStatus', e.target.value)}
                                disabled={!canEditMembers}
                                className="w-full px-2 py-1.5 border border-[#E2DED0] rounded-lg text-xs bg-white text-[#2D3A30] outline-none"
                              >
                                <option value="سليم">سليم 🟢</option>
                                <option value="ذوي احتياجات خاصة">احتياجات خاصة 🔵</option>
                                <option value="مرض مزمن">مرض مزمن 🔴</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    </div>
                  </div>
                )}

                {canEditMembers && (
                  <button
                    type="button"
                    onClick={handleAddMember}
                    className="w-full bg-[#E9F0E0] hover:bg-[#DDE5B6] border border-[#DDE5B6] text-[#4A5D4E] text-[11px] font-bold py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-3xs"
                  >
                    <span>➕ إضافة فرد جديد للأسرة التابعين</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Note about member safety */}
          <div className="bg-[#FFFDF9] border border-[#A98467]/30 p-3 rounded-xl flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-[#A98467] shrink-0 mt-0.5" />
            <p className="text-[10px] text-gray-600 leading-relaxed font-semibold">
              تنبيه الحماية والدقة: عند قيامك بتحديث بيانات أفراد الأسرة التابعين، يرجى الرصد بدقة تامة لضمان ثبات ديموغرافية التعداد وحماية كشوفات الدعم والمساعدات السكنية والغذائية بالقرية.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={async () => {
                alert('جاري المزامنة مع Google Sheets...');
                const payload = {
                  action: 'editFamily',
                  familyName: isNewSurname ? customSurname.trim() : selectedSurname.trim(),
                  breadwinnerName: breadwinnerName.trim(),
                  phone: phone.trim(),
                  neighborhood: neighborhood,
                  residence: residence,
                  housingType: housingType,
                  monthlyIncome: monthlyIncome,
                  supportStatus: supportStatus,
                  notes: notes,
                  members: members.map(m => ({
                    ...m,
                    name: m.name.split(' ')[0] // Ensure strictly FIRST NAME ONLY for dependent
                  }))
                };
                try {
                  await fetch('/api/submit-to-sheets', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                  });
                  alert('تم ترحيل البيانات بنجاح!');
                } catch (e) {
                  alert('حدث خطأ أثناء المزامنة');
                }
              }}
              className="text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              🔄 ترحيل ومزامنة البيانات مع Google Sheets
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-[#E2DED0] text-xs font-semibold text-[#3E4C41] hover:bg-[#F4F1EA] transition-all cursor-pointer bg-white"
              >
                إلغاء التغييرات
              </button>
              <button
                type="submit"
                onClick={() => {
                  const payload = {
                    action: 'editFamily',
                    familyName: isNewSurname ? customSurname.trim() : selectedSurname.trim(),
                    breadwinnerName: breadwinnerName.trim(),
                    phone: phone.trim(),
                    neighborhood: neighborhood,
                    residence: residence,
                    housingType: housingType,
                    monthlyIncome: monthlyIncome,
                    supportStatus: supportStatus,
                    notes: notes,
                    members: members.map(m => ({
                      ...m,
                      name: m.name.split(' ')[0] // Ensure strictly FIRST NAME ONLY for dependent
                    }))
                  };
                  fetch('/api/submit-to-sheets', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                  }).catch(() => {});
                }}
                className="px-5 py-2 rounded-xl bg-[#4A5D4E] hover:bg-[#3E4C41] text-[#FDFBF7] text-xs font-bold shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                حفظ التعديلات السريعة
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
