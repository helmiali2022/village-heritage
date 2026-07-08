import React, { useState, useMemo } from 'react';
import { LocalService } from '../types';
import { NEIGHBORHOODS } from '../data/mockData';
import { 
  Search, 
  MapPin, 
  Phone, 
  User, 
  Compass, 
  HeartPulse, 
  School, 
  ShieldAlert, 
  Landmark, 
  Building, 
  Star, 
  Info,
  Calendar,
  Clock
} from 'lucide-react';

interface VillageDirectoryProps {
  services: LocalService[];
  onLocateOnMap: (service: LocalService) => void;
}

export default function VillageDirectory({ services, onLocateOnMap }: VillageDirectoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('الكل');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('الكل');

  // Filter local services for the public directory
  const filteredServices = useMemo(() => {
    let result = [...services];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.name.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q))
      );
    }

    if (selectedType !== 'الكل') {
      result = result.filter(s => s.type === selectedType);
    }

    if (selectedNeighborhood !== 'الكل') {
      result = result.filter(s => s.neighborhood === selectedNeighborhood);
    }

    return result;
  }, [services, searchQuery, selectedType, selectedNeighborhood]);

  const getServiceIcon = (type: string) => {
    switch (type) {
      case 'صحي':
        return <HeartPulse className="w-6 h-6 text-[#A98467]" />;
      case 'تعليمي':
        return <School className="w-6 h-6 text-[#4A5D4E]" />;
      case 'أمني':
        return <ShieldAlert className="w-6 h-6 text-[#A98467]" />;
      case 'ديني':
        return <Landmark className="w-6 h-6 text-[#4A5D4E]" />;
      case 'إداري':
        return <Building className="w-6 h-6 text-[#3E4C41]" />;
      default:
        return <Compass className="w-6 h-6 text-[#7A8B7E]" />;
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Directory Header Banner */}
      <div className="bg-[#4A5D4E] text-[#FDFBF7] rounded-3xl p-6 md:p-8 shadow-md relative overflow-hidden">
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-10">
          <Compass className="w-64 h-64 text-[#DDE5B6]" />
        </div>
        <div className="relative z-10 max-w-2xl space-y-2">
          <span className="bg-[#DDE5B6] text-[#4A5D4E] text-[10px] uppercase font-extrabold px-2.5 py-1 rounded-full border border-[#DDE5B6]">
            دليل الخدمات والمرافق لقرية ذي للجمال قدس
          </span>
          <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">الدليل الرقمي الموحد</h2>
          <p className="text-xs md:text-sm text-[#E9F0E0] leading-relaxed">
            استكشف واكتشف جميع المرافق والمؤسسات الحكومية والتعليمية والدينية والطبية والخدمية المعتمدة التي تخدم الأهالي في القرية. يمكنك التصفح السريع والبحث وتحديد المواقع الميدانية على الخريطة.
          </p>
        </div>
      </div>

      {/* Searching and Category Filters */}
      <div className="bg-white rounded-3xl p-6 border border-[#E2DED0] shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-3.5 top-3 text-[#7A8B7E] w-4.5 h-4.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم المرفق أو الخدمة، مثال: مدرسة، مستوصف، مسجد..."
              className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-[#E2DED0] bg-[#FDFBF7] text-xs text-[#2D3A30] focus:ring-2 focus:ring-[#4A5D4E]/20 focus:border-[#4A5D4E] transition-all outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 rounded-xl border border-[#E2DED0] bg-[#FDFBF7] text-xs text-[#3E4C41] font-bold outline-none"
            >
              <option value="الكل">كل التصنيفات</option>
              <option value="صحي">صحي / طبي</option>
              <option value="تعليمي">تعليمي / مدارس</option>
              <option value="أمني">أمني / طوارئ</option>
              <option value="ديني">ديني / مساجد</option>
              <option value="إداري">إداري وحكومي</option>
              <option value="ترفيهي">ترفيهي وحدائق</option>
              <option value="خدمي/بلدي">خدمي وبلدي</option>
            </select>

            <select
              value={selectedNeighborhood}
              onChange={(e) => setSelectedNeighborhood(e.target.value)}
              className="px-3 py-2 rounded-xl border border-[#E2DED0] bg-[#FDFBF7] text-xs text-[#3E4C41] font-bold outline-none"
            >
              <option value="الكل">كل القطاعات والأحياء</option>
              {NEIGHBORHOODS.map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Directory Cards Grid */}
      {filteredServices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map(service => (
            <div 
              key={service.id} 
              className="bg-white rounded-3xl border border-[#E2DED0] p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden group"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#FDFBF7] border border-[#E2DED0] flex items-center justify-center shrink-0">
                    {getServiceIcon(service.type)}
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    service.status === 'نشط' 
                      ? 'bg-[#E9F0E0] text-[#4A5D4E] border border-[#DDE5B6]' 
                      : service.status === 'قيد الصيانة' 
                      ? 'bg-[#FFF5EB] text-[#A98467] border border-[#E2DED0]/50' 
                      : 'bg-[#F4F1EA] text-[#7A8B7E] border border-[#E2DED0]'
                  }`}>
                    {service.status}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="font-extrabold text-[#2D3A30] text-sm md:text-base leading-snug">{service.name}</h3>
                  <div className="flex items-center gap-1.5 text-[10px] text-[#7A8B7E] font-medium">
                    <span>{service.type}</span>
                    <span>•</span>
                    <span>{service.neighborhood}</span>
                  </div>
                </div>

                {service.description && (
                  <p className="text-xs text-[#3E4C41] leading-relaxed line-clamp-3">
                    {service.description}
                  </p>
                )}

                {/* Info summary */}
                <div className="bg-[#FDFBF7] rounded-2xl border border-[#E2DED0]/70 p-3 space-y-2 text-[11px] text-[#3E4C41]">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#A98467]" />
                    <span className="font-semibold text-[#2D3A30] truncate">{service.address}</span>
                  </div>
                  {service.capacity && (
                    <div className="flex items-center gap-2">
                      <Star className="w-3.5 h-3.5 text-[#4A5D4E]" />
                      <span>السعة والاستيعاب: <strong className="text-[#2D3A30]">{service.capacity}</strong></span>
                    </div>
                  )}
                  {service.phone && (
                    <div className="flex items-center gap-2 font-mono">
                      <Phone className="w-3.5 h-3.5 text-[#7A8B7E]" />
                      <span>{service.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-[#F4F1EA] pt-4 mt-4">
                <button
                  onClick={() => onLocateOnMap(service)}
                  className="w-full text-center bg-[#4A5D4E] hover:bg-[#3E4C41] text-[#FDFBF7] py-2 rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  رؤية وتحديد الموقع على الخريطة
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-3xl border border-[#E2DED0] p-6 space-y-3">
          <div className="w-16 h-16 rounded-full bg-[#FFF5EB] text-[#A98467] flex items-center justify-center mx-auto text-xl font-bold">🔍</div>
          <h4 className="font-bold text-[#2D3A30] text-sm">عذراً، لم نجد أي مرافق تطابق بحثك</h4>
          <p className="text-xs text-[#7A8B7E] max-w-sm mx-auto leading-relaxed">
            تأكد من كتابة الكلمة بشكل صحيح، أو قم بتغيير تصنيف المرفق لنتائج أشمل.
          </p>
        </div>
      )}
    </div>
  );
}
