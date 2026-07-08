import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import * as XLSX from 'xlsx';
import { Campaign, DonationRecord } from '../types';
import { 
  Home, 
  Heart, 
  Gift, 
  ShieldAlert, 
  Sparkles, 
  DollarSign, 
  ArrowLeft, 
  CheckCircle2, 
  Plus, 
  Edit, 
  Trash2, 
  Upload, 
  Database, 
  RefreshCw, 
  AlertTriangle, 
  Check, 
  FileSpreadsheet, 
  Users, 
  Coins, 
  Lock, 
  Settings, 
  Search, 
  Filter, 
  X,
  FileText,
  HeartHandshake,
  Ban,
  Printer,
  FolderOpen,
  Archive
} from 'lucide-react';

// =========================================================================
// Google Workspace API & OAuth Security Variables (Flexible Environment Setup)
// =========================================================================
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID_HERE'; // OAuth 2.0 Client ID
const GOOGLE_API_KEY = 'YOUR_GOOGLE_API_KEY_HERE';     // API Key for Google Picker
const GOOGLE_APP_ID = 'YOUR_GOOGLE_APP_ID_HERE';       // App ID / Project Number

// Dynamic script loader utility for Google APIs
const loadScript = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script ${src}`));
    document.body.appendChild(script);
  });
};

interface DonationsProps {
  onBackToHome: () => void;
  isAdmin?: boolean;
  userRole?: string;
  currentUserEmail?: string;
  currentUser?: any;
}

const INITIAL_CAMPAIGNS: Campaign[] = [
  {
    id: 'camp_1',
    title: 'كفالة الأسر المتعففة بالمحلات',
    description: 'دعم مالي شهري وتوفير السلال الغذائية للأسر مستحقة الدعم في محلات الدمنة والزيلة لتغطية الاحتياجات الأساسية.',
    target: 50000,
    raised: 38500,
    category: 'أسر',
    icon: '🏠',
    currencies: ['SAR', 'USD'],
    allowedDelegates: ['delegate1', 'ali'],
    allowManagerRecord: true
  },
  {
    id: 'camp_2',
    title: 'توفير أجهزة طبية لعيادة المحلة',
    description: 'مساهمة لشراء كرسي متحرك ذكي وأجهزة فحص السكر والضغط لدعم كبار السن وذوي الاحتياجات في العيادة الطبية المحلية.',
    target: 15000,
    raised: 9200,
    category: 'صحي',
    icon: '💊',
    currencies: ['SAR', 'USD', 'EUR'],
    allowedDelegates: ['delegate2', 'doctor'],
    allowManagerRecord: true
  },
  {
    id: 'camp_3',
    title: 'ترميم حديقة المحلة والألعاب',
    description: 'إعادة تهيئة المسطحات الخضراء، زراعة أشجار محلية، وصيانة ألعاب الأطفال لخلق متنفس بيئي آمن لجميع سكان المحلة.',
    target: 30000,
    raised: 12000,
    category: 'بلدي',
    icon: '🌳',
    currencies: ['SAR'],
    allowedDelegates: [],
    allowManagerRecord: false
  },
  {
    id: 'camp_4',
    title: 'الحقيبة المدرسية لأبناء الأسر المستحقة',
    description: 'توفير الحقائب المدرسية المتكاملة، القرطاسية، والأجهزة اللوحية المساعدة لطلاب المدارس من أبناء الأسر المتعففة.',
    target: 20000,
    raised: 18500,
    category: 'تعليمي',
    icon: '🎒',
    currencies: ['SAR', 'KWD'],
    allowedDelegates: ['school_rep'],
    allowManagerRecord: true
  }
];

const INITIAL_RECORDS: DonationRecord[] = [
  {
    id: 'rec_1',
    campaignId: 'camp_1',
    campaignTitle: 'كفالة الأسر المتعففة بالمحلات',
    donorName: 'أبو أحمد الدمنة',
    donorPhone: '0501234567',
    amount: 1500,
    currency: 'SAR',
    paymentMethod: 'mada',
    date: '2026-06-25 14:30',
    recordedBy: 'admin@aljamal.com',
    status: 'مقبول',
    notes: 'تم الاستلام عبر الدفع الإلكتروني'
  },
  {
    id: 'rec_2',
    campaignId: 'camp_2',
    campaignTitle: 'توفير أجهزة طبية لعيادة المحلة',
    donorName: 'فاعل خير كريم',
    donorPhone: '',
    amount: 500,
    currency: 'USD',
    paymentMethod: 'visa',
    date: '2026-06-26 09:15',
    recordedBy: 'helmialkhateeb@gmail.com',
    status: 'مقبول',
    notes: 'تبرع خارجي داعم للعيادة'
  },
  {
    id: 'rec_3',
    campaignId: 'camp_1',
    campaignTitle: 'كفالة الأسر المتعففة بالمحلات',
    donorName: 'أم محمد الزيلة',
    donorPhone: '0559876543',
    amount: 300,
    currency: 'SAR',
    paymentMethod: 'applepay',
    date: '2026-06-27 18:45',
    recordedBy: 'admin@aljamal.com',
    status: 'قيد المراجعة',
    notes: 'قيد التأكيد البنكي'
  }
];

const CURRENCY_SYMBOLS: Record<string, string> = {
  YER_NEW: 'ريال يمني جديد (قعيطي)',
  YER_OLD: 'ريال يمني قديم',
  SAR: 'ريال سعودي',
  USD: 'دولار أمريكي',
  EUR: 'يورو',
  KWD: 'دينار كويتي',
  AED: 'درهم إماراتي',
  KIND: 'تبرع عيني'
};

export const DELEGATE_OPTIONS: { name: string; email: string; phone: string }[] = [];

export default function Donations({ 
  onBackToHome, 
  isAdmin = false, 
  userRole = 'User', 
  currentUserEmail = '',
  currentUser
}: DonationsProps) {
  const loggedInUserObj = React.useMemo(() => {
    if (currentUser) return currentUser;
    const savedUser = localStorage.getItem('auth_user_v1');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        return null;
      }
    }
    return null;
  }, [currentUser]);

  const activeFormattedUser = React.useMemo(() => {
    const user = loggedInUserObj;
    if (!user) return '';
    const fullName = [user.name, user.surname].filter(Boolean).join(' ') || user.email;
    return `[${fullName} (جوال: ${user.phone || 'غير مسجل'})]`;
  }, [loggedInUserObj]);

  // Dynamic current user DB role
  const [currentUserDBRole, setCurrentUserDBRole] = useState<string | null>(null);

  // Determine if user has Management level permissions (Admin or Manager)
  const isSuperAdmin = currentUserDBRole === 'super-admin' || userRole === 'super-admin' || currentUserEmail.toLowerCase() === 'helmialkhateeb@gmail.com' || currentUserEmail.toLowerCase() === 'helmi';
  const isGeneralSupervisor = userRole === 'admin' || userRole === 'supervisor' || userRole === 'Manager';
  const hasManagementAccess = isSuperAdmin || isGeneralSupervisor;

  // Active Tab for Managers: 'opportunities' | 'records' | 'import' | 'settings' | 'archive'
  const [activeSubTab, setActiveSubTab] = useState<'opportunities' | 'records' | 'import' | 'settings' | 'archive'>('opportunities');

  // Google API and Picker states
  const [gapiLoaded, setGapiLoaded] = useState(false);
  const [gisLoaded, setGisLoaded] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Load Google Scripts on Mount
  useEffect(() => {
    const initGoogleApis = async () => {
      try {
        await loadScript('https://apis.google.com/js/api.js');
        setGapiLoaded(true);
        await loadScript('https://accounts.google.com/gsi/client');
        setGisLoaded(true);
        console.log('Google Client and GIS script loaded successfully.');
      } catch (err) {
        console.error('Failed to load Google script APIs:', err);
      }
    };
    initGoogleApis();
  }, []);

  // Dynamic real-time approved delegates state
  const [realDelegates, setRealDelegates] = useState<any[]>([]);

  useEffect(() => {
    const fetchRealDelegates = async () => {
      try {
        const res = await fetch('/api/users');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            const delegatesOnly = data.filter((u: any) => {
              if (!u.isActivated) return false;
              const isDelegate = u.role === 'delegate';
              const hasDonationsPerm = !u.permissions || u.permissions.canDonations !== false;
              return isDelegate && hasDonationsPerm;
            });
            setRealDelegates(delegatesOnly);
            
            // Extract current user DB role dynamically
            if (currentUserEmail) {
              const matched = data.find((u: any) => u.email.toLowerCase() === currentUserEmail.toLowerCase().trim());
              if (matched) {
                setCurrentUserDBRole(matched.role);
              }
            }
          }
        }
      } catch (err) {
        console.error('Error fetching real delegates from database:', err);
      }
    };
    fetchRealDelegates();
    const interval = setInterval(fetchRealDelegates, 5000);

    // BroadcastChannel sync across tabs and window CustomEvent for immediate local updates
    let syncChannel: BroadcastChannel | null = null;
    try {
      syncChannel = new BroadcastChannel('users_sync_channel');
      syncChannel.onmessage = (event) => {
        if (event.data === 'users-updated') {
          fetchRealDelegates();
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported in this environment', e);
    }

    const handleLocalUpdate = () => {
      fetchRealDelegates();
    };
    window.addEventListener('users-updated', handleLocalUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('users-updated', handleLocalUpdate);
      if (syncChannel) {
        syncChannel.close();
      }
    };
  }, [currentUserEmail]);

  const allDelegates = React.useMemo(() => {
    const list = realDelegates.map(u => ({
      name: `${u.name} ${u.surname}`,
      email: u.email,
      phone: u.phone || 'غير مسجل'
    }));
    
    // Ensure active formatted user is present in the list if logged in
    if (activeFormattedUser && loggedInUserObj) {
      const user = loggedInUserObj;
      const alreadyExists = list.some(d => d.email.toLowerCase() === user.email.toLowerCase());
      if (!alreadyExists) {
        list.push({
          name: [user.name, user.surname].filter(Boolean).join(' ') || user.email,
          email: user.email,
          phone: user.phone || 'غير مسجل'
        });
      }
    }
    return list;
  }, [realDelegates, activeFormattedUser, loggedInUserObj]);

  const findDelegateInfo = (delegateOptionStr: string) => {
    if (!delegateOptionStr) return null;
    return realDelegates.find(u => {
      const optionName = `${u.name} ${u.surname}`;
      return delegateOptionStr.includes(optionName) || (u.phone && delegateOptionStr.includes(u.phone));
    });
  };

  const logDonationActivity = async (record: DonationRecord, delegateUser: any) => {
    try {
      const delegateName = delegateUser ? `${delegateUser.name} ${delegateUser.surname}` : record.recordedBy;
      const amountStr = record.amount > 0 ? `${record.amount} ${CURRENCY_SYMBOLS[record.currency] || record.currency}` : 'تبرع عيني';
      const actionMessage = `قام المندوب [${delegateName}] بتسجيل تبرع بقيمة [${amountStr}] نيابة عن المتبرع الكريم [${record.donorName}] (جوال: ${record.donorPhone || 'غير مسجل'}) بتاريخ [${record.date}]`;
      
      await fetch('/api/activity-log/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: delegateName,
          userEmail: delegateUser?.email || 'delegate@aljamal.com',
          action: actionMessage,
          actionType: 'إضافة',
          section: 'التبرعات'
        })
      });
    } catch (err) {
      console.error('Error logging donation activity:', err);
    }
  };

  useEffect(() => {
    if (activeFormattedUser) {
      setModalDelegate(activeFormattedUser);
      setManualDelegate(activeFormattedUser);
    } else if (allDelegates.length > 0) {
      const firstFormatted = `[${allDelegates[0].name} (جوال: ${allDelegates[0].phone})]`;
      if (!modalDelegate) setModalDelegate(firstFormatted);
      if (!manualDelegate) setManualDelegate(firstFormatted);
    }
  }, [activeFormattedUser, allDelegates]);

  // Load Exchange Rates State
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('local_exchange_rates_v1');
    return saved ? JSON.parse(saved) : {
      YER_NEW: 410,
      YER_OLD: 140,
      USD: 3.75,
      SAR: 1
    };
  });

  // Save exchange rates to local storage
  useEffect(() => {
    localStorage.setItem('local_exchange_rates_v1', JSON.stringify(exchangeRates));
  }, [exchangeRates]);

  // Load Blocked Delegates State
  const [blockedDelegates, setBlockedDelegates] = useState<string[]>(() => {
    const saved = localStorage.getItem('blocked_delegates_v1');
    return saved ? JSON.parse(saved) : [];
  });

  // Save blocked delegates
  useEffect(() => {
    localStorage.setItem('blocked_delegates_v1', JSON.stringify(blockedDelegates));
  }, [blockedDelegates]);

  // Check if current user is blocked/deactivated
  const isUserBlocked = blockedDelegates.some(d => d.toLowerCase() === (currentUserEmail || '').toLowerCase().trim());

  // Google Sheets Post Web App URL
  const [googleSheetsPostUrl, setGoogleSheetsPostUrl] = useState(() => {
    return localStorage.getItem('local_donations_sheets_url_v1') || 'https://script.google.com/macros/s/AKfycbw9euX8mHst5BZlaeRp9fdf9r23OQnUMOg1LcYodWoQP52tsrEmHJgnSgkOfCKa920Qcg/exec';
  });

  // Save Google Sheets Post Web App URL
  useEffect(() => {
    localStorage.setItem('local_donations_sheets_url_v1', googleSheetsPostUrl);
  }, [googleSheetsPostUrl]);

  // New delegates manage helper state
  const [newDelegateToBlock, setNewDelegateToBlock] = useState('');

  // Load Campaigns State
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => {
    const saved = localStorage.getItem('local_campaigns_v2');
    return saved ? JSON.parse(saved) : INITIAL_CAMPAIGNS;
  });

  // Load Donation Records State
  const [records, setRecords] = useState<DonationRecord[]>(() => {
    const saved = localStorage.getItem('local_donation_records_v1');
    return saved ? JSON.parse(saved) : INITIAL_RECORDS;
  });

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('local_campaigns_v2', JSON.stringify(campaigns));
  }, [campaigns]);

  useEffect(() => {
    localStorage.setItem('local_donation_records_v1', JSON.stringify(records));
  }, [records]);

  // Sync campaigns raised amount based on approved records using custom exchange rates
  useEffect(() => {
    setCampaigns(prevCamps => prevCamps.map(camp => {
      const totalRaised = records
        .filter(r => r.campaignId === camp.id && r.status === 'مقبول')
        .reduce((sum, r) => {
          let amountInSAR = r.amount;
          if (r.currency === 'USD') amountInSAR = r.amount * (exchangeRates.USD || 3.75);
          else if (r.currency === 'YER_NEW') amountInSAR = r.amount / (exchangeRates.YER_NEW || 410);
          else if (r.currency === 'YER_OLD') amountInSAR = r.amount / (exchangeRates.YER_OLD || 140);
          else if (r.currency === 'EUR') amountInSAR = r.amount * 4.0;
          else if (r.currency === 'KWD') amountInSAR = r.amount * 12.2;
          else if (r.currency === 'AED') amountInSAR = r.amount * 1.02;
          else if (r.currency === 'SAR') amountInSAR = r.amount;
          return sum + amountInSAR;
        }, 0);
      return {
        ...camp,
        raised: Math.round(totalRaised)
      };
    }));
  }, [records, exchangeRates]);

  // Selected Campaign for Donation / Manual Recording
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isManualRecording, setIsManualRecording] = useState(false);

  // Prominent Add Donation Modal states
  const [openAddDonationModal, setOpenAddDonationModal] = useState(false);
  const [modalCampaignId, setModalCampaignId] = useState('');
  const [modalDonorName, setModalDonorName] = useState('');
  const [modalDonorPhone, setModalDonorPhone] = useState('');
  const [modalCurrency, setModalCurrency] = useState('YER_NEW');
  const [modalAmount, setModalAmount] = useState('');
  const [modalIsDonationInKind, setModalIsDonationInKind] = useState(false);
  const [modalInkindDescription, setModalInkindDescription] = useState('');
  const [modalPaymentMethod, setModalPaymentMethod] = useState<'mada' | 'visa' | 'applepay' | 'cash' | 'transfer'>('cash');
  const [modalNotes, setModalNotes] = useState('');
  const [modalIsSubmitting, setModalIsSubmitting] = useState(false);

  // Set default campaign ID for modal
  useEffect(() => {
    if (campaigns && campaigns.length > 0 && !modalCampaignId) {
      setModalCampaignId(campaigns[0].id);
    }
  }, [campaigns, modalCampaignId]);

  // normal donation states
  const [donationAmount, setDonationAmount] = useState<string>('100');
  const [donationCurrency, setDonationCurrency] = useState<string>('SAR');
  const [donorName, setDonorName] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'mada' | 'visa' | 'applepay' | 'cash' | 'transfer'>('mada');
  const [isSuccess, setIsSuccess] = useState(false);
  const [lastDonation, setLastDonation] = useState<{ amount: number; currency: string; inkindDescription?: string } | null>(null);
  const [isDonationInKind, setIsDonationInKind] = useState(false);
  const [inkindDescription, setInkindDescription] = useState('');

  // Delegate / Manual Donation entry states
  const [manualAmount, setManualAmount] = useState('');
  const [manualCurrency, setManualCurrency] = useState('SAR');
  const [manualDonorName, setManualDonorName] = useState('');
  const [manualDonorPhone, setManualDonorPhone] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [manualMethod, setManualMethod] = useState<'mada' | 'visa' | 'applepay' | 'cash' | 'transfer'>('cash');
  const [manualIsDonationInKind, setManualIsDonationInKind] = useState(false);
  const [manualInkindDescription, setManualInkindDescription] = useState('');

  // Admin Campaign creation/editing states
  const [isAddingCampaign, setIsAddingCampaign] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  // Admin Campaign Form States
  const [campTitle, setCampTitle] = useState('');
  const [campDescription, setCampDescription] = useState('');
  const [campTarget, setCampTarget] = useState('');
  const [campTargetCurrency, setCampTargetCurrency] = useState('SAR');
  const [campCategory, setCampCategory] = useState<'أسر' | 'صحي' | 'بلدي' | 'تعليمي'>('أسر');
  const [campIcon, setCampIcon] = useState('🎁');
  const [campCurrencies, setCampCurrencies] = useState<string[]>(['SAR']);
  const [campDelegates, setCampDelegates] = useState('');
  const [campAllowManager, setCampAllowManager] = useState(true);

  // Delegate States for dropdown selection
  const [modalDelegate, setModalDelegate] = useState('');
  const [manualDelegate, setManualDelegate] = useState('');

  // Archive & Historical statements state
  const [archiveRecords, setArchiveRecords] = useState<DonationRecord[]>(() => {
    const saved = localStorage.getItem('archive_donations_records_v1');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('archive_donations_records_v1', JSON.stringify(archiveRecords));
  }, [archiveRecords]);

  // Campaign linking choices for historical imports
  const [importCampType, setImportCampType] = useState<'existing' | 'custom'>('existing');
  const [importSelectedCampId, setImportSelectedCampId] = useState('');
  const [importCustomCampName, setImportCustomCampName] = useState('');
  const [importDuplicateMode, setImportDuplicateMode] = useState<'replace' | 'append'>('append');

  // Custom confirmation dialog and success alert states
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
  });

  const askConfirmation = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        onConfirm();
      }
    });
  };

  const showSuccessAlert = (title: string, message: string) => {
    setSuccessModal({
      isOpen: true,
      title,
      message
    });
  };

  // Currency toggling handler
  const handleToggleCurrency = (curr: string) => {
    setCampCurrencies(prev => {
      if (prev.includes(curr)) {
        if (prev.length <= 1) {
          showSuccessAlert('تنبيه', 'يجب الإبقاء على عملة واحدة مفعلة على الأقل للحملة.');
          return prev;
        }
        return prev.filter(c => c !== curr);
      } else {
        return [...prev, curr];
      }
    });
  };

  // Archive record deletion handler
  const handleDeleteRecord = (id: string) => {
    if (!hasManagementAccess) {
      alert('عذراً، التعديل والحذف محصور للمدير العام والمشرف العام.');
      return;
    }
    askConfirmation(
      'تأكيد حذف القيد الأرشيفي',
      'هل أنت متأكد من رغبتك في حذف هذا القيد المالي نهائياً من الأرشيف المحلي؟',
      () => {
        setRecords(prev => prev.filter(rec => rec.id !== id));
      }
    );
  };

  // Set individual record status
  const handleSetRecordStatus = (id: string, status: any) => {
    if (!isSuperAdmin) {
      alert('عذراً، تعديل حالة القيد محصور للمدير العام فقط.');
      return;
    }
    setRecords(prev => prev.map(rec => {
      if (rec.id === id) {
        return { ...rec, status };
      }
      return rec;
    }));
  };

  // Submit record edit details
  const handleUpdateRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      alert('عذراً، تعديل تفاصيل القيود محصور للمدير العام فقط.');
      return;
    }
    if (!editingRecord) return;
    setRecords(prev => prev.map(rec => {
      if (rec.id === editingRecord.id) {
        return editingRecord;
      }
      return rec;
    }));
    setEditingRecord(null);
  };

  // Google Apps Deep Link Handler
  const openGoogleApp = (appType: 'sheets' | 'drive' | 'docs') => {
    let deepLink = '';
    let webUrl = '';
    
    if (appType === 'sheets') {
      deepLink = 'googlesheets://';
      webUrl = 'https://docs.google.com/spreadsheets/u/0/';
    } else if (appType === 'drive') {
      deepLink = 'googledrive://';
      webUrl = 'https://drive.google.com/drive/u/0/my-drive';
    } else if (appType === 'docs') {
      deepLink = 'googledocs://';
      webUrl = 'https://docs.google.com/document/u/0/';
    }

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      // Create a temporary link and trigger it
      const link = document.createElement('a');
      link.href = deepLink;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Fallback to web URL after 800ms
      setTimeout(() => {
        window.open(webUrl, '_blank', 'noopener,noreferrer');
      }, 800);
    } else {
      window.open(webUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Data import states
  const [uploadedRecords, setUploadedRecords] = useState<DonationRecord[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isConfirmingImport, setIsConfirmingImport] = useState(false);
  const [importWizardStep, setImportWizardStep] = useState<1 | 2 | 3>(1);
  const [manualPasteContent, setManualPasteContent] = useState('');
  const [importGoogleSheetUrl, setImportGoogleSheetUrl] = useState('');

  const handleConfirmGoogleSheetUrl = async () => {
    if (!importGoogleSheetUrl.trim()) {
      alert('الرجاء إدخال رابط جدول بيانات Google Sheets أولاً.');
      return;
    }
    setImportSource('google_sheets_link');
    setValidationError(null);

    // Extract ID from URL
    const match = importGoogleSheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match || !match[1]) {
      alert('الرابط غير صالح. يرجى التأكد من نسخ رابط جدول Google Sheets بشكل صحيح (يجب أن يحتوي على معرف الجدول).');
      return;
    }
    
    const sheetId = match[1];
    const csvExportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

    try {
      const response = await fetch(csvExportUrl);
      if (!response.ok) {
        throw new Error('فشل الوصول للجدول. تأكد أن صلاحية الرابط مضبوطة على "أي شخص لديه الرابط" (Anyone with the link).');
      }
      const csvText = await response.text();
      // Ensure we received valid CSV and not an HTML login page
      if (csvText.trim().startsWith('<!DOCTYPE html>') || csvText.trim().startsWith('<html')) {
        throw new Error('لم يتمكن النظام من قراءة البيانات. يرجى التأكد من أن الجدول "عام" وليس خاصاً.');
      }
      validateAndParseData(csvText, 'csv');
    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء جلب البيانات من Google Sheets.');
    }
  };
  const [showManualPaste, setShowManualPaste] = useState(false);
  const [showImportSuccessBanner, setShowImportSuccessBanner] = useState(false);
  const [successImportDetails, setSuccessImportDetails] = useState<{ campaignTitle: string; recordCount: number; mode: 'replace' | 'append' }>({ campaignTitle: '', recordCount: 0, mode: 'append' });
  const [sheetUrl, setSheetUrl] = useState('');
  const [importSource, setImportSource] = useState<'file' | 'sheet' | 'paste' | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);

  // Filter & Search states for donation log
  const [recordsSearchQuery, setRecordsSearchQuery] = useState('');
  const [recordsFilterCampaign, setRecordsFilterCampaign] = useState('all');
  const [recordsFilterStatus, setRecordsFilterStatus] = useState('all');

  // Filter & Search states for the separate archive log
  const [archiveSearchQuery, setArchiveSearchQuery] = useState('');
  const [archiveFilterCampaign, setArchiveFilterCampaign] = useState('all');
  const [archiveFilterCurrency, setArchiveFilterCurrency] = useState('all');

  // Editing a recorded donation (Absolute manager control)
  const [editingRecord, setEditingRecord] = useState<DonationRecord | null>(null);

  // Determine if current user can record manual donation for the selected campaign
  const canRecordForCampaign = (camp: Campaign) => {
    if (isUserBlocked) return false;
    if (isSuperAdmin) return true;
    if (isGeneralSupervisor && camp.allowManagerRecord) return true;
    const emailLower = currentUserEmail.toLowerCase().trim();
    return camp.allowedDelegates.some(d => d.toLowerCase().trim() === emailLower);
  };

  const handleSelectCampaign = (campaign: Campaign) => {
    setIsAddingCampaign(false);
    setEditingCampaign(null);
    setSelectedCampaign(campaign);
    setDonationCurrency(campaign.currencies[0] || 'SAR');
    setManualCurrency(campaign.currencies[0] || 'SAR');
    setIsSuccess(false);
    setIsManualRecording(false);
  };

  // Sync donation record to Google Sheets
  const checkDelegateSession = (): { isValid: boolean; error?: string } => {
    const savedUser = localStorage.getItem('auth_user_v1');
    if (!savedUser) {
      return { isValid: false, error: "عذراً، لا تمتلك صلاحية مندوب معتمد لإضافة التبرعات" };
    }
    try {
      const user = JSON.parse(savedUser);
      if (!user || !user.email) {
        return { isValid: false, error: "عذراً، لا تمتلك صلاحية مندوب معتمد لإضافة التبرعات" };
      }
      
      const emailLower = user.email.toLowerCase().trim();
      const isHelmi = emailLower === 'helmialkhateeb@gmail.com' || emailLower === 'helmi';

      // Check if blocked
      const isBlocked = blockedDelegates.some(d => d.toLowerCase().trim() === emailLower);
      if (isBlocked) {
        return { isValid: false, error: "🚫 عذراً، لا يمكن تسجيل التبرع لأن حسابك كمندوب معطل حالياً بواسطة المدير العام." };
      }

      // Allowed roles in the auth guard: 'delegate', 'supervisor', 'admin', 'super-admin'
      const allowedRoles = ['delegate', 'supervisor', 'admin', 'super-admin'];
      if (!isHelmi && !allowedRoles.includes(user.role)) {
        return { isValid: false, error: "عذراً، لا تمتلك صلاحية مندوب معتمد لإضافة التبرعات" };
      }

      // Check activation
      if (!isHelmi && user.isActivated !== true) {
        return { isValid: false, error: "عذراً، لا تمتلك صلاحية مندوب معتمد لإضافة التبرعات" };
      }

      return { isValid: true };
    } catch (e) {
      return { isValid: false, error: "عذراً، لا تمتلك صلاحية مندوب معتمد لإضافة التبرعات" };
    }
  };

  const syncDonationToGoogleSheets = async (record: DonationRecord) => {
    // Crucial Auth Guard
    const authCheck = checkDelegateSession();
    if (!authCheck.isValid) {
      console.warn('Google Sheets sync blocked: Unauthorized session.');
      return;
    }

    if (!googleSheetsPostUrl || !googleSheetsPostUrl.trim()) {
      console.log('No Google Sheets Web App URL configured. Skipping remote sync.');
      return;
    }

    try {
      // Build exactly the requested payload
      const payload = {
        date: record.date, // [التاريخ والوقت]
        donorName: record.donorName, // [اسم المتبرع]
        amount: record.amount || 0, // [المبلغ المدخل]
        currency: record.currency, // [نوع العملة المختار]
        inkindDescription: record.inkindDescription || '', // [وصف التبرع العيني - إن وُجد]
        recordedBy: record.recordedBy, // [اسم المندوب]
        campaignTitle: record.campaignTitle // [اسم الحملة الحالية]
      };

      // Send fetch POST with mode: 'no-cors' for Google Apps Script Web App bypass
      const url = new URL(googleSheetsPostUrl);
      url.searchParams.append('date', record.date);
      url.searchParams.append('donorName', record.donorName);
      url.searchParams.append('amount', (record.amount || 0).toString());
      url.searchParams.append('currency', record.currency);
      url.searchParams.append('inkindDescription', record.inkindDescription || '');
      url.searchParams.append('recordedBy', record.recordedBy);
      url.searchParams.append('campaignTitle', record.campaignTitle);

      await fetch(url.toString(), {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      console.log('Successfully posted record to Google Sheets via no-cors fetch', payload);
    } catch (err) {
      console.error('Error while syncing donation to Google Sheets:', err);
    }
  };

  // Trigger server-side global real-time notification banner
  const triggerGlobalNotification = async (record: DonationRecord) => {
    try {
      const isKind = record.currency === 'KIND' || record.currency === 'عيني' || (record.inkindDescription && record.inkindDescription.trim().length > 0);
      const giftDetails = isKind 
        ? `تبرع عيني: (${record.inkindDescription})`
        : `بمبلغ قدره ${record.amount.toLocaleString()} ${record.currency}`;

      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notification: {
            title: isKind ? 'مساهمة عينية جديدة! 🎁' : 'تبرع ومساهمة جديدة! 🪙',
            message: `المحسن (${record.donorName}) ساهم بـ ${giftDetails} لصالح حملة (${record.campaignTitle})`,
            recordedBy: record.recordedBy,
            campaignTitle: record.campaignTitle,
            amount: record.amount,
            currency: record.currency
          }
        })
      });
      console.log('Fired real-time global notification for', record.donorName);
    } catch (e) {
      console.warn('Failed to post global notification:', e);
    }
  };

  // Normal citizen donation submit
  const handleDonationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const authCheck = checkDelegateSession();
    if (!authCheck.isValid) {
      alert(authCheck.error || "عذراً، لا تمتلك صلاحية مندوب معتمد لإضافة التبرعات");
      return;
    }
    
    let amount = parseFloat(donationAmount);
    if (isDonationInKind) {
      amount = 0;
    } else {
      if (isNaN(amount) || amount <= 0 || !selectedCampaign) return;
    }
    if (!selectedCampaign) return;

    const newRecord: DonationRecord = {
      id: 'rec_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      campaignId: selectedCampaign.id,
      campaignTitle: selectedCampaign.title,
      donorName: isAnonymous ? 'فاعل خير (مجهول)' : donorName || 'فاعل خير',
      donorPhone: isAnonymous ? '' : donorPhone,
      amount: amount,
      currency: isDonationInKind ? 'KIND' : donationCurrency,
      paymentMethod: isDonationInKind ? 'transfer' : paymentMethod,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      recordedBy: currentUserEmail || 'بوابة المتبرع الذاتية',
      status: 'مقبول', // Auto approved for standard checkout
      inkindDescription: isDonationInKind ? inkindDescription : undefined
    };

    setRecords(prev => [newRecord, ...prev]);
    setLastDonation({ 
      amount, 
      currency: isDonationInKind ? 'KIND' : donationCurrency,
      inkindDescription: isDonationInKind ? inkindDescription : undefined
    });
    setIsSuccess(true);
    
    // Trigger global real-time notification
    triggerGlobalNotification(newRecord);

    // Auto sync to Google Sheets
    syncDonationToGoogleSheets(newRecord);
  };

  // Manual record by delegate/manager
  const handleManualRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const authCheck = checkDelegateSession();
    if (!authCheck.isValid) {
      alert(authCheck.error || "عذراً، لا تمتلك صلاحية مندوب معتمد لإضافة التبرعات");
      return;
    }

    if (isUserBlocked) {
      alert('🚫 عذراً، لا يمكن تسجيل التبرع لأن حسابك كمندوب معطل حالياً بواسطة المدير العام.');
      return;
    }
    
    let amount = parseFloat(manualAmount);
    if (manualIsDonationInKind) {
      amount = 0;
    } else {
      if (isNaN(amount) || amount <= 0 || !selectedCampaign) return;
    }
    if (!selectedCampaign) return;

    const delegateUser = findDelegateInfo(manualDelegate);

    const newRecord: DonationRecord = {
      id: 'rec_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      campaignId: selectedCampaign.id,
      campaignTitle: selectedCampaign.title,
      donorName: manualDonorName || 'فاعل خير',
      donorPhone: manualDonorPhone,
      amount: amount,
      currency: manualIsDonationInKind ? 'KIND' : manualCurrency,
      paymentMethod: manualIsDonationInKind ? 'transfer' : manualMethod,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      recordedBy: manualDelegate || currentUserEmail || 'مندوب تبرع',
      status: 'مقبول', // Instantly approved when registered by authorised delegate
      notes: manualNotes || 'تم التسجيل يدوياً بواسطة المندوب',
      inkindDescription: manualIsDonationInKind ? manualInkindDescription : undefined,
      delegateUserId: delegateUser?.id,
      delegateName: delegateUser ? `${delegateUser.name} ${delegateUser.surname}` : undefined,
      delegatePhone: delegateUser?.phone
    };

    setRecords(prev => [newRecord, ...prev]);
    alert('تم تسجيل واعتماد قيد التبرع بنجاح!');
    
    // Log the donation activity in system activity log for SuperAdmin monitoring
    logDonationActivity(newRecord, delegateUser);
    
    // Trigger global real-time notification
    triggerGlobalNotification(newRecord);

    // Auto sync to Google Sheets
    syncDonationToGoogleSheets(newRecord);

    // Reset manual fields
    setManualAmount('');
    setManualDonorName('');
    setManualDonorPhone('');
    setManualNotes('');
    setManualInkindDescription('');
    setManualIsDonationInKind(false);
    setIsManualRecording(false);
  };

  // Prominent modal donation submission handler
  const handleModalDonationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalCampaignId) {
      alert('الرجاء اختيار الحملة المستهدفة أولاً.');
      return;
    }

    setModalIsSubmitting(true);
    try {
      const selectedCamp = campaigns.find(c => c.id === modalCampaignId) || campaigns[0];
      const amountVal = modalIsDonationInKind ? 0 : (parseFloat(modalAmount) || 0);
      const delegateUser = findDelegateInfo(modalDelegate);

      const newRecord: DonationRecord = {
        id: 'rec_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        campaignId: selectedCamp.id,
        campaignTitle: selectedCamp.title,
        donorName: modalDonorName || 'فاعل خير',
        donorPhone: modalDonorPhone,
        amount: amountVal,
        currency: modalIsDonationInKind ? 'KIND' : modalCurrency,
        paymentMethod: modalIsDonationInKind ? 'transfer' : modalPaymentMethod,
        date: new Date().toISOString().replace('T', ' ').substring(0, 16),
        recordedBy: modalDelegate || currentUserEmail || 'مندوب معتمد',
        status: 'مقبول', // Instantly approved/accepted
        notes: modalNotes || (modalIsDonationInKind ? 'قيد تبرع عيني مباشر' : 'قيد تبرع مباشر'),
        inkindDescription: modalIsDonationInKind ? modalInkindDescription : undefined,
        delegateUserId: delegateUser?.id,
        delegateName: delegateUser ? `${delegateUser.name} ${delegateUser.surname}` : undefined,
        delegatePhone: delegateUser?.phone
      };

      // Add to local state
      setRecords(prev => [newRecord, ...prev]);

      // Log the donation activity in system activity log for SuperAdmin monitoring
      logDonationActivity(newRecord, delegateUser);

      // Trigger global real-time notification
      await triggerGlobalNotification(newRecord);

      // Auto sync to Google Sheets directly via Web App
      await syncDonationToGoogleSheets(newRecord);

      alert('تم تسجيل القيد بنجاح وترحيله فورا لجدول بيانات جوجل المعتمد! 🏛️');

      // Reset Modal Form States
      setModalDonorName('');
      setModalDonorPhone('');
      setModalAmount('');
      setModalIsDonationInKind(false);
      setModalInkindDescription('');
      setModalNotes('');
      setOpenAddDonationModal(false);
    } catch (err: any) {
      console.error('Error submitting modal donation:', err);
      alert(`حدث خطأ أثناء حفظ القيد: ${err.message || err}`);
    } finally {
      setModalIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSelectedCampaign(null);
    setIsSuccess(false);
    setDonorName('');
    setDonorPhone('');
    setIsAnonymous(false);
    setDonationAmount('100');
    setIsManualRecording(false);
  };

  // Create or Edit Campaign (Super Admin Only)
  const handleSaveCampaignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetVal = campTarget ? (parseFloat(campTarget) || 0) : 0;

    const delegatesList = campDelegates
      .split(',')
      .map(d => d.trim())
      .filter(Boolean);

    if (editingCampaign) {
      setCampaigns(prev => prev.map(c => {
        if (c.id === editingCampaign.id) {
          return {
            ...c,
            title: campTitle,
            description: campDescription,
            target: targetVal,
            targetCurrency: campTargetCurrency,
            category: campCategory,
            icon: campIcon,
            currencies: campCurrencies.length > 0 ? campCurrencies : ['SAR'],
            allowedDelegates: delegatesList,
            allowManagerRecord: campAllowManager
          };
        }
        return c;
      }));
      setEditingCampaign(null);
      alert('تم تحديث بيانات الحملة والصلاحيات بنجاح!');
    } else {
      // Predefined conditions: If created by delegate or supervisor, add them automatically to allowed list if it's a delegate
      const currentEmail = currentUserEmail || '';
      let finalDelegatesList = [...delegatesList];
      if ((currentUserDBRole === 'delegate' || userRole === 'delegate') && currentEmail && !finalDelegatesList.includes(currentEmail)) {
        finalDelegatesList.push(currentEmail);
      }

      const newCamp: Campaign = {
        id: 'camp_' + Date.now(),
        title: campTitle,
        description: campDescription,
        target: targetVal,
        targetCurrency: campTargetCurrency,
        raised: 0,
        category: campCategory,
        icon: campIcon,
        currencies: campCurrencies.length > 0 ? campCurrencies : ['SAR'],
        allowedDelegates: finalDelegatesList,
        allowManagerRecord: campAllowManager
      };
      setCampaigns(prev => [...prev, newCamp]);
      setIsAddingCampaign(false);

      // Trigger global real-time notification to inform the Super Admin about this action
      try {
        const creatorName = currentUserEmail || 'مندوب معتمد';
        fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            notification: {
              title: '🎯 إنشاء حملة تبرع جديدة',
              message: `قام المندوب/المشرف (${creatorName}) بإنشاء حملة تبرع جديدة بعنوان (${campTitle}) لجمع ${targetVal.toLocaleString()} ${campTargetCurrency}`,
              recordedBy: creatorName,
              timestamp: new Date().toLocaleTimeString('ar-SA')
            }
          })
        }).catch(e => console.warn('Failed to post notification for new campaign:', e));
      } catch (err) {
        console.warn('Notification error:', err);
      }

      alert('تم إنشاء حملة التبرع الجديدة بالخصائص والعملات المحددة وتم إرسال إشعار فوري للإدارة!');
    }
    // Reset fields
    setCampTitle('');
    setCampDescription('');
    setCampTarget('');
    setCampCategory('أسر');
    setCampIcon('Heart');
  };

  // Validation Protection and Parsing system for imports
  const mapCurrencyDynamically = (val: string): string => {
    if (!val) return 'SAR';
    const v = val.trim().toLowerCase();
    if (v.includes('جديد') || v.includes('قعيطي') || v.includes('yer_new') || v.includes('يمني جديد') || v.includes('يمني_جديد')) return 'YER_NEW';
    if (v.includes('قديم') || v.includes('yer_old') || v.includes('يمني قديم') || v.includes('يمني_قديم') || v.includes('ملكي')) return 'YER_OLD';
    if (v.includes('سعودي') || v.includes('sar') || v.includes('ر.س') || v.includes('سعوديه') || v.includes('سعودية')) return 'SAR';
    if (v.includes('دولار') || v.includes('usd') || v.includes('امريكي') || v.includes('$')) return 'USD';
    if (v.includes('عيني') || v.includes('kind') || v.includes('عينيا') || v.includes('عينية')) return 'KIND';
    if (v.includes('يورو') || v.includes('eur')) return 'EUR';
    if (v.includes('كويتي') || v.includes('kwd')) return 'KWD';
    return 'SAR'; // default
  };

  const parseJsonText = (text: string): DonationRecord[] => {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) {
      throw new Error('محتوى JSON غير صالح: يجب أن يكون مصفوفة من السجلات [ { ... } ].');
    }

    const validRecords: DonationRecord[] = [];
    parsed.forEach((item: any, index: number) => {
      const rowNum = index + 1;
      
      let campId = item.campaignId;
      let matchedCamp = campaigns.find(c => c.id === campId);
      if (!matchedCamp && item.campaignTitle) {
        matchedCamp = campaigns.find(c => c.title.trim() === item.campaignTitle.trim());
        if (matchedCamp) campId = matchedCamp.id;
      }
      if (!matchedCamp) {
        matchedCamp = campaigns[0];
        campId = matchedCamp?.id || '';
      }

      // Flexible Arabic mapping for donorName
      const dName = item.donorName || item['اسم المتبرع'] || item['الاسم'] || item['المتبرع'] || item['الاسم الكامل'] || 'فاعل خير';
      
      // Flexible Arabic mapping for amount
      let amt = 0;
      const amountKey = Object.keys(item).find(k => {
        const kl = k.toLowerCase().trim();
        return kl === 'amount' || kl === 'المبلغ' || kl === 'القيمة' || kl === 'مبلغ' || kl.includes('مبلغ') || kl.includes('ريال') || kl.includes('يمني') || kl.includes('سعودي') || kl.includes('دولار');
      });
      if (amountKey) {
        amt = parseFloat(item[amountKey]);
      } else {
        amt = parseFloat(item.amount || item['المبلغ'] || item['القيمة'] || item['المبلغ المدخل'] || item['مبلغ التبرع'] || item['ريال يمني/سعودي'] || 0);
      }

      if (isNaN(amt) || amt < 0) {
        throw new Error(`السطر ${rowNum}: حقل قيمة التبرع غير صالح. يجب أن يكون رقماً موجباً أو صفراً.`);
      }

      const rawCurr = item.currency || item['العملة'] || item['نوع العملة'] || 'SAR';
      const curr = mapCurrencyDynamically(rawCurr);

      validRecords.push({
        id: item.id || `rec_imp_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 5)}`,
        campaignId: campId || 'legacy_temp',
        campaignTitle: matchedCamp ? matchedCamp.title : (item.campaignTitle || 'حملة مستوردة'),
        donorName: dName,
        donorPhone: item.donorPhone || item['رقم الجوال'] || item['الجوال'] || '',
        amount: amt,
        currency: curr,
        paymentMethod: item.paymentMethod || 'transfer',
        date: item.date || item['التاريخ'] || new Date().toISOString().replace('T', ' ').substring(0, 16),
        recordedBy: item.recordedBy || item['المسجل'] || currentUserEmail || 'مستورد البيانات',
        status: item.status || 'مقبول',
        notes: item.notes || item['ملاحظات'] || 'مستورد خارجياً'
      });
    });

    return validRecords;
  };

  const parseCsvText = (text: string): DonationRecord[] => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 1) {
      throw new Error('الملف المرفوع فارغ أو يفتقر إلى البيانات.');
    }

    // Detect separator dynamically (comma, semicolon, tab)
    let separator = ',';
    if (lines[0].includes(';')) {
      separator = ';';
    } else if (lines[0].includes('\t')) {
      separator = '\t';
    } else {
      // Find which character appears more in the first line
      const commas = (lines[0].match(/,/g) || []).length;
      const tabs = (lines[0].match(/\t/g) || []).length;
      const semicolons = (lines[0].match(/;/g) || []).length;
      if (tabs > commas && tabs > semicolons) separator = '\t';
      else if (semicolons > commas && semicolons > tabs) separator = ';';
    }

    // Parse headers
    const rawHeaders = lines[0].split(separator).map(h => h.trim().replace(/^["']|["']$/g, ''));
    
    // Map headers dynamically (English & Arabic support with extreme intelligence)
    const headers = rawHeaders.map((h, colIndex) => {
      const clean = h.trim();
      const lower = clean.toLowerCase();
      const cleanLowerNoSpaces = lower.replace(/[\s\-_/\\|()]/g, '');
      
      // Campaign ID/Title
      if (cleanLowerNoSpaces.includes('campaignid') || clean.includes('معرف الحملة') || clean === 'معرف_الحملة' || clean === 'معرف') return 'campaignId';
      if (cleanLowerNoSpaces.includes('campaigntitle') || clean.includes('اسم الحملة') || clean === 'الحملة المستهدفة' || clean === 'اسم_الحملة' || clean.includes('الحملة')) return 'campaignTitle';
      
      // Donor Name
      if (
        cleanLowerNoSpaces.includes('donorname') || 
        cleanLowerNoSpaces.includes('اسمالمتبرع') || 
        cleanLowerNoSpaces.includes('الاسم') || 
        cleanLowerNoSpaces.includes('المتبرع') || 
        cleanLowerNoSpaces.includes('اسم_المتبرع') || 
        cleanLowerNoSpaces.includes('الاسم_الكامل') || 
        cleanLowerNoSpaces.includes('الاسم_الكلي') || 
        cleanLowerNoSpaces.includes('اسم')
      ) {
        if (!cleanLowerNoSpaces.includes('حملة') && !cleanLowerNoSpaces.includes('عملة') && !cleanLowerNoSpaces.includes('يمني') && !cleanLowerNoSpaces.includes('سعودي') && !cleanLowerNoSpaces.includes('نوع')) {
          return 'donorName';
        }
      }
      
      // Amount (Robust Arabic headers mapping: المبلغ, القيمة, ريال يمني, ريال سعودي, تبرع عيني, إلخ)
      if (
        cleanLowerNoSpaces.includes('amount') || 
        cleanLowerNoSpaces.includes('المبلغ') || 
        cleanLowerNoSpaces.includes('القيمة') || 
        cleanLowerNoSpaces.includes('مبلغ') || 
        cleanLowerNoSpaces.includes('رياليمني') || 
        cleanLowerNoSpaces.includes('ريالسعودي') || 
        cleanLowerNoSpaces.includes('ريال') || 
        cleanLowerNoSpaces.includes('يمني') || 
        cleanLowerNoSpaces.includes('سعودي') || 
        cleanLowerNoSpaces.includes('دولار') ||
        cleanLowerNoSpaces.includes('المدخل') ||
        cleanLowerNoSpaces.includes('التبرع') ||
        cleanLowerNoSpaces.includes('تبرععيني') ||
        cleanLowerNoSpaces.includes('التبرعاتالعينية') ||
        cleanLowerNoSpaces.includes('تبرع') ||
        cleanLowerNoSpaces.includes('قيمة')
      ) {
        // Exclude headers that obviously mean other things
        if (
          !cleanLowerNoSpaces.includes('اسم') && 
          !cleanLowerNoSpaces.includes('نوع') && 
          !cleanLowerNoSpaces.includes('تاريخ') && 
          !cleanLowerNoSpaces.includes('جوال') && 
          !cleanLowerNoSpaces.includes('هاتف') &&
          !cleanLowerNoSpaces.includes('رقم') &&
          !cleanLowerNoSpaces.includes('ملاحظ')
        ) {
          return 'amount';
        }
      }
      
      // Currency
      if (
        cleanLowerNoSpaces.includes('currency') || 
        cleanLowerNoSpaces.includes('عملة') || 
        cleanLowerNoSpaces.includes('العملة') || 
        cleanLowerNoSpaces.includes('نوعالعملة') ||
        cleanLowerNoSpaces.includes('نوع_العملة')
      ) {
        return 'currency';
      }
      
      // Donor Phone
      if (
        cleanLowerNoSpaces.includes('donorphone') || 
        cleanLowerNoSpaces.includes('جوال') || 
        cleanLowerNoSpaces.includes('هاتف') || 
        cleanLowerNoSpaces.includes('تلفون') || 
        cleanLowerNoSpaces.includes('رقم') ||
        cleanLowerNoSpaces.includes('موبايل')
      ) {
        if (!cleanLowerNoSpaces.includes('مبلغ') && !cleanLowerNoSpaces.includes('ريال') && !cleanLowerNoSpaces.includes('تاريخ')) {
          return 'donorPhone';
        }
      }
      
      // Status
      if (
        cleanLowerNoSpaces.includes('status') || 
        cleanLowerNoSpaces.includes('حالة') || 
        cleanLowerNoSpaces.includes('الحالة') || 
        cleanLowerNoSpaces.includes('حالةالقيد')
      ) {
        return 'status';
      }
      
      // Notes
      if (
        cleanLowerNoSpaces.includes('notes') || 
        cleanLowerNoSpaces.includes('ملاحظ') || 
        cleanLowerNoSpaces.includes('البيان') || 
        cleanLowerNoSpaces.includes('بيان') || 
        cleanLowerNoSpaces.includes('تفاصيل') ||
        cleanLowerNoSpaces.includes('وصف')
      ) {
        return 'notes';
      }
      
      // Date
      if (
        cleanLowerNoSpaces.includes('date') || 
        cleanLowerNoSpaces.includes('تاريخ') || 
        cleanLowerNoSpaces.includes('التاريخ')
      ) {
        return 'date';
      }
      
      // Recorded By
      if (
        cleanLowerNoSpaces.includes('recordedby') || 
        cleanLowerNoSpaces.includes('المسجل') || 
        cleanLowerNoSpaces.includes('المندوب') || 
        cleanLowerNoSpaces.includes('بواسطة')
      ) {
        return 'recordedBy';
      }
      
      return h;
    });

    // Smart Flexible Fallback 1: Look for any header name containing numeric/financial indicators
    if (!headers.includes('amount')) {
      const foundIdx = rawHeaders.findIndex(rh => {
        const hClean = rh.trim().replace(/[\s_\-\/\\()]/g, '');
        return hClean.includes('ريال') || hClean.includes('سعودي') || hClean.includes('يمني') || hClean.includes('مبلغ') || hClean.includes('قيمة') || hClean.includes('المدخل') || hClean.includes('تبرع') || hClean.includes('التبرعاتالعينية');
      });
      if (foundIdx !== -1) {
        headers[foundIdx] = 'amount';
      }
    }

    // Smart Flexible Fallback 2: Look for the first column where values are strictly numeric
    if (!headers.includes('amount') && lines.length > 1) {
      const firstRowValues = lines[1].split(separator).map(v => v.trim().replace(/^["']|["']$/g, ''));
      const numericColIndex = firstRowValues.findIndex(val => {
        const num = parseFloat(val.replace(/[^0-9.]/g, ''));
        return !isNaN(num) && num > 0;
      });
      if (numericColIndex !== -1) {
        headers[numericColIndex] = 'amount';
      }
    }

    // Ultimate Fallback 3: Map the first column that isn't donorName
    if (!headers.includes('amount')) {
      const possibleIdx = headers.findIndex(h => h !== 'donorName' && h !== 'campaignId' && h !== 'campaignTitle');
      if (possibleIdx !== -1) {
        headers[possibleIdx] = 'amount';
      } else if (headers.length > 0) {
        headers[0] = 'amount'; // fallback to first column
      } else {
        headers.push('amount');
      }
    }

    // Ultimate Fallback 4: Make sure we have donorName
    if (!headers.includes('donorName')) {
      const possibleIdx = headers.findIndex(h => h !== 'amount' && h !== 'currency');
      if (possibleIdx !== -1) {
        headers[possibleIdx] = 'donorName';
      }
    }

    const validRecords: DonationRecord[] = [];
    for (let i = 1; i < lines.length; i++) {
      const rowNum = i + 1;
      const currentLine = lines[i];
      const values = currentLine.split(separator).map(v => v.trim().replace(/^["']|["']$/g, ''));
      if (values.length === 0 || (values.length === 1 && values[0] === '')) continue;

      const rowData: any = {};
      headers.forEach((header, index) => {
        if (index < values.length) {
          rowData[header] = values[index] || '';
        }
      });

      let campId = rowData.campaignId;
      let matchedCamp = campaigns.find(c => c.id === campId);
      if (!matchedCamp && rowData.campaignTitle) {
        matchedCamp = campaigns.find(c => c.title.trim() === rowData.campaignTitle.trim());
        if (matchedCamp) campId = matchedCamp.id;
      }
      if (!matchedCamp) {
        matchedCamp = campaigns[0];
        campId = matchedCamp?.id || '';
      }

      const dName = rowData.donorName || 'فاعل خير';

      // Parse amount intelligently
      let amtStr = String(rowData.amount || '0').replace(/[\u0600-\u06FFa-zA-Z,]/g, '').trim();
      let amt = parseFloat(amtStr);
      if (isNaN(amt)) {
        amt = 0;
      }
      if (amt < 0) amt = 0;

      // Map Currency dynamically with header-assisted fallback
      let rawCurr = rowData.currency || 'SAR';
      
      // If currency column was missing, check if any column header implies a specific currency
      if (!rowData.currency) {
        rawHeaders.forEach((rh, idx) => {
          const rhClean = rh.toLowerCase().trim();
          if (rhClean.includes('يمني') || rhClean.includes('yer')) {
            rawCurr = 'YER_NEW';
          } else if (rhClean.includes('سعودي') || rhClean.includes('sar')) {
            rawCurr = 'SAR';
          } else if (rhClean.includes('دولار') || rhClean.includes('usd')) {
            rawCurr = 'USD';
          } else if (rhClean.includes('عيني') || rhClean.includes('kind')) {
            rawCurr = 'KIND';
          }
        });
      }
      
      const curr = mapCurrencyDynamically(rawCurr);

      validRecords.push({
        id: rowData.id || `rec_imp_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 5)}`,
        campaignId: campId || 'legacy_temp',
        campaignTitle: matchedCamp ? matchedCamp.title : (rowData.campaignTitle || 'حملة مستوردة'),
        donorName: dName,
        donorPhone: rowData.donorPhone || '',
        amount: amt,
        currency: curr,
        paymentMethod: (rowData.paymentMethod as any) || 'transfer',
        date: rowData.date || new Date().toISOString().replace('T', ' ').substring(0, 16),
        recordedBy: rowData.recordedBy || currentUserEmail || 'مستورد ملفات',
        status: (rowData.status as any) || 'مقبول',
        notes: rowData.notes || 'مستورد يدوياً عبر جدول'
      });
    }

    return validRecords;
  };

  const validateAndParseData = (text: string, format: 'json' | 'csv') => {
    setValidationError(null);
    setUploadedRecords([]);
    setIsConfirmingImport(false);

    try {
      if (format === 'json') {
        const validRecords = parseJsonText(text);
        setUploadedRecords(validRecords);
        setImportWizardStep(1);
        setIsConfirmingImport(true);
      } else {
        const validRecords = parseCsvText(text);
        setUploadedRecords(validRecords);
        setImportWizardStep(1);
        setIsConfirmingImport(true);
      }
    } catch (error: any) {
      setValidationError(error.message || 'حدث خطأ غير متوقع أثناء تحليل بنية الملف.');
      setUploadedRecords([]);
      setIsConfirmingImport(false);
      setImportWizardStep(1);
    }
  };

  // Google OAuth 2.0 & Picker API logic
  const handleOpenGooglePicker = (mimeTypeFilter?: string) => {
    if (!isSuperAdmin) {
      alert('عذراً، رفع واستيراد الكشوفات التاريخية محصور للمدير العام فقط.');
      return;
    }

    if (!GOOGLE_CLIENT_ID || !GOOGLE_API_KEY) {
      alert('⚠️ يرجى تكوين GOOGLE_CLIENT_ID و GOOGLE_API_KEY في متغيرات البيئة أو في أعلى ملف Donations.tsx أولاً للاستيراد من Google Drive.');
      return;
    }

    if (!gisLoaded || !gapiLoaded) {
      alert('⏳ يرجى الانتظار لحين تحميل مكتبات Google (gapi و gis) الجاري تنزيلها بالخلفية...');
      return;
    }

    askConfirmation(
      'تأكيد استدعاء Google Picker',
      'هل أنت متأكد من رغبتك في فتح نافذة Google Drive لاختيار وجلب كشف مالي؟',
      () => {
        if (accessToken) {
          createPicker(accessToken, mimeTypeFilter);
        } else {
          try {
            // @ts-ignore
            const tokenClient = google.accounts.oauth2.initTokenClient({
              client_id: GOOGLE_CLIENT_ID,
              scope: 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/spreadsheets.readonly',
              callback: async (response: any) => {
                if (response.error !== undefined) {
                  console.error('Google Auth Error:', response);
                  alert(`فشل في المصادقة والحصول على رمز الوصول: ${response.error}`);
                  return;
                }
                setAccessToken(response.access_token);
                createPicker(response.access_token, mimeTypeFilter);
              },
            });
            tokenClient.requestAccessToken({ prompt: 'consent' });
          } catch (err) {
            console.error('Error initializing Token Client:', err);
            alert('حدث خطأ أثناء الاتصال بخدمات Google OAuth.');
          }
        }
      }
    );
  };

  const createPicker = (token: string, mimeTypeFilter?: string) => {
    // @ts-ignore
    gapi.load('picker', () => {
      try {
        const pickerOrigin =
          window.location.ancestorOrigins && window.location.ancestorOrigins.length > 0
            ? window.location.ancestorOrigins[window.location.ancestorOrigins.length - 1]
            : window.location.origin;

        // @ts-ignore
        const docsView = new google.picker.DocsView()
          // @ts-ignore
          .setMimeTypes(mimeTypeFilter || 'application/vnd.google-apps.spreadsheet,application/vnd.google-apps.document')
          .setSelectFolderEnabled(false);

        // @ts-ignore
        const pickerBuilder = new google.picker.PickerBuilder()
          // @ts-ignore
          .addView(docsView)
          .setOAuthToken(token)
          .setDeveloperKey(GOOGLE_API_KEY)
          .setCallback((data: any) => handlePickerCallback(data, token))
          .setOrigin(pickerOrigin);

        if (GOOGLE_APP_ID) {
          pickerBuilder.setAppId(GOOGLE_APP_ID);
        }

        const picker = pickerBuilder.build();
        picker.setVisible(true);
      } catch (err) {
        console.error('Error building Google Picker:', err);
        alert('حدث خطأ أثناء بناء نافذة Google Picker.');
      }
    });
  };

  const handlePickerCallback = async (data: any, token: string) => {
    // @ts-ignore
    if (data.action === google.picker.Action.PICKED) {
      const file = data.docs[0];
      const spreadsheetId = file.id;
      console.log('User picked Google Sheet:', file.name, spreadsheetId);
      
      askConfirmation(
        'تأكيد استيراد كشف Google Sheet',
        `هل أنت متأكد من جلب واستيراد كشف البيانات المالي من الملف المختار "${file.name}" وتحليله داخل المنصة؟`,
        async () => {
          await fetchSpreadsheetDataWithToken(spreadsheetId, token);
        }
      );
    }
  };

  const fetchSpreadsheetDataWithToken = async (spreadsheetId: string, token: string) => {
    setImportSource('sheet');
    setValidationError(null);
    setIsConfirmingImport(false);

    try {
      const downloadUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`;
      const response = await fetch(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('فشل جلب الملف من Google Drive. يرجى التحقق من صلاحيات الملف ورمز المصادقة.');
      }

      const text = await response.text();
      validateAndParseData(text, 'csv');
    } catch (err: any) {
      setValidationError(`عذراً، فشلت عملية جلب وقراءة البيانات من جدول Google Sheet المختار.
السبب: ${err.message || 'مشكلة في الاتصال أو عدم توفر صلاحيات القراءة.'}`);
    }
  };

  // Local file upload handling
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isSuperAdmin) {
      alert('عذراً، رفع واستيراد الكشوفات التاريخية محصور للمدير العام فقط.');
      return;
    }
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);

    askConfirmation(
      'تأكيد رفع الكشوفات المالية',
      `هل أنت متأكد من رفع هذه الكشوفات المالية وتحليلها داخل المنصة؟ (تم اختيار ${fileList.length} ملفات من جهازك)`,
      async () => {
        setImportSource('file');
        setValidationError(null);
        setUploadedRecords([]);
        setIsConfirmingImport(false);

        let combinedRecords: DonationRecord[] = [];
        let errorsOccurred: string[] = [];

        const readFilePromise = (file: File) => {
          return new Promise<DonationRecord[]>((resolve, reject) => {
            const extension = file.name.split('.').pop()?.toLowerCase();
            const reader = new FileReader();

            if (extension === 'xlsx' || extension === 'xls') {
              reader.onload = (event) => {
                try {
                  const data = new Uint8Array(event.target?.result as ArrayBuffer);
                  const workbook = XLSX.read(data, { type: 'array' });
                  const firstSheetName = workbook.SheetNames[0];
                  const worksheet = workbook.Sheets[firstSheetName];
                  const csv = XLSX.utils.sheet_to_csv(worksheet);
                  const parsed = parseCsvText(csv);
                  resolve(parsed);
                } catch (err: any) {
                  reject(new Error(`[ملف ${file.name}] فشل في قراءة Excel: ${err.message || err}`));
                }
              };
              reader.onerror = () => reject(new Error(`فشل قراءة ملف ${file.name}`));
              reader.readAsArrayBuffer(file);
            } else if (extension === 'json') {
              reader.onload = (event) => {
                try {
                  const text = event.target?.result as string;
                  const parsed = parseJsonText(text);
                  resolve(parsed);
                } catch (err: any) {
                  reject(new Error(`[ملف ${file.name}] فشل في قراءة JSON: ${err.message || err}`));
                }
              };
              reader.onerror = () => reject(new Error(`فشل قراءة ملف ${file.name}`));
              reader.readAsText(file);
            } else {
              // csv, txt, tsv
              reader.onload = (event) => {
                try {
                  const text = event.target?.result as string;
                  const parsed = parseCsvText(text);
                  resolve(parsed);
                } catch (err: any) {
                  reject(new Error(`[ملف ${file.name}] فشل في قراءة النص/CSV: ${err.message || err}`));
                }
              };
              reader.onerror = () => reject(new Error(`فشل قراءة ملف ${file.name}`));
              reader.readAsText(file);
            }
          });
        };

        try {
          for (const file of fileList) {
            try {
              const fileRecords = await readFilePromise(file as File);
              combinedRecords = [...combinedRecords, ...fileRecords];
            } catch (err: any) {
              errorsOccurred.push(err.message || String(err));
            }
          }

          if (errorsOccurred.length > 0) {
            setValidationError(`حدثت أخطاء أثناء قراءة بعض الملفات:\n${errorsOccurred.join('\n')}`);
          }

          if (combinedRecords.length > 0) {
            setUploadedRecords(combinedRecords);
            setImportWizardStep(1);
            setIsConfirmingImport(true);
          } else {
            throw new Error('لم يتم العثور على سجلات صالحة في أي من الملفات المحددة.');
          }
        } catch (error: any) {
          setValidationError(error.message || 'حدث خطأ غير متوقع أثناء تحليل بنية الملفات.');
          setUploadedRecords([]);
          setIsConfirmingImport(false);
          setImportWizardStep(1);
        }
      }
    );
  };

  // Fetching public Google Sheet published as CSV
  const handleFetchGoogleSheet = async () => {
    if (!isSuperAdmin) {
      alert('عذراً، جلب واستيراد الكشوفات من Google Sheets محصور للمدير العام فقط.');
      return;
    }
    if (!sheetUrl.trim()) {
      alert('الرجاء إدخال رابط جدول بيانات Google Sheet صحيح.');
      return;
    }

    askConfirmation(
      'تأكيد جلب بيانات من Google Sheet',
      'هل أنت متأكد من رغبتك في جلب وقراءة السجلات من رابط Google Sheet المحدد؟',
      async () => {
        setImportSource('sheet');
        setValidationError(null);
        setIsConfirmingImport(false);

        try {
          let downloadUrl = sheetUrl.trim();
          
          // Pattern 1: Google Sheets URL
          if (downloadUrl.includes('docs.google.com/spreadsheets')) {
            const sheetIdMatch = downloadUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
            if (sheetIdMatch && sheetIdMatch[1]) {
              const sheetId = sheetIdMatch[1];
              // Extract gid if exists to target a specific sheet/tab
              const gidMatch = downloadUrl.match(/gid=([0-9]+)/);
              const gidParam = gidMatch ? `&gid=${gidMatch[1]}` : '';
              downloadUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gidParam}`;
            } else if (downloadUrl.includes('/edit')) {
              downloadUrl = downloadUrl.replace(/\/edit.*$/, '/export?format=csv');
            } else if (!downloadUrl.includes('/export')) {
              downloadUrl = downloadUrl + '/export?format=csv';
            }
          } 
          // Pattern 2: Google Drive file sharing link
          else if (downloadUrl.includes('drive.google.com')) {
            const fileIdMatch = downloadUrl.match(/\/file\/d\/([a-zA-Z0-9-_]+)/) || downloadUrl.match(/id=([a-zA-Z0-9-_]+)/);
            if (fileIdMatch && fileIdMatch[1]) {
              const fileId = fileIdMatch[1];
              downloadUrl = `https://docs.google.com/uc?export=download&id=${fileId}`;
            }
          }

          const response = await fetch(downloadUrl);
          if (!response.ok) {
            throw new Error('فشل جلب الملف من الرابط. تأكد من أن الملف منشور للعامة وصلاحيات الرابط تسمح بالقراءة كـ "أي شخص لديه الرابط".');
          }

          const text = await response.text();
          validateAndParseData(text, 'csv');
        } catch (err: any) {
          setValidationError(`عذراً، فشلت عملية جلب البيانات من Google Sheet.
سبب الخطأ: ${err.message || 'الرابط غير صالح أو محمي بخصوصية تمنع الوصول.'}`);
        }
      }
    );
  };

  const handleStartProcessingImport = () => {
    if (!isSuperAdmin) {
      alert('عذراً، رفع واستيراد الكشوفات التاريخية محصور للمدير العام فقط.');
      return;
    }

    askConfirmation(
      'تأكيد بدء المعالجة والتحليل',
      'هل أنت متأكد من رغبتك في قراءة ومعالجة البيانات المحددة وبدء خطوات الاستيراد والدمج؟',
      async () => {
        setValidationError(null);
        setUploadedRecords([]);
        setIsConfirmingImport(false);

        // 1. Check File Upload
        if (selectedFiles.length > 0) {
          setImportSource('file');
          let combinedRecords: DonationRecord[] = [];
          let errorsOccurred: string[] = [];

          const readFilePromise = (file: File) => {
            return new Promise<DonationRecord[]>((resolve, reject) => {
              const extension = file.name.split('.').pop()?.toLowerCase();
              const reader = new FileReader();

              if (extension === 'xlsx' || extension === 'xls') {
                reader.onload = (event) => {
                  try {
                    const data = new Uint8Array(event.target?.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    const csv = XLSX.utils.sheet_to_csv(worksheet);
                    const parsed = parseCsvText(csv);
                    resolve(parsed);
                  } catch (err: any) {
                    reject(new Error(`[ملف ${file.name}] فشل في قراءة Excel: ${err.message || err}`));
                  }
                };
                reader.onerror = () => reject(new Error(`فشل قراءة ملف ${file.name}`));
                reader.readAsArrayBuffer(file);
              } else if (extension === 'json') {
                reader.onload = (event) => {
                  try {
                    const text = event.target?.result as string;
                    const parsed = parseJsonText(text);
                    resolve(parsed);
                  } catch (err: any) {
                    reject(new Error(`[ملف ${file.name}] فشل في قراءة JSON: ${err.message || err}`));
                  }
                };
                reader.onerror = () => reject(new Error(`فشل قراءة ملف ${file.name}`));
                reader.readAsText(file);
              } else {
                // csv, txt, tsv
                reader.onload = (event) => {
                  try {
                    const text = event.target?.result as string;
                    const parsed = parseCsvText(text);
                    resolve(parsed);
                  } catch (err: any) {
                    reject(new Error(`[ملف ${file.name}] فشل في قراءة النص/CSV: ${err.message || err}`));
                  }
                };
                reader.onerror = () => reject(new Error(`فشل قراءة ملف ${file.name}`));
                reader.readAsText(file);
              }
            });
          };

          try {
            for (const file of selectedFiles) {
              try {
                const fileRecords = await readFilePromise(file);
                combinedRecords = [...combinedRecords, ...fileRecords];
              } catch (err: any) {
                errorsOccurred.push(err.message || String(err));
              }
            }

            if (errorsOccurred.length > 0) {
              setValidationError(`حدثت أخطاء أثناء قراءة بعض الملفات:\n${errorsOccurred.join('\n')}`);
            }

            if (combinedRecords.length > 0) {
              setUploadedRecords(combinedRecords);
              setImportWizardStep(1);
              setIsConfirmingImport(true);
            } else {
              throw new Error('لم يتم العثور على سجلات صالحة في أي من الملفات المحددة.');
            }
          } catch (error: any) {
            setValidationError(error.message || 'حدث خطأ غير متوقع أثناء تحليل بنية الملفات.');
            setUploadedRecords([]);
            setIsConfirmingImport(false);
            setImportWizardStep(1);
          }
        }
        // 2. Check Sheet URL
        else if (sheetUrl.trim()) {
          setImportSource('sheet');
          try {
            let downloadUrl = sheetUrl.trim();
            
            if (downloadUrl.includes('docs.google.com/spreadsheets')) {
              const sheetIdMatch = downloadUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
              if (sheetIdMatch && sheetIdMatch[1]) {
                const sheetId = sheetIdMatch[1];
                const gidMatch = downloadUrl.match(/gid=([0-9]+)/);
                const gidParam = gidMatch ? `&gid=${gidMatch[1]}` : '';
                downloadUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gidParam}`;
              } else if (downloadUrl.includes('/edit')) {
                downloadUrl = downloadUrl.replace(/\/edit.*$/, '/export?format=csv');
              } else if (!downloadUrl.includes('/export')) {
                downloadUrl = downloadUrl + '/export?format=csv';
              }
            } else if (downloadUrl.includes('drive.google.com')) {
              const fileIdMatch = downloadUrl.match(/\/file\/d\/([a-zA-Z0-9-_]+)/) || downloadUrl.match(/id=([a-zA-Z0-9-_]+)/);
              if (fileIdMatch && fileIdMatch[1]) {
                const fileId = fileIdMatch[1];
                downloadUrl = `https://docs.google.com/uc?export=download&id=${fileId}`;
              }
            }

            const response = await fetch(downloadUrl);
            if (!response.ok) {
              throw new Error('فشل جلب الملف من الرابط. تأكد من أن الملف منشور للعامة وصلاحيات الرابط تسمح بالقراءة كـ "أي شخص لديه الرابط".');
            }

            const text = await response.text();
            validateAndParseData(text, 'csv');
          } catch (err: any) {
            setValidationError(`عذراً، فشلت عملية جلب البيانات من Google Sheet.
سبب الخطأ: ${err.message || 'الرابط غير صالح أو محمي بخصوصية تمنع الوصول.'}`);
          }
        }
        // 3. Check Manual Paste
        else if (manualPasteContent.trim()) {
          setImportSource('paste');
          const trimmed = manualPasteContent.trim();
          if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
            validateAndParseData(trimmed, 'json');
          } else {
            validateAndParseData(trimmed, 'csv');
          }
        }
      }
    );
  };

  // Commit the validated import
  const handleSaveImportedRecords = () => {
    if (!isSuperAdmin) {
      alert('عذراً، رفع وحفظ الكشوفات التاريخية هي صلاحية حصرية للمدير العام.');
      return;
    }

    if (uploadedRecords.length === 0) return;

    // Validate campaign linkage choice
    let selectedTitle = '';
    let selectedId = '';

    if (importCampType === 'existing') {
      if (!importSelectedCampId) {
        alert('يرجى تحديد الحملة الجارية المرتبطة بهذا الكشف المالي.');
        return;
      }
      const camp = campaigns.find(c => c.id === importSelectedCampId);
      if (camp) {
        selectedTitle = camp.title;
        selectedId = camp.id;
      } else {
        alert('الحملة المحددة غير صالحة.');
        return;
      }
    } else {
      if (!importCustomCampName.trim()) {
        alert('يرجى كتابة اسم مخصص للحملة التاريخية.');
        return;
      }
      selectedTitle = importCustomCampName.trim();
      selectedId = 'legacy_' + Date.now();
    }

    const isReplace = importDuplicateMode === 'replace';

    // Map all uploaded records to the chosen campaign and mark as archive-only
    const finalizedRecords = uploadedRecords.map(r => ({
      ...r,
      campaignId: selectedId,
      campaignTitle: selectedTitle,
      status: 'مقبول' as const,
      notes: r.notes ? `${r.notes} [أرشيف تاريخي]` : 'مستورد كأرشيف كشف تاريخي'
    }));

    if (isReplace) {
      setArchiveRecords(prev => {
        const filtered = prev.filter(r => r.campaignId !== selectedId && r.campaignTitle !== selectedTitle);
        return [...finalizedRecords, ...filtered];
      });
    } else {
      setArchiveRecords(prev => [...finalizedRecords, ...prev]);
    }
    
    // Set custom success banner states
    setSuccessImportDetails({
      campaignTitle: selectedTitle,
      recordCount: uploadedRecords.length,
      mode: importDuplicateMode
    });
    setShowImportSuccessBanner(true);

    // Clear import states
    setUploadedRecords([]);
    setIsConfirmingImport(false);
    setImportWizardStep(1);
    setSheetUrl('');
    setImportSource(null);
    setImportCustomCampName('');
    setImportSelectedCampId('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (fileInputRef2.current) fileInputRef2.current.value = '';
  };

  // Refresh view from local states
  const handleRefreshData = () => {
    const savedRecords = localStorage.getItem('local_donation_records_v1');
    const savedCamps = localStorage.getItem('local_campaigns_v2');
    if (savedRecords) setRecords(JSON.parse(savedRecords));
    if (savedCamps) setCampaigns(JSON.parse(savedCamps));
    alert('تم تحديث مزامنة البيانات والقيود بنجاح!');
  };

  // Export filtered records to CSV
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      alert('لا توجد سجلات لتصديرها.');
      return;
    }

    askConfirmation(
      'تأكيد تصدير كشف CSV',
      `هل أنت متأكد من رغبتك في تصدير وتحميل عدد (${filteredRecords.length}) قيد تبرع مصفى إلى ملف CSV للتحميل؟`,
      () => {
        let csvContent = '\uFEFF'; // Excel UTF-8 BOM for perfect Arabic display
        csvContent += 'معرف القيد,الحملة المستهدفة,اسم المتبرع,رقم الجوال,المبلغ,العملة,التبرع العيني,طريقة السداد,المسجل,التاريخ والوقت,الحالة,ملاحظات\n';
        
        filteredRecords.forEach(r => {
          const row = [
            r.id,
            `"${r.campaignTitle.replace(/"/g, '""')}"`,
            `"${r.donorName.replace(/"/g, '""')}"`,
            r.donorPhone || '',
            r.amount,
            r.currency,
            `"${(r.inkindDescription || '').replace(/"/g, '""')}"`,
            r.paymentMethod,
            `"${r.recordedBy.replace(/"/g, '""')}"`,
            r.date,
            r.status,
            `"${(r.notes || '').replace(/"/g, '""')}"`
          ];
          csvContent += row.join(',') + '\n';
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `كشف_تبرعات_قرية_ذي_للجمال_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showSuccessAlert(
          '📥 تم تصدير وتحميل الملف بنجاح!',
          `تم بنجاح تصدير وحفظ عدد (${filteredRecords.length}) سجل تبرع إلى جهازك بصيغة CSV المتوافقة مع برنامج Excel.`
        );
      }
    );
  };

  // Export filtered records to PDF / Printing Window
  const handleExportPDF = () => {
    if (filteredRecords.length === 0) {
      alert('لا توجد سجلات لتصديرها.');
      return;
    }

    askConfirmation(
      'تأكيد تصدير كشف طباعة PDF',
      `هل أنت متأكد من رغبتك في تصدير عدد (${filteredRecords.length}) قيد مصفى إلى نافذة الطباعة / PDF؟`,
      () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
          alert('يرجى السماح بالنوافذ المنبثقة لتصدير الكشف للطباعة.');
          return;
        }
        
        const tableRows = filteredRecords.map((r, idx) => `
          <tr>
            <td style="text-align: center;">${idx + 1}</td>
            <td>${r.campaignTitle}</td>
            <td>${r.donorName}</td>
            <td style="font-weight: bold; font-family: monospace; color: #4A5D4E;">
              ${r.currency === 'KIND' || (r.inkindDescription && r.inkindDescription.trim().length > 0)
                ? `<span style="color: #92400e; background: #fef3c7; padding: 2px 6px; border-radius: 4px; font-size: 11px;">🎁 عيني: ${r.inkindDescription}</span>`
                : `${r.amount.toLocaleString()} ${r.currency}`}
            </td>
            <td>${r.paymentMethod === 'cash' ? '💵 نقدي' : r.paymentMethod === 'transfer' ? '🏦 حوالة' : '💳 شبكة/بطاقة'}</td>
            <td>${r.recordedBy}</td>
            <td style="font-family: monospace;">${r.date}</td>
            <td style="text-align: center;">${r.status}</td>
          </tr>
        `).join('');

        printWindow.document.write(`
          <html dir="rtl" lang="ar">
            <head>
              <title>كشف مساهمات وتبرعات قرية ذي للجمال قدس</title>
              <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #2D3A30; background-color: #fff; }
                .header-container { border-bottom: 3px double #4A5D4E; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
                .header-info { text-align: right; }
                .header-info h1 { margin: 0 0 8px 0; color: #2D3A30; font-size: 22px; font-weight: 800; }
                .header-info p { margin: 3px 0; font-size: 13px; color: #5F6C61; }
                .header-logo { text-align: left; font-size: 11px; color: #7A8B7E; line-height: 1.5; }
                table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
                th, td { border: 1px solid #D1CAB8; padding: 12px 10px; text-align: right; }
                th { background-color: #F4F1EA; font-weight: bold; color: #3E4C41; }
                tr:nth-child(even) { background-color: #FDFBF7; }
                .footer { margin-top: 50px; text-align: center; font-size: 11px; color: #7A8B7E; border-top: 1px solid #E2DED0; padding-top: 20px; }
              </style>
            </head>
            <body>
              <div class="header-container">
                <div class="header-info">
                  <h1>تقرير كشف المساهمات والتبرعات المعتمدة</h1>
                  <p>المرصد التنموي التكافلي لقرية ذي للجمال قدس</p>
                  <p>تاريخ وتوقيت الاستخراج: ${new Date().toLocaleString('ar-SA')}</p>
                </div>
                <div class="header-logo">
                  <strong>الجمهورية اليمنية</strong><br/>
                  <strong>المرصد الأهلي التنموي</strong><br/>
                  <strong>ذي للجمال - قدس</strong>
                </div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th style="width: 40px; text-align: center;">م</th>
                    <th>الحملة المستهدفة</th>
                    <th>اسم المتبرع</th>
                    <th>المبلغ المالي والعملة</th>
                    <th>طريقة السداد</th>
                    <th>بواسطة (المسجل)</th>
                    <th>التاريخ</th>
                    <th style="text-align: center;">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  ${tableRows}
                </tbody>
              </table>
              <div class="footer">
                <p>ملاحظة هامة: تم استخراج هذا التقرير الرقمي المعتمد من البوابة التنموية لقرية ذي للجمال قدس.</p>
              </div>
              <script>
                window.onload = function() {
                  window.print();
                  window.onafterprint = function() { window.close(); }
                }
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();

        showSuccessAlert(
          '🖨️ تم إعداد كشف الطباعة!',
          `تم بنجاح تصدير وتجهيز كشف الطباعة الرسمي لعدد (${filteredRecords.length}) سجل تبرع بنجاح، يرجى متابعة الطباعة من النافذة المنبثقة.`
        );
      }
    );
  };

  // Calculate multi-currency totals
  const getTotalsByCurrency = () => {
    const totals = {
      SAR: 0,
      USD: 0,
      YER_NEW: 0,
      YER_OLD: 0
    };
    records.forEach(r => {
      if (r.status === 'مقبول') {
        const amt = r.amount || 0;
        if (r.currency === 'SAR') totals.SAR += amt;
        else if (r.currency === 'USD') totals.USD += amt;
        else if (r.currency === 'YER_NEW') totals.YER_NEW += amt;
        else if (r.currency === 'YER_OLD') totals.YER_OLD += amt;
      }
    });
    return totals;
  };

  const currencyTotals = getTotalsByCurrency();
  const inKindCount = records.filter(r => r.status === 'مقبول' && (r.currency === 'KIND' || (r.inkindDescription && r.inkindDescription.trim().length > 0))).length;

  // Filtered donation list records
  const [recordsFilterCurrency, setRecordsFilterCurrency] = useState('all');
  const [recordsFilterDelegate, setRecordsFilterDelegate] = useState('all');
  const [publicSelectedCampaignId, setPublicSelectedCampaignId] = useState('');

  const filteredRecords = records.filter(r => {
    const matchesSearch = 
      r.donorName.toLowerCase().includes(recordsSearchQuery.toLowerCase()) ||
      r.campaignTitle.toLowerCase().includes(recordsSearchQuery.toLowerCase()) ||
      (r.donorPhone && r.donorPhone.includes(recordsSearchQuery));

    const matchesCampaign = recordsFilterCampaign === 'all' || r.campaignId === recordsFilterCampaign;
    const matchesStatus = recordsFilterStatus === 'all' || r.status === recordsFilterStatus;
    const matchesCurrency = recordsFilterCurrency === 'all' || r.currency === recordsFilterCurrency;
    
    const delegateEmail = r.recordedBy || '';
    const matchesDelegate = recordsFilterDelegate === 'all' || delegateEmail.toLowerCase().trim() === recordsFilterDelegate.toLowerCase().trim();

    return matchesSearch && matchesCampaign && matchesStatus && matchesCurrency && matchesDelegate;
  });

  // Filtered archive list records
  const filteredArchiveRecords = archiveRecords.filter(r => {
    const matchesSearch = 
      r.donorName.toLowerCase().includes(archiveSearchQuery.toLowerCase()) ||
      r.campaignTitle.toLowerCase().includes(archiveSearchQuery.toLowerCase()) ||
      (r.donorPhone && r.donorPhone.includes(archiveSearchQuery)) ||
      (r.recordedBy && r.recordedBy.toLowerCase().includes(archiveSearchQuery.toLowerCase()));

    const matchesCampaign = archiveFilterCampaign === 'all' || r.campaignId === archiveFilterCampaign || r.campaignTitle === archiveFilterCampaign;
    const matchesCurrency = archiveFilterCurrency === 'all' || r.currency === archiveFilterCurrency;

    return matchesSearch && matchesCampaign && matchesCurrency;
  });

  const getArchiveTotalsByCurrency = () => {
    const totals = {
      SAR: 0,
      USD: 0,
      YER_NEW: 0,
      YER_OLD: 0
    };
    archiveRecords.forEach(r => {
      const amt = r.amount || 0;
      if (r.currency === 'SAR') totals.SAR += amt;
      else if (r.currency === 'USD') totals.USD += amt;
      else if (r.currency === 'YER_NEW') totals.YER_NEW += amt;
      else if (r.currency === 'YER_OLD') totals.YER_OLD += amt;
    });
    return totals;
  };
  const archiveTotals = getArchiveTotalsByCurrency();

  const getHistoricalCampaigns = () => {
    const campaignMap: Record<string, {
      id: string;
      title: string;
      recordCount: number;
      totals: { SAR: number; USD: number; YER_NEW: number; YER_OLD: number };
    }> = {};

    archiveRecords.forEach(r => {
      const campId = r.campaignId || 'legacy_temp';
      const campTitle = r.campaignTitle || 'حملة مؤرشفة غير محددة';
      const key = campTitle; // Group by title to merge duplicate names safely
      
      if (!campaignMap[key]) {
        campaignMap[key] = {
          id: campId,
          title: campTitle,
          recordCount: 0,
          totals: { SAR: 0, USD: 0, YER_NEW: 0, YER_OLD: 0 }
        };
      }

      campaignMap[key].recordCount += 1;
      const amt = r.amount || 0;
      if (r.currency === 'SAR') campaignMap[key].totals.SAR += amt;
      else if (r.currency === 'USD') campaignMap[key].totals.USD += amt;
      else if (r.currency === 'YER_NEW') campaignMap[key].totals.YER_NEW += amt;
      else if (r.currency === 'YER_OLD') campaignMap[key].totals.YER_OLD += amt;
    });

    return Object.values(campaignMap);
  };

  const archiveInKindCount = archiveRecords.filter(r => r.currency === 'KIND' || (r.inkindDescription && r.inkindDescription.trim().length > 0)).length;

  return (
    <div className="space-y-6 font-sans" id="donations-workspace">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#F4F1EA] rounded-3xl p-6 border border-[#E2DED0] shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-[#2D3A30] flex items-center gap-2">
            <Heart className="w-6 h-6 text-[#A98467] fill-[#A98467]/20" />
            بوابة التبرعات والمساهمات التنموية
          </h2>
          <p className="text-xs text-[#7A8B7E] mt-1">
            منظومة متكاملة لشفافية التبرعات وإدارة الحملات المتعددة العملات وتمكين المندوبين من تسجيل وتوثيق القيود.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">

          {(hasManagementAccess || userRole === 'delegate' || currentUserDBRole === 'delegate' || userRole === 'supervisor' || currentUserDBRole === 'supervisor') && (
            <button
              onClick={() => {
                setOpenAddDonationModal(true);
              }}
              className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md hover:shadow-lg flex items-center gap-1.5 transition-all cursor-pointer border border-emerald-700"
              id="btn-add-new-donation"
            >
              <span>إضافة تبرع جديد ➕</span>
            </button>
          )}
          {(hasManagementAccess || userRole === 'delegate' || currentUserDBRole === 'delegate' || userRole === 'supervisor' || currentUserDBRole === 'supervisor') && (
            <button
              onClick={() => {
                setActiveSubTab('opportunities');
                setEditingCampaign(null);
                setIsAddingCampaign(true);
                setCampTitle('');
                setCampDescription('');
                setCampTarget('');
                setCampCategory('أسر');
                setCampIcon('🎁');
                setCampCurrencies(['SAR']);
                setCampDelegates('');
                setCampAllowManager(true);
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md hover:shadow-lg flex items-center gap-1.5 transition-all cursor-pointer border border-amber-600"
              id="btn-add-new-campaign"
            >
              <span>إضافة حملة تبرع جديدة 🎯</span>
            </button>
          )}
          <button
            onClick={onBackToHome}
            className="bg-[#4A5D4E] hover:bg-[#3E4C41] text-[#FDFBF7] px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm hover:shadow flex items-center gap-2 transition-all cursor-pointer border border-[#4A5D4E]"
            id="btn-back-home"
          >
            <Home className="w-4 h-4" />
            العودة للرئيسية
          </button>
        </div>
      </div>

      {/* Role Badge Indicator for Managers */}
      {hasManagementAccess && (
        <div className="bg-[#4A5D4E]/5 border border-[#4A5D4E]/20 rounded-2xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-100 text-amber-800 text-lg border border-amber-200">🛡️</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-amber-900 bg-amber-100 border border-amber-200/50 px-2 py-0.5 rounded-md">
                  {isSuperAdmin ? 'المدير العام' : 'المشرف العام'}
                </span>
                <span className="text-[11px] text-[#5F6C61] font-mono">{currentUserEmail}</span>
              </div>
              <p className="text-[10px] sm:text-xs text-[#3E4C41] mt-0.5 font-bold">
                {isSuperAdmin 
                  ? 'لديك صلاحيات مطلقة لإنشاء الحملات وتعديل أو حذف أي قيد تبرع بالنظام واستيراد وتأكيد الجداول.'
                  : 'لديك صلاحيات تسجيل التبرعات والمساهمة في إدارة ومراجعة الجداول المرفوعة.'}
              </p>
            </div>
          </div>

          {/* Sub Navigation Tabs for Administrators */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveSubTab('opportunities')}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                activeSubTab === 'opportunities'
                  ? 'bg-emerald-700 text-white shadow-sm border border-emerald-800'
                  : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
              }`}
            >
              [حملات التبرعات الجديدة]
            </button>
            <button
              onClick={() => setActiveSubTab('archive')}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                activeSubTab === 'archive'
                  ? 'bg-emerald-700 text-white shadow-sm border border-emerald-800'
                  : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
              }`}
            >
              [حملات التبرعات القديمة]
            </button>
            <button
              onClick={() => setActiveSubTab('records')}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                activeSubTab === 'records'
                  ? 'bg-emerald-700 text-white shadow-sm border border-emerald-800'
                  : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
              }`}
            >
              [سجلات قيود التبرعات]
            </button>
            {isSuperAdmin && (
              <button
                onClick={() => setActiveSubTab('import')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                  activeSubTab === 'import'
                    ? 'bg-amber-600 text-white shadow-sm border border-amber-700'
                    : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
                }`}
              >
                [جلب ورفع البيانات]
              </button>
            )}
            {isSuperAdmin && (
              <button
                onClick={() => setActiveSubTab('settings')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                  activeSubTab === 'settings'
                    ? 'bg-blue-600 text-white shadow-sm border border-blue-700'
                    : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
                }`}
              >
                [الإعدادات للمدير العام]
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* 📊 Unified Dashboard Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
        <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm flex flex-col items-center justify-center text-center space-y-2 relative overflow-hidden group">
          <div className="absolute top-0 w-full h-1 bg-emerald-500"></div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 mb-1 group-hover:scale-110 transition-transform">
            <Heart className="w-5 h-5" />
          </div>
          <span className="text-3xl font-black text-[#2D3A30]">{campaigns.length}</span>
          <span className="text-xs font-bold text-gray-500">حملات التبرعات</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-blue-100 shadow-sm flex flex-col items-center justify-center text-center space-y-2 relative overflow-hidden group">
          <div className="absolute top-0 w-full h-1 bg-blue-500"></div>
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-1 group-hover:scale-110 transition-transform">
            <Database className="w-5 h-5" />
          </div>
          <span className="text-3xl font-black text-[#2D3A30]">{records.length}</span>
          <span className="text-xs font-bold text-gray-500">قيود التبرعات النشطة</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-amber-100 shadow-sm flex flex-col items-center justify-center text-center space-y-2 relative overflow-hidden group">
          <div className="absolute top-0 w-full h-1 bg-amber-500"></div>
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 mb-1 group-hover:scale-110 transition-transform">
            <Archive className="w-5 h-5" />
          </div>
          <span className="text-3xl font-black text-[#2D3A30]">{archiveRecords.length}</span>
          <span className="text-xs font-bold text-gray-500">القيود في الأرشيف</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-purple-100 shadow-sm flex flex-col items-center justify-center text-center space-y-2 relative overflow-hidden group">
          <div className="absolute top-0 w-full h-1 bg-purple-500"></div>
          <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 mb-1 group-hover:scale-110 transition-transform">
            <Users className="w-5 h-5" />
          </div>
          <span className="text-3xl font-black text-[#2D3A30]">{DELEGATE_OPTIONS.length - blockedDelegates.length}</span>
          <span className="text-xs font-bold text-gray-500">المندوبين المعتمدين</span>
        </div>
      </div>
\n      {activeSubTab === 'opportunities' && (
        <div className="space-y-6">
          {/* Multi-Currency Comprehensive Statistics Panel */}
          <div className="bg-white rounded-3xl border border-[#E2DED0] p-5 shadow-xs space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-[#F4F1EA]">
              <div>
                <h4 className="text-xs font-black text-[#2D3A30] flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-[#A98467]" />
                  لوحة الإحصائيات الشاملة وفصل العملات المستقلة (تبرعات قديمة وحالية)
                </h4>
                <p className="text-[10px] text-[#7A8B7E] mt-0.5">
                  رصد دقيق ومستقل للمبالغ المحصلة الفيدرالية في حسابات القرية دون تحويل إجباري.
                </p>
              </div>
              <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-lg font-bold">تحديث فوري تلقائي</span>
            </div>

            <div className="overflow-x-auto border border-[#E2DED0]/70 rounded-2xl">
              <table className="w-full text-xs text-right border-collapse">
                <thead>
                  <tr className="bg-[#FDFBF7] border-b border-[#E2DED0] text-[#3E4C41] font-black text-[10px]">
                    <th className="p-2.5 text-right">العملة والرمز الدولي</th>
                    <th className="p-2.5 text-right">فئة العملة النقدية للقرية</th>
                    <th className="p-2.5 text-left font-mono">إجمالي المساهمات (مستقل)</th>
                    <th className="p-2.5 text-center">التحديث والترحيل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F4F1EA]">
                  <tr className="hover:bg-amber-50/20 transition-colors">
                    <td className="p-2.5 flex items-center gap-1.5 font-bold">
                      <span className="text-base">🇾🇪</span>
                      <span>YER_NEW</span>
                    </td>
                    <td className="p-2.5 text-[#5F6C61] font-medium">الريال اليمني الجديد (قعيطي)</td>
                    <td className="p-2.5 text-left font-extrabold font-mono text-amber-950 text-xs">
                      {currencyTotals.YER_NEW.toLocaleString('ar-SA')} ر.ي
                    </td>
                    <td className="p-2.5 text-center text-[10px] text-emerald-600 font-bold">● فوري وتلقائي</td>
                  </tr>
                  <tr className="hover:bg-[#4A5D4E]/5 transition-colors">
                    <td className="p-2.5 flex items-center gap-1.5 font-bold">
                      <span className="text-base">🏛️</span>
                      <span>YER_OLD</span>
                    </td>
                    <td className="p-2.5 text-[#5F6C61] font-medium">الريال اليمني القديم (مستقر)</td>
                    <td className="p-2.5 text-left font-extrabold font-mono text-[#4A5D4E] text-xs">
                      {currencyTotals.YER_OLD.toLocaleString('ar-SA')} ر.ي
                    </td>
                    <td className="p-2.5 text-center text-[10px] text-emerald-600 font-bold">● فوري وتلقائي</td>
                  </tr>
                  <tr className="hover:bg-emerald-50/30 transition-colors">
                    <td className="p-2.5 flex items-center gap-1.5 font-bold">
                      <span className="text-base">🇸🇦</span>
                      <span>SAR</span>
                    </td>
                    <td className="p-2.5 text-[#5F6C61] font-medium">الريال السعودي (الرئيسي)</td>
                    <td className="p-2.5 text-left font-extrabold font-mono text-emerald-800 text-xs">
                      {currencyTotals.SAR.toLocaleString('ar-SA')} ر.س
                    </td>
                    <td className="p-2.5 text-center text-[10px] text-emerald-600 font-bold">● فوري وتلقائي</td>
                  </tr>
                  <tr className="hover:bg-[#A98467]/5 transition-colors">
                    <td className="p-2.5 flex items-center gap-1.5 font-bold">
                      <span className="text-base">🇺🇸</span>
                      <span>USD</span>
                    </td>
                    <td className="p-2.5 text-[#5F6C61] font-medium">الدولار الأمريكي (الاحتياطي)</td>
                    <td className="p-2.5 text-left font-extrabold font-mono text-[#A98467] text-xs">
                      ${currencyTotals.USD.toLocaleString('ar-SA')}
                    </td>
                    <td className="p-2.5 text-center text-[10px] text-emerald-600 font-bold">● فوري وتلقائي</td>
                  </tr>
                  <tr className="hover:bg-amber-100/20 transition-colors">
                    <td className="p-2.5 flex items-center gap-1.5 font-bold">
                      <span className="text-base">🎁</span>
                      <span>KIND</span>
                    </td>
                    <td className="p-2.5 text-[#5F6C61] font-medium">التبرعات والمساهمات العينية</td>
                    <td className="p-2.5 text-left font-extrabold font-mono text-amber-800 text-xs">
                      {inKindCount} مساهمة عينية
                    </td>
                    <td className="p-2.5 text-center text-[10px] text-emerald-600 font-bold">● فوري وتلقائي</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Smart Dropdown Campaign Browser for Clean Public Statements */}
          <div className="bg-white rounded-3xl border border-[#E2DED0] p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 border-b border-[#F4F1EA]">
              <div>
                <h4 className="text-xs font-black text-[#2D3A30] flex items-center gap-1.5">
                  <HeartHandshake className="w-4 h-4 text-emerald-700" />
                  مستكشف مساهمات الأهالي للحملات (بيان مصفى ونظيف للمتصفحين)
                </h4>
                <p className="text-[10px] text-[#7A8B7E] mt-0.5">
                  اختر الحملة التنموية للاطلاع على قائمة شرف المتبرعين والمبالغ المستلمة مقسمة حسب نوع العملة.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="md:col-span-2 text-xs">
                <label className="block text-[10px] font-bold text-[#3E4C41] mb-1">🎯 اختر الحملة التنموية النشطة</label>
                <select
                  value={publicSelectedCampaignId}
                  onChange={(e) => setPublicSelectedCampaignId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2DED0] bg-white text-xs font-bold text-[#2D3A30] outline-none"
                >
                  <option value="">-- يرجى اختيار حملة تبرعات لاستعراض القيود --</option>
                  {campaigns.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              {publicSelectedCampaignId && (
                <button
                  onClick={() => setPublicSelectedCampaignId('')}
                  className="px-3 py-2 rounded-xl border border-[#E2DED0] hover:bg-gray-50 text-xs font-bold text-[#5F6C61] transition-all cursor-pointer"
                >
                  إعادة تعيين وعرض الكل
                </button>
              )}
            </div>

            {publicSelectedCampaignId && (() => {
              const selectedCamp = campaigns.find(c => c.id === publicSelectedCampaignId);
              if (!selectedCamp) return null;
              
              const campConfirmedRecords = records.filter(r => r.campaignId === publicSelectedCampaignId && r.status === 'مقبول');
              
              // Group records by currency
              const groupedByCurr: Record<string, typeof campConfirmedRecords> = {};
              campConfirmedRecords.forEach(r => {
                if (!groupedByCurr[r.currency]) groupedByCurr[r.currency] = [];
                groupedByCurr[r.currency].push(r);
              });

              return (
                <div className="space-y-4 pt-2 border-t border-[#F4F1EA]">
                  <div className="bg-[#FDFBF7] p-3 rounded-2xl border border-emerald-100 space-y-1">
                    <h5 className="font-bold text-[#2D3A30] text-xs">📊 ملخص مساهمات: {selectedCamp.title}</h5>
                    <p className="text-[10px] text-[#5F6C61]">{selectedCamp.description}</p>
                  </div>

                  {Object.keys(groupedByCurr).length === 0 ? (
                    <div className="text-center py-6 text-xs text-gray-400 font-semibold">
                      لا توجد أي مساهمات مؤكدة مسجلة في هذه الحملة حالياً. كن أول المبادرين!
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.keys(groupedByCurr).map(curr => {
                        const sum = groupedByCurr[curr].reduce((acc, cur) => acc + cur.amount, 0);
                        return (
                          <div key={curr} className="border border-[#E2DED0] rounded-2xl overflow-hidden bg-white">
                            <div className="bg-[#F4F1EA] px-3 py-2 border-b border-[#E2DED0] flex justify-between items-center text-xs">
                              <span className="font-bold text-[#3E4C41]">عملة: {curr}</span>
                              <span className="font-extrabold text-emerald-800 font-mono">الإجمالي: {sum.toLocaleString()} {curr}</span>
                            </div>
                            <div className="max-h-48 overflow-y-auto divide-y divide-gray-50">
                              {groupedByCurr[curr].map((rec, idx) => (
                                <div key={idx} className="p-2 flex justify-between items-center text-[11px] hover:bg-gray-50">
                                  <span className="font-bold text-[#2D3A30]">🌸 {rec.donorName}</span>
                                  <span className="font-bold text-[#4A5D4E] font-mono">{rec.amount.toLocaleString()} {rec.currency}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Campaign List */}
            <div className={`${(selectedCampaign || isAddingCampaign || editingCampaign) ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-4`}>
              <div className="flex justify-between items-center pb-1 border-b border-[#E2DED0]">
                <h3 className="text-sm font-bold text-[#2D3A30]">الفرص التنموية النشطة بالمحلات</h3>
              
              {(isSuperAdmin || isGeneralSupervisor || userRole === 'delegate' || currentUserDBRole === 'delegate' || userRole === 'supervisor' || currentUserDBRole === 'supervisor') && (
                <button
                  onClick={() => {
                    setSelectedCampaign(null);
                    setEditingCampaign(null);
                    setIsAddingCampaign(true);
                    setCampTitle('');
                    setCampDescription('');
                    setCampTarget('');
                    setCampCategory('أسر');
                    setCampIcon('🎁');
                    setCampCurrencies(['SAR']);
                    setCampDelegates('');
                    setCampAllowManager(true);
                  }}
                  className="bg-[#4A5D4E] hover:bg-[#3E4C41] text-[#FDFBF7] px-3.5 py-1.5 rounded-xl text-[11px] font-bold shadow-xs flex items-center gap-1 transition-all cursor-pointer border border-[#4A5D4E]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  إضافة حملة جديدة (بخصائص مخصصة)
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {campaigns.map((camp) => {
                const progressPercent = Math.min(100, Math.round((camp.raised / camp.target) * 100));
                const isSelected = selectedCampaign?.id === camp.id;

                return (
                  <div 
                    key={camp.id} 
                    className={`bg-white rounded-3xl border p-6 flex flex-col justify-between transition-all shadow-xs hover:shadow-md cursor-pointer ${
                      isSelected ? 'border-[#4A5D4E] ring-2 ring-[#4A5D4E]/10 bg-[#4A5D4E]/5' : 'border-[#E2DED0] hover:border-[#4A5D4E]/30'
                    }`}
                    onClick={() => handleSelectCampaign(camp)}
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl p-2 bg-[#FDFBF7] rounded-xl border border-[#E2DED0]">{camp.icon}</span>
                          <div>
                            <h4 className="font-bold text-xs text-[#2D3A30]">{camp.title}</h4>
                            <div className="flex flex-wrap gap-1 mt-1">
                              <span className="text-[9px] bg-[#F4F1EA] text-[#3E4C41] px-1.5 py-0.5 rounded border border-[#E2DED0]">
                                تصنيف: {camp.category}
                              </span>
                              {camp.currencies && camp.currencies.map(curr => (
                                <span key={curr} className="text-[9px] bg-emerald-50 text-emerald-800 px-1 py-0.5 rounded border border-emerald-200">
                                  {curr}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <p className="text-[11px] text-[#3E4C41] leading-relaxed line-clamp-3">
                        {camp.description}
                      </p>

                      {/* Display authorised status or limits */}
                      {hasManagementAccess && (
                        <div className="bg-[#F4F1EA]/50 p-2 rounded-xl border border-[#E2DED0]/70 text-[9px] text-[#5F6C61] space-y-1">
                          <div className="flex justify-between">
                            <span>السماح للمشرف بالتسجيل:</span>
                            <span className="font-bold">{camp.allowManagerRecord ? 'نعم' : 'لا'}</span>
                          </div>
                          {camp.allowedDelegates && camp.allowedDelegates.length > 0 && (
                            <div className="truncate">
                              <span>المندوبون المعتمدون:</span>{' '}
                              <span className="font-bold text-[#4A5D4E]">{camp.allowedDelegates.join(', ')}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Progress bar */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className="text-[#4A5D4E]">المجموع الفعلي: {camp.raised.toLocaleString()} {camp.targetCurrency || 'ر.س'}</span>
                          <span className="text-[#7A8B7E]">
                            الهدف: {camp.target > 0 ? `${camp.target.toLocaleString()} ${camp.targetCurrency || 'ر.س'}` : 'مفتوح (مساهمة مفتوحة)'}
                          </span>
                        </div>
                        <div className="w-full bg-[#E2DED0]/50 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-[#4A5D4E] h-full rounded-full transition-all duration-500" 
                            style={{ width: `${progressPercent}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-[#7A8B7E]">
                          <span>نسبة الاكتمال التقديرية</span>
                          <span className="font-mono font-bold text-[#4A5D4E]">{progressPercent}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#F4F1EA] flex justify-between items-center">
                      {hasManagementAccess ? (
                        <div className="flex gap-2 w-full justify-between items-center">
                          <div className="flex gap-1">
                            {isSuperAdmin && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedCampaign(null);
                                    setIsAddingCampaign(false);
                                    setEditingCampaign(camp);
                                    setCampTitle(camp.title);
                                    setCampDescription(camp.description);
                                    setCampTarget(camp.target > 0 ? camp.target.toString() : '');
                                    setCampTargetCurrency(camp.targetCurrency || 'SAR');
                                    setCampCategory(camp.category);
                                    setCampIcon(camp.icon);
                                    setCampCurrencies(camp.currencies || ['SAR']);
                                    setCampDelegates(camp.allowedDelegates ? camp.allowedDelegates.join(', ') : '');
                                    setCampAllowManager(camp.allowManagerRecord ?? true);
                                  }}
                                  className="bg-[#FDFBF7] hover:bg-amber-100 text-amber-700 px-2.5 py-1 rounded-lg text-[10px] font-extrabold border border-[#E2DED0] transition-all cursor-pointer"
                                >
                                  تعديل الخصائص
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm('هل أنت متأكد من حذف حملة التبرع هذه نهائياً؟')) {
                                      setCampaigns(prev => prev.filter(c => c.id !== camp.id));
                                      if (selectedCampaign?.id === camp.id) {
                                        setSelectedCampaign(null);
                                      }
                                    }
                                  }}
                                  className="bg-[#FDFBF7] hover:bg-red-50 text-red-600 px-2.5 py-1 rounded-lg text-[10px] font-extrabold border border-[#E2DED0] transition-all cursor-pointer"
                                >
                                  حذف
                                </button>
                              </>
                            )}
                          </div>
                          <span className="text-[10px] font-bold text-[#4A5D4E] flex items-center gap-1 hover:underline">
                            إدارة وتحصيل ←
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-[#4A5D4E] group-hover:underline flex items-center gap-1 w-full justify-end">
                          {canRecordForCampaign(camp) ? 'تسجيل مساهمة أو تبرع الآن ←' : 'عرض التفاصيل والمساهمة الآن ←'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Column Wrapped in Centered Modal Pop-up */}
          {(selectedCampaign || isAddingCampaign || editingCampaign) && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs text-right font-sans" dir="rtl" id="donation-campaign-modal">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="bg-[#FDFBF7] rounded-3xl border border-[#E2DED0] p-6 shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto relative space-y-6"
              >
                {/* Global Close Button */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCampaign(null);
                    setIsAddingCampaign(false);
                    setEditingCampaign(null);
                  }}
                  className="absolute left-4 top-4 p-1.5 rounded-xl hover:bg-gray-100 text-[#7A8B7E] hover:text-[#2D3A30] cursor-pointer transition-colors border border-gray-200/50"
                  title="إغلاق"
                >
                  <X className="w-4 h-4" />
                </button>

                {(isAddingCampaign || editingCampaign) ? (
                // Super Admin Campaign setup (With Multiple Currencies & Delegate permissions)
                <form onSubmit={handleSaveCampaignSubmit} className="space-y-4">
                  <div className="border-b border-[#F4F1EA] pb-3 mb-2 flex justify-between items-center">
                    <h3 className="font-bold text-[#2D3A30] text-xs flex items-center gap-1.5">
                      <Settings className="w-4 h-4 text-[#A98467]" />
                      {editingCampaign ? 'تعديل خصائص وتفويضات الحملة' : 'إنشاء حملة تبرع بخصائص مخصصة'}
                    </h3>
                    <button 
                      type="button"
                      onClick={() => {
                        setIsAddingCampaign(false);
                        setEditingCampaign(null);
                      }}
                      className="p-1 rounded-lg hover:bg-[#F4F1EA] text-[#7A8B7E] hover:text-[#2D3A30] cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-[#3E4C41] mb-1">اسم حملة التبرع</label>
                      <input
                        type="text"
                        value={campTitle}
                        onChange={(e) => setCampTitle(e.target.value)}
                        placeholder="مثال: ترميم البيوت الشعبية"
                        className="w-full px-3 py-2 rounded-xl border border-[#E2DED0] bg-white text-xs outline-none focus:ring-2 focus:ring-[#4A5D4E]/20 focus:border-[#4A5D4E]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#3E4C41] mb-1">وصف وأهداف الحملة بالتفصيل</label>
                      <textarea
                        value={campDescription}
                        onChange={(e) => setCampDescription(e.target.value)}
                        placeholder="اشرح الهدف بوضوح، الجهة والمنطقة المستهدفة من أسر المحلة..."
                        rows={3}
                        className="w-full px-3 py-2 rounded-xl border border-[#E2DED0] bg-white text-xs outline-none focus:ring-2 focus:ring-[#4A5D4E]/20 focus:border-[#4A5D4E] resize-none"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-[#3E4C41] mb-1">المبلغ المستهدف (اختياري)</label>
                        <input
                          type="number"
                          value={campTarget}
                          onChange={(e) => setCampTarget(e.target.value)}
                          placeholder="مثال: 30000"
                          className="w-full px-3 py-2 rounded-xl border border-[#E2DED0] bg-white text-xs outline-none focus:ring-2 focus:ring-[#4A5D4E]/20 focus:border-[#4A5D4E]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#3E4C41] mb-1">عملة الهدف</label>
                        <select
                          value={campTargetCurrency}
                          onChange={(e) => setCampTargetCurrency(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-[#E2DED0] bg-white text-xs outline-none focus:ring-2 focus:ring-[#4A5D4E]/20 focus:border-[#4A5D4E]"
                        >
                          <option value="SAR">🇸🇦 ريال سعودي</option>
                          <option value="YER_NEW">🇾🇪 ريال يمني جديد</option>
                          <option value="YER_OLD">🏛️ ريال يمني قديم</option>
                          <option value="USD">🇺🇸 دولار أمريكي</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#3E4C41] mb-1">رمز الحملة (أيقونة مميزة)</label>
                        <select
                          value={campIcon}
                          onChange={(e) => setCampIcon(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-[#E2DED0] bg-white text-xs outline-none focus:ring-2 focus:ring-[#4A5D4E]/20 focus:border-[#4A5D4E]"
                        >
                          <option value="🏠">🏠 منزل / سكن</option>
                          <option value="💊">💊 دواء / صحة</option>
                          <option value="🌳">🌳 بيئة / حدائق</option>
                          <option value="🎒">🎒 تعليم / مدرسة</option>
                          <option value="🎁">🎁 سلة غذائية</option>
                          <option value="💧">💧 ماء / آبار</option>
                          <option value="⚡">⚡ كهرباء / صيانة</option>
                        </select>
                      </div>
                    </div>

                    {/* Currencies Management Section */}
                    <div className="bg-[#FDFBF7] p-3 rounded-2xl border border-[#E2DED0] space-y-2">
                      <label className="block text-[10px] font-bold text-[#3E4C41] flex items-center gap-1">
                        <Coins className="w-3.5 h-3.5 text-amber-700" />
                        العملات المتعددة المقبولة للحملة
                      </label>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {Object.keys(CURRENCY_SYMBOLS).map((curr) => {
                          const isChecked = campCurrencies.includes(curr);
                          return (
                            <button
                              key={curr}
                              type="button"
                              onClick={() => handleToggleCurrency(curr)}
                              className={`px-3 py-1.5 text-[10px] font-black rounded-lg border transition-all ${
                                isChecked
                                  ? 'bg-amber-100 text-amber-950 border-amber-300 shadow-3xs'
                                  : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                              }`}
                            >
                              {curr} ({CURRENCY_SYMBOLS[curr]})
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-[9px] text-[#7A8B7E]">
                        سيتاح للمندوب والمتبرع تحديد قيمة تبرعهم وتوثيقها بأي من العملات المفعلة أعلاه.
                      </p>
                    </div>

                    {/* Delegate Permissions Section */}
                    <div className="bg-[#F4F1EA] p-3 rounded-2xl border border-[#E2DED0] space-y-2">
                      <label className="block text-[10px] font-bold text-[#3E4C41] flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-[#4A5D4E]" />
                        صلاحيات وتفويضات إدخال وحفظ البيانات
                      </label>

                      {/* Allow General Supervisor manager to input */}
                      <div className="flex items-center gap-2 py-1">
                        <input
                          type="checkbox"
                          id="allowManager"
                          checked={campAllowManager}
                          onChange={(e) => setCampAllowManager(e.target.checked)}
                          className="rounded border-[#E2DED0] text-[#4A5D4E] focus:ring-[#4A5D4E] w-3.5 h-3.5 cursor-pointer"
                        />
                        <label htmlFor="allowManager" className="text-[10px] font-bold text-[#2D3A30] cursor-pointer">
                          تمكين (المشرف العام) من إدخال وحفظ مساهمات هذه الحملة
                        </label>
                      </div>

                      {/* Custom sub-delegates list */}
                      <div>
                        <label className="block text-[9px] font-extrabold text-[#5F6C61] mb-1">
                          المندوبون الفرعيون المرخصون بالتسجيل (اكتب الأسماء/الإيميلات مفصولة بفاصلة ,):
                        </label>
                        <input
                          type="text"
                          value={campDelegates}
                          onChange={(e) => setCampDelegates(e.target.value)}
                          placeholder="مثال: ali, ahmed@domain.com, delegate3"
                          className="w-full px-2.5 py-1.5 rounded-xl border border-[#E2DED0] bg-white text-[10px] outline-none"
                        />
                        <p className="text-[9px] text-[#7A8B7E] mt-1 leading-normal">
                          سيتمكن هؤلاء المندوبون من تسجيل تبرعات يدوية واستلام مبالغ مباشرة نيابة عن المساهمين.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#4A5D4E] hover:bg-[#3E4C41] text-[#FDFBF7] py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    حفظ حملة التبرع المخصصة
                  </button>
                </form>
              ) : (
                // Normal view: Standard user Donation checkout or Delegate manual logger
                <div>
                  {/* Tabs between Standard donation / Delegate Logging if user is authorized */}
                  {canRecordForCampaign(selectedCampaign) && (
                    <div className="flex bg-[#F4F1EA] p-1 rounded-xl mb-4 border border-[#E2DED0]">
                      <button
                        type="button"
                        onClick={() => setIsManualRecording(false)}
                        className={`flex-1 py-1.5 text-[10px] font-extrabold rounded-lg transition-all ${
                          !isManualRecording 
                            ? 'bg-white text-[#2D3A30] shadow-2xs' 
                            : 'text-[#7A8B7E] hover:text-[#2D3A30]'
                        }`}
                      >
                        بوابة التبرع المباشر
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsManualRecording(true)}
                        className={`flex-1 py-1.5 text-[10px] font-extrabold rounded-lg transition-all ${
                          isManualRecording 
                            ? 'bg-white text-[#2D3A30] shadow-2xs' 
                            : 'text-[#7A8B7E] hover:text-[#2D3A30]'
                        }`}
                      >
                        تسجيل يدوي (صلاحية مندوب)
                      </button>
                    </div>
                  )}

                  {!isManualRecording ? (
                    // Standard checkout
                    !isSuccess ? (
                      <form onSubmit={handleDonationSubmit} className="space-y-4">
                        <div className="border-b border-[#F4F1EA] pb-3 mb-2 flex justify-between items-center">
                          <h3 className="font-bold text-[#2D3A30] text-sm flex items-center gap-1.5">
                            <Gift className="w-4 h-4 text-[#A98467]" />
                            استمارة المساهمة والتمكين
                          </h3>
                          <button 
                            type="button"
                            onClick={() => setSelectedCampaign(null)}
                            className="text-xs text-[#7A8B7E] hover:text-[#2D3A30] cursor-pointer"
                          >
                            إغلاق
                          </button>
                        </div>

                        <div className="bg-[#4A5D4E]/5 border border-[#4A5D4E]/10 p-3.5 rounded-2xl text-xs space-y-1 text-[#2D3A30]">
                          <span className="block font-bold text-[#4A5D4E] text-[10px]">الفرصة المختارة للتنمية:</span>
                          <span className="font-extrabold block text-xs">{selectedCampaign.title}</span>
                        </div>

                        {/* Contribution Type Selector */}
                        <div className="space-y-2">
                          <label className="block text-[11px] sm:text-xs font-bold text-[#3E4C41]">نوع التبرع والمساهمة</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setIsDonationInKind(false)}
                              className={`py-2 text-xs font-extrabold rounded-xl border transition-all ${
                                !isDonationInKind
                                  ? 'bg-[#4A5D4E] text-white border-[#4A5D4E] shadow-sm'
                                  : 'bg-white text-[#5F6C61] border-[#D1CAB8] hover:bg-gray-50'
                              }`}
                            >
                              🪙 تبرع مالي نقدي
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsDonationInKind(true)}
                              className={`py-2 text-xs font-extrabold rounded-xl border transition-all ${
                                isDonationInKind
                                  ? 'bg-[#4A5D4E] text-white border-[#4A5D4E] shadow-sm'
                                  : 'bg-white text-[#5F6C61] border-[#D1CAB8] hover:bg-gray-50'
                              }`}
                            >
                              🎁 تبرع عيني (مواد/خدمات)
                            </button>
                          </div>
                        </div>

                        {isDonationInKind ? (
                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold text-[#3E4C41]">وصف تفصيلي للتبرع العيني <span className="text-red-600">*</span></label>
                            <textarea
                              value={inkindDescription}
                              onChange={(e) => setInkindDescription(e.target.value)}
                              placeholder="مثال: سلة غذائية متكاملة، كسوة عيد، خدمة طبية، عقار، إلخ..."
                              rows={3}
                              className="w-full px-3 py-2 rounded-xl border border-[#E2DED0] text-xs text-[#2D3A30] bg-white outline-none focus:ring-2 focus:ring-[#4A5D4E]/20"
                              required={isDonationInKind}
                            />
                          </div>
                        ) : (
                          <>
                            {/* Preset Amounts */}
                            <div className="space-y-2">
                              <label className="block text-[11px] sm:text-xs font-bold text-[#3E4C41]">اختر قيمة المساهمة</label>
                              <div className="grid grid-cols-4 gap-2">
                                {['50', '100', '300', '500'].map((amt) => (
                                  <button
                                    key={amt}
                                    type="button"
                                    onClick={() => setDonationAmount(amt)}
                                    className={`py-2 text-xs font-extrabold rounded-xl border transition-all duration-150 ${
                                      donationAmount === amt
                                        ? 'bg-[#4A5D4E] text-[#FDFBF7] border-[#4A5D4E] shadow-md ring-2 ring-[#4A5D4E]/20 scale-102'
                                        : 'bg-white/95 text-[#5F6C61] border-[#D1CAB8] hover:text-[#2D3A30] hover:bg-[#E9F0E0]/30 shadow-3xs font-medium'
                                    }`}
                                  >
                                    {amt}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Custom Amount with Currency Selector (From allowed campaign currencies) */}
                            <div className="grid grid-cols-3 gap-2">
                              <div className="col-span-2 space-y-1">
                                <label className="block text-[10px] font-bold text-[#3E4C41]">مبلغ تبرع مخصص</label>
                                <input
                                  type="number"
                                  value={donationAmount}
                                  onChange={(e) => setDonationAmount(e.target.value)}
                                  placeholder="أدخل قيمة مخصصة"
                                  className="w-full px-3 py-1.5 rounded-xl border border-[#E2DED0] text-xs text-[#2D3A30] bg-white font-bold focus:ring-2 focus:ring-[#4A5D4E]/20 focus:border-[#4A5D4E] transition-all outline-none"
                                  min="10"
                                  required={!isDonationInKind}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-[#3E4C41]">العملة</label>
                                <select
                                  value={donationCurrency}
                                  onChange={(e) => setDonationCurrency(e.target.value)}
                                  className="w-full px-2 py-1.5 rounded-xl border border-[#E2DED0] text-xs bg-white text-[#2D3A30] focus:ring-2 focus:ring-[#4A5D4E]/20 outline-none font-bold"
                                >
                                  {(() => {
                                    const CURRENCY_ORDER = ['YER_NEW', 'YER_OLD', 'SAR'];
                                    const rawCurrencies = selectedCampaign.currencies || ['SAR'];
                                    const sorted = [...rawCurrencies].sort((a, b) => {
                                      const idxA = CURRENCY_ORDER.indexOf(a);
                                      const idxB = CURRENCY_ORDER.indexOf(b);
                                      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                                      if (idxA !== -1) return -1;
                                      if (idxB !== -1) return 1;
                                      return a.localeCompare(b);
                                    });
                                    return sorted.map(curr => (
                                      <option key={curr} value={curr}>{curr} ({CURRENCY_SYMBOLS[curr] || curr})</option>
                                    ));
                                  })()}
                                </select>
                              </div>
                            </div>
                          </>
                        )}

                        {/* Anonymous Checkbox */}
                        <div className="flex items-center gap-2 py-1">
                          <input
                            type="checkbox"
                            id="isAnonymous"
                            checked={isAnonymous}
                            onChange={(e) => setIsAnonymous(e.target.checked)}
                            className="rounded border-[#E2DED0] text-[#4A5D4E] focus:ring-[#4A5D4E] w-4 h-4 cursor-pointer"
                          />
                          <label htmlFor="isAnonymous" className="text-xs text-[#3E4C41] font-semibold cursor-pointer">
                            المساهمة كفاعل خير (فاعل خير مجهول)
                          </label>
                        </div>

                        {/* Donor Details */}
                        {!isAnonymous && (
                          <div className="space-y-3 pt-1 border-t border-[#F4F1EA]">
                            <div>
                              <label className="block text-[10px] font-bold text-[#3E4C41] mb-1">اسم المتبرع الكريم</label>
                              <input
                                type="text"
                                value={donorName}
                                onChange={(e) => setDonorName(e.target.value)}
                                placeholder="الاسم الثلاثي أو الكنية"
                                className="w-full px-3 py-1.5 rounded-xl border border-[#E2DED0] text-xs text-[#2D3A30] bg-white focus:ring-2 focus:ring-[#4A5D4E]/20 focus:border-[#4A5D4E] transition-all outline-none"
                                required={!isAnonymous}
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-[#3E4C41] mb-1">رقم الجوال للتواصل والدعاء</label>
                              <input
                                type="tel"
                                value={donorPhone}
                                onChange={(e) => setDonorPhone(e.target.value)}
                                placeholder="05XXXXXXXX"
                                className="w-full px-3 py-1.5 rounded-xl border border-[#E2DED0] text-xs text-[#2D3A30] bg-white text-left font-mono focus:ring-2 focus:ring-[#4A5D4E]/20 focus:border-[#4A5D4E] transition-all outline-none"
                                required={!isAnonymous}
                              />
                            </div>
                          </div>
                        )}

                        {/* Payment Methods */}
                        <div className="space-y-2 pt-2 border-t border-[#F4F1EA]">
                          <label className="block text-[11px] sm:text-xs font-bold text-[#3E4C41]">طريقة السداد الآمنة</label>
                          <div className="grid grid-cols-3 gap-2">
                            <button
                              type="button"
                              onClick={() => setPaymentMethod('mada')}
                              className={`py-2 rounded-xl border text-[11px] sm:text-xs font-extrabold flex flex-col items-center justify-center gap-1 transition-all ${
                                paymentMethod === 'mada'
                                  ? 'border-[#4A5D4E] bg-[#4A5D4E]/5 text-[#4A5D4E] shadow-xs'
                                  : 'bg-white text-[#5F6C61] border-[#D1CAB8]'
                              }`}
                            >
                              <span>💳</span>
                              مدى
                            </button>
                            <button
                              type="button"
                              onClick={() => setPaymentMethod('visa')}
                              className={`py-2 rounded-xl border text-[11px] sm:text-xs font-extrabold flex flex-col items-center justify-center gap-1 transition-all ${
                                paymentMethod === 'visa'
                                  ? 'border-[#4A5D4E] bg-[#4A5D4E]/5 text-[#4A5D4E] shadow-xs'
                                  : 'bg-white text-[#5F6C61] border-[#D1CAB8]'
                              }`}
                            >
                              <span>🎫</span>
                              فيزا / ماستر
                            </button>
                            <button
                              type="button"
                              onClick={() => setPaymentMethod('applepay')}
                              className={`py-2 rounded-xl border text-[11px] sm:text-xs font-extrabold flex flex-col items-center justify-center gap-1 transition-all ${
                                paymentMethod === 'applepay'
                                  ? 'border-[#4A5D4E] bg-[#4A5D4E]/5 text-[#4A5D4E] shadow-xs'
                                  : 'bg-white text-[#5F6C61] border-[#D1CAB8]'
                              }`}
                            >
                              <span>🍏</span>
                              Apple Pay
                            </button>
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-[#A98467] hover:bg-[#8F6C50] text-[#FDFBF7] py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-4"
                        >
                          <Heart className="w-4 h-4 fill-white" />
                          إتمام المساهمة بقيمة {parseFloat(donationAmount) || 0} {donationCurrency}
                        </button>
                      </form>
                    ) : (
                      /* Success Screen */
                      <div className="text-center py-8 px-4 space-y-4">
                        <div className="w-16 h-16 rounded-full bg-[#E9F0E0] border border-[#DDE5B6] text-[#4A5D4E] flex items-center justify-center mx-auto shadow-sm">
                          <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-bold text-[#2D3A30] text-base">تقبل الله طاعتكم ومساهمتكم!</h4>
                          <p className="text-xs text-[#3E4C41] leading-relaxed">
                            تم استلام مساهمتك الكريمة بقيمة <strong className="text-[#4A5D4E] text-sm">{lastDonation?.amount} {lastDonation?.currency}</strong> لـ <strong>{selectedCampaign.title}</strong> بنجاح.
                          </p>
                          <p className="text-[10px] text-[#7A8B7E]">
                            مساهمتكم تصنع فارقاً حقيقياً وتدعم التنمية المستدامة والترابط الإنساني لأسر المحلة.
                          </p>
                        </div>
                        <button
                          onClick={handleResetForm}
                          className="bg-[#4A5D4E] hover:bg-[#3E4C41] text-[#FDFBF7] px-5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                        >
                          العودة للفرص والمساهمات
                        </button>
                      </div>
                    )
                  ) : (
                    // Manual Record by authorized sub-delegate/supervisor
                    <form onSubmit={handleManualRecordSubmit} className="space-y-4">
                      <div className="border-b border-[#F4F1EA] pb-3 mb-2 flex justify-between items-center">
                        <h3 className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5" />
                          قيد مساهمة يدوية (نيابة عن متبرع)
                        </h3>
                        <button 
                          type="button"
                          onClick={() => setSelectedCampaign(null)}
                          className="text-xs text-[#7A8B7E] cursor-pointer"
                        >
                          إغلاق
                        </button>
                      </div>

                      <div className="bg-amber-50/50 border border-amber-200 p-3 rounded-2xl text-[10px] space-y-1 text-amber-950">
                        <span className="font-bold">حالة التفويض:</span> مرخص لك بتسجيل التبرعات والقيود لهذه الحملة وحفظها مباشرة نيابة عن المساهمين.
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-[10px] font-bold text-[#3E4C41] mb-1">اسم الحملة المستهدفة</label>
                          <input
                            type="text"
                            value={selectedCampaign.title}
                            disabled
                            className="w-full px-3 py-1.5 rounded-xl border border-[#E2DED0] text-xs text-[#5F6C61] bg-gray-50 outline-none font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-[#3E4C41] mb-1">👤 اسم المندوب المعتمد (اختر من القائمة)</label>
                          <select
                            value={manualDelegate}
                            onChange={(e) => setManualDelegate(e.target.value)}
                            disabled={!hasManagementAccess}
                            className={`w-full px-3 py-1.5 rounded-xl border border-[#E2DED0] text-xs font-bold text-[#2D3A30] outline-none focus:ring-2 focus:ring-[#4A5D4E]/20 focus:border-[#4A5D4E] ${!hasManagementAccess ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white'}`}
                          >
                            {allDelegates.map((del) => {
                              const formatted = `[${del.name} (جوال: ${del.phone})]`;
                              return (
                                <option key={del.email} value={formatted}>
                                  👤 {formatted}
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-[#3E4C41] mb-1">اسم المتبرع الكريم</label>
                          <input
                            type="text"
                            value={manualDonorName}
                            onChange={(e) => setManualDonorName(e.target.value)}
                            placeholder="فاعل خير"
                            className="w-full px-3 py-1.5 rounded-xl border border-[#E2DED0] text-xs text-[#2D3A30] bg-white outline-none"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-[#3E4C41] mb-1">رقم جوال المتبرع (اختياري)</label>
                          <input
                            type="tel"
                            value={manualDonorPhone}
                            onChange={(e) => setManualDonorPhone(e.target.value)}
                            placeholder="05XXXXXXXX"
                            className="w-full px-3 py-1.5 rounded-xl border border-[#E2DED0] text-xs text-left font-mono outline-none"
                          />
                        </div>

                        {/* Contribution Type Selector for Delegate */}
                        <div className="space-y-2">
                          <label className="block text-[11px] sm:text-xs font-bold text-[#3E4C41]">نوع التبرع والمساهمة (المندوب)</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setManualIsDonationInKind(false)}
                              className={`py-2 text-xs font-extrabold rounded-xl border transition-all ${
                                !manualIsDonationInKind
                                  ? 'bg-[#4A5D4E] text-white border-[#4A5D4E] shadow-sm'
                                  : 'bg-white text-[#5F6C61] border-[#D1CAB8] hover:bg-gray-50'
                              }`}
                            >
                              🪙 تبرع مالي نقدي
                            </button>
                            <button
                              type="button"
                              onClick={() => setManualIsDonationInKind(true)}
                              className={`py-2 text-xs font-extrabold rounded-xl border transition-all ${
                                manualIsDonationInKind
                                  ? 'bg-[#4A5D4E] text-white border-[#4A5D4E] shadow-sm'
                                  : 'bg-white text-[#5F6C61] border-[#D1CAB8] hover:bg-gray-50'
                              }`}
                            >
                              🎁 تبرع عيني (مواد/خدمات)
                            </button>
                          </div>
                        </div>

                        {manualIsDonationInKind ? (
                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold text-[#3E4C41]">وصف تفصيلي للتبرع العيني <span className="text-red-600">*</span></label>
                            <textarea
                              value={manualInkindDescription}
                              onChange={(e) => setManualInkindDescription(e.target.value)}
                              placeholder="مثال: سلة غذائية متكاملة، كسوة عيد، خدمة طبية، عقار، إلخ..."
                              rows={3}
                              className="w-full px-3 py-2 rounded-xl border border-[#E2DED0] text-xs text-[#2D3A30] bg-white outline-none focus:ring-2 focus:ring-[#4A5D4E]/20"
                              required={manualIsDonationInKind}
                            />
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-2">
                            <div className="col-span-2">
                              <label className="block text-[10px] font-bold text-[#3E4C41] mb-1">المبلغ المقبوض</label>
                              <input
                                type="number"
                                value={manualAmount}
                                onChange={(e) => setManualAmount(e.target.value)}
                                placeholder="مثال: 500"
                                className="w-full px-3 py-1.5 rounded-xl border border-[#E2DED0] text-xs text-[#2D3A30] font-bold outline-none"
                                required={!manualIsDonationInKind}
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-[#3E4C41] mb-1">العملة</label>
                              <select
                                value={manualCurrency}
                                onChange={(e) => setManualCurrency(e.target.value)}
                                className="w-full px-2 py-1.5 rounded-xl border border-[#E2DED0] text-xs bg-white text-[#2D3A30] outline-none font-bold"
                              >
                                {(() => {
                                  const CURRENCY_ORDER = ['YER_NEW', 'YER_OLD', 'SAR'];
                                  const rawCurrencies = selectedCampaign.currencies || ['SAR'];
                                  const sorted = [...rawCurrencies].sort((a, b) => {
                                    const idxA = CURRENCY_ORDER.indexOf(a);
                                    const idxB = CURRENCY_ORDER.indexOf(b);
                                    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                                    if (idxA !== -1) return -1;
                                    if (idxB !== -1) return 1;
                                    return a.localeCompare(b);
                                  });
                                  return sorted.map(curr => (
                                    <option key={curr} value={curr}>{curr}</option>
                                  ));
                                })()}
                              </select>
                            </div>
                          </div>
                        )}

                        <div>
                          <label className="block text-[10px] font-bold text-[#3E4C41] mb-1">طريقة تسليم المبلغ</label>
                          <select
                            value={manualMethod}
                            onChange={(e) => setManualMethod(e.target.value as any)}
                            className="w-full px-3 py-1.5 rounded-xl border border-[#E2DED0] text-xs bg-white text-[#2D3A30] outline-none"
                          >
                            <option value="cash">💵 كاش (تسليم نقدي)</option>
                            <option value="transfer">🏦 تحويل بنكي مباشر</option>
                            <option value="mada">💳 مدى (شبكة)</option>
                            <option value="visa">🎫 فيزا/ماستر</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-[#3E4C41] mb-1">ملاحظات / مستند الاستلام</label>
                          <textarea
                            value={manualNotes}
                            onChange={(e) => setManualNotes(e.target.value)}
                            placeholder="أدخل أي تفاصيل إضافية عن الاستلام أو مرجع الحوالة..."
                            rows={2}
                            className="w-full px-3 py-1.5 rounded-xl border border-[#E2DED0] text-xs outline-none resize-none"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-[#4A5D4E] hover:bg-[#3E4C41] text-white py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1 cursor-pointer mt-4"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        حفظ واعتماد التبرع كقيد فوري
                      </button>
                    </form>
                  )}
                </div>
              )}
              </motion.div>
            </div>
          )}
        </div>
      </div>
    )}

      {/* Donation Records Tab (Manager & Supervisor access only) */}
      {hasManagementAccess && activeSubTab === 'records' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-[#E2DED0] p-6 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#F4F1EA] pb-4 mb-4">
              <div>
                <h3 className="text-sm font-bold text-[#2D3A30]">سجل القيود الإحصائي والتحكم بالتسجيلات</h3>
                <p className="text-[11px] text-[#7A8B7E] mt-0.5">
                  إدارة شاملة لجميع المساهمات المالية المحققة. يحتفظ (المدير العام) بصلاحيات تعديل أو حذف القيود بالكامل.
                </p>
              </div>

              {/* Filtering Controls */}
              <div className="flex flex-col gap-3 text-xs w-full">
                <div className="flex flex-wrap gap-2 items-center">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 text-gray-400 absolute right-3 top-2.5" />
                    <input
                      type="text"
                      value={recordsSearchQuery}
                      onChange={(e) => setRecordsSearchQuery(e.target.value)}
                      placeholder="ابحث بالمتبرع، الجوال أو الحملة..."
                      className="pl-3 pr-9 py-1.5 rounded-xl border border-[#E2DED0] text-xs outline-none w-full"
                    />
                  </div>

                  <select
                    value={recordsFilterCampaign}
                    onChange={(e) => setRecordsFilterCampaign(e.target.value)}
                    className="px-2 py-1.5 rounded-xl border border-[#E2DED0] text-xs bg-white font-semibold text-[#3E4C41]"
                  >
                    <option value="all">كل الحملات 🎯</option>
                    {campaigns.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>

                  <select
                    value={recordsFilterStatus}
                    onChange={(e) => setRecordsFilterStatus(e.target.value)}
                    className="px-2 py-1.5 rounded-xl border border-[#E2DED0] text-xs bg-white font-semibold text-[#3E4C41]"
                  >
                    <option value="all">كل الحالات 📝</option>
                    <option value="مقبول">مقبول ✅</option>
                    <option value="قيد الانتظار">قيد الانتظار ⏳</option>
                    <option value="مرفوض">مرفوض ❌</option>
                  </select>

                  <select
                    value={recordsFilterCurrency}
                    onChange={(e) => setRecordsFilterCurrency(e.target.value)}
                    className="px-2 py-1.5 rounded-xl border border-[#E2DED0] text-xs bg-white font-semibold text-[#3E4C41]"
                  >
                    <option value="all">كل العملات 💱</option>
                    <option value="SAR">ريال سعودي 🇸🇦</option>
                    <option value="USD">دولار أمريكي 🇺🇸</option>
                    <option value="YER_NEW">يمني جديد 🇾🇪🆕</option>
                    <option value="YER_OLD">يمني قديم 🇾🇪🏛️</option>
                    <option value="KIND">تبرع عيني 🎁</option>
                  </select>

                  <button
                    onClick={handleExportCSV}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center gap-1"
                  >
                    تصدير CSV 📊
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="bg-[#4A5D4E] hover:bg-[#3E4C41] text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center gap-1"
                  >
                    طباعة / PDF 🖨️
                  </button>
                </div>
              </div>
            </div>

            {/* Table of Records */}
            <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-[#FDFBF7]">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#F4F1EA] text-[#3E4C41] font-bold border-b border-[#E2DED0]">
                  <tr>
                    <th className="p-3">اسم المتبرع</th>
                    <th className="p-3">الحملة</th>
                    <th className="p-3">المبلغ والعملة</th>
                    <th className="p-3">رقم الجوال</th>
                    <th className="p-3">تاريخ القيد</th>
                    <th className="p-3">بواسطة</th>
                    <th className="p-3">الحالة</th>
                    <th className="p-3">ملاحظات</th>
                    {hasManagementAccess && <th className="p-3 text-center">التحكم</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={hasManagementAccess ? 9 : 8} className="p-8 text-center text-gray-400 font-bold">
                        ⚠️ لا توجد قيود تبرعات مطابقة لخيارات الفرز الحالية.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((rec) => (
                      <tr key={rec.id} className="hover:bg-gray-50/50">
                        <td className="p-3 font-bold text-gray-900">{rec.donorName}</td>
                        <td className="p-3 text-gray-500">{rec.campaignTitle}</td>
                        <td className="p-3 font-mono font-bold text-emerald-800">
                          {rec.currency === 'KIND' ? 'تبرع عيني' : `${rec.amount.toLocaleString()} ${rec.currency}`}
                        </td>
                        <td className="p-3 font-mono text-gray-500">{rec.donorPhone || '—'}</td>
                        <td className="p-3 font-mono text-gray-400 text-[10px]">{rec.date}</td>
                        <td className="p-3 text-gray-500 text-[10px] truncate max-w-[100px]" title={rec.recordedBy}>{rec.recordedBy}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            rec.status === 'مقبول' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            rec.status === 'قيد الانتظار' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            {rec.status}
                          </span>
                        </td>
                        <td className="p-3 text-gray-500 text-[10px] max-w-[150px] truncate" title={rec.notes}>{rec.notes || '—'}</td>
                        {hasManagementAccess && (
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <select
                                value={rec.status}
                                onChange={(e) => handleSetRecordStatus(rec.id, e.target.value)}
                                className="text-[10px] bg-white border border-gray-200 rounded p-0.5 font-bold cursor-pointer outline-none text-[#2D3A30]"
                              >
                                <option value="مقبول">مقبول</option>
                                <option value="قيد الانتظار">انتظار</option>
                                <option value="مرفوض">مرفوض</option>
                              </select>
                              <button
                                onClick={() => setEditingRecord(rec)}
                                className="text-blue-600 hover:text-blue-800 text-[10px] font-black cursor-pointer bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded"
                                title="تعديل القيد المالي"
                              >
                                تعديل
                              </button>
                              <button
                                onClick={() => handleDeleteRecord(rec.id)}
                                className="text-red-600 hover:text-red-800 text-[10px] font-black cursor-pointer bg-red-50 border border-red-100 px-1.5 py-0.5 rounded"
                                title="حذف القيد المالي"
                              >
                                حذف
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Edit Record Modal */}
            {editingRecord && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-55 animate-fade-in text-right" dir="rtl">
                <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-gray-200 shadow-xl">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2.5">
                    <h4 className="text-sm font-black text-gray-900">✏️ تعديل بيانات قيد التبرع</h4>
                    <button onClick={() => setEditingRecord(null)} className="text-gray-400 hover:text-gray-600">✖️</button>
                  </div>
                  <form onSubmit={handleUpdateRecordSubmit} className="space-y-3 text-xs">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">اسم المتبرع:</label>
                      <input
                        type="text"
                        value={editingRecord.donorName}
                        onChange={(e) => setEditingRecord({ ...editingRecord, donorName: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl border border-gray-300 outline-none focus:ring-1 focus:ring-emerald-700"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">المبلغ:</label>
                        <input
                          type="number"
                          value={editingRecord.amount}
                          onChange={(e) => setEditingRecord({ ...editingRecord, amount: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-1.5 rounded-xl border border-gray-300 outline-none focus:ring-1 focus:ring-emerald-700"
                          min="0"
                          required
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">العملة:</label>
                        <select
                          value={editingRecord.currency}
                          onChange={(e) => setEditingRecord({ ...editingRecord, currency: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-xl border border-gray-300 bg-white outline-none"
                        >
                          <option value="SAR">ريال سعودي 🇸🇦</option>
                          <option value="USD">دولار أمريكي 🇺🇸</option>
                          <option value="YER_NEW">يمني جديد 🇾🇪🆕</option>
                          <option value="YER_OLD">يمني قديم 🇾🇪🏛️</option>
                          <option value="KIND">تبرع عيني 🎁</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">رقم الجوال:</label>
                      <input
                        type="text"
                        value={editingRecord.donorPhone}
                        onChange={(e) => setEditingRecord({ ...editingRecord, donorPhone: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl border border-gray-300 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">ملاحظات / البيان:</label>
                      <textarea
                        value={editingRecord.notes || ''}
                        onChange={(e) => setEditingRecord({ ...editingRecord, notes: e.target.value })}
                        rows={3}
                        className="w-full p-2 rounded-xl border border-gray-300 outline-none focus:ring-1 focus:ring-emerald-700"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => setEditingRecord(null)}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100"
                      >
                        إلغاء
                      </button>
                      <button
                        type="submit"
                        className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-1.5 rounded-lg font-bold shadow-sm"
                      >
                        حفظ التعديلات ✅
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {isSuperAdmin && activeSubTab === 'import' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-[#E2DED0] p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-sm font-bold text-[#2D3A30] flex items-center gap-1.5">
                <Database className="w-5 h-5 text-[#A98467]" />
                منظومة جلب ورفع قيود التبرعات الخارجية الموحدة
              </h3>
              <p className="text-xs text-[#7A8B7E] mt-0.5">
                يرجى اختيار أحد مسارات الاستيراد الثلاثة المتاحة أدناه، ثم الضغط على زر "بدء المعالجة والاستيراد" للتحليل والتدقيق المالي قبل الحفظ النهائي.
              </p>
            </div>

            {/* Consolidated 3 Clear Options Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Option 1: Device File Upload */}
              <div className="border border-[#E2DED0] rounded-2xl p-5 bg-[#FDFBF7] space-y-4 flex flex-col justify-between shadow-sm relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="space-y-3 relative z-10">
                  <h4 className="text-xs font-black text-emerald-950 flex items-center gap-1.5 border-b border-emerald-100 pb-2">
                    <span className="text-lg">💻</span>
                    رفع كشوفات من الجهاز
                  </h4>
                  <p className="text-[11px] text-[#5F6C61] leading-relaxed font-semibold">
                    اختيار ملف مالي واحد أو عدة ملفات من جهازك بصيغ <strong className="font-mono text-emerald-700">CSV, XLSX, XLS, JSON, TXT</strong> لدمجها ومعالجتها دفعة واحدة.
                  </p>
                </div>
                <div className="pt-4 relative z-10 space-y-3">
                  <input
                    id="import-file-picker-prominent"
                    ref={fileInputRef2}
                    type="file"
                    accept=".csv, .xlsx, .xls, .json, .txt"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef2.current?.click()}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-3 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 group-hover:-translate-y-0.5"
                  >
                    <span className="text-base">📂</span>
                    <span>إضافة كشف مالي من الجهاز</span>
                  </button>
                </div>
              </div>

              {/* Option 2: Google Sheets URL / Drive Picker */}
              <div className="border border-[#E2DED0] rounded-2xl p-5 bg-[#FDFBF7] space-y-4 flex flex-col justify-between shadow-sm relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="space-y-3 relative z-10">
                  <h4 className="text-xs font-black text-amber-950 flex items-center gap-1.5 border-b border-amber-100 pb-2">
                    <span className="text-lg">🔗</span>
                    استيراد عبر Google Drive / Sheets
                  </h4>
                  <p className="text-[11px] text-[#5F6C61] leading-relaxed font-semibold">
                    استيراد مباشر من حسابك السحابي أو إدخال رابط جدول بيانات <strong>Google Sheets</strong> عام.
                  </p>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="رابط جدول Google Sheets..."
                      value={importGoogleSheetUrl || ''}
                      onChange={(e) => setImportGoogleSheetUrl(e.target.value)}
                      className="flex-1 bg-white border border-[#E2DED0] rounded-lg px-2.5 py-1.5 text-[10px] text-[#2D3A30] focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 font-mono"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={handleConfirmGoogleSheetUrl}
                      className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap cursor-pointer shadow-sm"
                    >
                      تأكيد
                    </button>
                  </div>
                </div>
                <div className="pt-2 relative z-10">
                  <button
                    onClick={handleOpenGooglePicker}
                    className="w-full bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer group-hover:-translate-y-0.5"
                    id="btn-google-drive-picker"
                  >
                    <span className="text-sm">📁</span>
                    <span>اختيار من Drive مباشرة</span>
                  </button>
                </div>
              </div>

              {/* Option 3: Deep Links & Manual Paste */}
              <div className="border border-[#E2DED0] rounded-2xl p-5 bg-[#FDFBF7] space-y-4 flex flex-col shadow-sm relative overflow-hidden group">
                 <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                 <div className="space-y-3 relative z-10 flex-1">
                   <h4 className="text-xs font-black text-blue-950 flex items-center gap-1.5 border-b border-blue-100 pb-2">
                     <span className="text-lg">⚡</span>
                     روابط مباشرة وإدخال يدوي
                   </h4>
                   
                   <div className="grid grid-cols-3 gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => openGoogleApp('sheets')}
                        className="flex flex-col items-center gap-1.5 p-2 bg-emerald-50/80 hover:bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                        title="فتح Google Sheets"
                      >
                        <span className="text-sm">📊</span>
                        <span className="text-[9px] font-bold">Sheets</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => openGoogleApp('drive')}
                        className="flex flex-col items-center gap-1.5 p-2 bg-amber-50/80 hover:bg-amber-100 text-amber-800 rounded-lg border border-amber-200 transition-colors cursor-pointer"
                        title="فتح Google Drive"
                      >
                        <span className="text-sm">📁</span>
                        <span className="text-[9px] font-bold">Drive</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => openGoogleApp('docs')}
                        className="flex flex-col items-center gap-1.5 p-2 bg-blue-50/80 hover:bg-blue-100 text-blue-800 rounded-lg border border-blue-200 transition-colors cursor-pointer"
                        title="فتح Google Docs"
                      >
                        <span className="text-sm">📝</span>
                        <span className="text-[9px] font-bold">Docs</span>
                      </button>
                   </div>
                 </div>
                 
                 <div className="pt-2 relative z-10">
                  <button
                    onClick={() => setShowManualPaste(!showManualPaste)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 group-hover:-translate-y-0.5 shadow-md"
                  >
                    <span>{showManualPaste ? '✖️ إخفاء' : '📋 إدخال أو لصق الكشف يدوياً'}</span>
                  </button>
                 </div>
              </div>
            </div>

            {/* Manual Paste Section */}
            {showManualPaste && (
              <div className="bg-white border-2 border-blue-100 rounded-2xl p-5 shadow-sm animate-fade-in relative overflow-hidden">
                <div className="absolute top-0 right-0 w-2 h-full bg-blue-500"></div>
                <label className="block text-xs font-black text-blue-950 mb-3 flex items-center gap-2">
                  <span className="text-lg">📋</span>
                  انسخ بيانات الجدول والصقها هنا:
                </label>
                <textarea
                  value={manualPasteContent}
                  onChange={(e) => setManualPasteContent(e.target.value)}
                  placeholder="donorName, amount, currency, donorPhone, notes
محمد أحمد, 5000, YER_NEW, 777123456, مساهمة عينية
فاعل خير, 100, SAR, , دعم الأسر"
                  rows={5}
                  className="w-full p-3 bg-[#FDFBF7] border border-[#E2DED0] rounded-xl text-xs font-mono text-[#2D3A30] outline-none focus:ring-2 focus:ring-blue-500/50 resize-y"
                  dir="ltr"
                />
                <div className="flex justify-end gap-3 mt-3">
                  <button
                    onClick={() => {
                      if (!manualPasteContent.trim()) {
                        alert('الرجاء إدخال بيانات الكشف أولاً.');
                        return;
                      }
                      setImportSource('paste');
                      const trimmed = manualPasteContent.trim();
                      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
                        validateAndParseData(trimmed, 'json');
                      } else {
                        validateAndParseData(trimmed, 'csv');
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md flex items-center gap-2"
                  >
                    <span>بدء المعالجة ⚡</span>
                  </button>
                </div>
              </div>
            )}

            {/* Validation Error Protection System Alert */}
            {validationError && (
              <div className="bg-red-50 border border-red-300 text-red-900 rounded-2xl p-4 flex gap-3 items-start shadow-2xs animate-fade-in">
                <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-black">⚠️ تم إيقاف عملية الاستيراد لمنع تلوث قاعدة البيانات!</h4>
                  <p className="text-[11px] leading-relaxed text-red-950 font-semibold">
                    اكتشف نظام الحماية الذكي خطأً هيكلياً في بنية الملف أو السجلات المرفوعة:
                  </p>
                  <p className="text-[11px] bg-red-100/50 p-2 rounded-xl border border-red-200 font-mono font-bold text-red-800 mt-1">
                    {validationError}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => setValidationError(null)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all"
                    >
                      تجاهل وإخفاء الخطأ ✖️
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Confirmation & Save System Multi-Step Wizard (نافذة التأكيد الإجبارية لاسم الحملة) */}
            {isConfirmingImport && uploadedRecords.length > 0 && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in text-right" dir="rtl">
                <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl border-2 border-amber-500/30">
                  
                  {/* Modal Header */}
                  <div className="flex justify-between items-start border-b border-amber-100 pb-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 bg-amber-50 rounded-2xl border border-amber-200">
                        <Database className="w-6 h-6 text-amber-700" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-amber-950">📋 معالج استيراد الكشوفات والأرشيف المالي التاريخي</h4>
                        <p className="text-xs text-amber-800 mt-1 font-semibold">
                          يرجى إكمال خطوات ترحيل وتأكيد الكشف لتنظيمه بشكل دقيق داخل النظام.
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setUploadedRecords([]);
                        setIsConfirmingImport(false);
                        setImportCustomCampName('');
                        setImportSelectedCampId('');
                        setImportWizardStep(1);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                        if (fileInputRef2.current) fileInputRef2.current.value = '';
                      }}
                      className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Wizard Progress Bar */}
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ${importWizardStep === 1 ? 'bg-amber-600 text-white shadow-xs scale-105' : 'bg-gray-100 text-gray-500'}`}>١</div>
                      <span className={`text-[11px] font-bold ${importWizardStep === 1 ? 'text-amber-950' : 'text-gray-400'}`}>تأكيد الرفع وموقع الاستيراد</span>
                    </div>
                    <div className="h-[2px] bg-gray-200 flex-1 mx-2"></div>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ${importWizardStep === 2 ? 'bg-amber-600 text-white shadow-xs scale-105' : 'bg-gray-100 text-gray-500'}`}>٢</div>
                      <span className={`text-[11px] font-bold ${importWizardStep === 2 ? 'text-amber-950' : 'text-gray-400'}`}>تأكيد خيارات الحملة والدمج</span>
                    </div>
                    <div className="h-[2px] bg-gray-200 flex-1 mx-2"></div>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ${importWizardStep === 3 ? 'bg-amber-600 text-white shadow-xs scale-105' : 'bg-gray-100 text-gray-500'}`}>٣</div>
                      <span className={`text-[11px] font-bold ${importWizardStep === 3 ? 'text-amber-950' : 'text-gray-400'}`}>اعتماد الحفظ النهائي</span>
                    </div>
                  </div>

                  {/* Step 1: Campaign details and merge mode selection (The first popup request) */}
                  {importWizardStep === 1 && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="bg-amber-50/40 p-3 rounded-2xl border border-amber-100/50 flex items-start gap-2.5">
                        <span className="text-base">🎯</span>
                        <div>
                          <h5 className="text-xs font-bold text-amber-950">الخطوة الأولى: تحديد موقع وخيارات الاستيراد</h5>
                          <p className="text-[10px] text-amber-800 mt-0.5 font-medium leading-relaxed">
                            أوقفت المنظومة المعالجة التلقائية؛ يرجى الآن تحديد وجهة ترحيل الكشف المالي: يمكنك ربط قيود التبرعات بحملة جارية مسجلة أو إنشاء حملة أرشيفية مخصصة جديدة.
                          </p>
                        </div>
                      </div>

                      {/* Campaign Mapping Options */}
                      <div className="space-y-4 bg-amber-50/25 p-4 rounded-2xl border border-amber-200/50">
                        <h5 className="text-xs font-bold text-amber-950">🎯 خيارات تعيين الحملة التاريخية</h5>
                        
                        <div className="flex flex-col sm:flex-row gap-4 text-xs font-bold text-amber-900">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input 
                              type="radio" 
                              name="importCampType" 
                              checked={importCampType === 'existing'} 
                              onChange={() => setImportCampType('existing')}
                              className="accent-amber-700"
                            />
                            ربط بحملة جارية مسجلة بالنظام
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input 
                              type="radio" 
                              name="importCampType" 
                              checked={importCampType === 'custom'} 
                              onChange={() => setImportCampType('custom')}
                              className="accent-amber-700"
                            />
                            إنشاء وتسمية حملة أرشيفية مخصصة جديدة
                          </label>
                        </div>

                        {/* Conditional Input Rendering */}
                        {importCampType === 'existing' ? (
                          <div className="space-y-1 pt-1">
                            <label className="block text-[10px] font-extrabold text-amber-900">اختر الحملة النشطة المسجلة بالمنظومة:</label>
                            <select
                              value={importSelectedCampId}
                              onChange={(e) => setImportSelectedCampId(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-amber-200 bg-white text-xs font-bold text-[#2D3A30] outline-none focus:ring-1 focus:ring-amber-500"
                            >
                              <option value="">-- يرجى اختيار حملة مسجلة من القائمة --</option>
                              {campaigns.map(c => (
                                <option key={c.id} value={c.id}>{c.title}</option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <div className="space-y-1 pt-1">
                            <label className="block text-[10px] font-extrabold text-amber-900">اسم الحملة الأرشيفية القديمة المخصص:</label>
                            <input
                              type="text"
                              value={importCustomCampName}
                              onChange={(e) => setImportCustomCampName(e.target.value)}
                              placeholder="أدخل اسماً مخصصاً للحملة التاريخية (مثال: حملة الرمضاء للعام 1443هـ)..."
                              className="w-full px-3 py-2 rounded-xl border border-amber-200 bg-white text-xs font-bold text-[#2D3A30] outline-none focus:ring-1 focus:ring-amber-500"
                            />
                          </div>
                        )}

                        {/* Duplicate handling setting */}
                        <div className="space-y-1 border-t border-amber-200/50 pt-3">
                          <label className="block text-[11px] font-extrabold text-amber-950">🔄 خيار التعامل مع البيانات في حال التكرار أو التداخل:</label>
                          <div className="flex flex-col sm:flex-row gap-3 text-xs font-bold text-amber-900 mt-1.5">
                            <label className="flex items-center gap-1.5 cursor-pointer bg-white/60 p-2 rounded-lg border border-amber-100 hover:bg-white transition-all flex-1">
                              <input 
                                type="radio" 
                                name="importDuplicateMode" 
                                checked={importDuplicateMode === 'append'} 
                                onChange={() => setImportDuplicateMode('append')}
                                className="accent-amber-700"
                              />
                              <span>تحديث وإضافة الأسطر الجديدة فقط (Append)</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer bg-red-50/60 p-2 rounded-lg border border-red-100 hover:bg-red-50 transition-all text-red-900 flex-1">
                              <input 
                                type="radio" 
                                name="importDuplicateMode" 
                                checked={importDuplicateMode === 'replace'} 
                                onChange={() => setImportDuplicateMode('replace')}
                                className="accent-red-700"
                              />
                              <span>⚠️ استبدال البيانات القديمة للحملة بالكامل (Replace)</span>
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                        <button
                          onClick={() => {
                            setUploadedRecords([]);
                            setIsConfirmingImport(false);
                            setImportCustomCampName('');
                            setImportSelectedCampId('');
                            if (fileInputRef.current) fileInputRef.current.value = '';
                            if (fileInputRef2.current) fileInputRef2.current.value = '';
                          }}
                          className="px-4 py-2 rounded-xl border border-[#D1CAB8] text-[#5F6C61] hover:bg-[#F4F1EA] text-xs font-bold transition-all cursor-pointer bg-white"
                        >
                          إلغاء واستبعاد الكشف
                        </button>
                        <button
                          onClick={() => {
                            // validation
                            if (importCampType === 'existing' && !importSelectedCampId) {
                              alert('الرجاء تحديد حملة مسجلة من القائمة أولاً.');
                              return;
                            }
                            if (importCampType === 'custom' && !importCustomCampName.trim()) {
                              alert('الرجاء كتابة اسم مخصص للحملة الأرشيفية الجديدة.');
                              return;
                            }
                            setImportWizardStep(2);
                          }}
                          className="bg-amber-700 hover:bg-amber-800 text-white px-5 py-2 rounded-xl text-xs font-extrabold shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <span>تأكيد خيارات الحملة والدمج ⬅️</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Preview Table inside Modal with strict mapping information */}
                  {importWizardStep === 2 && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="bg-amber-50/40 p-3 rounded-2xl border border-amber-100/50 flex items-start gap-2.5">
                        <span className="text-base">📋</span>
                        <div>
                          <h5 className="text-xs font-bold text-amber-950">الخطوة الثانية: مراجعة البيانات المستوردة وتفاصيل القيود</h5>
                          <p className="text-[10px] text-amber-800 mt-0.5 font-medium leading-relaxed">
                            الرجاء فحص القيود المستخرجة أدناه للتأكد من مطابقة الأعمدة والمبالغ بشكل دقيق قبل ترحيلها إلى الأرشيف التاريخي.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-[#2D3A30]">🔍 سجلات الكشف المكتشفة ({uploadedRecords.length} قيد تبرع)</span>
                          <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                            الوجهة: {importCampType === 'existing' ? campaigns.find(c => c.id === importSelectedCampId)?.title : importCustomCampName}
                          </span>
                        </div>

                        <div className="overflow-x-auto max-h-60 rounded-xl border border-gray-200 bg-[#FDFBF7]">
                          <table className="w-full text-right text-[11px]">
                            <thead className="bg-[#F4F1EA] text-[#3E4C41] font-bold border-b border-[#E2DED0] sticky top-0">
                              <tr>
                                <th className="p-2.5">اسم المتبرع</th>
                                <th className="p-2.5">المبلغ والعملة</th>
                                <th className="p-2.5">رقم الجوال</th>
                                <th className="p-2.5">البيان المرفق</th>
                                <th className="p-2.5">نوع العملة بالواجهة</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                              {uploadedRecords.map((rec, idx) => (
                                <tr key={idx} className="hover:bg-amber-50/10">
                                  <td className="p-2.5 font-bold text-gray-900">{rec.donorName}</td>
                                  <td className="p-2.5 font-mono font-bold text-emerald-800">{rec.amount.toLocaleString()} {rec.currency}</td>
                                  <td className="p-2.5 font-mono text-gray-500">{rec.donorPhone || '—'}</td>
                                  <td className="p-2.5 text-gray-500 truncate max-w-[150px]">{rec.notes || '—'}</td>
                                  <td className="p-2.5">
                                    <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[9px] font-bold">
                                      {rec.currency === 'YER_NEW' ? 'يمني جديد' : rec.currency === 'YER_OLD' ? 'يمني قديم' : rec.currency === 'SAR' ? 'ريال سعودي' : rec.currency === 'USD' ? 'دولار أمريكي' : 'مساهمة عينية'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="flex justify-between gap-2 border-t border-gray-100 pt-4">
                        <button
                          onClick={() => setImportWizardStep(1)}
                          className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 text-xs font-bold transition-all cursor-pointer bg-white"
                        >
                          ➡️ رجوع للخلف
                        </button>
                        <button
                          onClick={() => setImportWizardStep(3)}
                          className="bg-[#4A5D4E] hover:bg-[#3E4C41] text-white px-5 py-2 rounded-xl text-xs font-extrabold shadow-md transition-all cursor-pointer"
                        >
                          الاستمرار للخطوة النهائية ⬅️
                        </button>
                      </div>
                    </div>
                  )}


                  {/* Step 3: Final confirmation review */}
                  {importWizardStep === 3 && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="bg-amber-50/40 p-3 rounded-2xl border border-amber-100/50 flex items-start gap-2.5">
                        <span className="text-base">⚠️</span>
                        <div>
                          <h5 className="text-xs font-bold text-amber-950">الخطوة الثالثة: المراجعة النهائية واعتماد الأرشفة</h5>
                          <p className="text-[10px] text-amber-800 mt-0.5 font-medium leading-relaxed">
                            يرجى قراءة التلخيص النهائي بعناية. بمجرد الضغط على زر الاعتماد، سيقوم النظام بجدولة الكشف وحفظه بصورة تزامنية آمنة في أرشيف البلدة.
                          </p>
                        </div>
                      </div>

                      <div className="bg-[#FDFBF7] border border-[#E2DED0] rounded-2xl p-5 space-y-4 text-xs">
                        <h6 className="font-extrabold text-[#2D3A30] border-b border-gray-200 pb-2">📊 ملخص خيارات الأرشفة المحددة:</h6>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-semibold text-gray-700">
                          <div className="space-y-1 bg-white p-2.5 rounded-xl border border-gray-100">
                            <span className="text-[10px] text-gray-400 block">نوع الحملة المستهدفة:</span>
                            <span className="text-gray-900 font-bold">{importCampType === 'existing' ? 'حملة جارية مسجلة بالنظام' : 'حملة أرشيفية مخصصة جديدة'}</span>
                          </div>

                          <div className="space-y-1 bg-white p-2.5 rounded-xl border border-gray-100">
                            <span className="text-[10px] text-gray-400 block">اسم الحملة بالأرشيف:</span>
                            <span className="text-emerald-900 font-black">
                              {importCampType === 'existing' 
                                ? campaigns.find(c => c.id === importSelectedCampId)?.title 
                                : importCustomCampName}
                            </span>
                          </div>

                          <div className="space-y-1 bg-white p-2.5 rounded-xl border border-gray-100">
                            <span className="text-[10px] text-gray-400 block">نمط الدمج والتعامل مع البيانات:</span>
                            <span className={importDuplicateMode === 'replace' ? 'text-red-600 font-bold' : 'text-amber-800 font-bold'}>
                              {importDuplicateMode === 'replace' ? '⚠️ استبدال شامل للبيانات القديمة' : 'تحديث وإضافة القيود الجديدة فقط (Append)'}
                            </span>
                          </div>

                          <div className="space-y-1 bg-white p-2.5 rounded-xl border border-gray-100">
                            <span className="text-[10px] text-gray-400 block">إجمالي عدد سجلات المتبرعين:</span>
                            <span className="text-emerald-700 font-black">{uploadedRecords.length} قيد تبرع تاريخي</span>
                          </div>
                        </div>

                        {importDuplicateMode === 'replace' && (
                          <div className="p-3 bg-red-50 border border-red-200 text-red-950 rounded-xl leading-relaxed font-semibold text-[10px] space-y-1">
                            <span className="block text-red-700 font-bold">⚠️ تنبيه أمني خطير:</span>
                            سيتم حذف وتطهير الكشوفات الموثقة مسبقاً تحت هذا الاسم واستبدالها بالكامل بملفك المستورد الجديد. لا يمكن التراجع عن هذا الإجراء!
                          </div>
                        )}

                        <div className="text-[11px] text-amber-800 bg-amber-50/50 p-3 rounded-xl border border-amber-100 font-medium leading-relaxed">
                          💡 <strong>معلومات الأرشفة الآمنة:</strong> سيتم ترحيل هذه البيانات مباشرة إلى الأرشيف التاريخي للبلدة ولن تتدخل في السجلات الحية لضمان حماية الميزانيات من الأخطاء التراكمية.
                        </div>
                      </div>

                      <div className="flex justify-between gap-2 border-t border-gray-100 pt-4">
                        <button
                          onClick={() => setImportWizardStep(2)}
                          className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 text-xs font-bold transition-all cursor-pointer bg-white"
                        >
                          ➡️ رجوع للخلف
                        </button>
                        <button
                          onClick={handleSaveImportedRecords}
                          className="bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-2.5 rounded-xl text-xs font-extrabold shadow-md transition-all cursor-pointer flex items-center gap-1.5 animate-pulse"
                        >
                          <Check className="w-4 h-4" />
                          اعتماد الحفظ النهائي والأرشفة ✅
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* Success Banner Popup (نافذة النجاح البارزة) */}
            {showImportSuccessBanner && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in text-right" dir="rtl">
                <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border-2 border-emerald-500/30 text-center">
                  <div className="mx-auto w-14 h-14 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center text-3xl shadow-xs">
                    🎉
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-base font-black text-emerald-950">🎉 اكتمال التحميل والاستيراد بنجاح!</h4>
                    <p className="text-xs text-[#5F6C61] leading-relaxed">
                      تم بنجاح استيراد وقراءة الكشوفات المحددة وإدراج القيود بنجاح في الأرشيف التاريخي للبلدة للـعرض والتوثيق فقط.
                    </p>
                  </div>

                  <div className="bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-100 text-xs text-right space-y-2 font-bold text-emerald-900">
                    <div className="flex justify-between border-b border-emerald-100/30 pb-1.5">
                      <span>الحملة المستهدفة:</span>
                      <span className="text-emerald-950 font-black">{successImportDetails.campaignTitle}</span>
                    </div>
                    <div className="flex justify-between border-b border-emerald-100/30 pb-1.5">
                      <span>عدد السجلات الموثقة:</span>
                      <span className="text-emerald-950 font-black">{successImportDetails.recordCount} قيد تبرع مالي</span>
                    </div>
                    <div className="flex justify-between">
                      <span>نمط التحديث:</span>
                      <span className="text-emerald-950 font-black">
                        {successImportDetails.mode === 'replace' ? 'استبدال كامل ومسح الكشوفات السابقة' : 'إدراج تدريجي (Append)'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowImportSuccessBanner(false)}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-2.5 rounded-xl text-xs font-extrabold shadow-md transition-all cursor-pointer"
                  >
                    موافق / إغلاق الشاشة
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Separate Isolated Archive Panel Tab */}
      {hasManagementAccess && activeSubTab === 'archive' && (
        <div className="space-y-6">
          {/* Archive Statistics & Isolated Banner */}
          <div className="bg-amber-50/40 border border-amber-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-sm font-black text-amber-950 flex items-center gap-2">
                  <Database className="w-5 h-5 text-amber-800" />
                  منظومة الأرشيف التاريخي المعزول للبلدة
                </h3>
                <p className="text-xs text-amber-900 mt-1">
                  سجل أرشيفي مخصص ومستقل بالكامل للكشوفات والقيود القديمة المستوردة من ملفات أو جداول خارجية.
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-amber-800/80 mt-2 font-bold">
                  <span className="flex items-center gap-1">🔒 بيانات العرض فقط (Read-Only)</span>
                  <span className="flex items-center gap-1">🚫 لا تؤثر على ميزانيات الحملات النشطة</span>
                  <span className="flex items-center gap-1">🚫 لا ترحل إلى جداول جوجل شيت المباشرة</span>
                </div>
              </div>
              {isSuperAdmin && archiveRecords.length > 0 && (
                <button
                  onClick={() => {
                    askConfirmation(
                      '⚠️ تأكيد تفريغ الأرشيف التاريخي',
                      'هل أنت متأكد تماماً من رغبتك في حذف وتصفير جميع القيود المؤرشفة بالكامل؟ لا يمكن التراجع عن هذا الإجراء.',
                      () => {
                        setArchiveRecords([]);
                        showSuccessAlert('🧹 تم تفريغ الأرشيف', 'تم حذف ومسح كافة البيانات والقيود المسجلة في الأرشيف التاريخي بنجاح.');
                      }
                    );
                  }}
                  className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer"
                >
                  🧹 تفريغ ومسح الأرشيف بالكامل
                </button>
              )}
            </div>

            {/* Archive Multi-Currency Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
              <div className="bg-white p-3 rounded-2xl border border-amber-200/50 text-right">
                <span className="text-[10px] text-amber-800 font-bold block">إجمالي ريال سعودي (SAR)</span>
                <strong className="text-sm font-mono font-extrabold text-[#4A5D4E] mt-1 block">
                  {archiveTotals.SAR.toLocaleString('ar-SA')} ر.س
                </strong>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-amber-200/50 text-right">
                <span className="text-[10px] text-amber-800 font-bold block">إجمالي يمني جديد (YER_NEW)</span>
                <strong className="text-sm font-mono font-extrabold text-amber-950 mt-1 block">
                  {archiveTotals.YER_NEW.toLocaleString('ar-SA')} ر.ي
                </strong>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-amber-200/50 text-right">
                <span className="text-[10px] text-amber-800 font-bold block">إجمالي يمني قديم (YER_OLD)</span>
                <strong className="text-sm font-mono font-extrabold text-amber-900 mt-1 block">
                  {archiveTotals.YER_OLD.toLocaleString('ar-SA')} ر.ي
                </strong>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-amber-200/50 text-right">
                <span className="text-[10px] text-amber-800 font-bold block">إجمالي دولار أمريكي (USD)</span>
                <strong className="text-sm font-mono font-extrabold text-amber-800 mt-1 block">
                  ${archiveTotals.USD.toLocaleString('ar-SA')}
                </strong>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-amber-200/50 text-right col-span-2 sm:col-span-1">
                <span className="text-[10px] text-amber-800 font-bold block">مساهمات عينية مؤرشفة</span>
                <strong className="text-sm font-mono font-extrabold text-[#A98467] mt-1 block">
                  {archiveInKindCount} مساهمة
                </strong>
              </div>
            </div>
          </div>

          {/* Historical Campaigns Container (تصفح حملات التبرع القديمة والمؤرشفة) */}
          <div className="bg-white rounded-3xl border border-[#E2DED0] p-6 shadow-sm space-y-4">
            <div>
              <h4 className="text-xs font-black text-[#2D3A30] flex items-center gap-1.5">
                <FolderOpen className="w-4.5 h-4.5 text-amber-700" />
                📂 تصفح حملات التبرع القديمة والمؤرشفة (Historical Campaigns Container)
              </h4>
              <p className="text-[10px] text-[#7A8B7E] mt-0.5">
                انقر على أي حملة أرشيفية بالأسفل لتصفية واستعراض قيودها ومساهماتها فوراً بشكل معزول وتلقائي.
              </p>
            </div>

            {getHistoricalCampaigns().length === 0 ? (
              <div className="text-center py-6 text-xs text-gray-400 font-bold bg-[#FDFBF7] rounded-2xl border border-dashed border-[#E2DED0]">
                لا توجد حملات قديمة مؤرشفة في النظام حالياً. يمكنك البدء في رفع واستيراد الكشوفات التاريخية لتظهر هنا تلقائياً.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Special Card for 'All' */}
                <div 
                  onClick={() => setArchiveFilterCampaign('all')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    archiveFilterCampaign === 'all'
                      ? 'border-amber-600 bg-amber-50/20 shadow-xs scale-[1.01]'
                      : 'border-[#E2DED0] bg-[#FDFBF7]/30 hover:border-amber-400 hover:bg-amber-50/5'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2 justify-between">
                      <span className="text-xs font-extrabold text-[#2D3A30]">🌍 جميع قيود وكشوفات الأرشيف</span>
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100/50 px-2 py-0.5 rounded-full">
                        {archiveRecords.length} قيد
                      </span>
                    </div>
                    <p className="text-[10px] text-[#5F6C61] mt-2 leading-relaxed font-semibold">
                      استعراض وتصدير كافة المساهمات والبيانات التاريخية المستوردة في الأرشيف دفعة واحدة.
                    </p>
                  </div>
                  <div className="text-left mt-3 pt-2 border-t border-gray-100/50">
                    <span className="text-[10px] text-amber-800 font-bold">انقر للمشاهدة والتصفية 🔍</span>
                  </div>
                </div>

                {getHistoricalCampaigns().map((camp) => {
                  const isSelected = archiveFilterCampaign === camp.title || archiveFilterCampaign === camp.id;
                  return (
                    <div
                      key={camp.title}
                      onClick={() => setArchiveFilterCampaign(camp.title)}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-amber-600 bg-amber-50/20 shadow-xs scale-[1.01]'
                          : 'border-[#E2DED0] bg-[#FDFBF7]/30 hover:border-amber-400 hover:bg-amber-50/5'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2 justify-between">
                          <span className="text-xs font-extrabold text-amber-950 truncate max-w-[170px]" title={camp.title}>
                            📂 {camp.title}
                          </span>
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-100/50 px-2 py-0.5 rounded-full shrink-0">
                            {camp.recordCount} قيد
                          </span>
                        </div>
                        
                        {/* Compact totals display */}
                        <div className="mt-3 space-y-1 text-[10px] text-amber-900/90 font-bold">
                          {camp.totals.SAR > 0 && <div className="flex items-center gap-1">🇸🇦 {camp.totals.SAR.toLocaleString('ar-SA')} ر.س</div>}
                          {camp.totals.YER_NEW > 0 && <div className="flex items-center gap-1">🇾🇪 {camp.totals.YER_NEW.toLocaleString('ar-SA')} ريال (جديد)</div>}
                          {camp.totals.YER_OLD > 0 && <div className="flex items-center gap-1">🏛️ {camp.totals.YER_OLD.toLocaleString('ar-SA')} ريال (قديم)</div>}
                          {camp.totals.USD > 0 && <div className="flex items-center gap-1">🇺🇸 ${camp.totals.USD.toLocaleString('ar-SA')}</div>}
                        </div>
                      </div>

                      <div className="text-left mt-3 pt-2 border-t border-gray-100/50 flex justify-between items-center text-[10px] font-bold">
                        <span className="text-[#7A8B7E]">بيانات معزولة 🔒</span>
                        <span className="text-amber-800">انقر للمشاهدة والتصفية 🔍</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Archive Table and Filtering Panel */}
          <div className="bg-white rounded-3xl border border-[#E2DED0] p-6 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#F4F1EA] pb-3">
              <div>
                <h4 className="text-xs font-black text-[#2D3A30]">استعراض ومصفاة البيانات التاريخية الموثقة</h4>
                <p className="text-[10px] text-[#7A8B7E] mt-0.5">البحث السريع والفرز الذكي لكشوفات الأرشيف التاريخي المعزول.</p>
              </div>

              {/* Excel Export specifically for Archived Records */}
              {filteredArchiveRecords.length > 0 && (
                <button
                  onClick={() => {
                    askConfirmation(
                      'تأكيد تصدير كشف الأرشيف',
                      `هل أنت متأكد من رغبتك في تصدير وتحميل عدد (${filteredArchiveRecords.length}) قيد من الأرشيف التاريخي كملف CSV؟`,
                      () => {
                        let csvContent = '\uFEFF'; // Excel BOM
                        csvContent += 'معرف الأرشيف,الحملة المرتبطة,اسم المتبرع,رقم الجوال,المبلغ,العملة,التبرع العيني,طريقة السداد,المسجل,التاريخ والوقت,ملاحظات\n';
                        
                        filteredArchiveRecords.forEach((r, idx) => {
                          const row = [
                            `ARC-${idx + 1}`,
                            `"${(r.campaignTitle || '').replace(/"/g, '""')}"`,
                            `"${(r.donorName || '').replace(/"/g, '""')}"`,
                            r.donorPhone || '',
                            r.amount,
                            r.currency,
                            `"${(r.inkindDescription || '').replace(/"/g, '""')}"`,
                            r.paymentMethod || '',
                            `"${(r.recordedBy || '').replace(/"/g, '""')}"`,
                            r.date || '',
                            `"${(r.notes || '').replace(/"/g, '""')}"`
                          ];
                          csvContent += row.join(',') + '\n';
                        });

                        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.setAttribute('href', url);
                        link.setAttribute('download', `أرشيف_تبرعات_قرية_ذي_للجمال_${Date.now()}.csv`);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);

                        showSuccessAlert('📥 تم التصدير والتحميل بنجاح!', 'تم حفظ وتصدير ملف الأرشيف بصيغة CSV المتوافقة مع إكسل.');
                      }
                    );
                  }}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs shrink-0"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  تصدير كشف الأرشيف المصفى (Excel)
                </button>
              )}
            </div>

            {/* Archive Filtering Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute right-3 top-2.5" />
                <input
                  type="text"
                  value={archiveSearchQuery}
                  onChange={(e) => setArchiveSearchQuery(e.target.value)}
                  placeholder="ابحث بالمتبرع، الجوال، المندوب، أو الحملة المكتوبة..."
                  className="pl-3 pr-9 py-1.5 rounded-xl border border-[#E2DED0] text-xs outline-none w-full"
                />
              </div>

              <div>
                <select
                  value={archiveFilterCampaign}
                  onChange={(e) => setArchiveFilterCampaign(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-[#E2DED0] text-xs bg-white font-bold text-[#3E4C41] outline-none"
                >
                  <option value="all">كل الحملات المؤرشفة 🎯</option>
                  {/* Extract unique campaign IDs or campaign titles from archive */}
                  {Array.from(new Set(archiveRecords.map(r => r.campaignTitle || r.campaignId).filter(Boolean))).map(campName => (
                    <option key={campName} value={campName}>{campName}</option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={archiveFilterCurrency}
                  onChange={(e) => setArchiveFilterCurrency(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-[#E2DED0] text-xs bg-white font-bold text-[#3E4C41] outline-none"
                >
                  <option value="all">كل عملات الأرشيف 💵</option>
                  {Array.from(new Set(archiveRecords.map(r => r.currency).filter(Boolean))).map((curr: any) => (
                    <option key={curr} value={curr}>{curr} ({(CURRENCY_SYMBOLS as any)[curr] || curr})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Archive Data Table */}
            <div className="overflow-x-auto rounded-2xl border border-[#E2DED0]">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#F4F1EA] text-[#3E4C41] font-bold text-[11px] border-b border-[#E2DED0]">
                  <tr>
                    <th className="p-3"># م</th>
                    <th className="p-3">الحملة التاريخية</th>
                    <th className="p-3">اسم المتبرع</th>
                    <th className="p-3">رقم الجوال</th>
                    <th className="p-3">المبلغ والعملة</th>
                    <th className="p-3">المندوب المسجل</th>
                    <th className="p-3">تاريخ ووقت القيد القديم</th>
                    <th className="p-3">ملاحظات المستند</th>
                    {hasManagementAccess && <th className="p-3 text-center">التحكم</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F4F1EA]">
                  {filteredArchiveRecords.length === 0 ? (
                    <tr>
                      <td colSpan={hasManagementAccess ? 9 : 8} className="p-8 text-center text-gray-400 font-semibold">
                        لا توجد سجلات مؤرشفة تطابق خيارات التصفية والبحث الحالية.
                      </td>
                    </tr>
                  ) : (
                    filteredArchiveRecords.map((rec, idx) => (
                      <tr key={idx} className="hover:bg-amber-50/10 transition-colors">
                        <td className="p-3 font-mono text-gray-400">{idx + 1}</td>
                        <td className="p-3 font-semibold text-[#2D3A30]">{rec.campaignTitle}</td>
                        <td className="p-3 font-bold text-gray-900">{rec.donorName}</td>
                        <td className="p-3 font-mono text-gray-500">{rec.donorPhone || '—'}</td>
                        <td className="p-3 font-mono font-bold text-emerald-800">
                          {rec.currency === 'KIND' || (rec.inkindDescription && rec.inkindDescription.trim().length > 0) ? (
                            <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[10px]">
                              🎁 عيني: {rec.inkindDescription}
                            </span>
                          ) : (
                            `${rec.amount.toLocaleString()} ${rec.currency}`
                          )}
                        </td>
                        <td className="p-3 text-gray-600">{rec.recordedBy}</td>
                        <td className="p-3 font-mono text-gray-500">{rec.date}</td>
                        <td className="p-3 text-gray-500 text-[11px]">{rec.notes || '—'}</td>
                        {hasManagementAccess && (
                          <td className="p-3 text-center">
                            <button
                              onClick={() => {
                                askConfirmation(
                                  'تأكيد حذف القيد المؤرشف',
                                  `هل أنت متأكد من رغبتك في حذف هذا السجل المؤرشف نهائياً؟`,
                                  () => {
                                    setArchiveRecords(prev => prev.filter((_, i) => i !== idx));
                                    showSuccessAlert('🧹 تم الحذف', 'تم حذف القيد من الأرشيف التاريخي بنجاح.');
                                  }
                                );
                              }}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1.5 rounded-lg transition-colors border border-transparent hover:border-red-200 cursor-pointer"
                              title="حذف القيد المؤرشف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Settings & Admin Panel Tab */}
      {hasManagementAccess && activeSubTab === 'settings' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-[#E2DED0] p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-sm font-bold text-[#2D3A30] flex items-center gap-1.5">
                <Settings className="w-5 h-5 text-[#A98467]" />
                لوحة الإعدادات المالية والتحكم بالصلاحيات والمندوبين
              </h3>
              <p className="text-xs text-[#7A8B7E] mt-0.5">
                تمنح هذه اللوحة المدير العام والمنسقين تحكماً كاملاً بأسعار الصرف الداخلية للتقييم، وربط جداول جوجل، وتفعيل أو إلغاء تنشيط حسابات المندوبين.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Box 1: Exchange Rates */}
              <div className="border border-[#E2DED0] rounded-2xl p-4 bg-[#FDFBF7] space-y-4">
                <h4 className="text-xs font-black text-[#2D3A30] flex items-center gap-1.5 border-b border-[#E2DED0] pb-2 text-amber-900">
                  <Coins className="w-4 h-4 text-amber-700" />
                  منظومة أسعار الصرف التقريبية (للتقييم الداخلي العام)
                </h4>
                <p className="text-[11px] text-[#5F6C61] leading-relaxed">
                  تُستخدم أسعار الصرف هذه <strong>لأغراض العرض والتقييم الداخلي العام فقط</strong> لحساب مؤشرات ونسب الإنجاز بالنسبة للريال السعودي. بينما يتم الاحتفاظ بالعملات الأصلية بشكل مستقل تماماً في سجلات القيود وقاعدة البيانات.
                </p>

                <div className="space-y-3 pt-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-[#3E4C41] mb-1">
                      الريال اليمني الجديد قعيطي (كم يعادل 1 ريال سعودي؟)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={exchangeRates.YER_NEW}
                        onChange={(e) => setExchangeRates({ ...exchangeRates, YER_NEW: parseFloat(e.target.value) || 410 })}
                        className="px-3 py-1.5 rounded-xl border border-[#E2DED0] bg-white w-full font-mono font-bold"
                        placeholder="410"
                      />
                      <span className="bg-gray-100 border border-[#E2DED0] px-3 py-1.5 rounded-xl font-bold flex items-center shrink-0">ر.ي.ج</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#3E4C41] mb-1">
                      الريال اليمني القديم (كم يعادل 1 ريال سعودي؟)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={exchangeRates.YER_OLD}
                        onChange={(e) => setExchangeRates({ ...exchangeRates, YER_OLD: parseFloat(e.target.value) || 140 })}
                        className="px-3 py-1.5 rounded-xl border border-[#E2DED0] bg-white w-full font-mono font-bold"
                        placeholder="140"
                      />
                      <span className="bg-gray-100 border border-[#E2DED0] px-3 py-1.5 rounded-xl font-bold flex items-center shrink-0">ر.ي.ق</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#3E4C41] mb-1">
                      الدولار الأمريكي مقابل الريال السعودي (سعر الصرف المباشر)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.01"
                        value={exchangeRates.USD}
                        onChange={(e) => setExchangeRates({ ...exchangeRates, USD: parseFloat(e.target.value) || 3.75 })}
                        className="px-3 py-1.5 rounded-xl border border-[#E2DED0] bg-white w-full font-mono font-bold"
                        placeholder="3.75"
                      />
                      <span className="bg-gray-100 border border-[#E2DED0] px-3 py-1.5 rounded-xl font-bold flex items-center shrink-0">USD</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Box 2: Google Sheets Instant Push Webhook */}
              <div className="border border-[#E2DED0] rounded-2xl p-4 bg-[#FDFBF7] space-y-4">
                <h4 className="text-xs font-black text-[#2D3A30] flex items-center gap-1.5 border-b border-[#E2DED0] pb-2 text-emerald-900">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                  منظومة الترحيل والربط الفوري بـ (Google Sheets)
                </h4>
                <p className="text-[11px] text-[#5F6C61] leading-relaxed">
                  عند تسجيل أي تبرع جديد، يتم إرسال البيانات فوراً كسطر تسلسلي مستقل عبر طلب <code className="bg-emerald-100 text-emerald-900 px-1 rounded">fetch POST</code> بنمط <code className="bg-emerald-100 text-emerald-900 px-1 rounded">no-cors</code> إلى رابط Web App لبرمجة ماكرو جوجل شيت (Google Apps Script).
                </p>

                <div className="space-y-3 pt-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-[#3E4C41] mb-1">رابط نشر ماكرو ويب (Web App URL)</label>
                    <input
                      type="url"
                      value={googleSheetsPostUrl}
                      onChange={(e) => setGoogleSheetsPostUrl(e.target.value)}
                      placeholder="https://script.google.com/macros/s/.../exec"
                      className="w-full px-3 py-2 rounded-xl border border-[#E2DED0] bg-white outline-none focus:ring-1 focus:ring-[#4A5D4E]"
                    />
                    <p className="text-[9px] text-[#7A8B7E] mt-1">
                      * يتضمن الترحيل عمود اسم الحملة (Column F) لتتمكن من فرز البيانات ديناميكياً داخل شيت واحد.
                    </p>
                  </div>

                  {googleSheetsPostUrl && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-950 p-3 rounded-xl text-[10px] flex items-center gap-1.5 font-semibold">
                      <span className="p-1 rounded-full bg-emerald-100 text-emerald-800">✅</span>
                      منظومة الترحيل المباشر نشطة ومربوطة بنجاح مع جدول بيانات جوجل.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Row 2: Delegate Access Control & Blocking */}
            <div className="border border-[#E2DED0] rounded-2xl p-5 bg-[#FDFBF7] space-y-4">
              <h4 className="text-xs font-black text-[#2D3A30] flex items-center gap-1.5 border-b border-[#E2DED0] pb-2 text-red-900">
                <Ban className="w-4 h-4 text-red-700" />
                إدارة وحظر وإلغاء تنشيط حسابات المندوبين والمشرفين
              </h4>
              <p className="text-[11px] text-[#5F6C61] leading-relaxed">
                بصفتك <strong>المدير العام</strong>، تمتلك الصلاحية المطلقة لإلغاء تنشيط أو تجميد حساب أي مندوب فوراً. المندوب المحظور سيُمنع تماماً من تسجيل أي تبرعات يدوية جديدة أو الاطلاع على كشف وجداول تبرعات المرصد.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                {/* Form to Block */}
                <div className="space-y-3">
                  <h5 className="font-bold text-xs text-red-950">🚫 إضافة بريد إلكتروني للحظر</h5>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={newDelegateToBlock}
                      onChange={(e) => setNewDelegateToBlock(e.target.value)}
                      placeholder="مثال: representative@gmail.com"
                      className="w-full px-3 py-1.5 rounded-xl border border-[#E2DED0] text-xs bg-white outline-none"
                    />
                    <button
                      onClick={() => {
                        if (!newDelegateToBlock.trim()) {
                          alert('الرجاء إدخال بريد إلكتروني صحيح للتعطيل.');
                          return;
                        }
                        const email = newDelegateToBlock.trim().toLowerCase();
                        if (blockedDelegates.includes(email)) {
                          alert('هذا الحساب محظور مسبقاً.');
                          return;
                        }
                        setBlockedDelegates([...blockedDelegates, email]);
                        setNewDelegateToBlock('');
                        alert(`تم إلغاء تنشيط المندوب ${email} وحظره بنجاح.`);
                      }}
                      className="w-full bg-red-600 hover:bg-red-700 text-white py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-xs"
                    >
                      إلغاء وتجميد حساب المندوب
                    </button>
                  </div>
                </div>

                {/* Blocked list table */}
                <div className="md:col-span-2 space-y-2">
                  <h5 className="font-bold text-xs text-gray-800">📋 قائمة الحسابات المعطلة الحالية ({blockedDelegates.length})</h5>
                  <div className="border border-red-100 rounded-xl overflow-hidden bg-white max-h-40 overflow-y-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-red-50 text-red-950 text-[10px] font-bold border-b border-red-100">
                        <tr>
                          <th className="p-2">البريد الإلكتروني الموقوف</th>
                          <th className="p-2">الحالة الحالية</th>
                          <th className="p-2 text-center">الإجراء المالي</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-red-50 text-[11px]">
                        {blockedDelegates.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="p-4 text-center text-gray-400 font-semibold">
                              لا توجد حسابات مندوبين معطلة في النظام حالياً. جميع المندوبين نشطون.
                            </td>
                          </tr>
                        ) : (
                          blockedDelegates.map(del => (
                            <tr key={del} className="hover:bg-red-50/20">
                              <td className="p-2 font-mono font-bold text-red-900">{del}</td>
                              <td className="p-2">
                                <span className="bg-red-100 text-red-800 text-[9px] font-bold px-1.5 py-0.5 rounded border border-red-200">موقوف معطل</span>
                              </td>
                              <td className="p-2 text-center">
                                <button
                                  onClick={() => {
                                    setBlockedDelegates(blockedDelegates.filter(d => d !== del));
                                    alert(`تمت إعادة تنشيط وتفعيل حساب المندوب ${del} بنجاح.`);
                                  }}
                                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                                >
                                  إعادة تفعيل وصلاحيات
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prominent Add Donation Popup Modal */}
      {openAddDonationModal && (
        <div className="fixed inset-0 z-[1050] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs text-right font-sans" dir="rtl" id="add-donation-modal">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="bg-[#FDFBF7] rounded-3xl border border-[#E2DED0] p-6 shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto relative space-y-6"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                setOpenAddDonationModal(false);
              }}
              className="absolute left-4 top-4 p-1.5 rounded-xl hover:bg-gray-100 text-[#7A8B7E] hover:text-[#2D3A30] cursor-pointer transition-colors border border-gray-200/50"
              title="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1 pb-2 border-b border-[#F4F1EA]">
              <h3 className="text-sm font-black text-[#2D3A30] flex items-center gap-1.5">
                <span className="text-base text-emerald-700">➕</span>
                تسجيل وتوثيق مساهمة وتبرع جديد فوري
              </h3>
              <p className="text-[10px] text-[#7A8B7E]">
                سيتم اعتماد المساهمة وتحديث الإحصائيات وترحيل السجل مباشرة لجدول بيانات جوجل المعتمد.
              </p>
            </div>

            <form onSubmit={handleModalDonationSubmit} className="space-y-4">
              {/* Campaign Dropdown */}
              <div className="space-y-1">
                <label className="block text-[11px] font-black text-[#3E4C41]">اختيار الحملة المستفيدة <span className="text-red-500">*</span></label>
                <select
                  value={modalCampaignId}
                  onChange={(e) => setModalCampaignId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2DED0] text-xs text-[#2D3A30] bg-white font-bold focus:ring-2 focus:ring-[#4A5D4E]/20 focus:border-[#4A5D4E] transition-all outline-none"
                  required
                >
                  <option value="" disabled>-- اختر الحملة المستهدفة --</option>
                  {campaigns.filter(camp => isSuperAdmin || canRecordForCampaign(camp)).map(camp => (
                    <option key={camp.id} value={camp.id}>
                      {camp.title} ({camp.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Delegate Selection Dropdown */}
              <div className="space-y-1">
                <label className="block text-[11px] font-black text-[#3E4C41]">👤 اسم المندوب المسجل (اختر من القائمة)</label>
                <select
                  value={modalDelegate}
                  onChange={(e) => setModalDelegate(e.target.value)}
                  disabled={!hasManagementAccess}
                  className={`w-full px-3 py-2 rounded-xl border border-[#E2DED0] text-xs font-bold text-[#2D3A30] outline-none focus:ring-2 focus:ring-[#4A5D4E]/20 focus:border-[#4A5D4E] transition-all ${!hasManagementAccess ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white'}`}
                >
                  {allDelegates.map((del) => {
                    const formatted = `[${del.name} (جوال: ${del.phone})]`;
                    return (
                      <option key={del.email} value={formatted}>
                        👤 {formatted}
                      </option>
                    );
                  })}
                </select>
                <span className="text-[9px] text-[#7A8B7E] block">
                  💡 يتم حفظ بيانات المندوب المحدد باللغة العربية مع قيد التبرع لسهولة مراجعته وتدقيقه في السجل المالي.
                </span>
              </div>

              {/* Donor Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-black text-[#3E4C41]">اسم المتبرع الكريم <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={modalDonorName}
                    onChange={(e) => setModalDonorName(e.target.value)}
                    placeholder="اسم المتبرع أو فاعل خير"
                    className="w-full px-3 py-2 rounded-xl border border-[#E2DED0] text-xs text-[#2D3A30] bg-white outline-none focus:ring-2 focus:ring-[#4A5D4E]/20"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-black text-[#3E4C41]">رقم جوال المتبرع (اختياري)</label>
                  <input
                    type="tel"
                    value={modalDonorPhone}
                    onChange={(e) => setModalDonorPhone(e.target.value)}
                    placeholder="05XXXXXXXX"
                    className="w-full px-3 py-2 rounded-xl border border-[#E2DED0] text-xs text-left font-mono outline-none focus:ring-2 focus:ring-[#4A5D4E]/20"
                  />
                </div>
              </div>

              {/* Currency & Type Selection with Prioritization */}
              <div className="space-y-2 pt-2 border-t border-[#F4F1EA]">
                <label className="block text-[11px] font-black text-[#3E4C41]">نوع العملة وقناة المساهمة (الترتيب حسب الأولوية) <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setModalIsDonationInKind(false);
                      setModalCurrency('YER_NEW');
                    }}
                    className={`py-2 text-xs font-extrabold rounded-xl border transition-all ${
                      (!modalIsDonationInKind && modalCurrency === 'YER_NEW')
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                        : 'bg-white text-[#5F6C61] border-[#D1CAB8] hover:bg-gray-50'
                    }`}
                  >
                    🇾🇪 ر.ي الجديد
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setModalIsDonationInKind(false);
                      setModalCurrency('YER_OLD');
                    }}
                    className={`py-2 text-xs font-extrabold rounded-xl border transition-all ${
                      (!modalIsDonationInKind && modalCurrency === 'YER_OLD')
                        ? 'bg-[#4A5D4E] text-white border-[#4A5D4E] shadow-sm'
                        : 'bg-white text-[#5F6C61] border-[#D1CAB8] hover:bg-gray-50'
                    }`}
                  >
                    🏛️ ر.ي القديم
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setModalIsDonationInKind(false);
                      setModalCurrency('SAR');
                    }}
                    className={`py-2 text-xs font-extrabold rounded-xl border transition-all ${
                      (!modalIsDonationInKind && modalCurrency === 'SAR')
                        ? 'bg-[#A98467] text-white border-[#A98467] shadow-sm'
                        : 'bg-white text-[#5F6C61] border-[#D1CAB8] hover:bg-gray-50'
                    }`}
                  >
                    🇸🇦 ريال سعودي
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setModalIsDonationInKind(true);
                      setModalCurrency('KIND');
                    }}
                    className={`py-2 text-xs font-extrabold rounded-xl border transition-all ${
                      (modalIsDonationInKind || modalCurrency === 'KIND')
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                        : 'bg-white text-[#5F6C61] border-[#D1CAB8] hover:bg-gray-50'
                    }`}
                  >
                    🎁 تبرع عيني
                  </button>
                </div>
              </div>

              {/* Dynamic inputs depending on kind/financial */}
              {modalIsDonationInKind ? (
                <div className="space-y-1">
                  <label className="block text-[11px] font-black text-[#3E4C41]">وصف تفصيلي للتبرع العيني الممنوح <span className="text-red-500">*</span></label>
                  <textarea
                    value={modalInkindDescription}
                    onChange={(e) => setModalInkindDescription(e.target.value)}
                    placeholder="اكتب وصفاً مفتوحاً وتفصيلياً للتبرعات العينية (مثل: كيس دقيق، سلة غذائية، ملابس كسوة، خدمات نقل...)"
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl border border-[#E2DED0] text-xs text-[#2D3A30] bg-white outline-none focus:ring-2 focus:ring-[#4A5D4E]/20"
                    required={modalIsDonationInKind}
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="block text-[11px] font-black text-[#3E4C41]">المبلغ المالي المودع ({modalCurrency === 'YER_NEW' ? 'ريال يمني جديد' : modalCurrency === 'YER_OLD' ? 'ريال يمني قديم' : 'ريال سعودي'}) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    value={modalAmount}
                    onChange={(e) => setModalAmount(e.target.value)}
                    placeholder="مثال: 5000"
                    className="w-full px-3 py-2 rounded-xl border border-[#E2DED0] text-xs text-[#2D3A30] font-bold outline-none focus:ring-2 focus:ring-[#4A5D4E]/20"
                    required={!modalIsDonationInKind}
                    min="1"
                  />
                </div>
              )}

              {/* Payment Method & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="block text-[11px] font-black text-[#3E4C41]">طريقة السداد الآمنة</label>
                  <select
                    value={modalPaymentMethod}
                    onChange={(e) => setModalPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E2DED0] text-xs bg-white text-[#2D3A30] outline-none focus:ring-2 focus:ring-[#4A5D4E]/20"
                  >
                    <option value="cash">💵 نقدي (كاش تسليم مباشر)</option>
                    <option value="transfer">🏦 تحويل بنكي للمستودع</option>
                    <option value="mada">💳 مدى (شبكة)</option>
                    <option value="visa">🎫 فيزا / ماستر كارد</option>
                    <option value="applepay">🍏 Apple Pay</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-black text-[#3E4C41]">ملاحظات إضافية / مستند</label>
                  <input
                    type="text"
                    value={modalNotes}
                    onChange={(e) => setModalNotes(e.target.value)}
                    placeholder="مرجع التحويل، رقم الإيصال إن وجد"
                    className="w-full px-3 py-2 rounded-xl border border-[#E2DED0] text-xs outline-none focus:ring-2 focus:ring-[#4A5D4E]/20"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-4 border-t border-[#F4F1EA]">
                <button
                  type="submit"
                  disabled={modalIsSubmitting}
                  className="flex-1 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-700/50 text-white py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {modalIsSubmitting ? (
                    <>
                      <span className="animate-spin text-sm">⌛</span>
                      جاري الترحيل والحفظ والمزامنة...
                    </>
                  ) : (
                    <>
                      <span>حفظ واعتماد التبرع فورا 💾</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setOpenAddDonationModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#D1CAB8] text-[#5F6C61] hover:bg-gray-100 text-xs font-bold transition-all cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Custom Confirmation Dialog Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-[#2D3A30]/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-[#E2DED0] rounded-3xl w-full max-w-md shadow-2xl p-6 relative space-y-4"
            dir="rtl"
          >
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-50 text-amber-600 text-2xl">
                ⚠️
              </div>
              <h3 className="text-sm font-black text-[#2D3A30]">{confirmModal.title}</h3>
              <p className="text-xs text-[#5F6C61] leading-relaxed">
                {confirmModal.message}
              </p>
            </div>
            
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer shadow-md"
              >
                تأكيد الرفع والتحليل
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
                  if (fileInputRef2.current) fileInputRef2.current.value = '';
                }}
                className="flex-1 border border-[#D1CAB8] text-[#5F6C61] hover:bg-gray-100 text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Custom Success Dialog Modal */}
      {successModal.isOpen && (
        <div className="fixed inset-0 bg-[#2D3A30]/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-[#E2DED0] rounded-3xl w-full max-w-md shadow-2xl p-6 relative space-y-4"
            dir="rtl"
          >
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 text-2xl">
                🎉
              </div>
              <h3 className="text-sm font-black text-[#2D3A30]">{successModal.title}</h3>
              <p className="text-xs text-[#5F6C61] leading-relaxed">
                {successModal.message}
              </p>
            </div>
            
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setSuccessModal(prev => ({ ...prev, isOpen: false }))}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer shadow-md text-center"
              >
                حسناً
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
