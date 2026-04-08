/**
 * Скрипт для создания 150 тестовых пользователей с украинскими городами
 * Запуск: node scripts/seedUkrainianUsers.js
 */

const mongoose = require('mongoose');
const User = require('../models/userModel');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/users';

const wp = (n) => ({ url: `https://randomuser.me/api/portraits/women/${n}.jpg`, key: null, status: 'approved', format: 'jpg' });
const mp = (n) => ({ url: `https://randomuser.me/api/portraits/men/${n}.jpg`,   key: null, status: 'approved', format: 'jpg' });

const FEMALE_NAMES = [
  'Анастасия', 'Виктория', 'Екатерина', 'Наталья', 'Татьяна',
  'Ирина', 'Елена', 'Оксана', 'Людмила', 'Светлана',
  'Юлия', 'Наталія', 'Аліна', 'Поліна', 'Дар\'я',
  'Марина', 'Валентина', 'Галина', 'Лариса', 'Тетяна',
  'Ксенія', 'Вікторія', 'Софія', 'Христина', 'Ярослава',
  'Олена', 'Діана', 'Карина', 'Руслана', 'Мирослава',
];

const MALE_NAMES = [
  'Олексій', 'Дмитро', 'Максим', 'Андрій', 'Олег',
  'Микола', 'Василь', 'Ігор', 'Юрій', 'Сергій',
  'Владислав', 'Тарас', 'Богдан', 'Роман', 'Артем',
  'Олександр', 'Михайло', 'Іван', 'Петро', 'Степан',
  'Євген', 'Павло', 'Антон', 'Руслан', 'Віталій',
  'Денис', 'Кирило', 'Назар', 'Остап', 'Ярослав',
];

const FEMALE_LAST_NAMES = [
  'Коваленко', 'Шевченко', 'Бондаренко', 'Ткаченко', 'Кравченко',
  'Савченко', 'Мельник', 'Лисенко', 'Мороз', 'Гриценко',
  'Іваненко', 'Левченко', 'Семенченко', 'Романченко', 'Павленко',
  'Харченко', 'Даниленко', 'Пономаренко', 'Кириленко', 'Яценко',
  'Передерій', 'Захарченко', 'Сидоренко', 'Горобець', 'Литвин',
];

const MALE_LAST_NAMES = [
  'Коваленко', 'Шевченко', 'Бондаренко', 'Ткаченко', 'Кравченко',
  'Савченко', 'Мельник', 'Лисенко', 'Мороз', 'Гриценко',
  'Іваненко', 'Левченко', 'Семенченко', 'Романченко', 'Павленко',
  'Харченко', 'Даниленко', 'Пономаренко', 'Кириленко', 'Яценко',
  'Передерій', 'Захарченко', 'Сидоренко', 'Горобець', 'Литвин',
];

const UA_CITIES = [
  'Київ', 'Харків', 'Одеса', 'Дніпро', 'Запоріжжя',
  'Львів', 'Кривий Ріг', 'Миколаїв', 'Маріуполь', 'Луганськ',
  'Вінниця', 'Макіївка', 'Херсон', 'Полтава', 'Чернігів',
  'Черкаси', 'Суми', 'Житомир', 'Кропивницький', 'Хмельницький',
  'Рівне', 'Івано-Франківськ', 'Ужгород', 'Тернопіль', 'Луцьк',
  'Біла Церква', 'Кременчук', 'Мелітополь', 'Бердянськ', 'Нікополь',
];

const INTERESTS = [
  'Подорожі', 'Кіно', 'Музика', 'Спорт', 'Готування', 'Читання',
  'Фотографія', 'Танці', 'Йога', 'Мистецтво', 'Ігри', 'Природа',
  'Фітнес', 'Кава', 'Тварини', 'Театр', 'Велосипед', 'Плавання',
  'Малювання', 'Волонтерство',
];

