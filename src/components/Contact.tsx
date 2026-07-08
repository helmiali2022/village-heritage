import React, { useState } from 'react';
import { Home, Phone, Mail, MapPin, Send, MessageSquare, AlertCircle, CheckCircle2 } from 'lucide-react';
import { NEIGHBORHOODS } from '../data/mockData';

interface ContactProps {
  onBackToHome: () => void;
}

export default function Contact({ onBackToHome }: ContactProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [neighborhood, setNeighborhood] = useState(NEIGHBORHOODS[0]);
  const [msgType, setMsgType] = useState('اقتراح');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !message) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, neighborhood, msgType, subject, message })
      });
      const data = await res.json();
      if (data.success) {
        setReferenceNumber(data.message.referenceNumber);
        setIsSuccess(true);
      } else {
        alert("فشل في إرسال الرسالة");
      }
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء الإرسال");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setName('');
    setPhone('');
    setSubject('');
    setMessage('');
    setIsSuccess(false);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header and Back to Home Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#F4F1EA] rounded-3xl p-6 border border-[#E2DED0] shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-[#2D3A30] flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-[#A98467]" />
            قنوات التواصل وتقديم البلاغات والشكاوى
          </h2>
          <p className="text-xs text-[#7A8B7E] mt-1">نسعد باستقبال اقتراحاتكم، شكاواكم المتعلقة بمرافق المحلة، أو استفساراتكم حول برامج الرعاية والدعم السكاني.</p>
        </div>
        <button
          onClick={onBackToHome}
          className="bg-[#4A5D4E] hover:bg-[#3E4C41] text-[#FDFBF7] px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm hover:shadow flex items-center gap-2 transition-all cursor-pointer border border-[#4A5D4E]"
        >
          <Home className="w-4 h-4" />
          العودة للرئيسية
        </button>
      </div>

      <div className="max-w-4xl mx-auto w-full space-y-4">
        {/* Contact/Complaint/Suggestion Form Card */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-[#2D3A30] pb-1 border-b border-[#E2DED0]">نموذج تقديم طلب أو إبلاغ رقمي</h3>

          <div className="bg-white rounded-3xl border border-[#E2DED0] p-6 shadow-sm">
            {!isSuccess ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-bold text-[#3E4C41] mb-1">الاسم الكريم <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="مثال: نجيب الخطيب"
                      className="w-full px-3 py-2 rounded-xl border border-[#E2DED0] text-xs bg-white text-[#2D3A30] focus:ring-2 focus:ring-[#4A5D4E]/20 focus:border-[#4A5D4E] transition-all outline-none"
                      required
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-bold text-[#3E4C41] mb-1">رقم الاتصال (الجوال) <span className="text-red-500">*</span></label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="77XXXXXXX"
                      className="w-full px-3 py-2 rounded-xl border border-[#E2DED0] text-xs bg-white text-[#2D3A30] font-mono focus:ring-2 focus:ring-[#4A5D4E]/20 focus:border-[#4A5D4E] transition-all outline-none"
                      required
                    />
                  </div>

                  {/* Neighborhood */}
                  <div>
                    <label className="block text-xs font-bold text-[#3E4C41] mb-1">المحلة المعنية</label>
                    <select
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E2DED0] text-xs bg-white text-[#2D3A30] focus:ring-2 focus:ring-[#4A5D4E]/20 focus:border-[#4A5D4E] transition-all outline-none"
                    >
                      {NEIGHBORHOODS.map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>

                  {/* Message Type */}
                  <div>
                    <label className="block text-xs font-bold text-[#3E4C41] mb-1">تصنيف ونوع الرسالة</label>
                    <select
                      value={msgType}
                      onChange={(e) => setMsgType(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E2DED0] text-xs bg-white text-[#2D3A30] focus:ring-2 focus:ring-[#4A5D4E]/20 focus:border-[#4A5D4E] transition-all outline-none"
                    >
                      <option value="اقتراح">اقتراح لتطوير خدمات المحلة</option>
                      <option value="شكوى">شكوى أو إبلاغ عن خلل بمرفق</option>
                      <option value="طلب رعاية">طلب رعاية اجتماعية أو دعم عائلي</option>
                      <option value="استفسار">استفسار عام لمجلس المحلة</option>
                    </select>
                  </div>

                  {/* Subject */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-[#3E4C41] mb-1">موضوع الرسالة</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="مثال: اقتراح لتجهيز ممر مشاة في محلة الاكمة"
                      className="w-full px-3 py-2 rounded-xl border border-[#E2DED0] text-xs bg-white text-[#2D3A30] focus:ring-2 focus:ring-[#4A5D4E]/20 focus:border-[#4A5D4E] transition-all outline-none"
                    />
                  </div>

                  {/* Details */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-[#3E4C41] mb-1">تفاصيل الرسالة أو البلاغ بالتفصيل <span className="text-red-500">*</span></label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="يرجى كتابة تفاصيل بلاغك أو شرح اقتراحك هنا بشكل كامل لتسهيل معالجته وتوجيهه إلى المشرف العام لقرية ذي الجمال..."
                      rows={5}
                      className="w-full px-3 py-2 rounded-xl border border-[#E2DED0] text-xs bg-white text-[#2D3A30] focus:ring-2 focus:ring-[#4A5D4E]/20 focus:border-[#4A5D4E] transition-all outline-none resize-none"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-[#F4F1EA]">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[#4A5D4E] hover:bg-[#3E4C41] disabled:opacity-50 text-[#FDFBF7] px-6 py-2.5 rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    {isSubmitting ? "جاري الإرسال..." : "إرسال الطلب بشكل آمن"}
                  </button>
                </div>
              </form>
            ) : (
              /* Success confirmation Screen */
              <div className="text-center py-10 px-4 space-y-5 animate-none">
                <div className="w-16 h-16 rounded-full bg-[#E9F0E0] border border-[#DDE5B6] text-[#4A5D4E] flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-bold text-[#2D3A30] text-base">تم إرسال طلبكم بنجاح!</h4>
                  <p className="text-xs text-[#3E4C41] leading-relaxed">
                    نشكرك يا أخي/أختي الكرام <strong>{name}</strong> على تواصلك وحرصك على الارتقاء بمجتمعنا المحلي. لقد تم استلام تصنيف <strong>{msgType}</strong> وتوجيهه بنجاح لبريد المشرف العام للمرصد.
                  </p>
                </div>

                <div className="max-w-xs mx-auto bg-[#FDFBF7] p-4 rounded-2xl border border-[#E2DED0] space-y-2 text-right text-[11px] text-[#3E4C41]">
                  <div className="flex justify-between">
                    <span>رقم بلاغ الخدمة:</span>
                    <span className="font-mono font-bold text-[#4A5D4E] text-xs">{referenceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>المحلة المعنية:</span>
                    <span className="font-semibold text-[#2D3A30]">{neighborhood}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>حالة المتابعة:</span>
                    <span className="text-[#A98467] font-bold">تم توجيهه لبريد المشرف العام (helmialkhateeb@gmail.com)</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#F4F1EA]">
                  <button
                    onClick={handleReset}
                    className="bg-[#4A5D4E] hover:bg-[#3E4C41] text-[#FDFBF7] px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                  >
                    تقديم بلاغ أو رسالة أخرى
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
