import React, { useState, useEffect, useTransition, useRef } from 'react';
import { Family, LocalService } from './types';
import { INITIAL_FAMILIES, INITIAL_SERVICES } from './data/mockData';
import Dashboard from './components/Dashboard';
import LocalMap from './components/LocalMap';
import FamilyRegister from './components/FamilyRegister';
import FamilyForm from './components/FamilyForm';
import ServiceRegister from './components/ServiceRegister';
import ServiceForm from './components/ServiceForm';
import StatsReports from './components/StatsReports';
import Donations from './components/Donations';
import Contact from './components/Contact';
import VillageDirectory from './components/VillageDirectory';
import LoginModal from './components/LoginModal';
import SuperAdminSettings from './components/SuperAdminSettings';
import ChangePasswordModal from './components/ChangePasswordModal';
import GoogleSheetsData from './components/GoogleSheetsData';
import EditFamilyModal from './components/EditFamilyModal';
import MoveMemberModal from './components/MoveMemberModal';
import UnapprovedDelegatePanel from './components/UnapprovedDelegatePanel';
import FirstLoginUpdate from './components/FirstLoginUpdate';
import { 
  Building2, 
  Home, 
  MapPin, 
  Compass, 
  FileText, 
  Users, 
  GraduationCap, 
  Settings, 
  Plus, 
  UserPlus, 
  Menu, 
  X,
  FileCheck2,
  Map,
  ShieldCheck,
  Phone,
  Heart,
  MessageSquare,
  Coins,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type TabType = 'dashboard' | 'families' | 'services' | 'map' | 'reports' | 'donations' | 'contact' | 'directory' | 'admin-settings';

export default function App() {
  const [currentUser, setCurrentUser] = useState<any | null>(() => {
    const saved = localStorage.getItem('auth_user_v1');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [registerSuccessMessage, setRegisterSuccessMessage] = useState<string | null>(null);

  // Sync user profile in real-time with the database
  useEffect(() => {
    if (currentUser && currentUser.email) {
      const syncUserProfile = async () => {
        try {
          const res = await fetch('/api/users');
          if (res.ok) {
            const usersList = await res.json();
            const matched = usersList.find((u: any) => u.email.toLowerCase() === currentUser.email.toLowerCase());
            if (matched) {
              if (matched.role !== currentUser.role || matched.isActivated !== currentUser.isActivated || matched.name !== currentUser.name) {
                setCurrentUser(matched);
              }
            }
          }
        } catch (e) {
          console.warn('Sync profile failed', e);
        }
      };
      syncUserProfile();
      const profileInterval = setInterval(syncUserProfile, 8000);
      return () => clearInterval(profileInterval);
    }
  }, [currentUser?.email, currentUser?.role, currentUser?.name, currentUser?.isActivated]);
  
  // Verify if current logged-in user is an authorized admin
  const getIsAdminUser = (): boolean => {
    if (!currentUser) return false;
    const email = currentUser.email?.toLowerCase();
    
    // Main owner (helmi / helmialkhateeb@gmail.com)
    if (email === 'helmialkhateeb@gmail.com' || email === 'helmi') return true;

    // Check against custom role
    const role = currentUser.role || 'browser';
    return ['super-admin', 'admin', 'delegate', 'supervisor'].includes(role);
  };

  const isAdmin = getIsAdminUser();
  const isSuperAdmin = currentUser?.email?.toLowerCase() === 'helmialkhateeb@gmail.com' || currentUser?.email?.toLowerCase() === 'helmi' || currentUser?.role === 'super-admin' || currentUser?.role === 'admin';
  const isUnapprovedDelegate = currentUser && currentUser.role === 'delegate' && (!currentUser.isActivated || currentUser.status !== 'approved');

  // Get active user's details (role and permissions)
  const getUserRoleAndPermissions = () => {
    if (!currentUser) return { role: 'browser', permissions: { families: 'read', services: 'read', donations: 'read' } as const };
    const email = currentUser.email?.toLowerCase();

    // Super Admin / Owner
    if (email === 'helmialkhateeb@gmail.com' || email === 'helmi' || currentUser.role === 'super-admin') {
      return { 
        role: 'Admin', 
        permissions: { families: 'write', services: 'write', donations: 'write' } as const
      };
    }

    const role = currentUser.role || 'browser';

    if (role === 'admin') {
      return {
        role: 'Admin',
        permissions: { families: 'write', services: 'write', donations: 'write' } as const
      };
    }

    if (role === 'supervisor') {
      return {
        role: 'Admin',
        permissions: { families: 'write', services: 'write', donations: 'read' } as const
      };
    }

    if (role === 'delegate') {
      return {
        role: 'User',
        permissions: { families: 'read', services: 'read', donations: 'write' } as const
      };
    }

    // Default browser / reader
    return { 
      role: 'User', 
      permissions: { families: 'read', services: 'read', donations: 'read' } as const
    };
  };

  const { role: userRole, permissions: userPermissions } = getUserRoleAndPermissions();
  const isAdministrative = isSuperAdmin || (isAdmin && (userRole === 'Admin' || userRole === 'Manager' || currentUser?.role === 'admin' || currentUser?.role === 'supervisor'));

  const handleLoginSuccess = (email: string) => {
    // If we only get email, look it up, or if LoginModal passes the user object we can do both!
    // We'll update handleLoginSuccess to check if we received an object or a string
    if (typeof email === 'object' && email !== null) {
      setCurrentUser(email);
    } else {
      // Look up profile
      fetch('/api/users')
        .then(res => res.json())
        .then(usersList => {
          const matched = usersList.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
          if (matched) {
            setCurrentUser(matched);
          } else {
            setCurrentUser({ email });
          }
        })
        .catch(() => {
          setCurrentUser({ email });
        });
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('auth_user_v1');
  };

  const mapOldNeighborhood = (n: string): string => {
    if (!n) return n;
    let cleanN = n.trim();
    if (cleanN === 'الزيله') cleanN = 'الزيلة';
    if (cleanN === 'الصفاء') cleanN = 'الصفا';

    const mapping: Record<string, string> = {
      'محلة النور': 'الزيلة',
      'حي النور': 'الزيلة',
      'محلة الياسمين': 'الاكمة',
      'حي الياسمين': 'الاكمة',
      'محلة الروابي': 'الدمنة',
      'حي الروابي': 'الدمنة',
      'محلة الأندلس': 'البقير',
      'حي الأندلس': 'البقير',
      'محلة البساتين': 'الرميمية',
      'حي البساتين': 'الرميمية',
      'محلة الريان': 'الصفا',
      'حي الريان': 'الصفا'
    };
    return mapping[cleanN] || cleanN;
  };

  const [families, setFamilies] = useState<Family[]>(() => {
    const saved = localStorage.getItem('local_families_v1');
    if (saved) {
      try {
        const parsed: Family[] = JSON.parse(saved);
        return parsed.map(f => ({
          ...f,
          neighborhood: mapOldNeighborhood(f.neighborhood)
        }));
      } catch (e) {
        return INITIAL_FAMILIES;
      }
    }
    return INITIAL_FAMILIES;
  });
  
  const [services, setServices] = useState<LocalService[]>(() => {
    const saved = localStorage.getItem('local_services_v2');
    if (saved) {
      try {
        const parsed: LocalService[] = JSON.parse(saved);
        return parsed.map(s => ({
          ...s,
          neighborhood: mapOldNeighborhood(s.neighborhood)
        }));
      } catch (e) {
        return INITIAL_SERVICES;
      }
    }
    return INITIAL_SERVICES;
  });

  const hasLoadedFromServer = useRef(false);

  // Load from server on mount
  useEffect(() => {
    const loadServerFamilies = async () => {
      try {
        const response = await fetch('/api/families');
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            setFamilies(data);
          } else {
            // Seed server with current state if server file is empty
            const saved = localStorage.getItem('local_families_v1');
            const initialToUse = saved ? JSON.parse(saved) : INITIAL_FAMILIES;
            await fetch('/api/families', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ families: initialToUse })
            });
            setFamilies(initialToUse);
          }
        }
      } catch (e) {
        console.error('Failed to load families from server:', e);
      } finally {
        hasLoadedFromServer.current = true;
      }
    };
    loadServerFamilies();
  }, []);

  // Save changes to localStorage & Sync to Server
  useEffect(() => {
    localStorage.setItem('local_families_v1', JSON.stringify(families));

    if (hasLoadedFromServer.current) {
      const syncFamilies = async () => {
        try {
          await fetch('/api/families', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ families })
          });
        } catch (e) {
          console.error('Failed to sync families to server:', e);
        }
      };
      syncFamilies();
    }
  }, [families]);

  useEffect(() => {
    localStorage.setItem('local_services_v2', JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('auth_user_v1', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('auth_user_v1');
    }
  }, [currentUser]);

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [censusSubView, setCensusSubView] = useState<'register' | 'reports' | 'google-sheets'>('register');
  const [isExploreModalOpen, setIsExploreModalOpen] = useState(false);

  useEffect(() => {
    if (activeTab === 'admin-settings' && !isSuperAdmin) {
      setActiveTab('dashboard');
    }
  }, [activeTab, isSuperAdmin]);

  // Global Real-time Notifications Polling System
  const [activeToasts, setActiveToasts] = useState<any[]>([]);
  const lastFetchedRef = useRef<string[]>([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications');
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0) {
            // Find notifications not seen in this session
            const newNotifs = list.filter(notif => !lastFetchedRef.current.includes(notif.id));
            if (newNotifs.length > 0) {
              if (lastFetchedRef.current.length === 0) {
                // Seed initial state silently to avoid startup spam
                lastFetchedRef.current = list.map(n => n.id);
                return;
              }
              // Push new toasts
              setActiveToasts(prev => [...newNotifs, ...prev]);
              lastFetchedRef.current = list.map(n => n.id);
            }
          }
        }
      } catch (e) {
        console.warn('Notifications polling failed', e);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 4000);
    return () => clearInterval(interval);
  }, []);

  // Add/Edit states
  const [isAddingFamily, setIsAddingFamily] = useState(false);
  const [isAddingMemberOnly, setIsAddingMemberOnly] = useState(false);
  const [editingFamily, setEditingFamily] = useState<Family | null>(null);
  const [isAddingService, setIsAddingService] = useState(false);
  const [isMovingMember, setIsMovingMember] = useState(false);
  const [editingService, setEditingService] = useState<LocalService | null>(null);

  // Focus item for the map
  const [mapInitialCoords, setMapInitialCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Transition for tab changes
  const [isPending, startTransition] = useTransition();

  // Dynamic unified values for simplified family edit
  const uniqueSurnames = React.useMemo(() => {
    const names = (families || [])
      .map(f => f.familyName?.trim())
      .filter(Boolean);
    return (Array.from(new Set(names)) as string[]).sort((a, b) => a.localeCompare(b, 'ar'));
  }, [families]);

  const uniqueNeighborhoods = React.useMemo(() => {
    const names = (families || [])
      .map(f => f.neighborhood?.trim())
      .filter(Boolean);
    return (Array.from(new Set(names)) as string[]).sort((a, b) => a.localeCompare(b, 'ar'));
  }, [families]);

  const residenceOptions = React.useMemo(() => {
    const options = new Set<string>(['دائمة', 'مؤقتة', 'نازح']);
    (families || []).forEach(f => {
      if (f.residence && f.residence.trim()) {
        options.add(f.residence.trim());
      }
    });
    return (Array.from(options) as string[]).sort((a, b) => a.localeCompare(b, 'ar'));
  }, [families]);

  const handleTabChange = (tab: TabType) => {
    startTransition(() => {
      setActiveTab(tab);
      // Reset forms when switching tabs
      setIsAddingFamily(false);
      setEditingFamily(null);
      setIsAddingService(false);
      setEditingService(null);
      setMapInitialCoords(null);
    });
  };

  // --- Family CRUD Handlers ---
  const handleSaveFamily = (savedFamily: Family) => {
    if (!isAdmin) return;
    if (editingFamily || families.some(f => f.id === savedFamily.id)) {
      // Edit mode or updating existing family
      setFamilies(families.map(f => f.id === savedFamily.id ? savedFamily : f));
    } else {
      // Create mode
      setFamilies([savedFamily, ...families]);
    }
    setIsAddingFamily(false);
    setIsAddingMemberOnly(false);
    setEditingFamily(null);
    setMapInitialCoords(null);
    // Switch to families register
    setActiveTab('families');
  };

  const handleConfirmMove = (moveData: {
    selectedMemberId: string | null;
    memberName: string;
    memberGender: 'ذكر' | 'أنثى';
    memberAge: number;
    memberBirthDate: string;
    memberPhone: string;
    memberEducation: any;
    memberOccupation: string;
    memberHealthStatus: any;
    memberNotes: string;
    neighborhood: string;
    familyName: string;
    moveType: 'new_family' | 'marriage_outside' | 'out_governorate';
    transferDate: string;
    notes: string;
    newFamilyDetails?: {
      address: string;
      housingType: any;
      monthlyIncome: string;
      supportStatus: any;
      residence: string;
    };
    selectedDependents?: { memberId: string; relationship: any }[];
    targetGovernorate?: string;
  }) => {
    if (!isAdmin) return;
    
    // 1. Clone current list of families
    let updatedFamilies = [...families];

    // If an existing member is selected, remove them from their original family
    if (moveData.selectedMemberId) {
      updatedFamilies = updatedFamilies.map(f => {
        const filtered = (f.members || []).filter(m => m.id !== moveData.selectedMemberId);
        return { ...f, members: filtered };
      });
    }

    // Remove other checked dependents from their original families
    if (moveData.selectedDependents && moveData.selectedDependents.length > 0) {
      const depIds = moveData.selectedDependents.map(d => d.memberId);
      updatedFamilies = updatedFamilies.map(f => {
        const filtered = (f.members || []).filter(m => !depIds.includes(m.id));
        return { ...f, members: filtered };
      });
    }

    if (moveData.moveType === 'new_family') {
      // Create breadwinner member object
      const primaryMember = {
        id: moveData.selectedMemberId || `mem-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: moveData.memberName,
        relationship: 'عائل' as const,
        gender: moveData.memberGender,
        age: moveData.memberAge,
        birthDate: moveData.memberBirthDate || undefined,
        neighborhood: moveData.neighborhood,
        phone: moveData.memberPhone || undefined,
        education: moveData.memberEducation,
        occupation: moveData.memberOccupation || 'غير محدد',
        healthStatus: moveData.memberHealthStatus,
        notes: moveData.memberNotes || undefined
      };

      // Gather dependents and apply new relationships
      const dependentMembers: any[] = [];
      if (moveData.selectedDependents && moveData.selectedDependents.length > 0) {
        moveData.selectedDependents.forEach(dep => {
          let foundMember: any = null;
          families.forEach(f => {
            const m = (f.members || []).find(mem => mem.id === dep.memberId);
            if (m) foundMember = m;
          });

          if (foundMember) {
            dependentMembers.push({
              ...foundMember,
              relationship: dep.relationship,
              neighborhood: moveData.neighborhood
            });
          }
        });
      }

      // Initialize new family object
      const newFamilyId = `fam-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const newFamily: Family = {
        id: newFamilyId,
        familyName: moveData.familyName,
        breadwinnerName: `${moveData.memberName} (جوال: ${moveData.memberPhone || 'غير مسجل'})`,
        phone: moveData.memberPhone || '',
        neighborhood: moveData.neighborhood,
        address: moveData.newFamilyDetails?.address || 'غير محدد',
        housingType: moveData.newFamilyDetails?.housingType || 'شعبي',
        monthlyIncome: moveData.newFamilyDetails?.monthlyIncome || '3000 - 6000 ريال',
        supportStatus: moveData.newFamilyDetails?.supportStatus || 'تحت الدراسة',
        residence: moveData.newFamilyDetails?.residence || 'دائمة',
        registeredAt: moveData.transferDate,
        latitude: 40 + Math.random() * 20,
        longitude: 40 + Math.random() * 20,
        notes: `تأسست بقرار نقل سكاني بتاريخ ${moveData.transferDate}. ملاحظات: ${moveData.notes || 'لا يوجد'}`,
        members: [primaryMember, ...dependentMembers]
      };

      updatedFamilies = [newFamily, ...updatedFamilies];

      // Send real-time notification
      fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notification: {
            title: 'حركة سكان: تكوين أسرة جديدة',
            message: `تم فصل الفرد [${moveData.memberName}] وتأسيس أسرة جديدة باسم عائلة [${moveData.familyName}] بالمحلة [${moveData.neighborhood}] بتاريخ ${moveData.transferDate}.`
          }
        })
      }).catch(() => {});

    } else if (moveData.moveType === 'marriage_outside') {
      if (moveData.selectedMemberId) {
        const origFamily = families.find(f => (f.members || []).some(m => m.id === moveData.selectedMemberId));
        if (origFamily) {
          updatedFamilies = updatedFamilies.map(f => {
            if (f.id === origFamily.id) {
              const currentNotes = f.notes || '';
              return {
                ...f,
                notes: `${currentNotes}\n* [أرشيف حركة السكان - زواج خارج القرية]: غادر الفرد [${moveData.memberName}] بسبب زواج خارج القرية بتاريخ ${moveData.transferDate}. مبررات وملاحظات المغادرة: ${moveData.notes || 'لا يوجد'}`.trim()
              };
            }
            return f;
          });
        }
      }

      fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notification: {
            title: 'حركة سكان: زواج لخارج القرية',
            message: `تم توثيق زواج ومغادرة الفرد [${moveData.memberName}] من عائلة [${moveData.familyName}] لخارج القرية بتاريخ ${moveData.transferDate}.`
          }
        })
      }).catch(() => {});

    } else if (moveData.moveType === 'out_governorate') {
      if (moveData.selectedMemberId) {
        const origFamily = families.find(f => (f.members || []).some(m => m.id === moveData.selectedMemberId));
        if (origFamily) {
          updatedFamilies = updatedFamilies.map(f => {
            if (f.id === origFamily.id) {
              const currentNotes = f.notes || '';
              return {
                ...f,
                notes: `${currentNotes}\n* [أرشيف حركة السكان - انتقال لمحافظة أخرى]: انتقل الفرد [${moveData.memberName}] رسمياً لمحافظة [${moveData.targetGovernorate || 'أخرى'}] بتاريخ ${moveData.transferDate}. مبررات وملاحظات الانتقال: ${moveData.notes || 'لا يوجد'}`.trim()
              };
            }
            return f;
          });
        }
      }

      fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notification: {
            title: 'حركة سكان: انتقال لمحافظة أخرى',
            message: `انتقل الفرد [${moveData.memberName}] من عائلة [${moveData.familyName}] رسمياً لمحافظة [${moveData.targetGovernorate || 'أخرى'}] بتاريخ ${moveData.transferDate}.`
          }
        })
      }).catch(() => {});
    }

    setFamilies(updatedFamilies);
    setIsMovingMember(false);
  };

  const handleEditFamily = (family: Family) => {
    if (!isAdmin) return;
    setEditingFamily(family);
    setIsAddingFamily(false);
  };

  const handleDeleteFamily = (id: string) => {
    if (!isAdmin) return;
    if (window.confirm('هل أنت متأكد من حذف سجل هذه العائلة بالكامل؟ لا يمكن التراجع عن هذا الإجراء.')) {
      setFamilies(families.filter(f => f.id !== id));
    }
  };

  // --- Service CRUD Handlers ---
  const logActivity = async (action: string, actionType: string = 'أخرى', section: string = 'أخرى') => {
    if (!currentUser) return;
    try {
      await fetch('/api/activity-log/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: `${currentUser.name || ''} ${currentUser.surname || ''}`.trim() || currentUser.email || 'عضو المنصة',
          userEmail: currentUser.email,
          action,
          actionType,
          section
        })
      });
    } catch (e) {
      console.error('Failed to log activity:', e);
    }
  };

  const handleSaveService = (savedService: LocalService) => {
    if (!isAdmin) return;
    if (editingService) {
      setServices(services.map(s => s.id === savedService.id ? savedService : s));
      logActivity(`قام بتعديل وتحديث بيانات المرفق الخدمي: [${savedService.name}]`, 'تعديل', 'الخدمات');
    } else {
      setServices([savedService, ...services]);
      logActivity(`قام بإضافة مرفق خدمي جديد للمنظومة باسم: [${savedService.name}]`, 'إضافة', 'الخدمات');
    }
    setIsAddingService(false);
    setEditingService(null);
    setActiveTab('services');
  };

  const handleEditService = (service: LocalService) => {
    if (!isAdmin) return;
    setEditingService(service);
    setIsAddingService(false);
  };

  const handleDeleteService = (id: string) => {
    if (!isAdmin) return;
    const targetService = services.find(s => s.id === id);
    if (window.confirm('هل أنت متأكد من حذف هذا المرفق الخدمي من السجل؟')) {
      setServices(services.filter(s => s.id !== id));
      if (targetService) {
        logActivity(`قام بحذف سجل المرفق الخدمي من المنظومة: [${targetService.name}]`, 'حذف', 'الخدمات');
      }
    }
  };

  // --- Map Coordinates Helpers ---
  const handleMapClickAdd = (lat: number, lng: number) => {
    if (!isAdmin) {
      alert('يرجى تسجيل الدخول كمسؤول أولاً لإضافة عائلات جديدة من الخريطة.');
      setIsLoginOpen(true);
      return;
    }
    setMapInitialCoords({ lat, lng });
    setIsAddingFamily(true);
    setEditingFamily(null);
  };

  // Switch to map and focus on selected item
  const handleLocateFamilyOnMap = (family: Family) => {
    setActiveTab('map');
    // Scroll to map container smoothly
    setTimeout(() => {
      const container = document.getElementById('map-container');
      if (container) {
        container.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleLocateServiceOnMap = (service: LocalService) => {
    setActiveTab('map');
    setTimeout(() => {
      const container = document.getElementById('map-container');
      if (container) {
        container.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-700 antialiased selection:bg-blue-600 selection:text-white pb-12" id="app-wrapper">
      
      {/* Floating Contact/Communication Button (Always Visible Global Top-Left) */}
      <div className="fixed top-5 left-5 z-50">
        <button
          onClick={() => handleTabChange('contact')}
          title="اتصال وتواصل"
          className="relative group w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer"
        >
          {/* Pulsating shadow ring */}
          <span className="absolute inset-0 rounded-full bg-pink-500/30 animate-ping opacity-75"></span>
          
          <Phone className="w-5.5 h-5.5 group-hover:rotate-12 transition-transform duration-200" />
          
          {/* Tooltip text */}
          <span className="absolute right-14 top-1/2 -translate-y-1/2 bg-white text-slate-900 font-extrabold border border-slate-200 text-[11px] font-bold py-1.5 px-3 rounded-xl shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            اتصال وتواصل بالمسؤولين
          </span>
        </button>
      </div>

      {/* Top Main Navigation Header */}
      <header className="bg-stone-100 text-slate-900 font-extrabold shadow-sm relative sm:sticky top-0 z-40 transition-all border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-6 pb-4 sm:py-0 sm:h-20 gap-3">
            {/* Logo and App Title */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.4)] font-bold shadow-sm shrink-0">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-extrabold text-sm sm:text-base md:text-lg tracking-tight leading-snug text-slate-900 font-extrabold">
                  المنصة الرقمية لقرية ذي الجمال قدس
                </h1>
              </div>
            </div>

            {/* Quick Metrics & Actions on Desktop & Mobile */}
            <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 text-xs text-slate-700">
              <div className="hidden md:flex items-center gap-2 border-r border-slate-200 pr-4 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                <span className="font-semibold text-slate-900 font-extrabold">النظام نشط ومؤمن</span>
              </div>
              
              {/* Authenticated user indicator / Login buttons */}
              <div className="flex items-center gap-2">
                {currentUser ? (
                  <div className="flex items-center gap-2">
                    <div className="bg-blue-600/10 border border-blue-600/20 rounded-xl px-2.5 py-1 sm:px-3 sm:py-1.5 flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      <div className="text-right">
                        <div className="text-[9px] text-blue-600 font-extrabold leading-none">
                          {currentUser.role === 'super-admin' ? 'المشرف العام 🛡️' :
                           currentUser.role === 'admin' ? 'مدير شؤون القرية 🏛️' :
                           currentUser.role === 'delegate' ? 'مندوب المساهمات 🪙' :
                           currentUser.role === 'supervisor' ? 'مشرف التعداد 📋' :
                           currentUser.role === 'browser' ? 'متصفح 👥' : 'عضو البوابة 👤'}
                        </div>
                        <div className="text-[10px] sm:text-xs text-slate-900 font-extrabold font-bold max-w-[120px] truncate" title={currentUser.email}>
                          {currentUser.name ? `${currentUser.name} ${currentUser.surname || ''}` : currentUser.email}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsChangePasswordOpen(true)}
                      className="bg-amber-50 hover:bg-amber-100/80 text-amber-950 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-[10px] sm:text-xs font-extrabold transition-all border border-slate-200/80 cursor-pointer shadow-3xs flex items-center gap-1"
                    >
                      تغيير كلمة المرور
                    </button>
                    <button
                      onClick={handleLogout}
                      className="bg-[#FFF5EB] hover:bg-[#FFF5EB]/80 text-amber-900 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-[10px] sm:text-xs font-extrabold transition-all border border-slate-200/80 cursor-pointer shadow-3xs"
                    >
                      خروج
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsLoginOpen(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.4)] font-bold px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs font-black transition-all border border-blue-600 cursor-pointer shadow-md hover:scale-102 flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      تسجيل الدخول
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Primary Sub-Navigation Tabs (Unified Grid Layout / Focused Sub-Section Header) */}
      {!isUnapprovedDelegate ? (
        <div className="bg-stone-100/95 backdrop-blur-md border-b border-slate-200 sticky top-0 sm:top-20 z-30 shadow-sm py-2" id="navigation-box">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-2">
          
          {activeTab === 'dashboard' ? (
            <nav className="grid grid-cols-3 gap-2 sm:gap-3 w-full">
              <button
                onClick={() => handleTabChange('dashboard')}
                className={`h-11 px-2.5 rounded-xl text-[11px] sm:text-xs md:text-sm font-extrabold transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer border ${
                  activeTab === 'dashboard'
                    ? 'bg-blue-600 text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.4)] font-bold border-blue-600 shadow-md ring-2 ring-blue-600/30 scale-102'
                    : 'bg-white/80 text-slate-600 border-stone-200 hover:text-slate-900 font-extrabold hover:bg-blue-50/40 hover:border-blue-600/50 shadow-3xs hover:shadow-2xs opacity-85 hover:opacity-100 font-medium'
                }`}
              >
                <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                الرئيسية
              </button>

              <button
                onClick={() => handleTabChange('families')}
                className={`h-11 px-2.5 rounded-xl text-[11px] sm:text-xs md:text-sm font-extrabold transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer border ${
                  activeTab === 'families'
                    ? 'bg-blue-600 text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.4)] font-bold border-blue-600 shadow-md ring-2 ring-blue-600/30 scale-102'
                    : 'bg-white/80 text-slate-600 border-stone-200 hover:text-slate-900 font-extrabold hover:bg-blue-50/40 hover:border-blue-600/50 shadow-3xs hover:shadow-2xs opacity-85 hover:opacity-100 font-medium'
                }`}
              >
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                التعداد السكاني
              </button>

              <button
                onClick={() => handleTabChange('donations')}
                className={`h-11 px-2.5 rounded-xl text-[11px] sm:text-xs md:text-sm font-extrabold transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer border ${
                  activeTab === 'donations'
                    ? 'bg-blue-600 text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.4)] font-bold border-blue-600 shadow-md ring-2 ring-blue-600/30 scale-102'
                    : 'bg-white/80 text-slate-600 border-stone-200 hover:text-slate-900 font-extrabold hover:bg-blue-50/40 hover:border-blue-600/50 shadow-3xs hover:shadow-2xs opacity-85 hover:opacity-100 font-medium'
                }`}
              >
                <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500 fill-red-500/10" />
                التبرعات
              </button>

              <button
                onClick={() => handleTabChange('services')}
                className={`h-11 px-2.5 rounded-xl text-[11px] sm:text-xs md:text-sm font-extrabold transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer border ${
                  activeTab === 'services'
                    ? 'bg-blue-600 text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.4)] font-bold border-blue-600 shadow-md ring-2 ring-blue-600/30 scale-102'
                    : 'bg-white/80 text-slate-600 border-stone-200 hover:text-slate-900 font-extrabold hover:bg-blue-50/40 hover:border-blue-600/50 shadow-3xs hover:shadow-2xs opacity-85 hover:opacity-100 font-medium'
                }`}
              >
                <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                الخدمات
              </button>

              {/* Merged Section Button: الخريطة ودليل القرية */}
              <button
                onClick={() => setIsExploreModalOpen(true)}
                className="h-11 px-2.5 rounded-xl text-[11px] sm:text-xs md:text-sm font-extrabold transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer border bg-white/80 text-slate-600 border-stone-200 hover:text-slate-900 font-extrabold hover:bg-blue-50/40 hover:border-blue-600/50 shadow-3xs hover:shadow-2xs opacity-85 hover:opacity-100 font-medium"
              >
                <Compass className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 animate-pulse" />
                الخريطة والدليل
              </button>

              <button
                onClick={() => handleTabChange('contact')}
                className={`h-11 px-2.5 rounded-xl text-[11px] sm:text-xs md:text-sm font-extrabold transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer border ${
                  activeTab === 'contact'
                    ? 'bg-blue-600 text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.4)] font-bold border-blue-600 shadow-md ring-2 ring-blue-600/30 scale-102'
                    : 'bg-white/80 text-slate-600 border-stone-200 hover:text-slate-900 font-extrabold hover:bg-blue-50/40 hover:border-blue-600/50 shadow-3xs hover:shadow-2xs opacity-85 hover:opacity-100 font-medium'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-500" />
                التواصل
              </button>

              {isSuperAdmin && (
                <button
                  onClick={() => handleTabChange('admin-settings')}
                  className="col-span-3 h-11 px-2.5 rounded-xl text-[11px] sm:text-xs md:text-sm font-extrabold transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer border bg-white/80 text-slate-600 border-stone-200 hover:text-slate-900 font-extrabold hover:bg-blue-50/40 hover:border-blue-600/50 shadow-3xs hover:shadow-2xs opacity-85 hover:opacity-100 font-medium"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-500 fill-amber-500/10 animate-pulse" />
                  إعدادات المدير العام للنظام
                </button>
              )}
            </nav>
          ) : (
            /* Sub-section View Header with Back to Home button */
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 py-3 sm:py-2 bg-white border border-slate-200 rounded-2xl px-4 shadow-sm" id="subview-header">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse shrink-0"></span>
                <h3 className="text-xs font-extrabold text-slate-900 font-extrabold truncate">
                  القسم النشط: {
                    activeTab === 'families' ? 'التعداد السكاني والمساكن' :
                    activeTab === 'services' ? 'إدارة الخدمات والمرافق' :
                    activeTab === 'map' ? 'الخريطة الجغرافية التفاعلية' :
                    activeTab === 'directory' ? 'دليل خدمات القرية' :
                    activeTab === 'donations' ? 'قنوات التبرع والمساهمات' :
                    activeTab === 'contact' ? 'صندوق المقترحات والتواصل المباشر' :
                    activeTab === 'admin-settings' ? 'إعدادات المدير العام للنظام' : 'تفاصيل القسم الفرعي'
                  }
                </h3>
              </div>
              <button
                onClick={() => handleTabChange('dashboard')}
                className="w-full sm:w-auto justify-center bg-blue-600 hover:bg-blue-700 text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.4)] font-bold px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-150 flex items-center gap-1.5 cursor-pointer shadow-md border border-blue-600"
              >
                <Home className="w-3.5 h-3.5" />
                العودة للرئيسية
              </button>
            </div>
          )}

          {/* Quick action buttons depending on the active view (Only for Admin) */}
          {isAdmin && ((activeTab === 'families' && !isAddingFamily && !editingFamily) || (activeTab === 'services' && !isAddingService && !editingService)) && (
            <div className="flex justify-center items-center gap-2 pt-0.5">
              {activeTab === 'families' && (
                <>
                  <button
                    onClick={() => {
                      setIsAddingFamily(true);
                      setIsAddingMemberOnly(false);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.4)] font-bold px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-xs transition-all cursor-pointer border border-blue-600"
                  >
                    <Plus className="w-3 h-3" />
                    تسجيل أسرة بالتعداد
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingFamily(true);
                      setIsAddingMemberOnly(true);
                    }}
                    className="bg-blue-50 hover:bg-[#DDE5B6] text-blue-600 px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-xs transition-all cursor-pointer border border-blue-200"
                  >
                    <UserPlus className="w-3 h-3" />
                    إضافة فرد جديد
                  </button>
                  <button
                    onClick={() => {
                      setIsMovingMember(true);
                    }}
                    className="bg-slate-50 hover:bg-stone-100 text-[#A98467] px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-xs transition-all cursor-pointer border border-slate-200"
                  >
                    <Layers className="w-3 h-3 text-[#A98467]" />
                    نقل فرد
                  </button>
                </>
              )}
              {activeTab === 'services' && (
                <button
                  onClick={() => setIsAddingService(true)}
                  className="bg-[#A98467] hover:bg-[#8F6C50] text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.4)] font-bold px-3.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-xs transition-all cursor-pointer border border-[#A98467]"
                >
                  <Plus className="w-3 h-3" />
                  إضافة مرفق/مشروع خدمي
                </button>
              )}
            </div>
          )}

        </div>
      </div>
      ) : null}

      {/* Main Container Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex-1 w-full" id="main-workspace">
        
        {/* Render Form States or Main Active Tab */}
        <AnimatePresence mode="wait">
          
          {isUnapprovedDelegate ? (
            <motion.div
              key="unapproved-panel"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <UnapprovedDelegatePanel
                currentUser={currentUser}
                onProfileUpdated={(updatedUser) => {
                  const fullUser = { ...currentUser, ...updatedUser };
                  setCurrentUser(fullUser);
                  localStorage.setItem('auth_user_v1', JSON.stringify(fullUser));
                }}
                onLogout={handleLogout}
              />
            </motion.div>
          ) : isAddingFamily ? (
            <motion.div
              key="family-form"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <FamilyForm
                family={null}
                initialCoords={mapInitialCoords}
                onSave={handleSaveFamily}
                onCancel={() => {
                  setIsAddingFamily(false);
                  setIsAddingMemberOnly(false);
                  setEditingFamily(null);
                  setMapInitialCoords(null);
                }}
                families={families}
                setFamilies={setFamilies}
                isAddingMemberOnly={isAddingMemberOnly}
              />
            </motion.div>
          ) 
          
          /* Service Add/Edit Form view */
          : (isAddingService || editingService) ? (
            <motion.div
              key="service-form"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <ServiceForm
                service={editingService}
                onSave={handleSaveService}
                onCancel={() => {
                  setIsAddingService(false);
                  setEditingService(null);
                }}
              />
            </motion.div>
          ) 
          
          /* Normal Tab views */
          : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              {activeTab === 'dashboard' && (
                <Dashboard 
                  families={families} 
                  services={services} 
                  onLocateServiceOnMap={handleLocateServiceOnMap}
                  onNavigateTab={handleTabChange}
                />
              )}

              {activeTab === 'families' && (
                <div className="space-y-6 bg-indigo-50/40 border border-indigo-200 rounded-3xl p-4 sm:p-6 shadow-sm">
                  {/* Integrated Sub-Navigation for Census (التعداد السكاني) */}
                  <div className="bg-stone-100 p-2 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                      <h3 className="text-xs font-bold text-slate-900 font-extrabold">تصفح التعداد والتقارير الموحدة للقرية</h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        onClick={() => setCensusSubView('register')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                          censusSubView === 'register'
                            ? 'bg-blue-600 text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.4)] font-bold shadow-2xs'
                            : 'bg-white/80 border border-slate-200 text-slate-500 hover:text-slate-900 font-extrabold'
                        }`}
                      >
                        سجل الأسر والمواطنين
                      </button>
                      <button
                        onClick={() => setCensusSubView('google-sheets')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                          censusSubView === 'google-sheets'
                            ? 'bg-blue-600 text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.4)] font-bold shadow-2xs'
                            : 'bg-white/80 border border-slate-200 text-slate-500 hover:text-slate-900 font-extrabold'
                        }`}
                      >
                        جدول Google Sheets المدمج
                      </button>
                      <button
                        onClick={() => setCensusSubView('reports')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                          censusSubView === 'reports'
                            ? 'bg-blue-600 text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.4)] font-bold shadow-2xs'
                            : 'bg-white/80 border border-slate-200 text-slate-500 hover:text-slate-900 font-extrabold'
                        }`}
                      >
                        التقارير والمؤشرات الإحصائية
                      </button>
                    </div>
                  </div>

                  {censusSubView === 'register' && (
                    <FamilyRegister
                      families={families}
                      setFamilies={setFamilies}
                      onAddFamily={() => setIsAddingFamily(true)}
                      onEditFamily={handleEditFamily}
                      onDeleteFamily={handleDeleteFamily}
                      onLocateOnMap={handleLocateFamilyOnMap}
                      isAdmin={isAdmin}
                      isSuperAdmin={isSuperAdmin}
                      userRole={userRole}
                      userPermissions={userPermissions}
                      currentUser={currentUser}
                    />
                  )}

                  {censusSubView === 'google-sheets' && (
                    <GoogleSheetsData 
                      isAdmin={isAdministrative} 
                      families={families}
                      setFamilies={setFamilies}
                    />
                  )}

                  {censusSubView === 'reports' && (
                    <StatsReports families={families} />
                  )}
                </div>
              )}

              {activeTab === 'services' && (
                <div className="bg-amber-50/40 border border-amber-200 rounded-3xl p-4 sm:p-6 shadow-sm">
                  <ServiceRegister
                  services={services}
                  onAddService={() => setIsAddingService(true)}
                  onEditService={handleEditService}
                  onDeleteService={handleDeleteService}
                  onLocateOnMap={handleLocateServiceOnMap}
                  isAdmin={isAdmin}
                  />
                </div>
              )}

              {activeTab === 'map' && (
                <div className="space-y-4">
                  <LocalMap
                    families={families}
                    services={services}
                    onSelectFamily={handleEditFamily}
                    onSelectService={handleEditService}
                    onMapClickAdd={handleMapClickAdd}
                    isAdmin={isAdmin}
                  />
                </div>
              )}

              {activeTab === 'directory' && (
                <VillageDirectory
                  services={services}
                  onLocateOnMap={handleLocateServiceOnMap}
                />
              )}

              {activeTab === 'donations' && (
                <div className="bg-teal-50/40 border border-teal-200 rounded-3xl p-4 sm:p-6 shadow-sm">
                  <Donations 
                  onBackToHome={() => setActiveTab('dashboard')} 
                  isAdmin={isAdmin} 
                  userRole={userRole as 'Admin' | 'Manager' | 'User'} 
                  currentUserEmail={currentUser?.email || ''} 
                  currentUser={currentUser}
                  />
                </div>
              )}

              {activeTab === 'contact' && (
                <Contact onBackToHome={() => setActiveTab('dashboard')} />
              )}

              {activeTab === 'admin-settings' && isSuperAdmin && (
                <SuperAdminSettings 
                  onBackToHome={() => setActiveTab('dashboard')} 
                  currentUserEmail={currentUser?.email || ''} 
                />
              )}
            </motion.div>
          )}

        </AnimatePresence>

      </main>

      {/* Explore Map & Directory Independent Modal Window */}
      <AnimatePresence>
        {isExploreModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans text-right" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-slate-50 rounded-3xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden p-6 relative"
            >
              {/* Close Button */}
              <button
                onClick={() => setIsExploreModalOpen(false)}
                className="absolute left-4 top-4 p-1.5 rounded-xl text-slate-500 hover:text-slate-900 font-extrabold hover:bg-stone-100 transition-all cursor-pointer border border-slate-200/50"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6 space-y-2">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 font-extrabold flex items-center gap-2">
                  <Compass className="w-5.5 h-5.5 text-blue-600" />
                  استكشاف معالم ودليل قرية ذي الجمال قدس
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  يرجى تحديد الوجهة التي تود الانتقال إليها لتصفح بيانات القرية التفاعلية أو الاستعلام عن دليلها الخدمي الموحد.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Option 1: Interactive Map */}
                <button
                  onClick={() => {
                    setIsExploreModalOpen(false);
                    handleTabChange('map');
                  }}
                  className="group bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-2xl p-4 transition-all duration-200 text-right cursor-pointer flex items-start gap-3.5 shadow-3xs hover:shadow-xs"
                >
                  <div className="w-11 h-11 rounded-xl bg-blue-50 group-hover:bg-white text-blue-600 flex items-center justify-center shrink-0 shadow-3xs transition-colors">
                    <Map className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 font-extrabold group-hover:text-blue-600">
                      الخريطة الجغرافية التفاعلية بالقرية
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      عرض وتحديث المواقع الجغرافية لعائلات ومساكن القرية، بالإضافة للمرافق والمشاريع الخدمية مع تصفية دقيقة.
                    </p>
                  </div>
                </button>

                {/* Option 2: Village Directory */}
                <button
                  onClick={() => {
                    setIsExploreModalOpen(false);
                    handleTabChange('directory');
                  }}
                  className="group bg-white hover:bg-[#FFF5EB] border border-slate-200 hover:border-[#F4F1EA] rounded-2xl p-4 transition-all duration-200 text-right cursor-pointer flex items-start gap-3.5 shadow-3xs hover:shadow-xs"
                >
                  <div className="w-11 h-11 rounded-xl bg-amber-50 group-hover:bg-white text-amber-600 flex items-center justify-center shrink-0 shadow-3xs transition-colors">
                    <Compass className="w-6 h-6 animate-spin" style={{ animationDuration: '6s' }} />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 font-extrabold group-hover:text-amber-800">
                      دليل القرية الخدمي والتنموي
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      دليل منسق وشامل لجميع الخدمات المتوفرة (تعليمية، صحية، دينية، تنموية) للتواصل مع مسؤولي ومندوبي المرافق.
                    </p>
                  </div>
                </button>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end">
                <button
                  onClick={() => setIsExploreModalOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-[#E2DED0] text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-200/50"
                >
                  إغلاق النافذة
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Login Modal Overlay */}
      <AnimatePresence>
        {isLoginOpen && (
          <LoginModal 
            onClose={() => setIsLoginOpen(false)} 
            onLoginSuccess={handleLoginSuccess} 
            onRegisterSuccess={(msg) => {
              setIsLoginOpen(false);
              setRegisterSuccessMessage(msg);
            }}
          />
        )}
      </AnimatePresence>

      {/* Registration Success Alert Modal Overlay */}
      <AnimatePresence>
        {registerSuccessMessage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-sans animate-fade-in" dir="rtl">
            <div className="absolute inset-0 bg-[#2D3A30]/65 backdrop-blur-xs" onClick={() => setRegisterSuccessMessage(null)} />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 text-center space-y-4 shadow-2xl z-10 relative overflow-hidden"
            >
              <div className="bg-emerald-600 h-1.5 absolute top-0 left-0 right-0" />
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-3xl font-black">
                ✓
              </div>
              <h3 className="text-base font-extrabold text-slate-900 font-extrabold">تم إرسال طلبك بنجاح</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {registerSuccessMessage}
              </p>
              <button
                onClick={() => setRegisterSuccessMessage(null)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.4)] font-bold py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-3xs"
              >
                حسناً، فهمت
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Change Password Modal Overlay */}
      <AnimatePresence>
        {isChangePasswordOpen && currentUser && (
          <ChangePasswordModal
            currentUserEmail={currentUser.email}
            onClose={() => setIsChangePasswordOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Simplified Edit Family Modal Overlay */}
      <AnimatePresence>
        {editingFamily && (
          <EditFamilyModal
            family={editingFamily}
            onClose={() => setEditingFamily(null)}
            onSave={handleSaveFamily}
            uniqueSurnames={uniqueSurnames}
            uniqueNeighborhoods={uniqueNeighborhoods}
            residenceOptions={residenceOptions}
            currentUser={currentUser}
          />
        )}
      </AnimatePresence>

      {/* Advanced Population Movement / Member Move Modal Overlay */}
      <AnimatePresence>
        {isMovingMember && (
          <MoveMemberModal
            isOpen={isMovingMember}
            onClose={() => setIsMovingMember(false)}
            families={families}
            onConfirmMove={handleConfirmMove}
          />
        )}
      </AnimatePresence>

      {/* First-time login mandatory profile/password update block */}
      {currentUser && (currentUser.password === '123456' || currentUser.isDefaultPassword) && (
        <FirstLoginUpdate
          currentUser={currentUser}
          onSuccess={(updatedUser) => {
            setCurrentUser(updatedUser);
            // Save updated user details to local storage
            localStorage.setItem('auth_user_v1', JSON.stringify(updatedUser));
          }}
          onLogout={handleLogout}
        />
      )}

      {/* Global Real-time Notifications Toast Container (Bottom-Left Sliding Toasts) */}
      <div className="fixed bottom-6 left-6 z-[9999] flex flex-col gap-3 max-w-sm pointer-events-none w-full sm:w-[360px]" style={{ direction: 'rtl' }}>
        <AnimatePresence>
          {activeToasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: -60, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, x: 0, scale: 1, y: 0 }}
              exit={{ opacity: 0, x: -60, scale: 0.9, transition: { duration: 0.2 } }}
              className={`border text-white p-4 rounded-2xl shadow-2xl flex items-start gap-3 pointer-events-auto relative overflow-hidden ${
                toast.campaignTitle ? 'bg-slate-900 border-emerald-500/30' : 'bg-slate-900 border-amber-500/30'
              }`}
            >
              {/* Green active live indicator line */}
              <div className={`absolute top-0 right-0 left-0 h-1 animate-pulse ${
                toast.campaignTitle ? 'bg-emerald-500' : 'bg-amber-500'
              }`} />
              
              <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                toast.campaignTitle ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
              }`}>
                {toast.campaignTitle ? <Coins className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
              </div>
              
              <div className="space-y-1 text-right flex-1 min-w-0 font-sans">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-xs font-black ${toast.campaignTitle ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {toast.title || '🎉 إشعار من البوابة!'}
                  </span>
                  <span className="text-[9px] text-gray-400 font-mono shrink-0">{toast.timestamp}</span>
                </div>
                <p className="text-[11px] sm:text-xs font-black text-slate-100 leading-relaxed">
                  {toast.message}
                </p>
                {toast.campaignTitle && (
                  <div className="text-[10px] text-slate-300 bg-white/5 p-2 rounded-xl border border-white/5 space-y-1 mt-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-bold">المندوب:</span>
                      <span className="font-extrabold text-amber-200">{toast.recordedBy}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-bold">الحملة التنموية:</span>
                      <span className="font-extrabold text-emerald-300 truncate max-w-[160px]">{toast.campaignTitle}</span>
                    </div>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => setActiveToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10 cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
