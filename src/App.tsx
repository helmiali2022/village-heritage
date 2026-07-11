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
import GoogleCalendarEvents from './components/GoogleCalendarEvents';
import EditFamilyModal from './components/EditFamilyModal';
import MoveMemberModal from './components/MoveMemberModal';
import UnapprovedDelegatePanel from './components/UnapprovedDelegatePanel';
import FirstLoginUpdate from './components/FirstLoginUpdate';
import { getFamilyDiff, getMemberDiff, sendAuditLog } from './utils/auditLogger';
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
  Layers,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type TabType = 'dashboard' | 'families' | 'services' | 'map' | 'reports' | 'donations' | 'contact' | 'directory' | 'admin-settings' | 'calendar';

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      const oldFam = families.find(f => f.id === savedFamily.id);
      if (oldFam) {
        const diffText = getFamilyDiff(oldFam, savedFamily);
        if (diffText !== 'لم تتغير أي حقول أساسية في العائلة نفسها') {
          sendAuditLog(currentUser, diffText, 'تعديل', 'التعداد');
        } else {
          // Check for member updates
          if (oldFam.members.length !== savedFamily.members.length) {
            if (savedFamily.members.length > oldFam.members.length) {
              const addedMem = savedFamily.members.find(nm => !oldFam.members.some(om => om.id === nm.id));
              if (addedMem) {
                sendAuditLog(currentUser, `تم إضافة تابع جديد [${addedMem.name}] (صلة القرابة: ${addedMem.relationship}) لعائلة [عائلة ${savedFamily.familyName}]`, 'إضافة', 'التعداد');
              }
            } else {
              const deletedMem = oldFam.members.find(om => !savedFamily.members.some(nm => nm.id === om.id));
              if (deletedMem) {
                sendAuditLog(currentUser, `تم حذف التابع [${deletedMem.name}] (صلة القرابة: ${deletedMem.relationship}) من عائلة [عائلة ${savedFamily.familyName}]`, 'حذف', 'التعداد');
              }
            }
          } else {
            // Check if individual member was updated
            oldFam.members.forEach(oldMem => {
              const newMem = savedFamily.members.find(m => m.id === oldMem.id);
              if (newMem && JSON.stringify(oldMem) !== JSON.stringify(newMem)) {
                const memDiff = getMemberDiff(oldMem, newMem);
                sendAuditLog(currentUser, `تعديل تابع في عائلة [عائلة ${savedFamily.familyName}]: ${memDiff}`, 'تعديل', 'التعداد');
              }
            });
          }
        }
      }
      setFamilies(families.map(f => f.id === savedFamily.id ? savedFamily : f));
    } else {
      // Create mode
      sendAuditLog(currentUser, `تم إضافة عائلة جديدة لرب الأسرة [${savedFamily.breadwinnerName}] باسم [عائلة ${savedFamily.familyName}] في محلة [${savedFamily.neighborhood}]`, 'إضافة', 'التعداد');
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

      // Record audit log
      sendAuditLog(
        currentUser,
        `حركة سكان - تأسيس أسرة جديدة: تم فصل الفرد [${moveData.memberName}] وتأسيس أسرة جديدة باسم [عائلة ${moveData.familyName}] بمحلة [${moveData.neighborhood}] مع تابعين (${moveData.selectedDependents?.length || 0} أفراد) بتاريخ ${moveData.transferDate}. مبررات وملاحظات: ${moveData.notes || 'لا يوجد'}.`,
        'نقل',
        'التعداد'
      );

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

      // Record audit log
      sendAuditLog(
        currentUser,
        `حركة سكان - زواج خارج القرية: تم توثيق مغادرة الفرد [${moveData.memberName}] من [عائلة ${moveData.familyName}] بسبب زواج خارج القرية بتاريخ ${moveData.transferDate}. مبررات وملاحظات: ${moveData.notes || 'لا يوجد'}.`,
        'نقل',
        'التعداد'
      );

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

      // Record audit log
      sendAuditLog(
        currentUser,
        `حركة سكان - انتقال لمحافظة أخرى: تم توثيق انتقال الفرد [${moveData.memberName}] من [عائلة ${moveData.familyName}] لمحافظة [${moveData.targetGovernorate || 'أخرى'}] بتاريخ ${moveData.transferDate}. مبررات وملاحظات: ${moveData.notes || 'لا يوجد'}.`,
        'نقل',
        'التعداد'
      );
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
      const targetFamily = families.find(f => f.id === id);
      setFamilies(families.filter(f => f.id !== id));
      if (targetFamily) {
        sendAuditLog(
          currentUser,
          `تم حذف سجل العائلة بالكامل باسم [عائلة ${targetFamily.familyName}]، رب الأسرة [${targetFamily.breadwinnerName}] مع كافة التابعين المرتبطين بها (${targetFamily.members ? targetFamily.members.length : 0} أفراد).`,
          'حذف',
          'التعداد'
        );
      }
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

  // Render sidebar contents helper
  const renderSidebarUserSection = () => {
    if (currentUser) {
      return (
        <div className="bg-[#1e293b] border border-slate-800 rounded-2xl p-4 mb-4 space-y-3 shadow-inner">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-right overflow-hidden">
              <div className="text-[10px] text-sky-400 font-extrabold leading-none mb-1">
                {currentUser.role === 'super-admin' ? 'المشرف العام 🛡️' :
                 currentUser.role === 'admin' ? 'مدير شؤون القرية 🏛️' :
                 currentUser.role === 'delegate' ? 'مندوب المساهمات 🪙' :
                 currentUser.role === 'supervisor' ? 'مشرف التعداد 📋' :
                 currentUser.role === 'browser' ? 'متصفح 👥' : 'عضو البوابة 👤'}
              </div>
              <div className="text-xs text-white font-bold truncate" title={currentUser.email}>
                {currentUser.name ? `${currentUser.name} ${currentUser.surname || ''}` : currentUser.email}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 pt-2 border-t border-slate-800">
            <button
              onClick={() => {
                setIsChangePasswordOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="w-full bg-slate-800 hover:bg-slate-700 text-amber-400 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              تغيير كلمة المرور
            </button>
            <button
              onClick={() => {
                handleLogout();
                setIsMobileMenuOpen(false);
              }}
              className="w-full bg-rose-950/40 hover:bg-rose-950/60 text-rose-300 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all border border-rose-900/30 cursor-pointer"
            >
              خروج
            </button>
          </div>
        </div>
      );
    }

    return (
      <button
        onClick={() => {
          setIsLoginOpen(true);
          setIsMobileMenuOpen(false);
        }}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.5)] font-bold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 mb-4 cursor-pointer shadow-md active:scale-98"
      >
        <ShieldCheck className="w-4 h-4 text-amber-400" />
        تسجيل الدخول
      </button>
    );
  };

  const renderSidebarLinks = () => {
    const links = [
      { id: 'dashboard', label: 'الرئيسية واللوحة الإحصائية', icon: <Home className="w-4 h-4 text-sky-400" />, emoji: '📊' },
      { id: 'families', label: 'التعداد السكاني وسجل العائلات', icon: <Users className="w-4 h-4 text-indigo-400" />, emoji: '👥' },
      { id: 'services', label: 'الخدمات والمشاريع والمرافق', icon: <Building2 className="w-4 h-4 text-amber-400" />, emoji: '🛠️' },
      { id: 'donations', label: 'المساهمات والتبرعات الخيرية', icon: <Heart className="w-4 h-4 text-teal-400 fill-teal-500/10" />, emoji: '💖' },
      { id: 'map', label: 'الخريطة الجغرافية التفاعلية', icon: <MapPin className="w-4 h-4 text-emerald-400" />, emoji: '📍' },
      { id: 'directory', label: 'دليل القرية الخدمي والتنموي', icon: <Compass className="w-4 h-4 text-cyan-400 animate-pulse" />, emoji: '📖' },
      { id: 'calendar', label: 'التقويم وفعاليات القرية السحابية', icon: <Calendar className="w-4 h-4 text-emerald-400" />, emoji: '📅' },
      { id: 'contact', label: 'صندوق المقترحات والتواصل', icon: <MessageSquare className="w-4 h-4 text-pink-400" />, emoji: '📞' },
    ];

    return (
      <nav className="flex flex-col gap-2">
        {links.map((link) => {
          const isActive = activeTab === link.id;
          return (
            <button
              key={link.id}
              onClick={() => {
                handleTabChange(link.id as TabType);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-right text-xs sm:text-[13px] font-bold border-r-4 cursor-pointer ${
                isActive
                  ? 'bg-[#1e293b] text-[#38bdf8] border-blue-500 shadow-sm font-black'
                  : 'text-slate-300 hover:bg-[#1e293b] hover:text-[#38bdf8] border-transparent font-medium'
              }`}
            >
              <span className="shrink-0">{link.icon}</span>
              <span className="flex-1 truncate">{link.label}</span>
              <span className="text-sm">{link.emoji}</span>
            </button>
          );
        })}

        {isSuperAdmin && (
          <button
            onClick={() => {
              handleTabChange('admin-settings');
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-right text-xs sm:text-[13px] font-bold border-r-4 cursor-pointer ${
              activeTab === 'admin-settings'
                ? 'bg-[#1e293b] text-amber-400 border-amber-500 shadow-sm font-black'
                : 'text-slate-300 hover:bg-[#1e293b] hover:text-amber-400 border-transparent font-medium'
            }`}
          >
            <span className="shrink-0"><Settings className="w-4 h-4 text-amber-500" /></span>
            <span className="flex-1 truncate">إعدادات المدير العام للنظام</span>
            <span className="text-sm">🛡️</span>
          </button>
        )}
      </nav>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-700 antialiased selection:bg-blue-600 selection:text-white" id="app-wrapper" dir="rtl">
      
      {/* Floating Contact/Communication Button (Always Visible Global Top-Left on Desktop or Floating) */}
      <div className="fixed bottom-5 right-5 z-50 md:hidden">
        <button
          onClick={() => handleTabChange('contact')}
          title="اتصال وتواصل"
          className="relative group w-12 h-12 rounded-full bg-gradient-to-r from-pink-600 to-rose-500 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
        >
          <span className="absolute inset-0 rounded-full bg-pink-500/30 animate-ping opacity-75"></span>
          <Phone className="w-5.5 h-5.5" />
        </button>
      </div>

      {/* Desktop Persistent Sidebar Layout */}
      <aside className="w-72 bg-[#0f172a] text-white fixed h-full right-0 top-0 p-6 flex flex-col gap-4 shadow-xl z-40 hidden md:flex border-l border-slate-800 overflow-y-auto">
        <div className="text-base sm:text-lg font-black mb-6 border-b border-slate-800 pb-4 text-center text-[#38bdf8] flex items-center justify-center gap-2">
          <FileCheck2 className="w-6 h-6 text-[#38bdf8]" />
          <span>ذي الجمال قدس</span>
        </div>
        
        {/* User state profile container */}
        {renderSidebarUserSection()}

        {/* Sidebar Nav Links */}
        {renderSidebarLinks()}
        
        <div className="mt-auto pt-6 border-t border-slate-800/80 text-center text-[10px] text-slate-500 font-bold leading-relaxed">
          <div>المنصة الرقمية للقرية مخصصة ومحمية</div>
          <div>تعداد شامل • تبرعات • مرافق</div>
          <div className="mt-1 font-mono text-slate-600">© 2026</div>
        </div>
      </aside>

      {/* Mobile Top Header Navigation */}
      <header className="bg-stone-100 text-slate-900 shadow-sm sticky top-0 z-30 transition-all border-b border-slate-200 md:hidden py-3 px-4 flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all active:scale-95 cursor-pointer"
            title="افتح القائمة"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shrink-0 shadow-sm">
              <FileCheck2 className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-extrabold text-xs sm:text-sm text-slate-900">
              بوابة ذي الجمال قدس
            </h1>
          </div>
        </div>
        
        {/* Simple Login or Profile summary on mobile top bar */}
        <div>
          {currentUser ? (
            <div className="flex items-center gap-1.5 bg-blue-600/10 border border-blue-600/20 rounded-xl px-2 py-0.5">
              <ShieldCheck className="w-3 h-3 text-blue-600" />
              <span className="text-[10px] text-slate-900 font-extrabold max-w-[80px] truncate">
                {currentUser.name || currentUser.email.split('@')[0]}
              </span>
            </div>
          ) : (
            <button
              onClick={() => setIsLoginOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1 rounded-xl text-[10px] transition-all cursor-pointer shadow-xs active:scale-95"
            >
              دخول
            </button>
          )}
        </div>
      </header>

      {/* Slide-out Responsive Mobile Sidebar Drawer Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black z-40 md:hidden cursor-pointer"
            />
            {/* Slide drawer */}
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-72 bg-[#0f172a] text-white fixed h-full right-0 top-0 p-6 flex flex-col gap-4 shadow-2xl z-50 overflow-y-auto md:hidden"
            >
              <div className="flex justify-between items-center mb-2 pb-3 border-b border-slate-800">
                <span className="text-xs font-black text-slate-400">قائمة لوحة التحكم</span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-all cursor-pointer border border-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Sidebar Content */}
              {renderSidebarUserSection()}
              {renderSidebarLinks()}

              <div className="mt-auto pt-4 border-t border-slate-800 text-center text-[10px] text-slate-500 font-bold leading-normal">
                المنصة الرقمية للقرية مخصصة ومحمية © 2026
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Pane wrapper shifted left on desktop to clear fixed Sidebar */}
      <div className="flex-1 flex flex-col md:mr-72 min-h-screen">
        
        {/* Dynamic Section Focused Subview Indicator */}
        {!isUnapprovedDelegate && activeTab !== 'dashboard' && (
          <div className="px-4 sm:px-6 lg:px-8 pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2.5 bg-white border border-slate-200 rounded-2xl px-4 shadow-xs" id="subview-header">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse shrink-0"></span>
                <h3 className="text-xs font-extrabold text-slate-900 truncate">
                  القسم النشط: {
                    activeTab === 'families' ? 'التعداد السكاني والمساكن' :
                    activeTab === 'services' ? 'إدارة الخدمات والمرافق' :
                    activeTab === 'map' ? 'الخريطة الجغرافية التفاعلية' :
                    activeTab === 'directory' ? 'دليل خدمات القرية' :
                    activeTab === 'donations' ? 'قنوات التبرع والمساهمات' :
                    activeTab === 'contact' ? 'صندوق المقترحات والتواصل المباشر' :
                    activeTab === 'admin-settings' ? 'إعدادات المشرف العام' : 'تفاصيل القسم الفرعي'
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
          </div>
        )}

        {/* Quick actions for Admins on services tab */}
        {isAdmin && !isUnapprovedDelegate && (activeTab === 'services' && !isAddingService && !editingService) && (
          <div className="px-4 sm:px-6 lg:px-8 pt-4">
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-3xs flex flex-wrap justify-center items-center gap-2.5">
              <button
                onClick={() => setIsAddingService(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.5)] font-bold px-4 py-2 rounded-xl text-[11px] flex items-center gap-1.5 shadow-xs transition-all cursor-pointer border border-blue-600"
              >
                <Plus className="w-3.5 h-3.5" />
                إضافة مرفق/مشروع خدمي
              </button>
            </div>
          </div>
        )}

        {/* Main Workspace where child components render */}
        <main className="px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full" id="main-workspace">
        
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
                  {censusSubView !== 'register' && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200">
                      <span className="text-xs font-extrabold text-slate-800">
                        {censusSubView === 'google-sheets' ? '📂 جدول Google Sheets المدمج لتصحيح التعداد' : '📊 التقارير والمؤشرات الإحصائية العامة'}
                      </span>
                      <button
                        onClick={() => setCensusSubView('register')}
                        className="w-full sm:w-auto bg-[#4A5D4E] hover:bg-[#3E4C41] text-white px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                      >
                        <span>الرجوع لسجل الأسر والمواطنين 👥</span>
                      </button>
                    </div>
                  )}

                  {censusSubView === 'register' && (
                    <FamilyRegister
                      families={families}
                      setFamilies={setFamilies}
                      onAddFamily={(isMemberOnly) => {
                        setIsAddingFamily(true);
                        setIsAddingMemberOnly(!!isMemberOnly);
                      }}
                      onEditFamily={handleEditFamily}
                      onDeleteFamily={handleDeleteFamily}
                      onLocateOnMap={handleLocateFamilyOnMap}
                      onMoveMember={() => setIsMovingMember(true)}
                      onSetSubView={(view) => setCensusSubView(view)}
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

              {activeTab === 'calendar' && (
                <div className="bg-emerald-50/20 border border-emerald-200 rounded-3xl p-4 sm:p-6 shadow-sm">
                  <GoogleCalendarEvents isAdmin={isAdmin} />
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
      </div> {/* Closes the flex-1 md:mr-72 content column */}
    </div>
  );
}
