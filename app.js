const supabaseSettings = window.PatientDZSupabase || window.DoctorDZSupabase || {};
const supabaseReady =
  window.supabase &&
  supabaseSettings.url &&
  supabaseSettings.anonKey &&
  !supabaseSettings.url.includes("YOUR_") &&
  !supabaseSettings.anonKey.includes("YOUR_");
const supabaseClient = supabaseReady ? window.supabase.createClient(supabaseSettings.url, supabaseSettings.anonKey) : null;

const screens = Object.fromEntries([...document.querySelectorAll(".screen")].map((screen) => [screen.dataset.screen, screen]));
const modalBackdrop = document.getElementById("modal-backdrop");
const modalTitle = document.getElementById("modal-title");
const modalBody = document.getElementById("modal-body");
const modalActions = document.getElementById("modal-actions");
const appState = {
  user: null,
  profile: null,
  doctor: null,
  clinic: null,
  workingDays: [],
  timeOff: [],
  appointments: [],
  appointmentFilter: "today",
  language: localStorage.getItem("doctordz-language") || "fr",
};

const appointmentFilters = ["all", "today", "pending", "upcoming", "completed", "cancelled"];
const queueFlow = ["waiting", "checked_in", "in_consultation", "checked_out"];
const todayIso = () => new Date().toISOString().slice(0, 10);
const languages = {
  fr: {
    dir: "ltr",
    locale: "fr-DZ",
    navDashboard: "Tableau",
    navAppointments: "Rendez-vous",
    navQueue: "File",
    navAvailability: "Horaires",
    navProfile: "Profil",
    mobileHome: "Accueil",
    mobileAppts: "RDV",
    mobileQueue: "File",
    mobileHours: "Horaires",
    mobileProfile: "Profil",
    startEyebrow: "Connecté à Patient DZ",
    startTitle: "Gérez votre cabinet depuis le tableau médecin.",
    startCopy: "Doctor DZ offre aux médecins algériens vérifiés un espace de travail clair pour les demandes de rendez-vous, la file d'attente, les horaires et le profil de clinique.",
    startHeading: "Démarrer",
    startFeature1: "Créer un compte médecin avec confirmation par email.",
    startFeature2: "Compléter l'onboarding de clinique pour la vérification admin.",
    startFeature3: "Gérer les rendez-vous et la file d'attente du jour.",
    createDoctorAccount: "Créer un compte médecin",
    login: "Connexion",
    logout: "Déconnexion",
    signupTitle: "Créer un compte médecin",
    signupMeta: "Utilisez l'adresse email que les patients et admins reconnaîtront.",
    fullName: "Nom complet",
    email: "Email",
    phone: "Téléphone",
    password: "Mot de passe",
    createAccount: "Créer le compte",
    alreadyRegistered: "Déjà inscrit ?",
    logIn: "Se connecter",
    loginTitle: "Connexion",
    loginMeta: "Accédez aux rendez-vous, horaires et contrôles de file.",
    forgotPassword: "Mot de passe oublié ?",
    needAccount: "Besoin d'un compte ?",
    forgotTitle: "Réinitialiser le mot de passe",
    forgotMeta: "Supabase enverra un lien sécurisé par email.",
    sendResetLink: "Envoyer le lien",
    backToLogin: "Retour à la connexion",
    confirmTitle: "Confirmation email",
    confirmMeta: "Après confirmation, connectez-vous pour terminer l'onboarding et attendre la vérification admin.",
    onboardingTitle: "Onboarding médecin",
    onboardingMeta: "Votre profil reste non vérifié jusqu'à l'approbation d'un admin.",
    specialty: "Spécialité",
    licenseNumber: "Numéro de licence",
    consultationPrice: "Prix consultation (DA)",
    clinicName: "Nom de la clinique",
    clinicPhone: "Téléphone clinique",
    clinicEmail: "Email clinique",
    city: "Ville",
    wilaya: "Wilaya",
    address: "Adresse",
    bio: "Bio",
    saveDoctorProfile: "Enregistrer le profil médecin",
    dashboard: "Tableau de bord",
    todayAtGlance: "Vue rapide du jour",
    today: "Aujourd'hui",
    pending: "En attente",
    upcoming: "À venir",
    completed: "Terminés",
    cancelled: "Annulés",
    todayAppointments: "Rendez-vous du jour",
    viewAll: "Voir tout",
    pendingRequests: "Demandes en attente",
    queueOverview: "Vue file d'attente",
    openQueue: "Ouvrir la file",
    appointments: "Rendez-vous",
    appointmentsSubtitle: "Approuvez, annulez et changez le statut patient.",
    all: "Tous",
    queue: "File d'attente",
    queueSubtitle: "Contrôles rapides pour les patients arrivés.",
    availability: "Horaires",
    availabilitySubtitle: "Les horaires et absences contrôlent les créneaux patient.",
    weeklyWorkingDays: "Jours de travail",
    day: "Jour",
    slotDuration: "Durée du créneau",
    startTime: "Heure début",
    endTime: "Heure fin",
    activeForBooking: "Actif pour réservation",
    saveWorkingBlock: "Enregistrer le bloc",
    timeOff: "Absences",
    startsAt: "Début",
    endsAt: "Fin",
    reason: "Motif",
    saveTimeOff: "Enregistrer l'absence",
    profileTitle: "Clinique et profil",
    profileSubtitle: "Modifiez les détails publics et la clinique liée.",
    language: "Langue",
    french: "Français",
    arabic: "العربية",
    english: "English",
    acceptsNewPatients: "Accepte de nouveaux patients",
    latitude: "Latitude",
    longitude: "Longitude",
    saveChanges: "Enregistrer",
    nothingHere: "Rien pour le moment.",
    noAppointments: "Aucun rendez-vous pour cet onglet.",
    noQueue: "Aucun patient arrivé aujourd'hui.",
    noAvailability: "Aucun horaire hebdomadaire.",
    noTimeOff: "Aucune absence prévue.",
    appointmentReason: "Motif",
    cancelReason: "Motif d'annulation",
    patient: "Patient",
    at: "à",
    min: "min",
    position: "Position",
    next: "Suivant",
    approve: "Approuver",
    checkedInAction: "Arrivé",
    inConsultationAction: "En consultation",
    checkedOutAction: "Sorti",
    complete: "Terminer",
    noShowAction: "Absent",
    cancel: "Annuler",
    edit: "Modifier",
    delete: "Supprimer",
    active: "Actif",
    inactive: "Inactif",
    until: "Jusqu'à",
    verifiedTitle: "Compte médecin vérifié",
    unverifiedTitle: "En attente d'approbation admin",
    verifiedCopy: "Les patients peuvent réserver vos créneaux disponibles.",
    unverifiedCopy: "Votre profil est enregistré, mais les patients ne vous verront pas avant vérification.",
    verified: "Vérifié",
    unverified: "Non vérifié",
    confirmEmailTitle: "Confirmez votre email",
    confirmEmailCopy: "Nous avons envoyé un lien de confirmation à {email}. Confirmez-le, puis connectez-vous pour terminer l'onboarding.",
    resetSentTitle: "Lien envoyé",
    resetSentCopy: "Consultez {email} pour le lien de réinitialisation.",
    done: "Terminé",
    onboardingSaved: "Onboarding enregistré",
    profileSaved: "Profil enregistré",
    availabilitySaved: "Horaires enregistrés",
    timeOffSaved: "Absence enregistrée",
    appointmentUpdated: "Rendez-vous mis à jour",
    loggedIn: "Connecté",
    loggedOut: "Déconnecté",
    addSupabase: "Ajoutez l'URL Supabase et la clé anon dans supabase-config.js",
    clinicSaveFailed: "Échec enregistrement clinique",
    cancelAppointmentTitle: "Annuler le rendez-vous",
    cancelAppointmentCopy: "Indiquez au patient pourquoi ce rendez-vous est annulé.",
    keep: "Garder",
    cancelAppointment: "Annuler le rendez-vous",
    addCancellationReason: "Ajoutez un motif d'annulation",
    workingBlockDeleted: "Bloc supprimé",
    timeOffDeleted: "Absence supprimée",
    days: ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"],
    statuses: {
      pending: "En attente",
      confirmed: "Confirmé",
      cancelled_by_patient: "Annulé par patient",
      cancelled_by_doctor: "Annulé par médecin",
      completed: "Terminé",
      no_show: "Absent",
      not_checked_in: "Pas arrivé",
      waiting: "En attente",
      checked_in: "Arrivé",
      in_consultation: "En consultation",
      checked_out: "Sorti",
      approve: "Approuvé",
      cancelled: "Annulé",
    },
  },
  en: {
    dir: "ltr",
    locale: "en-DZ",
    navDashboard: "Dashboard",
    navAppointments: "Appointments",
    navQueue: "Queue",
    navAvailability: "Availability",
    navProfile: "Profile",
    mobileHome: "Home",
    mobileAppts: "Appts",
    mobileQueue: "Queue",
    mobileHours: "Hours",
    mobileProfile: "Profile",
    startEyebrow: "Connected to Patient DZ",
    startTitle: "Manage your practice from the doctor dashboard.",
    startCopy: "Doctor DZ gives verified Algerian doctors one focused workspace for appointment requests, queue flow, weekly availability, and clinic profile updates.",
    startHeading: "Start",
    startFeature1: "Create a doctor account with email confirmation.",
    startFeature2: "Complete clinic onboarding for admin verification.",
    startFeature3: "Run daily appointments and queue status from one screen.",
    createDoctorAccount: "Create Doctor Account",
    login: "Login",
    logout: "Logout",
    signupTitle: "Create doctor account",
    signupMeta: "Use the email address you want patients and admins to recognize.",
    fullName: "Full name",
    email: "Email",
    phone: "Phone",
    password: "Password",
    createAccount: "Create Account",
    alreadyRegistered: "Already registered?",
    logIn: "Log in",
    loginTitle: "Log in",
    loginMeta: "Access appointments, availability, and queue controls.",
    forgotPassword: "Forgot password?",
    needAccount: "Need an account?",
    forgotTitle: "Reset password",
    forgotMeta: "Supabase will email a secure reset link.",
    sendResetLink: "Send Reset Link",
    backToLogin: "Back to login",
    confirmTitle: "Email confirmation",
    confirmMeta: "After confirming your email, log in to complete doctor onboarding and wait for admin verification.",
    onboardingTitle: "Doctor onboarding",
    onboardingMeta: "Your profile is unverified until an admin approves it.",
    specialty: "Specialty",
    licenseNumber: "License number",
    consultationPrice: "Consultation price (DA)",
    clinicName: "Clinic name",
    clinicPhone: "Clinic phone",
    clinicEmail: "Clinic email",
    city: "City",
    wilaya: "Wilaya",
    address: "Address",
    bio: "Bio",
    saveDoctorProfile: "Save Doctor Profile",
    dashboard: "Dashboard",
    todayAtGlance: "Today at a glance",
    today: "Today",
    pending: "Pending",
    upcoming: "Upcoming",
    completed: "Completed",
    cancelled: "Cancelled",
    todayAppointments: "Today's appointments",
    viewAll: "View all",
    pendingRequests: "Pending requests",
    queueOverview: "Queue overview",
    openQueue: "Open queue",
    appointments: "Appointments",
    appointmentsSubtitle: "Approve requests, cancel visits, and move patient status.",
    all: "All",
    queue: "Queue",
    queueSubtitle: "Fast status controls for checked-in patients.",
    availability: "Availability",
    availabilitySubtitle: "Weekly blocks and time off control patient booking slots.",
    weeklyWorkingDays: "Weekly working days",
    day: "Day",
    slotDuration: "Slot duration",
    startTime: "Start time",
    endTime: "End time",
    activeForBooking: "Active for booking",
    saveWorkingBlock: "Save Working Block",
    timeOff: "Time off",
    startsAt: "Starts at",
    endsAt: "Ends at",
    reason: "Reason",
    saveTimeOff: "Save Time Off",
    profileTitle: "Clinic and profile",
    profileSubtitle: "Edit public doctor details and linked clinic information.",
    language: "Language",
    french: "Français",
    arabic: "العربية",
    english: "English",
    acceptsNewPatients: "Accepts new patients",
    latitude: "Latitude",
    longitude: "Longitude",
    saveChanges: "Save Changes",
    nothingHere: "Nothing here yet.",
    noAppointments: "No appointments found for this tab.",
    noQueue: "No checked-in patients for today.",
    noAvailability: "No weekly availability yet.",
    noTimeOff: "No time off scheduled.",
    appointmentReason: "Reason",
    cancelReason: "Cancel reason",
    patient: "Patient",
    at: "at",
    min: "min",
    position: "Position",
    next: "Next",
    approve: "Approve",
    checkedInAction: "Checked In",
    inConsultationAction: "In Consultation",
    checkedOutAction: "Checked Out",
    complete: "Complete",
    noShowAction: "No Show",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    active: "Active",
    inactive: "Inactive",
    until: "Until",
    verifiedTitle: "Verified doctor account",
    unverifiedTitle: "Waiting for admin approval",
    verifiedCopy: "Patients can book your available slots.",
    unverifiedCopy: "Your profile is saved, but patients will not see you until an admin verifies the account.",
    verified: "Verified",
    unverified: "Unverified",
    confirmEmailTitle: "Confirm your email",
    confirmEmailCopy: "We sent a confirmation link to {email}. Confirm it, then log in to complete doctor onboarding.",
    resetSentTitle: "Reset link sent",
    resetSentCopy: "Check {email} for the password reset email.",
    done: "Done",
    onboardingSaved: "Onboarding saved",
    profileSaved: "Profile saved",
    availabilitySaved: "Availability saved",
    timeOffSaved: "Time off saved",
    appointmentUpdated: "Appointment updated",
    loggedIn: "Logged in",
    loggedOut: "Logged out",
    addSupabase: "Add Supabase URL and anon key in supabase-config.js",
    clinicSaveFailed: "Clinic save failed",
    cancelAppointmentTitle: "Cancel appointment",
    cancelAppointmentCopy: "Tell the patient why this appointment was cancelled.",
    keep: "Keep",
    cancelAppointment: "Cancel appointment",
    addCancellationReason: "Add a cancellation reason",
    workingBlockDeleted: "Working block deleted",
    timeOffDeleted: "Time off deleted",
    days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    statuses: {},
  },
  ar: {
    dir: "rtl",
    locale: "ar-DZ",
    navDashboard: "لوحة التحكم",
    navAppointments: "المواعيد",
    navQueue: "الدور",
    navAvailability: "الأوقات",
    navProfile: "الملف",
    mobileHome: "الرئيسية",
    mobileAppts: "المواعيد",
    mobileQueue: "الدور",
    mobileHours: "الأوقات",
    mobileProfile: "الملف",
    startEyebrow: "متصل مع Patient DZ",
    startTitle: "سيّر عيادتك من لوحة الطبيب.",
    startCopy: "يوفر Doctor DZ للأطباء في الجزائر مساحة عمل واضحة لطلبات المواعيد، الدور، أوقات العمل، وتحديثات ملف العيادة.",
    startHeading: "ابدأ",
    startFeature1: "إنشاء حساب طبيب مع تأكيد البريد الإلكتروني.",
    startFeature2: "إكمال معلومات العيادة لانتظار موافقة الإدارة.",
    startFeature3: "إدارة مواعيد اليوم وحالة الدور من شاشة واحدة.",
    createDoctorAccount: "إنشاء حساب طبيب",
    login: "دخول",
    logout: "خروج",
    signupTitle: "إنشاء حساب طبيب",
    signupMeta: "استعمل البريد الإلكتروني الذي تريد أن يعرفه المرضى والإدارة.",
    fullName: "الاسم الكامل",
    email: "البريد الإلكتروني",
    phone: "الهاتف",
    password: "كلمة المرور",
    createAccount: "إنشاء الحساب",
    alreadyRegistered: "لديك حساب؟",
    logIn: "تسجيل الدخول",
    loginTitle: "تسجيل الدخول",
    loginMeta: "ادخل إلى المواعيد، الأوقات، وتحكم الدور.",
    forgotPassword: "نسيت كلمة المرور؟",
    needAccount: "تحتاج حساب؟",
    forgotTitle: "إعادة تعيين كلمة المرور",
    forgotMeta: "سيرسل Supabase رابطا آمنا إلى بريدك.",
    sendResetLink: "إرسال الرابط",
    backToLogin: "العودة للدخول",
    confirmTitle: "تأكيد البريد",
    confirmMeta: "بعد التأكيد، سجل الدخول لإكمال ملف الطبيب وانتظار موافقة الإدارة.",
    onboardingTitle: "إعداد حساب الطبيب",
    onboardingMeta: "يبقى ملفك غير موثق حتى توافق عليه الإدارة.",
    specialty: "التخصص",
    licenseNumber: "رقم الرخصة",
    consultationPrice: "سعر الفحص (دج)",
    clinicName: "اسم العيادة",
    clinicPhone: "هاتف العيادة",
    clinicEmail: "بريد العيادة",
    city: "المدينة",
    wilaya: "الولاية",
    address: "العنوان",
    bio: "نبذة",
    saveDoctorProfile: "حفظ ملف الطبيب",
    dashboard: "لوحة التحكم",
    todayAtGlance: "نظرة على اليوم",
    today: "اليوم",
    pending: "بانتظار",
    upcoming: "قادمة",
    completed: "مكتملة",
    cancelled: "ملغاة",
    todayAppointments: "مواعيد اليوم",
    viewAll: "عرض الكل",
    pendingRequests: "طلبات بانتظار الموافقة",
    queueOverview: "نظرة على الدور",
    openQueue: "فتح الدور",
    appointments: "المواعيد",
    appointmentsSubtitle: "وافق، ألغ، وغيّر حالة المريض.",
    all: "الكل",
    queue: "الدور",
    queueSubtitle: "تحكم سريع للمرضى الذين وصلوا.",
    availability: "الأوقات",
    availabilitySubtitle: "أيام العمل والغيابات تتحكم في حجوزات المرضى.",
    weeklyWorkingDays: "أيام العمل الأسبوعية",
    day: "اليوم",
    slotDuration: "مدة الموعد",
    startTime: "وقت البداية",
    endTime: "وقت النهاية",
    activeForBooking: "متاح للحجز",
    saveWorkingBlock: "حفظ الفترة",
    timeOff: "الغيابات",
    startsAt: "يبدأ",
    endsAt: "ينتهي",
    reason: "السبب",
    saveTimeOff: "حفظ الغياب",
    profileTitle: "العيادة والملف",
    profileSubtitle: "عدّل معلومات الطبيب والعيادة المرتبطة.",
    language: "اللغة",
    french: "Français",
    arabic: "العربية",
    english: "English",
    acceptsNewPatients: "يقبل مرضى جدد",
    latitude: "خط العرض",
    longitude: "خط الطول",
    saveChanges: "حفظ التغييرات",
    nothingHere: "لا يوجد شيء حاليا.",
    noAppointments: "لا توجد مواعيد في هذا التبويب.",
    noQueue: "لا يوجد مرضى وصلوا اليوم.",
    noAvailability: "لا توجد أوقات أسبوعية بعد.",
    noTimeOff: "لا توجد غيابات مبرمجة.",
    appointmentReason: "السبب",
    cancelReason: "سبب الإلغاء",
    patient: "المريض",
    at: "على",
    min: "دقيقة",
    position: "الترتيب",
    next: "التالي",
    approve: "موافقة",
    checkedInAction: "وصل",
    inConsultationAction: "في الفحص",
    checkedOutAction: "خرج",
    complete: "إنهاء",
    noShowAction: "لم يحضر",
    cancel: "إلغاء",
    edit: "تعديل",
    delete: "حذف",
    active: "نشط",
    inactive: "غير نشط",
    until: "إلى",
    verifiedTitle: "حساب طبيب موثق",
    unverifiedTitle: "بانتظار موافقة الإدارة",
    verifiedCopy: "يمكن للمرضى حجز الأوقات المتاحة.",
    unverifiedCopy: "ملفك محفوظ، لكن المرضى لن يروه حتى توافق عليه الإدارة.",
    verified: "موثق",
    unverified: "غير موثق",
    confirmEmailTitle: "أكد بريدك الإلكتروني",
    confirmEmailCopy: "أرسلنا رابط تأكيد إلى {email}. أكد البريد ثم سجل الدخول لإكمال الإعداد.",
    resetSentTitle: "تم إرسال الرابط",
    resetSentCopy: "تحقق من {email} للحصول على رابط إعادة التعيين.",
    done: "تم",
    onboardingSaved: "تم حفظ الإعداد",
    profileSaved: "تم حفظ الملف",
    availabilitySaved: "تم حفظ الأوقات",
    timeOffSaved: "تم حفظ الغياب",
    appointmentUpdated: "تم تحديث الموعد",
    loggedIn: "تم تسجيل الدخول",
    loggedOut: "تم الخروج",
    addSupabase: "أضف رابط Supabase والمفتاح anon في supabase-config.js",
    clinicSaveFailed: "فشل حفظ العيادة",
    cancelAppointmentTitle: "إلغاء الموعد",
    cancelAppointmentCopy: "اكتب للمريض سبب إلغاء الموعد.",
    keep: "إبقاء",
    cancelAppointment: "إلغاء الموعد",
    addCancellationReason: "أضف سبب الإلغاء",
    workingBlockDeleted: "تم حذف الفترة",
    timeOffDeleted: "تم حذف الغياب",
    days: ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
    statuses: {
      pending: "بانتظار",
      confirmed: "مؤكد",
      cancelled_by_patient: "ألغاه المريض",
      cancelled_by_doctor: "ألغاه الطبيب",
      completed: "مكتمل",
      no_show: "لم يحضر",
      not_checked_in: "لم يصل",
      waiting: "ينتظر",
      checked_in: "وصل",
      in_consultation: "في الفحص",
      checked_out: "خرج",
      approve: "تمت الموافقة",
      cancelled: "ملغى",
    },
  },
};

