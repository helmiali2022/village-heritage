import React, { useState, useEffect } from 'react';
import { LocalService, ServiceType, ServiceStatus } from '../types';
import { NEIGHBORHOODS } from '../data/mockData';
import { Save, X } from 'lucide-react';

interface ServiceFormProps {
  service?: LocalService | null;
  onSave: (service: LocalService) => void;
  onCancel: () => void;
}

export default function ServiceForm({ service, onSave, onCancel }: ServiceFormProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<ServiceType>('صحي');
  const [neighborhood, setNeighborhood] = useState(NEIGHBORHOODS[0]);
  const [address, setAddress] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<ServiceStatus>('نشط');
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState('');
  const [latitude, setLatitude] = useState(50);
  const [longitude, setLongitude] = useState(50);

  useEffect(() => {
    if (service) {
      setName(service.name);
      setType(service.type);
      setNeighborhood(service.neighborhood);
      setAddress(service.address);
      setContactPerson(service.contactPerson || '');
      setPhone(service.phone || '');
      setStatus(service.status);
      setDescription(service.description || '');
      setCapacity(service.capacity || '');
      setLatitude(service.latitude);
      setLongitude(service.longitude);
    } else {
      setName('');
      setType('صحي');
      setNeighborhood(NEIGHBORHOODS[0]);
      setAddress('');
      setContactPerson('');
      setPhone('');
      setStatus('نشط');
      setDescription('');
      setCapacity('');
      setLatitude(Math.floor(Math.random() * 60) + 20);
      setLongitude(Math.floor(Math.random() * 60) + 20);
    }
  }, [service]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !address) {
      alert('الرجاء تعبئة اسم الخدمة والعنوان');
      return;
    }

    const savedService: LocalService = {
      id: service?.id || `srv-${Date.now()}`,
      name,
      type,
      neighborhood,
      address,
      contactPerson: contactPerson || undefined,
      phone: phone || undefined,
      status,
      description: description || undefined,
      capacity: capacity || undefined,
      latitude,
      longitude
    };

    onSave(savedService);
  };

  return (
    <div className="bg-white rounded-3xl border border-[#E2DED0] shadow-sm p-6 max-w-2xl mx-auto font-sans" id="service-form-card">
      <div className="flex justify-between items-center border-b border-[#E2DED0] pb-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-[#2D3A30]">
            {service ? `تعديل المرفق: ${name}` : 'إضافة مرفق خدمي/بلدي جديد'}
          </h3>
          <p className="text-xs text-[#7A8B7E] mt-0.5">
            الرجاء توفير البيانات الجغرافية والتفصيلية لتسهيل وصول سكان المنطقة للمرفق.
          </p>
        </div>
        <button
          onClick={onCancel}
          className="p-1.5 rounded-lg text-[#7A8B7E] hover:text-[#2D3A30] hover:bg-[#F4F1EA] transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#3E4C41] mb-1">اسم المرفق / الخدمة <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: مدرسة الفاروق المتوسطة"
              className="w-full px-3 py-2 rounded-xl border border-[#E2DED0] text-xs bg-white text-[#2D3A30] focus:ring-2 focus:ring-[#4A5D4E]/20 focus:border-[#4A5D4E] transition-all outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#3E4C41] mb-1">نوع ومجال الخدمة</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ServiceType)}
              className="w-full px-3 py-2 rounded-xl border border-[#E2DED0] text-xs bg-white text-[#2D3A30] focus:ring-2 focus:ring-[#4A5D4E]/20 focus:border-[#4A5D4E] transition-all outline-none"
            >
              <option value="صحي">صحي / طبي</option>
              <option value="تعليمي">تعليمي / مدارس</option>
              <option value="أمني">أمني / طوارئ</option>
              <option value="ديني">ديني / مساجد</option>
              <option value="ترفيهي">ترفيهي / منتزهات</option>
              <option value="إداري">إداري / حكومي</option>
              <option value="تجاري">تجاري / أسواق</option>
              <option value="خدمي/بلدي">بلدي / جمعية تنمية</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#3E4C41] mb-1">المحلة</label>
            <select
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#E2DED0] text-xs bg-white text-[#2D3A30] focus:ring-2 focus:ring-[#4A5D4E]/20 focus:border-[#4A5D4E] transition-all outline-none"
            >
              {NEIGHBORHOODS.map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#3E4C41] mb-1">حالة التشغيل الحالية</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ServiceStatus)}
              className="w-full px-3 py-2 rounded-xl border border-[#E2DED0] text-xs bg-white text-[#2D3A30] focus:ring-2 focus:ring-[#4A5D4E]/20 focus:border-[#4A5D4E] transition-all outline-none"
            >
              <option value="نشط">نشط وعامل</option>
              <option value="قيد الصيانة">قيد التحديث / الصيانة</option>
              <option value="مقترح / غير مفعل">مقترح لمشاريع قادمة</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-[#3E4C41] mb-1">العنوان بالتفصيل <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="مثال: شارع المعرفة، بجوار صيدلية الدواء"
              className="w-full px-3 py-2 rounded-xl border border-[#E2DED0] text-xs bg-white text-[#2D3A30] focus:ring-2 focus:ring-[#4A5D4E]/20 focus:border-[#4A5D4E] transition-all outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#3E4C41] mb-1">اسم المسؤول / المدير</label>
            <input
              type="text"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              placeholder="أ. خالد الشهري"
              className="w-full px-3 py-2 rounded-xl border border-[#E2DED0] text-xs bg-white text-[#2D3A30] focus:ring-2 focus:ring-[#4A5D4E]/20 focus:border-[#4A5D4E] transition-all outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#3E4C41] mb-1">رقم الاتصال المباشر</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="مثال: 012XXXXXXX أو رقم طوارئ"
              className="w-full px-3 py-2 rounded-xl border border-[#E2DED0] text-xs bg-white text-[#2D3A30] focus:ring-2 focus:ring-[#4A5D4E]/20 focus:border-[#4A5D4E] transition-all outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#3E4C41] mb-1">السعة الاستيعابية / الحجم</label>
            <input
              type="text"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="مثال: 300 طالب، 60 سرير، 1000 مصلّي"
              className="w-full px-3 py-2 rounded-xl border border-[#E2DED0] text-xs bg-white text-[#2D3A30] focus:ring-2 focus:ring-[#4A5D4E]/20 focus:border-[#4A5D4E] transition-all outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#3E4C41] mb-1">إحداثيات الخريطة (عرض / طول)</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={latitude}
                onChange={(e) => setLatitude(Number(e.target.value))}
                min="0"
                max="100"
                className="w-full px-2 py-1.5 rounded-lg border border-[#E2DED0] text-center text-xs bg-white text-[#2D3A30]"
              />
              <input
                type="number"
                value={longitude}
                onChange={(e) => setLongitude(Number(e.target.value))}
                min="0"
                max="100"
                className="w-full px-2 py-1.5 rounded-lg border border-[#E2DED0] text-center text-xs bg-white text-[#2D3A30]"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-[#3E4C41] mb-1">وصف موجز للمرفق وخدماته</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="خدمات العيادات الخارجية، مواعيد تحفيظ القرآن، الفئات العمرية المستهدفة"
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-[#E2DED0] text-xs bg-white text-[#2D3A30] focus:ring-2 focus:ring-[#4A5D4E]/20 focus:border-[#4A5D4E] transition-all outline-none resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-[#E2DED0] pt-4 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-[#E2DED0] text-xs font-bold text-[#3E4C41] hover:bg-[#F4F1EA] transition-all cursor-pointer"
          >
            إلغاء التراجع
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-[#4A5D4E] hover:bg-[#3E4C41] text-[#FDFBF7] text-xs font-bold shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            حفظ المرفق الخدمي
          </button>
        </div>
      </form>
    </div>
  );
}
