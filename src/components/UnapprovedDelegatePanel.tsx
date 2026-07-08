import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, Hourglass, Send, CheckCircle2, LogOut } from 'lucide-react';

interface UnapprovedDelegatePanelProps {
  currentUser: any;
  onProfileUpdated: (updatedUser: any) => void;
  onLogout: () => void;
}

export default function UnapprovedDelegatePanel({
  currentUser,
  onProfileUpdated,
  onLogout
}: UnapprovedDelegatePanelProps) {
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isPending = currentUser?.pendingActivationRequest || currentUser?.status === 'pending_activation';

  const handleSendRequest = async () => {
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/users/request-activation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: currentUser.email }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'فشل إرسال طلب الاعتماد.');
      }

      setSuccessMessage('تم إرسال طلبك بنجاح إلى المشرف العام، يرجى الانتظار.');
      
      // Update the current user context with the returned user object
      if (data.user) {
        onProfileUpdated(data.user);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ غير متوقع أثناء معالجة الطلب.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto my-12 px-4 font-sans" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-2 border-amber-200/60 rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden"
      >
        {/* Aesthetic background accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#4A5D4E]/5 rounded-bl-full pointer-events-none" />

        <div className="flex flex-col items-center text-center space-y-6">
          {/* Status Icon */}
          <div className="w-20 h-20 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-inner">
            {isPending ? (
              <Hourglass className="w-10 h-10 animate-spin-slow" />
            ) : (
              <ShieldAlert className="w-10 h-10 text-amber-500" />
            )}
          </div>

          {/* Titles */}
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-[#2D3A30]">
              طلب تفعيل حساب مندوب التبرعات والمساهمات
            </h2>
            <p className="text-xs sm:text-sm font-bold text-gray-400 font-mono">
              {currentUser?.email}
            </p>
          </div>

          {/* Explanation message */}
          <div className="bg-[#FDFBF7] border border-[#E2DED0] rounded-2xl p-5 text-sm sm:text-base leading-relaxed text-[#3E4C41] font-medium w-full">
            حسابك مسجل كمندوب ولكنه بانتظار الاعتماد وتفعيل الصلاحيات من المشرف العام.
          </div>

          {/* Activation Request Form / Button Section */}
          <div className="w-full space-y-4 pt-2">
            {isPending ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-emerald-800 font-extrabold text-sm sm:text-base">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>طلب التفعيل قيد المراجعة والانتظار حالياً ⏳</span>
                </div>
                <p className="text-xs text-[#5F6C61] font-bold">
                  تم إرسال طلبك بنجاح إلى المشرف العام، يرجى الانتظار لحين اعتماد حسابك وتفعيله.
                </p>
                {currentUser?.activationRequestDate && (
                  <p className="text-[10px] text-gray-400 font-bold font-mono">
                    تاريخ تقديم الطلب: {new Date(currentUser.activationRequestDate).toLocaleString('ar-SA')}
                  </p>
                )}
              </div>
            ) : (
              <button
                onClick={handleSendRequest}
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#4A5D4E] to-[#3E4C41] hover:from-[#3E4C41] hover:to-[#2D3A30] text-[#FDFBF7] disabled:opacity-50 font-black text-sm py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <Send className="w-4.5 h-4.5 text-amber-400" />
                {loading ? 'جاري إرسال طلب التفعيل...' : 'إرسال طلب اعتماد وتفعيل العضوية'}
              </button>
            )}

            {/* Success and Error messages */}
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3.5 bg-emerald-100 text-emerald-950 rounded-xl text-xs font-bold border border-emerald-200"
              >
                {successMessage}
              </motion.div>
            )}

            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3.5 bg-rose-100 text-rose-950 rounded-xl text-xs font-bold border border-rose-200"
              >
                {errorMessage}
              </motion.div>
            )}
          </div>

          {/* Action buttons (Logout / Back) */}
          <div className="flex justify-center w-full border-t border-gray-100 pt-6">
            <button
              onClick={onLogout}
              className="flex items-center gap-2 text-xs font-black text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100/80 border border-red-200/50 px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-3xs"
            >
              <LogOut className="w-4 h-4" />
              تسجيل خروج والعودة للرئيسية
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