document.addEventListener("click", handleDocumentClick);
initApp();

async function initApp() {
  applyLanguage();
  renderAuthScreens();

  if (!supabaseClient) {
    navigate("start");
    toast(t("addSupabase"));
    return;
  }

  const { data, error } = await supabaseClient.auth.getSession();
  if (error) {
    toast(error.message);
    navigate("start");
    return;
  }

  appState.user = data.session?.user || null;
  if (appState.user) {
    await loadDoctorWorkspace();
  } else {
    navigate("start");
  }

  supabaseClient.auth.onAuthStateChange(async (_event, session) => {
    appState.user = session?.user || null;
    if (appState.user) {
      await loadDoctorWorkspace();
    } else {
      resetWorkspace();
      renderAuthScreens();
      navigate("start");
    }
  });
}

async function loadDoctorWorkspace() {
  await loadProfileBundle();
  if (!appState.profile || !appState.doctor) {
    renderOnboarding();
    navigate("onboarding");
    return;
  }

  await Promise.all([loadAvailability(), loadAppointments()]);
  renderAppScreens();
  const appScreens = ["dashboard", "appointments", "queue", "availability", "profile"];
  const target = appScreens.includes(currentScreen()) ? currentScreen() : "dashboard";
  navigate(target);
}

async function loadProfileBundle() {
  const { data: profile, error: profileError } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", appState.user.id)
    .maybeSingle();

  if (profileError) {
    toast(profileError.message);
    return;
  }

  appState.profile = profile;

  const { data: doctor, error: doctorError } = await supabaseClient
    .from("doctor_profiles")
    .select("*, clinics(*)")
    .eq("id", appState.user.id)
    .maybeSingle();

  if (doctorError) {
    toast(doctorError.message);
    return;
  }

  appState.doctor = doctor;
  appState.clinic = doctor?.clinics || null;
}

