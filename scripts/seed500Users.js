/**
 * seed500Users.js
 * Creates 500 test users with Kharkiv-centric geographic distribution.
 *
 * Geographic groups (100 users each = 50F + 50M):
 *   1. Харків + ближайшие пригороды (~30 км)
 *   2. Харківська область
 *   3. Полтавська область
 *   4. Сумська + Дніпропетровська область
 *   5. Дальние регионы (Київ, Запоріжжя, Одеса...)
 *
 * Run: node scripts/seed500Users.js
 * Run (custom DB): MONGO_URI=mongodb://localhost:27017/molo_auth node scripts/seed500Users.js
 */

const mongoose = require('mongoose');
const User = require('../models/userModel');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/molo_auth';

// randomuser.me — 99 уникальных портретов на каждый пол (0–98)
const wp = (n) => ({ url: `https://randomuser.me/api/portraits/women/${n % 99}.jpg`, key: null, status: 'approved', format: 'jpg' });
const mp = (n) => ({ url: `https://randomuser.me/api/portraits/men/${n % 99}.jpg`,   key: null, status: 'approved', format: 'jpg' });

// ─── Имена ─────────────────────────────────────────────────────────────────

const FEMALE_FIRST = [
  'Анастасия', 'Виктория', 'Екатерина', 'Наталья', 'Татьяна',
  'Ирина', 'Елена', 'Оксана', 'Людмила', 'Светлана',
  'Юлия', 'Алина', 'Полина', 'Дарья', 'Марина',
  'Валентина', 'Галина', 'Лариса', 'Ксения', 'Соня',
  'Кристина', 'Ярослава', 'Диана', 'Карина', 'Руслана',
  'Александра', 'Евгения', 'Валерия', 'Ольга', 'Вера',
  'Жанна', 'Инна', 'Лия', 'Мирослава', 'Вероника',
  'Тамара', 'Надежда', 'Дарина', 'Зоя', 'Антонина',
  'Регина', 'Эльвира', 'Стелла', 'Камила', 'Милана',
  'Арина', 'Злата', 'Ева', 'Ника', 'Лилия',
];

const MALE_FIRST = [
  'Алексей', 'Дмитрий', 'Максим', 'Андрей', 'Олег',
  'Николай', 'Василий', 'Игорь', 'Юрий', 'Сергей',
  'Владислав', 'Тарас', 'Богдан', 'Роман', 'Артём',
  'Александр', 'Михаил', 'Иван', 'Пётр', 'Степан',
  'Евгений', 'Павел', 'Антон', 'Руслан', 'Виталий',
  'Денис', 'Кирилл', 'Назар', 'Ярослав', 'Владимир',
  'Константин', 'Илья', 'Никита', 'Арсений', 'Тимур',
  'Даниил', 'Глеб', 'Матвей', 'Марк', 'Тимофей',
  'Леонид', 'Вадим', 'Станислав', 'Роберт', 'Эдуард',
  'Геннадий', 'Анатолий', 'Борис', 'Виктор', 'Фёдор',
];

const LAST_NAMES = [
  'Коваленко', 'Шевченко', 'Бондаренко', 'Ткаченко', 'Кравченко',
  'Савченко', 'Мельник', 'Лысенко', 'Мороз', 'Гриценко',
  'Иваненко', 'Левченко', 'Семенченко', 'Романченко', 'Павленко',
  'Харченко', 'Даниленко', 'Пономаренко', 'Кириленко', 'Яценко',
  'Захарченко', 'Сидоренко', 'Горобец', 'Литвин', 'Хоменко',
  'Тимченко', 'Карпенко', 'Полищук', 'Волков', 'Бойко',
  'Клименко', 'Олейник', 'Нечипоренко', 'Дяченко', 'Рыбаченко',
  'Петренко', 'Борисенко', 'Марченко', 'Голубенко', 'Назаренко',
  'Кузьменко', 'Панченко', 'Семенюк', 'Мельниченко', 'Власенко',
  'Гавриленко', 'Зінченко', 'Момоненко', 'Прокопенко', 'Лупій',
];

// ─── О себе ─────────────────────────────────────────────────────────────────

