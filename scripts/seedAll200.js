/**
 * Пересоздаёт 200 тестовых пользователей с уникальными фото.
 * - 100 женщин: wp(0)..wp(99) — каждой уникальный портрет
 * - 100 мужчин: mp(0)..mp(99) — каждому уникальный портрет
 * Запуск: node scripts/seedAll200.js
 */

const mongoose = require('mongoose');
const User = require('../models/userModel');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/users';

// randomuser.me — 100 уникальных портретов на каждый пол (0–99)
const wp = (n) => ({ url: `https://randomuser.me/api/portraits/women/${n}.jpg`, key: null, status: 'approved', format: 'jpg' });
const mp = (n) => ({ url: `https://randomuser.me/api/portraits/men/${n}.jpg`,   key: null, status: 'approved', format: 'jpg' });

// ──────────────── Имена ────────────────

const FEMALE_FIRST = [
  'Анастасія','Вікторія','Катерина','Наталія','Тетяна',
  'Ірина','Олена','Оксана','Людмила','Світлана',
  'Юлія','Аліна','Поліна','Дар\'я','Марина',
  'Валентина','Галина','Лариса','Ксенія','Соня',
  'Христина','Ярослава','Діана','Карина','Руслана',
  'Мирослава','Дарина','Вероніка','Тамара','Надія',
];

const MALE_FIRST = [
  'Олексій','Дмитро','Максим','Андрій','Олег',
  'Микола','Василь','Ігор','Юрій','Сергій',
  'Владислав','Тарас','Богдан','Роман','Артем',
  'Олександр','Михайло','Іван','Петро','Степан',
  'Євген','Павло','Антон','Руслан','Віталій',
  'Денис','Кирило','Назар','Остап','Ярослав',
];

const LAST_NAMES = [
  'Коваленко','Шевченко','Бондаренко','Ткаченко','Кравченко',
  'Савченко','Мельник','Лисенко','Мороз','Гриценко',
  'Іваненко','Левченко','Семенченко','Романченко','Павленко',
  'Харченко','Даниленко','Пономаренко','Кириленко','Яценко',
  'Захарченко','Сидоренко','Горобець','Литвин','Хоменко',
  'Тимченко','Карпенко','Поліщук','Вовк','Бойко',
  'Климenko','Олійник','Нечипоренко','Дяченко','Рибаченко',
];

// ──────────────── Города ────────────────

const UA_CITIES = [
  'Київ','Харків','Одеса','Дніпро','Запоріжжя',
  'Львів','Кривий Ріг','Миколаїв','Херсон','Полтава',
  'Чернігів','Черкаси','Суми','Житомир','Вінниця',
  'Хмельницький','Рівне','Івано-Франківськ','Ужгород','Тернопіль',
  'Луцьк','Біла Церква','Кременчук','Бердянськ','Нікополь',
];

const RU_CITIES = [
  'Москва','Санкт-Петербург','Казань','Новосибирськ','Єкатеринбург',
  'Нижній Новгород','Краснодар','Ростов-на-Дону','Самара','Уфа',
];

const ALL_CITIES = [...UA_CITIES, ...RU_CITIES];

// ──────────────── Данные профиля (value-ключи совпадают с фильтром) ────────────────

const ZODIACS = [
  'aries','taurus','gemini','cancer','leo','virgo',
  'libra','scorpio','sagittarius','capricorn','aquarius','pisces',
];

const EDUCATION = [
  'school','college','bachelor','master','phd',
];

const WORK_F = [
  'Дизайнер','Програміст','Маркетолог','Лікар','Вчитель',
  'Підприємець','Менеджер','Журналіст','Фотограф','Архітектор',
  'Психолог','Юрист','Бухгалтер','Стоматолог','PR-менеджер',
  'SMM-менеджер','Перекладач','Студент','Стиліст','Флорист',
];

const WORK_M = [
  'Програміст','Інженер','Архітектор','Менеджер','Підприємець',
  'Лікар','Юрист','Фінансист','Будівельник','Дизайнер',
  'Механік','Маркетолог','Тренер','Шеф-кухар','Журналіст',
  'Фотограф','Водій','Електрик','Студент','Барист',
];

const INTERESTS = [
  'Подорожі','Кіно','Музика','Спорт','Готування','Читання',
  'Фотографія','Танці','Йога','Мистецтво','Ігри','Природа',
  'Фітнес','Кава','Тварини','Театр','Велосипед','Плавання',
  'Малювання','Волонтерство','Серфінг','Скелелазіння',
];

const LOOKING_FOR = [
  { id: 'dates',        title: 'Свидания',        icon: 'IconGlassCocktail' },
  { id: 'chat',         title: 'Общение',          icon: 'IconUsers'         },
  { id: 'love',         title: 'Найти любовь',     icon: 'IconHeart'         },
  { id: 'friendship',   title: 'Дружба',           icon: 'IconMoodSmile'     },
  { id: 'relationship', title: 'Отношения',        icon: 'IconRosette'       },
  { id: 'family',       title: 'Создание семьи',   icon: 'IconHome'          },
];

const ABOUT_F = [
  'Люблю подорожувати та відкривати нові місця 🌍',
  'Кава, книги та хороші розмови ☕📚',
  'Танцюю, малюю, мрію про подорожі 🎨',
  'Займаюся йогою та правильним харчуванням 🧘‍♀️',
  'Фотограф за покликанням 📸',
  'Люблю море, сонце та позитивних людей ☀️🌊',
  'Вчу мови та мандрую Європою ✈️',
  'Обожнюю кіно, театр та хорошу музику 🎭',
  'Займаюся волонтерством та люблю тварин 🐾',
  'Шукаю того, хто не боїться пригод 🎯',
  'Психолог за освітою, оптиміст за натурою 😊',
  'Готую з душею, їм із задоволенням 🍳',
  'Люблю активний відпочинок та природу 🏕️',
  'Читаю, малюю, мрію 📖🎨',
  'Займаюся спортом та веду здоровий спосіб життя 💪',
  'Мрію побувати в усіх країнах Азії 🌏',
  'Обожнюю гори та гірські лижі ⛷️',
  'Танцюю сальсу та бачату 💃',
  'Люблю фестивалі та живу музику 🎸',
  'Веду свій блог про подорожі ✍️',
];