async function loadAvailability() {
  const [workingDaysResult, timeOffResult] = await Promise.all([
    supabaseClient
      .from("doctor_working_days")
      .select("*")
      .eq("doctor_id", appState.user.id)
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true }),
    supabaseClient
      .from("doctor_time_off")
      .select("*")
      .eq("doctor_id", appState.user.id)
      .order("starts_at", { ascending: true }),
  ]);

  if (workingDaysResult.error) toast(workingDaysResult.error.message);
  if (timeOffResult.error) toast(timeOffResult.error.message);

  appState.workingDays = workingDaysResult.data || [];
  appState.timeOff = timeOffResult.data || [];
}

async function loadAppointments() {
  const { data, error } = await supabaseClient
    .from("appointments")
    .select("*, profiles!appointments_patient_id_fkey(full_name, phone, email)")
    .eq("doctor_id", appState.user.id)
    .order("appointment_date", { ascending: true })
    .order("appointment_time", { ascending: true });

  if (error) {
    toast(error.message);
    return;
  }

  appState.appointments = data || [];
}

function renderAuthScreens() {
  renderStart();
  renderSignup();
  renderLogin();
  renderForgot();
  renderConfirm();
}

function renderAppScreens() {
  renderDashboard();
  renderAppointments();
  renderQueue();
  renderAvailability();
  renderProfile();
}