const ABOUT_F = [
  'Обожаю путешествия и новые знакомства 🌍',
  'Кофе, книги и приятные беседы ☕📚',
  'Танцую, рисую, мечтаю о путешествиях 🎨',
  'Занимаюсь йогой и слежу за питанием 🧘‍♀️',
  'Фотограф по призванию 📸',
  'Люблю море, солнце и позитивных людей ☀️🌊',
  'Учу языки и путешествую по Европе ✈️',
  'Обожаю кино, театр и хорошую музыку 🎭',
  'Занимаюсь волонтёрством и люблю животных 🐾',
  'Ищу того, кто не боится приключений 🎯',
  'Психолог по образованию, оптимист по натуре 😊',
  'Готовлю с душой и ем с удовольствием 🍳',
  'Люблю активный отдых и природу 🏕️',
  'Читаю, рисую, мечтаю 📖🎨',
  'Занимаюсь спортом и веду здоровый образ жизни 💪',
  'Мечтаю побывать во всех странах Азии 🌏',
  'Обожаю горы и горные лыжи ⛷️',
  'Танцую сальсу и бачату 💃',
  'Люблю фестивали и живую музыку 🎸',
  'Веду блог о путешествиях ✍️',
  'Увлекаюсь живописью и хожу на выставки 🖼️',
  'Люблю животных и мечтаю о своём приюте 🐶',
  'Занимаюсь бегом и триатлоном 🏃‍♀️',
  'Работаю в IT, в свободное время готовлю 💻🍳',
  'Меломан и завсегдатай концертов 🎶',
];

const ABOUT_M = [
  'IT-предприниматель. Люблю горы и хорошее кино 🏔️🎬',
  'Инженер. В свободное время занимаюсь велоспортом 🚴',
  'Шеф-повар. Готовлю с душой 🍳',
  'Архитектор. Вижу красоту в деталях 🏛️',
  'Журналист и писатель 📝',
  'Спортсмен и тренер. ЗОЖ — это образ жизни 💪',
  'Занимаюсь бизнесом. Люблю спорт и путешествия ✈️',
  'Программист. Днём пишу код, вечером читаю книги 💻📖',
  'Музыкант и DJ 🎵',
  'Маркетолог. Люблю горы и юмор 📚',
  'Врач. Серьёзный на работе, весёлый в жизни 😄',
  'Фотограф. Снимаю портреты и пейзажи 📸',
  'Юрист по образованию, путешественник по призванию 🌍',
  'Занимаюсь волонтёрством и активным отдыхом 🏕️',
  'Тренер по боксу. Спорт — это всё 🥊',
  'Играю на гитаре и пишу песни 🎸',
  'Занимаюсь альпинизмом 🧗',
  'Обожаю мотоциклы и дальние поездки 🏍️',
  'Увлекаюсь астрономией и телескопами 🔭',
  'Читаю по 2 книги в неделю 📚',
  'Программист в стартапе, в душе — путешественник ✈️',
  'Люблю готовить барбекю и принимать гостей 🔥',
  'Кандидат в мастера спорта по плаванию 🏊',
  'Работаю в рекламе, снимаю кино в свободное время 🎬',
  'Технарь с романтической душой 🔧❤️',
];

// ─── Работа ──────────────────────────────────────────────────────────────────

const WORK_F = [
  'Дизайнер', 'Программист', 'Маркетолог', 'Врач', 'Учитель',
  'Предприниматель', 'Менеджер', 'Журналист', 'Фотограф', 'Архитектор',
  'Психолог', 'Юрист', 'Бухгалтер', 'Стоматолог', 'PR-менеджер',
  'SMM-менеджер', 'Переводчик', 'Студент', 'Стилист', 'Флорист',
  'Ветеринар', 'Тренер', 'Медсестра', 'Педагог', 'Экономист',
];

const WORK_M = [
  'Программист', 'Инженер', 'Архитектор', 'Менеджер', 'Предприниматель',
  'Врач', 'Юрист', 'Финансист', 'Строитель', 'Дизайнер',
  'Механик', 'Маркетолог', 'Тренер', 'Шеф-повар', 'Журналист',
  'Фотограф', 'Водитель', 'Электрик', 'Студент', 'Бариста',
  'Аналитик', 'Менеджер по продажам', 'Системный администратор', 'Риелтор', 'DevOps-инженер',
];

// ─── Опции профиля (значения совпадают с profileOptions.js) ──────────────────

const ZODIACS = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
];

const EDUCATION = ['school', 'college', 'bachelor', 'master', 'phd'];

const INTERESTS_POOL = [
  'sport', 'music', 'travel', 'cinema', 'cooking', 'reading',
  'games', 'photography', 'art', 'technology', 'nature', 'dance',
];

