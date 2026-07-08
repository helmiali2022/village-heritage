import React, { useState } from 'react';
import { Family, LocalService, NeighborhoodStats, parseBreadwinner } from '../types';
import { NEIGHBORHOOD_STATS } from '../data/mockData';
import { MapPin, HelpCircle, School, HeartPulse, ShieldAlert, Compass, Eye, EyeOff, Plus, FileText, Landmark, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LocalMapProps {
  families: Family[];
  services: LocalService[];
  onSelectFamily?: (family: Family) => void;
  onSelectService?: (service: LocalService) => void;
  onMapClickAdd?: (lat: number, lng: number) => void;
  isAdmin?: boolean;
}

// Coordinate mapping for neighborhood polygons to make it look like a real map
const NEIGHBORHOOD_POLYGONS: { [key: string]: string } = {
  'الاكمة': '10,10 45,5 40,45 5,45',
  'الزيلة': '45,5 90,10 75,50 40,45',
  'البقير': '40,45 75,50 95,90 45,90',
  'الدمنة': '5,45 40,45 45,90 10,95',
  'الصفا': '5,5 15,5 20,25 5,25',
  'الرميمية': '75,50 95,50 95,90 75,90'
};

export default function LocalMap({
  families,
  services,
  onSelectFamily,
  onSelectService,
  onMapClickAdd,
  isAdmin = false
}: LocalMapProps) {
  const [hoveredNeighborhood, setHoveredNeighborhood] = useState<NeighborhoodStats | null>(null);
  const [selectedPin, setSelectedPin] = useState<{ type: 'family' | 'service'; data: any } | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'families' | 'services'>('all');
  const [showZones, setShowZones] = useState(true);
  const [showStreets, setShowStreets] = useState(true);

  const getServiceIcon = (type: string) => {
    switch (type) {
      case 'صحي':
        return <HeartPulse className="w-4 h-4" />;
      case 'تعليمي':
        return <School className="w-4 h-4" />;
      case 'أمني':
        return <ShieldAlert className="w-4 h-4" />;
      case 'ديني':
        return <Landmark className="w-4 h-4" />;
      default:
        return <Compass className="w-4 h-4" />;
    }
  };

  const getServiceColor = (type: string) => {
    switch (type) {
      case 'صحي': return 'bg-[#A98467] border-[#E2DED0] text-white';
      case 'تعليمي': return 'bg-[#DDE5B6] border-[#E2DED0] text-[#4A5D4E]';
      case 'أمني': return 'bg-[#4A5D4E] border-[#E2DED0] text-white';
      case 'ديني': return 'bg-[#7A8B7E] border-[#E2DED0] text-white';
      case 'ترفيهي': return 'bg-[#C2C5A9] border-[#E2DED0] text-[#4A5D4E]';
      default: return 'bg-[#8C9A86] border-[#E2DED0] text-white';
    }
  };

  const getFamilyColor = (status: string) => {
    switch (status) {
      case 'مستحق للدعم': return 'bg-[#A98467] text-white ring-2 ring-[#FFF5EB]';
      case 'تحت الدراسة': return 'bg-[#DDE5B6] text-[#4A5D4E] ring-2 ring-[#E2DED0]';
      default: return 'bg-[#4A5D4E] text-white ring-2 ring-[#E9F0E0]';
    }
  };

  // Convert map click coordinates
  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!onMapClickAdd) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const lat = Math.round((y / rect.height) * 100);
    const lng = Math.round((x / rect.width) * 100);
    
    // Only register map click if we didn't click on a pin
    const target = e.target as SVGElement;
    if (target.tagName === 'polygon' || target.tagName === 'svg' || target.id === 'map-background') {
      onMapClickAdd(lat, lng);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-[#E2DED0] overflow-hidden flex flex-col h-full min-h-[600px] font-sans" id="map-container">
      {/* Map Header */}
      <div className="p-5 bg-[#F4F1EA] border-b border-[#E2DED0] flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h3 className="font-bold text-[#2D3A30] flex items-center gap-2">
            <Compass className="text-[#4A5D4E] w-5 h-5" />
            <span>خريطة الخدمات والمحلات التفاعلية</span>
          </h3>
          <p className="text-xs text-[#7A8B7E] mt-0.5">
            توزيع جغرافي ذكي للعائلات والخدمات المتاحة. {isAdmin && 'اضغط في أي مكان فارغ بالخريطة لتحديد إحداثيات جديدة.'}
          </p>
        </div>

        {/* Filters and Toggles */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* Map Layers toggles */}
          <button
            onClick={() => setShowZones(!showZones)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
              showZones 
                ? 'bg-[#DDE5B6] border-[#DDE5B6] text-[#4A5D4E]' 
                : 'bg-white border-[#E2DED0] text-[#7A8B7E] hover:bg-[#FDFBF7]'
            }`}
          >
            {showZones ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            حدود المحلات
          </button>

          <button
            onClick={() => setShowStreets(!showStreets)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
              showStreets 
                ? 'bg-[#DDE5B6] border-[#DDE5B6] text-[#4A5D4E]' 
                : 'bg-white border-[#E2DED0] text-[#7A8B7E] hover:bg-[#FDFBF7]'
            }`}
          >
            {showStreets ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            الشوارع والممرات
          </button>

          <div className="h-4 w-px bg-[#E2DED0] mx-1"></div>

          {/* Filter selector */}
          <div className="bg-[#F4F1EA] p-0.5 rounded-xl border border-[#E2DED0] inline-flex">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterType === 'all' ? 'bg-white text-[#2D3A30] shadow-2xs' : 'text-[#7A8B7E] hover:text-[#2D3A30]'
              }`}
            >
              الكل
            </button>
            <button
              onClick={() => setFilterType('families')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterType === 'families' ? 'bg-white text-[#2D3A30] shadow-2xs' : 'text-[#7A8B7E] hover:text-[#2D3A30]'
              }`}
            >
              العائلات
            </button>
            <button
              onClick={() => setFilterType('services')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterType === 'services' ? 'bg-white text-[#2D3A30] shadow-2xs' : 'text-[#7A8B7E] hover:text-[#2D3A30]'
              }`}
            >
              الخدمات
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 relative">
        {/* Actual Map Canvas (Cols 1-3) */}
        <div className="lg:col-span-3 bg-[#FDFBF7] relative overflow-hidden h-[500px] lg:h-auto select-none" id="map-canvas-area">
          <svg 
            className="w-full h-full cursor-crosshair" 
            viewBox="0 0 100 100" 
            preserveAspectRatio="none"
            onClick={handleMapClick}
          >
            <rect id="map-background" width="100" height="100" fill="#FDFBF7" fillOpacity="0.4" />
            
            {/* Neighborhood Polygons (Zones) */}
            {showZones && NEIGHBORHOOD_STATS.map((zone) => {
              const polyPoints = NEIGHBORHOOD_POLYGONS[zone.name] || '0,0 100,0 100,100 0,100';
              const isHovered = hoveredNeighborhood?.name === zone.name;
              return (
                <polygon
                  key={zone.name}
                  points={polyPoints}
                  fill={zone.color}
                  fillOpacity={isHovered ? 0.25 : 0.08}
                  stroke={zone.color}
                  strokeWidth="0.4"
                  strokeDasharray="1,1"
                  className="transition-all duration-300 cursor-pointer"
                  onMouseEnter={() => setHoveredNeighborhood(zone)}
                  onMouseLeave={() => setHoveredNeighborhood(null)}
                />
              );
            })}

            {/* Custom Streets Grid */}
            {showStreets && (
              <>
                {/* Horizontal Streets */}
                <line x1="0" y1="25" x2="100" y2="25" stroke="#E2DED0" strokeWidth="0.8" strokeOpacity="0.8" />
                <line x1="0" y1="50" x2="100" y2="50" stroke="#E2DED0" strokeWidth="1.0" strokeOpacity="0.8" />
                <line x1="0" y1="75" x2="100" y2="75" stroke="#E2DED0" strokeWidth="0.8" strokeOpacity="0.8" />
                
                {/* Vertical Streets */}
                <line x1="25" y1="0" x2="25" y2="100" stroke="#E2DED0" strokeWidth="0.8" strokeOpacity="0.8" />
                <line x1="50" y1="0" x2="50" y2="100" stroke="#E2DED0" strokeWidth="1.0" strokeOpacity="0.8" />
                <line x1="75" y1="0" x2="75" y2="100" stroke="#E2DED0" strokeWidth="0.8" strokeOpacity="0.8" />

                {/* Ring Road */}
                <circle cx="50" cy="50" r="30" stroke="#E2DED0" strokeWidth="1.2" strokeOpacity="0.6" fill="none" />
              </>
            )}

            {/* Text labels for neighborhoods */}
            {showZones && NEIGHBORHOOD_STATS.map((zone) => {
              // Calculate rough centroid for labels
              let x = 50;
              let y = 50;
              if (zone.name === 'الاكمة') { x = 20; y = 20; }
              else if (zone.name === 'الزيلة') { x = 65; y = 22; }
              else if (zone.name === 'البقير') { x = 70; y = 70; }
              else if (zone.name === 'الدمنة') { x = 22; y = 70; }
              else if (zone.name === 'الصفا') { x = 10; y = 10; }
              else if (zone.name === 'الرميمية') { x = 85; y = 58; }

              return (
                <text
                  key={zone.name + '-lbl'}
                  x={x}
                  y={y}
                  textAnchor="middle"
                  className="font-bold text-[3px] fill-[#7A8B7E] select-none pointer-events-none"
                >
                  {zone.name}
                </text>
              );
            })}
          </svg>

          {/* Interactive HTML overlay pins to support high-fidelity styling, hover and click */}
          
          {/* Families Pins */}
          {(filterType === 'all' || filterType === 'families') && families.map((family) => (
            <div
              key={family.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10"
              style={{ top: `${family.latitude}%`, left: `${family.longitude}%` }}
              onClick={() => {
                setSelectedPin({ type: 'family', data: family });
                if (onSelectFamily) onSelectFamily(family);
              }}
            >
              <div className="group relative">
                {/* Ping animation if it's high priority (support needed) */}
                {family.supportStatus === 'مستحق للدعم' && (
                  <span className="absolute -inset-1.5 bg-[#A98467] rounded-full animate-ping opacity-60"></span>
                )}
                
                {/* Pin Circle */}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shadow-md transition-all duration-200 group-hover:scale-125 ${getFamilyColor(family.supportStatus)}`}>
                  <Users className="w-3.5 h-3.5 text-white" />
                </div>

                {/* Mini badge of members count */}
                <span className="absolute -top-1.5 -right-1.5 bg-[#2D3A30] text-[9px] text-white font-bold rounded-full w-4 h-4 flex items-center justify-center border border-white">
                  {family.members.length}
                </span>

                {/* Hover Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-[#2D3A30]/95 text-white text-xs py-1.5 px-2.5 rounded-xl shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50 duration-200">
                  <div className="font-semibold">{family.familyName}</div>
                  <div className="text-[10px] text-[#E2DED0]">عائل الأسرة: {parseBreadwinner(family.breadwinnerName, family.phone).name}</div>
                  <div className="text-[10px] text-[#E2DED0]">{family.neighborhood} • {family.members.length} أفراد</div>
                </div>
              </div>
            </div>
          ))}

          {/* Services Pins */}
          {(filterType === 'all' || filterType === 'services') && services.map((srv) => (
            <div
              key={srv.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10"
              style={{ top: `${srv.latitude}%`, left: `${srv.longitude}%` }}
              onClick={() => {
                setSelectedPin({ type: 'service', data: srv });
                if (onSelectService) onSelectService(srv);
              }}
            >
              <div className="group relative">
                {/* Pin Shape */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-lg border-2 transition-all duration-200 group-hover:scale-125 ${getServiceColor(srv.type)}`}>
                  {getServiceIcon(srv.type)}
                </div>

                {/* Tiny status indicator */}
                <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-white ${
                  srv.status === 'نشط' ? 'bg-[#DDE5B6]' : srv.status === 'قيد الصيانة' ? 'bg-[#A98467]' : 'bg-[#7A8B7E]'
                }`}></span>

                {/* Hover Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-[#2D3A30]/95 text-white text-xs py-1.5 px-2.5 rounded-xl shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50 duration-200">
                  <div className="font-semibold">{srv.name}</div>
                  <div className="text-[10px] text-[#E2DED0]">التصنيف: {srv.type}</div>
                  <div className="text-[10px] text-[#E2DED0]">الحالة: {srv.status}</div>
                </div>
              </div>
            </div>
          ))}

          {/* Neighborhood Quick Stats Overlay when hovered */}
          <AnimatePresence>
            {hoveredNeighborhood && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-4 right-4 bg-white/95 backdrop-blur-md p-4 rounded-3xl shadow-xl border border-[#E2DED0] max-w-xs z-30 pointer-events-none font-sans"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: hoveredNeighborhood.color }}></span>
                  <h4 className="font-bold text-[#2D3A30] text-sm">{hoveredNeighborhood.name}</h4>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-[#F4F1EA] p-1.5 rounded-xl border border-[#E2DED0]/50">
                    <span className="block font-bold text-[#2D3A30]">{hoveredNeighborhood.population}</span>
                    <span className="text-[9px] text-[#7A8B7E]">نسمة</span>
                  </div>
                  <div className="bg-[#F4F1EA] p-1.5 rounded-xl border border-[#E2DED0]/50">
                    <span className="block font-bold text-[#2D3A30]">{hoveredNeighborhood.familiesCount}</span>
                    <span className="text-[9px] text-[#7A8B7E]">أسرة</span>
                  </div>
                  <div className="bg-[#F4F1EA] p-1.5 rounded-xl border border-[#E2DED0]/50">
                    <span className="block font-bold text-[#2D3A30]">{hoveredNeighborhood.servicesCount}</span>
                    <span className="text-[9px] text-[#7A8B7E]">خدمات</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Legend helper */}
          <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-xs p-3 rounded-2xl shadow-md border border-[#E2DED0] text-[10px] space-y-1.5 font-sans z-30">
            <div className="font-bold text-[#2D3A30] border-b border-[#E2DED0] pb-1 mb-1">دليل الخريطة</div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-[#A98467] rounded-full"></span>
              <span className="text-[#3E4C41] font-medium">أسرة مستحقة للدعم</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-[#DDE5B6] rounded-full"></span>
              <span className="text-[#3E4C41] font-medium">أسرة تحت الدراسة</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-[#4A5D4E] rounded-full"></span>
              <span className="text-[#3E4C41] font-medium">أسرة مكتفية ذاتياً</span>
            </div>
            <div className="h-px bg-[#E2DED0] my-1"></div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 bg-[#FFF5EB] border border-[#E2DED0] rounded-lg text-[8px] flex items-center justify-center font-bold shadow-2xs">🏥</span>
              <span className="text-[#3E4C41] font-medium">مرفق صحي</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 bg-[#FFF5EB] border border-[#E2DED0] rounded-lg text-[8px] flex items-center justify-center font-bold shadow-2xs">🏫</span>
              <span className="text-[#3E4C41] font-medium">مرفق تعليمي</span>
            </div>
          </div>
        </div>

        {/* Selected Pin Details Sidebar (Col 4) */}
        <div className="bg-[#F4F1EA]/50 border-t lg:border-t-0 lg:border-r border-[#E2DED0] p-4 flex flex-col h-full overflow-y-auto">
          {selectedPin ? (
            <div className="flex-1 flex flex-col justify-between h-full space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#E2DED0] pb-3">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#DDE5B6] text-[#4A5D4E]">
                    {selectedPin.type === 'family' ? 'بيانات الأسرة' : 'بيانات المرفق الخدمي'}
                  </span>
                  <button 
                    onClick={() => setSelectedPin(null)} 
                    className="text-xs text-[#7A8B7E] hover:text-[#2D3A30] transition-all font-bold cursor-pointer"
                  >
                    إغلاق
                  </button>
                </div>

                {selectedPin.type === 'family' ? (
                  // Family Selected Content
                  <div className="space-y-3 font-sans">
                    <div>
                      <h4 className="font-bold text-[#2D3A30] text-base flex items-center gap-2">
                        <span>{selectedPin.data.familyName}</span>
                      </h4>
                      <p className="text-xs text-[#7A8B7E] mt-1">{selectedPin.data.neighborhood} • {selectedPin.data.address}</p>
                    </div>

                    <div className="bg-white p-3.5 rounded-2xl border border-[#E2DED0] space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#7A8B7E]">رب الأسرة:</span>
                        <span className="font-bold text-[#3E4C41]">{parseBreadwinner(selectedPin.data.breadwinnerName, selectedPin.data.phone).name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#7A8B7E]">الاتصال:</span>
                        <span className="font-bold text-[#3E4C41]">{parseBreadwinner(selectedPin.data.breadwinnerName, selectedPin.data.phone).phone || 'غير مدرج'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#7A8B7E]">أفراد الأسرة:</span>
                        <span className="font-extrabold text-[#3E4C41]">{selectedPin.data.members.length} أفراد</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#7A8B7E]">نوع السكن:</span>
                        <span className="font-bold text-[#3E4C41]">{selectedPin.data.housingType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#7A8B7E]">الدخل الشهري:</span>
                        <span className="font-bold text-[#3E4C41]">{selectedPin.data.monthlyIncome}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs text-[#7A8B7E] font-bold">حالة الدعم والاستحقاق:</span>
                      <div className={`p-2.5 rounded-xl text-xs font-bold text-center border ${
                        selectedPin.data.supportStatus === 'مستحق للدعم' 
                          ? 'bg-[#FFF5EB] text-[#A98467] border-[#E2DED0]'
                          : selectedPin.data.supportStatus === 'تحت الدراسة'
                          ? 'bg-[#DDE5B6]/60 text-[#4A5D4E] border-[#DDE5B6]'
                          : 'bg-[#E9F0E0] text-[#4A5D4E] border-[#E2DED0]'
                      }`}>
                        {selectedPin.data.supportStatus}
                      </div>
                    </div>

                    {selectedPin.data.notes && (
                      <div className="bg-[#FFF5EB]/80 border border-[#E2DED0] p-3 rounded-xl text-xs text-[#3E4C41] leading-relaxed">
                        <span className="font-bold block mb-0.5 text-[#A98467]">ملاحظات الحالة:</span>
                        {selectedPin.data.notes}
                      </div>
                    )}

                    <div className="pt-2">
                      <span className="text-xs font-bold text-[#7A8B7E] block mb-1.5">مكونات الأسرة:</span>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {selectedPin.data.members.map((m: any) => (
                          <div key={m.id} className="bg-white p-2.5 rounded-xl border border-[#E2DED0] flex items-center justify-between text-xs">
                            <div>
                              <span className="font-bold text-[#3E4C41] block">{m.name}</span>
                              <span className="text-[10px] text-[#7A8B7E]">{m.relationship} • {m.age} سنة • {m.occupation}</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-lg text-[9px] ${
                              m.healthStatus === 'سليم' ? 'bg-[#F4F1EA] text-[#7A8B7E]' : 'bg-[#FFF5EB] text-[#A98467] font-bold'
                            }`}>
                              {m.healthStatus}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  // Service Selected Content
                  <div className="space-y-3 font-sans">
                    <div>
                      <h4 className="font-bold text-[#2D3A30] text-base flex items-center gap-2">
                        <span className="p-1 rounded-lg bg-[#F4F1EA] border border-[#E2DED0]">{getServiceIcon(selectedPin.data.type)}</span>
                        <span>{selectedPin.data.name}</span>
                      </h4>
                      <p className="text-xs text-[#7A8B7E] mt-1">{selectedPin.data.neighborhood} • {selectedPin.data.address}</p>
                    </div>

                    <div className="bg-white p-3.5 rounded-2xl border border-[#E2DED0] space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#7A8B7E]">التصنيف:</span>
                        <span className="font-bold text-[#3E4C41]">{selectedPin.data.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#7A8B7E]">مسؤول التواصل:</span>
                        <span className="font-bold text-[#3E4C41]">{selectedPin.data.contactPerson || 'غير محدد'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#7A8B7E]">الهاتف:</span>
                        <span className="font-bold text-[#3E4C41]">{selectedPin.data.phone || 'غير متاح'}</span>
                      </div>
                      {selectedPin.data.capacity && (
                        <div className="flex justify-between">
                          <span className="text-[#7A8B7E]">السعة الاستيعابية:</span>
                          <span className="font-bold text-[#3E4C41]">{selectedPin.data.capacity}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs text-[#7A8B7E] font-bold">حالة تشغيل المرفق:</span>
                      <div className={`p-2.5 rounded-xl text-xs font-bold text-center border ${
                        selectedPin.data.status === 'نشط' 
                          ? 'bg-[#E9F0E0] text-[#4A5D4E] border-[#E2DED0]'
                          : selectedPin.data.status === 'قيد الصيانة'
                          ? 'bg-[#FFF5EB] text-[#A98467] border-[#E2DED0]'
                          : 'bg-[#F4F1EA] text-[#7A8B7E] border-[#E2DED0]'
                      }`}>
                        {selectedPin.data.status}
                      </div>
                    </div>

                    {selectedPin.data.description && (
                      <div className="bg-white/80 p-3 rounded-xl border border-[#E2DED0] text-xs text-[#3E4C41] leading-relaxed">
                        <span className="font-bold block mb-1 text-[#2D3A30]">نبذة عن الخدمة:</span>
                        {selectedPin.data.description}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {selectedPin.type === 'family' ? (
                isAdmin ? (
                  <button
                    onClick={() => onSelectFamily && onSelectFamily(selectedPin.data)}
                    className="w-full bg-[#4A5D4E] hover:bg-[#3E4C41] text-[#FDFBF7] py-2.5 rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    عرض السجل الكامل والتعديل
                  </button>
                ) : (
                  <div className="w-full bg-[#F4F1EA] text-[#7A8B7E] py-2.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 border border-[#E2DED0] text-center">
                    <FileText className="w-3.5 h-3.5" />
                    عرض السجل مغلق (سجل دخول لتعديل الأسرة)
                  </div>
                )
              ) : (
                <button
                  onClick={() => onSelectService && onSelectService(selectedPin.data)}
                  className="w-full bg-[#A98467] hover:bg-[#8F6D52] text-[#FDFBF7] py-2.5 rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Compass className="w-3.5 h-3.5" />
                  عرض تفاصيل المرفق الكاملة
                </button>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#F4F1EA] border border-[#E2DED0] flex items-center justify-center text-[#7A8B7E]">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-[#2D3A30] text-xs">لم يتم تحديد أي عنصر</h4>
                <p className="text-[11px] text-[#7A8B7E] mt-1 max-w-[180px] mx-auto leading-relaxed">
                  اختر أحد دبابيس العائلات أو المرافق على الخريطة لعرض تفاصيلها الفورية هنا.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