function renderStart() {
  screens.start.innerHTML = `
    <div class="auth-page">
      <section class="start-panel">
        <div class="start-copy">
          <img class="start-logo" src="assets/logo-mark.png" alt="Doctor DZ" />
          <p class="eyebrow">${t("startEyebrow")}</p>
          <h1 id="start-title">${t("startTitle")}</h1>
          <p>${t("startCopy")}</p>
        </div>
        <div class="start-actions">
          <h2>${t("startHeading")}</h2>
          <ul class="feature-list">
            <li>${t("startFeature1")}</li>
            <li>${t("startFeature2")}</li>
            <li>${t("startFeature3")}</li>
          </ul>
          <button class="button" data-nav="signup">${t("createDoctorAccount")}</button>
          <button class="ghost" data-nav="login">${t("login")}</button>
        </div>
      </section>
    </div>
  `;
}

function renderSignup() {
  screens.signup.innerHTML = `
    <div class="auth-page">
      <section class="auth-card">
        <img class="auth-logo" src="assets/logo-mark.png" alt="Doctor DZ" />
        <h1 id="signup-title">${t("signupTitle")}</h1>
        <p class="meta">${t("signupMeta")}</p>
        <form class="auth-form" data-form="signup">
          <div class="field"><label for="signup-name">${t("fullName")}</label><input id="signup-name" name="name" autocomplete="name" required /></div>
          <div class="field"><label for="signup-email">${t("email")}</label><input id="signup-email" name="email" type="email" autocomplete="email" required /></div>
          <div class="field"><label for="signup-phone">${t("phone")}</label><input id="signup-phone" name="phone" autocomplete="tel" required /></div>
          <div class="field"><label for="signup-password">${t("password")}</label><input id="signup-password" name="password" type="password" autocomplete="new-password" required minlength="6" /></div>
          <button class="button" type="submit">${t("createAccount")}</button>
        </form>
        <p class="auth-switch">${t("alreadyRegistered")} <button class="link-button" data-nav="login">${t("logIn")}</button></p>
      </section>
    </div>
  `;

  screens.signup.querySelector("[data-form='signup']").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!requireSupabase()) return;
    const form = new FormData(event.currentTarget);
    const email = clean(form.get("email"));
    const { error } = await supabaseClient.auth.signUp({
      email,
      password: form.get("password"),
      options: {
        emailRedirectTo: window.location.href.split("#")[0],
        data: {
          full_name: clean(form.get("name")),
          phone: clean(form.get("phone")),
          role: "doctor",
        },
      },
    });

    if (error) {
      toast(error.message);
      return;
    }

    showModal(
      t("confirmEmailTitle"),
      `<p>${formatMessage("confirmEmailCopy", { email: escapeHtml(email) })}</p>`,
      [[t("logIn"), "button", () => {
        closeModal();
        navigate("login");
      }]],
    );
  });
}

function renderLogin() {
  screens.login.innerHTML = `
    <div class="auth-page">
      <section class="auth-card">
        <img class="auth-logo" src="assets/logo-mark.png" alt="Doctor DZ" />
        <h1 id="login-title">${t("loginTitle")}</h1>
        <p class="meta">${t("loginMeta")}</p>
        <form class="auth-form" data-form="login">
          <div class="field"><label for="login-email">${t("email")}</label><input id="login-email" name="email" type="email" autocomplete="email" required /></div>
          <div class="field"><label for="login-password">${t("password")}</label><input id="login-password" name="password" type="password" autocomplete="current-password" required /></div>
          <button class="button" type="submit">${t("logIn")}</button>
        </form>
        <button class="link-button" data-nav="forgot">${t("forgotPassword")}</button>
        <p class="auth-switch">${t("needAccount")} <button class="link-button" data-nav="signup">${t("createDoctorAccount")}</button></p>
      </section>
    </div>
  `;

  screens.login.querySelector("[data-form='login']").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!requireSupabase()) return;
    const form = new FormData(event.currentTarget);
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: clean(form.get("email")),
      password: form.get("password"),
    });

    if (error) {
      toast(error.message);
      return;
    }

    appState.user = data.user;
    await loadDoctorWorkspace();
    toast(t("loggedIn"));
  });
}

function renderForgot() {
  screens.forgot.innerHTML = `
    <div class="auth-page">
      <section class="auth-card">
        <img class="auth-logo" src="assets/logo-mark.png" alt="Doctor DZ" />
        <h1 id="forgot-title">${t("forgotTitle")}</h1>
        <p class="meta">${t("forgotMeta")}</p>
        <form class="auth-form" data-form="forgot">
          <div class="field"><label for="forgot-email">${t("email")}</label><input id="forgot-email" name="email" type="email" autocomplete="email" required /></div>
          <button class="button" type="submit">${t("sendResetLink")}</button>
        </form>
        <button class="link-button" data-nav="login">${t("backToLogin")}</button>
      </section>
    </div>
  `;

  screens.forgot.querySelector("[data-form='forgot']").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!requireSupabase()) return;
    const email = clean(new FormData(event.currentTarget).get("email"));
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.href.split("#")[0],
    });

    if (error) {
      toast(error.message);
      return;
    }

    showModal(t("resetSentTitle"), `<p>${formatMessage("resetSentCopy", { email: escapeHtml(email) })}</p>`, [[t("done"), "button", closeModal]]);
  });
}

