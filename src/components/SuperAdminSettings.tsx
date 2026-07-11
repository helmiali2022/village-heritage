import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldAlert, 
  Trash2, 
  UserPlus, 
  Shield, 
  Mail, 
  User, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  ExternalLink,
  ChevronDown,
  UserCheck,
  Send,
  MessageSquare,
  Calendar
} from 'lucide-react';

interface SuperAdminSettingsProps {
  onBackToHome: () => void;
  currentUserEmail?: string;
}

interface DBUser {
  id: string;
  username: string;
  email: string;
  password?: string;
  name: string;
  surname: string;
  phone: string;
  role: 'super-admin' | 'admin' | 'delegate' | 'supervisor' | 'browser';
  isActivated: boolean;
  status?: string;
  pendingActivationRequest?: boolean;
  activationRequestDate?: string;
  department?: string;
  title?: string;
  permissions?: {
    canUploadFile: boolean;
    canFetchGoogle: boolean;
    canManageSupervisors: boolean;
    canManageDeptsAndCampaigns: boolean;
    canEditCensus?: boolean;
  };
}

interface MembershipRequest {
  id: string;
  name: string;
  surname: string;
  phone: string;
  email: string;
  createdAt: string;
}

interface SimulatedEmail {
  id: string;
  toEmail: string;
  subject: string;
  content: string;
  token: string;
  clicked: boolean;
  timestamp: string;
  activationLink: string;
}

export interface ContactMessage {
  id: string;
  referenceNumber: string;
  name: string;
  phone: string;
  neighborhood: string;
  msgType: string;
  subject: string;
  message: string;
  timestamp: string;
  status: 'new' | 'read' | 'resolved';
}