const ZODIACS = [
  'Овен', 'Телець', 'Близнюки', 'Рак', 'Лев', 'Діва',
  'Терези', 'Скорпіон', 'Стрілець', 'Козоріг', 'Водолій', 'Риби',
];

const EDUCATION = [
  'Вища', 'Незакінчена вища', 'Середня спеціальна', 'Магістратура', 'Аспірантура',
];

const WORK_FEMALE = [
  'Дизайнер', 'Програміст', 'Маркетолог', 'Лікар', 'Вчитель',
  'Підприємець', 'Менеджер', 'Журналіст', 'Фотограф', 'Архітектор',
  'Психолог', 'Юрист', 'Бухгалтер', 'Стоматолог', 'Фармацевт',
  'Соціальний працівник', 'PR-менеджер', 'SMM-менеджер', 'Перекладач', 'Студент',
];

const WORK_MALE = [
  'Програміст', 'Інженер', 'Архітектор', 'Менеджер', 'Підприємець',
  'Лікар', 'Юрист', 'Фінансист', 'Будівельник', 'Водій',
  'Дизайнер', 'Механік', 'Електрик', 'Маркетолог', 'Тренер',
  'Шеф-кухар', 'Журналіст', 'Фотограф', 'Програміст', 'Студент',
];

const LOOKING_FOR_OPTIONS = [
  { id: 'relationship', title: 'Відносини',      icon: 'IconRosette'       },
  { id: 'friendship',   title: 'Дружба',          icon: 'IconMoodSmile'     },
  { id: 'dating',       title: 'Побачення',       icon: 'IconGlassCocktail' },
  { id: 'marriage',     title: 'Сім\'я',          icon: 'IconHome'          },
];

const ABOUT_FEMALE = [
  'Люблю подорожувати та відкривати нові місця 🌍',
  'Кава, книги та хороші розмови ☕📚',
  'Танцюю, малюю, мрію про подорожі 🎨',
  'Займаюся йогою та правильним харчуванням 🧘‍♀️',
  'Фотограф за покликанням. Знімаю людей та природу 📸',
  'Люблю море, сонце та позитивних людей ☀️🌊',
  'Вчу мови та мандрую Європою ✈️🇪🇺',
  'Обожнюю кіно, театр та хорошу музику 🎭',
  'Займаюся волонтерством та люблю тварин 🐾',
  'Шукаю того, хто не боїться пригод 🎯',
  'Психолог за освітою, оптиміст за натурою 😊',
  'Готую з душею, їм із задоволенням 🍳',
  'Люблю активний відпочинок та природу 🏕️',
  'Читаю, малюю, мрію 📖🎨',
  'Займаюся спортом та веду здоровий спосіб життя 💪',
];