const ABOUT_M = [
  'IT-підприємець. Люблю гори та хороше кіно 🏔️🎬',
  'Інженер. У вільний час займаюся велоспортом 🚴',
  'Шеф-кухар. Готую з душею 🍳',
  'Архітектор. Бачу красу в деталях 🏛️',
  'Журналіст і письменник 📝',
  'Спортсмен і тренер. ЗСЖ — це спосіб життя 💪',
  'Займаюся бізнесом. Люблю спорт та подорожі ✈️',
  'Програміст. Вдень пишу код, ввечері читаю книги 💻📖',
  'Музикант і DJ 🎵',
  'Маркетолог. Люблю гори та гумор 📚',
  'Лікар. Серйозний на роботі, веселий у житті 😄',
  'Фотограф. Знімаю портрети та пейзажі 📸',
  'Юрист за освітою, мандрівник за покликанням 🌍',
  'Займаюся волонтерством та активним відпочинком 🏕️',
  'Тренер з боксу. Спорт — це моє все 🥊',
  'Грею на гітарі та пишу пісні 🎸',
  'Займаюся альпінізмом 🧗',
  'Обожнюю мотоцикли та подорожі на довгі відстані 🏍️',
  'Захоплений астрономією та телескопами 🔭',
  'Читаю по 2 книги на тиждень 📚',
];

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randN = (arr, n) => [...arr].sort(() => Math.random() - 0.5).slice(0, n);
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function buildUser(globalIndex, gender) {
  const isFemale = gender === 'female';

  // Уникальное имя: firstName + lastName с разными индексами
  const firstArr = isFemale ? FEMALE_FIRST : MALE_FIRST;
  const firstName = firstArr[globalIndex % firstArr.length];
  const lastName = LAST_NAMES[(globalIndex * 7 + 3) % LAST_NAMES.length];

  // 10 фото: главный портрет + 9 дополнительных, смещённых по кольцу 0-99.
  // Шаг 10 гарантирует уникальность внутри одного юзера.
  const photo = isFemale ? wp : mp;
  const userPhoto = Array.from({ length: 10 }, (_, k) => photo((globalIndex + k * 10) % 100));

  const city = ALL_CITIES[globalIndex % ALL_CITIES.length];
  const age = randInt(19, 38);

  return {
    name: `${firstName} ${lastName}`,
    age,
    gender: isFemale
      ? { id: 'female', title: 'Жіночий' }
      : { id: 'male',   title: 'Чоловічий' },
    wishUser: isFemale
      ? (globalIndex % 10 === 0 ? 'all' : 'male')
      : (globalIndex % 10 === 0 ? 'all' : 'female'),
    userSex: globalIndex % 8 === 0 ? 'bisexual' : 'heterosexual',
    userLocation: city,
    about: isFemale ? ABOUT_F[globalIndex % ABOUT_F.length] : ABOUT_M[globalIndex % ABOUT_M.length],
    work: isFemale ? WORK_F[globalIndex % WORK_F.length] : WORK_M[globalIndex % WORK_M.length],
    education: EDUCATION[globalIndex % EDUCATION.length],
    zodiac: ZODIACS[globalIndex % ZODIACS.length],
    relationship: ['single', 'in_relationship', 'complicated', 'divorced'][globalIndex % 4],
    children: ['no', 'has', 'wants', 'not_sure', 'no'][globalIndex % 5],
    smoking: globalIndex % 7 === 0 ? 'sometimes' : 'no',
    alcohol: globalIndex % 3 === 0 ? 'sometimes' : 'no',
    languages: globalIndex % 3 === 0
      ? ['russian', 'english', 'spanish']
      : globalIndex % 2 === 0
        ? ['russian', 'english']
        : ['russian'],
    pets: globalIndex % 4 === 0 ? [globalIndex % 2 === 0 ? 'cat' : 'dog'] : [],
    interests: randN(INTERESTS, randInt(3, 5)),
    lookingFor: LOOKING_FOR[globalIndex % LOOKING_FOR.length],
    userPhoto,
    onboardingComplete: true,
    isOnline: globalIndex % 3 === 0,
    lastSeen: new Date(Date.now() - globalIndex * 3600000),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB:', MONGO_URI);

    // Снимаем уникальный индекс на name если остался
    try {
      await User.collection.dropIndex('name_1');
      console.log('🗑️  Dropped unique index name_1');
    } catch (e) {
      // уже удалён — ок
    }

    // Удаляем ВСЕХ тестовых юзеров (нет email и deviceId)
    const deleted = await User.deleteMany({
      email:    { $exists: false },
      deviceId: { $exists: false },
    });
    console.log(`🗑️  Deleted ${deleted.deletedCount} old test users`);

    // Генерируем 100 женщин + 100 мужчин
    const users = [];
    for (let i = 0; i < 100; i++) users.push(buildUser(i, 'female'));
    for (let i = 0; i < 100; i++) users.push(buildUser(i, 'male'));

    const result = await User.collection.insertMany(users, { ordered: false });
    console.log(`\n🎉 Done! Inserted: ${result.insertedCount} users (100 women + 100 men)`);
    console.log('📸 Each user has 10 photos (step-10 ring offset, women: 0–99, men: 0–99)');

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
