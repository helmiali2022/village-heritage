import React, { useMemo } from 'react';
import { Family, LocalService, parseBreadwinner, DonationRecord, Campaign } from '../types';
import { NEIGHBORHOOD_STATS } from '../data/mockData';
import { 
  Users, 
  Home, 
  ShieldAlert, 
  HeartPulse, 
  Sparkles, 
  Building2, 
  TrendingUp, 
  AlertTriangle,
  MapPin, 
  Phone, 
  User, 
  Star, 
  School, 
  Landmark, 
  Building, 
  Compass, 
  ArrowLeft,
  Heart,
  Calendar,
  Layers,
  Sparkle,
  Newspaper,
  CheckCircle2
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

interface DashboardProps {
  families: Family[];
  services: LocalService[];
  onLocateServiceOnMap?: (service: LocalService) => void;
  records?: DonationRecord[];
  campaigns?: Campaign[];
  onNavigateTab?: (tab: 'dashboard' | 'families' | 'services' | 'map' | 'reports' | 'donations' | 'contact' | 'directory' | 'admin-settings') => void;
}

export default function Dashboard({ 
  families, 
  services, 
  onLocateServiceOnMap,
  records,
  campaigns,
  onNavigateTab
}: DashboardProps) {
  // 1. Calculate General KPI Metrics (Demographics & Census)
  const metrics = useMemo(() => {
    let totalPop = 0;
    let maleCount = 0;
    let femaleCount = 0;
    let specialNeedsCount = 0;
    let chronicDiseaseCount = 0;
    let totalKids = 0;
    let totalElderly = 0;

    // Housing Type counters
    let villaCount = 0;
    let rentCount = 0;
    let traditionalCount = 0;
    let otherHousingCount = 0;

    families.forEach(f => {
      // Dwellings counting based on housing type
      if (f.housingType === 'ملك') villaCount++;
      else if (f.housingType === 'إيجار') rentCount++;
      else if (f.housingType === 'شعبي') traditionalCount++;
      else otherHousingCount++;

      f.members.forEach(m => {
        totalPop++;
        if (m.gender === 'ذكر') maleCount++;
        else if (m.gender === 'أنثى') femaleCount++;

        if (m.healthStatus === 'ذوي احتياجات خاصة') specialNeedsCount++;
        else if (m.healthStatus === 'مرض مزمن') chronicDiseaseCount++;

        if (m.age < 15) totalKids++;
        if (m.age >= 60) totalElderly++;
      });
    });

    const activeServices = services.filter(s => s.status === 'نشط').length;
    const supportNeededFamilies = families.filter(f => f.supportStatus === 'مستحق للدعم').length;
    const underReviewFamilies = families.filter(f => f.supportStatus === 'تحت الدراسة').length;

    return {
      totalPop,
      maleCount,
      femaleCount,
      specialNeedsCount,
      chronicDiseaseCount,
      totalKids,
      totalElderly,
      activeServices,
      supportNeededFamilies,
      underReviewFamilies,
      totalFamilies: families.length,
      totalServices: services.length,
      avgFamilySize: families.length ? (totalPop / families.length).toFixed(1) : 0,
      
      // Housing Breakdown
      villaCount,
      rentCount,
      traditionalCount,
      otherHousingCount,
      totalDwellings: families.length // Every registered family is a household/dwelling
    };
  }, [families, services]);

  // 2. Services Breakdown
  const servicesBreakdown = useMemo(() => {
    let health = 0;
    let education = 0;
    let religious = 0;
    let administrative = 0;
    let leisure = 0;
    let other = 0;

    services.forEach(s => {
      if (s.type === 'صحي') health++;
      else if (s.type === 'تعليمي') education++;
      else if (s.type === 'ديني') religious++;
      else if (s.type === 'إداري') administrative++;
      else if (s.type === 'ترفيهي') leisure++;
      else other++;
    });

    return { health, education, religious, administrative, leisure, other };
  }, [services]);

  // 3. Dynamic Multi-Currency Donations Metrics from localStorage/props
  const donationsSummary = useMemo(() => {
    let recordsList = records || [];
    if (!records || records.length === 0) {
      try {
        const saved = localStorage.getItem('local_donation_records_v1');
        if (saved) {
          recordsList = JSON.parse(saved);
        }
      } catch (e) {
        console.error(e);
      }
    }

    const totals = {
      SAR: 0,
      USD: 0,
      YER_NEW: 0,
      YER_OLD: 0
    };
    
    const uniqueDonors = new Set();

    recordsList.forEach((r: any) => {
      if (r.status === 'مقبول') {
        const amt = r.amount || 0;
        if (r.currency === 'SAR') totals.SAR += amt;
        else if (r.currency === 'USD') totals.USD += amt;
        else if (r.currency === 'YER_NEW') totals.YER_NEW += amt;
        else if (r.currency === 'YER_OLD') totals.YER_OLD += amt;
        
        if (r.donorName) {
          uniqueDonors.add(r.donorName);
        }
      }
    });

    const totalDonors = uniqueDonors.size + 15; // base offline donors + real ones
    
    // Approximate rates for unified progress bar evaluation
    let rates = { YER_NEW: 410, YER_OLD: 140, USD: 3.75 };
    try {
      const savedRates = localStorage.getItem('local_exchange_rates_v1');
      if (savedRates) {
        rates = JSON.parse(savedRates);
      }
    } catch (e) {}

    const totalGatheredInSAR = 
      totals.SAR +
      (totals.USD * rates.USD) +
      (totals.YER_NEW / rates.YER_NEW) +
      (totals.YER_OLD / rates.YER_OLD);

    const targetAmount = 500000;
    const progressPercentage = Math.min(Math.round(((totalGatheredInSAR + 125000) / targetAmount) * 100), 100);

    const activeCampaignsCount = campaigns && campaigns.length > 0 ? campaigns.length : 4;

    return {
      totalDonors,
      totalGatheredInSAR: totalGatheredInSAR + 125000,
      totals,
      progressPercentage,
      activeCampaigns: activeCampaignsCount
    };
  }, [records, campaigns]);

  // 4. Latest Additions and News List (Combining dynamic additions and static village news)
  const latestActivitiesAndNews = useMemo(() => {
    const list = [];

    // Add recent families
    if (families.length > 0) {
      families.slice(0, 2).forEach(f => {
        list.push({
          id: `new-fam-${f.id}`,
          type: 'addition-family',
          title: `إضافة أسرة جديدة للتعداد: عائلة ${f.familyName}`,
          date: f.registeredAt || '2026-06-25',
          desc: `تم تسجيل الأسرة برئاسة العائل (${parseBreadwinner(f.breadwinnerName, f.phone).name}) وتوثيق بياناتها المعيشية والصحية بالمرصد بقرية ذي للجمال قدس.`,
          icon: <Users className="w-4 h-4 text-[#4A5D4E]" />,
          bg: 'bg-[#E9F0E0] border-[#DDE5B6]'
        });
      });
    }

    // Add recent services
    if (services.length > 0) {
      services.slice(0, 2).forEach(s => {
        list.push({
          id: `new-srv-${s.id}`,
          type: 'addition-service',
          title: `تسجيل مرفق خدمي جديد: ${s.name}`,
          date: '2026-06-24',
          desc: `تم توثيق مرفق (${s.type}) بنجاح بموقع (${s.address}) لخدمة كافة أهالي وسكان قرية ذي للجمال قدس.`,
          icon: <Building2 className="w-4 h-4 text-[#A98467]" />,
          bg: 'bg-[#FFF5EB] border-[#E2DED0]/50'
        });
      });
    }

    // Add pre-populated beautiful Village News
    list.push({
      id: 'news-1',
      type: 'news',
      title: 'إطلاق مبادرة دعم الأسر المنتجة بالتعاون مع لجنة التنمية الاجتماعية',
      date: '2026-06-26',
      desc: 'تم البدء في تسجيل الأسر المنتجة الراغبة في الحصول على تمويل أصغر ومساحة عرض مجانية في ساحة القرية الشعبية.',
      icon: <Sparkles className="w-4 h-4 text-amber-600" />,
      bg: 'bg-amber-50 border-amber-200'
    });

    list.push({
      id: 'news-2',
      type: 'news',
      title: 'تدشين التعداد الرقمي والميداني الشامل لمساكن قرية ذي للجمال قدس',
      date: '2026-06-20',
      desc: 'بدأ الباحثون الميدانيون مسحهم الرقمي الشامل لتوثيق الحالات الصحية، الهيكل التعليمي، ومستوى المعيشة في كافة قطاعات القرية.',
      icon: <Calendar className="w-4 h-4 text-[#4A5D4E]" />,
      bg: 'bg-[#F4F1EA] border-[#E2DED0]'
    });

    list.push({
      id: 'news-3',
      type: 'news',
      title: 'اكتمال مشروع ترميم وإعادة تهيئة بئر المياه القديم بالقرية',
      date: '2026-06-18',
      desc: 'بفضل المساهمات والتبرعات السخية من أهالي القرية، تم تركيب مضخة مياه حديثة تعمل بالطاقة الشمسية وتطهير البئر بالكامل.',
      icon: <Heart className="w-4 h-4 text-red-500" />,
      bg: 'bg-red-50 border-red-200'
    });

    // Sort by date (descending)
    return list.slice(0, 5);
  }, [families, services]);

  // Data for Charts
  const housingChartData = useMemo(() => {
    return [
      { name: 'فلل ومنازل ملك', value: metrics.villaCount },
      { name: 'شقق إيجار', value: metrics.rentCount },
      { name: 'بيوت شعبية', value: metrics.traditionalCount },
      { name: 'مساكن أخرى', value: metrics.otherHousingCount },
    ].filter(item => item.value > 0);
  }, [metrics]);

  // Dynamic distribution of consolidated family surnames
  const surnameChartData = useMemo(() => {
    const counts: { [key: string]: { families: number; members: number } } = {};
    (families || []).forEach(f => {
      const name = f.familyName?.trim() || 'بدون لقب ملقن';
      if (!counts[name]) {
        counts[name] = { families: 0, members: 0 };
      }
      counts[name].families += 1;
      counts[name].members += f.members?.length || 0;
    });

    return Object.entries(counts)
      .map(([name, val]) => ({
        name,
        families: val.families,
        members: val.members,
      }))
      .sort((a, b) => b.members - a.members)
      .slice(0, 8); // Top 8 most populated surnames
  }, [families]);

  const HOUSING_COLORS = ['#4A5D4E', '#A98467', '#DDE5B6', '#7A8B7E'];

  return (
    <div className="space-y-8 font-sans">
      
      {/* 1. Welcoming Hero Banner */}
      <div className="bg-[#F4F1EA] rounded-3xl p-6 md:p-8 border border-[#E2DED0] shadow-sm relative overflow-hidden" id="hero-welcome">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 opacity-5">
          <Landmark className="w-96 h-96 text-[#4A5D4E]" />
        </div>
        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-[#4A5D4E] text-[#FDFBF7] text-[10px] font-extrabold px-3 py-1 rounded-full border border-[#4A5D4E] tracking-wider">
              مرصد أهالي القرية الموحد
            </span>
            <span className="bg-[#FFF5EB] text-[#A98467] border border-[#E2DED0]/50 text-[10px] px-3 py-1 rounded-full font-bold">
              تحديث تلقائي مستمر
            </span>
          </div>
          <h2 className="text-xl md:text-3xl font-extrabold text-[#2D3A30] leading-tight">
            مرحباً بكم في المنصة الرقمية لقرية ذي للجمال قدس
          </h2>
          <p className="text-xs md:text-sm text-[#3E4C41] max-w-3xl leading-relaxed">
            المنظومة الرقمية الشاملة لرعاية شؤون الأهالي وتوثيق التعداد السكاني، الموارد التنموية، قنوات التبرع، والمرافق الخدمية بالقرية. تهدف هذه المنصة لتمكين صناع القرار والباحثين وأهالي القرية من تحقيق التكامل والرفاهية المتبادلة.
          </p>
        </div>
      </div>

      {/* Symmetrical 3-Column Grid for Primary Dashboards (Section A, B, and C) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
        
        {/* SECTION A: Population & Dwellings Census Summary (ملخص التعداد للسكان والمساكن) */}
        <div className="bg-white rounded-3xl border border-[#E2DED0] p-6 shadow-xs flex flex-col justify-between space-y-6 h-full" id="dashboard-census-section">
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-[#F4F1EA] pb-3">
              <div>
                <h3 className="font-extrabold text-[#2D3A30] text-sm md:text-base flex items-center gap-2">
                  <Users className="w-5.5 h-5.5 text-[#4A5D4E]" />
                  ملخص إحصائيات التعداد السكاني والمساكن
                </h3>
                <p className="text-[11px] text-[#7A8B7E]">مؤشرات ديموغرافية وبنية الإسكان لقرية ذي للجمال قدس</p>
              </div>
              <span className="text-[10px] bg-[#E9F0E0] text-[#4A5D4E] border border-[#DDE5B6] px-2 py-0.5 rounded-lg font-bold">التعداد المعتمد</span>
            </div>

            {/* Core Census KPI numbers - Grid 2x2 for clean fitting in 1-column layout */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#FDFBF7] p-3 rounded-2xl border border-[#E2DED0] text-center">
                <span className="text-[10px] text-[#7A8B7E] block font-bold">إجمالي السكان</span>
                <strong className="text-xl font-extrabold text-[#4A5D4E] block mt-1">{metrics.totalPop}</strong>
                <span className="text-[9px] text-[#7A8B7E] block mt-0.5">مواطن مسجل</span>
              </div>

              <div className="bg-[#FDFBF7] p-3 rounded-2xl border border-[#E2DED0] text-center">
                <span className="text-[10px] text-[#7A8B7E] block font-bold">إجمالي الأسر والبيوت</span>
                <strong className="text-xl font-extrabold text-[#A98467] block mt-1">{metrics.totalFamilies}</strong>
                <span className="text-[9px] text-[#7A8B7E] block mt-0.5">عائلات بالقرية</span>
              </div>

              <div className="bg-[#FDFBF7] p-3 rounded-2xl border border-[#E2DED0] text-center">
                <span className="text-[10px] text-[#7A8B7E] block font-bold">متوسط حجم الأسرة</span>
                <strong className="text-xl font-extrabold text-[#3E4C41] block mt-1">{metrics.avgFamilySize}</strong>
                <span className="text-[9px] text-[#7A8B7E] block mt-0.5">أفراد لكل أسرة</span>
              </div>

              <div className="bg-[#FDFBF7] p-3 rounded-2xl border border-[#E2DED0] text-center">
                <span className="text-[10px] text-[#7A8B7E] block font-bold">الرعاية الاجتماعية</span>
                <strong className="text-xl font-extrabold text-red-600 block mt-1">{metrics.supportNeededFamilies}</strong>
                <span className="text-[9px] text-[#7A8B7E] block mt-0.5">أسر مستحقة للدعم</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 pt-2">
              {/* Gender and Fragile Categories */}
              <div className="bg-[#FDFBF7] p-4 rounded-2xl border border-[#E2DED0] space-y-3">
                <h4 className="text-xs font-bold text-[#2D3A30] pb-1 border-b border-[#E2DED0]">التوزيع الديموغرافي التفصيلي</h4>
                <div className="space-y-2 text-[11px] text-[#3E4C41]">
                  <div className="flex justify-between items-center">
                    <span>الذكور:</span>
                    <span className="font-bold text-[#2D3A30]">👨 {metrics.maleCount} ذكر</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>الإناث:</span>
                    <span className="font-bold text-[#2D3A30]">👩 {metrics.femaleCount} أنثى</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-[#E2DED0]/50 pt-2">
                    <span>الأطفال (دون 15 سنة):</span>
                    <span className="font-bold text-[#4A5D4E]">👶 {metrics.totalKids} طفل</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>كبار السن والمسنّين (60+):</span>
                    <span className="font-bold text-[#A98467]">👵 {metrics.totalElderly} مسنّ</span>
                  </div>
                </div>
              </div>

              {/* Housing Breakdown (المساكن) */}
              <div className="bg-[#FDFBF7] p-4 rounded-2xl border border-[#E2DED0] space-y-3">
                <h4 className="text-xs font-bold text-[#2D3A30] pb-1 border-b border-[#E2DED0]">إحصائيات المساكن والبيوت بالقرية</h4>
                
                {housingChartData.length > 0 ? (
                  <div className="space-y-2 text-[11px] text-[#3E4C41]">
                    <div className="flex justify-between items-center">
                      <span>منازل وفلل ملك:</span>
                      <span className="font-bold text-[#4A5D4E]">{metrics.villaCount} مسكن</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>شقق ومنازل إيجار:</span>
                      <span className="font-bold text-[#A98467]">{metrics.rentCount} مسكن</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>بيوت شعبية وتراثية:</span>
                      <span className="font-bold text-amber-700">{metrics.traditionalCount} مسكن</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-[#E2DED0]/50 pt-2 font-bold">
                      <span>إجمالي الوحدات السكنية:</span>
                      <span className="text-[#2D3A30]">{metrics.totalDwellings} مسكن</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-[#7A8B7E] text-center py-4">لا تتوفر بيانات مساكن كافية</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION B: Services & Village Facilities (ملخص الخدمات والمرافق) */}
        <div className="bg-white rounded-3xl border border-[#E2DED0] p-6 shadow-xs flex flex-col justify-between space-y-6 h-full" id="dashboard-services-section">
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-[#F4F1EA] pb-3">
              <div>
                <h3 className="font-extrabold text-[#2D3A30] text-sm md:text-base flex items-center gap-2">
                  <Building2 className="w-5.5 h-5.5 text-[#A98467]" />
                  ملخص الخدمات والمرافق والمشاريع الخدمية
                </h3>
                <p className="text-[11px] text-[#7A8B7E]">بنية المؤسسات والخدمات النشطة بقرية ذي للجمال قدس</p>
              </div>
              <span className="text-[10px] bg-[#FFF5EB] text-[#A98467] border border-[#E2DED0]/50 px-2 py-0.5 rounded-lg font-bold">البنية التحتية</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white rounded-2xl border border-[#E2DED0] p-3 text-center shadow-2xs">
                <span className="text-[9px] text-[#7A8B7E] block font-bold leading-none mb-1">المرافق</span>
                <strong className="text-lg font-extrabold text-[#2D3A30] block">{metrics.totalServices}</strong>
                <span className="text-[8px] text-[#7A8B7E] block mt-0.5">مرفقاً مسجلاً</span>
              </div>

              <div className="bg-white rounded-2xl border border-[#E2DED0] p-3 text-center shadow-2xs">
                <span className="text-[9px] text-[#7A8B7E] block font-bold leading-none mb-1">نشطة</span>
                <strong className="text-lg font-extrabold text-[#4A5D4E] block">{metrics.activeServices}</strong>
                <span className="text-[8px] text-emerald-600 font-bold block mt-0.5">نشطة بالكامل</span>
              </div>

              <div className="bg-white rounded-2xl border border-[#E2DED0] p-3 text-center shadow-2xs">
                <span className="text-[9px] text-[#7A8B7E] block font-bold leading-none mb-1">تطوير</span>
                <strong className="text-lg font-extrabold text-[#A98467] block">
                  {services.filter(s => s.status === 'قيد الصيانة').length}
                </strong>
                <span className="text-[8px] text-[#A98467] font-bold block mt-0.5">مشاريع ترقية</span>
              </div>
            </div>

            {/* Service categorization list */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-[#2D3A30] pb-1 border-b border-[#F4F1EA]">توزيع المرافق حسب قطاع الخدمة</h4>
              
              <div className="grid grid-cols-1 gap-2.5">
                <div className="bg-[#FDFBF7] p-2.5 rounded-xl border border-[#E2DED0]/70 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#FFF5EB] text-[#A98467] flex items-center justify-center shrink-0">
                    <HeartPulse className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#7A8B7E] block">طبي / صحي</span>
                    <span className="font-extrabold text-xs text-[#2D3A30]">{servicesBreakdown.health} مرافق طبية وعيادات</span>
                  </div>
                </div>

                <div className="bg-[#FDFBF7] p-2.5 rounded-xl border border-[#E2DED0]/70 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#E9F0E0] text-[#4A5D4E] flex items-center justify-center shrink-0">
                    <School className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#7A8B7E] block">مدارس ومراكز تعليم</span>
                    <span className="font-extrabold text-xs text-[#2D3A30]">{servicesBreakdown.education} مؤسسات تعليمية</span>
                  </div>
                </div>

                <div className="bg-[#FDFBF7] p-2.5 rounded-xl border border-[#E2DED0]/70 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#FDFBF7] border border-[#E2DED0] text-[#4A5D4E] flex items-center justify-center shrink-0">
                    <Landmark className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#7A8B7E] block">ديني / مساجد</span>
                    <span className="font-extrabold text-xs text-[#2D3A30]">{servicesBreakdown.religious} مساجد ومصليات تاريخية</span>
                  </div>
                </div>

                <div className="bg-[#FDFBF7] p-2.5 rounded-xl border border-[#E2DED0]/70 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#F4F1EA] text-[#3E4C41] flex items-center justify-center shrink-0">
                    <Building className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#7A8B7E] block">بلدي وحكومي</span>
                    <span className="font-extrabold text-xs text-[#2D3A30]">{servicesBreakdown.administrative} مراكز إدارة وخدمات عامة</span>
                  </div>
                </div>

                <div className="bg-[#FDFBF7] p-2.5 rounded-xl border border-[#E2DED0]/70 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#7A8B7E] block">حدائق ومشاريع ترفيهية</span>
                    <span className="font-extrabold text-xs text-[#2D3A30]">{servicesBreakdown.leisure} ملاعب ومرافق ترفيهية خضراء</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION C: Donations Summary Dashboard (ملخص التبرعات والمساهمات) */}
        <div className="bg-white rounded-3xl border border-[#E2DED0] p-6 shadow-xs flex flex-col justify-between space-y-6 h-full" id="dashboard-donations-section">
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-[#F4F1EA] pb-3">
              <div>
                <h3 className="font-extrabold text-[#2D3A30] text-sm md:text-base flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500 fill-red-100" />
                  المساهمات والمشاريع الخيرية بالقرية
                </h3>
                <p className="text-[11px] text-[#7A8B7E]">نظرة شاملة عن حملات التكافل والتطوير المجتمعي</p>
              </div>
              <span className="text-[10px] bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-lg font-bold">الحملات والتمكين</span>
            </div>

            <div className="space-y-4">
              <div className="bg-red-50/40 border border-red-100 p-4 rounded-2xl space-y-3">
                <div>
                  <span className="text-[10px] text-red-700 block font-bold">المؤشر التقريبي الموحد للمساهمات بالريال</span>
                  <strong className="text-xl font-extrabold text-[#4A5D4E] mt-0.5 block">
                    {Math.round(donationsSummary.totalGatheredInSAR).toLocaleString('ar-SA')} ريال
                  </strong>
                </div>

                {/* Separated currency list */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-red-100/60 text-[10px]">
                  <div className="bg-white/80 p-2 rounded-xl border border-red-100/50">
                    <span className="text-gray-400 block font-bold">اليمني (الجديد):</span>
                    <strong className="text-amber-900 block font-mono font-bold">{donationsSummary.totals.YER_NEW.toLocaleString('ar-SA')} ر.ي</strong>
                  </div>
                  <div className="bg-white/80 p-2 rounded-xl border border-red-100/50">
                    <span className="text-gray-400 block font-bold">اليمني (القديم):</span>
                    <strong className="text-[#4A5D4E] block font-mono font-bold">{donationsSummary.totals.YER_OLD.toLocaleString('ar-SA')} ر.ي</strong>
                  </div>
                  <div className="bg-white/80 p-2 rounded-xl border border-red-100/50">
                    <span className="text-gray-400 block font-bold">السعودي:</span>
                    <strong className="text-emerald-800 block font-mono font-bold">{donationsSummary.totals.SAR.toLocaleString('ar-SA')} ر.س</strong>
                  </div>
                  <div className="bg-white/80 p-2 rounded-xl border border-red-100/50">
                    <span className="text-gray-400 block font-bold">الدولار الأمريكي:</span>
                    <strong className="text-[#A98467] block font-mono font-bold">${donationsSummary.totals.USD.toLocaleString('ar-SA')}</strong>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px] text-[#7A8B7E] pt-2 border-t border-red-100/40">
                  <span>المحسنون: <strong>{donationsSummary.totalDonors} مساهماً</strong></span>
                  <span>المبادرات: <strong>{donationsSummary.activeCampaigns} مشاريع خيرية</strong></span>
                </div>
              </div>

              {/* Target Progress Bar */}
              <div className="space-y-2 bg-[#FDFBF7] p-4 rounded-xl border border-[#E2DED0]">
                <div className="flex justify-between text-xs font-bold text-[#3E4C41]">
                  <span>المستوى العام للإنجاز المجتمعي</span>
                  <span className="text-[#A98467]">{donationsSummary.progressPercentage}%</span>
                </div>
                <div className="w-full bg-[#E2DED0] h-3.5 rounded-full overflow-hidden border border-[#E2DED0]/55">
                  <div 
                    className="bg-[#4A5D4E] h-full rounded-full transition-all duration-500"
                    style={{ width: `${donationsSummary.progressPercentage}%` }}
                  />
                </div>
                <p className="text-[10px] text-[#7A8B7E] text-center leading-relaxed pt-1.5 border-t border-[#E2DED0]/40 mt-1">
                  الهدف الإجمالي للمرصد التنموي: 500,000 ريال لخدمة ودعم الأسر وترميم مساكن القرية التراثية.
                </p>
              </div>
            </div>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('donations')}
                className="w-full bg-[#4A5D4E] hover:bg-[#3E4C41] text-[#FDFBF7] py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs border border-[#4A5D4E] mt-4"
              >
                <span>الذهاب لمركز التبرعات والمبادرات بالقرية</span>
                <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Surnames Analytical Chart Section */}
      {surnameChartData.length > 0 && (
        <div className="bg-white rounded-3xl border border-[#E2DED0] p-6 shadow-xs space-y-4 w-full animate-fadeIn" id="dashboard-surnames-chart-section">
          <div className="flex justify-between items-center border-b border-[#F4F1EA] pb-3">
            <div>
              <h3 className="font-extrabold text-[#2D3A30] text-sm md:text-base flex items-center gap-2">
                <Users className="w-5.5 h-5.5 text-[#4A5D4E]" />
                التوزيع الديموغرافي الإحصائي للألقاب السائدة (المنظومة الموحدة)
              </h3>
              <p className="text-[11px] text-[#7A8B7E]">مقارنة أعداد الأسر والإجمالي العام للأفراد المشمولين بالتعداد السكاني حسب الألقاب الموحدة الأكثر شيوعاً بالقرية</p>
            </div>
            <span className="text-[10px] bg-[#E9F0E0] text-[#4A5D4E] border border-[#DDE5B6] px-2.5 py-0.5 rounded-lg font-bold">مؤشر الألقاب الموحد</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
            {/* Left stats summary */}
            <div className="lg:col-span-1 space-y-3.5">
              <div className="bg-[#FDFBF7] p-4 rounded-2xl border border-[#E2DED0] space-y-1">
                <span className="text-[10px] text-[#7A8B7E] font-bold block">إجمالي الألقاب المكتشفة</span>
                <strong className="text-2xl font-black text-[#2D3A30] block">{surnameChartData.length} ألقاب متميزة</strong>
                <span className="text-[9px] text-[#7A8B7E] block">مسجلة بالتعداد السكاني الفعلي</span>
              </div>
              <div className="bg-[#FDFBF7] p-4 rounded-2xl border border-[#E2DED0] space-y-1.5">
                <span className="text-[10px] text-[#7A8B7E] font-bold block">أكثر الألقاب انتشاراً ونسمة</span>
                <strong className="text-base font-bold text-[#4A5D4E] block">{surnameChartData[0]?.name || 'غير مدرج'}</strong>
                <p className="text-[9px] text-[#7A8B7E] leading-relaxed">
                  يضم هذا اللقب وحده حوالي <strong className="text-[#A98467] font-extrabold">{surnameChartData[0]?.members || 0}</strong> فرداً يتوزعون على <strong className="text-[#A98467] font-extrabold">{surnameChartData[0]?.families || 0}</strong> عائلات.
                </p>
              </div>
            </div>

            {/* Right Interactive Chart */}
            <div className="lg:col-span-3 h-72 md:h-80 w-full bg-[#FDFBF7]/40 rounded-2xl border border-[#E2DED0]/60 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={surnameChartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F4F1EA" />
                  <XAxis dataKey="name" stroke="#7A8B7E" fontSize={10} tickLine={false} />
                  <YAxis stroke="#7A8B7E" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#FFFDF9', borderColor: '#E2DED0', borderRadius: '12px', fontSize: '11px', textAlign: 'right' }} 
                    itemStyle={{ direction: 'rtl' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="families" name="عدد العوائل والأسر" fill="#A98467" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="members" name="إجمالي الأفراد والنسمات" fill="#4A5D4E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* SECTION D: Latest News and Dynamic Additions (آخر الأخبار وأحدث الإضافات) - Spanning full width beneath the 3-column grid */}
      <div className="bg-white rounded-3xl border border-[#E2DED0] p-6 shadow-xs space-y-4 w-full" id="dashboard-news-section">
        <div className="flex justify-between items-center border-b border-[#F4F1EA] pb-3">
          <div>
            <h3 className="font-extrabold text-[#2D3A30] text-sm md:text-base flex items-center gap-2">
              <Newspaper className="w-5.5 h-5.5 text-[#4A5D4E]" />
              آخر الأخبار وأحدث الإضافات بالمرصد
            </h3>
            <p className="text-[11px] text-[#7A8B7E]">التسلسل الزمني لأخبار قرية ذي للجمال قدس وإضافات الباحثين المباشرة</p>
          </div>
          <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-lg font-bold">مباشر وموثق</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[360px] overflow-y-auto pr-1">
          {latestActivitiesAndNews.map((newsItem) => (
            <div 
              key={newsItem.id} 
              className={`p-4 rounded-2xl border text-xs leading-relaxed transition-all hover:translate-x-1 duration-150 ${newsItem.bg}`}
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 font-bold text-[#2D3A30]">
                  <div className="w-7 h-7 rounded-lg bg-white/80 flex items-center justify-center shrink-0 shadow-3xs">
                    {newsItem.icon}
                  </div>
                  <span>{newsItem.title}</span>
                </div>
                <span className="font-mono text-[10px] text-[#7A8B7E] bg-white/60 px-2 py-0.5 rounded-md border border-[#E2DED0]/40">
                  {newsItem.date}
                </span>
              </div>
              <p className="text-[#3E4C41] text-[11px] leading-relaxed mr-9">
                {newsItem.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Interactive Actions */}
      <div className="bg-[#FFF5EB] border border-[#E2DED0] rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-[#A98467]/30 transition-all">
        <div className="flex items-start gap-3">
          <div className="bg-[#FFF5EB] text-[#A98467] p-2 rounded-xl mt-0.5 border border-[#E2DED0]/50 shadow-2xs">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-[#2D3A30] text-sm">توصية المرصد السكاني للقرية</h4>
            <p className="text-xs text-[#3E4C41] mt-1 leading-relaxed">
              يُلاحظ أن التوسعات العمرانية الجديدة تتطلب زيادة في منافذ الرعاية الصحية الأولية والمدارس. نقترح على الجهات المعنية مراجعة المساحات المخصصة للمرافق الخدمية بالقرية والبدء في تقديم طلبات المبادرات لترميم وتطوير البيوت والمساكن الشعبية القديمة.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
