// constants/translations.js
// All UI text in Kinyarwanda (primary) + English (secondary)
// Usage: import T from '../constants/translations'
//        then use T.login, T.appName etc.

const T = {

  // ── App identity ──────────────────────────────
  appName:      'Famille',
  appTagline:   'Umuryango w\'u Rwanda',
  appSubtitle:  'Witegure, ukurikire, ukunde umuryango wawe.\nTrack, prepare and care for your family.',

  // ── Auth ──────────────────────────────────────
  login:          'Injira',
  signup:         'Iyandikishe',
  logout:         'Sohoka',
  getStarted:     'Tangira',
  alreadyAccount: 'Usanzwe ufite konti? Injira',
  noAccount:      'Nta konti? Iyandikishe',
  verify:         'Emeza',
  resendOtp:      'Ohereza kode nshya',
  otpHint:        'Twahaye kode y\'imibare 6 kuri imeyili yawe.',

  // ── Navigation tabs ───────────────────────────
  home:       'Accueil',
  children:   'Abana',
  pregnancy:  'Inda',
  meals:      'Ifunguro',
  budget:     'Amafaranga',

  // ── Dashboard ─────────────────────────────────
  goodMorning:   'Mwaramutse',
  goodAfternoon: 'Mwiriwe',
  goodEvening:   'Muraho',
  welcome:       'Murakaza neze',
  refresh:       'Vugurura',

  // ── Children ──────────────────────────────────
  addChild:       'Ongeramo Umwana',
  childName:      'Izina ry\'umwana',
  dateOfBirth:    'Itariki y\'amavuko',
  gender:         'Igitsina',
  male:           'Umuhungu',
  female:         'Umukobwa',
  weight:         'Ibiro (kg)',
  ageMonths:      'Amezi',
  ageYears:       'Imyaka',
  noChildren:     'Nta mwana. Ongeramo umwana wawe wa mbere.',

  // ── Vaccinations ──────────────────────────────
  vaccinations:   'Inkingo',
  upcoming:       'Izitegerezwa',
  completed:      'Zarakoze',
  markDone:       'Koze ✓',
  scheduledDate:  'Itariki',
  allVacsDone:    'Inkingo zose zarakoze!',

  // ── Sleep ─────────────────────────────────────
  sleep:          'Itiro',
  sleepTime:      'Igihe cyo kuryama',
  wakeTime:       'Igihe cyo gukanguka',
  totalSleep:     'Amasaha yose',
  recommended:    'Yifuzwa',
  logSleep:       'Injiza Itiro',

  // ── Medications ───────────────────────────────
  medications:    'Imiti',
  medicationName: 'Izina ry\'umuti',
  dosage:         'Ingano',
  frequency:      'Inshuro',
  startDate:      'Itariki itangira',
  endDate:        'Itariki irangira',
  addMedication:  'Ongeramo Umuti',
  noMedications:  'Nta miti. Ongeramo umuti.',
  ongoing:        'Ntirengwa',

  // ── Pregnancy ─────────────────────────────────
  pregnancyTitle: 'Inda',
  dueDate:        'Itariki y\'inzaruro',
  currentWeek:    'Icyumweru',
  weeksLeft:      'Ibyumweru bisigaye',
  daysLeft:       'Iminsi isigaye',
  trimester1:     'Igice cya 1',
  trimester2:     'Igice cya 2',
  trimester3:     'Igice cya 3',
  addPregnancy:   'Ongeramo Inda',
  noPregnancy:    'Nta makuru y\'inda. Ongeramo.',

  // ── Meals ─────────────────────────────────────
  mealsTitle:     'Ifunguro',
  breakfast:      'Ifunguro rya mu gitondo',
  lunch:          'Isaha sita',
  dinner:         'Ijoro',
  snacks:         'Ibindi',
  mealNotes:      'Ibisobanuro',
  logMeal:        'Injiza Ifunguro',
  suggestions:    'Inama z\'Ifunguro',
  noMeals:        'Nta makuru y\'ifunguro uyu munsi.',
  last7Days:      'Amatariki 7 Ashize',

  // ── Budget ────────────────────────────────────
  budgetTitle:    'Amafaranga',
  income:         'Winjiye',
  expense:        'Wasohotse',
  balance:        'Usigaranye',
  addEntry:       'Injiza Amafaranga',
  category:       'Icyiciro',
  amount:         'Amafaranga',
  description:    'Ibisobanuro',
  noEntries:      'Nta makuru uyu kwezi.',

  // ── Reminders ─────────────────────────────────
  reminders:      'Ibutsa',
  scheduleReminder: 'Shyira Ibutsa',
  reminderMessage:  'Ubutumwa',
  reminderDate:     'Itariki',
  reminderTime:     'Isaha',
  reminderSaved:    'Ibutsa ryashyizwe! 🔔',

  // ── Common actions ────────────────────────────
  save:     'Bika',
  cancel:   'Reka',
  delete:   'Siba',
  edit:     'Hindura',
  add:      'Ongeramo',
  close:    'Funga',
  confirm:  'Emeza',
  back:     'Subira',
  next:     'Komeza',
  done:     'Birangiye',
  loading:  'Gutegereza...',
  retry:    'Ongera ugerageze',
  seeAll:   'Reba bose',

  // ── Errors ────────────────────────────────────
  errorEmail:    'Injiza imeyili nyayo.',
  errorPassword: 'Ijambo banga rigomba kuba nibura inyuguti 6.',
  errorRequired: 'Iki gice gikenewe.',
  errorServer:   'Ikosa rya seriveri. Ongera ugerageze.',
  errorNetwork:  'Reba interineti yawe.',
  errorCaptcha:  'CAPTCHA ntabwo ari yo. Ongera ugerageze.',

  // ── Success messages ──────────────────────────
  successSaved:    'Byabitswe neza! ✓',
  successDeleted:  'Yasibwe neza.',
  successVerified: 'Konti yemejwe! Murakaza neze.',
  successLogin:    'Wainjiye neza.',

  // ── CAPTCHA ───────────────────────────────────
  captchaHint: 'Injiza inyuguti ubona hejuru',
  captchaLabel: 'Emeza ko uri muntu',

  // ── Confirmation dialogs ──────────────────────
  confirmDelete:    'Urashaka gusiba?',
  confirmDeleteSub: 'Ibi ntibishobora gusubirwaho.',
  yes:   'Yego',
  no:    'Oya',
};

export default T;