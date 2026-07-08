import React, { useState } from 'react';
import { X, ShieldCheck, Mail, Lock, Eye, EyeOff, AlertCircle, User, Phone as PhoneIcon, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LoginModalProps {
  onClose: () => void;
  onLoginSuccess: (email: string) => void;
  onRegisterSuccess?: (message: string) => void;
}

export default function LoginModal({ onClose, onLoginSuccess, onRegisterSuccess }: LoginModalProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  
  // Login Form States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Registration Form States
  const [regName, setRegName] = useState('');
  const [regSurname, setRegSurname] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Forgot Password States
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotStep, setForgotStep] = useState<'request' | 'verify'>('request');
  const [forgotUserId, setForgotUserId] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle Forgot Password Request submission
  const handleForgotPasswordRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: forgotIdentifier })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'فشل إرسال طلب استعادة كلمة المرور');
      }
      setForgotUserId(data.userId);
      setForgotStep('verify');
    } catch (err: any) {
      setError(err.message || 'حدث خطأ غير متوقع.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Forgot Password Verification & Reset submission
  const handleForgotPasswordVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password-with-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: forgotUserId,
          code: forgotCode,
          newPassword: forgotNewPassword
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'فشل تحديث كلمة المرور.');
      }
      setForgotSuccess('✅ تم تحديث كلمة مرورك بنجاح! جاري الانتقال لشاشة تسجيل الدخول...');
      setTimeout(() => {
        setForgotSuccess(null);
        setMode('login');
        setForgotStep('request');
        setForgotIdentifier('');
        setForgotCode('');
        setForgotNewPassword('');
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ غير متوقع.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Login submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!username || !password) {
      setError('يرجى ملء جميع الحقول المطلوبة.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usernameOrEmail: username,
          password: password
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'فشل تسجيل الدخول.');
      }

      if (data.success && data.user) {
        onLoginSuccess(data.user.email);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ غير متوقع أثناء تسجيل الدخول.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Registration submission
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!regName || !regSurname || !regPhone || !regEmail || !regPassword) {
      setError('يرجى ملء جميع الحقول المطلوبة للعضوية.');
      setLoading(false);
      return;
    }

    const cleanPhone = regPhone.trim().replace(/[\s\-\+\(\)]/g, '');
    if (!/^7\d{8}$/.test(cleanPhone)) {
      setError('يجب أن يكون رقم الهاتف جوال يمني مكون من 9 أرقام ويبدأ بـ 7 (مثال: 771787747)');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          surname: regSurname,
          phone: regPhone,
          email: regEmail,
          password: regPassword
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'فشل تقديم طلب العضوية.');
      }

      if (data.success) {
        const msg = data.message || 'تم إرسال طلبك بنجاح، يرجى انتظار مراجعة وموافقة الإدارة لتفعيل حسابك';
        if (onRegisterSuccess) {
          onRegisterSuccess(msg);
        } else {
          alert(msg);
        }
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ غير متوقع أثناء تقديم الطلب.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans" id="login-modal-overlay" dir="rtl">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#2D3A30]/60 backdrop-blur-xs transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="bg-[#FDFBF7] w-full max-w-md rounded-3xl border border-[#E2DED0] shadow-2xl relative overflow-hidden z-10 flex flex-col max-h-[95vh]">
        
        {/* Header decorative color bar */}
        <div className="bg-[#4A5D4E] h-1.5 w-full" />

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute left-4 top-4 p-1.5 rounded-xl hover:bg-[#F4F1EA] text-[#7A8B7E] hover:text-[#2D3A30] transition-all cursor-pointer border border-gray-200/40"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content Area */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
          
          <AnimatePresence mode="wait">
            {mode === 'login' ? (
              <motion.div
                key="login-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Logo and Intro */}
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-[#4A5D4E] flex items-center justify-center text-white mx-auto shadow-md">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-extrabold text-[#2D3A30] tracking-tight">
                    تسجيل الدخول لبوابة المشرفين والأعضاء
                  </h3>
                  <p className="text-[11px] text-[#7A8B7E] max-w-xs mx-auto leading-relaxed">
                    الولوج الآمن لتعديل بيانات التعداد، إضافة المرفقات الخدمية، وإدارة فرص وحملات التبرع والمشاريع.
                  </p>
                </div>

                {/* Error banner */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-2xl text-[11px] font-bold flex items-start gap-2 leading-relaxed">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-[#3E4C41]">اسم المستخدم أو البريد الإلكتروني</label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-2.5 text-[#7A8B7E] w-3.5 h-3.5" />
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="مثال: helmi"
                        className="w-full pl-3 pr-9 py-2.5 rounded-xl border border-[#E2DED0] text-xs text-[#2D3A30] bg-white focus:ring-2 focus:ring-[#4A5D4E]/20 focus:border-[#4A5D4E] transition-all outline-none text-left font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-[#3E4C41]">كلمة المرور</label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-2.5 text-[#7A8B7E] w-3.5 h-3.5" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-[#E2DED0] text-xs text-[#2D3A30] bg-white focus:ring-2 focus:ring-[#4A5D4E]/20 focus:border-[#4A5D4E] transition-all outline-none text-left font-mono"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-2.5 text-[#7A8B7E] hover:text-[#2D3A30]"
                      >
                        {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end pt-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setMode('forgot');
                        setForgotStep('request');
                        setForgotIdentifier('');
                      }}
                      className="text-[10px] font-bold text-[#A98467] hover:text-[#8E6E54] hover:underline cursor-pointer"
                    >
                      نسيت كلمة المرور؟
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#4A5D4E] hover:bg-[#3E4C41] text-[#FDFBF7] py-3 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2 disabled:opacity-50"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    {loading ? 'جاري التحقق...' : 'دخول'}
                  </button>
                </form>

                {/* Sub link for switching to register */}
                <div className="border-t border-[#F4F1EA] pt-4 text-center">
                  <p className="text-[11px] text-[#5F6C61]">
                    ليس لديك حساب مسجل بعد؟
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setMode('register');
                    }}
                    className="mt-1 text-xs font-black text-[#A98467] hover:text-[#8E6E54] hover:underline cursor-pointer"
                  >
                    إنشاء حساب جديد / تسجيل
                  </button>
                </div>
              </motion.div>
            ) : mode === 'register' ? (
              <motion.div
                key="register-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Logo and Intro */}
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-[#A98467] flex items-center justify-center text-white mx-auto shadow-md">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-extrabold text-[#2D3A30] tracking-tight">
                    طلب عضوية وانضمام جديد
                  </h3>
                  <p className="text-[11px] text-[#7A8B7E] max-w-xs mx-auto leading-relaxed">
                    سجل بياناتك كعضو أو مندوب جديد للانضمام إلى فريق عمل قرية الجمال التنموية والمشاركة بمهام الإشراف.
                  </p>
                </div>

                {/* Error banner */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-2xl text-[11px] font-bold flex items-start gap-2 leading-relaxed">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Registration Form */}
                <form onSubmit={handleRegister} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-[#3E4C41]">الاسم الأول</label>
                      <div className="relative">
                        <User className="absolute right-3 top-2.5 text-[#7A8B7E] w-3.5 h-3.5" />
                        <input
                          type="text"
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          placeholder="مثال: أحمد"
                          className="w-full pl-3 pr-9 py-2 rounded-xl border border-[#E2DED0] text-xs text-[#2D3A30] bg-white focus:ring-2 focus:ring-[#4A5D4E]/20 focus:border-[#4A5D4E] transition-all outline-none"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-[#3E4C41]">اللقب / العائلة</label>
                      <div className="relative">
                        <User className="absolute right-3 top-2.5 text-[#7A8B7E] w-3.5 h-3.5" />
                        <input
                          type="text"
                          value={regSurname}
                          onChange={(e) => setRegSurname(e.target.value)}
                          placeholder="مثال: الجمال"
                          className="w-full pl-3 pr-9 py-2 rounded-xl border border-[#E2DED0] text-xs text-[#2D3A30] bg-white focus:ring-2 focus:ring-[#4A5D4E]/20 focus:border-[#4A5D4E] transition-all outline-none"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-[#3E4C41]">رقم الهاتف</label>
                    <div className="relative">
                      <PhoneIcon className="absolute right-3 top-2.5 text-[#7A8B7E] w-3.5 h-3.5" />
                      <input
                        type="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="مثال: 0500000000"
                        className="w-full pl-3 pr-9 py-2 rounded-xl border border-[#E2DED0] text-xs text-[#2D3A30] bg-white focus:ring-2 focus:ring-[#4A5D4E]/20 focus:border-[#4A5D4E] transition-all outline-none text-left font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-[#3E4C41]">البريد الإلكتروني</label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-2.5 text-[#7A8B7E] w-3.5 h-3.5" />
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full pl-3 pr-9 py-2 rounded-xl border border-[#E2DED0] text-xs text-[#2D3A30] bg-white focus:ring-2 focus:ring-[#4A5D4E]/20 focus:border-[#4A5D4E] transition-all outline-none text-left font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-[#3E4C41]">كلمة المرور المقترحة</label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-2.5 text-[#7A8B7E] w-3.5 h-3.5" />
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-9 py-2 rounded-xl border border-[#E2DED0] text-xs text-[#2D3A30] bg-white focus:ring-2 focus:ring-[#4A5D4E]/20 focus:border-[#4A5D4E] transition-all outline-none text-left font-mono"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute left-3 top-2.5 text-[#7A8B7E] hover:text-[#2D3A30]"
                      >
                        {showRegPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#A98467] hover:bg-[#8E6E54] text-[#FDFBF7] py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-3 disabled:opacity-50"
                  >
                    <UserPlus className="w-4 h-4" />
                    {loading ? 'جاري تقديم الطلب...' : 'إرسال طلب العضوية'}
                  </button>
                </form>

                {/* Return to login */}
                <div className="border-t border-[#F4F1EA] pt-4 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setMode('login');
                    }}
                    className="text-xs font-bold text-[#4A5D4E] hover:text-[#2D3A30] hover:underline cursor-pointer"
                  >
                    الرجوع لتسجيل الدخول
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="forgot-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Logo and Intro */}
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-[#4A5D4E] flex items-center justify-center text-white mx-auto shadow-md">
                    <Lock className="w-6 h-6 text-amber-300" />
                  </div>
                  <h3 className="text-base font-extrabold text-[#2D3A30] tracking-tight">
                    استعادة كلمة المرور
                  </h3>
                  <p className="text-[11px] text-[#7A8B7E] max-w-xs mx-auto leading-relaxed">
                    أدخل بريدك الإلكتروني أو رقم هاتف الجوال للتحقق من هويتك وإصدار رمز الاستعادة الفوري.
                  </p>
                </div>

                {/* Error and Success banners */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-2xl text-[11px] font-bold flex items-start gap-2 leading-relaxed">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {forgotSuccess && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-2xl text-[11px] font-bold flex items-start gap-2 leading-relaxed">
                    <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                    <span>{forgotSuccess}</span>
                  </div>
                )}

                {forgotStep === 'request' ? (
                  <form onSubmit={handleForgotPasswordRequest} className="space-y-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-[#3E4C41]">البريد الإلكتروني أو رقم الهاتف المسجل</label>
                      <div className="relative">
                        <Mail className="absolute right-3 top-2.5 text-[#7A8B7E] w-3.5 h-3.5" />
                        <input
                          type="text"
                          value={forgotIdentifier}
                          onChange={(e) => setForgotIdentifier(e.target.value)}
                          placeholder="name@example.com أو 0500000000"
                          className="w-full pl-3 pr-9 py-2.5 rounded-xl border border-[#E2DED0] text-xs text-[#2D3A30] bg-white focus:ring-2 focus:ring-[#4A5D4E]/20 focus:border-[#4A5D4E] transition-all outline-none text-left font-mono"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#4A5D4E] hover:bg-[#3E4C41] text-[#FDFBF7] py-3 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? 'جاري التحقق وإرسال الرمز...' : 'إرسال رمز التحقق والاستعادة 📲'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleForgotPasswordVerify} className="space-y-4">
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-[10px] text-amber-950 font-bold leading-relaxed">
                      💡 تم إرسال رمز التحقق الآمن لوسيلة الاتصال المسجلة بنجاح. يرجى إدخال الرمز المكون من 6 أرقام هنا لمتابعة استعادة حسابك، أو التواصل مع المشرف العام لتأكيده يدوياً.
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-[#3E4C41]">رمز التحقق (6 أرقام)</label>
                      <input
                        type="text"
                        maxLength={6}
                        value={forgotCode}
                        onChange={(e) => setForgotCode(e.target.value)}
                        placeholder="أدخل الرمز هنا (مثال: 123456)"
                        className="w-full px-4 py-2 rounded-xl border border-[#E2DED0] text-xs text-[#2D3A30] bg-white focus:ring-2 focus:ring-[#4A5D4E]/20 focus:border-[#4A5D4E] transition-all outline-none text-center font-mono font-black text-sm tracking-widest"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-[#3E4C41]">كلمة المرور الجديدة</label>
                      <div className="relative">
                        <Lock className="absolute right-3 top-2.5 text-[#7A8B7E] w-3.5 h-3.5" />
                        <input
                          type={showForgotNewPassword ? 'text' : 'password'}
                          value={forgotNewPassword}
                          onChange={(e) => setForgotNewPassword(e.target.value)}
                          placeholder="أدخل كلمة المرور الجديدة"
                          className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-[#E2DED0] text-xs text-[#2D3A30] bg-white focus:ring-2 focus:ring-[#4A5D4E]/20 focus:border-[#4A5D4E] transition-all outline-none text-left font-mono"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                          className="absolute left-3 top-2.5 text-[#7A8B7E] hover:text-[#2D3A30]"
                        >
                          {showForgotNewPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-emerald-700 hover:bg-emerald-800 text-[#FDFBF7] py-3 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? 'جاري التحديث...' : 'تأكيد وإعادة تعيين كلمة المرور 🔐'}
                    </button>
                  </form>
                )}

                <div className="border-t border-[#F4F1EA] pt-4 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setMode('login');
                      setForgotStep('request');
                      setForgotIdentifier('');
                      setForgotCode('');
                      setForgotNewPassword('');
                    }}
                    className="text-xs font-bold text-[#4A5D4E] hover:text-[#2D3A30] hover:underline cursor-pointer"
                  >
                    الرجوع لتسجيل الدخول
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}
