import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Nav
      dashboard: 'Dashboard',
      regulations: 'Regulations',
      search: 'Search',
      aiAssistant: 'AI Assistant',
      upload: 'Upload',
      alerts: 'Alerts',
      profile: 'Profile',
      logout: 'Logout',
      login: 'Login',
      register: 'Register',

      // Dashboard
      welcomeBack: 'Welcome back',
      totalRegulations: 'Total Regulations',
      newThisWeek: 'New This Week',
      activeAlerts: 'Active Alerts',
      savedDocuments: 'Saved Documents',
      latestRegulations: 'Latest Regulations',
      quickSearch: 'Quick search regulations...',
      recentActivity: 'Recent AI Queries',
      viewAll: 'View All',
      viewDetails: 'View Details',

      // Regulations
      filterBy: 'Filter By',
      regulationType: 'Regulation Type',
      dateRange: 'Date Range',
      tags: 'Tags',
      sortBy: 'Sort By',
      newest: 'Newest First',
      oldest: 'Oldest First',
      relevance: 'Relevance',
      allTypes: 'All Types',
      law: 'Law',
      decree: 'Decree',
      circular: 'Circular',
      announcement: 'Announcement',
      published: 'Published',
      source: 'Source',
      readMore: 'Read More',
      noRegulations: 'No regulations found',

      // Search
      searchRegulations: 'Search Regulations',
      textSearch: 'Text Search',
      semanticSearch: 'Semantic Search (AI)',
      searchPlaceholder: 'Search for regulations, laws, decrees...',
      noResults: 'No results found',
      resultsFor: 'Results for',
      searchMode: 'Search Mode',
      filters: 'Filters',

      // AI Query
      aiQueryTitle: 'AI Regulatory Assistant',
      aiQuerySubtitle: 'Ask any question about FRA regulations',
      askQuestion: 'Ask a question...',
      send: 'Send',
      exampleQuestions: 'Example Questions',
      thinking: 'Thinking...',
      sources: 'Sources',
      relatedRegulations: 'Related Regulations',
      clearChat: 'Clear Chat',

      // Upload
      uploadDocuments: 'Upload Documents',
      dragAndDrop: 'Drag & drop files here, or click to select',
      supportedFormats: 'Supported formats: PDF, Word (.docx), Text (.txt)',
      documentTitle: 'Document Title',
      sourceUrl: 'Source URL',
      regulationTypeLabel: 'Regulation Type',
      publishedDate: 'Published Date',
      tagsLabel: 'Tags (comma separated)',
      uploadButton: 'Upload Document',
      uploadedDocuments: 'Uploaded Documents',
      processing: 'Processing',
      completed: 'Completed',
      failed: 'Failed',
      pending: 'Pending',
      delete: 'Delete',

      // Alerts
      myAlerts: 'My Alerts',
      createAlert: 'Create Alert',
      alertName: 'Alert Name',
      keywords: 'Keywords',
      notificationMethod: 'Notification Method',
      emailNotification: 'Email',
      whatsappNotification: 'WhatsApp',
      bothNotification: 'Both',
      active: 'Active',
      inactive: 'Inactive',
      sendTest: 'Send Test',
      alertHistory: 'Alert History',
      noAlerts: 'No alerts configured',
      triggered: 'Triggered',

      // Profile
      myProfile: 'My Profile',
      fullName: 'Full Name',
      email: 'Email',
      whatsappNumber: 'WhatsApp Number',
      preferredLanguage: 'Preferred Language',
      trackedKeywords: 'Tracked Keywords',
      notificationPreferences: 'Notification Preferences',
      notifyByEmail: 'Notify by Email',
      notifyByWhatsApp: 'Notify by WhatsApp',
      changePassword: 'Change Password',
      currentPassword: 'Current Password',
      newPassword: 'New Password',
      confirmPassword: 'Confirm Password',
      saveChanges: 'Save Changes',
      profileUpdated: 'Profile updated successfully',

      // Auth
      emailAddress: 'Email Address',
      password: 'Password',
      confirmPasswordLabel: 'Confirm Password',
      signIn: 'Sign In',
      createAccount: 'Create Account',
      alreadyHaveAccount: 'Already have an account?',
      dontHaveAccount: "Don't have an account?",
      loginSuccess: 'Login successful',
      registerSuccess: 'Account created successfully',
      invalidCredentials: 'Invalid email or password',
      passwordMismatch: 'Passwords do not match',

      // Common
      loading: 'Loading...',
      error: 'An error occurred',
      retry: 'Retry',
      cancel: 'Cancel',
      save: 'Save',
      close: 'Close',
      confirm: 'Confirm',
      yes: 'Yes',
      no: 'No',
      or: 'or',
      from: 'From',
      to: 'To',
      english: 'English',
      arabic: 'Arabic',
      language: 'Language',
      noData: 'No data available',
      page: 'Page',
      of: 'of',
      previous: 'Previous',
      next: 'Next',
    },
  },
  ar: {
    translation: {
      // Nav
      dashboard: 'لوحة التحكم',
      regulations: 'اللوائح',
      search: 'بحث',
      aiAssistant: 'المساعد الذكي',
      upload: 'رفع الملفات',
      alerts: 'التنبيهات',
      profile: 'الملف الشخصي',
      logout: 'تسجيل الخروج',
      login: 'تسجيل الدخول',
      register: 'إنشاء حساب',

      // Dashboard
      welcomeBack: 'مرحباً بعودتك',
      totalRegulations: 'إجمالي اللوائح',
      newThisWeek: 'جديد هذا الأسبوع',
      activeAlerts: 'التنبيهات النشطة',
      savedDocuments: 'المستندات المحفوظة',
      latestRegulations: 'أحدث اللوائح',
      quickSearch: 'البحث السريع في اللوائح...',
      recentActivity: 'الاستفسارات الأخيرة',
      viewAll: 'عرض الكل',
      viewDetails: 'عرض التفاصيل',

      // Regulations
      filterBy: 'تصفية حسب',
      regulationType: 'نوع اللائحة',
      dateRange: 'نطاق التاريخ',
      tags: 'الوسوم',
      sortBy: 'ترتيب حسب',
      newest: 'الأحدث أولاً',
      oldest: 'الأقدم أولاً',
      relevance: 'الصلة',
      allTypes: 'جميع الأنواع',
      law: 'قانون',
      decree: 'مرسوم',
      circular: 'تعميم',
      announcement: 'إعلان',
      published: 'تاريخ النشر',
      source: 'المصدر',
      readMore: 'اقرأ المزيد',
      noRegulations: 'لا توجد لوائح',

      // Search
      searchRegulations: 'البحث في اللوائح',
      textSearch: 'بحث نصي',
      semanticSearch: 'بحث دلالي (ذكاء اصطناعي)',
      searchPlaceholder: 'ابحث في اللوائح والقوانين والمراسيم...',
      noResults: 'لا توجد نتائج',
      resultsFor: 'نتائج لـ',
      searchMode: 'نوع البحث',
      filters: 'الفلاتر',

      // AI Query
      aiQueryTitle: 'المساعد التنظيمي الذكي',
      aiQuerySubtitle: 'اسأل أي سؤال عن لوائح هيئة الرقابة المالية',
      askQuestion: 'اطرح سؤالاً...',
      send: 'إرسال',
      exampleQuestions: 'أسئلة مقترحة',
      thinking: 'جاري التفكير...',
      sources: 'المصادر',
      relatedRegulations: 'اللوائح ذات الصلة',
      clearChat: 'مسح المحادثة',

      // Upload
      uploadDocuments: 'رفع المستندات',
      dragAndDrop: 'اسحب وأفلت الملفات هنا، أو انقر للاختيار',
      supportedFormats: 'الصيغ المدعومة: PDF، Word (.docx)، نص (.txt)',
      documentTitle: 'عنوان المستند',
      sourceUrl: 'رابط المصدر',
      regulationTypeLabel: 'نوع اللائحة',
      publishedDate: 'تاريخ النشر',
      tagsLabel: 'الوسوم (مفصولة بفاصلة)',
      uploadButton: 'رفع المستند',
      uploadedDocuments: 'المستندات المرفوعة',
      processing: 'قيد المعالجة',
      completed: 'مكتمل',
      failed: 'فشل',
      pending: 'في الانتظار',
      delete: 'حذف',

      // Alerts
      myAlerts: 'تنبيهاتي',
      createAlert: 'إنشاء تنبيه',
      alertName: 'اسم التنبيه',
      keywords: 'الكلمات المفتاحية',
      notificationMethod: 'طريقة الإشعار',
      emailNotification: 'البريد الإلكتروني',
      whatsappNotification: 'واتساب',
      bothNotification: 'كلاهما',
      active: 'نشط',
      inactive: 'غير نشط',
      sendTest: 'إرسال اختباري',
      alertHistory: 'سجل التنبيهات',
      noAlerts: 'لا توجد تنبيهات مضبوطة',
      triggered: 'تم التفعيل',

      // Profile
      myProfile: 'ملفي الشخصي',
      fullName: 'الاسم الكامل',
      email: 'البريد الإلكتروني',
      whatsappNumber: 'رقم واتساب',
      preferredLanguage: 'اللغة المفضلة',
      trackedKeywords: 'الكلمات المتتبعة',
      notificationPreferences: 'تفضيلات الإشعارات',
      notifyByEmail: 'الإشعار عبر البريد الإلكتروني',
      notifyByWhatsApp: 'الإشعار عبر واتساب',
      changePassword: 'تغيير كلمة المرور',
      currentPassword: 'كلمة المرور الحالية',
      newPassword: 'كلمة المرور الجديدة',
      confirmPassword: 'تأكيد كلمة المرور',
      saveChanges: 'حفظ التغييرات',
      profileUpdated: 'تم تحديث الملف الشخصي بنجاح',

      // Auth
      emailAddress: 'البريد الإلكتروني',
      password: 'كلمة المرور',
      confirmPasswordLabel: 'تأكيد كلمة المرور',
      signIn: 'تسجيل الدخول',
      createAccount: 'إنشاء حساب',
      alreadyHaveAccount: 'لديك حساب بالفعل؟',
      dontHaveAccount: 'ليس لديك حساب؟',
      loginSuccess: 'تم تسجيل الدخول بنجاح',
      registerSuccess: 'تم إنشاء الحساب بنجاح',
      invalidCredentials: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
      passwordMismatch: 'كلمات المرور غير متطابقة',

      // Common
      loading: 'جاري التحميل...',
      error: 'حدث خطأ',
      retry: 'إعادة المحاولة',
      cancel: 'إلغاء',
      save: 'حفظ',
      close: 'إغلاق',
      confirm: 'تأكيد',
      yes: 'نعم',
      no: 'لا',
      or: 'أو',
      from: 'من',
      to: 'إلى',
      english: 'English',
      arabic: 'العربية',
      language: 'اللغة',
      noData: 'لا توجد بيانات',
      page: 'صفحة',
      of: 'من',
      previous: 'السابق',
      next: 'التالي',
    },
  },
};

const savedLanguage = localStorage.getItem('fra_language') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

// Set HTML dir attribute based on language
const setDir = (lang: string) => {
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
};

setDir(savedLanguage);

i18n.on('languageChanged', (lang) => {
  setDir(lang);
  localStorage.setItem('fra_language', lang);
});

export default i18n;
