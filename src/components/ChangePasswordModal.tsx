import React, { useState } from 'react';
import { X, Key, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';

interface ChangePasswordModalProps {
  currentUserEmail: string;
  onClose: () => void;
}

const DEFAULT_WHITELIST = [
  { username: 'helmialkhateeb', email: 'helmialkhateeb@gmail.com', password: '123456', name: 'حلمي الخطيب (المشرف العام)' },
  { username: 'helmiali_admin', email: 'helmiali2014@gmail.com', password: '123456', name: 'حلمي علي هزاع (مدير شؤون القرية)' }
];

export default function ChangePasswordModal({ currentUserEmail, onClose }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const emailLower = currentUserEmail.toLowerCase();

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('يرجى ملء جميع الحقول المطلوبة.');
      return;
    }

    if (newPassword.length < 5) {
      setError('كلمة المرور الجديدة يجب أن لا تقل عن 5 أحرف أو أرقام.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('كلمة المرور الجديدة وتأكيدها غير متطابقين.');
      return;
    }

    try {
      const res = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUserEmail,
          oldPassword: currentPassword,
          newPassword: newPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'عذراً، حدث خطأ أثناء تغيير كلمة المرور.');
        return;
      }

      // Sync with localStorage registered admins list as a fallback for any other legacy code
      try {
        let allAdmins = [...DEFAULT_WHITELIST];
        const saved = localStorage.getItem('local_registered_admins_v1');
        if (saved) {
          allAdmins = JSON.parse(saved);
        }
        const userIndex = allAdmins.findIndex(
          u => u.email?.toLowerCase() === emailLower || u.username?.toLowerCase() === emailLower
        );
        if (userIndex !== -1) {
          allAdmins[userIndex].password = newPassword;
        } else {
          allAdmins.push({
            username: currentUserEmail.split('@')[0],
            email: currentUserEmail,
            password: newPassword,
            name: currentUserEmail
          });
        }
        localStorage.setItem('local_registered_admins_v1', JSON.stringify(allAdmins));
      } catch (localErr) {
        console.error('Error syncing local state for password change:', localErr);
      }

      setSuccess('✅ تم تغيير كلمة المرور بنجاح! سيتم إغلاق هذه النافذة.');
      setTimeout(() => {
        onClose();
      }, 1800);

    } catch (err) {
      console.error('Network error during password change:', err);
      setError('تعذر الاتصال بالخادم لتحديث كلمة المرور. يرجى المحاولة لاحقاً.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="change-password-modal">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#2D3A30]/60 backdrop-blur-xs transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="bg-[#FDFBF7] w-full max-w-md rounded-3xl border border-[#E2DED0] shadow-2xl relative overflow-hidden z-10 flex flex-col max-h-[90vh]">
        <div className="bg-amber-500 h-1.5 w-full" />

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute left-4 top-4 p-1.5 rounded-xl hover:bg-[#F4F1EA] text-[#7A8B7E] hover:text-[#2D3A30] transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8 overflow-y-auto space-y-5">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#4A5D4E] flex items-center justify-center text-white mx-auto shadow-md">
              <Key className="w-6 h-6 text-amber-400" />
            </div>
            <h3 className="text-base font-extrabold text-[#2D3A30] tracking-tight">
              تغيير كلمة المرور الخاصة بك
            </h3>
            <p className="text-[11px] text-[#7A8B7E] max-w-xs mx-auto leading-relaxed">
              قم بتحديث كلمة مرور حسابك الحالي لتأمين وصولك وحماية بياناتك المسجلة.
            </p>
          </div>

          {success && (
            <div className="bg-[#E9F0E0] border border-[#DDE5B6] text-[#4A5D4E] p-3.5 rounded-2xl text-[11px] font-bold flex items-start gap-2 leading-relaxed">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-2xl text-[11px] font-bold flex items-start gap-2 leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            {/* Current Password */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-[#3E4C41]">كلمة المرور الحالية</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#E2DED0] text-xs text-[#2D3A30] bg-white focus:ring-2 focus:ring-[#4A5D4E]/20 focus:border-[#4A5D4E] transition-all outline-none text-left font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute left-3 top-2.5 text-[#7A8B7E] hover:text-[#2D3A30]"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-[#3E4C41]">كلمة المرور الجديدة</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#E2DED0] text-xs text-[#2D3A30] bg-white focus:ring-2 focus:ring-[#4A5D4E]/20 focus:border-[#4A5D4E] transition-all outline-none text-left font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute left-3 top-2.5 text-[#7A8B7E] hover:text-[#2D3A30]"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-[#3E4C41]">تأكيد كلمة المرور الجديدة</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#E2DED0] text-xs text-[#2D3A30] bg-white focus:ring-2 focus:ring-[#4A5D4E]/20 focus:border-[#4A5D4E] transition-all outline-none text-left font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute left-3 top-2.5 text-[#7A8B7E] hover:text-[#2D3A30]"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#4A5D4E] hover:bg-[#3E4C41] text-[#FDFBF7] py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2"
            >
              تحديث وحفظ كلمة المرور
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