export default function SuperAdminSettings({ onBackToHome, currentUserEmail }: SuperAdminSettingsProps) {
  const [activeTab, setActiveTab] = useState<'members' | 'inbox' | 'monitor'>('members');
  const [users, setUsers] = useState<DBUser[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [pendingRequests, setPendingRequests] = useState<MembershipRequest[]>([]);
  const [sentEmails, setSentEmails] = useState<SimulatedEmail[]>([]);

  // Monitoring States
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);

  // Filters for activity logs
  const [filterUser, setFilterUser] = useState<string>('all');
  const [filterSection, setFilterSection] = useState<string>('all');
  const [filterActionType, setFilterActionType] = useState<string>('all');

  const uniqueUsersInLogs = useMemo(() => {
    const names = new Set<string>();
    activityLogs.forEach(log => {
      if (log.userName) {
        names.add(log.userName.trim());
      }
    });
    return Array.from(names);
  }, [activityLogs]);

  const filteredLogs = useMemo(() => {
    let result = [...activityLogs];
    if (filterUser !== 'all') {
      result = result.filter(log => log.userName?.trim() === filterUser.trim());
    }
    if (filterSection !== 'all') {
      result = result.filter(log => log.section === filterSection);
    }
    if (filterActionType !== 'all') {
      result = result.filter(log => log.actionType === filterActionType);
    }
    return result;
  }, [activityLogs, filterUser, filterSection, filterActionType]);

  const logStats = useMemo(() => {
    let total = filteredLogs.length;
    let adds = filteredLogs.filter(l => l.actionType === 'إضافة').length;
    let edits = filteredLogs.filter(l => l.actionType === 'تعديل').length;
    let deletes = filteredLogs.filter(l => l.actionType === 'حذف').length;
    let logins = filteredLogs.filter(l => l.actionType === 'تسجيل دخول').length;
    let transfers = filteredLogs.filter(l => l.actionType === 'نقل').length;
    return { total, adds, edits, deletes, logins, transfers };
  }, [filteredLogs]);

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const currentUser = users.find(u => u.email.toLowerCase() === (currentUserEmail || '').toLowerCase().trim());
  const isSuperAdmin = currentUser?.role === 'super-admin' || currentUserEmail?.toLowerCase() === 'helmialkhateeb@gmail.com' || currentUserEmail?.toLowerCase() === 'helmi';

  // States for manual creation & delegate approval
  const [manualName, setManualName] = useState('');
  const [manualSurname, setManualSurname] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualPassword, setManualPassword] = useState('');
  const [manualRole, setManualRole] = useState<'super-admin' | 'admin' | 'delegate' | 'supervisor' | 'browser'>('delegate');
  const [manualDept, setManualDept] = useState('كل الأقسام');
  const [manualTitle, setManualTitle] = useState('مندوب تعداد وسكان');
  
  // Manual creation checkboxes
  const [manualPermUpload, setManualPermUpload] = useState(true);
  const [manualPermGoogle, setManualPermGoogle] = useState(true);
  const [manualPermSupervisors, setManualPermSupervisors] = useState(false);
  const [manualPermDepts, setManualPermDepts] = useState(false);

  const [selectedUserToApprove, setSelectedUserToApprove] = useState('');

  // Quick Delegate Creation states
  const [quickDelegateName, setQuickDelegateName] = useState('');
  const [quickDelegateEmail, setQuickDelegateEmail] = useState('');

  // States for Editing User Modal
  const [isEditingUser, setIsEditingUser] = useState<DBUser | null>(null);
  const [editRole, setEditRole] = useState<'super-admin' | 'admin' | 'delegate' | 'supervisor' | 'browser'>('delegate');
  const [editDept, setEditDept] = useState('كل الأقسام');
  const [editTitle, setEditTitle] = useState('مندوب تعداد وسكان');
  const [editPhone, setEditPhone] = useState('');
  const [editPermUpload, setEditPermUpload] = useState(true);
  const [editPermGoogle, setEditPermGoogle] = useState(true);
  const [editPermSupervisors, setEditPermSupervisors] = useState(false);
  const [editPermDepts, setEditPermDepts] = useState(false);
  const [editPermEditCensus, setEditPermEditCensus] = useState(false);
  const [membersFilter, setMembersFilter] = useState<'all' | 'delegates'>('all');

  // Super Admin Personal Profile state
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPhone, setAdminPhone] = useState('');

  // Delegate detailed checkbox permissions manager state
  const [selectedDelegateId, setSelectedDelegateId] = useState('');
  const [delName, setDelName] = useState('');
  const [delSurname, setDelSurname] = useState('');
  const [delEmail, setDelEmail] = useState('');
  const [delPhone, setDelPhone] = useState('');
  const [delCensus, setDelCensus] = useState(true);
  const [delCensusEdit, setDelCensusEdit] = useState(false);
  const [delDonations, setDelDonations] = useState(true);
  const [delUpload, setDelUpload] = useState(true);
  const [delGoogle, setDelGoogle] = useState(true);

  // States for resetting user password
  const [resetPasswordUser, setResetPasswordUser] = useState<DBUser | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState('');

  const notifyUsersUpdated = () => {
    try {
      const channel = new BroadcastChannel('users_sync_channel');
      channel.postMessage('users-updated');
      channel.close();
    } catch (e) {
      console.warn('BroadcastChannel error:', e);
    }
    window.dispatchEvent(new CustomEvent('users-updated'));
  };

  const handleCreateManualUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      setErrorMsg('عذراً، هذه الصلاحية محصورة للمشرف العام فقط.');
      return;
    }
    if (!manualName || !manualSurname || !manualEmail || !manualPhone || !manualPassword || !manualRole) {
      setErrorMsg('الرجاء تعبئة كافة حقول النموذج لإنشاء الحساب.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/users/add-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: manualName,
          surname: manualSurname,
          email: manualEmail,
          phone: manualPhone,
          password: manualPassword,
          role: manualRole,
          department: manualDept,
          title: manualTitle,
          permissions: {
            canUploadFile: manualPermUpload,
            canFetchGoogle: manualPermGoogle,
            canManageSupervisors: manualPermSupervisors,
            canManageDeptsAndCampaigns: manualPermDepts
          }
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'فشل إنشاء الحساب يدوياً');
      }

      setSuccessMsg(`🎉 تم بنجاح إنشاء حساب "${manualName} ${manualSurname}" وتفعيله فورا برتبة مخصصة وقسم: [${manualDept}]!`);
      // Clear form
      setManualName('');
      setManualSurname('');
      setManualEmail('');
      setManualPhone('');
      setManualPassword('');
      setManualDept('كل الأقسام');
      setManualTitle('مندوب تعداد وسكان');
      setManualPermUpload(true);
      setManualPermGoogle(true);
      setManualPermSupervisors(false);
      setManualPermDepts(false);
      loadData();
      notifyUsersUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل غير متوقع أثناء معالجة الطلب');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAddDelegate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      setErrorMsg('عذراً، هذه الصلاحية محصورة للمشرف العام فقط.');
      return;
    }
    if (!quickDelegateName.trim() || !quickDelegateEmail.trim()) {
      setErrorMsg('الرجاء كتابة الاسم والبريد الإلكتروني لاعتماد المندوب.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/users/quick-add-delegate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: quickDelegateName,
          email: quickDelegateEmail
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'فشل اعتماد وإضافة المندوب');
      }

      setSuccessMsg(`🪙 تم بنجاح إنشاء حساب المندوب الجديد وتفعيله فورا: "${quickDelegateName}" (${quickDelegateEmail})! كلمة المرور الافتراضية هي: 123456`);
      setQuickDelegateName('');
      setQuickDelegateEmail('');
      loadData();
      notifyUsersUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ غير متوقع أثناء اعتماد المندوب');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveDelegateManual = async () => {
    if (!isSuperAdmin) {
      setErrorMsg('عذراً، هذه الصلاحية محصورة للمشرف العام فقط.');
      return;
    }
    if (!selectedUserToApprove) {
      setErrorMsg('الرجاء اختيار العضو المراد اعتماده أولاً.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/users/update-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserToApprove,
          role: 'delegate',
          department: 'قسم التبرعات',
          title: 'مندوب تبرعات ومساهمات',
          permissions: {
            canUploadFile: true,
            canFetchGoogle: true,
            canManageSupervisors: false,
            canManageDeptsAndCampaigns: false
          }
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'فشل اعتماد العضو كمندوب');
      }

      setSuccessMsg(`🪙 تم بنجاح اعتماد العضو المختار كمندوب تبرعات مع صلاحيات جلب ورفع البيانات!`);
      setSelectedUserToApprove('');
      loadData();
      notifyUsersUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل غير متوقع أثناء معالجة الطلب');
    } finally {
      setLoading(false);
    }
  };

  // Password Reset Functions for Super Admin
  const handleOpenResetPasswordModal = (user: DBUser) => {
    setResetPasswordUser(user);
    setResetPasswordValue('');
  };

  const handleResetUserPassword = async () => {
    if (!resetPasswordUser || !resetPasswordValue.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/users/reset-password-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: resetPasswordUser.id,
          newPassword: resetPasswordValue.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'فشل إعادة تعيين كلمة المرور');
      }

      setSuccessMsg(`🔑 تم بنجاح إعادة تعيين كلمة المرور لحساب "${resetPasswordUser.name} ${resetPasswordUser.surname}" بنجاح!`);
      setResetPasswordUser(null);
      setResetPasswordValue('');
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل غير متوقع أثناء إعادة تعيين كلمة المرور');
    } finally {
      setLoading(false);
    }
  };

  // Open custom modal for editing user details
  const handleOpenEditUserModal = (user: DBUser) => {
    setIsEditingUser(user);
    setEditRole(user.role);
    setEditDept(user.department || 'كل الأقسام');
    setEditTitle(user.title || (user.role === 'delegate' ? 'مندوب تبرعات ومساهمات' : 'مندوب تعداد وسكان'));
    setEditPhone(user.phone || '');
    setEditPermUpload(user.permissions?.canUploadFile !== false);
    setEditPermGoogle(user.permissions?.canFetchGoogle !== false);
    setEditPermSupervisors(!!user.permissions?.canManageSupervisors);
    setEditPermDepts(!!user.permissions?.canManageDeptsAndCampaigns);
    setEditPermEditCensus(!!user.permissions?.canEditCensus);
  };

  // Save modified user details
  const handleUpdateUserPermissions = async () => {
    if (!isEditingUser) return;
    if (!isSuperAdmin) {
      setErrorMsg('عذراً، هذه الصلاحية محصورة للمشرف العام فقط.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch('/api/users/update-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: isEditingUser.id,
          role: editRole,
          department: editDept,
          title: editTitle,
          phone: editPhone,
          permissions: {
            canUploadFile: editPermUpload,
            canFetchGoogle: editPermGoogle,
            canManageSupervisors: editPermSupervisors,
            canManageDeptsAndCampaigns: editPermDepts,
            canEditCensus: editPermEditCensus
          }
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'فشل تحديث صلاحيات الحساب');
      }
      setSuccessMsg(`✅ تم تحديث بيانات وصلاحيات الحساب "${isEditingUser.name} ${isEditingUser.surname}" بنجاح!`);
      setIsEditingUser(null);
      loadData();
      notifyUsersUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء حفظ التعديلات.');
    } finally {
      setLoading(false);
    }
  };

  // Delete a user account completely
  const handleDeleteUserPermanently = async (userId: string, fullName: string) => {
    if (!window.confirm(`⚠️ تحذير نهائي: هل أنت متأكد من حذف الحساب "${fullName}" نهائياً من المنصة؟ لا يمكن الرجوع عن هذا!`)) {
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'فشل حذف الحساب من النظام');
      }
      setSuccessMsg(`🗑️ تم حذف حساب العضو "${fullName}" بالكامل وإلغاء تسجيل دخوله.`);
      setIsEditingUser(null);
      loadData();
      notifyUsersUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء حذف الحساب.');
    } finally {
      setLoading(false);
    }
  };



  // Load all users, requests, and sent emails
  const loadData = async () => {
    try {
      const usersRes = await fetch('/api/users');
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }

      const reqRes = await fetch('/api/membership-requests');
      if (reqRes.ok) {
        const reqData = await reqRes.json();
        setPendingRequests(reqData);
      }

      const mailRes = await fetch('/api/sent-emails');
      if (mailRes.ok) {
        const mailData = await mailRes.json();
        setSentEmails(mailData);
      }

      const msgRes = await fetch('/api/messages');
      if (msgRes.ok) {
        const msgData = await msgRes.json();
        setMessages(msgData);
      }

      // Load active sessions
      const sessionsRes = await fetch('/api/active-sessions');
      if (sessionsRes.ok) {
        const sessionsData = await sessionsRes.json();
        setActiveSessions(sessionsData);
      }

      // Load activity logs
      const logsRes = await fetch('/api/activity-log');
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setActivityLogs(logsData);
      }
    } catch (e) {
      console.error('Error fetching admin dashboard data:', e);
    }
  };

  useEffect(() => {
    loadData();
    // Poll to keep in sync
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Sync admin personal details once loaded
  useEffect(() => {
    if (currentUser) {
      if (!adminEmail) setAdminEmail(currentUser.email);
      if (!adminPhone) setAdminPhone(currentUser.phone || '');
    }
  }, [currentUser]);

  // Sync selected delegate details when selection changes
  useEffect(() => {
    if (selectedDelegateId) {
      const d = users.find(u => u.id === selectedDelegateId);
      if (d) {
        setDelName(d.name || '');
        setDelSurname(d.surname || '');
        setDelEmail(d.email || '');
        setDelPhone(d.phone || '');
        setDelCensus(d.permissions?.canCensus !== false);
        setDelCensusEdit(!!d.permissions?.canEditCensus);
        setDelDonations(d.permissions?.canDonations !== false);
        setDelUpload(d.permissions?.canUploadFile !== false);
        setDelGoogle(d.permissions?.canFetchGoogle !== false);
      }
    } else {
      setDelName('');
      setDelSurname('');
      setDelEmail('');
      setDelPhone('');
      setDelCensus(true);
      setDelCensusEdit(false);
      setDelDonations(true);
      setDelUpload(true);
      setDelGoogle(true);
    }
  }, [selectedDelegateId, users]);

  const handleUpdateAdminProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch('/api/users/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          email: adminEmail,
          phone: adminPhone
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'فشل تحديث الملف الشخصي');
      }
      setSuccessMsg('✅ تم تحديث بياناتك الشخصية كمشرف عام بنجاح!');
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء حفظ التعديلات.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDelegateDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDelegateId) return;
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch('/api/users/update-delegate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedDelegateId,
          name: delName,
          surname: delSurname,
          email: delEmail,
          phone: delPhone,
          permissions: {
            canCensus: delCensus,
            canEditCensus: delCensusEdit,
            canDonations: delDonations,
            canUploadFile: delUpload,
            canFetchGoogle: delGoogle
          }
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'فشل تحديث بيانات المندوب');
      }
      setSuccessMsg('✅ تم حفظ تعديلات وتفاصيل المندوب وصلاحياته بمربعات الاختيار بنجاح!');
      loadData();
      notifyUsersUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء حفظ التعديلات.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Approve membership request
  const handleApprove = async (requestId: string, memberEmail: string) => {
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/membership-requests/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`تم قبول طلب العضوية بنجاح! تم إرسال رسالة البريد الإلكتروني المحاكاة مع رابط التفعيل المخصص إلى: ${memberEmail}`);
        loadData();
        notifyUsersUpdated();
      } else {
        throw new Error(data.error || 'فشل قبول الطلب');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء معالجة القبول.');
    }
  };

  // Handle Reject membership request
  const handleReject = async (requestId: string) => {
    if (!window.confirm('هل أنت متأكد من رفض وإزالة طلب العضوية هذا؟')) return;
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/membership-requests/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId })
      });
      if (res.ok) {
        setSuccessMsg('تم رفض طلب العضوية بنجاح وحذفه من السجلات المعلقة.');
        loadData();
        notifyUsersUpdated();
      } else {
        throw new Error('فشل رفض الطلب');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء الرفض.');
    }
  };

  // Handle role updates
  const handleRoleChange = async (userId: string, newRole: any) => {
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/users/update-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`تم تحديث الدور والمهمة بنجاح إلى: [${getRoleLabel(newRole)}]`);
        loadData();
        notifyUsersUpdated();
      } else {
        throw new Error(data.error || 'فشل تحديث الدور');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء تغيير الدور.');
    }
  };

  const getRoleLabel = (role: string) => {
    switch(role) {
      case 'super-admin': return 'المشرف العام للنظام 🛡️';
      case 'admin': return 'مدير شؤون القرية 🏛️';
      case 'delegate': return 'مندوب تبرعات ومساهمات 🪙';
      case 'supervisor': return 'مشرف تعداد وباحث ميداني 📋';
      case 'browser': return 'متصفح وموظف عادي 👥';
      default: return role;
    }
  };

  return (
    <div className="space-y-6 font-sans" dir="rtl">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-l from-[#3E4C41] to-[#4A5D4E] text-[#FDFBF7] rounded-3xl p-6 border border-[#2D3A30] shadow-md">
        <div>
          <h2 className="text-xl font-extrabold flex items-center gap-2">
            <Shield className="w-6 h-6 text-amber-400 fill-amber-400/10" />
            لوحة الإشراف وإدارة العضويات والصلاحيات
          </h2>
          <p className="text-xs text-[#E2DED0] mt-1 leading-relaxed">
            البوابة الإدارية لمراجعة طلبات العضوية المعلقة، الموافقة عليها، وتفويض المسؤوليات والمهام وتعيين الأدوار التنموية بالبوابة.
          </p>
        </div>
        <button
          onClick={onBackToHome}
          className="bg-[#A98467] hover:bg-[#8F6C50] text-[#FDFBF7] px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all border border-[#A98467] cursor-pointer shadow-xs"
        >
          العودة للرئيسية
        </button>
      </div>

      {/* Notifications banners */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-3xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 animate-bounce" />
          <span className="leading-relaxed">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-3xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#E2DED0] pb-4">
        <button
          onClick={() => setActiveTab('members')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'members' ? 'bg-[#4A5D4E] text-white' : 'bg-[#F4F1EA] text-[#5F6C61] hover:bg-[#E9F0E0]'}`}
        >
          <UserCheck className="w-4 h-4" />
          إدارة الأعضاء والصلاحيات
        </button>
        <button
          onClick={() => setActiveTab('inbox')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all relative ${activeTab === 'inbox' ? 'bg-[#4A5D4E] text-white' : 'bg-[#F4F1EA] text-[#5F6C61] hover:bg-[#E9F0E0]'}`}
        >
          <MessageSquare className="w-4 h-4" />
          صندوق الرسائل والمقترحات
          {messages.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#FDFBF7]">
              {messages.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('monitor')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all relative ${activeTab === 'monitor' ? 'bg-[#4A5D4E] text-white' : 'bg-[#F4F1EA] text-[#5F6C61] hover:bg-[#E9F0E0]'}`}
        >
          <ShieldAlert className="w-4 h-4 text-amber-500" />
          سجل الأنشطة ومراقبة النظام
          {activeSessions.length > 0 && (
            <span className="bg-emerald-600 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">
              {activeSessions.length} نشط
            </span>
          )}
        </button>
      </div>

      {activeTab === 'members' ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Column: 1. Pending Membership Requests */}
        <div className="space-y-4">

          {/* Part 1: Edit Super Admin Personal Profile */}
          {isSuperAdmin && currentUser && (
            <div className="bg-[#FDFBF7] border border-[#E2DED0] rounded-3xl p-5 shadow-sm space-y-4">
              <h4 className="text-xs font-black text-[#2D3A30] flex items-center gap-1.5">
                <span className="text-lg">🛡️</span>
                تحديث البيانات الشخصية للمشرف العام
              </h4>
              <p className="text-[10px] text-[#5F6C61] leading-relaxed">
                تسمح هذه الواجهة لك كمشرف عام بتعديل بريدك الإلكتروني ورقم هاتف جوالك الشخصي وحفظهما مباشرة في قاعدة البيانات.
              </p>
              <form onSubmit={handleUpdateAdminProfile} className="space-y-3">
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1 font-bold">البريد الإلكتروني الشخصي</label>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2DED0] text-xs bg-white text-[#2D3A30] outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1 font-bold">رقم الهاتف الجوال</label>
                  <input
                    type="text"
                    required
                    value={adminPhone}
                    onChange={(e) => setAdminPhone(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2DED0] text-xs bg-white text-[#2D3A30] outline-none font-mono font-bold"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#4A5D4E] hover:bg-[#3E4C41] disabled:opacity-50 text-white font-extrabold text-[11px] py-2 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {loading ? 'جاري الحفظ...' : 'حفظ بياناتي الشخصية 💾'}
                </button>
              </form>
            </div>
          )}

          {/* Part 2: Delegate Detailed Selection and Checkbox Permissions */}
          {isSuperAdmin && (
            <div className="bg-[#FDFBF7] border border-[#E2DED0] rounded-3xl p-5 shadow-sm space-y-4">
              <h4 className="text-xs font-black text-[#2D3A30] flex items-center gap-1.5">
                <span className="text-lg">⚙️</span>
                إدارة وتعديل صلاحيات المندوبين بالكامل
              </h4>
              <p className="text-[10px] text-[#5F6C61] leading-relaxed">
                اختر المندوب من القائمة المنسدلة لتعديل بياناته وتحديد صلاحياته بدقة عبر مربعات الاختيار (Checkboxes).
              </p>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1 font-bold">اختر المندوب المعتمد</label>
                  <div className="relative">
                    <select
                      value={selectedDelegateId}
                      onChange={(e) => setSelectedDelegateId(e.target.value)}
                      className="w-full bg-white border border-[#E2DED0] text-[#2D3A30] font-bold text-xs py-2 pl-8 pr-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#4A5D4E] cursor-pointer appearance-none"
                    >
                      <option value="">-- اختر مندوباً معتمداً --</option>
                      {users
                        .filter(u => u.role === 'delegate')
                        .map(u => (
                          <option key={u.id} value={u.id}>
                            👤 {u.name} {u.surname} ({u.email})
                          </option>
                        ))
                      }
                    </select>
                    <ChevronDown className="absolute left-2.5 top-2.5 text-[#7A8B7E] w-3.5 h-3.5 pointer-events-none" />
                  </div>
                </div>

                {selectedDelegateId && (
                  <form onSubmit={handleUpdateDelegateDetails} className="space-y-3 pt-2 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-gray-500 mb-1 font-bold">الاسم الأول</label>
                        <input
                          type="text"
                          required
                          value={delName}
                          onChange={(e) => setDelName(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2DED0] text-xs bg-white text-[#2D3A30] outline-none font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-500 mb-1 font-bold">العائلة / اللقب</label>
                        <input
                          type="text"
                          required
                          value={delSurname}
                          onChange={(e) => setDelSurname(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2DED0] text-xs bg-white text-[#2D3A30] outline-none font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-gray-500 mb-1 font-bold">البريد الإلكتروني</label>
                      <input
                        type="email"
                        required
                        value={delEmail}
                        onChange={(e) => setDelEmail(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2DED0] text-xs bg-white text-[#2D3A30] outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-gray-500 mb-1 font-bold">رقم الهاتف</label>
                      <input
                        type="text"
                        required
                        value={delPhone}
                        onChange={(e) => setDelPhone(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2DED0] text-xs bg-white text-[#2D3A30] outline-none font-mono font-bold"
                      />
                    </div>

                    <div className="space-y-2 pt-1">
                      <label className="block text-[10px] text-[#4A5D4E] font-black border-b border-gray-100 pb-0.5">الصلاحيات والمهام المفعلة للمندوب</label>
                      
                      <label className="flex items-center gap-2 text-[10px] text-gray-700 font-bold cursor-pointer hover:text-black">
                        <input
                          type="checkbox"
                          checked={delCensus}
                          onChange={(e) => setDelCensus(e.target.checked)}
                          className="accent-[#4A5D4E] h-3.5 w-3.5 cursor-pointer"
                        />
                        <span>صلاحية التعداد والمسح السكاني 📋</span>
                      </label>

                      <label className="flex items-center gap-2 text-[10px] text-gray-700 font-bold cursor-pointer hover:text-black">
                        <input
                          type="checkbox"
                          checked={delCensusEdit}
                          onChange={(e) => setDelCensusEdit(e.target.checked)}
                          className="accent-[#4A5D4E] h-3.5 w-3.5 cursor-pointer"
                        />
                        <span>صلاحية التعديل المبسط للعوائل في التعداد ✏️</span>
                      </label>

                      <label className="flex items-center gap-2 text-[10px] text-gray-700 font-bold cursor-pointer hover:text-black">
                        <input
                          type="checkbox"
                          checked={delDonations}
                          onChange={(e) => setDelDonations(e.target.checked)}
                          className="accent-[#4A5D4E] h-3.5 w-3.5 cursor-pointer"
                        />
                        <span>صلاحية تسجيل تبرعات ومساهمات جديدة 🪙</span>
                      </label>

                      <label className="flex items-center gap-2 text-[10px] text-gray-700 font-bold cursor-pointer hover:text-black">
                        <input
                          type="checkbox"
                          checked={delUpload}
                          onChange={(e) => setDelUpload(e.target.checked)}
                          className="accent-[#4A5D4E] h-3.5 w-3.5 cursor-pointer"
                        />
                        <span>صلاحية رفع كشوفات مالية من الجهاز 📂</span>
                      </label>

                      <label className="flex items-center gap-2 text-[10px] text-gray-700 font-bold cursor-pointer hover:text-black">
                        <input
                          type="checkbox"
                          checked={delGoogle}
                          onChange={(e) => setDelGoogle(e.target.checked)}
                          className="accent-[#4A5D4E] h-3.5 w-3.5 cursor-pointer"
                        />
                        <span>صلاحية جلب البيانات عبر روابط جوجل درايف 🌐</span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-extrabold text-[11px] py-2 rounded-xl shadow-xs transition-colors cursor-pointer mt-2"
                    >
                      {loading ? 'جاري الحفظ...' : 'حفظ تعديلات وصلاحيات المندوب 💾'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
          
          {/* New Admin Quick Action: Delegate Approval & Manual Addition Panel */}
          {isSuperAdmin && (
            <div className="bg-[#FDFBF7] border border-[#E2DED0] rounded-3xl p-5 shadow-sm space-y-4">
              
              {/* Part A-2: Quick Delegate Creation Form (Name & Email only) */}
              <form onSubmit={handleQuickAddDelegate} className="space-y-3 pb-4 border-b border-[#F4F1EA]">
                <h4 className="text-xs font-black text-[#2D3A30] flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-emerald-600" />
                  اعتماد مندوب جديد مباشرة بالاسم والبريد فقط
                </h4>
                <p className="text-[10px] text-[#5F6C61] leading-relaxed">
                  أدخل اسم المندوب وبريده الإلكتروني لإنشاء الحساب واعتماده مباشرة كمندوب تبرعات ومساهمات بالصلاحيات الافتراضية.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1 font-bold">الاسم بالكامل</label>
                    <input
                      type="text"
                      required
                      value={quickDelegateName}
                      onChange={(e) => setQuickDelegateName(e.target.value)}
                      placeholder="مثال: محمد أحمد الجمل"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2DED0] text-xs bg-white text-[#2D3A30] outline-none font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1 font-bold">البريد الإلكتروني</label>
                    <input
                      type="email"
                      required
                      value={quickDelegateEmail}
                      onChange={(e) => setQuickDelegateEmail(e.target.value)}
                      placeholder="delegate@example.com"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2DED0] text-xs bg-white text-[#2D3A30] outline-none font-mono text-left"
                      dir="ltr"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#4A5D4E] hover:bg-[#3E4C41] disabled:opacity-50 text-white font-extrabold text-[11px] py-2 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {loading ? 'جاري الاعتماد والحفظ...' : 'اعتماد المندوب وحفظه تلقائياً للمنصة 🪙'}
                </button>
              </form>

              {/* Part A: Manual Delegate Approval Dropdown */}
              <div className="space-y-2 pb-4 border-b border-[#F4F1EA]">
                <h4 className="text-xs font-black text-[#2D3A30] flex items-center gap-1.5">
                  <span className="text-lg">🪙</span>
                  نظام اعتماد المندوبين الجدد من الحسابات المسجلة
                </h4>
                <p className="text-[10px] text-[#5F6C61] leading-relaxed">
                  قائمة بالحسابات الجديدة التي سجلت بالمنصة ولكنها غير معتمدة كمندوبين حتى الآن. اختر العضو لترقيته واعتماده فورا.
                </p>
                
                {/* Visual pending requests indicators */}
                {(() => {
                  const pendingReqs = users.filter(u => u.pendingActivationRequest || u.status === 'pending_activation');
                  if (pendingReqs.length > 0) {
                    return (
                      <div className="bg-amber-50/70 border border-amber-200/50 rounded-xl p-3 space-y-2 my-2">
                        <span className="text-[10px] font-black text-amber-900 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                          طلبات تفعيل معلقة بانتظار الاعتماد ({pendingReqs.length}):
                        </span>
                        <div className="space-y-1.5 max-h-[150px] overflow-y-auto">
                          {pendingReqs.map(pr => (
                            <div key={pr.id} className="flex items-center justify-between text-[10px] bg-white border border-[#E2DED0] p-1.5 rounded-lg shadow-3xs">
                              <span className="font-bold text-[#2D3A30]">
                                {pr.name} {pr.surname} ({pr.email})
                              </span>
                              <button
                                type="button"
                                onClick={() => setSelectedUserToApprove(pr.id)}
                                className="text-[9px] bg-amber-100 hover:bg-amber-200 text-amber-950 font-black px-2 py-0.5 rounded border border-amber-300 transition-colors cursor-pointer"
                              >
                                حدد للاعتماد 🎯
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                <div className="flex gap-2 pt-1">
                  <div className="relative flex-1">
                    <select
                      value={selectedUserToApprove}
                      onChange={(e) => setSelectedUserToApprove(e.target.value)}
                      className="w-full bg-white border border-[#E2DED0] text-[#2D3A30] font-bold text-[11px] py-2 pl-8 pr-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#4A5D4E] cursor-pointer appearance-none"
                    >
                      <option value="">-- اختر مستخدم مسجل غير معتمد --</option>
                      {users
                        .filter(u => {
                          if (u.role === 'super-admin' || u.role === 'admin') return false;
                          if (u.role === 'delegate' && u.isActivated && u.status === 'approved') return false;
                          return true;
                        })
                        .map(u => {
                          const isPendingRequest = u.pendingActivationRequest || u.status === 'pending_activation';
                          const tag = isPendingRequest ? ' [⏳ أرسل طلب تفعيل معلق]' : '';
                          const dateStr = u.activationRequestDate ? ` (بتاريخ ${new Date(u.activationRequestDate).toLocaleDateString('ar-SA')})` : '';
                          return (
                            <option key={u.id} value={u.id}>
                              {u.name} {u.surname} ({u.email}){tag}{dateStr} - {u.role === 'delegate' ? 'مندوب غير معتمد' : u.role === 'browser' ? 'متصفح غير معتمد' : u.role}
                            </option>
                          );
                        })
                      }
                    </select>
                    <ChevronDown className="absolute left-2.5 top-2.5 text-[#7A8B7E] w-3.5 h-3.5 pointer-events-none" />
                  </div>
                  <button
                    type="button"
                    onClick={handleApproveDelegateManual}
                    disabled={loading || !selectedUserToApprove}
                    className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md cursor-pointer shrink-0 transition-colors"
                  >
                    اعتماد كمندوب
                  </button>
                </div>
              </div>

              {/* Part B: Completely Manual User Creation Form */}
              <form onSubmit={handleCreateManualUser} className="space-y-3">
                <h4 className="text-xs font-black text-[#2D3A30] flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-emerald-600" />
                  إنشاء حساب جديد وتفعيله يدوياً
                </h4>
                <p className="text-[10px] text-[#5F6C61] leading-relaxed">
                  تعبئة بيانات العضو بالكامل من قبل المشرف العام لإنشائه وتفعيله مباشرة مع تفصيل الصلاحيات بدقة.
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1 font-bold">الاسم الأول</label>
                    <input
                      type="text"
                      required
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      placeholder="مثال: عبدالله"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2DED0] text-xs bg-white text-[#2D3A30] outline-none font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1 font-bold">اللقب / العائلة</label>
                    <input
                      type="text"
                      required
                      value={manualSurname}
                      onChange={(e) => setManualSurname(e.target.value)}
                      placeholder="مثال: الجمل"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2DED0] text-xs bg-white text-[#2D3A30] outline-none font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-gray-500 mb-1 font-bold">البريد الإلكتروني</label>
                  <input
                    type="email"
                    required
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2DED0] text-xs bg-white text-[#2D3A30] outline-none font-mono text-left"
                    dir="ltr"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1 font-bold">رقم الهاتف</label>
                    <input
                      type="tel"
                      required
                      value={manualPhone}
                      onChange={(e) => setManualPhone(e.target.value)}
                      placeholder="05xxxxxxx"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2DED0] text-xs bg-white text-[#2D3A30] outline-none font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1 font-bold">كلمة المرور</label>
                    <input
                      type="password"
                      required
                      value={manualPassword}
                      onChange={(e) => setManualPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2DED0] text-xs bg-white text-[#2D3A30] outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Role selection */}
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1 font-bold">تحديد الرتبة الأساسية</label>
                  <select
                    value={manualRole}
                    onChange={(e: any) => setManualRole(e.target.value)}
                    className="w-full bg-white border border-[#E2DED0] text-[#2D3A30] font-bold text-xs py-1.5 px-2.5 rounded-lg outline-none"
                  >
                    <option value="super-admin">مشرف عام النظام 🛡️</option>
                    <option value="admin">مدير شؤون القرية 🏛️</option>
                    <option value="delegate">مندوب تبرعات ومساهمات 🪙</option>
                    <option value="supervisor">مشرف تعداد وباحث ميداني 📋</option>
                    <option value="browser">متصفح وموظف عادي 👥</option>
                  </select>
                </div>

                {/* Responsible Department */}
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1 font-bold">القسم المسؤول عنه</label>
                  <select
                    value={manualDept}
                    onChange={(e) => setManualDept(e.target.value)}
                    className="w-full bg-white border border-[#E2DED0] text-[#2D3A30] font-bold text-xs py-1.5 px-2.5 rounded-lg outline-none"
                  >
                    <option value="كل الأقسام">كل الأقسام 🌐</option>
                    <option value="قسم التبرعات">قسم التبرعات 🪙</option>
                    <option value="قسم التعداد والشرائح السكانية">قسم التعداد والشرائح السكانية 📊</option>
                    <option value="قسم الخدمات والمرافق">قسم الخدمات والمرافق 🛠️</option>
                  </select>
                </div>

                {/* Job Title selection */}
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1 font-bold">المسمى والوظيفة بدقة</label>
                  <div className="grid grid-cols-2 gap-2 bg-[#F4F1EA] p-2 rounded-xl">
                    <label className="flex items-center gap-1.5 text-[10px] text-[#2D3A30] font-extrabold cursor-pointer">
                      <input
                        type="radio"
                        name="manualTitle"
                        value="مندوب تعداد وسكان"
                        checked={manualTitle === 'مندوب تعداد وسكان'}
                        onChange={() => setManualTitle('مندوب تعداد وسكان')}
                        className="accent-[#4A5D4E] cursor-pointer"
                      />
                      <span>تعداد وسكان</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-[10px] text-[#2D3A30] font-extrabold cursor-pointer">
                      <input
                        type="radio"
                        name="manualTitle"
                        value="مندوب تبرعات ومساهمات"
                        checked={manualTitle === 'مندوب تبرعات ومساهمات'}
                        onChange={() => setManualTitle('مندوب تبرعات ومساهمات')}
                        className="accent-[#4A5D4E] cursor-pointer"
                      />
                      <span>تبرعات ومساهمات</span>
                    </label>
                  </div>
                </div>

                {/* Fine permissions checkboxes */}
                <div className="space-y-1.5 pt-1">
                  <label className="block text-[10px] text-[#4A5D4E] font-black border-b border-gray-100 pb-0.5">الصلاحيات البرمجية الدقيقة</label>
                  
                  <label className="flex items-start gap-2 text-[10px] text-gray-700 font-bold cursor-pointer hover:text-black">
                    <input
                      type="checkbox"
                      checked={manualPermUpload}
                      onChange={(e) => setManualPermUpload(e.target.checked)}
                      className="accent-[#4A5D4E] mt-0.5 h-3 w-3 cursor-pointer"
                    />
                    <span>صلاحية تحميل كشف مالي من الجهاز 📂</span>
                  </label>

                  <label className="flex items-start gap-2 text-[10px] text-gray-700 font-bold cursor-pointer hover:text-black">
                    <input
                      type="checkbox"
                      checked={manualPermGoogle}
                      onChange={(e) => setManualPermGoogle(e.target.checked)}
                      className="accent-[#4A5D4E] mt-0.5 h-3 w-3 cursor-pointer"
                    />
                    <span>صلاحية جلب البيانات من رابط جوجل درايف/شيت 🌐</span>
                  </label>

                  <label className="flex items-start gap-2 text-[10px] text-gray-700 font-bold cursor-pointer hover:text-black">
                    <input
                      type="checkbox"
                      checked={manualPermSupervisors}
                      onChange={(e) => setManualPermSupervisors(e.target.checked)}
                      className="accent-[#4A5D4E] mt-0.5 h-3 w-3 cursor-pointer"
                    />
                    <span className="text-amber-800">صلاحية تعديل وإضافة المشرفين وصلاحياتهم (حصرياً للمشرف العام) 🛡️</span>
                  </label>

                  <label className="flex items-start gap-2 text-[10px] text-gray-700 font-bold cursor-pointer hover:text-black">
                    <input
                      type="checkbox"
                      checked={manualPermDepts}
                      onChange={(e) => setManualPermDepts(e.target.checked)}
                      className="accent-[#4A5D4E] mt-0.5 h-3 w-3 cursor-pointer"
                    />
                    <span>صلاحية تعديل الأقسام والحملات 🏛️</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#4A5D4E] hover:bg-[#3E4C41] disabled:opacity-50 text-white font-extrabold text-xs py-2.5 rounded-xl shadow-md transition-colors cursor-pointer mt-2"
                >
                  {loading ? 'جاري الحفظ...' : 'إنشاء وتفعيل الحساب فورا 💾'}
                </button>
              </form>

            </div>
          )}

          <div className="flex items-center justify-between border-b border-[#E2DED0] pb-2">
            <h3 className="text-sm font-extrabold text-[#2D3A30] flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600 animate-spin" />
              طلبات العضوية المعلقة ({pendingRequests.length})
            </h3>
          </div>

          <div className="space-y-3">
            {pendingRequests.length === 0 ? (
              <div className="bg-white rounded-3xl border border-[#E2DED0] p-8 text-center text-[#7A8B7E] text-xs leading-relaxed shadow-3xs">
                <UserCheck className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                لا يوجد أي طلبات عضوية معلقة حالياً بانتظار الموافقة.
              </div>
            ) : (
              pendingRequests.map((req) => (
                <div key={req.id} className="bg-white rounded-2xl border border-[#E2DED0] p-4 shadow-3xs space-y-3 hover:border-[#4A5D4E]/50 transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-black text-[#2D3A30]">{req.name} {req.surname}</h4>
                      <p className="text-[10px] text-gray-500 font-mono mt-0.5">{req.email}</p>
                    </div>
                    <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded border border-amber-200">
                      قيد الانتظار
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] bg-[#FDFBF7] p-2 rounded-xl border border-gray-100">
                    <div>
                      <span className="text-gray-400">الهاتف:</span>
                      <span className="font-mono font-bold text-[#2D3A30] mr-1">{req.phone}</span>
                    </div>
                    <div className="text-left font-mono text-[9px] text-gray-400">
                      {new Date(req.createdAt).toLocaleDateString('ar-SA')}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(req.id, req.email)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] py-1.5 px-3 rounded-lg shadow-3xs transition-all cursor-pointer text-center"
                    >
                      موافقة وتوليد البريد
                    </button>
                    <button
                      onClick={() => handleReject(req.id)}
                      className="bg-red-50 hover:bg-red-100 text-red-700 font-bold text-[10px] py-1.5 px-2.5 rounded-lg border border-red-200 transition-all cursor-pointer text-center"
                    >
                      رفض الطلب
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Interactive Real Inbox Panel */}
          <div className="bg-[#FDFBF7] rounded-3xl border border-[#E2DED0] p-5 shadow-3xs space-y-3">
            <h4 className="text-xs font-black text-[#2D3A30] flex items-center justify-between">
              <span className="flex items-center gap-1.5"><MessageSquare className="w-4 h-4 text-emerald-600" /> صندوق الوارد الحي 📬</span>
              <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-[10px]">{messages.length}</span>
            </h4>
            <p className="text-[10px] text-[#5F6C61] leading-relaxed">
              هنا تظهر الإشعارات والرسائل الفورية عند قيام عضو جديد بالتسجيل، لتتمكن من الموافقة وتفعيل حسابه مباشرة.
            </p>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {messages.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-[10px]">
                  📭 لا يوجد رسائل جديدة.
                </div>
              ) : (
                messages.map((msg) => {
                  // Check if this message contains an activation link
                  const hasLink = msg.message && msg.message.includes('/api/activate-account?token=');
                  const msgText = msg.message.split('/api/activate-account?token=')[0];
                  const tokenMatch = msg.message.match(/token=([a-zA-Z0-9_]+)/);
                  const token = tokenMatch ? tokenMatch[1] : '';
                  
                  return (
                    <div key={msg.id} className="bg-white rounded-xl p-3 border border-[#E2DED0] shadow-sm text-[10px] space-y-2 hover:border-[#4A5D4E]/30 transition-all">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                        <span className="font-extrabold text-[#2D3A30] text-[11px]">{msg.subject || 'رسالة جديدة'}</span>
                        <span className="text-[8px] text-gray-400 font-mono bg-gray-50 px-1.5 py-0.5 rounded">{new Date(msg.timestamp).toLocaleTimeString('ar-SA')}</span>
                      </div>
                      <p className="text-[#5F6C61] text-[10px] font-sans leading-relaxed whitespace-pre-wrap">{msgText}</p>
                      
                      {hasLink && (
                        <a 
                          href={`/api/activate-account?token=${token}`}
                          target="_blank"
                          rel="noreferrer"
                          className="block w-full text-center bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 rounded-lg text-[10px] font-bold transition-all mt-2 flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> تفعيل الحساب فوراً
                        </a>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column (Col-Span 2): Active Members & Role Assignments */}
        <div className="xl:col-span-2 space-y-4">
          <div className="border-b border-[#E2DED0] pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h3 className="text-sm font-extrabold text-[#2D3A30]">
              أعضاء وموظفي المنصة النشطين وإسناد المهام ({users.length})
            </h3>
            
            {/* Filter Tabs */}
            <div className="flex bg-[#F4F1EA] p-1 rounded-xl border border-[#E2DED0] self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setMembersFilter('all')}
                className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${membersFilter === 'all' ? 'bg-[#4A5D4E] text-[#FDFBF7] shadow-sm' : 'text-[#5F6C61] hover:text-[#2D3A30]'}`}
              >
                🌐 الكل ({users.length})
              </button>
              <button
                type="button"
                onClick={() => setMembersFilter('delegates')}
                className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${membersFilter === 'delegates' ? 'bg-amber-600 text-[#FDFBF7] shadow-sm' : 'text-[#5F6C61] hover:text-[#2D3A30]'}`}
              >
                🪙📋 المناديب والمشرفين ({users.filter(u => u.role === 'delegate' || u.role === 'supervisor' || (u.title && (u.title.includes('مندوب') || u.title.includes('مشرف')))).length})
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[#E2DED0] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#F4F1EA] text-[#3E4C41] font-bold border-b border-[#E2DED0]">
                  <tr>
                    <th className="p-4">العضو والبريد</th>
                    <th className="p-4">الرتبة والمسمى الوظيفي</th>
                    <th className="p-4">القسم المسؤول عنه</th>
                    <th className="p-4">الصلاحيات والحالة</th>
                    <th className="p-4">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F4F1EA]">
                  {(() => {
                    const filteredUsers = membersFilter === 'all' 
                      ? users 
                      : users.filter(u => u.role === 'delegate' || u.role === 'supervisor' || (u.title && (u.title.includes('مندوب') || u.title.includes('مشرف'))));
                    
                    if (filteredUsers.length === 0) {
                      return (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-gray-400 font-bold">
                            ⚠️ لا يوجد مناديب معتمدين حالياً بهذه الصلاحيات.
                          </td>
                        </tr>
                      );
                    }

                    return filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-[#FDFBF7] transition-all">
                        <td className="p-4">
                          <div className="font-bold text-[#2D3A30] flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${u.isActivated ? 'bg-emerald-600 animate-pulse' : 'bg-rose-500'}`}></span>
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span>{u.name} {u.surname}</span>
                                {(u.pendingActivationRequest || u.status === 'pending_activation') && (
                                  <span className="bg-rose-100 text-rose-800 border border-rose-200 text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
                                    ⏳ طلب تفعيل معلق
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-gray-400 font-mono mt-0.5">@{u.username}</div>
                              <div className="text-[10px] text-gray-500 font-mono mt-0.5">{u.email} • {u.phone || 'بدون هاتف'}</div>
                            </div>
                          </div>
                        </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black ${
                            u.role === 'super-admin' 
                              ? 'bg-amber-100 text-amber-950 border border-amber-300' 
                              : u.role === 'admin'
                              ? 'bg-blue-100 text-blue-950 border border-blue-300'
                              : 'bg-emerald-50 text-emerald-950 border border-emerald-200'
                          }`}>
                            {u.role === 'super-admin' ? '🛡️ مشرف عام' : u.role === 'admin' ? '🏛️ مدير شؤون' : u.role === 'delegate' ? '🪙 مندوب معتمد' : u.role === 'supervisor' ? '📋 مشرف تعداد' : '👥 متصفح'}
                          </span>
                          <div className="text-[10px] text-gray-600 font-bold">{u.title || 'مندوب تعداد وسكان'}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-[#2D3A30]">{u.department || 'كل الأقسام'}</span>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap gap-1">
                            {(!u.permissions || u.permissions.canUploadFile !== false) && (
                              <span className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded text-[9px] font-bold">رفع ملفات 📂</span>
                            )}
                            {(!u.permissions || u.permissions.canFetchGoogle !== false) && (
                              <span className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded text-[9px] font-bold">جلب جوجل 🌐</span>
                            )}
                            {u.permissions?.canManageSupervisors && (
                              <span className="bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded text-[9px] font-bold">المشرفين 🛡️</span>
                            )}
                            {u.permissions?.canManageDeptsAndCampaigns && (
                              <span className="bg-purple-50 text-purple-800 border border-purple-200 px-1.5 py-0.5 rounded text-[9px] font-bold">الأقسام 🏛️</span>
                            )}
                            {u.permissions?.canEditCensus && (
                              <span className="bg-blue-50 text-blue-800 border border-blue-200 px-1.5 py-0.5 rounded text-[9px] font-bold">تعديل التعداد ✏️</span>
                            )}
                          </div>
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-black ${
                            u.isActivated ? 'text-emerald-700' : 'text-rose-700'
                          }`}>
                            {u.isActivated ? '● نشط ومؤكد' : '○ غير مفعل'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        {isSuperAdmin ? (
                          u.role === 'super-admin' ? (
                            <span className="text-[10px] text-gray-400 font-bold">صلاحيات مطلقة 🔒</span>
                          ) : (
                            <div className="flex flex-col sm:flex-row gap-2 justify-center">
                              <button
                                onClick={() => handleOpenEditUserModal(u)}
                                className="bg-[#F4F1EA] hover:bg-[#E9F0E0] text-[#4A5D4E] border border-[#E2DED0] px-2.5 py-1.5 rounded-xl font-black text-[10px] flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap justify-center"
                              >
                                ⚙️ الصلاحيات
                              </button>
                              <button
                                onClick={() => handleOpenResetPasswordModal(u)}
                                className="bg-amber-50 hover:bg-amber-100/80 text-amber-800 border border-amber-200 px-2.5 py-1.5 rounded-xl font-black text-[10px] flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap justify-center"
                              >
                                🔑 إعادة تعيين
                              </button>
                            </div>
                          )
                        ) : (
                          <span className="text-[10px] text-gray-400 font-bold">للعرض فقط 👁️</span>
                        )}
                      </td>
                    </tr>
                  ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
      ) : activeTab === 'inbox' ? (
        <div className="bg-white rounded-3xl border border-[#E2DED0] shadow-sm p-6">
          <div className="border-b border-[#E2DED0] pb-4 mb-4 flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-[#2D3A30] flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-600" />
              صندوق الرسائل والمقترحات ({messages.length})
            </h3>
            <button onClick={loadData} className="text-xs bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 flex items-center gap-1.5 transition-all cursor-pointer font-bold">
              تحديث الصندوق
            </button>
          </div>
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-10 text-gray-400 font-bold text-xs">
                📭 لا يوجد رسائل أو مقترحات جديدة
              </div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className="border border-[#E2DED0] bg-[#FDFBF7] p-5 rounded-2xl space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="bg-gray-200 text-gray-800 text-[10px] px-2 py-0.5 rounded font-bold">{msg.msgType}</span>
                        <span className="text-[10px] font-mono text-gray-400">#{msg.referenceNumber}</span>
                      </div>
                      <h4 className="font-bold text-[#2D3A30] text-sm">{msg.subject || "بدون عنوان"}</h4>
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono bg-white px-2 py-1 border border-gray-100 rounded-md">
                      {new Date(msg.timestamp).toLocaleString("ar-SA")}
                    </span>
                  </div>
                  <p className="text-xs text-[#5F6C61] leading-relaxed bg-white p-3 rounded-xl border border-gray-100 whitespace-pre-wrap">
                    {msg.message}
                  </p>
                  <div className="flex flex-wrap gap-4 text-[11px] text-gray-500 pt-2 border-t border-gray-100 mt-2">
                    <span className="font-bold flex items-center gap-1"><User className="w-3 h-3"/> {msg.name}</span>
                    <span className="font-mono font-bold flex items-center gap-1">📞 {msg.phone}</span>
                    {msg.neighborhood && <span className="flex items-center gap-1">📍 {msg.neighborhood}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Section 1: Active Sessions */}
          <div className="bg-white rounded-3xl border border-[#E2DED0] shadow-sm p-6">
            <div className="border-b border-[#E2DED0] pb-4 mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-[#2D3A30] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
                  المستخدمون المتصلون الآن بالمنصة ({activeSessions.length})
                </h3>
                <p className="text-[10px] text-gray-500 mt-1">قائمة تفاعلية بالمسؤولين والمندوبين النشطين المسجل دخولهم حالياً في النظام وتفاصيل أجهزتهم.</p>
              </div>
              <button onClick={loadData} className="text-xs bg-gray-50 text-[#4A5D4E] hover:bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 flex items-center gap-1.5 transition-all cursor-pointer font-bold">
                🔄 تحديث فوري
              </button>
            </div>

            {activeSessions.length === 0 ? (
              <div className="text-center py-10 text-gray-400 font-bold text-xs">
                💤 لا توجد جلسات نشطة حالياً (مسجلو الدخول الآخرون غير متصلين حالياً)
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeSessions.map((session, idx) => (
                  <div key={idx} className="bg-[#FDFBF7] border border-[#E2DED0] p-4 rounded-2xl flex flex-col justify-between space-y-3 relative overflow-hidden">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-emerald-600"></div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#2D3A30] text-xs">{session.userName}</span>
                        <span className="bg-emerald-50 text-emerald-800 text-[9px] px-2 py-0.5 rounded-full border border-emerald-200 font-black animate-pulse">متصل الآن</span>
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono">{session.userEmail}</div>
                      <div className="text-[10px] text-gray-600 font-bold">الرتبة: {session.userRole === 'super-admin' ? '🛡️ مشرف عام' : session.userRole === 'admin' ? '🏛️ مدير شؤون' : session.userRole === 'delegate' ? '🪙 مندوب معتمد' : '📋 مشرف تعداد'}</div>
                    </div>

                    <div className="border-t border-[#F4F1EA] pt-2 space-y-1 text-[9px] text-gray-500 font-mono">
                      <div>🕒 وقت الدخول: {new Date(session.loginTime).toLocaleString("ar-SA")}</div>
                      <div className="truncate">💻 الجهاز: {session.userAgent || 'متصفح ويب آمن'}</div>
                      <div>🌐 عنوان الـ IP: {session.ip || '127.0.0.1'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Activity Logs */}
          <div className="bg-white rounded-3xl border border-[#E2DED0] shadow-sm p-6 space-y-6">
            <div className="border-b border-[#E2DED0] pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-sm font-extrabold text-[#2D3A30] flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-500" />
                  تقارير ورقابة المناديب (سجل الأنشطة وأمان المنظومة)
                </h3>
                <p className="text-[10px] text-gray-500 mt-1">سجل تفصيلي مؤمن غير قابل للتعديل لتتبع عمليات التعداد، والخدمات، وتسجيلات التبرعات وحركات الحسابات في المنصة.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setFilterUser('all');
                    setFilterSection('all');
                    setFilterActionType('all');
                  }}
                  className="text-[10px] bg-gray-100 hover:bg-gray-200 text-[#4A5D4E] px-2.5 py-1.5 rounded-lg font-bold border border-gray-200 transition-all cursor-pointer"
                >
                  🧹 إعادة تعيين التصفية
                </button>
                <span className="bg-[#E9F0E0] text-[#4A5D4E] border border-[#DDE5B6] text-[10px] font-black px-2.5 py-1 rounded-lg">سجل حي ومراقب</span>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              <div className="bg-[#FDFBF7] border border-[#E2DED0] p-3 rounded-2xl text-center space-y-1">
                <div className="text-[9px] text-[#7A8B7E] font-bold">إجمالي الحركات المصفاة</div>
                <div className="text-lg font-black text-[#2D3A30]">{logStats.total}</div>
              </div>
              <div className="bg-[#E9F0E0]/40 border border-[#DDE5B6]/60 p-3 rounded-2xl text-center space-y-1">
                <div className="text-[9px] text-[#4A5D4E] font-bold">✨ عمليات الإضافة</div>
                <div className="text-lg font-black text-emerald-800">{logStats.adds}</div>
              </div>
              <div className="bg-amber-50/40 border border-amber-200/50 p-3 rounded-2xl text-center space-y-1">
                <div className="text-[9px] text-amber-800 font-bold">✏️ عمليات التعديل</div>
                <div className="text-lg font-black text-amber-700">{logStats.edits}</div>
              </div>
              <div className="bg-orange-50/30 border border-orange-200/40 p-3 rounded-2xl text-center space-y-1">
                <div className="text-[9px] text-orange-800 font-bold">🔄 عمليات النقل</div>
                <div className="text-lg font-black text-orange-800">{logStats.transfers}</div>
              </div>
              <div className="bg-red-50/30 border border-red-200/40 p-3 rounded-2xl text-center space-y-1">
                <div className="text-[9px] text-red-800 font-bold">🗑️ عمليات الحذف</div>
                <div className="text-lg font-black text-red-600">{logStats.deletes}</div>
              </div>
              <div className="bg-blue-50/30 border border-blue-200/40 p-3 rounded-2xl text-center space-y-1 col-span-2 md:col-span-1">
                <div className="text-[9px] text-blue-800 font-bold">🔑 تسجيلات الدخول</div>
                <div className="text-lg font-black text-blue-700">{logStats.logins}</div>
              </div>
            </div>

            {/* Advanced Filters Panel */}
            <div className="bg-[#FDFBF7] border border-[#E2DED0] p-4 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Delegate Selector */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-500">اسم المندوب المسؤول</label>
                <select
                  value={filterUser}
                  onChange={(e) => setFilterUser(e.target.value)}
                  className="w-full bg-white border border-[#E2DED0] rounded-xl text-xs py-2 px-3 text-[#2D3A30] font-bold outline-none focus:ring-1 focus:ring-[#4A5D4E]"
                >
                  <option value="all">الكل (جميع المناديب)</option>
                  {uniqueUsersInLogs.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              {/* Section Selector */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-500">القسم المتأثر</label>
                <select
                  value={filterSection}
                  onChange={(e) => setFilterSection(e.target.value)}
                  className="w-full bg-white border border-[#E2DED0] rounded-xl text-xs py-2 px-3 text-[#2D3A30] font-bold outline-none focus:ring-1 focus:ring-[#4A5D4E]"
                >
                  <option value="all">الكل (جميع الأقسام)</option>
                  <option value="التعداد">📍 التعداد السكاني</option>
                  <option value="الخدمات">🏥 الخدمات والمرافق</option>
                  <option value="التبرعات">🪙 التبرعات والمساهمات</option>
                  <option value="الحسابات">👤 الحسابات والصلاحيات</option>
                  <option value="الإعدادات">⚙️ إعدادات النظام</option>
                  <option value="أخرى">📋 أخرى</option>
                </select>
              </div>

              {/* Action Type Selector */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-500">نوع الإجراء</label>
                <select
                  value={filterActionType}
                  onChange={(e) => setFilterActionType(e.target.value)}
                  className="w-full bg-white border border-[#E2DED0] rounded-xl text-xs py-2 px-3 text-[#2D3A30] font-bold outline-none focus:ring-1 focus:ring-[#4A5D4E]"
                >
                  <option value="all">الكل (جميع الإجراءات)</option>
                  <option value="إضافة">إضافة ➕</option>
                  <option value="تعديل">تعديل ✏️</option>
                  <option value="نقل">نقل 🔄</option>
                  <option value="حذف">حذف 🗑️</option>
                  <option value="تسجيل دخول">تسجيل دخول 🔑</option>
                  <option value="أخرى">أخرى 📋</option>
                </select>
              </div>
            </div>

            {/* Logs Table */}
            <div className="overflow-hidden border border-[#E2DED0] rounded-2xl">
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-[#F4F1EA] text-[#3E4C41] font-bold sticky top-0 z-10">
                    <tr>
                      <th className="p-3 w-[15%]">التوقيت والزمن</th>
                      <th className="p-3 w-[20%]">المندوب المسؤول</th>
                      <th className="p-3 w-[15%]">القسم المتأثر</th>
                      <th className="p-3 w-[15%]">نوع الإجراء</th>
                      <th className="p-3 w-[35%]">تفاصيل العملية المتخذة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F4F1EA] bg-white">
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-gray-400 font-bold text-xs">
                          📭 لا توجد سجلات أنشطة تطابق الفلاتر المحددة حالياً
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-amber-50/20 transition-all">
                          {/* Timestamp */}
                          <td className="p-3 font-mono text-[10px] text-gray-400 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString("ar-SA")}
                          </td>

                          {/* Delegate Info */}
                          <td className="p-3 whitespace-nowrap">
                            <div className="font-bold text-[#2D3A30]">{log.userName || 'مسؤول النظام'}</div>
                            <div className="text-[9px] text-gray-400 font-mono">{log.userEmail || 'system@aljamal.com'}</div>
                          </td>

                          {/* Section badges */}
                          <td className="p-3 whitespace-nowrap">
                            {log.section === 'التعداد' ? (
                              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold">📍 التعداد</span>
                            ) : log.section === 'الخدمات' ? (
                              <span className="bg-cyan-50 text-cyan-800 border border-cyan-200 px-2 py-0.5 rounded-full text-[10px] font-bold">🏥 الخدمات</span>
                            ) : log.section === 'التبرعات' ? (
                              <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-bold">🪙 التبرعات</span>
                            ) : log.section === 'الحسابات' ? (
                              <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-full text-[10px] font-bold">👤 الحسابات</span>
                            ) : log.section === 'الإعدادات' ? (
                              <span className="bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-full text-[10px] font-bold">⚙️ الإعدادات</span>
                            ) : (
                              <span className="bg-gray-50 text-gray-600 border border-gray-200 px-2 py-0.5 rounded-full text-[10px] font-bold">📋 {log.section || 'أخرى'}</span>
                            )}
                          </td>

                          {/* Action Type badges */}
                          <td className="p-3 whitespace-nowrap">
                            {log.actionType === 'إضافة' ? (
                              <span className="bg-[#E9F0E0] text-[#4A5D4E] border border-[#DDE5B6] px-2 py-0.5 rounded text-[10px] font-extrabold">إضافة ➕</span>
                            ) : log.actionType === 'تعديل' ? (
                              <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-extrabold">تعديل ✏️</span>
                            ) : log.actionType === 'نقل' ? (
                              <span className="bg-orange-50 text-orange-800 border border-orange-200 px-2 py-0.5 rounded text-[10px] font-extrabold">نقل 🔄</span>
                            ) : log.actionType === 'حذف' ? (
                              <span className="bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded text-[10px] font-extrabold">حذف 🗑️</span>
                            ) : log.actionType === 'تسجيل دخول' ? (
                              <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded text-[10px] font-extrabold">تسجيل دخول 🔑</span>
                            ) : (
                              <span className="bg-gray-50 text-gray-700 border border-gray-200 px-2 py-0.5 rounded text-[10px] font-bold">{log.actionType || 'أخرى'}</span>
                            )}
                          </td>

                          {/* Action Description */}
                          <td className="p-3 font-medium text-[#3E4C41]">
                            <span className="bg-[#FDFBF7] border border-gray-100 px-2.5 py-1 rounded-xl inline-block text-[11px] leading-relaxed">
                              {log.action}
                            </span>
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
      )}

      {/* Edit User Permissions Modal */}
      {isEditingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" dir="rtl">
          <div className="bg-[#FDFBF7] rounded-3xl border border-[#E2DED0] shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#4A5D4E] text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-extrabold text-xs flex items-center gap-2">
                ⚙️ تعديل تفاصيل الحساب والصلاحيات الإدارية
              </h3>
              <button 
                onClick={() => setIsEditingUser(null)}
                className="text-white hover:text-gray-200 font-extrabold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Header profile info */}
              <div className="bg-[#F4F1EA] p-4 rounded-2xl space-y-1 border border-[#E2DED0]">
                <div className="font-black text-xs text-[#2D3A30]">{isEditingUser.name} {isEditingUser.surname}</div>
                <div className="text-[10px] text-gray-500 font-mono">البريد الإلكتروني: {isEditingUser.email}</div>
                <div className="text-[10px] text-gray-500 font-mono">الهاتف: {isEditingUser.phone}</div>
              </div>

              {/* Form elements */}
              <div className="space-y-3">
                {/* Role dropdown */}
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1 font-bold">الرتبة العامة</label>
                  <select
                    value={editRole}
                    onChange={(e: any) => setEditRole(e.target.value)}
                    className="w-full bg-white border border-[#E2DED0] text-[#2D3A30] font-bold text-xs py-2 px-3 rounded-xl outline-none focus:ring-1 focus:ring-[#4A5D4E]"
                  >
                    <option value="super-admin">مشرف عام النظام 🛡️</option>
                    <option value="admin">مدير شؤون القرية 🏛️</option>
                    <option value="delegate">مندوب تبرعات ومساهمات 🪙</option>
                    <option value="supervisor">مشرف تعداد وباحث ميداني 📋</option>
                    <option value="browser">متصفح وموظف عادي 👥</option>
                  </select>
                </div>

                {/* Edit Phone Number */}
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1 font-bold">رقم الهاتف الفعلي (المندوب)</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="مثال: 0500000000"
                    className="w-full bg-white border border-[#E2DED0] text-[#2D3A30] font-bold text-xs py-2 px-3 rounded-xl outline-none focus:ring-1 focus:ring-[#4A5D4E]"
                  />
                </div>

                {/* Responsible Department */}
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1 font-bold">القسم المسؤول عنه</label>
                  <select
                    value={editDept}
                    onChange={(e) => setEditDept(e.target.value)}
                    className="w-full bg-white border border-[#E2DED0] text-[#2D3A30] font-bold text-xs py-2 px-3 rounded-xl outline-none focus:ring-1 focus:ring-[#4A5D4E]"
                  >
                    <option value="كل الأقسام">كل الأقسام 🌐</option>
                    <option value="قسم التبرعات">قسم التبرعات 🪙</option>
                    <option value="قسم التعداد والشرائح السكانية">قسم التعداد والشرائح السكانية 📊</option>
                    <option value="قسم الخدمات والمرافق">قسم الخدمات والمرافق 🛠️</option>
                  </select>
                </div>

                {/* Job Title selection */}
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1 font-bold">المسمى والوظيفة بدقة</label>
                  <div className="grid grid-cols-2 gap-2 bg-[#F4F1EA] p-2 rounded-xl border border-gray-100">
                    <label className="flex items-center gap-1.5 text-[10px] text-[#2D3A30] font-extrabold cursor-pointer">
                      <input
                        type="radio"
                        name="editTitle"
                        value="مندوب تعداد وسكان"
                        checked={editTitle === 'مندوب تعداد وسكان'}
                        onChange={() => setEditTitle('مندوب تعداد وسكان')}
                        className="accent-[#4A5D4E] cursor-pointer"
                      />
                      <span>تعداد وسكان</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-[10px] text-[#2D3A30] font-extrabold cursor-pointer">
                      <input
                        type="radio"
                        name="editTitle"
                        value="مندوب تبرعات ومساهمات"
                        checked={editTitle === 'مندوب تبرعات ومساهمات'}
                        onChange={() => setEditTitle('مندوب تبرعات ومساهمات')}
                        className="accent-[#4A5D4E] cursor-pointer"
                      />
                      <span>تبرعات ومساهمات</span>
                    </label>
                  </div>
                </div>

                {/* Fine permissions checkboxes */}
                <div className="space-y-1.5 pt-2">
                  <label className="block text-[10px] text-[#4A5D4E] font-black border-b border-gray-100 pb-0.5">الصلاحيات البرمجية الدقيقة</label>
                  
                  <label className="flex items-start gap-2 text-[10px] text-gray-700 font-bold cursor-pointer hover:text-black">
                    <input
                      type="checkbox"
                      checked={editPermUpload}
                      onChange={(e) => setEditPermUpload(e.target.checked)}
                      className="accent-[#4A5D4E] mt-0.5 h-3 w-3 cursor-pointer"
                    />
                    <span>صلاحية تحميل كشف مالي من الجهاز 📂</span>
                  </label>

                  <label className="flex items-start gap-2 text-[10px] text-gray-700 font-bold cursor-pointer hover:text-black">
                    <input
                      type="checkbox"
                      checked={editPermGoogle}
                      onChange={(e) => setEditPermGoogle(e.target.checked)}
                      className="accent-[#4A5D4E] mt-0.5 h-3 w-3 cursor-pointer"
                    />
                    <span>صلاحية جلب البيانات من رابط جوجل درايف/شيت 🌐</span>
                  </label>

                  <label className="flex items-start gap-2 text-[10px] text-gray-700 font-bold cursor-pointer hover:text-black">
                    <input
                      type="checkbox"
                      checked={editPermSupervisors}
                      onChange={(e) => setEditPermSupervisors(e.target.checked)}
                      className="accent-[#4A5D4E] mt-0.5 h-3 w-3 cursor-pointer"
                    />
                    <span className="text-amber-800">صلاحية تعديل وإضافة المشرفين وصلاحياتهم (حصرياً للمشرف العام) 🛡️</span>
                  </label>

                  <label className="flex items-start gap-2 text-[10px] text-gray-700 font-bold cursor-pointer hover:text-black">
                    <input
                      type="checkbox"
                      checked={editPermDepts}
                      onChange={(e) => setEditPermDepts(e.target.checked)}
                      className="accent-[#4A5D4E] mt-0.5 h-3 w-3 cursor-pointer"
                    />
                    <span>صلاحية تعديل الأقسام والحملات 🏛️</span>
                  </label>

                  <label className="flex items-start gap-2 text-[10px] text-gray-700 font-bold cursor-pointer hover:text-black">
                    <input
                      type="checkbox"
                      checked={editPermEditCensus}
                      onChange={(e) => setEditPermEditCensus(e.target.checked)}
                      className="accent-[#4A5D4E] mt-0.5 h-3 w-3 cursor-pointer"
                    />
                    <span>صلاحية التعديل المبسط للعوائل في التعداد ✏️</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Bottom buttons */}
            <div className="bg-[#F4F1EA] px-6 py-4 flex items-center justify-between border-t border-[#E2DED0]">
              {isSuperAdmin ? (
                <button
                  type="button"
                  onClick={() => handleDeleteUserPermanently(isEditingUser.id, `${isEditingUser.name} ${isEditingUser.surname}`)}
                  className="bg-rose-100 hover:bg-rose-200 text-rose-800 text-[11px] font-black px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  حذف الحساب نهائياً
                </button>
              ) : (
                <div className="text-[10px] text-gray-400 font-bold">حذف الحسابات محصور بالمشرف العام 🔒</div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingUser(null)}
                  className="bg-white hover:bg-gray-100 text-gray-700 text-[11px] font-bold px-4 py-2 rounded-xl border border-gray-300 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleUpdateUserPermissions}
                  disabled={loading}
                  className="bg-[#4A5D4E] hover:bg-[#3E4C41] disabled:opacity-50 text-white text-[11px] font-extrabold px-4 py-2 rounded-xl shadow-md cursor-pointer"
                >
                  حفظ التعديلات 💾
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetPasswordUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" dir="rtl">
          <div className="bg-[#FDFBF7] rounded-3xl border border-[#E2DED0] shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-amber-600 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-extrabold text-xs flex items-center gap-2">
                🔑 إعادة تعيين كلمة المرور للعضو
              </h3>
              <button 
                onClick={() => setResetPasswordUser(null)}
                className="text-white hover:text-gray-200 font-extrabold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-[#F4F1EA] p-4 rounded-2xl space-y-1 border border-[#E2DED0]">
                <div className="font-black text-xs text-[#2D3A30]">{resetPasswordUser.name} {resetPasswordUser.surname}</div>
                <div className="text-[10px] text-gray-500 font-mono">البريد الإلكتروني: {resetPasswordUser.email}</div>
                <div className="text-[10px] text-gray-500 font-mono">الدور الحالي: {resetPasswordUser.role}</div>
              </div>

              <div>
                <label className="block text-[10px] text-gray-500 mb-1 font-bold">كلمة المرور الجديدة</label>
                <input
                  type="text"
                  value={resetPasswordValue}
                  onChange={(e) => setResetPasswordValue(e.target.value)}
                  placeholder="أدخل كلمة مرور جديدة آمنة"
                  className="w-full bg-white border border-[#E2DED0] text-[#2D3A30] font-mono font-bold text-xs py-2 px-3 rounded-xl outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="bg-[#F4F1EA] px-6 py-4 flex items-center justify-end gap-2 border-t border-[#E2DED0]">
              <button
                type="button"
                onClick={() => setResetPasswordUser(null)}
                className="bg-white hover:bg-gray-100 text-gray-700 text-[11px] font-bold px-4 py-2 rounded-xl border border-gray-300 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleResetUserPassword}
                disabled={loading || !resetPasswordValue.trim()}
                className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-[11px] font-extrabold px-4 py-2 rounded-xl shadow-md cursor-pointer"
              >
                حفظ التحديث 💾
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