function renderConfirm() {
  screens.confirm.innerHTML = `
    <div class="auth-page">
      <section class="auth-card">
        <img class="auth-logo" src="assets/logo-mark.png" alt="Doctor DZ" />
        <h1 id="confirm-title">${t("confirmTitle")}</h1>
        <p class="meta">${t("confirmMeta")}</p>
        <button class="button" data-nav="login">${t("logIn")}</button>
      </section>
    </div>
  `;
}

function renderOnboarding() {
  const metadata = appState.user?.user_metadata || {};
  screens.onboarding.innerHTML = `
    <div class="auth-page">
      <section class="auth-card wide-card">
        <div class="row row-start">
          <div>
            <h1 id="onboarding-title">${t("onboardingTitle")}</h1>
            <p class="meta">${t("onboardingMeta")}</p>
          </div>
          <button class="ghost" data-action="logout">${t("logout")}</button>
        </div>
        <form class="profile-form" data-form="onboarding">
          <div class="form-grid">
            <div class="field"><label>${t("fullName")}</label><input name="full_name" value="${escapeAttr(appState.profile?.full_name || metadata.full_name || "")}" required /></div>
            <div class="field"><label>${t("phone")}</label><input name="phone" value="${escapeAttr(appState.profile?.phone || metadata.phone || "")}" required /></div>
            <div class="field"><label>${t("specialty")}</label><input name="specialty" required /></div>
            <div class="field"><label>${t("licenseNumber")}</label><input name="license_number" required /></div>
            <div class="field"><label>${t("consultationPrice")}</label><input name="consultation_price" type="number" min="0" step="100" required /></div>
            <div class="field"><label>${t("clinicName")}</label><input name="clinic_name" required /></div>
            <div class="field"><label>${t("clinicPhone")}</label><input name="clinic_phone" /></div>
            <div class="field"><label>${t("clinicEmail")}</label><input name="clinic_email" type="email" /></div>
            <div class="field"><label>${t("city")}</label><input name="city" required /></div>
            <div class="field"><label>${t("wilaya")}</label><input name="wilaya" required /></div>
            <div class="field span-2"><label>${t("address")}</label><input name="address" required /></div>
            <div class="field span-2"><label>${t("bio")}</label><textarea name="bio" required></textarea></div>
          </div>
          <button class="button" type="submit">${t("saveDoctorProfile")}</button>
        </form>
      </section>
    </div>
  `;

  screens.onboarding.querySelector("[data-form='onboarding']").addEventListener("submit", saveOnboarding);
}

async function saveOnboarding(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const profilePayload = {
    id: appState.user.id,
    role: "doctor",
    full_name: clean(form.get("full_name")),
    email: appState.user.email || "",
    phone: clean(form.get("phone")),
    updated_at: new Date().toISOString(),
  };
  const { error: profileError } = await supabaseClient.from("profiles").upsert(profilePayload);
  if (profileError) {
    toast(profileError.message);
    return;
  }

  const clinicPayload = clinicFromForm(form);
  const { data: clinic, error: clinicError } = await supabaseClient.from("clinics").insert(clinicPayload).select().single();
  if (clinicError) {
    toast(`${t("clinicSaveFailed")}: ${clinicError.message}`);
    return;
  }

  const { error: doctorError } = await supabaseClient.from("doctor_profiles").upsert({
    id: appState.user.id,
    clinic_id: clinic.id,
    specialty: clean(form.get("specialty")),
    bio: clean(form.get("bio")),
    license_number: clean(form.get("license_number")),
    consultation_price: Number(form.get("consultation_price")) || null,
    accepts_new_patients: true,
    approval_required: true,
    is_verified: false,
    updated_at: new Date().toISOString(),
  });
  if (doctorError) {
    toast(doctorError.message);
    return;
  }

  await loadDoctorWorkspace();
  toast(t("onboardingSaved"));
}

function renderDashboard() {
  const stats = getStats();
  screens.dashboard.innerHTML = `
    ${pageHead("dashboard-title", t("dashboard"), t("todayAtGlance"), logoutButton())}
    ${verificationNotice()}
    <section class="stats-grid">
      ${statCard(t("today"), stats.today)}
      ${statCard(t("pending"), stats.pending)}
      ${statCard(t("upcoming"), stats.upcoming)}
      ${statCard(t("completed"), stats.completed)}
      ${statCard(t("cancelled"), stats.cancelled)}
    </section>
    <section class="dashboard-grid">
      <div class="panel stack">
        <div class="row"><h2>${t("todayAppointments")}</h2><button class="ghost" data-nav="appointments">${t("viewAll")}</button></div>
        ${appointmentList(filterAppointments("today").slice(0, 6), true)}
      </div>
      <div class="stack">
        <div class="panel stack">
          <div class="row"><h2>${t("pendingRequests")}</h2><span class="badge pending">${stats.pending}</span></div>
          ${appointmentList(filterAppointments("pending").slice(0, 4), true)}
        </div>
        <div class="panel stack">
          <div class="row"><h2>${t("queueOverview")}</h2><button class="ghost" data-nav="queue">${t("openQueue")}</button></div>
          ${queueCards(filterQueueAppointments().slice(0, 3))}
        </div>
      </div>
    </section>
  `;
}

function renderAppointments() {
  const appointments = filterAppointments(appState.appointmentFilter);
  screens.appointments.innerHTML = `
    ${pageHead("appointments-title", t("appointments"), t("appointmentsSubtitle"), logoutButton())}
    <div class="tabs">
      ${appointmentFilters.map((filter) => `<button class="pill-tab ${appState.appointmentFilter === filter ? "active" : ""}" data-filter="${filter}">${translateFilter(filter)}</button>`).join("")}
    </div>
    <section class="appointment-grid">${appointmentList(appointments, false)}</section>
  `;
}

function renderQueue() {
  const queueAppointments = filterQueueAppointments();
  screens.queue.innerHTML = `
    ${pageHead("queue-title", t("queue"), t("queueSubtitle"), logoutButton())}
    <section class="queue-grid">${queueCards(queueAppointments)}</section>
  `;
}

function renderAvailability() {
  screens.availability.innerHTML = `
    ${pageHead("availability-title", t("availability"), t("availabilitySubtitle"), logoutButton())}
    <section class="two-grid">
      <div class="panel stack">
        <h2>${t("weeklyWorkingDays")}</h2>
        <form class="availability-form" data-form="working-day">
          <div class="form-grid">
            <div class="field"><label>${t("day")}</label><select name="day_of_week">${dayNames().map((day, index) => `<option value="${index}">${day}</option>`).join("")}</select></div>
            <div class="field"><label>${t("slotDuration")}</label><input name="slot_minutes" type="number" min="5" max="240" value="30" required /></div>
            <div class="field"><label>${t("startTime")}</label><input name="start_time" type="time" value="09:00" required /></div>
            <div class="field"><label>${t("endTime")}</label><input name="end_time" type="time" value="17:00" required /></div>
            <label class="check-field span-2"><input name="is_active" type="checkbox" checked /> ${t("activeForBooking")}</label>
          </div>
          <input name="id" type="hidden" />
          <button class="button" type="submit">${t("saveWorkingBlock")}</button>
        </form>
        <div class="stack">${workingDayCards()}</div>
      </div>
      <div class="panel stack">
        <h2>${t("timeOff")}</h2>
        <form class="availability-form" data-form="time-off">
          <div class="field"><label>${t("startsAt")}</label><input name="starts_at" type="datetime-local" required /></div>
          <div class="field"><label>${t("endsAt")}</label><input name="ends_at" type="datetime-local" required /></div>
          <div class="field"><label>${t("reason")}</label><input name="reason" /></div>
          <input name="id" type="hidden" />
          <button class="button" type="submit">${t("saveTimeOff")}</button>
        </form>
        <div class="stack">${timeOffCards()}</div>
      </div>
    </section>
  `;

  screens.availability.querySelector("[data-form='working-day']").addEventListener("submit", saveWorkingDay);
  screens.availability.querySelector("[data-form='time-off']").addEventListener("submit", saveTimeOff);
}

