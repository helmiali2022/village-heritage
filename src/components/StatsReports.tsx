import React, { useState, useMemo, useEffect } from 'react';
import { Family, Member, parseBreadwinner } from '../types';
import { Download, FileSpreadsheet, FileText, Printer, ShieldAlert, HeartPulse, GraduationCap, Briefcase, Eye, Users, Baby, Activity, TrendingUp, Calendar, PlusCircle, Trash2, Heart, UserMinus } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  LineChart,
  Line
} from 'recharts';

interface StatsReportsProps {
  families: Family[];
}

type ReportType = 'support' | 'health' | 'education' | 'unemployment' | 'surnames' | 'demographics';

export default function StatsReports({ families }: StatsReportsProps) {
  const [activeReportType, setActiveReportType] = useState<ReportType>('support');
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  // State for vital statistics events (births and deaths log)
  const [customEvents, setCustomEvents] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('demographics_vital_events_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save customEvents when updated
  useEffect(() => {
    localStorage.setItem('demographics_vital_events_v1', JSON.stringify(customEvents));
  }, [customEvents]);

  // Form states for registering a new event
  const [eventName, setEventName] = useState('');
  const [eventType, setEventType] = useState<'birth' | 'death'>('birth');
  const [eventYear, setEventYear] = useState<number>(2026);
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [eventNotes, setEventNotes] = useState('');
  const [showEventSuccess, setShowEventSuccess] = useState(false);

  // Dynamically compute demographic stats based on families, members, and custom events
  const demographicsData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    // Generate the last 5 years based on the current actual year
    const last5Years = [currentYear - 4, currentYear - 3, currentYear - 2, currentYear - 1, currentYear];
    
    // 1. Core births counted from actual registered members (using age as an index)
    // We reverse engineer births from the age of members.
    let actualBirths: Record<number, number> = {};
    last5Years.forEach(y => actualBirths[y] = 0);
    
    families.forEach(f => {
      f.members.forEach(m => {
        const birthYear = currentYear - m.age;
        if (last5Years.includes(birthYear)) {
          actualBirths[birthYear]++;
        }
      });
    });

    // 2. Incorporate custom vital events logged by user (births/deaths)
    let loggedBirths: Record<number, number> = {};
    let loggedDeaths: Record<number, number> = {};
    last5Years.forEach(y => {
      loggedBirths[y] = 0;
      loggedDeaths[y] = 0;
    });

    customEvents.forEach(e => {
      const yr = Number(e.year);
      if (last5Years.includes(yr)) {
        if (e.type === 'birth') {
          loggedBirths[yr]++;
        } else if (e.type === 'death') {
          loggedDeaths[yr]++;
        }
      }
    });

    // 3. Combine actual from census + logged events
    const timeline = last5Years.map(y => {
      const totalBirths = actualBirths[y] + loggedBirths[y];
      const totalDeaths = loggedDeaths[y]; // In a real system, deaths would come from a registry. Here we only have logged deaths and live members
      const naturalIncrease = totalBirths - totalDeaths;
      return {
        year: `${y}`,
        المواليد: totalBirths,
        الوفيات: totalDeaths,
        الزيادة_الطبيعية: naturalIncrease,
      };
    });

    // Calculate totals over 5 years
    const totalBirthsSum = timeline.reduce((sum, item) => sum + item.المواليد, 0);
    const totalDeathsSum = timeline.reduce((sum, item) => sum + item.الوفيات, 0);
    const averageNaturalIncrease = (totalBirthsSum - totalDeathsSum) / 5;

    // Estimate cumulative growth trend (starting from actual real total population length)
    let currentPop = families.reduce((acc, curr) => acc + curr.members.length, 0);
    const growthTrend = timeline.map(item => {
      // For the past, we calculate backwards or just use the current actual as the final point,
      // but let's just make it a trend line ending at currentPop.
      return {
        year: item.year,
        السكان: currentPop,
        المواليد: item.المواليد,
        الوفيات: item.الوفيات,
      };
    });

    // Make the chart look realistic by retroactively calculating past population sizes
    let retroactivePop = currentPop;
    for(let i = timeline.length - 1; i >= 0; i--) {
      growthTrend[i].السكان = retroactivePop;
      retroactivePop -= timeline[i].الزيادة_الطبيعية;
    }

    return {
      timeline,
      growthTrend,
      totalBirthsSum,
      totalDeathsSum,
      averageNaturalIncrease,
      currentPop
    };
  }, [families, customEvents]);

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName.trim()) return;

    const newEvent = {
      id: `evt-${Date.now()}`,
      type: eventType,
      name: eventName.trim(),
      year: eventYear,
      date: eventDate,
      notes: eventNotes.trim()
    };

    setCustomEvents(prev => [newEvent, ...prev]);
    setEventName('');
    setEventNotes('');
    setShowEventSuccess(true);
    setTimeout(() => setShowEventSuccess(false), 3000);
  };

  const handleDeleteEvent = (id: string) => {
    setCustomEvents(prev => prev.filter(evt => evt.id !== id));
  };

  // Calculate deep educational indicators
  const stats = useMemo(() => {
    let totalMembersCount = 0;
    let illiterateCount = 0;
    let universityCount = 0;
    let postGradCount = 0;
    
    let totalWorkingAge = 0; // age 18 to 60
    let unemployedCount = 0;

    let specialNeedsMembers: { member: Member; family: Family }[] = [];
    let chronicDiseaseMembers: { member: Member; family: Family }[] = [];
    
    let needyFamiliesList: Family[] = [];
    let unemployedMembersList: { member: Member; family: Family }[] = [];

    families.forEach(f => {
      if (f.supportStatus === 'مستحق للدعم') {
        needyFamiliesList.push(f);
      }

      f.members.forEach(m => {
        totalMembersCount++;
        
        if (m.education === 'أمي') illiterateCount++;
        if (m.education === 'جامعي') universityCount++;
        if (m.education === 'دراسات عليا') postGradCount++;

        if (m.age >= 18 && m.age <= 60) {
          totalWorkingAge++;
          const isUnemployed = 
            m.occupation.includes('لا يعمل') || 
            m.occupation.includes('عاطل') || 
            m.occupation.includes('بلا عمل') || 
            m.occupation.includes('بحث عن عمل') || 
            m.occupation.includes('البحث عن عمل');
          
          if (isUnemployed) {
            unemployedCount++;
            unemployedMembersList.push({ member: m, family: f });
          }
        }

        if (m.healthStatus === 'ذوي احتياجات خاصة') {
          specialNeedsMembers.push({ member: m, family: f });
        } else if (m.healthStatus === 'مرض مزمن') {
          chronicDiseaseMembers.push({ member: m, family: f });
        }
      });
    });

    const illiteracyRate = totalMembersCount ? ((illiterateCount / totalMembersCount) * 100).toFixed(1) : '0';
    const higherEducationRate = totalMembersCount ? (((universityCount + postGradCount) / totalMembersCount) * 100).toFixed(1) : '0';
    const unemploymentRate = totalWorkingAge ? ((unemployedCount / totalWorkingAge) * 100).toFixed(1) : '0';

    return {
      illiteracyRate,
      higherEducationRate,
      unemploymentRate,
      specialNeedsMembers,
      chronicDiseaseMembers,
      needyFamiliesList,
      unemployedMembersList
    };
  }, [families]);

  // Extract relevant rows based on current active tab
  const reportRows = useMemo(() => {
    switch (activeReportType) {
      case 'support':
        return stats.needyFamiliesList.map((f, i) => ({
          col1: `${i + 1}`,
          col2: f.familyName,
          col3: parseBreadwinner(f.breadwinnerName, f.phone).name,
          col4: f.phone,
          col5: f.neighborhood,
          col6: `${f.members.length} أفراد`,
          col7: f.monthlyIncome
        }));
      case 'health':
        return [
          ...stats.specialNeedsMembers.map((item, i) => ({
            col1: `ذوي احتياجات خاصة - ${i + 1}`,
            col2: item.member.name,
            col3: item.family.familyName,
            col4: item.member.relationship,
            col5: `${item.member.age} سنة`,
            col6: item.family.phone,
            col7: item.member.notes || 'يحتاج متابعة مستمرة'
          })),
          ...stats.chronicDiseaseMembers.map((item, i) => ({
            col1: `مرض مزمن - ${i + 1}`,
            col2: item.member.name,
            col3: item.family.familyName,
            col4: item.member.relationship,
            col5: `${item.member.age} سنة`,
            col6: item.family.phone,
            col7: item.member.notes || 'سكري وضغط الدم'
          }))
        ];
      case 'unemployment':
        return stats.unemployedMembersList.map((item, i) => ({
          col1: `${i + 1}`,
          col2: item.member.name,
          col3: item.family.familyName,
          col4: item.member.relationship,
          col5: `${item.member.age} سنة`,
          col6: item.member.education,
          col7: item.member.notes || 'يبحث عن عمل مستقر'
        }));
      case 'education':
        // List members with higher education
        const list: any[] = [];
        families.forEach(f => {
          f.members.forEach(m => {
            if (m.education === 'جامعي' || m.education === 'دراسات عليا') {
              list.push({
                col1: `${list.length + 1}`,
                col2: m.name,
                col3: f.familyName,
                col4: m.relationship,
                col5: `${m.age} سنة`,
                col6: m.education,
                col7: m.occupation
              });
            }
          });
        });
        return list;
      case 'surnames': {
        const surnameMap: { [key: string]: { familiesCount: number; totalMembers: number; familiesList: string[]; needyCount: number } } = {};
        families.forEach(f => {
          const s = f.familyName?.trim() || 'بدون لقب';
          if (!surnameMap[s]) {
            surnameMap[s] = { familiesCount: 0, totalMembers: 0, familiesList: [], needyCount: 0 };
          }
          surnameMap[s].familiesCount += 1;
          surnameMap[s].totalMembers += f.members.length;
          const bw = parseBreadwinner(f.breadwinnerName, f.phone).name;
          if (surnameMap[s].familiesList.length < 3) {
            surnameMap[s].familiesList.push(bw);
          }
          if (f.supportStatus === 'مستحق للدعم') {
            surnameMap[s].needyCount += 1;
          }
        });

        const totalPopCount = families.reduce((acc, curr) => acc + curr.members.length, 0);

        return Object.entries(surnameMap)
          .sort((a, b) => b[1].totalMembers - a[1].totalMembers)
          .map(([name, data], i) => ({
            col1: `${i + 1}`,
            col2: name,
            col3: `${data.familiesCount} عائلات`,
            col4: `${data.totalMembers} نسمة`,
            col5: data.familiesList.join('، ') + (data.familiesCount > 3 ? '...' : ''),
            col6: `${data.needyCount} أسر مستحقة`,
            col7: totalPopCount > 0 ? `${((data.totalMembers / totalPopCount) * 100).toFixed(1)}%` : '0%'
          }));
      }
      case 'demographics': {
        return customEvents.map((e, idx) => ({
          col1: `${idx + 1}`,
          col2: e.name,
          col3: e.type === 'birth' ? '👶 مولود جديد (ولادة)' : '⚰️ حالة وفاة',
          col4: `${e.year} م`,
          col5: e.date,
          col6: e.notes || 'سجل رسمي للتعداد',
          col7: 'نشط ومسجل بالمنصة'
        }));
      }
    }
  }, [activeReportType, stats, families, customEvents]);

  const reportHeaders = useMemo(() => {
    switch (activeReportType) {
      case 'support':
        return ['#', 'العائلة', 'رب الأسرة', 'هاتف التواصل', 'المحلة', 'الحجم', 'متوسط الدخل'];
      case 'health':
        return ['التصنيف الطبي', 'الاسم', 'العائلة التابع لها', 'العلاقة', 'السن', 'هاتف العائلة', 'تفاصيل الحالة'];
      case 'unemployment':
        return ['#', 'الاسم', 'العائلة', 'القرابة', 'السن', 'المؤهل العلمي', 'ملاحظات المهنة'];
      case 'education':
        return ['#', 'الاسم', 'العائلة', 'القرابة', 'السن', 'المؤهل الحالي', 'المهنة الحالية'];
      case 'surnames':
        return ['#', 'اللقب الموحد السائد', 'عدد الأسر التابعة', 'إجمالي الأفراد والنسمات', 'أبرز أرباب الأسر المعتمدين', 'عدد الأسر المستحقة', 'النسبة المئوية بالقرية'];
      case 'demographics':
        return ['#', 'اسم الشخص المعني', 'نوع الواقعة الحيوية', 'السنة المستهدفة', 'تاريخ التسجيل المعتمد', 'تفاصيل وملاحظات التعداد', 'حالة السجل المعتمد'];
    }
  }, [activeReportType]);

  const handleSimulatedDownload = (format: 'csv' | 'print') => {
    if (format === 'print') {
      window.print();
      return;
    }
    // Simulate CSV file download
    const csvContent = "data:text/csv;charset=utf-8," 
      + reportHeaders.join(",") + "\n"
      + reportRows.map(row => Object.values(row).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `تقرير_${activeReportType}_المرصد_السكاني.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 font-sans" id="stats-reports-view">
      {/* Educational & Social Indexes Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1 */}
        <div className="bg-white rounded-3xl p-6 border border-[#E2DED0] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-[#7A8B7E] font-bold block uppercase tracking-wider">معدل البطالة المحلي (18-60)</span>
            <span className="text-2xl font-extrabold text-[#2D3A30]">{stats.unemploymentRate}%</span>
            <p className="text-[10px] text-[#7A8B7E]">من إجمالي الأفراد في سن العمل المسجلين</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#FDFBF7] border border-[#E2DED0] flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-[#3E4C41]" />
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-3xl p-6 border border-[#E2DED0] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-[#7A8B7E] font-bold block uppercase tracking-wider">معدل التعليم العالي والأكاديمي</span>
            <span className="text-2xl font-extrabold text-[#4A5D4E]">{stats.higherEducationRate}%</span>
            <p className="text-[10px] text-[#7A8B7E]">حملة الشهادات الجامعية والدراسات العليا</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#E9F0E0] border border-[#DDE5B6] flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-[#4A5D4E]" />
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-3xl p-6 border border-[#E2DED0] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-[#7A8B7E] font-bold block uppercase tracking-wider">الأمية والجهل القرائي بالمنطقة</span>
            <span className="text-2xl font-extrabold text-[#A98467]">{stats.illiteracyRate}%</span>
            <p className="text-[10px] text-[#7A8B7E]">أفراد خارج مراحل التعليم الأساسية</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#FFF5EB] border border-[#E2DED0]/50 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-[#A98467]" />
          </div>
        </div>
      </div>

      {/* Reports Center Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Side: Report types list (Col 1) */}
        <div className="bg-[#F4F1EA] rounded-3xl p-5 border border-[#E2DED0] shadow-sm space-y-2">
          <h4 className="font-bold text-[#2D3A30] text-xs px-2 mb-3">قوالب التقارير المعتمدة</h4>
          
          <button
            onClick={() => setActiveReportType('support')}
            className={`w-full text-right p-3 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${
              activeReportType === 'support' 
                ? 'bg-[#4A5D4E] text-[#FDFBF7] shadow-sm' 
                : 'text-[#3E4C41] hover:bg-[#FDFBF7]'
            }`}
          >
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>كشف الأسر الأكثر استحقاقاً للدعم</span>
          </button>

          <button
            onClick={() => setActiveReportType('health')}
            className={`w-full text-right p-3 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${
              activeReportType === 'health' 
                ? 'bg-[#4A5D4E] text-[#FDFBF7] shadow-sm' 
                : 'text-[#3E4C41] hover:bg-[#FDFBF7]'
            }`}
          >
            <HeartPulse className="w-4 h-4 shrink-0" />
            <span>بيان الحالات الطبية والصحية الخاصة</span>
          </button>

          <button
            onClick={() => setActiveReportType('unemployment')}
            className={`w-full text-right p-3 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${
              activeReportType === 'unemployment' 
                ? 'bg-[#4A5D4E] text-[#FDFBF7] shadow-sm' 
                : 'text-[#3E4C41] hover:bg-[#FDFBF7]'
            }`}
          >
            <Briefcase className="w-4 h-4 shrink-0" />
            <span>مسح العاطلين والباحثين عن العمل</span>
          </button>

          <button
            onClick={() => setActiveReportType('education')}
            className={`w-full text-right p-3 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${
              activeReportType === 'education' 
                ? 'bg-[#4A5D4E] text-[#FDFBF7] shadow-sm' 
                : 'text-[#3E4C41] hover:bg-[#FDFBF7]'
            }`}
          >
            <GraduationCap className="w-4 h-4 shrink-0" />
            <span>حصر الكفاءات والخريجين الجامعيين</span>
          </button>

          <button
            onClick={() => setActiveReportType('surnames')}
            className={`w-full text-right p-3 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${
              activeReportType === 'surnames' 
                ? 'bg-[#4A5D4E] text-[#FDFBF7] shadow-sm' 
                : 'text-[#3E4C41] hover:bg-[#FDFBF7]'
            }`}
          >
            <Users className="w-4 h-4 shrink-0 text-[#A98467]" />
            <span>الدراسة التحليلية للألقاب السائدة</span>
          </button>

          <button
            onClick={() => setActiveReportType('demographics')}
            className={`w-full text-right p-3 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${
              activeReportType === 'demographics' 
                ? 'bg-[#4A5D4E] text-[#FDFBF7] shadow-sm' 
                : 'text-[#3E4C41] hover:bg-[#FDFBF7]'
            }`}
          >
            <Baby className="w-4 h-4 shrink-0 text-emerald-600 animate-pulse" />
            <span>حركة المواليد والوفيات السنوية</span>
          </button>
        </div>

        {/* Right Side: Active report preview & Actions (Col 2-4) */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-[#E2DED0] shadow-sm overflow-hidden flex flex-col">
          {/* Action Header */}
          <div className="p-5 bg-[#FDFBF7] border-b border-[#F4F1EA] flex flex-wrap gap-3 items-center justify-between">
            <div>
              <h3 className="font-bold text-[#2D3A30] text-sm">
                {activeReportType === 'support' && 'تقرير كشف الأسر المستحقة للرعاية والدعم العاجل'}
                {activeReportType === 'health' && 'تقرير دليل الحالات الطبية وأصحاب الاحتياجات بالمحلة'}
                {activeReportType === 'unemployment' && 'تقرير مسح الباحثين عن فرص التوظيف والتمكين المهني'}
                {activeReportType === 'education' && 'تقرير حصر الخريجين وحملة المؤهلات العليا بالمنطقة'}
                {activeReportType === 'surnames' && 'الدراسة الإحصائية والتحليلية للألقاب السائدة بالتعداد'}
                {activeReportType === 'demographics' && 'التقرير التحليلي لحركة المواليد والوفيات السنوية والنمو السكاني'}
              </h3>
              <p className="text-[11px] text-[#7A8B7E] mt-0.5">
                تقرير رسمي تفاعلي مستخرج من قاعدة بيانات سجل العائلات والخدمات المحدثة.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleSimulatedDownload('csv')}
                className="bg-white hover:bg-[#F4F1EA] border border-[#E2DED0] text-[#3E4C41] px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#4A5D4E]" />
                تحميل كـ CSV
              </button>
              <button
                onClick={() => setShowPrintPreview(true)}
                className="bg-[#4A5D4E] hover:bg-[#3E4C41] text-[#FDFBF7] px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                معاينة وطباعة
              </button>
            </div>
          </div>

          {/* Table/Graphs Preview Area */}
          <div className="p-4 overflow-x-auto">
            {activeReportType === 'demographics' ? (
              <div className="space-y-6">
                {/* Demographics Summary Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-2">
                  {/* Card 1: Births */}
                  <div className="bg-[#E9F0E0] border border-[#DDE5B6] rounded-2xl p-4 flex items-center justify-between shadow-2xs">
                    <div className="space-y-1 text-right">
                      <span className="text-[10px] text-[#4A5D4E] font-extrabold block">إجمالي المواليد (آخر 5 سنوات)</span>
                      <span className="text-xl font-black text-[#2D3A30]">{demographicsData.totalBirthsSum}</span>
                      <p className="text-[9px] text-[#5F6C61] font-bold">بينهم {demographicsData.timeline[4].المواليد} هذا العام (2026)</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-3xs text-[#4A5D4E]">
                      <Baby className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Card 2: Deaths */}
                  <div className="bg-rose-50 border border-rose-200/60 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
                    <div className="space-y-1 text-right">
                      <span className="text-[10px] text-rose-800 font-extrabold block">إجمالي الوفيات (آخر 5 سنوات)</span>
                      <span className="text-xl font-black text-rose-950">{demographicsData.totalDeathsSum}</span>
                      <p className="text-[9px] text-rose-700/80 font-bold">بينهم {demographicsData.timeline[4].الوفيات} هذا العام (2026)</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-3xs text-rose-600">
                      <UserMinus className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Card 3: Avg Natural Increase */}
                  <div className="bg-[#FFF5EB] border border-[#E2DED0]/50 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
                    <div className="space-y-1 text-right">
                      <span className="text-[10px] text-[#A98467] font-extrabold block">متوسط الزيادة الطبيعية السنوية</span>
                      <span className="text-xl font-black text-[#A98467]">+{demographicsData.averageNaturalIncrease.toFixed(1)}</span>
                      <p className="text-[9px] text-gray-500 font-bold">معدل الفارق السنوي لصالح النمو</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-3xs text-[#A98467]">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Card 4: Current Projected Pop */}
                  <div className="bg-amber-50 border border-amber-200/50 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
                    <div className="space-y-1 text-right">
                      <span className="text-[10px] text-amber-900 font-extrabold block">التعداد المتوقع بالقرية</span>
                      <span className="text-xl font-black text-amber-950">{demographicsData.currentPop}</span>
                      <p className="text-[9px] text-amber-800/80 font-bold">بناءً على الحركة الطبيعية والمسح</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-3xs text-amber-600">
                      <Activity className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Charts Panel Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-2">
                  {/* Chart 1: Births vs Deaths (BarChart) */}
                  <div className="bg-white border border-[#E2DED0] rounded-2xl p-4 shadow-3xs">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xs font-black text-[#2D3A30] flex items-center gap-2">
                        <Activity className="w-4 h-4 text-[#4A5D4E]" />
                        مقارنة حركة المواليد والوفيات سنوياً
                      </h4>
                      <span className="text-[9px] bg-[#F4F1EA] text-[#3E4C41] font-bold px-2 py-0.5 rounded-full">آخر 5 سنوات</span>
                    </div>
                    <div className="h-64" dir="ltr">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={demographicsData.timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F4F1EA" />
                          <XAxis dataKey="year" stroke="#7A8B7E" fontSize={10} tickLine={false} />
                          <YAxis stroke="#7A8B7E" fontSize={10} tickLine={false} />
                          <Tooltip 
                            contentStyle={{ background: '#FDFBF7', border: '1px solid #E2DED0', borderRadius: '12px', fontSize: '11px', textAlign: 'right' }} 
                            itemStyle={{ direction: 'rtl' }}
                          />
                          <Legend verticalAlign="top" height={36} iconSize={10} wrapperStyle={{ fontSize: '10px' }} />
                          <Bar dataKey="المواليد" fill="#4A5D4E" name="المواليد الجدد" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="الوفيات" fill="#E07A5F" name="الوفيات السنوية" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Chart 2: Cumulative growth (AreaChart) */}
                  <div className="bg-white border border-[#E2DED0] rounded-2xl p-4 shadow-3xs">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xs font-black text-[#2D3A30] flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-[#A98467]" />
                        النمو السكاني والنمط التراكمي للتعداد
                      </h4>
                      <span className="text-[9px] bg-[#F4F1EA] text-[#3E4C41] font-bold px-2 py-0.5 rounded-full">إسقاط تقديري</span>
                    </div>
                    <div className="h-64" dir="ltr">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={demographicsData.growthTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="popColor" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#4A5D4E" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#4A5D4E" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F4F1EA" />
                          <XAxis dataKey="year" stroke="#7A8B7E" fontSize={10} tickLine={false} />
                          <YAxis domain={['dataMin - 100', 'dataMax + 100']} stroke="#7A8B7E" fontSize={10} tickLine={false} />
                          <Tooltip 
                            contentStyle={{ background: '#FDFBF7', border: '1px solid #E2DED0', borderRadius: '12px', fontSize: '11px', textAlign: 'right' }} 
                            itemStyle={{ direction: 'rtl' }}
                          />
                          <Legend verticalAlign="top" height={36} iconSize={10} wrapperStyle={{ fontSize: '10px' }} />
                          <Area type="monotone" dataKey="السكان" stroke="#4A5D4E" name="التعداد السكاني المتوقع" fillOpacity={1} fill="url(#popColor)" strokeWidth={2.5} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Registration and Management Panel */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 p-2 pt-4 border-t border-[#F4F1EA]">
                  {/* Form Panel: Col 1-2 */}
                  <div className="lg:col-span-2 bg-[#FDFBF7] border border-[#E2DED0] rounded-2xl p-5 space-y-4">
                    <div className="text-right">
                      <h5 className="text-xs font-black text-[#2D3A30] flex items-center gap-1.5 justify-start">
                        <PlusCircle className="w-4 h-4 text-emerald-600 animate-pulse" />
                        تسجيل واقعة حيوية جديدة بالتعداد
                      </h5>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        قم بتوثيق حدث ميلاد جديد أو حالة وفاة لتحديث المخطط السكاني وصناعة القرار.
                      </p>
                    </div>

                    <form onSubmit={handleAddEvent} className="space-y-3.5 text-right">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1">اسم الشخص المعني بالحدث *</label>
                        <input
                          type="text"
                          required
                          value={eventName}
                          onChange={(e) => setEventName(e.target.value)}
                          placeholder="الاسم الثلاثي أو الثنائي..."
                          className="w-full text-xs p-2.5 bg-white border border-[#E2DED0] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#4A5D4E] focus:border-[#4A5D4E] text-right"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">نوع الواقعة الحيوية *</label>
                          <select
                            value={eventType}
                            onChange={(e) => setEventType(e.target.value as 'birth' | 'death')}
                            className="w-full text-xs p-2.5 bg-white border border-[#E2DED0] rounded-xl focus:outline-none text-right"
                          >
                            <option value="birth">👶 مولود جديد (ولادة)</option>
                            <option value="death">⚰️ حالة وفاة</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">السنة المستهدفة *</label>
                          <select
                            value={eventYear}
                            onChange={(e) => setEventYear(Number(e.target.value))}
                            className="w-full text-xs p-2.5 bg-white border border-[#E2DED0] rounded-xl focus:outline-none text-right"
                          >
                            <option value={2026}>2026 م</option>
                            <option value={2025}>2025 م</option>
                            <option value={2024}>2024 م</option>
                            <option value={2023}>2023 م</option>
                            <option value={2022}>2022 م</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1">التاريخ الفعلي الموثق *</label>
                        <input
                          type="date"
                          required
                          value={eventDate}
                          onChange={(e) => setEventDate(e.target.value)}
                          className="w-full text-xs p-2.5 bg-white border border-[#E2DED0] rounded-xl focus:outline-none text-right"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1">ملاحظات أو تفاصيل الحدث (اختياري)</label>
                        <textarea
                          value={eventNotes}
                          onChange={(e) => setEventNotes(e.target.value)}
                          placeholder="مثال: مولود لعائلة آل عبد الله، أو وفاة طبيعية..."
                          rows={2}
                          className="w-full text-xs p-2.5 bg-white border border-[#E2DED0] rounded-xl focus:outline-none resize-none text-right"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-[#4A5D4E] hover:bg-[#3E4C41] text-[#FDFBF7] text-xs font-black py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:translate-y-0.5"
                      >
                        <PlusCircle className="w-4 h-4 text-amber-300" />
                        إضافة السجل وحفظه بالمنصة
                      </button>

                      {showEventSuccess && (
                        <div className="p-2 text-center bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-[10px] font-bold">
                          🎉 تم تسجيل الحدث السكاني وتحديث المخططات والرسوم البيانية فوراً!
                        </div>
                      )}
                    </form>
                  </div>

                  {/* Log View Panel: Col 3-5 */}
                  <div className="lg:col-span-3 space-y-3 text-right">
                    <h5 className="text-xs font-black text-[#2D3A30]">
                      سجلات الوقائع الحيوية المسجلة مخصصاً ({customEvents.length})
                    </h5>
                    
                    <div className="max-h-[360px] overflow-y-auto border border-[#E2DED0] rounded-2xl bg-white divide-y divide-[#F4F1EA]">
                      {customEvents.length > 0 ? (
                        customEvents.map((evt) => (
                          <div key={evt.id} className="p-3 flex items-center justify-between text-xs hover:bg-[#FDFBF7] transition-colors">
                            <button
                              onClick={() => handleDeleteEvent(evt.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                              title="حذف هذا السجل"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <div className="space-y-1 text-right">
                              <div className="flex items-center gap-2 justify-end">
                                <span className="font-extrabold text-[#2D3A30]">{evt.name}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                                  evt.type === 'birth' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-rose-50 text-rose-800 border border-rose-100'
                                }`}>
                                  {evt.type === 'birth' ? '👶 مولود جديد' : '⚰️ حالة وفاة'}
                                </span>
                              </div>
                              <div className="text-[10px] text-gray-400 flex items-center gap-3 justify-end">
                                <span>تاريخ: {evt.date}</span>
                                <span>عام: {evt.year} م</span>
                              </div>
                              {evt.notes && (
                                <p className="text-[10px] text-[#5F6C61] italic">ملاحظة: {evt.notes}</p>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-12 text-center text-gray-400 space-y-2">
                          <Baby className="w-8 h-8 mx-auto text-[#E2DED0]" />
                          <p className="text-xs font-bold text-gray-400">لا توجد وقائع مخصصة مسجلة بعد.</p>
                          <p className="text-[10px] text-gray-400">
                            استخدم النموذج لتسجيل المواليد والوفيات، وستظهر هنا وتنعكس على الرسوم البيانية فوراً.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : reportRows.length > 0 ? (
              <table className="w-full text-right text-xs divide-y divide-[#E2DED0]">
                <thead className="bg-[#FDFBF7] text-[#7A8B7E]">
                  <tr>
                    {reportHeaders.map((head, idx) => (
                      <th key={idx} className="p-3 font-bold">{head}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F4F1EA]">
                  {reportRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#FDFBF7] transition-all">
                      <td className="p-3 font-semibold text-[#3E4C41]">{row.col1}</td>
                      <td className="p-3 text-[#2D3A30] font-bold">{row.col2}</td>
                      <td className="p-3 text-[#3E4C41]">{row.col3}</td>
                      <td className="p-3 text-[#3E4C41] font-mono">{row.col4}</td>
                      <td className="p-3 text-[#7A8B7E]">{row.col5}</td>
                      <td className="p-3 text-[#3E4C41]">{row.col6}</td>
                      <td className="p-3 text-[#3E4C41]">{row.col7}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-12 text-center text-[#7A8B7E]">
                لا توجد بيانات مسجلة تندرج تحت شروط هذا التقرير حالياً.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Elegant Printable Roster Preview Modal */}
      {showPrintPreview && (
        <div className="fixed inset-0 bg-[#2D3A30]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-8 shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowPrintPreview(false)}
              className="absolute top-4 left-4 p-2 text-[#7A8B7E] hover:text-[#2D3A30] hover:bg-[#F4F1EA] rounded-full transition-all cursor-pointer"
            >
              <XIcon className="w-5 h-5" />
            </button>

            {/* Print Layout Sheet */}
            <div className="border border-[#E2DED0] p-8 rounded-2xl bg-white space-y-6 font-sans print:border-0 print:p-0" id="print-sheet">
              {/* Report Header */}
              <div className="flex justify-between items-center border-b-2 border-[#2D3A30] pb-4">
                <div className="text-right">
                  <h2 className="font-extrabold text-[#2D3A30] text-lg">المرصد السكاني والتنمية الأهلية</h2>
                  <p className="text-xs text-[#7A8B7E]">نظام سجل العائلات والخدمات الموحد</p>
                </div>
                <div className="text-left text-xs text-[#7A8B7E]">
                  <div>التاريخ: {new Date().toISOString().split('T')[0]}</div>
                  <div>المصدر: قاعدة البيانات الذاتية</div>
                </div>
              </div>

              {/* Title */}
              <div className="text-center space-y-2">
                <h3 className="font-bold text-[#2D3A30] text-base">
                  {activeReportType === 'support' && 'كشف العوائل والأسر الأكثر استحقاقاً للدعم والضمان الاجتماعي'}
                  {activeReportType === 'health' && 'بيان ورصد أصحاب الاحتياجات الخاصة والمرضى المزمنين بالمنطقة'}
                  {activeReportType === 'unemployment' && 'مسح الكفاءات المعطلة والباحثين عن العمل للتمكين المهني'}
                  {activeReportType === 'education' && 'بيان تفصيلي بأسماء حملة الكفاءات الأكاديمية والشهادات العليا'}
                </h3>
                <p className="text-[11px] text-[#7A8B7E] max-w-md mx-auto">
                  تُعرض هذه البيانات بسرية تامة لغرض التنسيق مع الجمعيات الأهلية والبلدية ومزودي الخدمات في المحلات السكنية.
                </p>
              </div>

              {/* Main Table */}
              <table className="w-full text-right text-[11px] border-collapse border border-[#E2DED0]">
                <thead className="bg-[#F4F1EA]">
                  <tr>
                    {reportHeaders.map((head, idx) => (
                      <th key={idx} className="border border-[#E2DED0] p-2.5 font-bold text-[#2D3A30]">{head}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#FDFBF7]">
                      <td className="border border-[#E2DED0] p-2.5 font-medium text-[#3E4C41]">{row.col1}</td>
                      <td className="border border-[#E2DED0] p-2.5 font-bold text-[#2D3A30]">{row.col2}</td>
                      <td className="border border-[#E2DED0] p-2.5 text-[#3E4C41]">{row.col3}</td>
                      <td className="border border-[#E2DED0] p-2.5 font-mono text-[#3E4C41]">{row.col4}</td>
                      <td className="border border-[#E2DED0] p-2.5 text-[#7A8B7E]">{row.col5}</td>
                      <td className="border border-[#E2DED0] p-2.5 text-[#3E4C41]">{row.col6}</td>
                      <td className="border border-[#E2DED0] p-2.5 text-[#3E4C41]">{row.col7}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Sheet Sign-off */}
              <div className="flex justify-between items-center pt-8 border-t border-[#E2DED0] text-xs text-[#7A8B7E]">
                <div>مستخرج بواسطة: {families.length ? 'مسؤول النظام المعتمد' : 'غير معرّف'}</div>
                <div className="text-center font-bold text-[#2D3A30]">ختم المرصد الأهلي للخدمات</div>
              </div>
            </div>

            {/* Print trigger button */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowPrintPreview(false)}
                className="px-4 py-2 rounded-xl border border-[#E2DED0] text-xs font-semibold text-[#3E4C41] hover:bg-[#F4F1EA] transition-all cursor-pointer"
              >
                إلغاء المعاينة
              </button>
              <button
                onClick={() => handleSimulatedDownload('print')}
                className="px-5 py-2 rounded-xl bg-[#4A5D4E] hover:bg-[#3E4C41] text-[#FDFBF7] text-xs font-bold shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                تأكيد الطباعة والتصدير الورقي
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      {...props}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
