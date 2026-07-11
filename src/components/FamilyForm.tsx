import React, { useState, useEffect } from 'react';
import { Family, Member, RelationshipType, GenderType, EducationType, HealthStatusType, HousingType, IncomeRangeType, SupportStatusType, parseBreadwinner } from '../types';
import { NEIGHBORHOODS } from '../data/mockData';
import { Plus, Trash2, Save, X, UserPlus, Info, Edit2, ChevronDown, Search, Settings, Sparkles, CheckCircle2 } from 'lucide-react';

interface FamilyFormProps {
  family?: Family | null; // If provided, we are editing; otherwise adding
  initialCoords?: { lat: number; lng: number } | null;
  onSave: (family: Family) => void;
  onCancel: () => void;
  families?: Family[];
  setFamilies?: React.Dispatch<React.SetStateAction<Family[]>>;
  isAddingMemberOnly?: boolean;
}

export default function FamilyForm({ 
  family, 
  initialCoords, 
  onSave, 
  onCancel,
  families = [],
  setFamilies,
  isAddingMemberOnly = false
}: FamilyFormProps) {
  // General details (Family mode)
  const [familyName, setFamilyName] = useState('');
  const [breadwinnerName, setBreadwinnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [neighborhood, setNeighborhood] = useState(NEIGHBORHOODS[0]);
  const [address, setAddress] = useState('');
  const [housingType, setHousingType] = useState<string>('');
  const [residence, setResidence] = useState('دائمة');
  const [monthlyIncome, setMonthlyIncome] = useState<string>('0');
  const [customGovernorates, setCustomGovernorates] = useState<string[]>([]);
  const [supportStatus, setSupportStatus] = useState<SupportStatusType>('تحت الدراسة');
  const [latitude, setLatitude] = useState(50);
  const [longitude, setLongitude] = useState(50);
  const [notes, setNotes] = useState('');

  // Members array
  const [members, setMembers] = useState<Member[]>([]);

  // Member form state
  const [mName, setMName] = useState('');
  const [mRelationship, setMRelationship] = useState<RelationshipType>('ابن');
  const [mGender, setMGender] = useState<GenderType>('ذكر');
  const [mBirthDate, setMBirthDate] = useState('');
  const [mNationalId, setMNationalId] = useState('');
  const [mNeighborhood, setMNeighborhood] = useState('');
  const [mResidence, setMResidence] = useState('');
  const [mPhone, setMPhone] = useState('');
  const [mEducation, setMEducation] = useState<EducationType>('غير محدد');
  const [mOccupation, setMOccupation] = useState('');
  const [mHealthStatus, setMHealthStatus] = useState<HealthStatusType>('سليم');
  const [mNotes, setMNotes] = useState('');
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  // State for choosing existing family
  const [mFamilyId, setMFamilyId] = useState<string>('current');
  const [familySearchQuery, setFamilySearchQuery] = useState('');
  const [isFamilyDropdownOpen, setIsFamilyDropdownOpen] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [isResidenceDropdownOpen, setIsResidenceDropdownOpen] = useState(false);
  const [residenceSearchQuery, setResidenceSearchQuery] = useState('');

  // Helper function to extract a clean breadwinner name without any phone number suffix
  const getCleanBreadwinnerName = (f: Family) => {
    return parseBreadwinner(f.breadwinnerName, f.phone).name;
  };

  // Set default family selection for member-only mode
  useEffect(() => {
    if (isAddingMemberOnly && families.length > 0 && (mFamilyId === 'current' || !mFamilyId)) {
      setMFamilyId(families[0].id);
    }
  }, [isAddingMemberOnly, families, mFamilyId]);

  // Synchronize gender automatically based on unified relationship select
  const handleRelationshipChangeUnified = (val: string) => {
    setMRelationship(val as RelationshipType);
    if (val === 'ابن' || val === 'زوج') {
      setMGender('ذكر');
    } else if (val === 'ابنة' || val === 'زوجة') {
      setMGender('أنثى');
    }
  };

  const isGenderLockedUnified = ['ابن', 'زوج', 'ابنة', 'زوجة'].includes(mRelationship);

  // Dynamic unified neighborhoods list (from Column C of the spreadsheet / families)
  const uniqueNeighborhoods = React.useMemo(() => {
    const fromFamilies = (families || []).map(f => f.neighborhood).filter(Boolean);
    const combined = Array.from(new Set([...NEIGHBORHOODS, ...fromFamilies]));
    return combined.sort((a, b) => a.localeCompare(b, 'ar'));
  }, [families]);

  // Populate data if editing family
  useEffect(() => {
    if (family) {
      setFamilyName(family.familyName);
      const parsed = parseBreadwinner(family.breadwinnerName, family.phone);
      setBreadwinnerName(parsed.name);
      setPhone(parsed.phone);
      setNeighborhood(family.neighborhood);
      setAddress(family.address);
      setHousingType(family.housingType);
      setResidence(family.residence || 'دائمة');
      setMonthlyIncome(family.monthlyIncome || '0');
      setSupportStatus(family.supportStatus);
      setLatitude(family.latitude);
      setLongitude(family.longitude);
      setNotes(family.notes || '');
      setMembers(family.members);
    } else {
      // Clear or set default
      setFamilyName('');
      setBreadwinnerName('');
      setPhone('');
      setNeighborhood(NEIGHBORHOODS[0]);
      setAddress('');
      setHousingType('');
      setResidence('دائمة');
      setMonthlyIncome('0');
      setSupportStatus('تحت الدراسة');
      setNotes('');
      setMembers([]);
      if (initialCoords) {
        setLatitude(initialCoords.lat);
        setLongitude(initialCoords.lng);
      } else {
        setLatitude(Math.floor(Math.random() * 60) + 20);
        setLongitude(Math.floor(Math.random() * 60) + 20);
      }
    }
  }, [family, initialCoords]);

  // Handle saving family mode (CORS-free sheets POST submit proxy for Web App)
  const submitToGoogleSheets = async (payload: any) => {
    try {
      const res = await fetch('/api/submit-to-sheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const result = await res.json();
        console.log('Successfully synced to Google Sheets Web App:', result);
      } else {
        console.error('Failed to sync to Google Sheets Web App, status:', res.status);
      }
    } catch (error) {
      console.error('Network error during Google Sheets Web App sync:', error);
    }
  };

  // 1. Submit Handler for unified Member Only Mode (With real-time sheet sync)
  const handleMemberSubmitUnified = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mName.trim()) {
      alert('الرجاء إدخال اسم الفرد');
      return;
    }

    if (mName.trim().includes(' ') || mName.trim().split(/\s+/).length > 1) {
      alert('خطأ: اسم الفرد يجب أن يتكون من اسم واحد فقط بدون مسافات أو فراغات!');
      return;
    }

    const selectedFamilyObj = families.find(f => f.id === mFamilyId);
    if (!selectedFamilyObj) {
      alert('الرجاء اختيار رب الأسرة المرتبط');
      return;
    }

    // Build values according to Google Sheets columns structure
    const cleanBwrName = parseBreadwinner(selectedFamilyObj.breadwinnerName, selectedFamilyObj.phone).name;
    const colA = mPhone.trim() ? `${mName.trim()} (${mPhone.trim()})` : mName.trim();
    const colB = selectedFamilyObj.familyName;
    const colC = selectedFamilyObj.neighborhood;

    // Standardize relationship text
    const relText = mRelationship;

    const colD = `${relText} لـ ${cleanBwrName}`;
    const colE = mPhone.trim();
    const colG = mResidence.trim() || selectedFamilyObj.residence || 'دائمة';

    const payload = {
      isMember: true,
      type: 'member',
      columnA: colA,
      columnB: colB,
      columnC: colC,
      columnD: colD,
      columnE: colE,
      columnG: colG,
      relationshipInfo: colD,
      memberName: mName.trim(),
      relationship: mRelationship,
      associatedFamilyName: selectedFamilyObj.familyName,
      associatedBreadwinnerName: cleanBwrName,
      phone: mPhone.trim(),
      residence: colG,
      action: editingMemberId ? 'editMember' : 'addMember',
      targetUrl: 'https://script.google.com/macros/s/AKfycbzEExX96ybPtLaPq67eRzXlnOz2CAziYmU6I1w9B57cKhRPzRkAhZmYPEOX2NMrtecccQ/exec'
    };

    try {
      // Direct POST call to Apps Script with mode: no-cors
      await fetch('https://script.google.com/macros/s/AKfycbzEExX96ybPtLaPq67eRzXlnOz2CAziYmU6I1w9B57cKhRPzRkAhZmYPEOX2NMrtecccQ/exec', {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      console.log('Member successfully sent to Apps Script');
    } catch (err) {
      console.error('Error in direct Apps Script submit:', err);
    }

    // Update locally in memory
    const newMember: Member = {
      id: editingMemberId || `mem-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: colA,
      relationship: mRelationship,
      gender: mGender,
      age: 30,
      birthDate: mBirthDate || undefined,
      neighborhood: selectedFamilyObj.neighborhood,
      residence: colG,
      phone: mPhone.trim() || undefined,
      education: 'غير محدد',
      occupation: 'غير محدد',
      healthStatus: 'سليم'
    };

    const updatedFamily: Family = {
      ...selectedFamilyObj,
      members: editingMemberId
        ? selectedFamilyObj.members.map(m => m.id === editingMemberId ? newMember : m)
        : [...selectedFamilyObj.members, newMember]
    };

    if (setFamilies) {
      setFamilies(families.map(f => f.id === updatedFamily.id ? updatedFamily : f));
    }

    // Show success notification and update preview
    setShowSuccessNotification(true);
    alert('تم الحفظ والترحيل بنجاح لجدول البيانات الموحد');
    onSave(updatedFamily);
  };

  // Standard Member adding logic inside family editing form
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mName) return;

    if (mName.trim().includes(' ') || mName.trim().split(/\s+/).length > 1) {
      alert('خطأ: اسم التابع يجب أن يكون اسم واحد فقط بدون مسافات أو فراغات!');
      return;
    }

    let calculatedAge = 0;
    if (mBirthDate) {
      const birthYear = new Date(mBirthDate).getFullYear();
      const currentYear = new Date().getFullYear();
      calculatedAge = Math.max(0, currentYear - birthYear);
    }

    const targetFamilyName = mFamilyId === 'current' ? familyName : (families.find(f => f.id === mFamilyId)?.familyName || '');
    const targetNeighborhood = mFamilyId === 'current' ? neighborhood : (families.find(f => f.id === mFamilyId)?.neighborhood || '');
    const targetResidence = mFamilyId === 'current' ? residence : (families.find(f => f.id === mFamilyId)?.residence || 'دائمة');

    const finalMemberName = targetFamilyName 
      ? (mName.trim().endsWith(targetFamilyName) ? mName.trim() : `${mName.trim()} ${targetFamilyName}`) 
      : mName.trim();

    if (mFamilyId === 'current') {
      if (editingMemberId) {
        setMembers(members.map(m => {
          if (m.id === editingMemberId) {
            return {
              ...m,
              name: finalMemberName,
              relationship: mRelationship,
              gender: mGender,
              age: calculatedAge,
              birthDate: mBirthDate || undefined,
              nationalId: mNationalId || undefined,
              neighborhood: targetNeighborhood,
              residence: targetResidence,
              phone: mPhone || undefined,
              education: mEducation,
              occupation: mOccupation || 'غير محدد',
              healthStatus: mHealthStatus,
              notes: mNotes || undefined
            };
          }
          return m;
        }));
        setEditingMemberId(null);
      } else {
        const newMember: Member = {
          id: `mem-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          name: finalMemberName,
          relationship: mRelationship,
          gender: mGender,
          age: calculatedAge,
          birthDate: mBirthDate || undefined,
          nationalId: mNationalId || undefined,
          neighborhood: targetNeighborhood,
          residence: targetResidence,
          phone: mPhone || undefined,
          education: mEducation,
          occupation: mOccupation || 'غير محدد',
          healthStatus: mHealthStatus,
          notes: mNotes || undefined
        };
        setMembers([...members, newMember]);
      }
      
      if (mRelationship === 'عائل') {
        setBreadwinnerName(finalMemberName);
      }
    } else {
      const targetFamily = families.find(f => f.id === mFamilyId);
      if (targetFamily && setFamilies) {
        const newMember: Member = {
          id: editingMemberId || `mem-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          name: finalMemberName,
          relationship: mRelationship,
          gender: mGender,
          age: calculatedAge,
          birthDate: mBirthDate || undefined,
          nationalId: mNationalId || undefined,
          neighborhood: targetNeighborhood,
          residence: targetResidence,
          phone: mPhone || undefined,
          education: mEducation,
          occupation: mOccupation || 'غير محدد',
          healthStatus: mHealthStatus,
          notes: mNotes || undefined
        };

        if (editingMemberId) {
          setMembers(members.filter(m => m.id !== editingMemberId));
          setEditingMemberId(null);
        } else {
          const cleanBwrName = parseBreadwinner(targetFamily.breadwinnerName, targetFamily.phone).name;
          const colA = mPhone.trim() ? `${mName.trim()} (${mPhone.trim()})` : mName.trim();
          const colB = targetFamilyName;
          const colC = targetNeighborhood;
          const colD = `${mRelationship} لـ ${cleanBwrName}`;
          const colE = mPhone.trim() || '';
          const colG = mResidence.trim() || targetResidence;

          const payload = {
            isMember: true,
            type: 'member',
            columnA: colA,
            columnB: colB,
            columnC: colC,
            columnD: colD,
            columnE: colE,
            columnG: colG,
            relationshipInfo: `${mRelationship} لـ ${cleanBwrName}`,
            memberName: mName.trim(),
            relationship: mRelationship,
            associatedFamilyName: targetFamilyName,
            associatedBreadwinnerName: cleanBwrName,
            phone: mPhone.trim() || '',
            residence: mResidence.trim() || targetResidence,
            action: 'addMember',
            targetUrl: 'https://script.google.com/macros/s/AKfycbzEExX96ybPtLaPq67eRzXlnOz2CAziYmU6I1w9B57cKhRPzRkAhZmYPEOX2NMrtecccQ/exec'
          };
          submitToGoogleSheets(payload);
        }

        const updatedFamilies = families.map(f => {
          if (f.id === mFamilyId) {
            const exists = f.members.some(m => m.id === newMember.id);
            return {
              ...f,
              members: exists
                ? f.members.map(m => m.id === newMember.id ? newMember : m)
                : [...f.members, newMember]
            };
          }
          return f;
        });
        setFamilies(updatedFamilies);
        alert(`تم إدراج وحفظ الفرد "${finalMemberName}" في عائلة ${targetFamily.familyName} بنجاح!`);
      }
    }

    // Reset member inputs
    setMName('');
    setMNationalId('');
    setMBirthDate('');
    setMNeighborhood('');
    setMResidence('');
    setMPhone('');
    setMRelationship('ابن');
    setMGender('ذكر');
    setMEducation('غير محدد');
    setMOccupation('');
    setMHealthStatus('سليم');
    setMNotes('');
    setMFamilyId('current');
  };

  const handleEditMember = (m: Member) => {
    setEditingMemberId(m.id);

    const targetFamilyName = mFamilyId === 'current' 
      ? familyName 
      : (families.find(f => f.id === mFamilyId)?.familyName || '');

    let firstName = m.name;
    if (targetFamilyName && firstName.endsWith(targetFamilyName)) {
      firstName = firstName.slice(0, -targetFamilyName.length).trim();
    }

    // Strip phone brackets from name if present
    if (firstName.includes('(')) {
      firstName = firstName.split('(')[0].trim();
    }

    setMName(firstName);
    setMNationalId(m.nationalId || '');
    setMRelationship(m.relationship);
    setMGender(m.gender);
    setMBirthDate(m.birthDate || '');
    setMNeighborhood(m.neighborhood || '');
    setMResidence(m.residence || '');
    setMPhone(m.phone || '');
    setMEducation(m.education);
    setMOccupation(m.occupation);
    setMHealthStatus(m.healthStatus);
    setMNotes(m.notes || '');
  };

  const handleCancelEditMember = () => {
    setEditingMemberId(null);
    setMName('');
    setMNationalId('');
    setMBirthDate('');
    setMNeighborhood('');
    setMResidence('');
    setMPhone('');
    setMRelationship('ابن');
    setMGender('ذكر');
    setMEducation('غير محدد');
    setMOccupation('');
    setMHealthStatus('سليم');
    setMNotes('');
    setMFamilyId('current');
  };

  const handleRemoveMember = (id: string) => {
    setMembers(members.filter(m => m.id !== id));
    if (editingMemberId === id) {
      setEditingMemberId(null);
    }
  };

  const handleAutoCreateBreadwinner = () => {
    if (!breadwinnerName || members.some(m => m.relationship === 'عائل')) return;
    const bwr: Member = {
      id: `mem-bwr-${Date.now()}`,
      name: breadwinnerName,
      relationship: 'عائل',
      gender: 'ذكر',
      age: 40,
      birthDate: `${new Date().getFullYear() - 40}-01-01`,
      neighborhood: neighborhood,
      education: 'غير محدد',
      occupation: 'موظف',
      healthStatus: 'سليم'
    };
    setMembers([bwr, ...members]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyName || !breadwinnerName) {
      alert('الرجاء إدخال اللقب واسم رب الأسرة');
      return;
    }

    const mergedBreadwinnerName = phone.trim() ? `${breadwinnerName.trim()} (${phone.trim()})` : breadwinnerName.trim();

    const savedFamily: Family = {
      id: family?.id || `fam-${Date.now()}`,
      familyName,
      breadwinnerName: mergedBreadwinnerName,
      phone,
      neighborhood,
      address,
      housingType,
      residence,
      monthlyIncome,
      supportStatus,
      members,
      registeredAt: family?.registeredAt || new Date().toISOString().split('T')[0],
      latitude,
      longitude,
      notes: notes || undefined
    };

    if (!family) {
      const colA = phone.trim() ? `${breadwinnerName.trim()} (${phone.trim()})` : breadwinnerName.trim();
      const colB = familyName;
      const colC = neighborhood;
      const colD = 'رئيس عائلة';
      const colE = phone;
      const colG = residence;

      const payload = {
        isMember: false,
        type: 'family',
        columnA: colA,
        columnB: colB,
        columnC: colC,
        columnD: colD,
        columnE: colE,
        columnG: colG,
        familyName,
        breadwinnerName,
        phone,
        neighborhood,
        residence,
        action: 'addFamily',
        targetUrl: 'https://script.google.com/macros/s/AKfycbzEExX96ybPtLaPq67eRzXlnOz2CAziYmU6I1w9B57cKhRPzRkAhZmYPEOX2NMrtecccQ/exec'
      };
      submitToGoogleSheets(payload);
    }

    onSave(savedFamily);
  };

  // Pre-filter families based on name, breadwinnerName, or ID
  const filteredFamiliesForDropdown = families.filter(f => {
    const q = familySearchQuery.toLowerCase();
    return (
      f.familyName.toLowerCase().includes(q) ||
      f.breadwinnerName.toLowerCase().includes(q) ||
      f.id.toLowerCase().includes(q)
    );
  });

  const selectedFamilyObj = families.find(f => f.id === mFamilyId);
  const targetFamilyName = selectedFamilyObj?.familyName || '';
  const targetNeighborhood = selectedFamilyObj?.neighborhood || '';
  const targetSupportStatus = selectedFamilyObj?.supportStatus || 'تحت الدراسة';
  const targetMembersCount = selectedFamilyObj?.members?.length || 0;

  // Render the Clean, Unified Individual Member Form (isAddingMemberOnly = true)
  if (isAddingMemberOnly) {
    return (
      <div className="bg-[#FAF9F5] rounded-3xl border border-[#E2DED0] shadow-sm p-6 max-w-2xl mx-auto font-sans text-right" id="member-only-form-card" dir="rtl">
        
        {/* Success Banner Notification */}
        {showSuccessNotification && (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-2xl flex items-center gap-2 text-xs font-bold animate-pulse">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>تم الحفظ والترحيل بنجاح لجدول البيانات الموحد</span>
          </div>
        )}

        <div className="flex justify-between items-center border-b border-[#E2DED0] pb-4 mb-5">
          <div>
            <h3 className="text-base font-extrabold text-[#2D3A30] flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#4A5D4E]" />
              {editingMemberId ? 'تعديل بيانات الفرد الحالي' : 'إضافة فرد جديد وتثبيته'}
            </h3>
            <p className="text-xs text-[#7A8B7E] mt-1">
              أدخل بيانات الفرد لترحيلها فورياً كسطر مستقل في جدول البيانات الموحد.
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg text-[#7A8B7E] hover:text-[#2D3A30] hover:bg-[#F4F1EA] transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleMemberSubmitUnified} className="space-y-5">
          
          <div className="bg-white p-5 rounded-2xl border border-[#E2DED0] space-y-4 shadow-2xs">
            <h4 className="text-xs font-bold text-[#4A5D4E] flex items-center gap-1.5 border-b border-[#F4F1EA] pb-2">
              <Sparkles className="w-4 h-4 text-[#4A5D4E]" />
              <span>أولاً: البيانات الفردية الأساسية للفرد</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* 1. الاسم الأول للفرد */}
              <div>
                <label className="block text-xs text-[#3E4C41] mb-1.5 font-bold">الاسم الأول للفرد <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={mName}
                  onChange={(e) => setMName(e.target.value)}
                  placeholder="الاسم الأول فقط للفرد"
                  className={`w-full px-3.5 py-2 rounded-xl border text-xs font-medium outline-none transition-all ${
                    mName.trim() && (mName.includes(' ') || mName.trim().split(/\s+/).length > 1)
                      ? 'border-red-500 bg-red-50 text-red-900 focus:ring-2 focus:ring-red-200'
                      : 'border-[#E2DED0] bg-[#FDFBF7] text-[#2D3A30] focus:ring-2 focus:ring-[#4A5D4E]/15 focus:bg-white'
                  }`}
                  required
                />
                {mName.trim() && (mName.includes(' ') || mName.trim().split(/\s+/).length > 1) && (
                  <p className="text-[10px] text-red-600 font-bold mt-1">
                    ⚠️ خطأ: يجب إدخال اسم واحد فقط بدون أي مسافات!
                  </p>
                )}
              </div>

              {/* 1.1 الرقم الوطني */}
              <div>
                <label className="block text-xs text-[#3E4C41] mb-1.5 font-bold">الرقم الوطني (اختياري)</label>
                <input
                  type="text"
                  value={mNationalId}
                  onChange={(e) => setMNationalId(e.target.value)}
                  placeholder="مثال: 123456789012"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E2DED0] text-xs bg-[#FDFBF7] text-[#2D3A30] font-medium focus:ring-2 focus:ring-[#4A5D4E]/15 focus:bg-white outline-none transition-all"
                />
              </div>

              {/* 2. رب الأسرة المرتبط (منسدلة ذكية بالاسم والكود) */}
              <div className="relative">
                <label className="block text-xs text-[#3E4C41] mb-1.5 font-bold">رب الأسرة المرتبط (السجل) <span className="text-red-500">*</span></label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsFamilyDropdownOpen(!isFamilyDropdownOpen)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E2DED0] text-xs bg-[#FDFBF7] text-[#2D3A30] text-right flex justify-between items-center cursor-pointer min-h-[38px] font-medium focus:ring-2 focus:ring-[#4A5D4E]/15"
                  >
                    <span className="truncate max-w-[240px]">
                      {selectedFamilyObj 
                        ? `${getCleanBreadwinnerName(selectedFamilyObj)}`
                        : 'اختر رب الأسرة المرتبط...'
                      }
                    </span>
                    <ChevronDown className="w-4 h-4 text-[#7A8B7E] flex-shrink-0" />
                  </button>

                  {isFamilyDropdownOpen && (
                    <div className="absolute z-50 mt-1 w-full bg-white border border-[#E2DED0] rounded-xl shadow-lg p-2.5 space-y-2 max-h-56 overflow-y-auto right-0">
                      <div className="relative">
                        <input
                          type="text"
                          value={familySearchQuery}
                          onChange={(e) => setFamilySearchQuery(e.target.value)}
                          placeholder="ابحث باللقب، اسم رب الأسرة أو الكود..."
                          className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[#E2DED0] text-xs bg-white text-[#2D3A30] outline-none font-medium"
                        />
                        <Search className="w-3.5 h-3.5 text-[#7A8B7E] absolute left-2.5 top-2" />
                      </div>
                      <div className="divide-y divide-[#F4F1EA] max-h-36 overflow-y-auto">
                        {filteredFamiliesForDropdown.length > 0 ? (
                          filteredFamiliesForDropdown.map(f => (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => {
                                setMFamilyId(f.id);
                                setIsFamilyDropdownOpen(false);
                                setFamilySearchQuery('');
                              }}
                              className={`w-full text-right px-2.5 py-2.5 text-xs hover:bg-[#F4F1EA] rounded-lg transition-all flex items-center justify-between cursor-pointer ${
                                mFamilyId === f.id ? 'bg-[#E9F0E0] text-[#4A5D4E] font-bold' : 'text-[#3E4C41]'
                              }`}
                            >
                              <span className="truncate">{getCleanBreadwinnerName(f)} <span className="text-[10px] text-gray-400 font-mono">[{f.id}]</span></span>
                            </button>
                          ))
                        ) : (
                          <div className="p-2.5 text-xs text-center text-gray-400">لا توجد عائلات متطابقة مع البحث</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. العلاقة برب الأسرة */}
              <div>
                <label className="block text-xs text-[#3E4C41] mb-1.5 font-bold">العلاقة برب الأسرة <span className="text-red-500">*</span></label>
                <select
                  value={mRelationship}
                  onChange={(e) => handleRelationshipChangeUnified(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E2DED0] text-xs bg-[#FDFBF7] text-[#2D3A30] font-medium outline-none focus:ring-2 focus:ring-[#4A5D4E]/15 focus:bg-white transition-all"
                  required
                >
                  <option value="ابن">ابن</option>
                  <option value="ابنة">ابنة</option>
                  <option value="زوج">زوج</option>
                  <option value="زوجة">زوجة</option>
                  <option value="آخر">أخرى</option>
                </select>
              </div>

              {/* 4. الجنس (مغلق وتلقائي للابن والابنة) */}
              <div>
                <label className="block text-xs text-[#3E4C41] mb-1.5 font-bold">الجنس (الحالة البيلوجية)</label>
                <div className="flex gap-2 p-2 rounded-xl text-xs justify-around border bg-gray-100 border-gray-200 text-gray-500 font-medium">
                  <span className={mGender === 'ذكر' ? 'text-[#4A5D4E] font-bold' : 'opacity-40'}>ذكر</span>
                  <span className="text-gray-300">|</span>
                  <span className={mGender === 'أنثى' ? 'text-[#4A5D4E] font-bold' : 'opacity-40'}>أنثى</span>
                </div>
                {isGenderLockedUnified && (
                  <span className="text-[10px] text-emerald-700 block mt-1 font-bold">
                    ✓ مغلق تلقائياً بناءً على صلة القرابة المختارة
                  </span>
                )}
              </div>

              {/* 5. الإقامة المستقلة */}
              <div className="relative">
                <label className="block text-xs text-[#3E4C41] mb-1.5 font-bold">إقامة الفرد الحالية المستقلة <span className="text-red-500">*</span></label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsResidenceDropdownOpen(!isResidenceDropdownOpen)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E2DED0] text-xs bg-[#FDFBF7] text-[#2D3A30] text-right flex justify-between items-center cursor-pointer min-h-[38px] font-medium focus:ring-2 focus:ring-[#4A5D4E]/15"
                  >
                    <span className="truncate max-w-[240px]">
                      {mResidence || 'اختر الإقامة للفرد...'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-[#7A8B7E] flex-shrink-0" />
                  </button>

                  {isResidenceDropdownOpen && (
                    <div className="absolute z-50 mt-1 w-full bg-white border border-[#E2DED0] rounded-xl shadow-lg p-2.5 space-y-2 max-h-64 overflow-y-auto right-0">
                      <div className="relative">
                        <input
                          type="text"
                          value={residenceSearchQuery}
                          onChange={(e) => setResidenceSearchQuery(e.target.value)}
                          placeholder="ابحث عن محلة أو محافظة..."
                          className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[#E2DED0] text-xs bg-white text-[#2D3A30] outline-none font-medium"
                          autoFocus
                        />
                        <Search className="w-3.5 h-3.5 text-[#7A8B7E] absolute left-2.5 top-2" />
                      </div>
                      <div className="divide-y divide-[#F4F1EA] max-h-48 overflow-y-auto">
                        {/* Group: Local Neighborhoods */}
                        {uniqueNeighborhoods.filter(n => n.toLowerCase().includes(residenceSearchQuery.toLowerCase())).length > 0 && (
                          <div className="py-1">
                            <span className="block text-[10px] text-gray-400 font-bold px-2 py-1">المحلات المسجلة (المحلية)</span>
                            {uniqueNeighborhoods
                              .filter(n => n.toLowerCase().includes(residenceSearchQuery.toLowerCase()))
                              .map(n => (
                                <button
                                  key={n}
                                  type="button"
                                  onClick={() => {
                                    setMResidence(n);
                                    setIsResidenceDropdownOpen(false);
                                    setResidenceSearchQuery('');
                                  }}
                                  className={`w-full text-right px-2.5 py-1.5 text-xs hover:bg-[#F4F1EA] rounded-lg transition-all flex items-center justify-between cursor-pointer ${
                                    mResidence === n ? 'bg-[#E9F0E0] text-[#4A5D4E] font-bold' : 'text-[#3E4C41]'
                                  }`}
                                >
                                  <span>{n}</span>
                                </button>
                              ))
                            }
                          </div>
                        )}

                        {/* Group: Yemen Governorates */}
                        {(() => {
                          const govs = [
                            'صنعاء', 'تعز', 'عدن', 'الحديدة', 'إب', 'حضرموت', 'ذمار', 'مأرب', 'حجة', 
                            'البيضاء', 'شبوة', 'صعدة', 'الضالع', 'لحج', 'أبين', 'الجوف', 'عمران', 
                            'المحويت', 'ريمة', 'المهرة', 'سقطرى', ...customGovernorates
                          ].filter(g => g.toLowerCase().includes(residenceSearchQuery.toLowerCase()));

                          if (govs.length > 0) {
                            return (
                              <div className="py-1">
                                <span className="block text-[10px] text-gray-400 font-bold px-2 py-1">المحافظات اليمنية</span>
                                {govs.map(gov => (
                                  <button
                                    key={gov}
                                    type="button"
                                    onClick={() => {
                                      setMResidence(gov);
                                      setIsResidenceDropdownOpen(false);
                                      setResidenceSearchQuery('');
                                    }}
                                    className={`w-full text-right px-2.5 py-1.5 text-xs hover:bg-[#F4F1EA] rounded-lg transition-all flex items-center justify-between cursor-pointer ${
                                      mResidence === gov ? 'bg-[#E9F0E0] text-[#4A5D4E] font-bold' : 'text-[#3E4C41]'
                                    }`}
                                  >
                                    <span>{gov}</span>
                                  </button>
                                ))}
                              </div>
                            );
                          }
                          return null;
                        })()}

                        <button
                          type="button"
                          onClick={() => {
                            const newGov = prompt('الرجاء إدخال اسم المحافظة اليمنية الجديدة:');
                            if (newGov && newGov.trim() !== '') {
                              const trimmed = newGov.trim();
                              setCustomGovernorates(prev => [...prev, trimmed]);
                              setMResidence(trimmed);
                              setIsResidenceDropdownOpen(false);
                              setResidenceSearchQuery('');
                            }
                          }}
                          className="w-full text-right px-2.5 py-2 text-xs text-emerald-700 font-bold hover:bg-[#F4F1EA] rounded-lg transition-all cursor-pointer flex items-center gap-1"
                        >
                          <span>+ إضافة محافظة يمنية جديدة...</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 6. رقم هاتف الفرد */}
              <div>
                <label className="block text-xs text-[#3E4C41] mb-1.5 font-bold">رقم هاتف الفرد (اختياري)</label>
                <input
                  type="tel"
                  value={mPhone}
                  onChange={(e) => setMPhone(e.target.value)}
                  placeholder="مثال: 777123456"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E2DED0] text-xs bg-[#FDFBF7] text-[#2D3A30] font-medium focus:ring-2 focus:ring-[#4A5D4E]/15 focus:bg-white outline-none transition-all"
                />
              </div>

            </div>
          </div>

          {/* لوحة المعلومات التفاعلية الذكية للقراءة فقط للأسرة المرتبطة */}
          <div className="bg-[#F3F0E8] p-4 rounded-2xl border border-[#E2DED0] space-y-2.5 shadow-3xs">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#4A5D4E] border-b border-[#E2DED0]/50 pb-1.5">
              <Info className="w-4 h-4" />
              <span>ثانياً: مطابقة السجلات المسبقة للأسرة المرتبطة (معلومات القراءة والتأكيد البصري)</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-sans">
              <div className="bg-white p-2.5 rounded-xl border border-[#E2DED0]/50 flex flex-col justify-center shadow-3xs">
                <span className="text-[10px] text-[#7A8B7E] font-bold mb-0.5">اسم العائلة / اللقب</span>
                <span className="font-extrabold text-[#2D3A30] truncate">{targetFamilyName || 'غير متوفر'}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-[#E2DED0]/50 flex flex-col justify-center shadow-3xs">
                <span className="text-[10px] text-[#7A8B7E] font-bold mb-0.5">كود الأسرة (ID)</span>
                <span className="font-bold text-[#4A5D4E] font-mono truncate">{mFamilyId || 'غير متوفر'}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-[#E2DED0]/50 flex flex-col justify-center shadow-3xs">
                <span className="text-[10px] text-[#7A8B7E] font-bold mb-0.5">محلة العائلة الموحدة</span>
                <span className="font-extrabold text-[#2D3A30] truncate">{targetNeighborhood || 'غير متوفر'}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-[#E2DED0]/50 flex flex-col justify-center shadow-3xs">
                <span className="text-[10px] text-[#7A8B7E] font-bold mb-0.5">إجمالي الأفراد المقيدين</span>
                <span className="font-bold text-emerald-700">{targetMembersCount} فرد</span>
              </div>
            </div>
          </div>

          {/* Unified Buttons controls */}
          <div className="flex justify-end gap-3 border-t border-[#E2DED0] pt-4 mt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-xl border border-[#E2DED0] text-xs font-bold text-[#3E4C41] hover:bg-[#FDFBF7] transition-all cursor-pointer"
            >
              إلغاء وتراجع
            </button>
            <button
              type="submit"
              disabled={!mName}
              className={`px-6 py-2.5 rounded-xl text-xs font-extrabold shadow-md flex items-center gap-1.5 transition-all cursor-pointer ${
                editingMemberId 
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              } ${!mName ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {editingMemberId ? (
                <>
                  <Save className="w-4 h-4" />
                  <span>تحديث وحفظ التعديلات</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>إضافة وتثبيت الفرد</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    );
  }

  // Render the Standard Family Form (isAddingMemberOnly = false)
  return (
    <div className="bg-white rounded-3xl border border-[#E2DED0] shadow-sm p-6 max-w-4xl mx-auto font-sans" id="family-form-card" dir="rtl">
      <div className="flex justify-between items-center border-b border-[#E2DED0] pb-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-[#2D3A30]">
            {family ? `تعديل سجل: ${familyName}` : 'تسجيل عائلة جديدة في النظام'}
          </h3>
          <p className="text-xs text-[#7A8B7E] mt-0.5">
            الرجاء تعبئة بيانات الأسرة ومكوناتها بدقة لضمان دقة إحصاء السكان والخدمات.
          </p>
        </div>
        <button
          onClick={onCancel}
          className="p-1.5 rounded-lg text-[#7A8B7E] hover:text-[#2D3A30] hover:bg-[#F4F1EA] transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form 
        onSubmit={handleSubmit} 
        className="space-y-6 animate-fadeIn"
      >
        {/* Step 1: General Family Info */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-[#4A5D4E] uppercase tracking-wider flex items-center gap-2 border-b border-[#E2DED0] pb-1.5">
            <span>١. بيانات الأسرة الأساسية</span>
          </h4>
        
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#3E4C41] mb-1">اللقب <span className="text-red-500">*</span></label>
              <select
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E2DED0] text-xs bg-white text-[#2D3A30] focus:ring-2 focus:ring-[#4A5D4E]/20 focus:border-[#4A5D4E] transition-all outline-none"
                required
              >
                <option value="">اختر اللقب...</option>
                {['الخطيب', 'الغرافي', 'المجيدي', 'الجعفري', 'بدون لقب'].map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
                {familyName && !['الخطيب', 'الغرافي', 'المجيدي', 'الجعفري', 'بدون لقب'].includes(familyName) && (
                  <option value={familyName}>{familyName}</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3E4C41] mb-1">اسم رب الأسرة <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={breadwinnerName}
                onChange={(e) => setBreadwinnerName(e.target.value)}
                onBlur={handleAutoCreateBreadwinner}
                placeholder="مثال: أحمد محمود عبد الله"
                className="w-full px-3 py-2 rounded-xl border border-[#E2DED0] text-xs bg-white text-[#2D3A30] focus:ring-2 focus:ring-[#4A5D4E]/20 focus:border-[#4A5D4E] transition-all outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3E4C41] mb-1">رقم هاتف التواصل</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="مثال: 050XXXXXXX"
                className="w-full px-3 py-2 rounded-xl border border-[#E2DED0] text-xs bg-white text-[#2D3A30] focus:ring-2 focus:ring-[#4A5D4E]/20 focus:border-[#4A5D4E] transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3E4C41] mb-1">المحلة <span className="text-red-500">*</span></label>
              <select
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E2DED0] text-xs bg-white text-[#2D3A30] focus:ring-2 focus:ring-[#4A5D4E]/20 focus:border-[#4A5D4E] transition-all outline-none"
                required
              >
                <option value="">اختر المحلة...</option>
                {uniqueNeighborhoods.map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[#3E4C41] mb-1">العنوان التفصيلي</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="اسم الشارع، رقم المبنى، المعالم البارزة"
                className="w-full px-3 py-2 rounded-xl border border-[#E2DED0] text-xs bg-white text-[#2D3A30] focus:ring-2 focus:ring-[#4A5D4E]/20 focus:border-[#4A5D4E] transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3E4C41] mb-1">الإقامة <span className="text-red-500">*</span></label>
              <select
                value={residence}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '__ADD_NEW__') {
                    const newGov = prompt('الرجاء إدخال اسم المحافظة اليمنية الجديدة:');
                    if (newGov && newGov.trim() !== '') {
                      const trimmed = newGov.trim();
                      setCustomGovernorates(prev => [...prev, trimmed]);
                      setResidence(trimmed);
                    }
                  } else {
                    setResidence(val);
                  }
                }}
                className="w-full px-3 py-2 rounded-xl border border-[#E2DED0] text-xs bg-white text-[#2D3A30] focus:ring-2 focus:ring-[#4A5D4E]/20 focus:border-[#4A5D4E] transition-all outline-none"
                required
              >
                <option value="">اختر الإقامة / المحل...</option>
                <optgroup label="المحلات المسجلة (المحلية)">
                  {uniqueNeighborhoods.map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </optgroup>
                <optgroup label="المحافظات اليمنية">
                  {['صنعاء', 'تعز', 'عدن', 'الحديدة', 'إب', 'حضرموت', 'ذمار', 'مأرب', 'حجة', 'البيضاء', 'شبوة', 'صعدة', 'الضالع', 'لحج', 'أبين', 'الجوف', 'عمران', 'المحويت', 'ريمة', 'المهرة', 'سقطرى'].map(gov => (
                    <option key={gov} value={gov}>{gov}</option>
                  ))}
                  {customGovernorates.map(gov => (
                    <option key={gov} value={gov}>{gov}</option>
                  ))}
                </optgroup>
                <option value="__ADD_NEW__" className="text-emerald-700 font-bold">+ إضافة محافظة يمنية جديدة...</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3E4C41] mb-1">فئة الدخل الشهري (اختياري)</label>
              <input
                type="text"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                placeholder="اكتب فئة الدخل الشهري بحرية..."
                className="w-full px-3 py-2 rounded-xl border border-[#E2DED0] text-xs bg-white text-[#2D3A30] focus:ring-2 focus:ring-[#4A5D4E]/20 focus:border-[#4A5D4E] transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3E4C41] mb-1">حالة الاستحقاق الاجتماعي</label>
              <select
                value={supportStatus}
                onChange={(e) => setSupportStatus(e.target.value as SupportStatusType)}
                className="w-full px-3 py-2 rounded-xl border border-[#E2DED0] text-xs bg-white text-[#2D3A30] focus:ring-2 focus:ring-[#4A5D4E]/20 focus:border-[#4A5D4E] transition-all outline-none"
              >
                <option value="مستحق للدعم">مستحق للدعم (مسجل/ضمان)</option>
                <option value="تحت الدراسة">تحت الدراسة والبحث الاجتماعي</option>
                <option value="غير مستحق / مكتفي">غير مستحق / مكتفي ذاتياً</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3E4C41] mb-1">إحداثيات الخريطة (عرض/طول)</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={latitude}
                  onChange={(e) => setLatitude(Number(e.target.value))}
                  min="0"
                  max="100"
                  placeholder="عرض"
                  className="w-full px-2 py-1.5 rounded-lg border border-[#E2DED0] text-center text-xs bg-white text-[#2D3A30]"
                />
                <input
                  type="number"
                  value={longitude}
                  onChange={(e) => setLongitude(Number(e.target.value))}
                  min="0"
                  max="100"
                  placeholder="طول"
                  className="w-full px-2 py-1.5 rounded-lg border border-[#E2DED0] text-center text-xs bg-white text-[#2D3A30]"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[#3E4C41] mb-1">ملاحظات وطلبات الأسرة</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="احتياجات علاجية، تجهيزات منزلية، وضع المعيشة"
                className="w-full px-3 py-2 rounded-xl border border-[#E2DED0] text-xs bg-white text-[#2D3A30] focus:ring-2 focus:ring-[#4A5D4E]/20 focus:border-[#4A5D4E] transition-all outline-none"
              />
            </div>
          </div>
        </div>

        {/* Step 2: Add Members Section */}
        <div className="space-y-4 pt-2">
          <h4 className="text-xs font-bold text-[#4A5D4E] uppercase tracking-wider flex items-center gap-2 border-b border-[#E2DED0] pb-1.5">
            <span>٢. إدارة أفراد العائلة ({members.length})</span>
          </h4>

          {/* Member input fields */}
          <div className="bg-[#F4F1EA] p-5 rounded-2xl border border-[#E2DED0] space-y-3">
            <div className="text-xs font-bold text-[#2D3A30] flex items-center gap-1.5 mb-1 justify-between">
              <div className="flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-[#4A5D4E]" />
                <span>
                  {editingMemberId ? 'تعديل بيانات الفرد الحالي' : 'إضافة فرد جديد للأسرة'}
                </span>
              </div>
              {editingMemberId && (
                <span className="bg-[#DDE5B6] text-[#4A5D4E] text-[10px] font-bold px-2 py-0.5 rounded-full">
                  وضع التعديل النشط
                </span>
              )}
            </div>

            {/* Required Fields Group */}
            <div className="bg-white p-4 rounded-xl border border-[#E2DED0] space-y-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#4A5D4E] pb-1 border-b border-[#F4F1EA]">
                <Sparkles className="w-4 h-4 text-emerald-700" />
                <span>أولاً: بيانات الفرد كاملة وتخصه شخصياً (حقول إلزامية)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {/* 1. الاسم الأول */}
                <div>
                  <label className="block text-[10px] text-[#7A8B7E] mb-0.5 font-bold">الاسم الأول فقط <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={mName}
                    onChange={(e) => setMName(e.target.value)}
                    placeholder="الاسم الأول فقط للفرد"
                    className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-medium outline-none ${
                      mName.trim() && (mName.includes(' ') || mName.trim().split(/\s+/).length > 1)
                        ? 'border-red-500 bg-red-50 text-red-900 focus:ring-1 focus:ring-red-400'
                        : 'border-[#E2DED0] bg-[#FDFBF7] text-[#2D3A30] focus:ring-1 focus:ring-[#4A5D4E] focus:bg-white'
                    }`}
                    required
                  />
                  {mName.trim() && (mName.includes(' ') || mName.trim().split(/\s+/).length > 1) && (
                    <p className="text-[10px] text-red-600 font-bold mt-1">
                      ⚠️ خطأ: يجب إدخال اسم واحد فقط بدون مسافات!
                    </p>
                  )}
                </div>

                {/* 1.1 الرقم الوطني */}
                <div>
                  <label className="block text-[10px] text-[#7A8B7E] mb-0.5 font-bold">الرقم الوطني (اختياري)</label>
                  <input
                    type="text"
                    value={mNationalId}
                    onChange={(e) => setMNationalId(e.target.value)}
                    placeholder="مثال: 123456789012"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2DED0] text-xs bg-[#FDFBF7] text-[#2D3A30] font-medium focus:ring-1 focus:ring-[#4A5D4E] focus:bg-white outline-none"
                  />
                </div>

                {/* 2. اسم رب الأسرة (قائمة منسدلة بحثية ذكية) */}
                <div className="relative">
                  <label className="block text-[10px] text-[#7A8B7E] mb-0.5 font-bold">اسم رب الأسرة المرتبط <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsFamilyDropdownOpen(!isFamilyDropdownOpen)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2DED0] text-xs bg-[#FDFBF7] text-[#2D3A30] text-right flex justify-between items-center cursor-pointer min-h-[34px] font-medium"
                    >
                      <span className="truncate max-w-[180px]">
                        {mFamilyId === 'current' 
                          ? `الأسرة الحالية`
                          : (() => {
                              const found = families.find(f => f.id === mFamilyId);
                              return found 
                                ? getCleanBreadwinnerName(found) 
                                : 'اختر الأسرة...';
                            })()
                        }
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-[#7A8B7E] flex-shrink-0" />
                    </button>

                    {isFamilyDropdownOpen && (
                      <div className="absolute z-50 mt-1 w-full md:w-80 bg-white border border-[#E2DED0] rounded-xl shadow-lg p-2 space-y-2 max-h-60 overflow-y-auto right-0">
                        <div className="relative">
                          <input
                            type="text"
                            value={familySearchQuery}
                            onChange={(e) => setFamilySearchQuery(e.target.value)}
                            placeholder="ابحث باللقب أو اسم رب الأسرة..."
                            className="w-full pl-8 pr-2.5 py-1.5 rounded-lg border border-[#E2DED0] text-xs bg-white text-[#2D3A30] outline-none font-medium"
                          />
                          <Search className="w-3.5 h-3.5 text-[#7A8B7E] absolute left-2.5 top-2.5" />
                        </div>
                        <div className="divide-y divide-[#F4F1EA] max-h-40 overflow-y-auto">
                          <button
                            type="button"
                            onClick={() => {
                              setMFamilyId('current');
                              setIsFamilyDropdownOpen(false);
                              setFamilySearchQuery('');
                            }}
                            className={`w-full text-right px-2.5 py-2 text-xs hover:bg-[#F4F1EA] rounded-lg transition-all flex items-center justify-between cursor-pointer ${
                              mFamilyId === 'current' ? 'bg-[#E9F0E0] text-[#4A5D4E] font-bold' : 'text-[#3E4C41]'
                            }`}
                          >
                            <span>الأسرة الحالية</span>
                          </button>
                          {families
                            .filter(f => f.id !== family?.id)
                            .filter(f => 
                              f.familyName.toLowerCase().includes(familySearchQuery.toLowerCase()) ||
                              f.breadwinnerName.toLowerCase().includes(familySearchQuery.toLowerCase())
                            )
                            .map(f => (
                              <button
                                key={f.id}
                                type="button"
                                onClick={() => {
                                  setMFamilyId(f.id);
                                  setIsFamilyDropdownOpen(false);
                                  setFamilySearchQuery('');
                                }}
                                className={`w-full text-right px-2.5 py-2 text-xs hover:bg-[#F4F1EA] rounded-lg transition-all flex items-center justify-between cursor-pointer ${
                                  mFamilyId === f.id ? 'bg-[#E9F0E0] text-[#4A5D4E] font-bold' : 'text-[#3E4C41]'
                                }`}
                              >
                                <span className="truncate font-medium">{getCleanBreadwinnerName(f)} <span className="text-[10px] text-gray-400 font-mono">[{f.id}]</span></span>
                              </button>
                            ))
                          }
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. العلاقة برب الأسرة مع ربط ذكي للجنس */}
                <div>
                  <label className="block text-[10px] text-[#7A8B7E] mb-0.5 font-bold">العلاقة برب الأسرة <span className="text-red-500">*</span></label>
                  <select
                    value={mRelationship}
                    onChange={(e) => {
                      const val = e.target.value as RelationshipType;
                      setMRelationship(val);
                      if (val === 'ابن' || val === 'زوج') {
                        setMGender('ذكر');
                      } else if (val === 'ابنة' || val === 'زوجة') {
                        setMGender('أنثى');
                      }
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2DED0] text-xs bg-[#FDFBF7] text-[#2D3A30] font-medium outline-none focus:border-[#4A5D4E]"
                    required
                  >
                    <option value="ابن">ابن</option>
                    <option value="ابنة">ابنة</option>
                    <option value="زوج">زوج</option>
                    <option value="زوجة">زوجة</option>
                    <option value="عائل">العائل نفسه (رب الأسرة)</option>
                    <option value="أب">أب</option>
                    <option value="أم">أم</option>
                    <option value="أخ">أخ</option>
                    <option value="أخت">أخت</option>
                    <option value="آخر">آخر</option>
                  </select>
                </div>

                {/* 4. الجنس */}
                <div>
                  <label className="block text-[10px] text-[#7A8B7E] mb-0.5 font-bold">الجنس <span className="text-red-500">*</span></label>
                  <div className={`flex gap-2 p-1.5 rounded-lg text-xs justify-around border transition-all ${
                    isGenderLockedUnified ? 'bg-gray-100 border-gray-200 text-gray-400' : 'bg-[#FDFBF7] border-[#E2DED0] text-[#3E4C41]'
                  }`}>
                    <label className={`flex items-center gap-1 font-medium ${isGenderLockedUnified ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                      <input 
                        type="radio" 
                        checked={mGender === 'ذكر'} 
                        onChange={() => !isGenderLockedUnified && setMGender('ذكر')} 
                        disabled={isGenderLockedUnified}
                      />
                      <span>ذكر</span>
                    </label>
                    <label className={`flex items-center gap-1 font-medium ${isGenderLockedUnified ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                      <input 
                        type="radio" 
                        checked={mGender === 'أنثى'} 
                        onChange={() => !isGenderLockedUnified && setMGender('أنثى')} 
                        disabled={isGenderLockedUnified}
                      />
                      <span>أنثى</span>
                    </label>
                  </div>
                </div>

                {/* 5. الإقامة */}
                <div className="relative">
                  <label className="block text-[10px] text-[#7A8B7E] mb-0.5 font-bold">الإقامة للفرد <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsResidenceDropdownOpen(!isResidenceDropdownOpen)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2DED0] text-xs bg-[#FDFBF7] text-[#2D3A30] text-right flex justify-between items-center cursor-pointer min-h-[34px] font-medium"
                    >
                      <span className="truncate max-w-[180px]">
                        {mResidence || 'اختر الإقامة للفرد...'}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-[#7A8B7E] flex-shrink-0" />
                    </button>

                    {isResidenceDropdownOpen && (
                      <div className="absolute z-50 mt-1 w-full md:w-80 bg-white border border-[#E2DED0] rounded-xl shadow-lg p-2.5 space-y-2 max-h-64 overflow-y-auto right-0">
                        <div className="relative">
                          <input
                            type="text"
                            value={residenceSearchQuery}
                            onChange={(e) => setResidenceSearchQuery(e.target.value)}
                            placeholder="ابحث عن محلة أو محافظة..."
                            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[#E2DED0] text-xs bg-white text-[#2D3A30] outline-none font-medium"
                            autoFocus
                          />
                          <Search className="w-3.5 h-3.5 text-[#7A8B7E] absolute left-2.5 top-2.5" />
                        </div>
                        <div className="divide-y divide-[#F4F1EA] max-h-48 overflow-y-auto">
                          {/* Group: Local Neighborhoods */}
                          {uniqueNeighborhoods.filter(n => n.toLowerCase().includes(residenceSearchQuery.toLowerCase())).length > 0 && (
                            <div className="py-1">
                              <span className="block text-[10px] text-gray-400 font-bold px-2 py-1">المحلات المسجلة (المحلية)</span>
                              {uniqueNeighborhoods
                                .filter(n => n.toLowerCase().includes(residenceSearchQuery.toLowerCase()))
                                .map(n => (
                                  <button
                                    key={n}
                                    type="button"
                                    onClick={() => {
                                      setMResidence(n);
                                      setIsResidenceDropdownOpen(false);
                                      setResidenceSearchQuery('');
                                    }}
                                    className={`w-full text-right px-2.5 py-1.5 text-xs hover:bg-[#F4F1EA] rounded-lg transition-all flex items-center justify-between cursor-pointer ${
                                      mResidence === n ? 'bg-[#E9F0E0] text-[#4A5D4E] font-bold' : 'text-[#3E4C41]'
                                    }`}
                                  >
                                    <span>{n}</span>
                                  </button>
                                ))
                              }
                            </div>
                          )}

                          {/* Group: Yemen Governorates */}
                          {(() => {
                            const govs = [
                              'صنعاء', 'تعز', 'عدن', 'الحديدة', 'إب', 'حضرموت', 'ذمار', 'مأرب', 'حجة', 
                              'البيضاء', 'شبوة', 'صعدة', 'الضالع', 'لحج', 'أبين', 'الجوف', 'عمران', 
                              'المحويت', 'ريمة', 'المهرة', 'سقطرى', ...customGovernorates
                            ].filter(g => g.toLowerCase().includes(residenceSearchQuery.toLowerCase()));

                            if (govs.length > 0) {
                              return (
                                <div className="py-1">
                                  <span className="block text-[10px] text-gray-400 font-bold px-2 py-1">المحافظات اليمنية</span>
                                  {govs.map(gov => (
                                    <button
                                      key={gov}
                                      type="button"
                                      onClick={() => {
                                        setMResidence(gov);
                                        setIsResidenceDropdownOpen(false);
                                        setResidenceSearchQuery('');
                                      }}
                                      className={`w-full text-right px-2.5 py-1.5 text-xs hover:bg-[#F4F1EA] rounded-lg transition-all flex items-center justify-between cursor-pointer ${
                                        mResidence === gov ? 'bg-[#E9F0E0] text-[#4A5D4E] font-bold' : 'text-[#3E4C41]'
                                      }`}
                                    >
                                      <span>{gov}</span>
                                    </button>
                                  ))}
                                </div>
                              );
                            }
                            return null;
                          })()}

                          <button
                            type="button"
                            onClick={() => {
                              const newGov = prompt('الرجاء إدخال اسم المحافظة اليمنية الجديدة:');
                              if (newGov && newGov.trim() !== '') {
                                const trimmed = newGov.trim();
                                setCustomGovernorates(prev => [...prev, trimmed]);
                                setMResidence(trimmed);
                                setIsResidenceDropdownOpen(false);
                                setResidenceSearchQuery('');
                              }
                            }}
                            className="w-full text-right px-2.5 py-2 text-xs text-emerald-700 font-bold hover:bg-[#F4F1EA] rounded-lg transition-all cursor-pointer flex items-center gap-1"
                          >
                            <span>+ إضافة محافظة يمنية جديدة...</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 6. رقم الهاتف للفرد */}
                <div>
                  <label className="block text-[10px] text-[#7A8B7E] mb-0.5 font-bold">رقم الهاتف للفرد (اختياري)</label>
                  <input
                    type="tel"
                    value={mPhone}
                    onChange={(e) => setMPhone(e.target.value)}
                    placeholder="مثال: 777123456"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2DED0] text-xs bg-[#FDFBF7] text-[#2D3A30] font-medium focus:ring-1 focus:ring-[#4A5D4E] focus:bg-white outline-none"
                  />
                </div>
              </div>

              {/* لوحة المعلومات التفاعلية للأسرة المرتبطة */}
              <div className="bg-[#F8F6F0] p-4 rounded-xl border border-[#E2DED0] space-y-3 mt-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#4A5D4E] pb-1.5 border-b border-[#E2DED0]/60">
                  <Info className="w-4 h-4 text-[#4A5D4E]" />
                  <span>ثانياً: لوحة المعلومات التفاعلية الذكية للأسرة المرتبطة (عرض وتوثيق تلقائي)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-sans">
                  <div className="bg-white p-2.5 rounded-xl border border-[#E2DED0]/60 flex flex-col justify-center">
                    <span className="text-[10px] text-[#7A8B7E] font-bold mb-0.5">اللقب / اسم العائلة</span>
                    <span className="font-bold text-[#2D3A30] truncate">{mFamilyId === 'current' ? familyName || '(الأسرة الحالية)' : targetFamilyName}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-[#E2DED0]/60 flex flex-col justify-center">
                    <span className="text-[10px] text-[#7A8B7E] font-bold mb-0.5">محلة العائلة الموحدة</span>
                    <span className="font-bold text-[#2D3A30] truncate">{mFamilyId === 'current' ? neighborhood || '(الأسرة الحالية)' : targetNeighborhood}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-[#E2DED0]/60 flex flex-col justify-center">
                    <span className="text-[10px] text-[#7A8B7E] font-bold mb-0.5">حالة استحقاق الأسرة للدعم</span>
                    <div>
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        (mFamilyId === 'current' ? supportStatus : targetSupportStatus) === 'مستحق للدعم' ? 'bg-red-50 text-red-700 border border-red-200' :
                        (mFamilyId === 'current' ? supportStatus : targetSupportStatus) === 'تحت الدراسة' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {mFamilyId === 'current' ? supportStatus : targetSupportStatus}
                      </span>
                    </div>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-[#E2DED0]/60 flex flex-col justify-center">
                    <span className="text-[10px] text-[#7A8B7E] font-bold mb-0.5">إجمالي الأفراد المقيدين</span>
                    <span className="font-bold text-emerald-700">{mFamilyId === 'current' ? members.length : targetMembersCount} أفراد</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Optional Fields Toggle Button */}
            <button
              type="button"
              onClick={() => setShowOptionalFields(!showOptionalFields)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-[#E2DED0] bg-[#FDFBF7] text-xs text-[#3E4C41] hover:bg-[#F4F1EA] transition-all font-bold cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5 text-[#4A5D4E]" />
                <span>عرض الحقول الفرعية والاختيارية (تاريخ الميلاد، المستوى التعليمي، المهنة...)</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 bg-white border border-[#E2DED0] rounded-lg">
                {showOptionalFields ? 'إخفاء الحقول الفرعية ▲' : 'إظهار الحقول الفرعية (اختياري) ▼'}
              </span>
            </button>

            {/* Optional Fields Collapsible Panel */}
            {showOptionalFields && (
              <div className="p-4 rounded-xl border border-dashed border-[#E2DED0] bg-[#FDFBF7]/40 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] text-[#7A8B7E] mb-0.5 font-bold">تاريخ الميلاد (اختياري)</label>
                  <input
                    type="date"
                    value={mBirthDate}
                    onChange={(e) => setMBirthDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2DED0] text-xs bg-white text-[#2D3A30]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-[#7A8B7E] mb-0.5 font-bold">المستوى التعليمي (اختياري)</label>
                  <select
                    value={mEducation}
                    onChange={(e) => setMEducation(e.target.value as EducationType)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2DED0] text-xs bg-white text-[#2D3A30]"
                  >
                    <option value="غير محدد">غير محدد</option>
                    <option value="دون سن الدراسة">دون سن الدراسة</option>
                    <option value="أمي">أمي / غير متعلم</option>
                    <option value="ابتدائي">ابتدائي</option>
                    <option value="إعدادي">إعدادي</option>
                    <option value="ثانوي">ثانوي</option>
                    <option value="جامعي">جامعي</option>
                    <option value="دراسات عليا">دراسات عليا</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-[#7A8B7E] mb-0.5 font-bold">المهنة / طبيعة العمل (اختياري)</label>
                  <input
                    type="text"
                    value={mOccupation}
                    onChange={(e) => setMOccupation(e.target.value)}
                    placeholder="(طالب، موظف حكومي، عاطل...)"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2DED0] text-xs bg-white text-[#2D3A30]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-[#7A8B7E] mb-0.5 font-bold">الوضع الصحي (اختياري)</label>
                  <select
                    value={mHealthStatus}
                    onChange={(e) => setMHealthStatus(e.target.value as HealthStatusType)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2DED0] text-xs bg-white text-[#2D3A30]"
                  >
                    <option value="سليم">سليم / معافى</option>
                    <option value="مرض مزمن">يعاني من مرض مزمن</option>
                    <option value="ذوي احتياجات خاصة">من ذوي الاحتياجات الخاصة</option>
                  </select>
                </div>

                <div className="sm:col-span-2 md:col-span-4">
                  <label className="block text-[10px] text-[#7A8B7E] mb-0.5 font-bold">ملاحظات الفرد الطبية والخاصة (اختياري)</label>
                  <input
                    type="text"
                    value={mNotes}
                    onChange={(e) => setMNotes(e.target.value)}
                    placeholder="أدوية مستمرة، صعوبات حركة، أو ملاحظات أخرى"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2DED0] text-xs bg-white text-[#2D3A30]"
                  />
                </div>
              </div>
            )}

            {/* Actions Panel */}
            <div className="flex justify-end gap-2 pt-1.5">
              {editingMemberId && (
                <button
                  type="button"
                  onClick={handleCancelEditMember}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold border border-[#E2DED0] text-[#3E4C41] hover:bg-[#FDFBF7] transition-all cursor-pointer"
                >
                  إلغاء التعديل
                </button>
              )}
              <button
                type="button"
                onClick={handleAddMember}
                disabled={!mName}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all ${
                  mName 
                    ? 'bg-[#4A5D4E] hover:bg-[#3E4C41] text-[#FDFBF7] cursor-pointer' 
                    : 'bg-[#F4F1EA] text-[#7A8B7E] border border-[#E2DED0] cursor-not-allowed'
                }`}
              >
                {editingMemberId ? (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>حفظ التعديلات الحالية للفرد</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>إدراج الفرد إلى العائلة</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Members list view */}
          {members.length > 0 ? (
            <div className="border border-[#E2DED0] rounded-2xl overflow-hidden shadow-3xs bg-white">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#FDFBF7] text-[#7A8B7E] font-bold border-b border-[#E2DED0]">
                  <tr>
                    <th className="p-3">الاسم الكامل / المحلة</th>
                    <th className="p-3">العلاقة</th>
                    <th className="p-3">الجنس / السن والميلاد</th>
                    <th className="p-3">التعليم</th>
                    <th className="p-3">المهنة والوضع الصحي</th>
                    <th className="p-3 text-center">إجراءات تعديل/حذف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F4F1EA]">
                  {members.map((m) => (
                    <tr key={m.id} className="hover:bg-[#FDFBF7] transition-all">
                      <td className="p-3">
                        <div className="font-semibold text-[#2D3A30]">{m.name}</div>
                        <div className="text-[10px] text-[#7A8B7E] flex flex-wrap gap-x-2 gap-y-0.5">
                          <span>المحلة: {m.neighborhood || neighborhood || 'غير محدد'}</span>
                          {m.residence && <span>• الإقامة: {m.residence}</span>}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                          m.relationship === 'عائل' ? 'bg-[#DDE5B6] text-[#4A5D4E] font-bold' : 'bg-[#F4F1EA] text-[#3E4C41]'
                        }`}>
                          {m.relationship}
                        </span>
                      </td>
                      <td className="p-3 text-[#7A8B7E]">
                        <div>{m.gender} • {m.age} عام</div>
                        {m.birthDate && <div className="text-[9px] text-[#7A8B7E]/80">مواليد: {m.birthDate}</div>}
                      </td>
                      <td className="p-3 text-[#3E4C41]">{m.education}</td>
                      <td className="p-3 space-y-0.5">
                        <div className="text-[#3E4C41]">{m.occupation}</div>
                        {m.healthStatus !== 'سليم' && (
                          <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-lg ${
                            m.healthStatus === 'ذوي احتياجات خاصة' ? 'bg-[#DDE5B6]/60 text-[#4A5D4E]' : 'bg-[#FFF5EB] text-[#A98467]'
                          }`}>
                            {m.healthStatus} {m.notes ? `(${m.notes})` : ''}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleEditMember(m)}
                            className="p-1.5 text-[#7A8B7E] hover:text-[#4A5D4E] hover:bg-[#F4F1EA] rounded-lg transition-all cursor-pointer"
                            title="تعديل بيانات الفرد"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(m.id)}
                            className="p-1.5 text-[#7A8B7E] hover:text-[#A98467] hover:bg-[#FFF5EB] rounded-lg transition-all cursor-pointer"
                            title="حذف الفرد"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-[#FDFBF7] p-6 rounded-2xl border border-dashed border-[#E2DED0] text-center text-xs text-[#7A8B7E] space-y-2">
              <Info className="w-6 h-6 text-[#7A8B7E]/40 mx-auto" />
              <p>لم يتم تسجيل أي أفراد في العائلة حتى الآن.</p>
              <p className="text-[10px] text-[#7A8B7E]/80">يرجى استخدام نموذج الإضافة أعلاه لإدراج الأفراد (بما في ذلك رب الأسرة).</p>
            </div>
          )}
        </div>

        {/* Family Form Buttons */}
        <div className="flex justify-end gap-3 border-t border-[#E2DED0] pt-5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-[#E2DED0] text-xs font-bold text-[#3E4C41] hover:bg-[#FDFBF7] transition-all cursor-pointer"
          >
            إلغاء وتراجع
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-[#4A5D4E] hover:bg-[#3E4C41] text-[#FDFBF7] text-xs font-bold shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>حفظ سجل العائلة</span>
          </button>
        </div>
      </form>
    </div>
  );
}
