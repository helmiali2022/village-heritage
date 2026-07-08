import React, { useState } from 'react';
import { ShieldAlert, User, Phone, Mail, Lock, Eye, EyeOff, Save, AlertCircle } from 'lucide-react';

interface FirstLoginUpdateProps {
  currentUser: any;
  onSuccess: (updatedUser: any) => void;
  onLogout: () => void;
}

export default function FirstLoginUpdate({ currentUser, onSuccess, onLogout }: FirstLoginUpdateProps) {
  const [name, setName] = useState(currentUser.name || '');
  const [surname, setSurname] = useState(currentUser.surname || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !surname.trim() || !phone.trim() || !email.trim() || !newPassword || !confirmPassword) {
      setError('يرجى ملء جميع الحقول المطلوبة.');
      return;
    }

    // Yemeni Phone validation: 9 digits starting with 7
    const cleanPhone = phone.trim().replace(/[\s\-\+\(\)]/g, '');
    if (!/^7\d{8}$/.test(cleanPhone)) {
      setError('يجب أن يكون رقم الهاتف جوال يمني مكون من 9 أرقام ويبدأ بـ 7 (مثال: 771787747).');
      return;
    }

    if (newPassword.length < 5) {
      setError('كلمة المرور الجديدة يجب أن لا تقل عن 5 أحرف أو أرقام.');
      return;
    }

    if (newPassword === '123456') {
      setError('عذراً، يجب تغيير كلمة المرور الافتراضية "123456" إلى كلمة مرور أخرى جديدة وآمنة.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('كلمة المرور الجديدة وتأكيدها غير متطابقين.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/first-login-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          name: name.trim(),
          surname: surname.trim(),
          phone: phone.trim(),
          email: email.trim(),
          password: newPassword
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'حدث خطأ أثناء حفظ التحديثات.');
      }

      if (data.success) {
        onSuccess(data.user);
      }
    } catch (err: any) {
      setError(err.message || 'فشل الاتصال بالخادم.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D3A30]/85 backdrop-blur-md" dir="rtl">
      <div className="bg-[#FDFBF7] w-full max-w-lg rounded-3xl border border-[#E2DED0] shadow-2xl relative overflow-hidden z-10 flex flex-col max-h-[95vh]">
        {/* Header decorative color bar */}
        <div className="bg-[#A98467] h-2 w-full animate-pulse" />

        <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
          {/* Header Warning */}
          <div className="text-center space-y-3 bg-[#FFF9F2] border border-amber-200 p-4 rounded-2xl">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 mx-auto animate-bounce">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h2 className="text-base sm:text-lg font-black text-amber-950">
              هام جداً: يرجى تغيير كلمة المرور الافتراضية وتحديث بياناتك للاستمرار
            </h2>
            <p className="text-xs text-amber-900 leading-relaxed">
              لقد سجلت الدخول باستخدام كلمة المرور الافتراضية المؤقتة للنظام. لضمان أمان حسابك وحماية البيانات، يرجى تحديث بياناتك الشخصية وتعيين كلمة مرور جديدة خاصة بك قبل التمكّن من تصفح أو استخدام أي من خيارات المنصة.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-2xl text-xs font-bold flex items-start gap-2 leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold text-[#3E4C41]">الاسم الأول للمندوب/المشرف</label>
                <div className="relative">
                  <User className="absolute right-3 top-2.5 text-[#7A8B7E] w-3.5 h-3.5" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: حلمي"
                    className="w-full pl-3 pr-9 py-2 rounded-xl border border-[#E2DED0] text-xs text-[#2D3A30] bg-white focus:ring-2 focus:ring-[#4A5D4E]/20 focus:border-[#4A5D4E] transition-all outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold text-[#3E4C41]">اللقب / العائلة</label>
                <div className="relative">
                  <User className="absolute right-3 top-2.5 text-[#7A8B7E] w-3.5 h-3.5" />
                  <input
                    type="text"
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                    placeholder="مثال: الخطيب"
                    className="w-full pl-3 pr-9 py-2 rounded-xl border border-[#E2DED0] text-xs text-[#2D3A30] bg-white focus:ring-2 focus:ring-[#4A5D4E]/20 focus:border-[#4A5D4E] transition-all outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-extrabold text-[#3E4C41]">رقم الهاتف المحمول (جوال يمني)</label>
              <div className="relative">
                <Phone className="absolute right-3 top-2.5 text-[#7A8B7E] w-3.5 h-3.5" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9 أرقام يبدأ بـ 7 (مثال: 771787747)"
                  className="w-full pl-3 pr-9 py-2 rounded-xl border border-[#E2DED0] text-xs text-[#2D3A30] bg-white focus:ring-2 focus:ring-[#4A5D4E]/20 focus:border-[#4A5D4E] transition-all outline-none text-left font-mono"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-extrabold text-[#3E4C41]">البريد الإلكتروني</label>
              <div className="relative">
                <Mail className="absolute right-3 top-2.5 text-[#7A8B7E] w-3.5 h-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-3 pr-9 py-2 rounded-xl border border-[#E2DED0] text-xs text-[#2D3A30] bg-white focus:ring-2 focus:ring-[#4A5D4E]/20 focus:border-[#4A5D4E] transition-all outline-none text-left font-mono"
                  required
                />
              </div>
            </div>

            <div className="border-t border-[#F4F1EA] pt-4 grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold text-[#3E4C41]">كلمة المرور الجديدة</label>
                <div className="relative">
                  <Lock className="absolute right-3 top-2.5 text-[#7A8B7E] w-3.5 h-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-9 py-2 rounded-xl border border-[#E2DED0] text-xs text-[#2D3A30] bg-white focus:ring-2 focus:ring-[#4A5D4E]/20 focus:border-[#4A5D4E] transition-all outline-none text-left font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-2.5 text-[#7A8B7E] hover:text-[#2D3A30]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold text-[#3E4C41]">تأكيد كلمة المرور</label>
                <div className="relative">
                  <Lock className="absolute right-3 top-2.5 text-[#7A8B7E] w-3.5 h-3.5" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-9 py-2 rounded-xl border border-[#E2DED0] text-xs text-[#2D3A30] bg-white focus:ring-2 focus:ring-[#4A5D4E]/20 focus:border-[#4A5D4E] transition-all outline-none text-left font-mono"
                    required
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
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white py-3 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {loading ? 'جاري تحديث البيانات الشخصية...' : 'تأكيد وحفظ البيانات الأمنية 🔐'}
              </button>

              <button
                type="button"
                onClick={onLogout}
                className="px-4 py-3 rounded-xl border border-[#E2DED0] text-[#7A8B7E] hover:text-[#2D3A30] hover:bg-[#F4F1EA] text-xs font-bold transition-all cursor-pointer"
              >
                خروج
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}