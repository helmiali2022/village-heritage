import React, { useState, useMemo } from 'react';
import { LocalService, ServiceType, ServiceStatus } from '../types';
import { NEIGHBORHOODS } from '../data/mockData';
import { Search, Filter, Plus, MapPin, Phone, User, Settings, Info, HeartPulse, School, ShieldAlert, Compass, Landmark, Building, Star, Trash2, Edit } from 'lucide-react';

interface ServiceRegisterProps {
  services: LocalService[];
  onAddService: () => void;
  onEditService: (service: LocalService) => void;
  onDeleteService: (id: string) => void;
  onLocateOnMap: (service: LocalService) => void;
  isAdmin?: boolean;
}

export default function ServiceRegister({
  services,
  onAddService,
  onEditService,
  onDeleteService,
  onLocateOnMap,
  isAdmin = false
}: ServiceRegisterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('الكل');
  const [selectedType, setSelectedType] = useState('الكل');
  const [selectedStatus, setSelectedStatus] = useState('الكل');

  const getServiceIcon = (type: string) => {
    switch (type) {
      case 'صحي':
        return <HeartPulse className="w-5 h-5 text-[#A98467]" />;
      case 'تعليمي':
        return <School className="w-5 h-5 text-[#4A5D4E]" />;
      case 'أمني':
        return <ShieldAlert className="w-5 h-5 text-[#A98467]" />;
      case 'ديني':
        return <Landmark className="w-5 h-5 text-[#4A5D4E]" />;
      case 'إداري':
        return <Building className="w-5 h-5 text-[#3E4C41]" />;
      default:
        return <Compass className="w-5 h-5 text-[#7A8B7E]" />;
    }
  };

  const getStatusBadge = (status: ServiceStatus) => {
    switch (status) {
      case 'نشط':
        return <span className="bg-[#E9F0E0] text-[#4A5D4E] border border-[#DDE5B6] px-2.5 py-1 rounded-full text-[10px] font-bold">نشط ويخدم المحلة</span>;
      case 'قيد الصيانة':
        return <span className="bg-[#FFF5EB] text-[#A98467] border border-[#E2DED0]/50 px-2.5 py-1 rounded-full text-[10px] font-bold">قيد الصيانة والتطوير</span>;
      default:
        return <span className="bg-[#FDFBF7] text-[#7A8B7E] border border-[#E2DED0] px-2.5 py-1 rounded-full text-[10px] font-medium">مشروع مقترح مستقبلي</span>;
    }
  };

  // Filter service register
  const filteredServices = useMemo(() => {
    let result = [...services];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.name.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q) ||
        (s.contactPerson && s.contactPerson.toLowerCase().includes(q)) ||
        (s.description && s.description.toLowerCase().includes(q))
      );
    }

    if (selectedNeighborhood !== 'الكل') {
      result = result.filter(s => s.neighborhood === selectedNeighborhood);
    }

    if (selectedType !== 'الكل') {
      result = result.filter(s => s.type === selectedType);
    }

    if (selectedStatus !== 'الكل') {
      result = result.filter(s => s.status === selectedStatus);
    }

    return result;
  }, [services, searchQuery, selectedNeighborhood, selectedType, selectedStatus]);

  return (
    <div className="space-y-4 font-sans">
      {/* Controls Bar */}
      <div className="bg-[#F4F1EA] rounded-3xl p-6 border border-[#E2DED0] shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-2.5 text-[#7A8B7E] w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن مدرسة، مستشفى، حديقة، مسجد، أو تخصص خدمة..."
              className="w-full pl-3 pr-9 py-2 rounded-xl border border-[#E2DED0] bg-white text-xs text-[#3E4C41] focus:ring-2 focus:ring-[#4A5D4E]/20 focus:border-[#4A5D4E] transition-all outline-none"
            />
          </div>

          {isAdmin && (
            <button
              onClick={onAddService}
              className="bg-[#4A5D4E] hover:bg-[#3E4C41] text-[#FDFBF7] px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm hover:shadow flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              إضافة مرفق خدمي جديد
            </button>
          )}
        </div>

        {/* Dynamic Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border-t border-[#E2DED0] pt-3">
          <div>
            <label className="block text-[10px] text-[#7A8B7E] mb-1 font-bold">تصنيف المرفق</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2DED0] text-xs bg-white text-[#3E4C41] font-medium"
            >
              <option value="الكل">جميع التصنيفات الخدمية</option>
              <option value="صحي">صحي / طبي</option>
              <option value="تعليمي">تعليمي / مدارس</option>
              <option value="أمني">أمني / طوارئ</option>
              <option value="ديني">ديني / مساجد</option>
              <option value="ترفيهي">ترفيهي / منتزهات</option>
              <option value="إداري">إداري / حكومي</option>
              <option value="خدمي/بلدي">بلدي / أهلي</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-[#7A8B7E] mb-1 font-bold">المحلة</label>
            <select
              value={selectedNeighborhood}
              onChange={(e) => setSelectedNeighborhood(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2DED0] text-xs bg-white text-[#3E4C41] font-medium"
            >
              <option value="الكل">جميع المحلات</option>
              {NEIGHBORHOODS.map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-[#7A8B7E] mb-1 font-bold">حالة التشغيل</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2DED0] text-xs bg-white text-[#3E4C41] font-medium"
            >
              <option value="الكل">جميع حالات المرفق</option>
              <option value="نشط">نشط وعامل</option>
              <option value="قيد الصيانة">قيد الصيانة</option>
              <option value="مقترح / غير مفعل">مقترحات مستقبلية</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid Layout of Local Services */}
      {filteredServices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.map((service) => (
            <div key={service.id} className="bg-white rounded-3xl border border-[#E2DED0] shadow-sm hover:shadow-md transition-all p-6 flex flex-col justify-between group">
              <div className="space-y-4">
                {/* Card Title & Icon */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FDFBF7] border border-[#E2DED0] flex items-center justify-center shrink-0">
                      {getServiceIcon(service.type)}
                    </div>
                    <div>
                      <h4 className="font-bold text-[#2D3A30] text-xs line-clamp-1">{service.name}</h4>
                      <span className="text-[10px] text-[#7A8B7E] mt-0.5 inline-block">{service.type} • {service.neighborhood}</span>
                    </div>
                  </div>
                  {getStatusBadge(service.status)}
                </div>

                {/* Body Text */}
                {service.description && (
                  <p className="text-[#3E4C41] text-[11px] leading-relaxed line-clamp-3">
                    {service.description}
                  </p>
                )}

                {/* Technical stats table */}
                <div className="bg-[#FDFBF7] p-3 rounded-2xl border border-[#E2DED0] space-y-2 text-[11px] text-[#3E4C41]">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#7A8B7E]" />
                    <span className="font-medium truncate">{service.address}</span>
                  </div>

                  {service.capacity && (
                    <div className="flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-[#A98467] fill-[#FFF5EB]" />
                      <span>السعة المقدرة: <strong className="text-[#2D3A30]">{service.capacity}</strong></span>
                    </div>
                  )}

                  {(service.contactPerson || service.phone) && (
                    <div className="flex items-center justify-between border-t border-[#E2DED0]/50 pt-2 mt-1">
                      {service.contactPerson && (
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-[#7A8B7E]" />
                          <span className="text-[#3E4C41]">{service.contactPerson}</span>
                        </div>
                      )}
                      {service.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-[#7A8B7E]" />
                          <span className="font-mono text-[#3E4C41]">{service.phone}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="flex justify-between items-center border-t border-[#F4F1EA] pt-3 mt-4">
                <button
                  onClick={() => onLocateOnMap(service)}
                  className="text-[10px] font-bold text-[#4A5D4E] hover:text-[#2D3A30] flex items-center gap-1 transition-all cursor-pointer"
                >
                  <MapPin className="w-3 h-3" />
                  تحديد الموقع على الخريطة
                </button>

                {isAdmin && (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => onEditService(service)}
                      className="p-1.5 rounded border border-[#E2DED0] text-[#7A8B7E] hover:text-[#A98467] hover:bg-[#F4F1EA] transition-all cursor-pointer"
                      title="تعديل المرفق"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteService(service.id)}
                      className="p-1.5 rounded border border-[#E2DED0] text-[#7A8B7E] hover:text-red-600 hover:bg-[#F4F1EA] transition-all cursor-pointer"
                      title="حذف المرفق"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center text-[#7A8B7E] bg-white border border-[#E2DED0] rounded-3xl flex flex-col items-center justify-center space-y-3">
          <Info className="w-12 h-12 text-[#E2DED0]" />
          <div>
            <p className="font-semibold text-[#2D3A30] text-sm">لا توجد خدمات مطابقة للبحث</p>
            <p className="text-xs text-[#7A8B7E] mt-1">يرجى تعديل الفلاتر أو إضافة خدمة جديدة للمحلة.</p>
          </div>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedNeighborhood('الكل');
              setSelectedType('الكل');
              setSelectedStatus('الكل');
            }}
            className="text-xs text-[#4A5D4E] font-semibold hover:underline cursor-pointer"
          >
            مسح فلاتر الخدمات
          </button>
        </div>
      )}
    </div>
  );
}
