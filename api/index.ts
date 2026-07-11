import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser with size limits for large sheet uploads
  app.use(express.json({ limit: '100mb' }));

  const familiesFilePath = path.join(process.cwd(), 'families.json');
  const configFilePath = path.join(process.cwd(), 'google-sheets-config.json');
  const activityLogFilePath = path.join(process.cwd(), 'activity_log.json');

  // In-memory active sessions store with professional seeds
  let activeSessions: any[] = [
    {
      id: 'sess_1',
      userName: 'أ. حلمي الخطيب',
      userEmail: 'helmialkhateeb@gmail.com',
      role: 'super-admin',
      userRole: 'super-admin',
      department: 'كل الأقسام',
      title: 'المشرف العام',
      loginTime: new Date(Date.now() - 3600000).toISOString(),
      device: 'متصفح حاسوب شخصي (نشط الآن)',
      userAgent: 'متصفح حاسوب شخصي',
      ip: '192.168.1.5'
    },
    {
      id: 'sess_2',
      userName: 'نجيب الخطيب',
      userEmail: 'n77393477@gmail.com',
      role: 'supervisor',
      userRole: 'supervisor',
      department: 'قسم التعداد',
      title: 'مندوب تعداد وسكان',
      loginTime: new Date(Date.now() - 1800000).toISOString(),
      device: 'متصفح هاتف ذكي (نشط الآن)',
      userAgent: 'متصفح هاتف ذكي',
      ip: '192.168.1.10'
    }
  ];

  // Activity Log Helpers
  const readActivityLog = (): any[] => {
    try {
      if (fs.existsSync(activityLogFilePath)) {
        return JSON.parse(fs.readFileSync(activityLogFilePath, 'utf-8'));
      }
    } catch (e) {
      console.error('Error reading activity_log.json:', e);
    }
    // Return seed logs if file doesn't exist
    const defaultLogs = [
      {
        id: 'log_seed_1',
        userName: 'أ. حلمي الخطيب',
        userEmail: 'helmialkhateeb@gmail.com',
        action: 'سجل دخوله للمنصة من جهاز مشرف عام',
        timestamp: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'log_seed_2',
        userName: 'نجيب الخطيب',
        userEmail: 'n77393477@gmail.com',
        action: 'قام بجلب وقراءة كشف مالي من رابط Google Sheets',
        timestamp: new Date(Date.now() - 1800000).toISOString()
      },
      {
        id: 'log_seed_3',
        userName: 'أ. حلمي الخطيب',
        userEmail: 'helmialkhateeb@gmail.com',
        action: 'قام بتحديث صلاحيات العضويات وأقسام المنصة',
        timestamp: new Date(Date.now() - 900000).toISOString()
      }
    ];
    try {
      fs.writeFileSync(activityLogFilePath, JSON.stringify(defaultLogs, null, 2), 'utf-8');
    } catch (err) {}
    return defaultLogs;
  };

  const writeActivityLog = (logs: any[]) => {
    try {
      fs.writeFileSync(activityLogFilePath, JSON.stringify(logs, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error writing activity_log.json:', e);
    }
  };

  const addActivityLog = (userName: string, userEmail: string, action: string, actionType: string = 'أخرى', section: string = 'أخرى') => {
    const logs = readActivityLog();
    const newLog = {
      id: 'log_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      userName,
      userEmail,
      action,
      actionType,
      section,
      timestamp: new Date().toISOString()
    };
    logs.unshift(newLog);
    if (logs.length > 1000) {
      logs.splice(1000);
    }
    writeActivityLog(logs);
  };

  // Helper to read families
  const readFamilies = (): any[] => {
    try {
      if (fs.existsSync(familiesFilePath)) {
        const raw = fs.readFileSync(familiesFilePath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Error reading families.json:', e);
    }
    return [];
  };

  // Helper to write families
  const writeFamilies = (families: any[]) => {
    try {
      fs.writeFileSync(familiesFilePath, JSON.stringify(families, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error writing families.json:', e);
    }
  };


  const messagesFilePath = path.join(process.cwd(), "messages.json");
  const readMessages = (): any[] => {
    try {
      if (fs.existsSync(messagesFilePath)) {
        return JSON.parse(fs.readFileSync(messagesFilePath, "utf-8"));
      }
    } catch (e) {
      console.error("Error reading messages.json:", e);
    }
    return [];
  };
  const writeMessages = (messages: any[]) => {
    try {
      fs.writeFileSync(messagesFilePath, JSON.stringify(messages, null, 2), "utf-8");
    } catch (e) {
      console.error("Error writing messages.json:", e);
    }
  };

  const usersFilePath = path.join(process.cwd(), 'users.json');
  const membershipRequestsFilePath = path.join(process.cwd(), 'membership_requests.json');
  const sentEmailsFilePath = path.join(process.cwd(), 'sent_emails.json');

  // Helper to read users with default superadmin and admin
  const readUsers = (): any[] => {
    try {
      let users: any[] = [];
      if (fs.existsSync(usersFilePath)) {
        const raw = fs.readFileSync(usersFilePath, 'utf-8');
        users = JSON.parse(raw);
      }

      // Fixed primary accounts seeded as defaults
      const seedAccounts = [
        {
          id: 'usr_helmi_kb',
          username: 'helmialkhateeb',
          email: 'helmialkhateeb@gmail.com',
          password: '123456',
          name: 'حلمي',
          surname: 'الخطيب',
          phone: '771787747',
          role: 'super-admin',
          isActivated: true,
          status: 'approved',
          department: 'كل الأقسام',
          title: 'المشرف العام 🛡️'
        },
        {
          id: 'usr_helmi_hz_admin',
          username: 'helmiali_admin',
          email: 'helmiali2014@gmail.com',
          password: '123456',
          name: 'حلمي علي',
          surname: 'هزاع',
          phone: '780555001',
          role: 'admin',
          isActivated: true,
          status: 'approved',
          department: 'كل الأقسام',
          title: 'مدير شؤون القرية 🏛️'
        },
        {
          id: 'usr_najeeb_kt',
          username: 'n77393477',
          email: 'n77393477@gmail.com',
          password: '123456',
          name: 'الاستاذ نجيب',
          surname: 'الخطيب',
          phone: '774703263',
          role: 'delegate',
          isActivated: true,
          status: 'approved',
          department: 'قسم التبرعات',
          title: 'مندوب تبرعات ومساهمات'
        },
        {
          id: 'usr_esam_kt',
          username: 'esam_alkhatib',
          email: 'esamalhateb1988@gmail.com',
          password: '123456',
          name: 'عصام',
          surname: 'الخطيب',
          phone: '774185016',
          role: 'delegate',
          isActivated: true,
          status: 'approved',
          department: 'قسم التبرعات',
          title: 'مندوب تبرعات ومساهمات'
        }
      ];

      let changed = false;

      // Filter out duplicate delegate account
      const beforeFilterLength = users.length;
      users = users.filter(u => u.id !== 'usr_helmi_ali_del' && !(u.email.toLowerCase() === 'helmiali2014@gmail.com' && u.role === 'delegate'));
      if (users.length !== beforeFilterLength) {
        changed = true;
      }

      // Ensure every seed account exists with correct critical fields
      seedAccounts.forEach(seed => {
        // Find by exact ID or combinations of email + role
        const idx = users.findIndex(u => u.id === seed.id || (u.email.toLowerCase() === seed.email.toLowerCase() && u.role === seed.role));
        if (idx === -1) {
          users.push(seed);
          changed = true;
        } else {
          const existing = users[idx];
          // If critical properties differ, restore them (enforcing permanence)
          if (
            existing.email.toLowerCase() !== seed.email.toLowerCase() ||
            existing.phone !== seed.phone ||
            existing.name !== seed.name ||
            existing.surname !== seed.surname ||
            existing.role !== seed.role ||
            !existing.isActivated
          ) {
            existing.email = seed.email;
            existing.phone = seed.phone;
            existing.name = seed.name;
            existing.surname = seed.surname;
            existing.role = seed.role;
            existing.isActivated = true;
            existing.status = 'approved';
            changed = true;
          }
          if (!existing.password || existing.password.trim() === '') {
            existing.password = seed.password;
            changed = true;
          }
        }
      });

      // Remove legacy placeholders
      const legacyEmails = ['admin@aljamal.com'];
      const filtered = users.filter(u => !legacyEmails.includes(u.email.toLowerCase()) && u.username !== 'admin' && u.username !== 'helmi');
      if (filtered.length !== users.length) {
        users = filtered;
        changed = true;
      }

      if (changed || !fs.existsSync(usersFilePath)) {
        fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2), 'utf-8');
      }
      return users;
    } catch (e) {
      console.error('Error reading/safeguarding users.json:', e);
      return [];
    }
  };

  const writeUsers = (users: any[]) => {
    try {
      fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error writing users.json:', e);
    }
  };

  const readRequests = (): any[] => {
    try {
      if (fs.existsSync(membershipRequestsFilePath)) {
        const raw = fs.readFileSync(membershipRequestsFilePath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Error reading membership_requests.json:', e);
    }
    return [];
  };

  const writeRequests = (reqs: any[]) => {
    try {
      fs.writeFileSync(membershipRequestsFilePath, JSON.stringify(reqs, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error writing membership_requests.json:', e);
    }
  };

  const readEmails = (): any[] => {
    try {
      if (fs.existsSync(sentEmailsFilePath)) {
        const raw = fs.readFileSync(sentEmailsFilePath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Error reading sent_emails.json:', e);
    }
    return [];
  };

  const writeEmails = (emails: any[]) => {
    try {
      fs.writeFileSync(sentEmailsFilePath, JSON.stringify(emails, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error writing sent_emails.json:', e);
    }
  };

  // Helper to read sheets URL config
  const readConfig = (): { googleSheetsUrl: string } => {
    const defaultUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRtQlsnxA_BqxXqesgnS6YHaDEYE_PzGurtPM_zOeDVKFBVhYMPtRyXWIHduGDxYKqLppy4NqmiMSfA/pub?output=csv';
    try {
      if (fs.existsSync(configFilePath)) {
        const raw = fs.readFileSync(configFilePath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Error reading config file:', e);
    }
    return { googleSheetsUrl: defaultUrl };
  };

  // Helper to write sheets URL config
  const writeConfig = (config: { googleSheetsUrl: string }) => {
    try {
      fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error writing config file:', e);
    }
  };

  // 1. GET current Google Sheets URL
  app.get('/api/google-sheets-url', (req, res) => {
    const config = readConfig();
    res.json(config);
  });

  // 2. POST update Google Sheets URL
  app.post('/api/google-sheets-url', (req, res) => {
    const { url } = req.body;
    if (typeof url !== 'string') {
      return res.status(400).json({ error: 'Invalid URL parameter' });
    }
    writeConfig({ googleSheetsUrl: url });
    addActivityLog('مسؤول النظام', '', `تم تحديث الرابط الرئيسي لـ Google Sheets بنجاح إلى: ${url}`, 'تعديل', 'الإعدادات');
    res.json({ success: true, googleSheetsUrl: url });
  });

  // 3. GET all families
  app.get('/api/families', (req, res) => {
    let families = readFamilies();
    res.json(families);
  });

  // 4. POST save all families (override or replace)
  app.post('/api/families', (req, res) => {
    const { families } = req.body;
    if (!Array.isArray(families)) {
      return res.status(400).json({ error: 'Invalid families array' });
    }
    writeFamilies(families);
    addActivityLog('مسؤول النظام', '', `تم استيراد/تحديث قاعدة بيانات العائلات بالكامل (عدد السجلات: ${families.length})`, 'تعديل', 'التعداد');
    res.json({ success: true, count: families.length });
  });

  // 5. POST add a single family
  app.post('/api/families/add', (req, res) => {
    const { family } = req.body;
    if (!family) {
      return res.status(400).json({ error: 'Missing family object' });
    }
    const families = readFamilies();
    families.unshift(family);
    writeFamilies(families);
    addActivityLog(family.recorderName || 'عضو ميداني', '', `قام بإضافة عائلة جديدة للمنظومة باسم: [${family.headName || 'غير محدد'}]`, 'إضافة', 'التعداد');
    res.json({ success: true, family });
  });

  // 6. PUT edit a single family
  app.put('/api/families/edit', (req, res) => {
    const { family } = req.body;
    if (!family || !family.id) {
      return res.status(400).json({ error: 'Missing family or family ID' });
    }
    let families = readFamilies();
    families = families.map(f => f.id === family.id ? family : f);
    writeFamilies(families);
    addActivityLog(family.recorderName || 'عضو ميداني', '', `قام بتعديل وتحديث بيانات العائلة: [${family.headName || 'غير محدد'}]`, 'تعديل', 'التعداد');
    res.json({ success: true, family });
  });

  // 7. DELETE a single family
  app.delete('/api/families/:id', (req, res) => {
    const { id } = req.params;
    let families = readFamilies();
    const initialCount = families.length;
    const targetFamily = families.find(f => f.id === id);
    families = families.filter(f => f.id !== id);
    writeFamilies(families);
    addActivityLog('مسؤول النظام', '', `قام بحذف سجل عائلة من المنظومة: [${targetFamily ? targetFamily.headName : id}]`, 'حذف', 'التعداد');
    res.json({ success: true, deleted: families.length < initialCount });
  });

  // 8. CORS-free sheets fetch proxy
  app.get('/api/fetch-sheets-proxy', async (req, res) => {
    const { url } = req.query;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid URL query parameter' });
    }

    try {
      console.log(`Server proxy fetching Google Sheets URL: ${url}`);
      const fetchResponse = await fetch(url, {
        headers: {
          'Cache-Control': 'no-cache',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
      });
      
      if (!fetchResponse.ok) {
        return res.status(fetchResponse.status).json({ 
          error: `Google Sheets responded with status code: ${fetchResponse.status}` 
        });
      }

      const contentType = fetchResponse.headers.get('content-type') || '';
      const isBinary = contentType.includes('spreadsheet') || 
                       contentType.includes('excel') || 
                       contentType.includes('officedocument') || 
                       contentType.includes('opendocument') ||
                       url.toLowerCase().includes('.xlsx') ||
                       url.toLowerCase().includes('.xls') ||
                       url.toLowerCase().includes('.ods');

      if (isBinary) {
        const arrayBuffer = await fetchResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        res.setHeader('Content-Type', contentType || 'application/octet-stream');
        return res.send(buffer);
      } else {
        const text = await fetchResponse.text();
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        return res.send(text);
      }
    } catch (e: any) {
      console.error('Error fetching sheets URL inside proxy:', e);
      res.status(500).json({ error: `Server failed to fetch the spreadsheet: ${e.message}` });
    }
  });

  // 9. CORS-free sheets POST submit proxy for Web App (Apps Script)
  app.post('/api/submit-to-sheets', async (req, res) => {
    const payload = req.body;
    const config = readConfig();
    const url = payload.targetUrl || config?.googleSheetsUrl || 'https://script.google.com/macros/s/AKfycbzEExX96ybPtLaPq67eRzXlnOz2CAziYmU6I1w9B57cKhRPzRkAhZmYPEOX2NMrtecccQ/exec';

    if (!url) {
      return res.status(400).json({ error: 'No Google Sheets URL configured' });
    }

    if (!url.includes('script.google') && !url.includes('exec') && !url.includes('macros')) {
      console.log('Skipping Google Sheets App Script submission because URL is not an Apps Script:', url);
      return res.json({ success: true, message: 'Skipped: Not an Apps Script URL' });
    }

    try {
      console.log('Server proxy submitting to Google Sheets Web App:', url, payload);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const responseText = await response.text();
      console.log('Google Sheets Web App responded with status:', response.status, responseText);
      
      res.json({ 
        success: response.ok, 
        status: response.status, 
        response: responseText 
      });
    } catch (e: any) {
      console.error('Error submitting to sheets URL inside proxy:', e);
      res.status(500).json({ error: `Server failed to submit to the spreadsheet: ${e.message}` });
    }
  });

  // --- 10. AUTHENTICATION & MEMBERSHIP WORKFLOW ENDPOINTS ---

  // POST Login
  app.post('/api/auth/login', (req, res) => {
    const { usernameOrEmail, password } = req.body;
    if (!usernameOrEmail || !password) {
      return res.status(400).json({ error: 'يرجى إدخال اسم المستخدم/البريد الإلكتروني وكلمة المرور' });
    }

    const cleanInput = usernameOrEmail.trim().toLowerCase();
    const users = readUsers();

    // Find user in persistent file
    const matchedUser = users.find(
      u => u.email.toLowerCase() === cleanInput || u.username.toLowerCase() === cleanInput
    );

    if (!matchedUser) {
      return res.status(401).json({ error: 'اسم المستخدم / البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }

    if (matchedUser.password !== password) {
      return res.status(401).json({ error: 'اسم المستخدم / البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }

    if (!matchedUser.isActivated) {
      // If the role is delegate, we allow them to log in so they can see the unapproved delegate panel
      if (matchedUser.role !== 'delegate') {
        return res.status(403).json({ error: 'حسابك قيد المراجعة والموافقة من قبل الإدارة أو بانتظار التفعيل عبر البريد الإلكتروني' });
      }
    }

    // Success login
    const deviceHeader = req.headers['user-agent'] || '';
    const friendlyDevice = deviceHeader.includes('Mobi') ? 'متصفح هاتف ذكي' : 'متصفح حاسوب شخصي';
    
    // Filter out old session for this email
    activeSessions = activeSessions.filter(s => s.userEmail.toLowerCase() !== matchedUser.email.toLowerCase());
    activeSessions.unshift({
      id: 'sess_' + Date.now(),
      userName: matchedUser.name + ' ' + matchedUser.surname,
      userEmail: matchedUser.email,
      role: matchedUser.role,
      userRole: matchedUser.role,
      department: matchedUser.department || 'كل الأقسام',
      title: matchedUser.title || (matchedUser.role === 'delegate' ? 'مندوب تبرعات ومساهمات' : 'مندوب تعداد وسكان'),
      loginTime: new Date().toISOString(),
      device: friendlyDevice + ' (نشط الآن)',
      userAgent: friendlyDevice,
      ip: req.ip || '127.0.0.1'
    });

    // Record activity log
    addActivityLog(matchedUser.name + ' ' + matchedUser.surname, matchedUser.email, 'سجل دخوله للمنصة بنجاح', 'تسجيل دخول', 'الحسابات');

    res.json({
      success: true,
      user: {
        id: matchedUser.id,
        username: matchedUser.username,
        email: matchedUser.email,
        password: matchedUser.password,
        isDefaultPassword: matchedUser.password === '123456',
        name: matchedUser.name,
        surname: matchedUser.surname,
        phone: matchedUser.phone,
        role: matchedUser.role,
        isActivated: matchedUser.isActivated,
        status: matchedUser.status || (matchedUser.isActivated ? 'approved' : 'pending'),
        pendingActivationRequest: matchedUser.pendingActivationRequest || false,
        activationRequestDate: matchedUser.activationRequestDate || null,
        department: matchedUser.department || 'كل الأقسام',
        title: matchedUser.title || (matchedUser.role === 'delegate' ? 'مندوب تبرعات ومساهمات' : 'مندوب تعداد وسكان'),
        permissions: matchedUser.permissions || {
          canUploadFile: true,
          canFetchGoogle: true,
          canManageSupervisors: matchedUser.role === 'super-admin',
          canManageDeptsAndCampaigns: matchedUser.role === 'super-admin'
        }
      }
    });
  });

  // POST Register (Membership Request)
  app.post('/api/auth/register', (req, res) => {
    const { name, surname, phone, email, password } = req.body;
    if (!name || !surname || !phone || !email || !password) {
      return res.status(400).json({ error: 'جميع الحقول مطلوبة لتسجيل العضوية' });
    }

    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail === 'ahmed.khateeb@aljamal.com') {
      return res.status(400).json({ error: 'عذراً، هذا البريد الإلكتروني محظور وموقوف من قبل الإدارة لكونه غير معتمد.' });
    }

    const cleanPhone = phone.trim().replace(/[\s\-\+\(\)]/g, '');
    if (!/^7\d{8}$/.test(cleanPhone)) {
      return res.status(400).json({ error: 'يجب أن يكون رقم الهاتف جوال يمني مكون من 9 أرقام ويبدأ بـ 7' });
    }

    const users = readUsers();
    
    // Check if user already exists by email or phone
    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      return res.status(400).json({ error: 'هذا البريد الإلكتروني مسجل بالفعل بالمنصة' });
    }
    if (users.some(u => u.phone && u.phone.trim().replace(/[\s\-\+\(\)]/g, '') === cleanPhone)) {
      return res.status(400).json({ error: 'رقم الجوال هذا مسجل بالفعل بالمنصة' });
    }

    // Create user in users.json with status: pending
    const targetUserId = 'usr_' + Date.now();
    const token = 'tok_' + Math.floor(Math.random() * 1000000) + '_' + Date.now();
    
    const newUser = {
      id: targetUserId,
      username: cleanEmail.split('@')[0],
      email: cleanEmail,
      password: password,
      name: name.trim(),
      surname: surname.trim(),
      phone: phone.trim(),
      role: 'browser', // Registration defaults to unapproved browser role
      isActivated: false,
      status: 'pending',
      activationToken: token,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    writeUsers(users);

    // Create an inbox message containing the activation link
    const messages = readMessages();
    const newMsg = {
      id: "msg_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      referenceNumber: "USR-" + Math.floor(Math.random() * 10000) + Date.now().toString().slice(-4),
      name: `${name.trim()} ${surname.trim()}`,
      phone: phone.trim(),
      neighborhood: "غير محدد",
      msgType: "تسجيل عضوية",
      subject: `طلب انضمام عضو جديد: ${name.trim()} ${surname.trim()}`,
      message: `مرحباً، تم تسجيل حساب جديد عبر البوابة برتبة متصفح عادي بانتظار الاعتماد.
الاسم: ${name.trim()} ${surname.trim()}
البريد: ${cleanEmail}
رقم الاتصال: ${phone.trim()}

يرجى الضغط على الرابط التالي لتفعيل الحساب وقبوله فوراً:
/api/activate-account?token=${token}`,
      timestamp: new Date().toISOString(),
      status: "new"
    };
    messages.push(newMsg);
    writeMessages(messages);

    // Global Notification to refresh dashboard instantly
    const newNotif = {
      id: "notif_" + Date.now() + "_" + Math.floor(Math.random() * 10000),
      title: "تسجيل عضو جديد",
      message: `طلب انضمام عضو جديد: ${name.trim()} ${surname.trim()}`,
      type: "info",
      recordedBy: "النظام",
      timestamp: new Date().toLocaleTimeString("ar-SA") + " - " + new Date().toLocaleDateString("ar-SA")
    };
    notifications.unshift(newNotif);
    if (notifications.length > 15) notifications = notifications.slice(0, 15);

    res.json({
      success: true,
      message: 'تم إرسال طلبك بنجاح، يرجى انتظار مراجعة وموافقة الإدارة لتفعيل حسابك'
    });
  });

  // GET Pending Membership Requests
  app.get('/api/membership-requests', (req, res) => {
    const users = readUsers();
    // Return users with status pending as membership requests for backward compatibility with UI
    res.json(users.filter(u => u.status === 'pending'));
  });

  // POST Approve Request -> Generate simulated email with activation link
  app.post('/api/membership-requests/approve', (req, res) => {
    const { requestId } = req.body;
    if (!requestId) {
      return res.status(400).json({ error: 'Missing requestId' });
    }

    const users = readUsers();
    const userIndex = users.findIndex(u => u.id === requestId);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'طلب العضوية غير موجود' });
    }

    const user = users[userIndex];
    user.status = 'approved';
    user.isActivated = true;
    writeUsers(users);

    res.json({ success: true });
  });

  // POST Reject/Delete Request
  app.post('/api/membership-requests/reject', (req, res) => {
    const { requestId } = req.body;
    if (!requestId) {
      return res.status(400).json({ error: 'Missing requestId' });
    }

    // Since membership requests are now users in pending state
    let users = readUsers();
    users = users.filter(u => u.id !== requestId);
    writeUsers(users);

    res.json({ success: true });
  });

  // GET Simulated Sent Emails (for frontend simulator panel)
  app.get('/api/sent-emails', (req, res) => {
    res.json(readEmails());
  });

  // GET Activate Account via Email Link
  app.get('/api/activate-account', (req, res) => {
    const { token } = req.query;
    if (!token || typeof token !== 'string') {
      return res.status(400).send('رابط تفعيل غير صالح أو منتهي الصلاحية.');
    }

    const users = readUsers();
    
    // Support both old flow (email token) and new flow (user activationToken)
    const emails = readEmails();
    const emailIndex = emails.findIndex(e => e.token === token);
    
    let targetUser = users.find(u => u.activationToken === token);
    let isOldFlow = false;
    let emailItem = null;
    
    if (!targetUser) {
        if (emailIndex !== -1) {
            emailItem = emails[emailIndex];
            targetUser = users.find(u => u.email.toLowerCase() === emailItem.toEmail.toLowerCase());
            isOldFlow = true;
        }
    }
    
    if (!targetUser) {
      return res.status(404).send('رمز التفعيل غير موجود أو منتهي الصلاحية.');
    }
    
    if (targetUser.status === 'approved' && targetUser.isActivated) {
      return res.send(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8">
          <title>الحساب مفعّل مسبقاً</title>
          <style>
            body { font-family: sans-serif; background-color: #FDFBF7; color: #2D3A30; text-align: center; padding: 50px; }
            .card { background: white; border: 1px solid #E2DED0; border-radius: 20px; max-width: 500px; margin: auto; padding: 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
            h2 { color: #A98467; }
            .btn { background: #4A5D4E; color: white; border: none; padding: 10px 25px; border-radius: 10px; cursor: pointer; text-decoration: none; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>⚠️ تفعيل مكرر</h2>
            <p>لقد تم تفعيل هذا الحساب مسبقاً بنجاح! يمكنك الآن تسجيل الدخول مباشرة.</p>
            <br/>
            <a href="/" class="btn">العودة لبوابة القرية</a>
          </div>
        </body>
        </html>
      `);
    }

    if (isOldFlow && emailItem) {
        emailItem.clicked = true;
        writeEmails(emails);
    }

    if (targetUser) {
      targetUser.isActivated = true;
      targetUser.status = 'approved';
      writeUsers(users);

      // Trigger global real-time notification
      const newNotif = {
        id: 'notif_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
        title: 'انضمام وتفعيل عضو جديد بنجاح',
        message: `انضم وتفعل حساب عضو جديد بالبوابة: (${targetUser.name} ${targetUser.surname}). يرجى الدخول للوحة التحكم لمنحه الصلاحية وتكليف المهام.`,
        type: 'success',
        recordedBy: targetUser.name + ' ' + targetUser.surname,
        timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' - ' + new Date().toLocaleDateString('ar-SA')
      };
      notifications.unshift(newNotif);
      if (notifications.length > 15) {
        notifications = notifications.slice(0, 15);
      }
    }

    res.send(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>تم تفعيل الحساب بنجاح</title>
        <style>
          body { font-family: sans-serif; background-color: #FDFBF7; color: #2D3A30; text-align: center; padding: 50px; }
          .card { background: white; border: 1px solid #E2DED0; border-radius: 24px; max-width: 500px; margin: auto; padding: 35px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
          h2 { color: #4A5D4E; margin-bottom: 15px; }
          p { line-height: 1.6; color: #5F6C61; }
          .success-badge { font-size: 50px; margin-bottom: 10px; }
          .btn { display: inline-block; background: #4A5D4E; color: #FDFBF7; border: none; padding: 12px 30px; border-radius: 12px; cursor: pointer; text-decoration: none; font-size: 14px; font-weight: bold; margin-top: 20px; transition: background 0.2s; }
          .btn:hover { background: #3E4C41; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="success-badge">🎉</div>
          <h2>تم التفعيل والتأكيد بنجاح!</h2>
          <p>أهلاً بك في بوابة الجمال التنموية. تم تفعيل بريدك الإلكتروني بنجاح، وجاري إرسال إشعار للمشرف العام والمدير لتحديد دورك وصلاحيات مهامك بالبوابة.</p>
          <a href="/" class="btn">العودة وتسجيل الدخول</a>
        </div>
      </body>
      </html>
    `);
  });

  // GET All Registered Users
  app.get('/api/users', (req, res) => {
    res.json(readUsers());
  });

  // POST Request Activation by Delegate
  app.post('/api/users/request-activation', (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'البريد الإلكتروني مطلوب لإرسال الطلب' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const users = readUsers();
    const user = users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود بالمنصة' });
    }

    user.status = 'pending_activation'; // بانتظار الاعتماد
    user.pendingActivationRequest = true;
    user.activationRequestDate = new Date().toISOString();

    writeUsers(users);

    // Record activity log
    addActivityLog(user.name + ' ' + user.surname, user.email, 'قام بإرسال طلب تفعيل العضوية والاعتماد كمندوب للمنصة', 'تعديل', 'الحسابات');

    res.json({ success: true, user });
  });

  // POST Assign Role
  app.post('/api/users/update-role', (req, res) => {
    const { userId, role, department, title, phone, permissions } = req.body;
    if (!userId || !role) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    const users = readUsers();
    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    user.role = role;
    if (department !== undefined) user.department = department;
    if (title !== undefined) user.title = title;
    if (phone !== undefined) user.phone = phone.trim();
    if (permissions !== undefined) user.permissions = permissions;

    user.isActivated = true;
    user.status = 'approved';
    
    // Clear activation request states
    user.pendingActivationRequest = false;
    user.activationRequestDate = null;

    writeUsers(users);

    // Record activity log
    addActivityLog('المشرف العام', 'helmialkhateeb@gmail.com', `تم تعديل وتحديث صلاحيات ورتبة الحساب: [${user.name} ${user.surname}] وتعيين المسمى: [${user.title || 'غير محدد'}] والقسم: [${user.department || 'غير محدد'}]`, 'تعديل', 'الإعدادات');

    res.json({ success: true, user });
  });

  // POST First Login Update (Profile details + password change from 123456)
  app.post('/api/auth/first-login-update', (req, res) => {
    const { userId, name, surname, phone, email, password } = req.body;
    if (!userId || !name || !surname || !phone || !email || !password) {
      return res.status(400).json({ error: 'يرجى إكمال جميع الحقول المطلوبة' });
    }

    const cleanPhone = phone.trim().replace(/[\s\-\+\(\)]/g, '');
    if (!/^7\d{8}$/.test(cleanPhone)) {
      return res.status(400).json({ error: 'يجب أن يكون رقم الهاتف جوال يمني مكون من 9 أرقام ويبدأ بـ 7' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const users = readUsers();
    const userIdx = users.findIndex(u => u.id === userId);
    if (userIdx === -1) {
      return res.status(404).json({ error: 'لم يتم العثور على العضو في النظام' });
    }

    const targetUser = users[userIdx];

    // Check if new email/phone are taken by SOMEONE ELSE
    if (users.some((u, idx) => idx !== userIdx && u.email.toLowerCase() === cleanEmail)) {
      return res.status(400).json({ error: 'البريد الإلكتروني المدخل مستخدم بالفعل من قبل عضو آخر' });
    }
    if (users.some((u, idx) => idx !== userIdx && u.phone && u.phone.trim().replace(/[\s\-\+\(\)]/g, '') === cleanPhone)) {
      return res.status(400).json({ error: 'رقم الجوال المدخل مستخدم بالفعل من قبل عضو آخر' });
    }

    const oldEmail = targetUser.email.toLowerCase();
    const oldName = (targetUser.name + ' ' + targetUser.surname).trim();
    const newName = (name.trim() + ' ' + surname.trim()).trim();

    // Update targetUser details
    targetUser.name = name.trim();
    targetUser.surname = surname.trim();
    targetUser.phone = phone.trim();
    targetUser.email = cleanEmail;
    targetUser.password = password; // Set password to their new password!

    writeUsers(users);

    // Cascade updates to donations and families
    try {
      const donationsPath = path.join(process.cwd(), 'donations.json');
      if (fs.existsSync(donationsPath)) {
        const raw = fs.readFileSync(donationsPath, 'utf-8');
        const donations = JSON.parse(raw);
        let changed = false;
        donations.forEach((d: any) => {
          if (d.recordedBy && d.recordedBy.toLowerCase() === oldEmail) {
            d.recordedBy = cleanEmail;
            changed = true;
          }
          if (d.delegateUserId === userId) {
            d.delegateName = newName;
            d.delegatePhone = phone.trim();
            changed = true;
          }
        });
        if (changed) {
          fs.writeFileSync(donationsPath, JSON.stringify(donations, null, 2), 'utf-8');
        }
      }
    } catch (e) {
      console.error('Cascading updates to donations failed:', e);
    }

    try {
      const familiesPath = path.join(process.cwd(), 'families.json');
      if (fs.existsSync(familiesPath)) {
        const raw = fs.readFileSync(familiesPath, 'utf-8');
        const families = JSON.parse(raw);
        let changed = false;
        families.forEach((f: any) => {
          if (f.recorderEmail && f.recorderEmail.toLowerCase() === oldEmail) {
            f.recorderEmail = cleanEmail;
            changed = true;
          }
          if (f.recorderName === oldName) {
            f.recorderName = newName;
            changed = true;
          }
        });
        if (changed) {
          fs.writeFileSync(familiesPath, JSON.stringify(families, null, 2), 'utf-8');
        }
      }
    } catch (e) {
      console.error('Cascading updates to families failed:', e);
    }

    addActivityLog(newName, cleanEmail, 'قام بتعديل كلمة المرور الافتراضية وتحديث بياناته الشخصية عند أول تسجيل دخول بنجاح', 'تعديل', 'الحسابات');

    res.json({
      success: true,
      user: {
        id: targetUser.id,
        username: targetUser.username,
        email: targetUser.email,
        name: targetUser.name,
        surname: targetUser.surname,
        phone: targetUser.phone,
        role: targetUser.role,
        isActivated: targetUser.isActivated,
        status: targetUser.status || 'approved',
        department: targetUser.department || 'كل الأقسام',
        title: targetUser.title || (targetUser.role === 'delegate' ? 'مندوب تبرعات ومساهمات' : 'مندوب تعداد وسكان')
      }
    });
  });

  // POST Update Admin Profile
  app.post('/api/users/update-profile', (req, res) => {
    const { userId, email, phone } = req.body;
    if (!userId || !email) {
      return res.status(400).json({ error: 'البيانات غير مكتملة' });
    }

    const users = readUsers();
    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    if (phone) {
      const cleanPhone = phone.trim().replace(/[\s\-\+\(\)]/g, '');
      if (!/^7\d{8}$/.test(cleanPhone)) {
        return res.status(400).json({ error: 'يجب أن يكون رقم الهاتف جوال يمني مكون من 9 أرقام ويبدأ بـ 7' });
      }
      if (users.some(u => u.id !== userId && u.phone && u.phone.trim().replace(/[\s\-\+\(\)]/g, '') === cleanPhone)) {
        return res.status(400).json({ error: 'رقم الهاتف هذا مسجل بالفعل لمستخدم آخر' });
      }
    }

    const cleanEmail = email.trim().toLowerCase();
    // Validate uniqueness if email changed
    if (cleanEmail !== user.email.toLowerCase() && users.some(u => u.email.toLowerCase() === cleanEmail)) {
      return res.status(400).json({ error: 'هذا البريد الإلكتروني مسجل بالفعل لمستخدم آخر' });
    }

    const oldEmail = user.email;
    user.email = cleanEmail;
    if (phone !== undefined) user.phone = phone.trim();
    writeUsers(users);

    // Record activity log
    addActivityLog('المشرف العام', user.email, `قام المشرف العام بتعديل بياناته الشخصية في قاعدة البيانات (البريد السابق: ${oldEmail} -> الجديد: ${user.email})`, 'تعديل', 'الحسابات');

    res.json({ success: true, user });
  });

  // POST Update Delegate Details and Checkbox Permissions
  app.post('/api/users/update-delegate', (req, res) => {
    const { userId, name, surname, email, phone, permissions } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'معرف المستخدم مطلوب' });
    }

    const users = readUsers();
    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    if (phone) {
      const cleanPhone = phone.trim().replace(/[\s\-\+\(\)]/g, '');
      if (!/^7\d{8}$/.test(cleanPhone)) {
        return res.status(400).json({ error: 'يجب أن يكون رقم الهاتف جوال يمني مكون من 9 أرقام ويبدأ بـ 7' });
      }
      if (users.some(u => u.id !== userId && u.phone && u.phone.trim().replace(/[\s\-\+\(\)]/g, '') === cleanPhone)) {
        return res.status(400).json({ error: 'رقم الهاتف هذا مسجل بالفعل لمستخدم آخر' });
      }
    }

    if (name) user.name = name.trim();
    if (surname) user.surname = surname.trim();
    if (phone !== undefined) user.phone = phone.trim();
    
    if (email) {
      const cleanEmail = email.trim().toLowerCase();
      if (cleanEmail === 'ahmed.khateeb@aljamal.com') {
        return res.status(400).json({ error: 'هذا البريد الإلكتروني محظور وموقوف ولا يمكن تعيينه' });
      }
      if (cleanEmail !== user.email.toLowerCase() && users.some(u => u.email.toLowerCase() === cleanEmail)) {
        return res.status(400).json({ error: 'هذا البريد الإلكتروني مسجل بالفعل لمستخدم آخر' });
      }
      user.email = cleanEmail;
    }

    if (permissions) {
      user.permissions = {
        ...(user.permissions || {}),
        ...permissions
      };
    }

    writeUsers(users);

    // Record activity log
    addActivityLog('المشرف العام', 'helmialkhateeb@gmail.com', `قام بتعديل وتحديث بيانات وصلاحيات المندوب [${user.name} ${user.surname}] بدقة عبر نظام مربعات الاختيار (Checkboxes).`, 'تعديل', 'الإعدادات');

    res.json({ success: true, user });
  });

  // POST Reset Password by Super Admin
  app.post('/api/users/reset-password-admin', (req, res) => {
    const { userId, newPassword } = req.body;
    if (!userId || !newPassword) {
      return res.status(400).json({ error: 'مطلوب معرف الحساب وكلمة المرور الجديدة' });
    }

    const users = readUsers();
    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    user.password = newPassword.trim();
    writeUsers(users);

    // Record activity log
    addActivityLog('المشرف العام', 'helmialkhateeb@gmail.com', `قام المشرف العام بإعادة تعيين كلمة المرور لحساب العضو: [${user.name} ${user.surname}] بنجاح.`, 'تعديل', 'الإعدادات');

    res.json({ success: true, message: 'تم إعادة تعيين كلمة المرور بنجاح!' });
  });

  // POST Create Delegate Quickly by Super Admin (Name & Email only)
  app.post('/api/users/quick-add-delegate', (req, res) => {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'الاسم والبريد الإلكتروني مطلوبان' });
    }

    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail === 'ahmed.khateeb@aljamal.com') {
      return res.status(400).json({ error: 'عذراً، هذا البريد الإلكتروني محظور وموقوف من قبل الإدارة.' });
    }
    const users = readUsers();

    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      return res.status(400).json({ error: 'هذا البريد الإلكتروني مسجل بالفعل بالمنصة' });
    }

    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0];
    const surname = nameParts.slice(1).join(' ') || 'المندوب';

    const newUser = {
      id: 'usr_' + Date.now(),
      username: cleanEmail.split('@')[0],
      email: cleanEmail,
      password: '123456Password!', // Default password
      name: firstName,
      surname: surname,
      phone: '0500000000', // Default phone
      role: 'delegate',
      department: 'قسم التبرعات',
      title: 'مندوب تبرعات ومساهمات',
      permissions: {
        canCensus: true,
        canEditCensus: false,
        canDonations: true,
        canUploadFile: true,
        canFetchGoogle: true
      },
      isActivated: true,
      status: 'approved',
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    writeUsers(users);

    // Record activity log
    addActivityLog('المشرف العام', 'helmialkhateeb@gmail.com', `قام باعتماد مندوب جديد مباشرة بالاسم: [${name.trim()}] والبريد: [${cleanEmail}]`, 'إضافة', 'الإعدادات');

    res.json({ success: true, user: newUser });
  });

  // POST Create User Manually
  app.post('/api/users/add-manual', (req, res) => {
    const { name, surname, email, password, phone, role, department, title, permissions } = req.body;
    if (!name || !surname || !email || !password || !phone || !role) {
      return res.status(400).json({ error: 'جميع الحقول مطلوبة لإنشاء الحساب يدوياً' });
    }

    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail === 'ahmed.khateeb@aljamal.com') {
      return res.status(400).json({ error: 'عذراً، هذا البريد الإلكتروني محظور وموقوف من قبل الإدارة لكونه غير معتمد.' });
    }

    const cleanPhone = phone.trim().replace(/[\s\-\+\(\)]/g, '');
    if (!/^7\d{8}$/.test(cleanPhone)) {
      return res.status(400).json({ error: 'يجب أن يكون رقم الهاتف جوال يمني مكون من 9 أرقام ويبدأ بـ 7' });
    }

    const users = readUsers();

    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      return res.status(400).json({ error: 'هذا البريد الإلكتروني مسجل بالفعل بالمنصة' });
    }
    if (users.some(u => u.phone && u.phone.trim().replace(/[\s\-\+\(\)]/g, '') === cleanPhone)) {
      return res.status(400).json({ error: 'رقم الجوال هذا مسجل بالفعل لمستخدم آخر بالمنصة' });
    }

    const newUser = {
      id: 'usr_' + Date.now(),
      username: cleanEmail.split('@')[0],
      email: cleanEmail,
      password: password,
      name: name.trim(),
      surname: surname.trim(),
      phone: phone.trim(),
      role: role,
      department: department || 'كل الأقسام',
      title: title || 'مندوب تعداد وسكان',
      permissions: permissions || {
        canUploadFile: true,
        canFetchGoogle: true,
        canManageSupervisors: false,
        canManageDeptsAndCampaigns: false
      },
      isActivated: true,
      status: 'approved',
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    writeUsers(users);

    // Record activity log
    addActivityLog('المشرف العام', 'helmialkhateeb@gmail.com', `قام بإنشاء وتفعيل حساب جديد يدوياً باسم: [${newUser.name} ${newUser.surname}] برتبة: [${newUser.role}] ومسمى: [${newUser.title}]`, 'إضافة', 'الإعدادات');

    res.json({ success: true, user: newUser });
  });

  // GET Active Sessions (exclusive for Super Admin)
  app.get('/api/active-sessions', (req, res) => {
    res.json(activeSessions);
  });

  // GET Activity Log (exclusive for Super Admin)
  app.get('/api/activity-log', (req, res) => {
    res.json(readActivityLog());
  });

  // POST Create Custom Client Activity Log
  app.post('/api/activity-log/add', (req, res) => {
    const { userName, userEmail, action, actionType, section } = req.body;
    if (!userName || !action) {
      return res.status(400).json({ error: 'Missing name or action' });
    }
    addActivityLog(userName, userEmail || 'مجهول', action, actionType || 'أخرى', section || 'أخرى');
    res.json({ success: true });
  });

  // DELETE a registered user completely
  app.delete('/api/users/:id', (req, res) => {
    const { id } = req.params;
    let users = readUsers();
    const initialCount = users.length;
    const targetUser = users.find(u => u.id === id);
    if (!targetUser) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }
    users = users.filter(u => u.id !== id);
    writeUsers(users);
    
    // Also clear from active sessions
    activeSessions = activeSessions.filter(s => s.userEmail.toLowerCase() !== targetUser.email.toLowerCase());

    addActivityLog('المشرف العام', 'helmialkhateeb@gmail.com', `قام بحذف حساب العضو نهائياً من النظام: [${targetUser.name} ${targetUser.surname}]`, 'حذف', 'الإعدادات');
    res.json({ success: true, deleted: users.length < initialCount });
  });

  // POST Change Password
  app.post('/api/users/change-password', (req, res) => {
    const { email, oldPassword, newPassword } = req.body;
    if (!email || !oldPassword || !newPassword) {
      return res.status(400).json({ error: 'يرجى إدخال البيانات كاملة لتغيير كلمة المرور' });
    }

    const users = readUsers();
    const user = users.find(u => 
      u.email.toLowerCase() === email.trim().toLowerCase() ||
      u.username.toLowerCase() === email.trim().toLowerCase()
    );
    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    if (user.password !== oldPassword) {
      return res.status(400).json({ error: 'كلمة المرور الحالية غير صحيحة' });
    }

    user.password = newPassword;
    writeUsers(users);

    res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح!' });
  });

  // Global pending resets map
  const pendingResets = new Map<string, { code: string; email: string; expires: number }>();

  // POST Forgot Password
  app.post('/api/auth/forgot-password', (req, res) => {
    const { identifier } = req.body;
    if (!identifier) {
      return res.status(400).json({ error: 'يرجى إدخال البريد الإلكتروني أو رقم هاتف الجوال' });
    }

    const cleanInput = identifier.trim().toLowerCase();
    const users = readUsers();
    
    // Find user by email or phone
    const user = users.find(u => 
      u.email.toLowerCase() === cleanInput || 
      (u.phone && u.phone.trim() === identifier.trim())
    );

    if (!user) {
      return res.status(404).json({ error: 'لم يتم العثور على أي حساب مسجل بهذا البريد أو الهاتف.' });
    }

    // Generate a 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 15 * 60 * 1000; // 15 mins expiration

    pendingResets.set(user.id, { code, email: user.email, expires });

    // Record activity log
    addActivityLog(user.name + ' ' + user.surname, user.email, `طلب إعادة تعيين كلمة المرور - تم إرسال الرمز [${code}]`, 'تعديل', 'الحسابات');

    // Add a real-time notification alert so that Super Admin gets an immediate notification!
    const newNotif = {
      id: 'notif_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
      title: '⚠️ طلب استعادة كلمة المرور',
      message: `العضو [${user.name} ${user.surname}] طلب استعادة كلمة مروره. الرمز هو: ${code}`,
      type: 'warning',
      recordedBy: user.email,
      timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' - ' + new Date().toLocaleDateString('ar-SA')
    };
    notifications.unshift(newNotif);
    if (notifications.length > 15) {
      notifications = notifications.slice(0, 15);
    }

    // Also send an inbox message to Super Admin
    const messages = readMessages();
    messages.unshift({
      id: "msg_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      referenceNumber: "PWD-" + Math.floor(Math.random() * 10000) + Date.now().toString().slice(-4),
      name: user.name + ' ' + user.surname,
      phone: user.phone || 'غير مسجل',
      neighborhood: 'بوابة المندوبين',
      msgType: 'طلب استعادة كلمة مرور',
      subject: 'طلب إعادة تعيين كلمة المرور',
      message: `طلب المندوب/العضو ${user.name} ${user.surname} (البريد: ${user.email}) إعادة تعيين كلمة المرور لكونه نسيها. رمز التحقق الصادر والمفعل بالنظام هو: ${code}`,
      createdAt: new Date().toISOString(),
      status: 'new'
    });
    writeMessages(messages);

    res.json({ 
      success: true, 
      message: `تم إرسال رمز التحقق بنجاح إلى ${user.email}.`,
      userId: user.id
    });
  });

  // POST Reset Password with Code
  app.post('/api/auth/reset-password-with-code', (req, res) => {
    const { userId, code, newPassword } = req.body;
    if (!userId || !code || !newPassword) {
      return res.status(400).json({ error: 'البيانات غير مكتملة لإتمام العملية' });
    }

    const pending = pendingResets.get(userId);
    if (!pending) {
      return res.status(400).json({ error: 'طلب إعادة التعيين منتهي الصلاحية أو غير موجود.' });
    }

    if (Date.now() > pending.expires) {
      pendingResets.delete(userId);
      return res.status(400).json({ error: 'رمز التحقق منتهي الصلاحية. يرجى طلب رمز جديد.' });
    }

    if (pending.code !== code.trim()) {
      return res.status(400).json({ error: 'رمز التحقق غير صحيح.' });
    }

    const users = readUsers();
    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    user.password = newPassword.trim();
    writeUsers(users);

    // Clean up
    pendingResets.delete(userId);

    // Record activity log
    addActivityLog(user.name + ' ' + user.surname, user.email, `تمت إعادة تعيين كلمة المرور بنجاح باستخدام رمز التحقق.`, 'تعديل', 'الحسابات');

    res.json({ success: true, message: 'تم إعادة تعيين كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول.' });
  });


  // GET all messages (for SuperAdmin/Admin inbox)
  app.get("/api/messages", (req, res) => {
    res.json(readMessages());
  });

  // POST a new message from Contact form
  app.post("/api/messages", (req, res) => {
    const { name, phone, neighborhood, msgType, subject, message } = req.body;
    if (!name || !phone || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    const messages = readMessages();
    const newMsg = {
      id: "msg_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      referenceNumber: "BLG-" + Math.floor(Math.random() * 10000) + Date.now().toString().slice(-4),
      name,
      phone,
      neighborhood,
      msgType,
      subject,
      message,
      timestamp: new Date().toISOString(),
      status: "new"
    };
    
    messages.push(newMsg);
    writeMessages(messages);
    
    // Auto-forward message details to the Super Admin (General Supervisor) via simulated email
    const users = readUsers();
    const superAdmin = users.find(u => u.role === 'super-admin') || { email: 'helmialkhateeb@gmail.com' };
    const supervisorEmail = superAdmin.email;
    
    const emails = readEmails();
    const newEmail = {
      id: "email_" + Date.now() + "_" + Math.floor(Math.random() * 10000),
      toEmail: supervisorEmail,
      subject: `[إعادة توجيه بلاغ] ${subject || msgType} - من: ${name}`,
      content: `تم تلقي بلاغ/رسالة جديدة من خلال نموذج التواصل بالموقع وإعادة توجيهها تلقائياً إليك كمشرف عام لقرية ذي الجمال:
----------------------------------------
المرسل: ${name}
رقم الاتصال: ${phone}
المحلة: ${neighborhood}
نوع الرسالة: ${msgType}
الموضوع: ${subject}
التفاصيل:
${message}
----------------------------------------
تاريخ الاستلام: ${new Date().toISOString()}`,
      token: "",
      clicked: false,
      timestamp: new Date().toISOString(),
      activationLink: ""
    };
    emails.push(newEmail);
    writeEmails(emails);
    
    // Also add a notification
    const newNotif = {
      id: "notif_" + Date.now() + "_" + Math.floor(Math.random() * 10000),
      title: "رسالة / بلاغ جديد وموجّه",
      message: `تم استلام رسالة جديدة من (${name}) وإعادة توجيهها تلقائياً لبريد المشرف العام: ${supervisorEmail}.`,
      type: "info",
      recordedBy: "النظام",
      timestamp: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) + " - " + new Date().toLocaleDateString("ar-SA")
    };
    notifications.unshift(newNotif);
    if (notifications.length > 15) notifications = notifications.slice(0, 15);
    
    res.json({ success: true, message: newMsg });
  });


  // Global notifications store (in-memory, highly reactive)
  let notifications: any[] = [];

  // GET all active global real-time notifications
  app.get('/api/notifications', (req, res) => {
    res.json(notifications);
  });

  // POST trigger/add a new global notification banner
  app.post('/api/notifications', (req, res) => {
    const { notification } = req.body;
    if (!notification) {
      return res.status(400).json({ error: 'Missing notification payload' });
    }
    const newNotif = {
      id: 'notif_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
      title: notification.title || 'إشعار جديد',
      message: notification.message || '',
      type: notification.type || 'info',
      recordedBy: notification.recordedBy || 'النظام',
      amount: notification.amount || 0,
      currency: notification.currency || '',
      campaignTitle: notification.campaignTitle || '',
      timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' - ' + new Date().toLocaleDateString('ar-SA')
    };
    notifications.unshift(newNotif);
    // Limit to latest 15 notifications
    if (notifications.length > 15) {
      notifications = notifications.slice(0, 15);
    }
    res.json({ success: true, notification: newNotif });
  });

  // DELETE clear all notifications queue
  app.delete('/api/notifications', (req, res) => {
    notifications = [];
    res.json({ success: true, count: 0 });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