const ABOUT_MALE = [
  'IT-підприємець. Люблю гори та хороше кіно 🏔️🎬',
  'Інженер. У вільний час займаюся велоспортом 🚴',
  'Шеф-кухар. Готую з душею 🍳',
  'Архітектор. Бачу красу в деталях та людях 🏛️',
  'Журналіст і письменник. Цікавлюся філософією 📝',
  'Спортсмен і тренер. ЗСЖ — це спосіб життя 💪',
  'Займаюся бізнесом. Люблю спорт та подорожі ✈️',
  'Програміст. Вдень пишу код, ввечері читаю книги 💻📖',
  'Музикант і DJ. Живу нічним життям 🎵',
  'Маркетолог у стартапі. Люблю гори та гумор 📚',
  'Лікар-хірург. Серйозний на роботі, веселий у житті 😄',
  'Фотограф. Знімаю портрети та пейзажі 📸',
  'Юрист за освітою, мандрівник за покликанням 🌍',
  'Займаюся волонтерством та активним відпочинком 🏕️',
  'Тренер з боксу. Спорт — це моє все 🥊',
];

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randN = (arr, n) => [...arr].sort(() => Math.random() - 0.5).slice(0, n);
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function buildUser(i, gender) {
  const isFemale = gender === 'female';
  const firstName = isFemale ? FEMALE_NAMES[i % FEMALE_NAMES.length] : MALE_NAMES[i % MALE_NAMES.length];
  const lastName = isFemale ? FEMALE_LAST_NAMES[i % FEMALE_LAST_NAMES.length] : MALE_LAST_NAMES[i % MALE_LAST_NAMES.length];
  const fullName = `${firstName} ${lastName}`;

  const city = UA_CITIES[i % UA_CITIES.length];
  const age = randInt(19, 38);
  const photoIdx = (i % 90) + 1; // randomuser.me has ~99 photos per gender (0-99)

  return {
    name: fullName,
    age,
    gender: isFemale
      ? { id: 'female', title: 'Жіночий' }
      : { id: 'male',   title: 'Чоловічий' },
    wishUser: isFemale
      ? (Math.random() > 0.1 ? 'male' : 'all')
      : (Math.random() > 0.1 ? 'female' : 'all'),
    userSex: Math.random() > 0.1 ? 'heterosexual' : 'bisexual',
    userLocation: city,
    about: isFemale ? rand(ABOUT_FEMALE) : rand(ABOUT_MALE),
    work: isFemale ? rand(WORK_FEMALE) : rand(WORK_MALE),
    education: rand(EDUCATION),
    zodiac: rand(ZODIACS),
    relationship: isFemale ? 'Вільна' : 'Вільний',
    children: Math.random() > 0.7 ? 'Є' : 'Немає',
    smoking: Math.random() > 0.8 ? 'Іноді' : 'Ні',
    alcohol: Math.random() > 0.5 ? 'Іноді' : 'Ні',
    languages: Math.random() > 0.5
      ? ['Українська', 'Англійська']
      : ['Українська'],
    pets: Math.random() > 0.6 ? [Math.random() > 0.5 ? 'Кіт' : 'Собака'] : [],
    interests: randN(INTERESTS, randInt(3, 5)),
    lookingFor: rand(LOOKING_FOR_OPTIONS),
    userPhoto: isFemale
      ? [wp(photoIdx), wp(photoIdx + 1 > 99 ? 1 : photoIdx + 1)]
      : [mp(photoIdx), mp(photoIdx + 1 > 99 ? 1 : photoIdx + 1)],
    onboardingComplete: true,
    isOnline: Math.random() > 0.6,
    lastSeen: new Date(Date.now() - Math.random() * 7 * 86400000),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB:', MONGO_URI);

    // Дропаем уникальный индекс на name, если он есть
    try {
      await User.collection.dropIndex('name_1');
      console.log('🗑️  Dropped unique index name_1');
    } catch (e) {
      console.log('ℹ️  Index name_1 not found or already dropped:', e.message);
    }

    // Удаляем старых украинских тестовых юзеров
    const deleted = await User.deleteMany({
      userLocation: { $in: UA_CITIES },
      email: { $exists: false },
      deviceId: { $exists: false },
    });
    console.log(`🗑️  Deleted old Ukrainian test users: ${deleted.deletedCount}`);

    // Генерируем 75 женщин + 75 мужчин = 150 пользователей
    const users = [];
    for (let i = 0; i < 75; i++) {
      users.push(buildUser(i, 'female'));
    }
    for (let i = 0; i < 75; i++) {
      users.push(buildUser(i, 'male'));
    }

    // insertMany с ordered: false — продолжает при ошибках
    const result = await User.collection.insertMany(users, { ordered: false });
    console.log(`\n🎉 Done! Inserted: ${result.insertedCount} Ukrainian users`);

    process.exit(0);
  } catch (err) {
    if (err.code === 11000 || err.name === 'MongoBulkWriteError') {
      console.log(`⚠️  Some duplicates skipped. Inserted: ${err.result?.nInserted || '?'}`);
      process.exit(0);
    }
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

seed();
