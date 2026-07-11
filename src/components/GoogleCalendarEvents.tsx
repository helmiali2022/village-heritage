import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Plus, 
  RefreshCw, 
  Trash2, 
  User, 
  Lock, 
  LogOut, 
  CheckCircle2, 
  AlertTriangle, 
  CalendarDays, 
  PlusCircle, 
  Sparkles, 
  Info,
  CalendarPlus,
  ArrowLeftRight,
  Share2
} from 'lucide-react';
import { initAuth, googleSignIn, googleSignOut, getAccessToken } from '../lib/googleSheetsAuth';
import { User as FirebaseUser } from 'firebase/auth';

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  htmlLink?: string;
}

interface GoogleCalendarEventsProps {
  isAdmin?: boolean;
}

export default function GoogleCalendarEvents({ isAdmin = false }: GoogleCalendarEventsProps) {
  const [googleUser, setGoogleUser] = useState<FirebaseUser | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [needsGoogleAuth, setNeedsGoogleAuth] = useState(true);
  
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState(false);

  // New event form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newLocation, setNewLocation] = useState('قرية ذي الجمال - قدس');
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newStartTime, setNewStartTime] = useState('10:00');
  const [newEndTime, setNewEndTime] = useState('11:00');
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');

  // Static fallback village events (for offline/demo experience when not authenticated)
  const defaultVillageEvents: CalendarEvent[] = [
    {
      id: 'default-1',
      summary: '💧 توزيع حصص مياه الشرب للقرية',
      description: 'تنظيم وجدولة توزيع مياه الشرب النقية من الخزان الرئيسي على الحارات والمحلات بالتساوي.',
      location: 'خزان المياه الرئيسي - ذي الجمال قدس',
      start: { dateTime: '2026-07-12T08:00:00+03:00' },
      end: { dateTime: '2026-07-12T13:00:00+03:00' }
    },
    {
      id: 'default-2',
      summary: '🩺 حملة الكشف الطبي الوقائي للأطفال والمكافحة',
      description: 'بالتنسيق مع مكتب الصحة بالمديرية، حملة كشف وتطعيم مجاني ضد الأوبئة الموسيمة بمدرسة القرية.',
      location: 'مدرسة الفلاح الأساسية - ذي الجمال قدس',
      start: { dateTime: '2026-07-15T09:00:00+03:00' },
      end: { dateTime: '2026-07-15T15:00:00+03:00' }
    },
    {
      id: 'default-3',
      summary: '🏛️ اجتماع الجمعية العمومية والمجلس المحلي للقرية',
      description: 'مناقشة سير أعمال مسح التعداد الرقمي، والمساهمات الخيرية والمشاريع التنموية المقترحة للربع القادم.',
      location: 'ديوان التنمية والتعاون بالقرية',
      start: { dateTime: '2026-07-20T16:00:00+03:00' },
      end: { dateTime: '2026-07-20T19:00:00+03:00' }
    }
  ];

  // Listen to Google/Firebase auth state changes
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
        setNeedsGoogleAuth(false);
        fetchCalendarEvents(token);
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
        setNeedsGoogleAuth(true);
        // Fallback to local default events if offline
        setEvents(defaultVillageEvents);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setGoogleToken(res.accessToken);
        setNeedsGoogleAuth(false);
        fetchCalendarEvents(res.accessToken);
      }
    } catch (err: any) {
      console.error('Google authorization failed:', err);
      setError(`فشل الاتصال بـ Google: ${err.message || 'يرجى المحاولة مجدداً'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogout = async () => {
    try {
      await googleSignOut();
      setGoogleUser(null);
      setGoogleToken(null);
      setNeedsGoogleAuth(true);
      setEvents(defaultVillageEvents);
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  // Fetch from Google Calendar API
  const fetchCalendarEvents = async (tokenToUse: string | null = googleToken) => {
    const token = tokenToUse || googleToken;
    if (!token) {
      setEvents(defaultVillageEvents);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const timeMin = new Date().toISOString(); // Fetch future events only
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?orderBy=startTime&singleEvents=true&timeMin=${timeMin}&maxResults=20`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || `خطأ من جوجل كاليندر: ${response.status}`);
      }

      const data = await response.json();
      if (data.items && data.items.length > 0) {
        // Render events from Google Calendar
        setEvents(data.items);
      } else {
        // If Google Calendar is empty, pre-populate default events or show empty
        setEvents([]);
      }
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3000);
    } catch (err: any) {
      console.error('Google Calendar fetch error:', err);
      setError(`فشل جلب فعاليات التقويم: ${err.message || 'خطأ في المصادقة'}`);
      // Fallback to default events
      setEvents(defaultVillageEvents);
    } finally {
      setLoading(false);
    }
  };

  // Create new event in Google Calendar
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleToken) {
      setError('يرجى الاتصال بحساب Google أولاً لإجراء التعديلات السحابية.');
      return;
    }

    if (!newTitle.trim()) {
      alert('يرجى إدخال عنوان الفعالية.');
      return;
    }

    setIsCreatingEvent(true);
    setError(null);

    try {
      // Build ISO strings for start and end times
      const startDateTime = `${newDate}T${newStartTime}:00`;
      const endDateTime = `${newDate}T${newEndTime}:00`;

      const eventPayload = {
        summary: newTitle,
        description: newDesc,
        location: newLocation,
        start: {
          dateTime: startDateTime,
          timeZone: 'Asia/Riyadh'
        },
        end: {
          dateTime: endDateTime,
          timeZone: 'Asia/Riyadh'
        }
      };

      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${googleToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(eventPayload)
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || 'فشل إدراج الفعالية بالسحابة.');
      }

      alert('🎉 تم إدراج الفعالية في تقويم Google بنجاح!');
      
      // Reset form and refresh list
      setNewTitle('');
      setNewDesc('');
      setNewLocation('قرية ذي الجمال - قدس');
      setShowAddForm(false);
      fetchCalendarEvents();
    } catch (err: any) {
      console.error('Create event error:', err);
      setError(`فشل إنشاء الفعالية: ${err.message}`);
    } finally {
      setIsCreatingEvent(false);
    }
  };

  // Delete event from Google Calendar
  const handleDeleteEvent = async (eventId: string) => {
    if (!googleToken) return;
    const confirmed = window.confirm('هل أنت متأكد من رغبتك في حذف هذه الفعالية نهائياً من تقويم Google؟');
    if (!confirmed) return;

    setLoading(true);
    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${googleToken}` }
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || 'فشل حذف الفعالية.');
      }

      alert('تم حذف الفعالية بنجاح من تقويم Google.');
      fetchCalendarEvents();
    } catch (err: any) {
      console.error('Delete event error:', err);
      setError(`فشل حذف الفعالية: ${err.message}`);
      setLoading(false);
    }
  };

  // Quick sync single default event to Google Calendar for a regular user
  const handleSyncToPersonalCalendar = async (evt: CalendarEvent) => {
    if (!googleToken) {
      const loginFirst = window.confirm('يرجى ربط حساب Google الخاص بك أولاً لتتمكن من إضافة فعاليات القرية لتقويمك الشخصي بضغطة زر. هل تريد الاتصال الآن؟');
      if (loginFirst) {
        handleGoogleLogin();
      }
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${googleToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            summary: evt.summary,
            description: evt.description,
            location: evt.location,
            start: evt.start,
            end: evt.end
          })
        }
      );

      if (!response.ok) {
        throw new Error('فشل التزامن السريع');
      }

      alert(`🎉 تم حفظ "${evt.summary}" بنجاح في تقويم Google الشخصي الخاص بك!`);
      fetchCalendarEvents();
    } catch (err: any) {
      setError('فشل حفظ الفعالية لتقويمك الشخصي.');
    } finally {
      setLoading(false);
    }
  };

  // Date formatter helper (Arabic friendly)
  const formatArabicDate = (dateStr?: string) => {
    if (!dateStr) return 'تاريخ غير محدد';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('ar-YE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  const formatArabicTime = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString('ar-YE', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return '';
    }
  };

  // Filtering events
  const filteredEvents = events.filter(evt => {
    const term = searchQuery.toLowerCase();
    return (
      evt.summary.toLowerCase().includes(term) ||
      (evt.description || '').toLowerCase().includes(term) ||
      (evt.location || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Alert */}
      {syncSuccess && (
        <div className="fixed top-5 left-5 z-50 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce border border-emerald-400 max-w-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
          <div className="text-right">
            <p className="text-xs font-bold">تم التحديث بنجاح!</p>
            <p className="text-[10px] text-emerald-100">تمت مزامنة الفعاليات من Google Calendar مباشرة.</p>
          </div>
        </div>
      )}

      {/* Royal Google Calendar Hub Header */}
      <div className="bg-gradient-to-l from-emerald-700 to-teal-800 text-white rounded-3xl p-6 border border-emerald-900 shadow-md">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-extrabold flex items-center gap-2">
              <CalendarDays className="w-6 h-6 text-emerald-300 animate-pulse" />
              أجندة فعاليات القرية وجدول التقويم السحابي
            </h2>
            <p className="text-xs text-emerald-100 max-w-3xl leading-relaxed">
              جدولة وتنسيق الأنشطة المجتمعية، توزيع الخدمات العامة، حملات الرعاية الطبية، والاجتماعات المحلية لقرية ذي الجمال قدس مباشرة عبر Google Calendar. 
              سجل دخولك لتعديل أو حفظ أي فعالية لتقويمك الشخصي بلمسة زر.
            </p>
          </div>

          {/* Connection Profile Status */}
          <div className="w-full lg:w-auto shrink-0">
            {needsGoogleAuth ? (
              <button
                onClick={handleGoogleLogin}
                className="w-full lg:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl text-xs font-bold transition-all duration-150 flex items-center justify-center gap-2.5 shadow-lg border border-emerald-500 hover:scale-[1.02] cursor-pointer"
              >
                <Lock className="w-4 h-4 text-emerald-200" />
                <span className="text-emerald-50 font-bold">ربط حساب Google للتقويم</span>
              </button>
            ) : (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="bg-emerald-900/60 border border-emerald-500/30 rounded-2xl px-4 py-2 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/40 text-emerald-100 text-xs font-black flex items-center justify-center border border-emerald-300/30">
                    {googleUser?.displayName?.slice(0, 2) || 'G'}
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-emerald-100">{googleUser?.displayName}</p>
                    <p className="text-[10px] text-emerald-200">{googleUser?.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleGoogleLogout}
                  className="bg-red-600/20 hover:bg-red-600/40 border border-red-500/40 text-red-100 px-4 py-3 rounded-2xl text-xs font-bold transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>قطع الاتصال</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Add Event vs Events List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Right side / Add Form when admin connects */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Quick Stats & Search Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-3xs space-y-4">
            <h3 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-2">🔍 محرك تصفية الفعاليات</h3>
            <div className="relative">
              <input
                type="text"
                placeholder="ابحث بالاسم أو الموقع أو الملاحظات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs text-right focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
              <Info className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {needsGoogleAuth 
                  ? 'يتم عرض الفعاليات المحلية النموذجية للقرية. يمكنك ربط حساب جوجل لربط تقويم سحابي حقيقي.'
                  : `أنت متصل بالتقويم السحابي النشط. تم جلب عدد (${events.length}) فعالية مجدولة.`}
              </span>
            </div>

            {!needsGoogleAuth && !showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                إضافة فعالية مجدولة جديدة
              </button>
            )}
          </div>

          {/* New Event Form (Only visible to authenticated users) */}
          {showAddForm && !needsGoogleAuth && (
            <form onSubmit={handleCreateEvent} className="bg-white rounded-3xl p-5 border border-emerald-200 shadow-3xs space-y-4 animate-fade-in">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-xs font-black text-emerald-800">📅 جدولة فعالية سحابية جديدة</span>
                <button 
                  type="button" 
                  onClick={() => setShowAddForm(false)} 
                  className="text-[10px] text-slate-400 hover:text-slate-600 font-bold"
                >
                  إلغاء
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">عنوان الفعالية / النشاط:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: 💧 توزيع حصة مياه حارة الأكمة"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">تفاصيل الفعالية:</label>
                  <textarea
                    rows={3}
                    placeholder="تفاصيل وتعليمات إضافية للأهالي..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">الموقع أو المرفق المقرّر:</label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">تاريخ الفعالية:</label>
                    <input
                      type="date"
                      required
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs focus:outline-none text-center font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">وقت البدء:</label>
                      <input
                        type="time"
                        required
                        value={newStartTime}
                        onChange={(e) => setNewStartTime(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs focus:outline-none text-center font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">وقت الانتهاء:</label>
                      <input
                        type="time"
                        required
                        value={newEndTime}
                        onChange={(e) => setNewEndTime(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs focus:outline-none text-center font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isCreatingEvent}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                {isCreatingEvent ? <RefreshCw className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                {isCreatingEvent ? 'جاري جدولة الفعالية...' : 'جدولة وحفظ بسحابة جوجل'}
              </button>
            </form>
          )}

        </div>

        {/* Left side / Live Events Feed list */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-3xs">
            <h3 className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
              <Calendar className="w-4.5 h-4.5 text-emerald-600" />
              الفعاليات القادمة المجدولة للقرية 
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                {filteredEvents.length} فعالية
              </span>
            </h3>
            <button
              onClick={() => fetchCalendarEvents()}
              disabled={loading}
              className="text-xs text-emerald-600 hover:text-emerald-800 font-bold flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              تحديث
            </button>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {filteredEvents.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto animate-bounce" />
              <p className="text-xs font-extrabold text-slate-800">لا توجد فعاليات مجدولة حالياً</p>
              <p className="text-[11px] text-slate-500 leading-relaxed max-w-sm mx-auto">
                لم يتم إدراج أي أنشطة قادمة للقرية بعد. إذا كنت مديراً للنظام، يرجى ربط حساب جوجل والبدء بجدولة اللقاءات والأنشطة العامة.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEvents.map((evt) => {
                const startTimeStr = evt.start.dateTime || evt.start.date;
                const endTimeStr = evt.end.dateTime || evt.end.date;
                const isDefaultMock = evt.id.startsWith('default-');

                return (
                  <div 
                    key={evt.id} 
                    className="bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-3xs transition-all duration-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden group"
                  >
                    {/* Decorative color tag */}
                    <div className="absolute top-0 right-0 bottom-0 w-1.5 bg-emerald-600" />
                    
                    {/* Event Info */}
                    <div className="space-y-2 pr-2">
                      <h4 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {evt.summary}
                      </h4>
                      {evt.description && (
                        <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
                          {evt.description}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-500 pt-1 font-bold">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatArabicDate(startTimeStr)}</span>
                        </div>
                        {evt.start.dateTime && (
                          <div className="flex items-center gap-1.5 font-mono">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              {formatArabicTime(startTimeStr)} - {formatArabicTime(endTimeStr)}
                            </span>
                          </div>
                        )}
                        {evt.location && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-rose-500" />
                            <span className="truncate max-w-xs">{evt.location}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 w-full md:w-auto shrink-0 self-stretch md:self-auto justify-end border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                      {isDefaultMock || needsGoogleAuth ? (
                        <button
                          onClick={() => handleSyncToPersonalCalendar(evt)}
                          title="حفظ للتقويم الشخصي الخاص بك"
                          className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 px-3.5 py-2 rounded-xl text-[10px] font-black transition-all flex items-center gap-1.5 cursor-pointer w-full md:w-auto justify-center"
                        >
                          <CalendarPlus className="w-3.5 h-3.5" />
                          <span>حفظ لتقويمي الشخصي</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 w-full">
                          {evt.htmlLink && (
                            <a
                              href={evt.htmlLink}
                              target="_blank"
                              rel="noreferrer"
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer flex-1 md:flex-initial text-center"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                              <span>فتح بـ Google</span>
                            </a>
                          )}
                          {!isDefaultMock && (
                            <button
                              onClick={() => handleDeleteEvent(evt.id)}
                              className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 p-2 rounded-xl transition-all cursor-pointer"
                              title="حذف الفعالية نهائياً"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
