import { Family, Member } from '../types';

/**
 * Compares two Family objects and generates a detailed Arabic string of the differences.
 */
export function getFamilyDiff(oldFam: Family, newFam: Family): string {
  const changes: string[] = [];
  if (oldFam.familyName !== newFam.familyName) {
    changes.push(`اسم العائلة (من "${oldFam.familyName}" إلى "${newFam.familyName}")`);
  }
  if (oldFam.breadwinnerName !== newFam.breadwinnerName) {
    changes.push(`رب الأسرة (من "${oldFam.breadwinnerName}" إلى "${newFam.breadwinnerName}")`);
  }
  if (oldFam.nationalId !== newFam.nationalId) {
    changes.push(`الرقم الوطني لرب الأسرة (من "${oldFam.nationalId || 'فارغ'}" إلى "${newFam.nationalId || 'فارغ'}")`);
  }
  if (oldFam.phone !== newFam.phone) {
    changes.push(`الهاتف (من "${oldFam.phone}" إلى "${newFam.phone}")`);
  }
  if (oldFam.neighborhood !== newFam.neighborhood) {
    changes.push(`المحلة (من "${oldFam.neighborhood}" إلى "${newFam.neighborhood}")`);
  }
  if (oldFam.address !== newFam.address) {
    changes.push(`العنوان بالتفصيل (من "${oldFam.address}" إلى "${newFam.address}")`);
  }
  if (oldFam.housingType !== newFam.housingType) {
    changes.push(`نوع السكن (من "${oldFam.housingType}" إلى "${newFam.housingType}")`);
  }
  if (oldFam.monthlyIncome !== newFam.monthlyIncome) {
    changes.push(`فئة الدخل (من "${oldFam.monthlyIncome}" إلى "${newFam.monthlyIncome}")`);
  }
  if (oldFam.supportStatus !== newFam.supportStatus) {
    changes.push(`حالة الاستحقاق للدعم (من "${oldFam.supportStatus}" إلى "${newFam.supportStatus}")`);
  }
  if (oldFam.residence !== newFam.residence) {
    changes.push(`الإقامة (من "${oldFam.residence || 'غير محدد'}" إلى "${newFam.residence || 'غير محدد'}")`);
  }
  if (oldFam.notes !== newFam.notes) {
    changes.push(`الملاحظات (من "${oldFam.notes || 'فارغة'}" إلى "${newFam.notes || 'فارغة'}")`);
  }

  if (changes.length === 0) return 'لم تتغير أي حقول أساسية في العائلة نفسها';
  return `تم تحديث الحقول التالية للأسرة [عائلة ${newFam.familyName} / رب الأسرة: ${newFam.breadwinnerName}]: ${changes.join('، ')}`;
}

/**
 * Compares two Member objects and generates a detailed Arabic string of the differences.
 */
export function getMemberDiff(oldMem: Member, newMem: Member): string {
  const changes: string[] = [];
  if (oldMem.name !== newMem.name) {
    changes.push(`الاسم (من "${oldMem.name}" إلى "${newMem.name}")`);
  }
  if (oldMem.relationship !== newMem.relationship) {
    changes.push(`صلة القرابة (من "${oldMem.relationship}" إلى "${newMem.relationship}")`);
  }
  if (oldMem.gender !== newMem.gender) {
    changes.push(`الجنس (من "${oldMem.gender}" إلى "${newMem.gender}")`);
  }
  if (oldMem.age !== newMem.age) {
    changes.push(`العمر (من "${oldMem.age}" إلى "${newMem.age}")`);
  }
  if (oldMem.birthDate !== newMem.birthDate) {
    changes.push(`تاريخ الميلاد (من "${oldMem.birthDate || 'غير محدد'}" إلى "${newMem.birthDate || 'غير محدد'}")`);
  }
  if (oldMem.nationalId !== newMem.nationalId) {
    changes.push(`الرقم الوطني (من "${oldMem.nationalId || 'غير محدد'}" إلى "${newMem.nationalId || 'غير محدد'}")`);
  }
  if (oldMem.phone !== newMem.phone) {
    changes.push(`رقم الهاتف (من "${oldMem.phone || 'غير محدد'}" إلى "${newMem.phone || 'غير محدد'}")`);
  }
  if (oldMem.education !== newMem.education) {
    changes.push(`التعليم (من "${oldMem.education}" إلى "${newMem.education}")`);
  }
  if (oldMem.occupation !== newMem.occupation) {
    changes.push(`المهنة (من "${oldMem.occupation}" إلى "${newMem.occupation}")`);
  }
  if (oldMem.healthStatus !== newMem.healthStatus) {
    changes.push(`الحالة الصحية (من "${oldMem.healthStatus}" إلى "${newMem.healthStatus}")`);
  }
  if (oldMem.notes !== newMem.notes) {
    changes.push(`الملاحظات (من "${oldMem.notes || 'فارغة'}" إلى "${newMem.notes || 'فارغة'}")`);
  }

  if (changes.length === 0) return 'لم تتغير أي حقول في التابع';
  return `تم تحديث الحقول للتابع [${newMem.name}]: ${changes.join('، ')}`;
}

/**
 * Sends a detailed audit log to the backend activity log.
 */
export async function sendAuditLog(
  currentUser: any,
  action: string,
  actionType: 'إضافة' | 'تعديل' | 'حذف' | 'تسجيل دخول' | 'أخرى' | 'نقل',
  section: 'التعداد' | 'الخدمات' | 'التبرعات' | 'الحسابات' | 'الإعدادات' | 'أخرى' = 'التعداد'
) {
  try {
    const userName = currentUser
      ? `${currentUser.name || ''} ${currentUser.surname || ''}`.trim() || currentUser.email || 'عضو المنصة'
      : 'مسؤول النظام';
    const userEmail = currentUser?.email || 'system@aljamal.com';

    await fetch('/api/activity-log/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userName,
        userEmail,
        action,
        actionType,
        section,
      }),
    });
  } catch (error) {
    console.error('Failed to send audit log:', error);
  }
}
