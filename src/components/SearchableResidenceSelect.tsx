import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';

// 1. Authorized village local neighborhoods (Cleaned and sanitized as requested)
export const APPROVED_LOCAL_NEIGHBORHOODS: string[] = [
  'الاكمة',
  'البقير',
  'الدمنة',
  'الرميمية',
  'الزيلة', // "الزيلة" is approved (merging الزيله and الزيلة)
  'العنين',
  'القحفة',
  'المجزع', // "المجزع" is approved (merging الصفا and الصفاء into المجزع)
  'المعقرة',
  'الهقم'
];

// 2. The 22 Governorates of Yemen for residents outside/abroad
export const YEMEN_GOVERNORATES: string[] = [
  'أمانة العاصمة',
  'صنعاء',
  'عدن',
  'تعز',
  'الحديدة',
  'حضرموت',
  'إب',
  'ذمار',
  'أبين',
  'البيضاء',
  'شبوة',
  'الجوف',
  'المهرة',
  'المحويت',
  'صعدة',
  'حجة',
  'عمران',
  'مأرب',
  'الضالع',
  'لحج',
  'ريمة',
  'سقطرى'
];

export function sanitizeResidenceName(name: string): string {
  if (!name) return '';
  const trimmed = name.trim();
  if (trimmed === 'الزيله') return 'الزيلة';
  if (trimmed === 'الصفا' || trimmed === 'الصفاء') return 'المجزع';
  return trimmed;
}

interface SearchableResidenceSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export default function SearchableResidenceSelect({
  value,
  onChange,
  placeholder = 'اختر مكان الإقامة / المحلة...',
  className = '',
  required = false
}: SearchableResidenceSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Sanitize the incoming value on render
  const sanitizedValue = useMemo(() => sanitizeResidenceName(value), [value]);

  // Handle click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter local neighborhoods
  const filteredLocal = useMemo(() => {
    return APPROVED_LOCAL_NEIGHBORHOODS.filter(item =>
      item.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  // Filter governorates
  const filteredGovs = useMemo(() => {
    return YEMEN_GOVERNORATES.filter(item =>
      item.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handleSelect = (selectedVal: string) => {
    const sanitized = sanitizeResidenceName(selectedVal);
    onChange(sanitized);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 rounded-xl border border-[#E2DED0] text-xs bg-white text-[#2D3A30] font-semibold outline-none focus:ring-2 focus:ring-[#4A5D4E]/20 focus:border-[#4A5D4E] transition-all flex items-center justify-between cursor-pointer text-right min-h-[36px]"
      >
        <span className={sanitizedValue ? 'text-[#2D3A30]' : 'text-gray-400'}>
          {sanitizedValue || placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-[#7A8B7E] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {required && !sanitizedValue && (
        <input
          tabIndex={-1}
          autoComplete="off"
          style={{ opacity: 0, height: 0, width: 0, position: 'absolute' }}
          required
          value={sanitizedValue}
          onChange={() => {}}
        />
      )}

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-[#E2DED0] rounded-xl shadow-lg max-h-72 overflow-hidden flex flex-col">
          {/* Search bar */}
          <div className="p-2 border-b border-[#F4F1EA] relative flex items-center">
            <Search className="w-3.5 h-3.5 text-[#7A8B7E] absolute right-4 top-4.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن محلة أو محافظة..."
              className="w-full pl-3 pr-8 py-1.5 rounded-lg border border-[#E2DED0] text-xs bg-white text-[#2D3A30] outline-none font-medium focus:border-[#4A5D4E]"
              autoFocus
            />
          </div>

          {/* Results list */}
          <div className="overflow-y-auto flex-1 divide-y divide-[#F4F1EA]">
            {/* Local Neighborhoods */}
            {(filteredLocal.length > 0 || searchQuery === '') && (
              <div className="py-1">
                <span className="block text-[10px] text-gray-400 font-bold px-3 py-1">محلات القرية المعتمدة (محلية)</span>
                {filteredLocal.map(item => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className={`w-full text-right px-3 py-1.5 text-xs hover:bg-[#F4F1EA] transition-all flex items-center justify-between cursor-pointer ${
                      sanitizedValue === item ? 'bg-[#E9F0E0] text-[#4A5D4E] font-bold' : 'text-[#3E4C41]'
                    }`}
                  >
                    <span>{item}</span>
                    {sanitizedValue === item && <Check className="w-3.5 h-3.5 text-[#4A5D4E]" />}
                  </button>
                ))}
              </div>
            )}

            {/* Yemen Governorates */}
            {(filteredGovs.length > 0 || searchQuery === '') && (
              <div className="py-1">
                <span className="block text-[10px] text-gray-400 font-bold px-3 py-1">محافظات الجمهورية اليمنية (للمقيمين بالخارج)</span>
                {filteredGovs.map(item => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className={`w-full text-right px-3 py-1.5 text-xs hover:bg-[#F4F1EA] transition-all flex items-center justify-between cursor-pointer ${
                      sanitizedValue === item ? 'bg-[#E9F0E0] text-[#4A5D4E] font-bold' : 'text-[#3E4C41]'
                    }`}
                  >
                    <span>{item}</span>
                    {sanitizedValue === item && <Check className="w-3.5 h-3.5 text-[#4A5D4E]" />}
                  </button>
                ))}
              </div>
            )}

            {filteredLocal.length === 0 && filteredGovs.length === 0 && (
              <div className="p-3 text-center text-xs text-gray-400 font-medium">
                لا توجد نتائج مطابقة لبحثك
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
