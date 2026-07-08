import React, { useState, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Family, Member, parseBreadwinner } from '../types';
import { NEIGHBORHOODS } from '../data/mockData';
import { Search, Filter, Plus, ChevronDown, ChevronUp, MapPin, Edit2, Trash2, Phone, Calendar, ArrowUpDown, ShieldAlert, HeartPulse, Sparkles, Users, Shield, Upload, Link, RefreshCw, AlertTriangle, FileSpreadsheet, CheckCircle2 } from 'lucide-react';

interface FamilyRegisterProps {
  families: Family[];
  setFamilies: React.Dispatch<React.SetStateAction<Family[]>>;
  onAddFamily: () => void;
  onEditFamily: (family: Family) => void;
  onDeleteFamily: (id: string) => void;
  onLocateOnMap: (family: Family) => void;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
  userRole?: string;
  userPermissions?: {
    families: 'read' | 'write';
    services: 'read' | 'write';
    donations: 'read' | 'write';
  };
  currentUser?: any;
}

export default function FamilyRegister({
  families,
  setFamilies,
  onAddFamily,
  onEditFamily,
  onDeleteFamily,
  onLocateOnMap,
  isAdmin = false,
  isSuperAdmin = false,
  userRole,
  userPermissions,
  currentUser
}: FamilyRegisterProps) {
  const isSuperAdminUser = isSuperAdmin || currentUser?.role === 'super-admin' || currentUser?.email === 'helmialkhateeb@gmail.com' || currentUser?.email === 'helmi';

  // Determine administrative role (Admin, Manager)
  const isAdministrative = isSuperAdminUser || (isAdmin && (userRole === 'super-admin' || userRole === 'admin' || userRole === 'supervisor' || userRole === 'Admin' || userRole === 'Manager' || !userRole));
  
  // Determine if the user has write permissions for families section
  const canWriteFamilies = isSuperAdminUser || (isAdmin && (userRole === 'super-admin' || userRole === 'admin' || userRole === 'supervisor' || userRole === 'Admin' || (userRole === 'Manager' && userPermissions?.families === 'write') || !userRole));

  const canEditFamily = isSuperAdminUser || 
    (currentUser?.role === 'supervisor' || currentUser?.role === 'admin') ||
    (currentUser?.role === 'delegate' && currentUser?.permissions?.canEditCensus === true);

  // Dynamic unified neighborhoods list (from Column C of the spreadsheet / families)
  const uniqueNeighborhoods = React.useMemo(() => {
    const fromFamilies = (families || []).map(f => f.neighborhood).filter(Boolean);
    const combined = Array.from(new Set([...NEIGHBORHOODS, ...fromFamilies]));
    return combined.sort((a, b) => a.localeCompare(b, 'ar'));
  }, [families]);

  const [googleSheetsUrl, setGoogleSheetsUrl] = useState('https://docs.google.com/spreadsheets/d/e/2PACX-1vRtQlsnxA_BqxXqesgnS6YHaDEYE_PzGurtPM_zOeDVKFBVhYMPtRyXWIHduGDxYKqLppy4NqmiMSfA/pub?output=csv');
  const [loading, setLoading] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // جلب إعدادات رابط Google Sheets عند تحميل المكون
  React.useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await fetch('/api/google-sheets-url');
        if (res.ok) {
          const data = await res.json();
          if (data && data.googleSheetsUrl) {
            setGoogleSheetsUrl(data.googleSheetsUrl);
            // جلب البيانات فقط إذا كان السجل فارغاً تماماً كـ تهيئة أولية للمنصة لمنع تجاوز التعديلات اليدوية
            if (families.length === 0) {
              fetchSheetsData(data.googleSheetsUrl, true);
            }
          }
        }
      } catch (e) {
        console.error('Failed to load sheets URL from server:', e);
      }
    };
    loadConfig();
  }, []);

  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
  const [showAdvancedImport, setShowAdvancedImport] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingCsvText, setPendingCsvText] = useState<string | null>(null);
  const [pendingIsUrl, setPendingIsUrl] = useState(false);
  const [pendingRecordCount, setPendingRecordCount] = useState<number>(0);

  const [dataSourceStatus, setDataSourceStatus] = useState<string>(() => {
    return localStorage.getItem('family_source_status_v1') || 'تم جلب البيانات من الملف المحلي';
  });

  const saveDataSourceStatus = (status: string) => {
    setDataSourceStatus(status);
    localStorage.setItem('family_source_status_v1', status);
  };

  // Custom client-side CSV parser that handles double quotes, commas, and newlines
  const parseCSV = (csvText: string): string[][] => {
    const lines: string[][] = [];
    let currentLine: string[] = [];
    let currentVal = '';
    let insideQuotes = false;

    for (let i = 0; i < csvText.length; i++) {
      const char = csvText[i];
      const nextChar = csvText[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          currentVal += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        currentLine.push(currentVal.trim());
        currentVal = '';
      } else if ((char === '\r' || char === '\n') && !insideQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        currentLine.push(currentVal.trim());
        if (currentLine.length > 0 && (currentLine.length > 1 || currentLine[0] !== '')) {
          lines.push(currentLine);
        }
        currentLine = [];
        currentVal = '';
      } else {
        currentVal += char;
      }
    }

    if (currentVal || currentLine.length > 0) {
      currentLine.push(currentVal.trim());
      if (currentLine.length > 0 && (currentLine.length > 1 || currentLine[0] !== '')) {
        lines.push(currentLine);
      }
    }

    return lines;
  };

  // تحويل ملفات الجداول الإلكترونية (XLSX, XLS, ODS) إلى صيغة CSV مؤقتة في الذاكرة
  const convertSpreadsheetToData = (arrayBuffer: ArrayBuffer, fileName: string): Record<string, string> => {
    try {
      const data = new Uint8Array(arrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      
      const result: Record<string, string> = {};
      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        result[sheetName] = XLSX.utils.sheet_to_csv(worksheet);
      });
      return result;
    } catch (err) {
      console.error('Error converting spreadsheet to CSV:', err);
      throw new Error('عذراً، يرجى التأكد من رفع ملف جدول بيانات صحيح.');
    }
  };

  // خطوة إجبار المتصفح والموقع على تحديث بياناته فور انتهاء المعالجة (Force Update Phase)
  const forceUpdate = () => {
    console.log('Force Update activated: Refreshing client states...');
    // 1. إعادة تعيين مصفوفة الأسر بنفس القيم لإجبار React على إعادة الرندرة
    setFamilies(prev => [...prev]);
    // 2. تحديث طابع زمني في localStorage للتأكيد
    localStorage.setItem('census_last_update_ts', Date.now().toString());
    // 3. إرسال حدث مخصص للمتصفحين لتحديث أي نوافذ أو مكونات مفتوحة أخرى
    window.dispatchEvent(new Event('census_data_force_update'));
  };

  const importCSVData = (csvTextObjOrString: string | Record<string, string>, isFromUrl: boolean) => {
    try {
      let mappedFamilies: Family[] = [];

      // Handle the 4 specific tabs architecture if passed a record of strings
      if (typeof csvTextObjOrString === 'object') {
        const sheets = csvTextObjOrString;
        const insideVillageBreadwinners = sheets['داخل القرية'] ? parseCSV(sheets['داخل القرية']) : [];
        const outsideVillageBreadwinners = sheets['خارج القرية'] ? parseCSV(sheets['خارج القرية']) : [];
        const insideVillageMembers = sheets['تابعي داخل القرية'] ? parseCSV(sheets['تابعي داخل القرية']) : [];
        const outsideVillageMembers = sheets['تابعي خارج القرية'] ? parseCSV(sheets['تابعي خارج القرية']) : [];

        // Parse breadwinners
        const allBreadwinnersRaw = [
          ...insideVillageBreadwinners.slice(1).map(row => ({ ...row, _loc: 'داخل القرية' })),
          ...outsideVillageBreadwinners.slice(1).map(row => ({ ...row, _loc: 'خارج القرية' }))
        ].filter(row => Object.keys(row).length > 2);

        // Parse members
        const allMembersRaw = [
          ...insideVillageMembers.slice(1),
          ...outsideVillageMembers.slice(1)
        ].filter(row => row.length > 2);

        const breadwinnerHeader = insideVillageBreadwinners[0] || outsideVillageBreadwinners[0] || [];
        const hName = breadwinnerHeader.findIndex(h => h.includes('الاسم') || h.includes('العائل'));
        const hPhone = breadwinnerHeader.findIndex(h => h.includes('رقم الهاتف') || h.includes('جوال'));
        const hNeighborhood = breadwinnerHeader.findIndex(h => h.includes('المحلة'));
        const hResidence = breadwinnerHeader.findIndex(h => h.includes('الاقامة') || h.includes('السكن'));
        const hFamilyName = breadwinnerHeader.findIndex(h => h.includes('اللقب'));

        const memberHeader = insideVillageMembers[0] || outsideVillageMembers[0] || [];
        const mhName = memberHeader.findIndex(h => h.includes('الاسم'));
        const mhPhone = memberHeader.findIndex(h => h.includes('رقم الهاتف') || h.includes('جوال'));
        const mhBPhone = memberHeader.findIndex(h => h.includes('رقم هاتف رب الاسرة') || h.includes('هاتف رب'));
        const mhRel = memberHeader.findIndex(h => h.includes('صلة القرابة'));
        const mhGender = memberHeader.findIndex(h => h.includes('الجنس'));
        const mhAge = memberHeader.findIndex(h => h.includes('العمر') || h.includes('تاريخ'));

        mappedFamilies = allBreadwinnersRaw.map((row, idx) => {
          const id = `imported_${idx}_${Date.now()}`;
          const breadwinnerName = row[hName > -1 ? hName : 1] || 'مواطن مجهول';
          const phone = row[hPhone > -1 ? hPhone : 2] || '';
          const neighborhood = row[hNeighborhood > -1 ? hNeighborhood : 3] || 'غير محدد';
          const residence = row[hResidence > -1 ? hResidence : 4] || 'دائمة';
          const familyName = row[hFamilyName > -1 ? hFamilyName : 5] || 'غير محدد';
          
          const membersList: Member[] = [];
          
          // The breadwinner is always the first member
          membersList.push({
            id: `${id}_m_0`,
            name: breadwinnerName,
            relationship: 'عائل',
            gender: 'ذكر', // Or try to infer from name
            age: 40,
            education: 'غير محدد',
            occupation: 'أعمال حرة',
            healthStatus: 'سليم',
            phone: phone
          });

          // Match members based on phone number or name fallback
          allMembersRaw.forEach((mRow, mIdx) => {
            const mBPhone = mRow[mhBPhone > -1 ? mhBPhone : 1];
            if (mBPhone && phone && mBPhone === phone) {
              const rel = (mRow[mhRel > -1 ? mhRel : 3] || 'آخر') as any;
              let gnd = mRow[mhGender > -1 ? mhGender : 4] as any;
              if (['ابن', 'زوج', 'أب', 'أخ'].includes(rel)) gnd = 'ذكر';
              else if (['ابنة', 'زوجة', 'أم', 'أخت'].includes(rel)) gnd = 'أنثى';
              
              membersList.push({
                id: `${id}_m_${mIdx + 1}`,
                name: mRow[mhName > -1 ? mhName : 0] || 'غير محدد',
                relationship: rel,
                gender: gnd || 'ذكر',
                age: parseInt(mRow[mhAge > -1 ? mhAge : 5]) || 15,
                education: 'غير محدد',
                occupation: 'غير محدد',
                healthStatus: 'سليم',
                phone: mRow[mhPhone > -1 ? mhPhone : 2] || ''
              });
            }
          });

          return {
            id,
            familyName,
            breadwinnerName,
            phone,
            neighborhood,
            address: `المحلة: ${neighborhood}`,
            housingType: 'ملك',
            residence,
            monthlyIncome: 'أقل من 3000 ريال',
            supportStatus: 'مستحق للدعم',
            members: membersList,
            registeredAt: new Date().toISOString().split('T')[0],
            latitude: Math.floor(Math.random() * 60) + 20,
            longitude: Math.floor(Math.random() * 60) + 20,
            notes: `تم الاستيراد بنجاح`
          };
        });

      } else {
        // Legacy fallback single sheet parsing
        const lines = parseCSV(csvTextObjOrString as string);
        if (lines.length < 2) {
          throw new Error('الملف فارغ أو لا يحتوي على أسطر صالحة.');
        }

        // Filter out empty lines
        const rawDataRows = lines.slice(1).filter(row => row.length > 1 || (row.length === 1 && row[0] !== ''));

        // ميزة الاستكشاف التلقائي والذكي للأعمدة لتجنب المشاكل في ترتيب الحقول بالملف المرفوع
        const headerRow = lines[0].map(h => h.trim());
        
        let breadwinnerIdx = headerRow.findIndex(h => h.includes('رب الأسرة') || h.includes('العائل') || h.includes('الاسم الكامل') || h.includes('الاسم'));
        let neighborhoodIdx = headerRow.findIndex(h => h.includes('المحلة') || h.includes('المنطقة') || h.includes('محلة'));
        let countIdx = headerRow.findIndex(h => h.includes('عدد الأفراد') || h.includes('العدد') || h.includes('أفراد') || h.includes('الأفراد'));
        let phoneIdx = headerRow.findIndex(h => h.includes('الجوال') || h.includes('الهاتف') || h.includes('تلفون') || h.includes('اتصال') || h.includes('موبايل'));
        let residenceIdx = headerRow.findIndex(h => h.includes('الإقامة') || h.includes('السكن') || h.includes('حالة الإقامة') || h.includes('نوع الإقامة'));
        let familyNameIdx = headerRow.findIndex(h => h.includes('اللقب') || h.includes('العائلة') || h.includes('اسم العائلة'));

        // fallback to strict standard indexes if not matched dynamically:
        if (breadwinnerIdx === -1) breadwinnerIdx = 1;
        if (neighborhoodIdx === -1) neighborhoodIdx = 2;
        if (countIdx === -1) countIdx = 3;
        if (phoneIdx === -1) phoneIdx = 4;
        if (residenceIdx === -1) residenceIdx = 6;
        if (familyNameIdx === -1) familyNameIdx = 7;

        mappedFamilies = rawDataRows.map((row, idx) => {
          const id = `imported_${row[0] || idx + 1}_${Date.now()}`;
          const breadwinnerName = row[breadwinnerIdx] || 'مواطن مجهول';
          const neighborhood = row[neighborhoodIdx] || 'غير محدد';
          const count = parseInt(row[countIdx], 10) || 1;
          const phone = row[phoneIdx] || '';
          const resVal = row[residenceIdx] || 'دائمة';
          const familyName = row[familyNameIdx] || 'غير محدد';

          let housingType: 'ملك' | 'إيجار' | 'شعبي' | 'أخرى' = 'ملك';
          if (resVal.includes('إيجار') || resVal.includes('مؤقت')) {
            housingType = 'إيجار';
          } else if (resVal.includes('شعبي')) {
            housingType = 'شعبي';
          } else if (resVal.includes('أخرى')) {
            housingType = 'أخرى';
          }

          const members = Array.from({ length: count }).map((_, mIdx) => ({
            id: `${id}_m_${mIdx + 1}`,
            name: mIdx === 0 ? breadwinnerName : `${breadwinnerName} (فرد أسرة ${mIdx + 1})`,
            relationship: mIdx === 0 ? 'عائل' as const : 'ابن' as const,
            gender: 'ذكر' as const,
            age: mIdx === 0 ? 45 : 12,
            education: 'غير محدد' as const,
            occupation: mIdx === 0 ? 'أعمال حرة' : 'طالب',
            healthStatus: 'سليم' as const,
          }));

          const latitude = Math.floor(Math.random() * 60) + 20;
          const longitude = Math.floor(Math.random() * 60) + 20;

          return {
            id,
            familyName,
            breadwinnerName,
            phone,
            neighborhood,
            address: `المحلة: ${neighborhood}`,
            housingType,
            residence: resVal,
            monthlyIncome: 'أقل من 3000 ريال' as const,
            supportStatus: 'مستحق للدعم' as const,
            members,
            registeredAt: new Date().toISOString().split('T')[0],
            latitude,
            longitude,
            notes: `تم الاستيراد بنجاح`
          };
        });
      }

      if (mappedFamilies.length === 0) {
        throw new Error('لم يتم العثور على أي سجلات صالحة في الملف.');
      }

      if (importMode === 'replace') {
        setFamilies(mappedFamilies);
      } else {
        // Smart merge / Append mode: update if breadwinnerName matches, otherwise insert
        setFamilies(prev => {
          const merged = [...prev];
          mappedFamilies.forEach(newFam => {
            const index = merged.findIndex(f => f.breadwinnerName.trim() === newFam.breadwinnerName.trim());
            if (index !== -1) {
              merged[index] = {
                ...merged[index],
                ...newFam,
                id: merged[index].id // Preserve original ID for consistency
              };
            } else {
              merged.push(newFam);
            }
          });
          return merged;
        });
      }

      saveDataSourceStatus(isFromUrl ? 'تم جلب البيانات من الرابط' : 'تم جلب البيانات من الملف المرفوع');
      setError(null);

      // تشغيل ميزة الـ Force Update لتحديث جميع المتصفحين والبيانات فورياً
      forceUpdate();
      
      // إشارة التحديث الحقيقي الناجح
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 4000);
    } catch (err: any) {
      console.error(err);
      setError('عذراً، يرجى التأكد من رفع ملف جدول بيانات صحيح.');
    }
  };

  const prepareImport = (csvText: string, isFromUrl: boolean) => {
    try {
      const lines = parseCSV(csvText);
      const recordsCount = lines.slice(1).filter(row => row.length > 1 || (row.length === 1 && row[0] !== '')).length;
      
      if (recordsCount === 0) {
        setError('الملف المرفوع فارغ أو لا يحتوي على أسطر صالحة.');
        return;
      }
      setPendingCsvText(csvText);
      setPendingIsUrl(isFromUrl);
      setPendingRecordCount(recordsCount);
      setShowConfirmModal(true);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError('عذراً، يرجى التأكد من رفع ملف جدول بيانات صحيح.');
    }
  };

  const executeImport = () => {
    if (!pendingCsvText) return;
    importCSVData(pendingCsvText, pendingIsUrl);
    setShowConfirmModal(false);
    setPendingCsvText(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    const fileName = file.name.toLowerCase();
    const isCsv = fileName.endsWith('.csv');
    const isExcelOrOds = fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.ods');

    const reader = new FileReader();

    if (isExcelOrOds) {
      reader.onload = (event) => {
        try {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          if (!arrayBuffer) {
            throw new Error();
          }
          // التحويل التلقائي في الذاكرة
          const csvTextObj = convertSpreadsheetToData(arrayBuffer, file.name);
          const firstSheetCsv = Object.values(csvTextObj)[0] || '';
          prepareImport(firstSheetCsv, false);
        } catch (err) {
          setError('عذراً، يرجى التأكد من رفع ملف جدول بيانات صحيح.');
        } finally {
          setLoading(false);
        }
      };
      reader.onerror = () => {
        setError('عذراً، يرجى التأكد من رفع ملف جدول بيانات صحيح.');
        setLoading(false);
      };
      reader.readAsArrayBuffer(file);
    } else if (isCsv) {
      reader.onload = (event) => {
        try {
          const csvText = event.target?.result as string;
          if (csvText) {
            prepareImport(csvText, false);
          } else {
            throw new Error();
          }
        } catch (err) {
          setError('عذراً، يرجى التأكد من رفع ملف جدول بيانات صحيح.');
        } finally {
          setLoading(false);
        }
      };
      reader.onerror = () => {
        setError('عذراً، يرجى التأكد من رفع ملف جدول بيانات صحيح.');
        setLoading(false);
      };
      reader.readAsText(file);
    } else {
      // Auto-detect as Excel/ODS first, if fails read as text CSV
      reader.onload = (event) => {
        try {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          if (!arrayBuffer) {
            throw new Error();
          }
          const csvTextObj = convertSpreadsheetToData(arrayBuffer, file.name);
          const firstSheetCsv = Object.values(csvTextObj)[0] || '';
          prepareImport(firstSheetCsv, false);
        } catch {
          // If array buffer excel load failed, try reading file as CSV text
          const secondReader = new FileReader();
          secondReader.onload = (secEvent) => {
            try {
              const text = secEvent.target?.result as string;
              if (text && text.length > 5) {
                prepareImport(text, false);
              } else {
                setError('عذراً، يرجى التأكد من رفع ملف جدول بيانات صحيح.');
              }
            } catch {
              setError('عذراً، يرجى التأكد من رفع ملف جدول بيانات صحيح.');
            } finally {
              setLoading(false);
            }
          };
          secondReader.readAsText(file);
        }
      };
      reader.onerror = () => {
        setError('عذراً، يرجى التأكد من رفع ملف جدول بيانات صحيح.');
        setLoading(false);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const normalizeGoogleSheetsUrl = (url: string): string => {
    let cleaned = url.trim();
    try {
      // Use URL constructor for safe search param manipulation
      const urlObj = new URL(cleaned);
      
      // 1. If it's a published URL (contains /pubhtml or /pub)
      if (urlObj.pathname.includes('/pubhtml')) {
        urlObj.pathname = urlObj.pathname.replace('/pubhtml', '/pub');
        urlObj.searchParams.set('output', 'csv');
        return urlObj.toString();
      }
      
      if (urlObj.pathname.includes('/pub')) {
        return `https://docs.google.com/spreadsheets/d/${urlObj.pathname.match(/\/e\/([a-zA-Z0-9-_]+)/)?.[1] || ''}/export?format=xlsx`;
      }
      
      // 2. If it's a regular sheets URL (contains /spreadsheets/d/)
      const sheetIdMatch = urlObj.pathname.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (sheetIdMatch && sheetIdMatch[1]) {
        const spreadsheetId = sheetIdMatch[1];
        let exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=xlsx`;
        return exportUrl;
      }
    } catch (e) {
      console.warn("Failed to parse URL with URL constructor, falling back to regex: ", e);
    }
    
    // Fallback regex logic in case of weird URLs
    if (cleaned.includes('/pubhtml') || cleaned.includes('/pub')) {
      const sheetIdMatch = cleaned.match(/\/e\/([a-zA-Z0-9-_]+)/);
      if (sheetIdMatch && sheetIdMatch[1]) {
        cleaned = `https://docs.google.com/spreadsheets/d/${sheetIdMatch[1]}/export?format=xlsx`;
      }
    } else if (cleaned.includes('/spreadsheets/d/')) {
      const sheetIdMatch = cleaned.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (sheetIdMatch && sheetIdMatch[1]) {
        const spreadsheetId = sheetIdMatch[1];
        cleaned = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=xlsx`;
      }
    }
    
    return cleaned;
  };

  const fetchSheetsData = async (customUrl?: any, bypassConfirm = false) => {
    // Determine which URL to use
    let urlToUse = typeof customUrl === 'string' ? customUrl : googleSheetsUrl;
    if (!urlToUse || !urlToUse.trim()) {
      setError('يرجى إدخال رابط جدول بيانات أو Google Sheets صالح.');
      return;
    }
    setLoading(true);
    setError(null);

    const isGoogleSheets = urlToUse.includes('docs.google.com/spreadsheets');
    let finalUrl = urlToUse.trim();

    if (isGoogleSheets) {
      finalUrl = normalizeGoogleSheetsUrl(finalUrl);
    }

    // Ensure cache busting
    finalUrl = finalUrl.includes('?') 
      ? `${finalUrl}&t=${Date.now()}`
      : `${finalUrl}?t=${Date.now()}`;

    try {
      // Use our server-side proxy to bypass CORS completely and fetch any Google Sheet format safely!
      const proxyUrl = `/api/fetch-sheets-proxy?url=${encodeURIComponent(finalUrl)}`;
      const response = await fetch(proxyUrl, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      if (!response.ok) {
        throw new Error(`تعذر الاتصال بالرابط (كود الحالة: ${response.status})`);
      }

      // Automatically sync the updated URL to the backend config if successful and not a preset/mount call
      if (isAdmin && !customUrl) {
        try {
          await fetch('/api/google-sheets-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: urlToUse })
          });
        } catch (e) {
          console.error('Failed to sync sheets url to server config:', e);
        }
      }

      const contentType = response.headers.get('content-type') || '';
      const isBinary = contentType.includes('spreadsheet') || 
                       contentType.includes('excel') || 
                       contentType.includes('officedocument') || 
                       contentType.includes('opendocument') ||
                       finalUrl.toLowerCase().includes('.xlsx') ||
                       finalUrl.toLowerCase().includes('.xls') ||
                       finalUrl.toLowerCase().includes('.ods');

      if (isBinary) {
        const arrayBuffer = await response.arrayBuffer();
        const csvTextObj = convertSpreadsheetToData(arrayBuffer, 'downloaded_sheet');
        const sheetsCsvText = Object.values(csvTextObj).join('\n'); // temporarily join or process appropriately
        if (bypassConfirm === true) {
          importCSVData(sheetsCsvText, true);
        } else {
          prepareImport(sheetsCsvText, true);
        }
      } else {
        const textText = await response.text();
        // If it looks like HTML, maybe the user supplied a regular non-exported URL
        if (textText.trim().startsWith('<') || textText.includes('<!DOCTYPE html>')) {
          throw new Error('الملف المسترجع هو صفحة ويب وليس جدول بيانات. تأكد من مشاركة الملف للجميع للقراءة.');
        }
        if (bypassConfirm === true) {
          importCSVData(textText, true);
        } else {
          prepareImport(textText, true);
        }
      }
    } catch (err: any) {
      console.error('Fetch Sheets error:', err);
      setError(err?.message || 'عذراً، يرجى التأكد من أن الرابط صالح ومشارك للجميع كعرض للقراءة.');
    } finally {
      setLoading(false);
    }
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFamilyIds, setSelectedFamilyIds] = useState<string[]>([]);
  const [bulkSelectedSurname, setBulkSelectedSurname] = useState('');
  const [bulkCustomSurname, setBulkCustomSurname] = useState('');
  const [bulkIsNewSurname, setBulkIsNewSurname] = useState(false);

  // Dynamic unified surnames list
  const uniqueSurnames = useMemo(() => {
    const names = (families || [])
      .map(f => f.familyName?.trim())
      .filter(Boolean);
    return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b, 'ar'));
  }, [families]);

  const handleBulkSaveSurnames = () => {
    const finalSurname = bulkIsNewSurname ? bulkCustomSurname.trim() : bulkSelectedSurname.trim();
    if (!finalSurname) {
      alert('يرجى اختيار أو كتابة اللقب الموحد لتطبيقه جماعياً');
      return;
    }

    if (!window.confirm(`هل أنت متأكد من تغيير اللقب إلى "${finalSurname}" لجميع العائلات المحددة (${selectedFamilyIds.length})؟`)) {
      return;
    }

    const updatedFamilies = families.map(f => {
      if (selectedFamilyIds.includes(f.id)) {
        return { ...f, familyName: finalSurname };
      }
      return f;
    });

    setFamilies(updatedFamilies);
    setSelectedFamilyIds([]);
    setBulkSelectedSurname('');
    setBulkIsNewSurname(false);
    setBulkCustomSurname('');
    alert('تم تحديث الألقاب وحفظها جماعياً بنجاح في قاعدة البيانات!');
  };
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('الكل');
  const [selectedSupportStatus, setSelectedSupportStatus] = useState('الكل');
  const [selectedResidence, setSelectedResidence] = useState('الكل');
  const [selectedHealthFilter, setSelectedHealthFilter] = useState('الكل'); // الكل, ذوي احتياجات خاصة, مرض مزمن

  // Advanced search states
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [advSearchGlobal, setAdvSearchGlobal] = useState(''); // Unified search field: Name, Surname, or Phone
  const [advSearchNeighborhood, setAdvSearchNeighborhood] = useState('الكل');
  const [advSearchMinMembers, setAdvSearchMinMembers] = useState<number | ''>('');
  const [advSearchMaxMembers, setAdvSearchMaxMembers] = useState<number | ''>('');
  const [advSearchResidence, setAdvSearchResidence] = useState('الكل'); // دائمة / مؤقتة / الكل
  const [residenceSearchQuery, setResidenceSearchQuery] = useState('');
  const [isResidenceDropdownOpen, setIsResidenceDropdownOpen] = useState(false);

  // Dynamic residence options pulled from column G (residence) of families
  const residenceOptions = useMemo(() => {
    const options = new Set<string>(['دائمة', 'مؤقتة', 'نازح']);
    families.forEach(f => {
      if (f.residence && f.residence.trim()) {
        options.add(f.residence.trim());
      }
    });
    return Array.from(options);
  }, [families]);
  
  // Sorting state
  const [sortBy, setSortBy] = useState<'familyName' | 'neighborhood' | 'membersCount' | 'registeredAt'>('familyName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Expanded family row IDs
  const [expandedFamilyIds, setExpandedFamilyIds] = useState<string[]>([]);

  const toggleExpandFamily = (id: string) => {
    if (expandedFamilyIds.includes(id)) {
      setExpandedFamilyIds(expandedFamilyIds.filter(fId => fId !== id));
    } else {
      setExpandedFamilyIds([...expandedFamilyIds, id]);
    }
  };

  const handleSort = (field: 'familyName' | 'neighborhood' | 'membersCount' | 'registeredAt') => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  // Filter and sort family list
  const filteredFamilies = useMemo(() => {
    let result = [...families];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(f => 
        f.familyName.toLowerCase().includes(q) ||
        f.breadwinnerName.toLowerCase().includes(q) ||
        f.phone.includes(q) ||
        (f.notes && f.notes.toLowerCase().includes(q))
      );
    }

    // Neighborhood filter
    const neighborhoodToUse = showAdvancedSearch && advSearchNeighborhood !== 'الكل' ? advSearchNeighborhood : selectedNeighborhood;
    if (neighborhoodToUse !== 'الكل') {
      result = result.filter(f => f.neighborhood === neighborhoodToUse);
    }

    // Support Status filter
    if (selectedSupportStatus !== 'الكل') {
      result = result.filter(f => f.supportStatus === selectedSupportStatus);
    }

    // Residence / الإقامة filter (pulled dynamically from Column G / residence)
    const residenceToUse = showAdvancedSearch && advSearchResidence !== 'الكل' ? advSearchResidence : selectedResidence;
    if (residenceToUse !== 'الكل') {
      result = result.filter(f => f.residence === residenceToUse);
    }

    // Health condition filter (checks if nested members match)
    if (selectedHealthFilter !== 'الكل') {
      result = result.filter(f => 
        f.members.some(m => m.healthStatus === selectedHealthFilter)
      );
    }

    // Advanced Search specific filters
    if (showAdvancedSearch) {
      // 1. Unified Global Search: Name (breadwinner or member), Surname, or Phone
      if (advSearchGlobal.trim()) {
        const q = advSearchGlobal.toLowerCase();
        result = result.filter(f => {
          // Check surname
          if (f.familyName && f.familyName.toLowerCase().includes(q)) return true;
          // Check phone
          if (f.phone && f.phone.includes(q)) return true;
          // Check breadwinner name
          if (f.breadwinnerName && f.breadwinnerName.toLowerCase().includes(q)) return true;
          // Check dependents names or their phones
          return f.members.some(m => 
            (m.name && m.name.toLowerCase().includes(q)) || 
            (m.phone && m.phone.includes(q))
          );
        });
      }

      // 3. Min family members
      if (advSearchMinMembers !== '') {
        result = result.filter(f => f.members.length >= Number(advSearchMinMembers));
      }

      // 4. Max family members
      if (advSearchMaxMembers !== '') {
        result = result.filter(f => f.members.length <= Number(advSearchMaxMembers));
      }
    }

    // Sorting
    result.sort((a, b) => {
      let valA: any = a[sortBy];
      let valB: any = b[sortBy];

      if (sortBy === 'membersCount') {
        valA = a.members.length;
        valB = b.members.length;
      }

      if (typeof valA === 'string') {
        return sortDirection === 'asc' 
          ? valA.localeCompare(valB, 'ar') 
          : valB.localeCompare(valA, 'ar');
      } else {
        return sortDirection === 'asc' 
          ? (valA > valB ? 1 : -1) 
          : (valA < valB ? 1 : -1);
      }
    });

    return result;
  }, [
    families, 
    searchQuery, 
    selectedNeighborhood, 
    selectedSupportStatus, 
    selectedResidence, 
    selectedHealthFilter, 
    sortBy, 
    sortDirection,
    showAdvancedSearch,
    advSearchGlobal,
    advSearchNeighborhood,
    advSearchMinMembers,
    advSearchMaxMembers,
    advSearchResidence
  ]);

  // Statistics for the filtered list
  const filterStats = useMemo(() => {
    const totalFamilies = filteredFamilies.length;
    const totalPop = filteredFamilies.reduce((sum, f) => sum + f.members.length, 0);
    const needyFamilies = filteredFamilies.filter(f => f.supportStatus === 'مستحق للدعم').length;

    return { totalFamilies, totalPop, needyFamilies };
  }, [filteredFamilies]);

  // ملخص إحصائية المحلات والعائلات (معادلة برمجية لـ streamlit groupby)
  const neighborhoodSummary = useMemo(() => {
    const summaryMap: Record<string, { totalMembers: number; familyCount: number }> = {};
    families.forEach(f => {
      const nh = f.neighborhood || 'غير محدد';
      if (!summaryMap[nh]) {
        summaryMap[nh] = { totalMembers: 0, familyCount: 0 };
      }
      summaryMap[nh].totalMembers += f.members.length;
      summaryMap[nh].familyCount += 1;
    });
    return Object.entries(summaryMap).map(([name, stats]) => ({
      name,
      ...stats
    }));
  }, [families]);

  return (
    <div className="space-y-5 font-sans relative">
      {syncSuccess && (
        <div className="fixed top-5 left-5 z-50 bg-[#4A5D4E] text-[#FDFBF7] px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce border border-emerald-500 max-w-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 animate-pulse" />
          <div className="text-right">
            <p className="text-xs font-bold">تمت المزامنة بنجاح!</p>
            <p className="text-[10px] text-gray-200">تم جلب وتحديث البيانات الحية من Google Sheets بنجاح.</p>
          </div>
        </div>
      )}

      {/* Prominent Header Banner with Instant Refresh Button */}
      <div className="bg-gradient-to-l from-[#3E4C41] to-[#4A5D4E] text-[#FDFBF7] rounded-3xl p-6 border border-[#2D3A30] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-base sm:text-lg font-extrabold flex items-center gap-2">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
            سجل الأسر والمواطنين المعتمد
          </h2>
          <p className="text-xs text-[#E2DED0] max-w-2xl leading-relaxed">
            قاعدة بيانات مسوح العائلات وتعداد المواطنين لقرية الحصن والمحلات المجاورة. يتم الرصد والتحديث عبر جلب البيانات الحية من جداول البيانات المشتركة.
          </p>
        </div>
        <button
          onClick={() => fetchSheetsData(googleSheetsUrl, true)}
          disabled={loading}
          className="w-full md:w-auto bg-[#E9F0E0] hover:bg-[#DDE5B6] text-[#4A5D4E] px-5 py-2.5 rounded-xl text-xs font-black border border-[#DDE5B6] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:scale-[1.02] duration-150 disabled:opacity-75"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'جاري التحديث الحقيقي...' : '🔄 تحديث البيانات الحية'}
        </button>
      </div>

      {/* لوحة تحكم الإدارة لـ سجل الأسر */}
      {(isAdministrative || (currentUser?.role === 'super-admin' || currentUser?.role === 'admin' || currentUser?.permissions?.canAccessAdvancedImport === true)) ? (
        <div className="bg-gradient-to-br from-[#FDFBF7] to-[#F4F1EA] border-2 border-dashed border-[#4A5D4E]/40 p-6 rounded-3xl space-y-4 shadow-3xs animate-fadeIn">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#E2DED0] pb-3">
            <div className="flex items-center gap-2.5">
              <Shield className="w-5 h-5 text-[#4A5D4E] shrink-0" />
              <div>
                <h3 className="font-extrabold text-[#2D3A30] text-xs sm:text-sm">
                  لوحة إدارة ومزامنة سجل الأسرة والمواطنين
                </h3>
                <p className="text-[10px] text-[#7A8B7E]">
                  يمكنك استعراض ومزامنة قاعدة بيانات سجل الأسرة والتعداد السكاني لقرية الحصن والمحلات المجاورة.
                </p>
              </div>
            </div>
            {/* Status indicator inside dashboard */}
            <div className="flex items-center gap-2 bg-[#E9F0E0] border border-[#DDE5B6] px-3 py-1.5 rounded-xl text-[11px] font-bold text-[#4A5D4E]">
              <span className={`w-2 h-2 rounded-full ${
                dataSourceStatus === 'تم جلب البيانات من الرابط'
                  ? 'bg-emerald-500 animate-pulse'
                  : dataSourceStatus === 'تم جلب البيانات من الملف المرفوع'
                  ? 'bg-blue-500 animate-pulse'
                  : 'bg-amber-500 animate-pulse'
              }`} />
              <span>{dataSourceStatus}</span>
            </div>
          </div>

          {/* Collapsible Section for Advanced Data Tools */}
          {(currentUser?.role === 'super-admin' || currentUser?.role === 'admin' || currentUser?.permissions?.canAccessAdvancedImport === true) ? (
            <div className="border border-[#E2DED0] bg-white rounded-2xl overflow-hidden shadow-sm">
              <button
                type="button"
                onClick={() => setShowAdvancedImport(!showAdvancedImport)}
                className="w-full flex justify-between items-center px-5 py-4 bg-[#F4F1EA]/50 hover:bg-[#F4F1EA] text-[#2D3A30] transition-colors cursor-pointer outline-none border-0"
              >
                <span className="flex items-center gap-2 text-xs font-extrabold text-[#2D3A30]">
                  <span>⚙️</span>
                  <span>أدوات إدارة واستيراد البيانات المتقدمة</span>
                </span>
                {showAdvancedImport ? <ChevronUp className="w-4 h-4 text-[#4A5D4E]" /> : <ChevronDown className="w-4 h-4 text-[#4A5D4E]" />}
              </button>

              {showAdvancedImport && (
                <div className="p-5 space-y-4 border-t border-[#E2DED0] bg-white animate-fadeIn">
                  {/* خيارات المعالجة: استبدال البيانات السابقة أو تحديث إضافي */}
                  <div className="bg-white p-4 rounded-2xl border border-[#E2DED0] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-xs font-extrabold text-[#2D3A30] block">طريقة معالجة واستيراد البيانات الجديدة</span>
                      <span className="text-[10px] text-[#7A8B7E] block leading-relaxed">
                        اختر "استبدال البيانات" لمسح السجل القديم كاملاً، أو "تحديث إضافي" لدمج وتحديث الأسر الحالية مع الحفاظ على البقية.
                      </span>
                    </div>
                    <div className="flex bg-[#F4F1EA] p-1 rounded-2xl border border-[#D1CAB8] shrink-0 self-stretch md:self-auto justify-between gap-1.5">
                      <button
                        type="button"
                        onClick={() => setImportMode('replace')}
                        className={`flex-1 md:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
                          importMode === 'replace'
                            ? 'bg-[#4A5D4E] text-[#FDFBF7] shadow-sm scale-101 font-extrabold'
                            : 'text-[#5F6C61] hover:text-[#2D3A30] opacity-85 hover:opacity-100 font-medium'
                        }`}
                      >
                        استبدال البيانات السابقة
                      </button>
                      <button
                        type="button"
                        onClick={() => setImportMode('append')}
                        className={`flex-1 md:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
                          importMode === 'append'
                            ? 'bg-[#4A5D4E] text-[#FDFBF7] shadow-sm scale-101 font-extrabold'
                            : 'text-[#5F6C61] hover:text-[#2D3A30] opacity-85 hover:opacity-100 font-medium'
                        }`}
                      >
                        تحديث إضافي (دمج تراكمي)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                    {/* Link Updater Block */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-extrabold text-[#3E4C41] block">
                        مزامنة وجلب البيانات من رابط Google Sheets جديد
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Link className="absolute right-3 top-2.5 text-[#7A8B7E] w-4 h-4" />
                          <input
                            type="url"
                            value={googleSheetsUrl}
                            onChange={(e) => setGoogleSheetsUrl(e.target.value)}
                            placeholder="ضع هنا رابط المشاركة العادي، رابط التعديل، أو رابط النشر على الويب من Google Sheets..."
                            className="w-full pl-3 pr-9 py-2 rounded-xl border border-[#E2DED0] bg-white text-xs text-[#3E4C41] focus:ring-2 focus:ring-[#4A5D4E]/20 focus:border-[#4A5D4E] transition-all outline-none"
                          />
                        </div>
                        <button
                          onClick={() => fetchSheetsData(googleSheetsUrl, false)}
                          disabled={loading}
                          className="bg-[#4A5D4E] hover:bg-[#3E4C41] disabled:bg-[#7A8B7E] text-[#FDFBF7] px-4 py-2 rounded-xl text-xs font-bold transition-all border border-[#4A5D4E] cursor-pointer shadow-xs shrink-0 flex items-center gap-1.5"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                          جلب البيانات
                        </button>
                      </div>
                      <p className="text-[10px] text-emerald-700 leading-relaxed font-medium">
                        * يمكنك إدخال أي رابط لجدول بيانات Google Sheets (سواء كان رابط المشاركة العادي، رابط التعديل من المتصفح، أو رابط النشر). وسيقوم النظام تلقائياً بتحويله وتحديث السجلات فوراً.
                      </p>
                    </div>

                    {/* CSV File Upload Block */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-extrabold text-[#3E4C41] block">
                        تحديث سجلات الأسر برفع ملف محلي (Excel أو ODS أو CSV)
                      </label>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          accept=".csv,.xlsx,.xls,.ods"
                          className="hidden"
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={loading}
                          className="flex-1 bg-white hover:bg-[#FDFBF7] disabled:bg-slate-50 text-[#3E4C41] hover:text-[#2D3A30] border border-[#E2DED0] px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Upload className="w-4 h-4 text-[#4A5D4E]" />
                          رفع ملف جدول بيانات محلي
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('هل تريد إعادة تعيين السجل والرجوع للبيانات الافتراضية؟')) {
                              localStorage.removeItem('local_families_v1');
                              window.location.reload();
                            }
                          }}
                          className="bg-white hover:bg-[#FDFBF7] text-[#7A8B7E] hover:text-[#4A5D4E] border border-[#E2DED0] px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs shrink-0 border-0"
                          title="إعادة تعيين وجلب البيانات الافتراضية"
                        >
                          إعادة تعيين الافتراضي
                        </button>
                      </div>
                      <p className="text-[10px] text-[#7A8B7E] leading-relaxed">
                        * قم برفع ملف الـ CSV أو Excel أو ODS المحلي من جهازك وسيقوم النظام بتحديث سجل الأسر والتقارير والخريطة بالكامل فوراً بعد تأكيدك.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-100 p-3.5 rounded-2xl text-xs font-bold text-amber-800">
              🔒 خيارات ومزامنة استيراد البيانات المتقدمة محمية ومخفية لعدم توفر الصلاحية لحسابك حالياً. يمكنك طلب منح الصلاحية من لوحة تحكم المشرف العام.
            </div>
          )}

          {error && (
            <div className="bg-rose-50 border border-rose-100 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs text-rose-900 mt-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold">حدث خطأ أثناء معالجة أو جلب البيانات:</p>
                <p className="text-[11px] text-rose-800 leading-relaxed mt-0.5">{error}</p>
              </div>
            </div>
          )}
        </div>
      ) : isAdmin ? (
        <div className="bg-[#FFFDF9] border border-amber-200/80 p-5 rounded-3xl space-y-2">
          <div className="flex items-start gap-2.5">
            <Shield className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-extrabold text-[#2D3A30]">مستوى الصلاحية الحالي: {userRole === 'User' ? 'مستخدم معتمد' : 'مشرف سجلات'}</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                أنت مسجل حالياً بصفة {userRole === 'User' ? 'مستخدم معتمد' : 'مشرف'} في المنصة. {canWriteFamilies ? 'لديك صلاحية إضافة وتعديل بيانات الأسر يدوياً.' : 'لديك صلاحية عرض السجلات فقط لقسم الأسر.'}
              </p>
              <p className="text-[10.5px] text-amber-700 font-semibold leading-relaxed">
                ⚠️ ملاحظة: صلاحيات جلب البيانات والربط المباشر مع Google Sheets أو رفع ملفات CSV الخارجية مقتصرة فقط على المشرف العام أو الأدوار الإدارية (Admin, Manager).
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#FDFBF7] border border-[#E2DED0] p-4 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <h4 className="text-xs font-extrabold text-[#2D3A30] flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-[#7A8B7E]" />
              سجل الأسر الإحصائي (عرض للقراءة فقط)
            </h4>
            <p className="text-[10px] text-[#7A8B7E]">
              كافة البيانات الإحصائية وسجل العائلات معروضة حالياً للقراءة فقط للزوار.
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto shrink-0 justify-end">
            <button
              onClick={() => {
                const loginBtn = document.querySelector('button[onClick*="setIsLoginOpen"]');
                if (loginBtn) {
                  (loginBtn as HTMLElement).click();
                } else {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className="text-[10px] font-bold text-[#4A5D4E] hover:text-[#3E4C41] border border-[#4A5D4E]/30 hover:border-[#4A5D4E] px-3.5 py-2 rounded-xl bg-white transition-all cursor-pointer shadow-2xs shrink-0 flex items-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5" />
              تسجيل الدخول كمدير معتمد
            </button>
          </div>
        </div>
      )}

      {/* إحصائية المحلات والعائلات (مستخرج تلقائياً) */}
      <div className="bg-[#FDFBF7] rounded-3xl p-5 border border-[#E2DED0] shadow-3xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#E2DED0] pb-2">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#4A5D4E]" />
            <h4 className="font-extrabold text-xs sm:text-sm text-[#2D3A30]">
              إحصائية المحلات والعائلات (ملخص التعداد التلقائي)
            </h4>
          </div>
          <span className="text-[10px] bg-[#E9F0E0] border border-[#DDE5B6] px-2.5 py-1 rounded-lg font-bold text-[#4A5D4E]">
            {neighborhoodSummary.length} محلات مسجلة
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          {/* جدول الإحصائيات المرتب */}
          <div className="border border-[#F4F1EA] rounded-2xl overflow-hidden max-h-[220px] overflow-y-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#F4F1EA] text-[#7A8B7E] sticky top-0">
                <tr>
                  <th className="p-3 font-bold">المحلة</th>
                  <th className="p-3 font-bold">إجمالي الأفراد</th>
                  <th className="p-3 font-bold">عدد العائلات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4F1EA] bg-white">
                {neighborhoodSummary.map((summary, idx) => (
                  <tr key={idx} className="hover:bg-[#FDFBF7] transition-all">
                    <td className="p-3 text-[#2D3A30] font-bold">{summary.name}</td>
                    <td className="p-3 text-[#3E4C41] font-mono">{summary.totalMembers} فرد</td>
                    <td className="p-3 text-[#4A5D4E] font-bold font-mono">{summary.familyCount} عائلة</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ملخص الإحصائيات السريع */}
          <div className="bg-[#F4F1EA]/50 border border-[#E2DED0] rounded-2xl p-4 space-y-3">
            <h5 className="font-bold text-[#2D3A30] text-xs">ملخص سريع للمرصد السكاني</h5>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-3 rounded-xl border border-[#E2DED0]/60 space-y-1">
                <span className="text-[10px] text-[#7A8B7E] block">إجمالي العائلات</span>
                <span className="text-sm font-extrabold text-[#2D3A30] font-mono">
                  {families.length} عائلة
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-[#E2DED0]/60 space-y-1">
                <span className="text-[10px] text-[#7A8B7E] block">إجمالي المواطنين</span>
                <span className="text-sm font-extrabold text-[#4A5D4E] font-mono">
                  {families.reduce((acc, f) => acc + f.members.length, 0)} فرد
                </span>
              </div>
            </div>
            <p className="text-[10px] text-[#7A8B7E] leading-relaxed">
              * يتم رصد وتحليل هذه الأرقام فورياً بناءً على أي ملف يتم رفعه أو تحديثه بواسطة المشرف أو جلب البيانات من Google Sheets.
            </p>
          </div>
        </div>
      </div>

      {/* Bulk Action Panel (Exclusive to Super Admin) */}
      {isSuperAdminUser && (
        <div className="bg-[#FFFDF9] p-4 rounded-2xl border-2 border-[#A98467]/40 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md animate-fadeIn mb-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">🛠️</span>
            <div>
              <h4 className="font-extrabold text-xs text-[#2D3A30]">تحديث جماعي للألقاب العائلية (المشرف العام)</h4>
              <p className="text-[10px] text-gray-500">
                تم تحديد <strong className="text-[#A98467] font-black">{selectedFamilyIds.length}</strong> عائلات لتغيير اللقب دفعة واحدة.
                {selectedFamilyIds.length === 0 && (
                  <span className="text-red-500 mr-1.5 font-bold">(يرجى تحديد عائلة أو أكثر من الجدول أدناه لتفعيل التعديل الجماعي)</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-[#3E4C41]">اللقب الموحد السائد:</span>
              <select
                value={bulkSelectedSurname}
                disabled={selectedFamilyIds.length === 0}
                onChange={(e) => {
                  setBulkSelectedSurname(e.target.value);
                  if (e.target.value === '__new__') {
                    setBulkIsNewSurname(true);
                  } else {
                    setBulkIsNewSurname(false);
                  }
                }}
                className="px-2.5 py-1.5 rounded-lg border border-[#E2DED0] text-xs bg-white text-[#3E4C41] font-black outline-none focus:border-[#4A5D4E] disabled:bg-[#F4F1EA] disabled:text-gray-400 cursor-pointer"
              >
                <option value="">-- اختر اللقب الموحد --</option>
                {uniqueSurnames.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
                <option value="__new__">➕ إضافة لقب جديد...</option>
              </select>
            </div>

            {bulkIsNewSurname && selectedFamilyIds.length > 0 && (
              <input
                type="text"
                value={bulkCustomSurname}
                onChange={(e) => setBulkCustomSurname(e.target.value)}
                placeholder="اكتب اللقب الجديد..."
                className="px-2.5 py-1.5 rounded-lg border border-[#A98467] text-xs bg-white text-[#2D3A30] font-bold outline-none"
              />
            )}

            <button
              onClick={handleBulkSaveSurnames}
              disabled={selectedFamilyIds.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer border-0"
            >
              تحديث اللقب وحفظ جماعي
            </button>
            
            {selectedFamilyIds.length > 0 && (
              <button
                onClick={() => {
                  setSelectedFamilyIds([]);
                  setBulkSelectedSurname('');
                  setBulkIsNewSurname(false);
                  setBulkCustomSurname('');
                }}
                className="text-[11px] text-red-600 hover:text-red-700 font-bold cursor-pointer bg-transparent border-0"
              >
                إلغاء التحديد
              </button>
            )}
          </div>
        </div>
      )}

      {/* Controls Card */}
      <div className="bg-[#F4F1EA] rounded-3xl p-6 border border-[#E2DED0] shadow-sm space-y-4 mb-4">
        {/* Top bar: search and main CTA */}
        <div className="flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
          <div className="flex flex-col sm:flex-row gap-2 flex-1 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-2.5 text-[#7A8B7E] w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن عائلة، رب الأسرة، رقم هاتف أو كلمات دالة..."
                className="w-full pl-3 pr-9 py-2 rounded-xl border border-[#E2DED0] bg-white text-xs text-[#3E4C41] focus:ring-2 focus:ring-[#4A5D4E]/20 focus:border-[#4A5D4E] transition-all outline-none"
              />
            </div>
            
            {/* Advanced Search Toggle Button */}
            <button
              onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
                showAdvancedSearch 
                  ? 'bg-[#4A5D4E] text-[#FDFBF7] border-[#4A5D4E]' 
                  : 'bg-white text-[#3E4C41] border-[#E2DED0] hover:bg-[#FDFBF7]'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>بحث متقدم</span>
              {showAdvancedSearch ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Advanced Search Panel */}
        {showAdvancedSearch && (
          <div className="bg-white/85 border border-[#E2DED0] rounded-2xl p-4 md:p-5 space-y-4 shadow-3xs transition-all">
            <div className="flex items-center justify-between border-b border-[#F4F1EA] pb-2">
              <h4 className="font-extrabold text-xs text-[#2D3A30]">
                معايير البحث والفلترة المتقدمة (متعددة الخيارات)
              </h4>
              <button
                onClick={() => {
                  setAdvSearchGlobal('');
                  setAdvSearchNeighborhood('الكل');
                  setAdvSearchMinMembers('');
                  setAdvSearchMaxMembers('');
                  setAdvSearchResidence('الكل');
                  setSearchQuery('');
                }}
                className="text-[10px] text-red-600 hover:text-red-700 font-bold flex items-center gap-1 cursor-pointer bg-transparent border-0"
              >
                <RefreshCw className="w-3 h-3" />
                إعادة تعيين الكل
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {/* Unified Search Name / Phone / Surname */}
              <div className="sm:col-span-2">
                <label className="block text-[10px] text-[#7A8B7E] mb-1 font-bold">بحث شامل (الاسم، اللقب، أو رقم الهاتف)</label>
                <input
                  type="text"
                  value={advSearchGlobal}
                  onChange={(e) => setAdvSearchGlobal(e.target.value)}
                  placeholder="مثال: محمد، السقاف، 77..."
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2DED0] text-xs bg-white text-[#3E4C41] font-medium outline-none focus:border-[#4A5D4E]"
                />
              </div>

              {/* Neighborhood / Locality */}
              <div>
                <label className="block text-[10px] text-[#7A8B7E] mb-1 font-bold">المحلة / المنطقة</label>
                <select
                  value={advSearchNeighborhood}
                  onChange={(e) => setAdvSearchNeighborhood(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2DED0] text-xs bg-white text-[#3E4C41] font-medium outline-none focus:border-[#4A5D4E]"
                >
                  <option value="الكل">جميع المحلات</option>
                  {uniqueNeighborhoods.map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              {/* Residence status (dynamically pulled from Sheet Column G) */}
              <div className="relative">
                <label className="block text-[10px] text-[#7A8B7E] mb-1 font-bold">حالة الإقامة (العمود G)</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsResidenceDropdownOpen(!isResidenceDropdownOpen)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2DED0] text-xs bg-white text-[#3E4C41] font-medium text-right flex justify-between items-center cursor-pointer min-h-[32px]"
                  >
                    <span>{advSearchResidence === 'الكل' ? 'كل حالات الإقامة' : advSearchResidence}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-[#7A8B7E]" />
                  </button>

                  {isResidenceDropdownOpen && (
                    <div className="absolute z-50 mt-1 w-full bg-white border border-[#E2DED0] rounded-xl shadow-lg p-2 space-y-2 max-h-56 overflow-y-auto">
                      <div className="relative">
                        <input
                          type="text"
                          value={residenceSearchQuery}
                          onChange={(e) => setResidenceSearchQuery(e.target.value)}
                          placeholder="ابحث عن حالة الإقامة..."
                          className="w-full pl-8 pr-2.5 py-1.5 rounded-lg border border-[#E2DED0] text-xs bg-white text-[#3E4C41] outline-none"
                        />
                        <Search className="w-3.5 h-3.5 text-[#7A8B7E] absolute left-2.5 top-2.5" />
                      </div>
                      <div className="divide-y divide-[#F4F1EA] max-h-36 overflow-y-auto font-sans">
                        <button
                          type="button"
                          onClick={() => {
                            setAdvSearchResidence('الكل');
                            setIsResidenceDropdownOpen(false);
                            setResidenceSearchQuery('');
                          }}
                          className={`w-full text-right px-2.5 py-1.5 text-xs hover:bg-[#F4F1EA] rounded-md transition-all flex items-center justify-between cursor-pointer ${
                            advSearchResidence === 'الكل' ? 'bg-[#E9F0E0] text-[#4A5D4E] font-bold' : 'text-[#3E4C41]'
                          }`}
                        >
                          <span>كل حالات الإقامة</span>
                        </button>
                        {residenceOptions
                          .filter(opt => opt.toLowerCase().includes(residenceSearchQuery.toLowerCase()))
                          .map(opt => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => {
                                setAdvSearchResidence(opt);
                                setIsResidenceDropdownOpen(false);
                                setResidenceSearchQuery('');
                              }}
                              className={`w-full text-right px-2.5 py-1.5 text-xs hover:bg-[#F4F1EA] rounded-md transition-all flex items-center justify-between cursor-pointer ${
                                advSearchResidence === opt ? 'bg-[#E9F0E0] text-[#4A5D4E] font-bold' : 'text-[#3E4C41]'
                              }`}
                            >
                              <span>{opt}</span>
                            </button>
                          ))
                        }
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Family members count range */}
              <div className="sm:col-span-2">
                <label className="block text-[10px] text-[#7A8B7E] mb-1 font-bold">عدد أفراد الأسرة (نطاق)</label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="1"
                      value={advSearchMinMembers === '' ? '' : advSearchMinMembers}
                      onChange={(e) => setAdvSearchMinMembers(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                      placeholder="الحد الأدنى للأفراد"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2DED0] text-xs bg-white text-[#3E4C41] font-medium outline-none focus:border-[#4A5D4E]"
                    />
                    <span className="absolute left-2.5 top-1.5 text-[9px] text-[#7A8B7E] font-bold">كحد أدنى</span>
                  </div>
                  <span className="text-[#7A8B7E] text-xs font-bold">إلى</span>
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="1"
                      value={advSearchMaxMembers === '' ? '' : advSearchMaxMembers}
                      onChange={(e) => setAdvSearchMaxMembers(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                      placeholder="الحد الأقصى للأفراد"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2DED0] text-xs bg-white text-[#3E4C41] font-medium outline-none focus:border-[#4A5D4E]"
                    />
                    <span className="absolute left-2.5 top-1.5 text-[9px] text-[#7A8B7E] font-bold">كحد أقصى</span>
                  </div>
                </div>
              </div>

              {/* Extra visual indicators / info */}
              <div className="flex items-end justify-start text-[10px] text-[#7A8B7E] leading-tight pb-1">
                <div>
                  <span className="font-bold text-[#4A5D4E]">نتائج البحث الحالي:</span> {filteredFamilies.length} عائلة مستوفية للمعايير.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Filtering Controls */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 border-t border-[#E2DED0] pt-3">
          {/* Neighborhood filter */}
          <div>
            <label className="block text-[10px] text-[#7A8B7E] mb-1 font-bold">المحلة</label>
            <select
              value={selectedNeighborhood}
              onChange={(e) => setSelectedNeighborhood(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2DED0] text-xs bg-white text-[#3E4C41] font-medium"
            >
              <option value="الكل">جميع المحلات</option>
              {uniqueNeighborhoods.map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          {/* Support status filter */}
          <div>
            <label className="block text-[10px] text-[#7A8B7E] mb-1 font-bold">حالة الاستحقاق</label>
            <select
              value={selectedSupportStatus}
              onChange={(e) => setSelectedSupportStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2DED0] text-xs bg-white text-[#3E4C41] font-medium"
            >
              <option value="الكل">جميع الحالات</option>
              <option value="مستحق للدعم">مستحق للدعم</option>
              <option value="تحت الدراسة">تحت الدراسة</option>
              <option value="غير مستحق / مكتفي">مكتفي ذاتياً</option>
            </select>
          </div>

          {/* Residence status filter */}
          <div>
            <label className="block text-[10px] text-[#7A8B7E] mb-1 font-bold">حالة الإقامة</label>
            <select
              value={selectedResidence}
              onChange={(e) => setSelectedResidence(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2DED0] text-xs bg-white text-[#3E4C41] font-medium"
            >
              <option value="الكل">جميع حالات الإقامة</option>
              {residenceOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Special health needs filter */}
          <div>
            <label className="block text-[10px] text-[#7A8B7E] mb-1 font-bold">الحالة الصحية لأفراد الأسرة</label>
            <select
              value={selectedHealthFilter}
              onChange={(e) => setSelectedHealthFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2DED0] text-xs bg-white text-[#3E4C41] font-medium"
            >
              <option value="الكل">جميع الحالات الطبية</option>
              <option value="ذوي احتياجات خاصة">أسر بها ذوي احتياجات خاصة</option>
              <option value="مرض مزمن">أسر بها مرضى مزمنين</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filter Stats Ribbon */}
      <div className="bg-[#FDFBF7] p-3 rounded-2xl border border-[#E2DED0] flex items-center justify-between text-xs text-[#3E4C41] px-4 shadow-sm mb-4">
        <div className="flex gap-4">
          <span>نتائج البحث: <strong className="text-[#2D3A30] font-extrabold">{filterStats.totalFamilies}</strong> عائلات</span>
          <span>•</span>
          <span>إجمالي الأفراد: <strong className="text-[#2D3A30] font-extrabold">{filterStats.totalPop}</strong> نسمة</span>
          <span>•</span>
          <span>تحت خط الدعم: <strong className="text-[#A98467] font-extrabold">{filterStats.needyFamilies}</strong></span>
        </div>
        <span className="text-[10px] text-[#7A8B7E] font-mono hidden md:inline">محدّث تلقائياً</span>
      </div>

      {/* Families List Table */}
      <div className="bg-white rounded-3xl border border-[#E2DED0] shadow-sm overflow-hidden">
        {filteredFamilies.length > 0 ? (
          <div className="overflow-x-auto max-h-[650px] overflow-y-auto scrollbar-thin">
            <table className="w-full text-right text-xs table-auto">
              <thead className="bg-[#FDFBF7] text-[#7A8B7E] font-bold border-b border-[#E2DED0] sticky top-0 z-10 shadow-xs">
                <tr>
                  <th className="p-4 w-8"></th>
                  {isSuperAdminUser && (
                    <th className="p-4 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={filteredFamilies.length > 0 && selectedFamilyIds.length === filteredFamilies.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFamilyIds(filteredFamilies.map(f => f.id));
                          } else {
                            setSelectedFamilyIds([]);
                          }
                        }}
                        className="accent-[#4A5D4E] h-4 w-4 cursor-pointer"
                        title="تحديد الكل للتعديل الجماعي"
                      />
                    </th>
                  )}
                  <th className="p-4">اسم رب الأسرة</th>
                  <th className="p-4">رقم الهاتف</th>
                  <th className="p-4 cursor-pointer hover:bg-[#F4F1EA] transition-all" onClick={() => handleSort('familyName')}>
                    <div className="flex items-center gap-1">
                      <span>اللقب</span>
                      <ArrowUpDown className="w-3 h-3 text-[#7A8B7E]" />
                    </div>
                  </th>
                  <th className="p-4 cursor-pointer hover:bg-[#F4F1EA] transition-all" onClick={() => handleSort('neighborhood')}>
                    <div className="flex items-center gap-1">
                      <span>المحلة</span>
                      <ArrowUpDown className="w-3 h-3 text-[#7A8B7E]" />
                    </div>
                  </th>
                  <th className="p-4">الإقامة</th>
                  <th className="p-4 cursor-pointer hover:bg-[#F4F1EA] transition-all" onClick={() => handleSort('membersCount')}>
                    <div className="flex items-center gap-1">
                      <span>عدد الأفراد</span>
                      <ArrowUpDown className="w-3 h-3 text-[#7A8B7E]" />
                    </div>
                  </th>
                  <th className="p-4">حالة الاستحقاق والدخل</th>
                  <th className="p-4 cursor-pointer hover:bg-[#F4F1EA] transition-all" onClick={() => handleSort('registeredAt')}>
                    <div className="flex items-center gap-1">
                      <span>تاريخ التسجيل</span>
                      <ArrowUpDown className="w-3 h-3 text-[#7A8B7E]" />
                    </div>
                  </th>
                  <th className="p-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4F1EA]">
                {filteredFamilies.map((family) => {
                  const isExpanded = expandedFamilyIds.includes(family.id);
                  const hasSpecialNeeds = family.members.some(m => m.healthStatus === 'ذوي احتياجات خاصة');
                  const hasChronicDisease = family.members.some(m => m.healthStatus === 'مرض مزمن');
                  const parsedBW = parseBreadwinner(family.breadwinnerName, family.phone);

                  return (
                    <React.Fragment key={family.id}>
                      {/* Main family row */}
                      <tr className={`hover:bg-[#FDFBF7] transition-all ${isExpanded ? 'bg-[#F4F1EA]/40' : ''}`}>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => toggleExpandFamily(family.id)}
                            className="p-1 rounded-lg hover:bg-[#F4F1EA] transition-all text-[#7A8B7E] hover:text-[#4A5D4E]"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>

                        {isSuperAdminUser && (
                          <td className="p-4 text-center">
                            <input
                              type="checkbox"
                              checked={selectedFamilyIds.includes(family.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedFamilyIds([...selectedFamilyIds, family.id]);
                                } else {
                                  setSelectedFamilyIds(selectedFamilyIds.filter(id => id !== family.id));
                                }
                              }}
                              className="accent-[#4A5D4E] h-4 w-4 cursor-pointer"
                            />
                          </td>
                        )}

                        <td className="p-4">
                          <div className="font-medium text-[#3E4C41]">{parsedBW.name}</div>
                        </td>

                        <td className="p-4">
                          <div className="flex items-center gap-1 text-[#7A8B7E] text-[11px]">
                            <Phone className="w-3 h-3 text-[#7A8B7E] shrink-0" />
                            <span className="font-mono">{parsedBW.phone || 'غير مدرج'}</span>
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="font-bold text-[#2D3A30] text-sm">
                            {family.familyName}
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="flex items-center gap-1 text-[#2D3A30] font-medium">
                            <MapPin className="w-3 h-3 text-[#7A8B7E] shrink-0" />
                            <span>{family.neighborhood}</span>
                          </div>
                          {family.address && family.address !== `المحلة: ${family.neighborhood}` && (
                            <div className="text-[10px] text-[#7A8B7E] mt-0.5 max-w-[150px] truncate" title={family.address}>
                              {family.address}
                            </div>
                          )}
                        </td>

                        <td className="p-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded-lg text-[10.5px] font-bold border ${
                            family.residence?.includes('نزوح') || family.residence?.includes('مؤقت') || family.residence?.includes('نازح')
                              ? 'bg-amber-50 text-amber-700 border-amber-200/60'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                          }`}>
                            {family.residence || 'دائمة'}
                          </span>
                        </td>

                        <td className="p-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-[#2D3A30] text-sm">{family.members.length}</span>
                            <span className="text-[#7A8B7E] text-[10px]">أفراد</span>
                          </div>
                          
                          {/* Mini flags */}
                          <div className="flex gap-1.5 mt-1.5">
                            {hasSpecialNeeds && (
                              <span className="bg-[#FFF5EB] text-[#A98467] border border-[#E2DED0]/50 font-bold px-1.5 py-0.5 rounded text-[9px]" title="يوجد فرد من ذوي الاحتياجات الخاصة">
                                ذوي احتياجات خاصة
                              </span>
                            )}
                            {hasChronicDisease && (
                              <span className="bg-[#FFF5EB] text-[#A98467] border border-[#E2DED0]/50 font-bold px-1.5 py-0.5 rounded text-[9px]" title="يوجد فرد يعاني من مرض مزمن">
                                مرض مزمن
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="p-4 space-y-1">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            family.supportStatus === 'مستحق للدعم' 
                              ? 'bg-[#FFF5EB] text-[#A98467] border-[#E2DED0]/50' 
                              : family.supportStatus === 'تحت الدراسة'
                              ? 'bg-[#F4F1EA] text-[#7A8B7E] border-[#E2DED0]/50'
                              : 'bg-[#E9F0E0] text-[#4A5D4E] border-[#DDE5B6]'
                          }`}>
                            {family.supportStatus}
                          </span>
                          <div className="text-[10px] text-[#7A8B7E]">الدخل: {family.monthlyIncome}</div>
                        </td>

                        <td className="p-4 text-[#7A8B7E] font-mono text-[11px]">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{family.registeredAt}</span>
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="flex gap-1.5 justify-center">
                            <button
                              onClick={() => onLocateOnMap(family)}
                              className="p-1.5 rounded-lg border border-[#E2DED0] text-[#7A8B7E] hover:bg-[#F4F1EA] hover:text-[#4A5D4E] transition-all cursor-pointer"
                              title="تحديد على خريطة المنطقة"
                            >
                              <MapPin className="w-3.5 h-3.5" />
                            </button>
                            {canEditFamily && (
                              <button
                                onClick={() => onEditFamily(family)}
                                className="p-1.5 rounded-lg border border-[#E2DED0] text-[#7A8B7E] hover:bg-[#F4F1EA] hover:text-[#A98467] transition-all cursor-pointer"
                                title="تعديل السجل (مبسط)"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {canWriteFamilies && (
                              <button
                                onClick={() => onDeleteFamily(family.id)}
                                className="p-1.5 rounded-lg border border-[#E2DED0] text-[#7A8B7E] hover:bg-[#F4F1EA] hover:text-red-600 transition-all cursor-pointer"
                                title="حذف العائلة نهائياً"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Nested Expanded Family Details */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={isSuperAdminUser ? 10 : 9} className="bg-[#F9F8F4] p-5 border-y border-[#E2DED0]">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                              {/* Left section: Info metadata */}
                              <div className="space-y-3">
                                <h5 className="font-bold text-[#2D3A30] text-xs border-b border-[#E2DED0]/60 pb-1.5 flex items-center gap-1.5">
                                  <Users className="w-4 h-4 text-[#4A5D4E]" />
                                  <span>تفاصيل المعيشة والسكن</span>
                                </h5>
                                <div className="bg-white p-3.5 rounded-xl border border-[#E2DED0] space-y-2 text-xs">
                                  <div className="flex justify-between">
                                    <span className="text-[#7A8B7E]">نوع المسكن والمأوى:</span>
                                    <span className="font-semibold text-[#3E4C41]">{family.housingType}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-[#7A8B7E]">حالة الإقامة الفعلية:</span>
                                    <span className="font-semibold text-emerald-700">{family.residence || 'دائمة'}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-[#7A8B7E]">فئة الدخل المالي للأسرة:</span>
                                    <span className="font-semibold text-[#3E4C41]">{family.monthlyIncome}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-[#7A8B7E]">تاريخ التسجيل بالمرصد السكاني:</span>
                                    <span className="font-mono text-[#3E4C41]">{family.registeredAt}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-[#7A8B7E]">إحداثيات الموقع المسجل:</span>
                                    <span className="font-mono text-[#3E4C41]">({family.latitude}%, {family.longitude}%)</span>
                                  </div>
                                </div>
                                {family.notes && (
                                  <div className="bg-[#FFF5EB] border border-[#E2DED0]/50 p-3 rounded-xl text-xs text-[#A98467] space-y-1">
                                    <span className="font-bold block text-[#2D3A30]">ملاحظات البحث الاجتماعي:</span>
                                    <p className="leading-relaxed">{family.notes}</p>
                                  </div>
                                )}
                              </div>

                              {/* Right section: full family members table (Col 2 & 3) */}
                              <div className="lg:col-span-2 space-y-3">
                                <h5 className="font-bold text-[#2D3A30] text-xs border-b border-[#E2DED0]/60 pb-1.5">
                                  قائمة الأفراد بالتفصيل ({family.members.length} فرد)
                                </h5>

                                {family.members.length > 0 ? (
                                  <div className="bg-white rounded-xl border border-[#E2DED0] overflow-hidden">
                                    <table className="w-full text-right text-[11px] divide-y divide-[#F4F1EA]">
                                      <thead className="bg-[#FDFBF7] text-[#7A8B7E]">
                                        <tr>
                                          <th className="p-2">الاسم</th>
                                          <th className="p-2">العلاقة</th>
                                          <th className="p-2">الجنس / السن</th>
                                          <th className="p-2">التعليم</th>
                                          <th className="p-2">المهنة</th>
                                          <th className="p-2">الوضع الصحي</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-[#F4F1EA]">
                                        {family.members.map((m) => (
                                          <tr key={m.id} className="hover:bg-[#FDFBF7] transition-all">
                                            <td className="p-2 font-semibold text-[#2D3A30]">{m.name}</td>
                                            <td className="p-2">
                                              <span className={`px-1.5 py-0.2 rounded text-[9px] border ${
                                                m.relationship === 'عائل' ? 'bg-[#E9F0E0] text-[#4A5D4E] border-[#DDE5B6] font-bold' : 'bg-[#F4F1EA] text-[#7A8B7E] border-[#E2DED0]/40'
                                              }`}>
                                                {m.relationship}
                                              </span>
                                            </td>
                                            <td className="p-2 text-[#7A8B7E]">{m.gender} • {m.age} سنة</td>
                                            <td className="p-2 text-[#3E4C41]">{m.education}</td>
                                            <td className="p-2 text-[#3E4C41]">{m.occupation}</td>
                                            <td className="p-2">
                                              <span className={`px-1.5 py-0.5 rounded text-[10px] border ${
                                                m.healthStatus === 'سليم' 
                                                  ? 'text-[#7A8B7E] border-transparent' 
                                                  : m.healthStatus === 'ذوي احتياجات خاصة'
                                                  ? 'bg-[#FFF5EB] text-[#A98467] font-semibold border border-[#E2DED0]/50'
                                                  : 'bg-[#FFF5EB] text-[#A98467] font-semibold border border-[#E2DED0]/50'
                                              }`}>
                                                {m.healthStatus}
                                              </span>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <div className="text-center py-4 text-[#7A8B7E] bg-white border border-[#E2DED0] rounded-xl">
                                    لا يوجد تفاصيل لأفراد العائلة.
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-[#7A8B7E] bg-white flex flex-col items-center justify-center space-y-3">
            <Search className="w-12 h-12 text-[#E2DED0]" />
            <div>
              <p className="font-semibold text-[#2D3A30] text-sm">لم يتم العثور على نتائج مطابقة</p>
              <p className="text-xs text-[#7A8B7E] mt-1">الرجاء ضبط معاملات التصفية أو البحث عن مصطلح آخر.</p>
            </div>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedNeighborhood('الكل');
                setSelectedSupportStatus('الكل');
                setSelectedResidence('الكل');
                setSelectedHealthFilter('الكل');
              }}
              className="text-xs text-[#4A5D4E] font-bold hover:underline cursor-pointer"
            >
              إلغاء جميع الفلاتر
            </button>
          </div>
        )}
      </div>

      {/* نافذة تأكيد الاستيراد المنبثقة (Confirmation Modal) */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#FDFBF7] rounded-3xl border-2 border-[#4A5D4E]/30 max-w-md w-full p-6 shadow-2xl space-y-4 text-right" dir="rtl">
            <div className="flex items-center gap-3 text-[#4A5D4E] border-b border-[#E2DED0] pb-3">
              <FileSpreadsheet className="w-6 h-6 shrink-0 text-[#4A5D4E]" />
              <h3 className="font-extrabold text-sm sm:text-base text-[#2D3A30]">
                تأكيد استيراد وتحديث السجلات الإحصائية
              </h3>
            </div>

            <div className="space-y-3 py-2 text-xs text-[#3E4C41] leading-relaxed">
              <div className="bg-[#E9F0E0] p-3 rounded-2xl border border-[#DDE5B6] text-[#4A5D4E]">
                <span className="font-bold block mb-1">تفاصيل البيانات التي سيتم جلبها:</span>
                <ul className="list-disc list-inside space-y-1">
                  <li>عدد الأسر المكتشفة في الملف: <strong className="text-[#2D3A30] text-sm">{pendingRecordCount} أسرة</strong></li>
                  <li>المصدر: <strong className="text-[#2D3A30]">{pendingIsUrl ? 'رابط Google Sheets مباشر' : 'ملف CSV محلي مرفع'}</strong></li>
                </ul>
              </div>

              <div className="p-3 bg-[#F4F1EA] rounded-2xl border border-[#E2DED0]">
                <span className="font-bold block mb-1 text-[#2D3A30]">الإجراء المطلوب القيام به:</span>
                {importMode === 'replace' ? (
                  <p className="text-rose-700 font-medium">
                    ⚠️ <strong>خيار استبدال الكل:</strong> سيتم مسح كافة الأسر والمواطنين المسجلين حالياً، واستبدالهم بالبيانات الموجودة في الملف بالكامل.
                  </p>
                ) : (
                  <p className="text-emerald-700 font-medium">
                    🔄 <strong>خيار التحديث الإضافي (الدمج):</strong> سيتم إدراج الأسر الجديدة، وتحديث معلومات الأسر الحالية التي تتطابق أسماؤهم دون المساس بباقي السجل.
                  </p>
                )}
              </div>

              <p className="font-semibold text-slate-600">
                هل أنت متأكد من رغبتك في تطبيق هذا الإجراء الآن على قاعدة بيانات النظام؟
              </p>
            </div>

            <div className="flex gap-3 justify-end border-t border-[#E2DED0] pt-4">
              <button
                onClick={executeImport}
                className="flex-1 bg-[#4A5D4E] hover:bg-[#3E4C41] text-[#FDFBF7] py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer text-center"
              >
                نعم، تأكيد وتحديث البيانات
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setPendingCsvText(null);
                }}
                className="flex-1 bg-white hover:bg-slate-50 text-[#7A8B7E] hover:text-[#4A5D4E] border border-[#E2DED0] py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
              >
                إلغاء الأمر
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