const LOOKING_FOR_LIST = [
  { id: 'dates',        title: 'Свидания',        icon: 'IconGlassCocktail' },
  { id: 'chat',         title: 'Общение',          icon: 'IconUsers'         },
  { id: 'love',         title: 'Найти любовь',     icon: 'IconHeart'         },
  { id: 'friendship',   title: 'Дружба',           icon: 'IconMoodSmile'     },
  { id: 'relationship', title: 'Отношения',        icon: 'IconRosette'       },
  { id: 'family',       title: 'Создание семьи',   icon: 'IconHome'          },
];

const RELATIONSHIP_LIST = ['single', 'in_relationship', 'complicated', 'divorced'];
const CHILDREN_LIST     = ['has', 'no', 'wants', 'not_sure'];
const SMOKING_LIST      = ['no', 'no', 'sometimes', 'no', 'yes', 'no', 'no'];
const ALCOHOL_LIST      = ['no', 'sometimes', 'no', 'sometimes', 'yes', 'no'];
const LANGUAGES_LIST    = [
  ['russian'],
  ['russian', 'english'],
  ['russian', 'english', 'spanish'],
  ['russian', 'english', 'french'],
  ['russian', 'english', 'german'],
];
const PETS_LIST         = [['none'], ['dog'], ['cat'], ['cat'], ['dog', 'cat'], ['none'], ['other']];

// ─── Географические группы ───────────────────────────────────────────────────

const GEO_GROUPS = [
  // Группа 1: Харків + ближайшие пригороды
  [
    'Харків', 'Мерефа', 'Люботин', 'Дергачі', 'Солоницівка',
    'Бабаї', 'Пісочин', 'Рогань', 'Циркуни', 'Малинівка',
    'Коротич', 'Покотилівка', 'Безлюдівка', 'Жихор', 'Основа',
    'Сокільники', 'Олексіївка', 'Велика Данилівка', 'Нові Будинки', 'Ізюмське',
  ],
  // Группа 2: Харківська область
  [
    'Чугуїв', 'Балаклія', 'Ізюм', 'Куп\'янськ', 'Лозова',
    'Богодухів', 'Вовчанськ', 'Красноград', 'Зміїв', 'Нова Водолага',
    'Валки', 'Первомайський', 'Барвінкове', 'Сахновщина', 'Кегичівка',
    'Печеніги', 'Дворічна', 'Борова', 'Великий Бурлук', 'Зачепилівка',
  ],
  // Группа 3: Полтавська область
  [
    'Полтава', 'Кременчук', 'Лубни', 'Миргород', 'Пирятин',
    'Хорол', 'Гадяч', 'Карлівка', 'Гребінка', 'Глобине',
    'Зінків', 'Кобеляки', 'Диканька', 'Котельва', 'Лохвиця',
    'Шишаки', 'Чорнухи', 'Семенівка', 'Решетилівка', 'Нові Санжари',
  ],
  // Группа 4: Сумська + Дніпропетровська
  [
    'Суми', 'Охтирка', 'Конотоп', 'Шостка', 'Ромни',
    'Глухів', 'Тростянець', 'Дніпро', 'Кривий Ріг', 'Нікополь',
    'Кам\'янське', 'Павлоград', 'Новомосковськ', 'Лебедин', 'Путивль',
    'Буринь', 'Кролевець', 'Марганець', 'Жовті Води', 'Першотравенськ',
  ],
  // Группа 5: Дальние регионы
  [
    'Київ', 'Запоріжжя', 'Черкаси', 'Чернігів', 'Вінниця',
    'Кропивницький', 'Миколаїв', 'Херсон', 'Одеса', 'Житомир',
    'Хмельницький', 'Рівне', 'Івано-Франківськ', 'Ужгород', 'Тернопіль',
    'Луцьк', 'Біла Церква', 'Бердянськ', 'Мелітополь', 'Маріуполь',
  ],
];

// ─── Вспомогательные функции ─────────────────────────────────────────────────

const randN = (arr, n) => [...arr].sort(() => Math.random() - 0.5).slice(0, n);
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr, i) => arr[i % arr.length];

// ─── Построение пользователя ─────────────────────────────────────────────────