function renderProfile() {
  screens.profile.innerHTML = `
    ${pageHead("profile-title", t("profileTitle"), t("profileSubtitle"), logoutButton())}
    ${verificationNotice()}
    <section class="panel">
      <form class="profile-form" data-form="profile">
        <div class="form-grid">
          <div class="field span-2">
            <label>${t("language")}</label>
            <div class="actions language-actions">${languageButtons()}</div>
          </div>
          <div class="field"><label>${t("fullName")}</label><input name="full_name" value="${escapeAttr(appState.profile?.full_name)}" required /></div>
          <div class="field"><label>${t("phone")}</label><input name="phone" value="${escapeAttr(appState.profile?.phone)}" /></div>
          <div class="field"><label>${t("specialty")}</label><input name="specialty" value="${escapeAttr(appState.doctor?.specialty)}" required /></div>
          <div class="field"><label>${t("licenseNumber")}</label><input name="license_number" value="${escapeAttr(appState.doctor?.license_number)}" required /></div>
          <div class="field"><label>${t("consultationPrice")}</label><input name="consultation_price" type="number" min="0" step="100" value="${escapeAttr(appState.doctor?.consultation_price)}" /></div>
          <label class="check-field"><input name="accepts_new_patients" type="checkbox" ${appState.doctor?.accepts_new_patients ? "checked" : ""} /> ${t("acceptsNewPatients")}</label>
          <div class="field span-2"><label>${t("bio")}</label><textarea name="bio">${escapeHtml(appState.doctor?.bio)}</textarea></div>
          <div class="field"><label>${t("clinicName")}</label><input name="clinic_name" value="${escapeAttr(appState.clinic?.name)}" required /></div>
          <div class="field"><label>${t("clinicPhone")}</label><input name="clinic_phone" value="${escapeAttr(appState.clinic?.phone)}" /></div>
          <div class="field"><label>${t("clinicEmail")}</label><input name="clinic_email" type="email" value="${escapeAttr(appState.clinic?.email)}" /></div>
          <div class="field"><label>${t("city")}</label><input name="city" value="${escapeAttr(appState.clinic?.city)}" required /></div>
          <div class="field"><label>${t("wilaya")}</label><input name="wilaya" value="${escapeAttr(appState.clinic?.wilaya)}" required /></div>
          <div class="field"><label>${t("latitude")}</label><input name="latitude" type="number" step="0.0000001" value="${escapeAttr(appState.clinic?.latitude)}" /></div>
          <div class="field"><label>${t("longitude")}</label><input name="longitude" type="number" step="0.0000001" value="${escapeAttr(appState.clinic?.longitude)}" /></div>
          <div class="field span-2"><label>${t("address")}</label><input name="address" value="${escapeAttr(appState.clinic?.address)}" required /></div>
        </div>
        <button class="button" type="submit">${t("saveChanges")}</button>
      </form>
    </section>
  `;

  screens.profile.querySelector("[data-form='profile']").addEventListener("submit", saveProfile);
}

function appointmentList(appointments, compact) {
  if (!appointments.length) return `<div class="empty">${compact ? t("nothingHere") : t("noAppointments")}</div>`;
  return appointments
    .map(
      (appointment) => `
        <article class="appointment-card">
          <div class="row row-start">
            <div>
              <h3>${appointmentTitle(appointment)}</h3>
              <p class="meta">${formatDate(appointment.appointment_date)} ${t("at")} ${formatTime(appointment.appointment_time)} · ${appointment.duration_minutes || 30} ${t("min")}</p>
              ${appointment.reason ? `<p class="meta">${t("appointmentReason")}: ${escapeHtml(appointment.reason)}</p>` : ""}
              ${appointment.cancel_reason ? `<p class="meta">${t("cancelReason")}: ${escapeHtml(appointment.cancel_reason)}</p>` : ""}
            </div>
            <span class="badge ${statusClass(appointment)}">${statusLabel(appointment)}</span>
          </div>
          ${compact ? "" : appointmentActions(appointment)}
        </article>
      `,
    )
    .join("");
}

function appointmentActions(appointment) {
  const actions = [];
  if (appointment.status === "pending") actions.push(`<button class="button" data-appointment="${appointment.id}" data-action="approve">${t("approve")}</button>`);
  if (!["completed", "cancelled_by_doctor", "cancelled_by_patient", "no_show"].includes(appointment.status)) {
    actions.push(`<button class="ghost" data-appointment="${appointment.id}" data-action="checked_in">${t("checkedInAction")}</button>`);
    actions.push(`<button class="ghost" data-appointment="${appointment.id}" data-action="in_consultation">${t("inConsultationAction")}</button>`);
    actions.push(`<button class="ghost" data-appointment="${appointment.id}" data-action="checked_out">${t("checkedOutAction")}</button>`);
    actions.push(`<button class="button" data-appointment="${appointment.id}" data-action="complete">${t("complete")}</button>`);
    actions.push(`<button class="danger" data-appointment="${appointment.id}" data-action="no_show">${t("noShowAction")}</button>`);
    actions.push(`<button class="danger" data-appointment="${appointment.id}" data-action="cancel">${t("cancel")}</button>`);
  }
  return `<div class="actions">${actions.join("")}</div>`;
}