function buildUser(genderIdx, gender, groupIdx, globalPhotoIdx) {
  const isFemale = gender === 'female';
  const firstName = pick(isFemale ? FEMALE_FIRST : MALE_FIRST, genderIdx * 3 + 1);
  const lastName  = pick(LAST_NAMES, genderIdx * 7 + groupIdx * 13 + (isFemale ? 2 : 17));
  const city      = pick(GEO_GROUPS[groupIdx], genderIdx);

  const photoFn   = isFemale ? wp : mp;
  const mainIdx   = globalPhotoIdx % 99;

  // 5 фотографий: главный портрет + 4 дополнительных (шаг 20 по кольцу 0-98)
  const userPhoto = [
    photoFn(mainIdx),
    photoFn((mainIdx + 20) % 99),
    photoFn((mainIdx + 40) % 99),
    photoFn((mainIdx + 60) % 99),
    photoFn((mainIdx + 80) % 99),
  ];

  const age = randInt(19, 38);

  return {
    name: `${firstName} ${lastName}`,
    age,
    gender: isFemale
      ? { id: 'female', title: 'Женский' }
      : { id: 'male',   title: 'Мужской' },
    wishUser: isFemale
      ? (genderIdx % 12 === 0 ? 'all' : 'male')
      : (genderIdx % 12 === 0 ? 'all' : 'female'),
    userSex: genderIdx % 10 === 0 ? 'bisexual' : 'heterosexual',
    userLocation: city,
    about: pick(isFemale ? ABOUT_F : ABOUT_M, genderIdx + groupIdx * 5),
    work:  pick(isFemale ? WORK_F   : WORK_M,  genderIdx + groupIdx * 3),
    education:    pick(EDUCATION,         genderIdx + groupIdx),
    zodiac:       pick(ZODIACS,           genderIdx * 2 + groupIdx * 3),
    relationship: pick(RELATIONSHIP_LIST, genderIdx + groupIdx * 7),
    children:     pick(CHILDREN_LIST,     genderIdx * 3 + groupIdx),
    smoking:      pick(SMOKING_LIST,      genderIdx + groupIdx * 2),
    alcohol:      pick(ALCOHOL_LIST,      genderIdx * 5 + groupIdx),
    languages:    pick(LANGUAGES_LIST,    genderIdx + groupIdx * 4),
    pets:         pick(PETS_LIST,         genderIdx * 2 + groupIdx * 3),
    interests:    randN(INTERESTS_POOL, randInt(3, 5)),
    lookingFor:   pick(LOOKING_FOR_LIST,  genderIdx + groupIdx * 2),
    userPhoto,
    onboardingComplete: true,
    isOnline:   genderIdx % 4 === 0,
    lastSeen:   new Date(Date.now() - (genderIdx * 3600000 + groupIdx * 7200000)),
    createdAt:  new Date(),
    updatedAt:  new Date(),
  };
}

// ─── Сид ─────────────────────────────────────────────────────────────────────

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB:', MONGO_URI);

    try {
      await User.collection.dropIndex('name_1');
      console.log('🗑️  Dropped unique index name_1');
    } catch (_) {
      // already gone — ok
    }

    const deleted = await User.deleteMany({
      email:    { $exists: false },
      deviceId: { $exists: false },
    });
    console.log(`🗑️  Deleted ${deleted.deletedCount} old test users`);

    const users = [];
    let femalePhotoIdx = 0;
    let malePhotoIdx   = 0;

    for (let groupIdx = 0; groupIdx < GEO_GROUPS.length; groupIdx++) {
      const groupName = [
        'Харків + пригороды',
        'Харківська обл.',
        'Полтавська обл.',
        'Сумська + Дніпропетровська',
        'Дальние регионы',
      ][groupIdx];

      for (let i = 0; i < 50; i++) {
        users.push(buildUser(i, 'female', groupIdx, femalePhotoIdx++));
      }
      for (let i = 0; i < 50; i++) {
        users.push(buildUser(i, 'male', groupIdx, malePhotoIdx++));
      }

      console.log(`📍 Group ${groupIdx + 1} prepared: ${groupName} — 50F + 50M`);
    }

    const result = await User.collection.insertMany(users, { ordered: false });
    console.log(`\n🎉 Done! Inserted: ${result.insertedCount} users`);
    console.log(`   250 женщин + 250 мужчин`);
    console.log(`   Группа 1 (0-99):   Харків + пригороды`);
    console.log(`   Группа 2 (100-199): Харківська обл.`);
    console.log(`   Группа 3 (200-299): Полтавська обл.`);
    console.log(`   Группа 4 (300-399): Сумська + Дніпропетровська`);
    console.log(`   Группа 5 (400-499): Дальние регионы`);
    console.log(`   Фото: randomuser.me portraits (циклически 0-98)`);

    process.exit(0);
  } catch (err) {
    if (err.code === 11000 || err.name === 'MongoBulkWriteError') {
      const inserted = err.result?.nInserted ?? err.result?.insertedCount ?? '?';
      console.log(`⚠️  Some duplicates skipped. Inserted: ${inserted}`);
      process.exit(0);
    }
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

seed();