function queueCards(appointments) {
  if (!appointments.length) return `<div class="empty">${t("noQueue")}</div>`;
  return appointments
    .map((appointment) => {
      const currentIndex = queueFlow.indexOf(appointment.queue_status);
      const nextStatus = queueFlow[Math.min(currentIndex + 1, queueFlow.length - 1)] || "checked_in";
      return `
        <article class="queue-card stack">
          <div class="row row-start">
            <div>
              <h3>${appointmentTitle(appointment)}</h3>
              <p class="meta">${formatTime(appointment.appointment_time)} · ${t("position")} ${appointment.queue_position || "-"}</p>
            </div>
            <span class="badge ${appointment.queue_status}">${queueLabel(appointment.queue_status)}</span>
          </div>
          <div class="actions">
            ${queueFlow.map((status) => `<button class="${status === appointment.queue_status ? "button" : "ghost"}" data-appointment="${appointment.id}" data-action="${status}">${queueLabel(status)}</button>`).join("")}
            <button class="button" data-appointment="${appointment.id}" data-action="${nextStatus}" ${nextStatus === appointment.queue_status ? "disabled" : ""}>${t("next")}</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function workingDayCards() {
  if (!appState.workingDays.length) return `<div class="empty">${t("noAvailability")}</div>`;
  return appState.workingDays
    .map(
      (day) => `
        <article class="day-card">
          <div class="row row-start">
            <div>
              <strong>${dayNames()[day.day_of_week]}</strong>
              <p class="meta">${formatTime(day.start_time)}-${formatTime(day.end_time)} · ${day.slot_minutes} ${t("min")}</p>
            </div>
            <span class="badge ${day.is_active ? "verified" : "cancelled"}">${day.is_active ? t("active") : t("inactive")}</span>
          </div>
          <div class="actions">
            <button class="ghost" data-action="edit-working-day" data-id="${day.id}">${t("edit")}</button>
            <button class="danger" data-action="delete-working-day" data-id="${day.id}">${t("delete")}</button>
          </div>
        </article>
      `,
    )
    .join("");
}

function timeOffCards() {
  if (!appState.timeOff.length) return `<div class="empty">${t("noTimeOff")}</div>`;
  return appState.timeOff
    .map(
      (item) => `
        <article class="timeoff-card">
          <div class="row row-start">
            <div>
              <strong>${formatDateTime(item.starts_at)}</strong>
              <p class="meta">${t("until")} ${formatDateTime(item.ends_at)}${item.reason ? ` · ${escapeHtml(item.reason)}` : ""}</p>
            </div>
            <button class="danger" data-action="delete-time-off" data-id="${item.id}">${t("delete")}</button>
          </div>
        </article>
      `,
    )
    .join("");
}

async function saveProfile(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const profilePayload = {
    full_name: clean(form.get("full_name")),
    phone: clean(form.get("phone")),
    updated_at: new Date().toISOString(),
  };
  const doctorPayload = {
    specialty: clean(form.get("specialty")),
    bio: clean(form.get("bio")),
    license_number: clean(form.get("license_number")),
    consultation_price: Number(form.get("consultation_price")) || null,
    accepts_new_patients: form.get("accepts_new_patients") === "on",
    updated_at: new Date().toISOString(),
  };

  const clinicPayload = clinicFromForm(form);
  const [profileResult, doctorResult, clinicResult] = await Promise.all([
    supabaseClient.from("profiles").update(profilePayload).eq("id", appState.user.id),
    supabaseClient.from("doctor_profiles").update(doctorPayload).eq("id", appState.user.id),
    supabaseClient.from("clinics").update(clinicPayload).eq("id", appState.clinic.id),
  ]);

  const error = profileResult.error || doctorResult.error || clinicResult.error;
  if (error) {
    toast(error.message);
    return;
  }

  await loadDoctorWorkspace();
  toast(t("profileSaved"));
}

async function saveWorkingDay(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const payload = {
    doctor_id: appState.user.id,
    day_of_week: Number(form.get("day_of_week")),
    start_time: form.get("start_time"),
    end_time: form.get("end_time"),
    slot_minutes: Number(form.get("slot_minutes")) || 30,
    is_active: form.get("is_active") === "on",
  };
  const id = form.get("id");
  const request = id
    ? supabaseClient.from("doctor_working_days").update(payload).eq("id", id)
    : supabaseClient.from("doctor_working_days").insert(payload);
  const { error } = await request;
  if (error) {
    toast(error.message);
    return;
  }
  await loadDoctorWorkspace();
  toast(t("availabilitySaved"));
}

async function saveTimeOff(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const payload = {
    doctor_id: appState.user.id,
    starts_at: new Date(form.get("starts_at")).toISOString(),
    ends_at: new Date(form.get("ends_at")).toISOString(),
    reason: clean(form.get("reason")),
  };
  const { error } = await supabaseClient.from("doctor_time_off").insert(payload);
  if (error) {
    toast(error.message);
    return;
  }
  await loadDoctorWorkspace();
  toast(t("timeOffSaved"));
}

async function handleAppointmentAction(appointmentId, action) {
  const appointment = appState.appointments.find((item) => item.id === appointmentId);
  if (!appointment) return;

  if (action === "cancel") {
    showCancelModal(appointment);
    return;
  }

  const payload = {};
  if (action === "approve") {
    payload.status = "confirmed";
    payload.approved_at = new Date().toISOString();
  } else if (action === "complete") {
    payload.status = "completed";
    payload.queue_status = "checked_out";
    payload.checked_out_at = new Date().toISOString();
  } else if (action === "no_show") {
    payload.status = "no_show";
  } else if (queueFlow.includes(action)) {
    payload.queue_status = action;
    payload.checked_in = action !== "waiting";
    if (action === "checked_in") payload.checked_in_at = new Date().toISOString();
    if (action === "checked_out") payload.checked_out_at = new Date().toISOString();
  }

  await updateAppointment(appointment, payload, action);
}

async function updateAppointment(appointment, payload, action) {
  const { error } = await supabaseClient
    .from("appointments")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", appointment.id)
    .eq("doctor_id", appState.user.id);

  if (error) {
    toast(error.message);
    return;
  }

  const queueStatus = payload.queue_status || appointment.queue_status;
  if (queueStatus && (queueFlow.includes(queueStatus) || action === "complete")) {
    await insertQueueEvent(appointment.id, queueStatus, action);
  }

  await loadDoctorWorkspace();
  toast(t("appointmentUpdated"));
}

async function insertQueueEvent(appointmentId, queueStatus, note) {
  const { error } = await supabaseClient.from("queue_events").insert({
    appointment_id: appointmentId,
    changed_by: appState.user.id,
    queue_status: queueStatus,
    note: translateStatus(note),
  });
  if (error) toast(error.message);
}

function showCancelModal(appointment) {
  showModal(
    t("cancelAppointmentTitle"),
    `<form class="auth-form" data-form="cancel">
      <p>${t("cancelAppointmentCopy")}</p>
      <div class="field"><label>${t("reason")}</label><textarea name="cancel_reason" required></textarea></div>
    </form>`,
    [
      [t("keep"), "ghost", closeModal],
      [t("cancelAppointment"), "danger", async () => {
        const reason = clean(modalBody.querySelector("textarea").value);
        if (!reason) {
          toast(t("addCancellationReason"));
          return;
        }
        closeModal();
        await updateAppointment(appointment, {
          status: "cancelled_by_doctor",
          cancel_reason: reason,
        }, "cancelled");
      }],
    ],
  );
}

async function handleDelete(table, id, successMessage) {
  const { error } = await supabaseClient.from(table).delete().eq("id", id).eq("doctor_id", appState.user.id);
  if (error) {
    toast(error.message);
    return;
  }
  await loadDoctorWorkspace();
  toast(successMessage);
}

function handleDocumentClick(event) {
  const navButton = event.target.closest("[data-nav]");
  if (navButton) {
    navigate(navButton.dataset.nav);
    return;
  }

  const targetButton = event.target.closest("[data-target]");
  if (targetButton) {
    navigate(targetButton.dataset.target);
    return;
  }

  const filterButton = event.target.closest("[data-filter]");
  if (filterButton) {
    appState.appointmentFilter = filterButton.dataset.filter;
    renderAppointments();
    return;
  }

  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) return;

  const action = actionButton.dataset.action;
  if (action === "set-language") {
    setLanguage(actionButton.dataset.language);
    return;
  }

  if (action === "logout") {
    logout();
    return;
  }

  if (actionButton.dataset.appointment) {
    handleAppointmentAction(actionButton.dataset.appointment, action);
    return;
  }

  if (action === "delete-working-day") {
    handleDelete("doctor_working_days", actionButton.dataset.id, t("workingBlockDeleted"));
    return;
  }

  if (action === "delete-time-off") {
    handleDelete("doctor_time_off", actionButton.dataset.id, t("timeOffDeleted"));
    return;
  }

  if (action === "edit-working-day") {
    const day = appState.workingDays.find((item) => item.id === actionButton.dataset.id);
    const form = screens.availability.querySelector("[data-form='working-day']");
    if (!day || !form) return;
    form.id.value = day.id;
    form.day_of_week.value = day.day_of_week;
    form.start_time.value = formatTime(day.start_time);
    form.end_time.value = formatTime(day.end_time);
    form.slot_minutes.value = day.slot_minutes;
    form.is_active.checked = day.is_active;
  }
}

async function logout() {
  if (supabaseClient) await supabaseClient.auth.signOut();
  resetWorkspace();
  renderAuthScreens();
  navigate("start");
  toast(t("loggedOut"));
}

function navigate(screenName) {
  const authScreen = ["start", "signup", "login", "forgot", "confirm"].includes(screenName);
  const onboarding = screenName === "onboarding";
  Object.entries(screens).forEach(([name, element]) => {
    element.classList.toggle("active", name === screenName);
  });
  document.querySelectorAll(".nav, .bottom-nav, .sidebar-logout").forEach((element) => {
    element.classList.toggle("hidden", authScreen || onboarding);
  });
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.classList.toggle("active", button.dataset.target === screenName);
  });
  screens[screenName]?.scrollTo({ top: 0 });
}

function currentScreen() {
  return document.querySelector(".screen.active")?.dataset.screen || "dashboard";
}

function resetWorkspace() {
  appState.user = null;
  appState.profile = null;
  appState.doctor = null;
  appState.clinic = null;
  appState.workingDays = [];
  appState.timeOff = [];
  appState.appointments = [];
}

function filterAppointments(filter) {
  const today = todayIso();
  return appState.appointments.filter((appointment) => {
    if (filter === "all") return true;
    if (filter === "today") return appointment.appointment_date === today;
    if (filter === "pending") return appointment.status === "pending";
    if (filter === "upcoming") return appointment.appointment_date >= today && ["pending", "confirmed"].includes(appointment.status);
    if (filter === "completed") return appointment.status === "completed";
    if (filter === "cancelled") return ["cancelled_by_patient", "cancelled_by_doctor", "no_show"].includes(appointment.status);
    return true;
  });
}

function filterQueueAppointments() {
  return appState.appointments.filter(
    (appointment) =>
      appointment.appointment_date === todayIso() &&
      ["confirmed", "completed"].includes(appointment.status) &&
      queueFlow.includes(appointment.queue_status) &&
      appointment.queue_status !== "checked_out",
  );
}

function getStats() {
  return {
    today: filterAppointments("today").length,
    pending: filterAppointments("pending").length,
    upcoming: filterAppointments("upcoming").length,
    completed: filterAppointments("completed").length,
    cancelled: filterAppointments("cancelled").length,
  };
}

function clinicFromForm(form) {
  return {
    name: clean(form.get("clinic_name")),
    phone: clean(form.get("clinic_phone")),
    email: clean(form.get("clinic_email")),
    address: clean(form.get("address")),
    city: clean(form.get("city")),
    wilaya: clean(form.get("wilaya")),
    latitude: form.get("latitude") ? Number(form.get("latitude")) : null,
    longitude: form.get("longitude") ? Number(form.get("longitude")) : null,
    updated_at: new Date().toISOString(),
  };
}

function pageHead(id, title, subtitle, actions = "") {
  return `<header class="page-head"><div><h1 id="${id}">${title}</h1><p>${subtitle}</p></div><div class="actions">${actions}</div></header>`;
}

function logoutButton() {
  return `<button class="ghost" data-action="logout">${t("logout")}</button>`;
}

function verificationNotice() {
  if (!appState.doctor) return "";
  const verified = appState.doctor.is_verified;
  return `
    <div class="${verified ? "panel" : "notice"} row">
      <div>
        <strong>${verified ? t("verifiedTitle") : t("unverifiedTitle")}</strong>
        <p class="meta">${verified ? t("verifiedCopy") : t("unverifiedCopy")}</p>
      </div>
      <span class="badge ${verified ? "verified" : "unverified"}">${verified ? t("verified") : t("unverified")}</span>
    </div>
  `;
}

function statCard(labelText, value) {
  return `<article class="stat-card"><span class="meta">${labelText}</span><strong>${value}</strong></article>`;
}

function appointmentTitle(appointment) {
  return appointment.profiles?.full_name || `${t("patient")} ${String(appointment.patient_id || "").slice(0, 8) || "unknown"}`;
}

function statusLabel(appointment) {
  if (["cancelled_by_patient", "cancelled_by_doctor"].includes(appointment.status)) return translateStatus(appointment.status);
  if (appointment.status === "confirmed" && appointment.queue_status !== "not_checked_in") return queueLabel(appointment.queue_status);
  return translateStatus(appointment.status);
}

function statusClass(appointment) {
  if (appointment.status.startsWith("cancelled")) return "cancelled";
  if (appointment.status === "confirmed" && appointment.queue_status !== "not_checked_in") return appointment.queue_status;
  return appointment.status;
}

function queueLabel(status) {
  return translateStatus(status || "not_checked_in");
}

function currentTranslations() {
  return languages[appState.language] || languages.fr;
}

function t(key) {
  return currentTranslations()[key] ?? languages.fr[key] ?? key;
}

function formatMessage(key, values) {
  return t(key).replace(/\{(\w+)\}/g, (_match, name) => values[name] ?? "");
}

function translateStatus(value) {
  return currentTranslations().statuses?.[value] || languages.fr.statuses?.[value] || label(value);
}

function translateFilter(filter) {
  return t(filter);
}

function dayNames() {
  return currentTranslations().days || languages.fr.days;
}

function languageButtons() {
  return [
    ["fr", t("french")],
    ["ar", t("arabic")],
    ["en", t("english")],
  ]
    .map(([value, labelText]) => `<button type="button" class="${appState.language === value ? "button" : "ghost"}" data-action="set-language" data-language="${value}">${labelText}</button>`)
    .join("");
}

function setLanguage(language) {
  appState.language = languages[language] ? language : "fr";
  localStorage.setItem("doctordz-language", appState.language);
  applyLanguage();
  renderAuthScreens();
  if (appState.doctor) renderAppScreens();
  if (currentScreen() === "onboarding") renderOnboarding();
  navigate(currentScreen());
}

function applyLanguage() {
  const translations = currentTranslations();
  document.documentElement.lang = appState.language;
  document.documentElement.dir = translations.dir;
  document.body.classList.toggle("rtl", translations.dir === "rtl");
  updateStaticLabels();
}

function updateStaticLabels() {
  const labels = {
    dashboard: [t("navDashboard"), t("mobileHome")],
    appointments: [t("navAppointments"), t("mobileAppts")],
    queue: [t("navQueue"), t("mobileQueue")],
    availability: [t("navAvailability"), t("mobileHours")],
    profile: [t("navProfile"), t("mobileProfile")],
  };
  document.querySelector(".brand strong").textContent = "Doctor DZ";
  document.querySelector(".brand span").textContent = appState.language === "ar" ? "مساحة الطبيب" : appState.language === "en" ? "Clinical workspace" : "Espace clinique";
  document.querySelector(".sidebar-logout").textContent = t("logout");
  document.querySelectorAll(".nav .nav-item").forEach((button) => {
    const span = button.querySelector("span");
    if (span) span.textContent = labels[button.dataset.target]?.[0] || span.textContent;
  });
  document.querySelectorAll(".bottom-nav .nav-item").forEach((button) => {
    const span = button.querySelector("span");
    if (span) span.textContent = labels[button.dataset.target]?.[1] || span.textContent;
  });
}

function label(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function clean(value) {
  return String(value || "").trim();
}

function formatDate(value) {
  return new Intl.DateTimeFormat(currentTranslations().locale, { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${value}T12:00:00`));
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat(currentTranslations().locale, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function formatTime(value) {
  return String(value || "").slice(0, 5);
}

function requireSupabase() {
  if (supabaseClient) return true;
  toast(t("addSupabase"));
  return false;
}

function showModal(title, body, actions) {
  modalTitle.textContent = title;
  modalBody.innerHTML = body;
  modalActions.innerHTML = "";
  actions.forEach(([text, className, handler]) => {
    const button = document.createElement("button");
    button.className = className;
    button.type = "button";
    button.textContent = text;
    button.addEventListener("click", handler);
    modalActions.append(button);
  });
  modalBackdrop.hidden = false;
}

function closeModal() {
  modalBackdrop.hidden = true;
}

function toast(message) {
  const region = document.getElementById("toast-region");
  const element = document.createElement("div");
  element.className = "toast";
  element.textContent = message;
  region.append(element);
  setTimeout(() => element.remove(), 4200);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value ?? "");
}
