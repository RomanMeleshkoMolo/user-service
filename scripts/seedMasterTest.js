'use strict';
/**
 * Мастер-сид: 500 персонажей (250 женщин + 250 мужчин).
 * Одни и те же пользователи в Feed, Meets, Симпатиях и Чатах.
 * Все поля — value-ключи из profileOptions.js.
 *
 * Запуск:
 *   node scripts/seedMasterTest.js
 *   CLEAN=true node scripts/seedMasterTest.js
 *
 * Env (опционально):
 *   AUTH_MONGO_URI   mongodb://localhost:27017/molo_auth
 *   LIKES_MONGO_URI  mongodb://localhost:27017/molo_likes
 *   CHAT_MONGO_URI   mongodb://localhost:27017/molo_chat
 *   TARGET_EMAIL     roman.meleshko1@gmail.com
 *   CHAT_COUNT       количество юзеров с чатами (default: 50)
 */

require('dotenv').config();
const mongoose = require('mongoose');

const AUTH_URI     = process.env.AUTH_MONGO_URI  || 'mongodb://localhost:27017/molo_auth';
const LIKES_URI    = process.env.LIKES_MONGO_URI || 'mongodb://localhost:27017/molo_likes';
const CHAT_URI     = process.env.CHAT_MONGO_URI  || 'mongodb://localhost:27017/molo_chat';
const TARGET_EMAIL = process.env.TARGET_EMAIL    || 'roman.meleshko1@gmail.com';
const CHAT_COUNT   = parseInt(process.env.CHAT_COUNT || '50', 10);
const CLEAN        = process.env.CLEAN === 'true';

// ─── Имена ───────────────────────────────────────────────────────────────────
const FEMALE_FIRST = [
  'Анастасия','Мария','Екатерина','Юлия','Ольга','Дарья','Валерия','Алина',
  'Анна','Полина','Кристина','Виктория','Наталья','Татьяна','Диана','Ирина',
  'Александра','Елена','Вероника','Ксения','Маргарита','Людмила','Светлана',
  'Надежда','Галина','Тамара','Лариса','Нина','Зоя','Инна','Жанна','Регина',
  'Карина','Яна','Кира','Арина','Лилия','Варвара','Антонина','Оксана',
  'Ульяна','Милана','Злата','Камила','Эмилия','Вера','Любовь','Валентина',
  'Раиса','Тамила',
];

const MALE_FIRST = [
  'Александр','Дмитрий','Иван','Михаил','Артём','Никита','Сергей','Владимир',
  'Роман','Павел','Евгений','Андрей','Максим','Алексей','Кирилл','Виктор',
  'Олег','Денис','Антон','Владислав','Константин','Игорь','Николай','Василий',
  'Степан','Пётр','Юрий','Геннадий','Виталий','Руслан','Тимур','Марк','Лев',
  'Даниил','Глеб','Илья','Арсений','Матвей','Семён','Егор','Фёдор','Леонид',
  'Борис','Вячеслав','Станислав','Григорий','Георгий','Тарас','Богдан','Захар',
];

const LAST_NAMES = [
  'Коваленко','Шевченко','Бондаренко','Ткаченко','Кравченко','Савченко',
  'Мельник','Лисенко','Мороз','Гриценко','Иваненко','Левченко','Семенченко',
  'Романченко','Павленко','Харченко','Даниленко','Пономаренко','Кириленко',
  'Яценко','Захарченко','Сидоренко','Горобець','Литвин','Хоменко','Тимченко',
  'Карпенко','Поліщук','Вовк','Бойко','Олійник','Нечипоренко','Дяченко',
  'Рибаченко','Кравець','Власенко','Мартиненко','Руденко','Михайленко',
  'Костенко','Білоус','Гончаренко','Поліщук','Зайченко','Остапенко',
  'Назаренко','Волошин','Демченко','Бабенко','Кузьменко','Різниченко',
  'Пилипенко','Стеценко','Охримович','Тарасенко','Хоменко','Луценко',
  'Безуглий','Гнатенко',
];

// ─── Города ──────────────────────────────────────────────────────────────────
const CITIES = [
  'Киев, Киевская область, Украина',
  'Харьков, Харьковская область, Украина',
  'Одесса, Одесская область, Украина',
  'Днепр, Днепропетровская область, Украина',
  'Запорожье, Запорожская область, Украина',
  'Львов, Львовская область, Украина',
  'Николаев, Николаевская область, Украина',
  'Полтава, Полтавская область, Украина',
  'Черкассы, Черкасская область, Украина',
  'Сумы, Сумская область, Украина',
  'Житомир, Житомирская область, Украина',
  'Винница, Винницкая область, Украина',
  'Хмельницкий, Хмельницкая область, Украина',
  'Варшава, Мазовецкое воеводство, Польша',
  'Краков, Малопольское воеводство, Польша',
  'Берлин, Берлин, Германия',
  'Мюнхен, Бавария, Германия',
  'Прага, Прага, Чехия',
  'Вена, Вена, Австрия',
  'Лондон, Англия, Великобритания',
  'Барселона, Каталония, Испания',
  'Амстердам, Северная Голландия, Нидерланды',
];

// ─── Профильные данные (все VALUE-ключи из profileOptions.js) ────────────────
const ZODIACS    = ['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
const EDUCATIONS = ['school','college','bachelor','master','phd'];
const CHILDREN   = ['no','no','no','has','wants','not_sure'];
const SMOKING    = ['no','no','no','sometimes','yes'];
const ALCOHOL    = ['no','no','sometimes','sometimes','yes'];
const RELATIONS  = ['single','single','single','in_relationship','divorced','complicated'];
const PETS_POOL  = [[], ['dog'], ['cat'], ['dog','cat'], ['other'], []];
const LANG_COMBOS = [
  ['russian'],
  ['russian','english'],
  ['russian','english'],
  ['russian','english','german'],
  ['russian','english','french'],
  ['russian','english','spanish'],
  ['russian','english','french','german'],
];
const INTERESTS_POOL = ['sport','music','travel','cinema','cooking','reading','games','photography','art','technology','nature','dance'];

const LOOKING_FOR_OPTIONS = [
  { id: 'dates',        title: 'Свидания',        icon: 'IconGlassCocktail' },
  { id: 'chat',         title: 'Общение',          icon: 'IconUsers'         },
  { id: 'love',         title: 'Найти любовь',     icon: 'IconHeart'         },
  { id: 'friendship',   title: 'Дружба',           icon: 'IconMoodSmile'     },
  { id: 'relationship', title: 'Отношения',        icon: 'IconRosette'       },
  { id: 'family',       title: 'Создание семьи',   icon: 'IconHome'          },
];

// ─── О себе (пулы текстов на русском) ────────────────────────────────────────
const ABOUT_F = [
  'Дизайнер и путешественник. Люблю кофе, хорошие книги и новые места ☕📚',
  'Врач по профессии, путешественник по призванию 🌍 Ищу того, кто не боится приключений',
  'Студентка. Танцую, рисую, мечтаю 🎨',
  'Маркетолог. Обожаю кофе, горы и хорошие разговоры ☕🏔️',
  'Предприниматель. Люблю театр, хорошее вино и умные беседы 🍷',
  'Фотограф. Снимаю людей и природу — нахожу красоту в каждом моменте 📸',
  'Люблю море, солнце и позитивных людей ☀️🌊',
  'Программистка. Днём пишу код, вечером читаю книги 💻📖',
  'Архитектор. Вижу красоту в деталях 🏛️',
  'Студентка медицины. Йога, правильное питание и мечты о море 🧘‍♀️',
  'Психолог. В свободное время кино и книги 🎬📚',
  'Журналист. Пишу о том, что важно ✍️',
  'Люблю готовить, ходить в театр и выбираться на природу 🍳🌿',
  'Переводчик. Влюблена в языки и культуры 🌍',
  'Стилист. Верю, что каждый человек красив 💄✨',
  'Занимаюсь йогой и правильным питанием. Зову на пробежку 🏃‍♀️',
  'Учитель. Обожаю детей, музыку и прогулки в парке 🎵',
  'Флорист. Создаю красоту из живых цветов 🌸',
  'Бухгалтер днём, танцовщица ночью 😄💃',
  'Ищу человека, с которым можно молчать и не скучать 😊',
  'Обожаю горы и зимний спорт ⛷️ Кто со мной?',
  'PR-менеджер. Коммуникабельная и открытая к новому 😊',
  'Путешественница. Была в 22 странах, хочу ещё 🌏',
  'SMM-менеджер. Знаю всё о трендах и умею веселиться 😄',
  'Мечтаю о собаке, море и хорошем человеке рядом 🐕🌊',
];

const ABOUT_M = [
  'IT-предприниматель. Люблю горы, сноуборд и хорошее кино 🏔️🎬',
  'Журналист и писатель. Интересуюсь историей и вкусной едой 📝',
  'Программист. В свободное время гоняю на велике и снимаю закаты 🚴📸',
  'Хирург. Серьёзный на работе, весёлый в жизни 😄',
  'Музыкант и диджей. Живу музыкой 🎵',
  'Занимаюсь недвижимостью. Спорт и путешествия — перезарядка ✈️',
  'Шеф-повар. Готовлю с душой, ем с удовольствием 🍳',
  'Архитектор. Создаю пространства для жизни 🏛️',
  'Тренер по функциональному тренингу. ЗОЖ — образ жизни 💪',
  'Маркетолог в стартапе. Горы, книги и хороший юмор 📚🏔️',
  'Юрист. Работаю много, но умею отдыхать. Джаз и хорошая кухня 🎷',
  'Разработчик игр. Геймер по призванию, романтик по натуре 🎮❤️',
  'Графический дизайнер. Кино и фотография — страсть 🎬📸',
  'Инженер-механик. Мотоциклы, горы, хорошая компания 🏍️',
  'Финансовый аналитик. Умею считать, трачу на путешествия 😄✈️',
  'Инженер-программист. Люблю математику и настольные игры 🎲',
  'Предприниматель. Строю бизнес, занимаюсь кроссфитом 💪',
  'Спортсмен. Бокс, бег, велосипед. Ищу активного человека рядом 🥊',
  'Фотограф. Снимаю портреты и пейзажи 📸',
  'Врач-терапевт. В жизни весёлый и открытый человек 😊',
  'Стартапер. Обожаю продуктивность и горный воздух ⛰️',
  'Астроном-любитель. Смотрю на звёзды и думаю о жизни 🔭',
  'Читаю по 2 книги в неделю. Обожаю умные разговоры 📚',
  'Моряк. Море — мой второй дом ⚓',
  'Учитель истории. Обожаю путешествия и старые города 🏛️',
];

// ─── Профессии ────────────────────────────────────────────────────────────────
const WORK_F = [
  'Дизайнер','Врач','Студент','Маркетолог','Предприниматель','Фотограф',
  'Менеджер','Программист','Архитектор','Психолог','Журналист','Бухгалтер',
  'Переводчик','Стилист','Учитель','Флорист','PR-менеджер','SMM-менеджер',
  'Юрист','Стоматолог','HR-менеджер','Финансист','Риелтор','Логопед','Косметолог',
];
const WORK_M = [
  'Предприниматель','Журналист','Программист','Врач','Музыкант','Менеджер',
  'Повар','Архитектор','Тренер','Маркетолог','Юрист','Дизайнер','Инженер',
  'Финансист','Стоматолог','Фотограф','Барист','Студент','Логист','Преподаватель',
  'Механик','Электрик','Риелтор','Аналитик','Консультант',
];

// ─── Фото-хелперы ─────────────────────────────────────────────────────────────
const wp = (n, tag) => ({
  url: `https://randomuser.me/api/portraits/women/${n % 100}.jpg`,
  key: `seed/w${n}_${tag}`, bucket: 'molo-user-photos', status: 'approved', format: 'jpg',
});
const mp = (n, tag) => ({
  url: `https://randomuser.me/api/portraits/men/${n % 100}.jpg`,
  key: `seed/m${n}_${tag}`, bucket: 'molo-user-photos', status: 'approved', format: 'jpg',
});

// ─── Утилиты ──────────────────────────────────────────────────────────────────
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr, i) => arr[i % arr.length];
const pickRand = (arr) => arr[rand(0, arr.length - 1)];
const pickN = (arr, n, seed) => {
  const shuffled = [...arr].sort((a, b) => {
    const ha = (seed * 2654435769 + arr.indexOf(a)) >>> 0;
    const hb = (seed * 2654435769 + arr.indexOf(b)) >>> 0;
    return ha - hb;
  });
  return shuffled.slice(0, n);
};

// ─── Генерация одного пользователя ───────────────────────────────────────────
function buildUser(index, gender) {
  const isFemale = gender === 'female';
  const firstArr  = isFemale ? FEMALE_FIRST : MALE_FIRST;
  const firstName = pick(firstArr, index);
  const lastName  = pick(LAST_NAMES, index * 7 + 3);
  const name      = `${firstName} ${lastName}`;

  const photoFn   = isFemale ? wp : mp;
  const mainIdx   = (index % 100);
  const userPhoto = [
    photoFn(mainIdx, 'a'),
    photoFn((mainIdx + 10) % 100, 'b'),
    photoFn((mainIdx + 20) % 100, 'c'),
    photoFn((mainIdx + 30) % 100, 'd'),
    photoFn((mainIdx + 40) % 100, 'e'),
  ];

  const age         = rand(19, 40);
  const eduIdx      = index % EDUCATIONS.length;
  const zodiacIdx   = index % ZODIACS.length;
  const cityIdx     = index % CITIES.length;
  const lookingFor  = pick(LOOKING_FOR_OPTIONS, index);
  const interests   = pickN(INTERESTS_POOL, rand(3, 6), index);

  return {
    name,
    age,
    gender: isFemale
      ? { id: 'female', title: 'Женский' }
      : { id: 'male',   title: 'Мужской' },
    wishUser: isFemale
      ? (index % 8 === 0 ? 'all' : 'male')
      : (index % 8 === 0 ? 'all' : 'female'),
    userSex: index % 10 === 0 ? 'bisexual' : 'heterosexual',
    userLocation: CITIES[cityIdx],
    about: isFemale
      ? ABOUT_F[index % ABOUT_F.length]
      : ABOUT_M[index % ABOUT_M.length],
    work: isFemale
      ? WORK_F[index % WORK_F.length]
      : WORK_M[index % WORK_M.length],
    education:    EDUCATIONS[eduIdx],
    zodiac:       ZODIACS[zodiacIdx],
    relationship: RELATIONS[index % RELATIONS.length],
    children:     CHILDREN[index % CHILDREN.length],
    smoking:      SMOKING[index % SMOKING.length],
    alcohol:      ALCOHOL[index % ALCOHOL.length],
    languages:    LANG_COMBOS[index % LANG_COMBOS.length],
    pets:         PETS_POOL[index % PETS_POOL.length],
    interests,
    lookingFor,
    userPhoto,
    onboardingComplete: true,
    isOnline: index % 3 === 0,
    lastSeen: new Date(Date.now() - rand(0, 72) * 3600000),
    _isSeed: true,
    createdAt: new Date(Date.now() - rand(1, 60) * 86400000),
    updatedAt: new Date(),
  };
}

// ─── Диалоги для чатов ────────────────────────────────────────────────────────
const THREADS = [
  [
    { from: 'other', text: 'Привет! Вижу, ты тоже из Киева — редкость здесь 😊' },
    { from: 'me',    text: 'Привет! Да, родился и вырос 😄 А ты давно?' },
    { from: 'other', text: 'Года три уже. Скучаешь по городу?' },
    { from: 'me',    text: 'Иногда. Особенно по Андреевскому спуску осенью' },
    { from: 'other', text: 'Там и я люблю гулять! Чем занимаешься?' },
    { from: 'me',    text: 'Программирую. А ты?' },
    { from: 'other', text: 'Дизайн. Мы почти коллеги! 😄' },
    { from: 'me',    text: 'Тогда давай за кофе — обсудим проекты?' },
    { from: 'other', text: 'С удовольствием. Когда свободен?' },
    { from: 'me',    text: 'В пятницу вечером?' },
    { from: 'other', text: 'Отлично, договорились 🎉' },
  ],
  [
    { from: 'other', text: 'Привет! Ты путешествуешь — куда была последняя поездка?' },
    { from: 'me',    text: 'Привет! Прага месяц назад — потрясающий город!' },
    { from: 'other', text: 'О, я живу в Праге! 😮 Что понравилось больше всего?' },
    { from: 'me',    text: 'Карлов мост на рассвете — нет слов просто' },
    { from: 'other', text: 'Это моё любимое место! Ты один был?' },
    { from: 'me',    text: 'Один. Иногда люблю путешествовать соло' },
    { from: 'other', text: 'Понимаю. Но вдвоём интереснее, согласен?' },
    { from: 'me',    text: 'Согласен! Если попутчик правильный 😊' },
    { from: 'other', text: 'Куда мечтаешь поехать следующей?' },
    { from: 'me',    text: 'Патагония. Дикая природа и тишина' },
    { from: 'other', text: 'Звучит прекрасно. Когда план? 😄' },
  ],
  [
    { from: 'other', text: 'Привет! Ты занимаешься спортом — это видно 💪' },
    { from: 'me',    text: 'Привет! Стараюсь 😄 Ты тоже, судя по профилю' },
    { from: 'other', text: 'Йога и бег. Ты что предпочитаешь?' },
    { from: 'me',    text: 'Зал и велик. Всё, что на свежем воздухе' },
    { from: 'other', text: 'О, я тоже! Где обычно катаешься?' },
    { from: 'me',    text: 'По набережной в основном' },
    { from: 'other', text: 'Каждые выходные там. Как мы раньше не пересекались? 😄' },
    { from: 'me',    text: 'Судьба свела нас здесь 😊' },
    { from: 'other', text: 'Встретимся в субботу на набережной?' },
    { from: 'me',    text: 'С удовольствием! В 10 утра?' },
    { from: 'other', text: 'Идеально 🌟' },
  ],
  [
    { from: 'other', text: 'Привет! Давно на приложении?' },
    { from: 'me',    text: 'Привет! Несколько недель. Ты?' },
    { from: 'other', text: 'Примерно так же. Интересно, но немного странно 😄' },
    { from: 'me',    text: 'Согласен. Первое сообщение всегда сложнее' },
    { from: 'other', text: 'Мне повезло — ты написал(а) первым(ой) 😊' },
    { from: 'me',    text: 'У тебя интересная анкета. Ты занимаешься йогой каждый день?' },
    { from: 'other', text: 'Почти. Это помогает держать голову в порядке' },
    { from: 'me',    text: 'Завидую дисциплине. Я больше хаотичный 😅' },
    { from: 'other', text: 'Хаос часто приводит к интересному 😄' },
    { from: 'me',    text: 'Хм, ты часто так философски мыслишь?' },
    { from: 'other', text: 'Психолог по образованию — не могу не анализировать 😄' },
  ],
  [
    { from: 'other', text: 'Привет! Ты готовишь? Вижу кулинария в интересах 🍳' },
    { from: 'me',    text: 'Привет! Да, это моя страсть. Итальянская и азиатская' },
    { from: 'other', text: 'Обожаю итальянскую! Умеешь делать пасту?' },
    { from: 'me',    text: 'Карбонара — моё фирменное 😄' },
    { from: 'other', text: 'Это путь к сердцу 😄' },
    { from: 'me',    text: 'Как-нибудь приготовлю для тебя?' },
    { from: 'other', text: 'От такого не отказываются 😊' },
    { from: 'me',    text: 'Именно так и задумывалось' },
    { from: 'other', text: 'Ещё что умеешь готовить?' },
    { from: 'me',    text: 'Тайский карри, японские роллы, французские крепы...' },
    { from: 'other', text: 'Ты шеф-повар или кто? 😮' },
    { from: 'me',    text: 'Любитель с серьёзным подходом 😄' },
  ],
  [
    { from: 'other', text: 'Привет! Ты тоже за границей? Я в Варшаве' },
    { from: 'me',    text: 'Привет! Да, в Берлине уже год. Как тебе Варшава?' },
    { from: 'other', text: 'Нравится! Активный город. Скучаешь по Украине?' },
    { from: 'me',    text: 'Иногда. По друзьям и атмосфере. А ты?' },
    { from: 'other', text: 'Очень. Особенно по домашней еде мамы 😄' },
    { from: 'me',    text: 'Это вечная история 😊 Чем занимаешься в Варшаве?' },
    { from: 'other', text: 'Маркетинг. А ты в Берлине?' },
    { from: 'me',    text: 'IT. Берлин для этого идеальный' },
    { from: 'other', text: 'Давно хотела туда. Есть любимые места?' },
    { from: 'me',    text: 'Много! Приезжай — покажу 😊' },
    { from: 'other', text: 'Это приглашение? 😄' },
    { from: 'me',    text: 'Абсолютно! Ты как к спонтанным поездкам?' },
    { from: 'other', text: 'Положительно! Особенно если есть хороший гид 😊' },
  ],
  [
    { from: 'other', text: 'Привет! Ты реально читаешь по 2 книги в неделю?' },
    { from: 'me',    text: 'Привет! Ха, стараюсь! Сейчас что-нибудь читаешь?' },
    { from: 'other', text: '"Сто лет одиночества" — второй раз перечитываю' },
    { from: 'me',    text: 'Маркес! Магический реализм — это особенное' },
    { from: 'other', text: 'Ещё повторно "Маленький принц" и "Мастер и Маргарита"' },
    { from: 'me',    text: '"Маленький принц" — вечно 😊 Могу что-то порекомендовать?' },
    { from: 'other', text: 'Конечно!' },
    { from: 'me',    text: '"Норвежский лес" Мураками — если ещё не читала' },
    { from: 'other', text: 'Давно хотела! Спасибо 😊' },
    { from: 'me',    text: 'Потом расскажи своё мнение — интересно' },
  ],
  [
    { from: 'other', text: 'Привет! Журналист — о чём пишешь?' },
    { from: 'me',    text: 'Привет! Технологии и общество. Ты чем занимаешься?' },
    { from: 'other', text: 'Архитектор. Мы оба создаём что-то для людей 😊' },
    { from: 'me',    text: 'Хорошая мысль! Что проектируешь?' },
    { from: 'other', text: 'Общественные пространства — парки, библиотеки' },
    { from: 'me',    text: 'Это потрясающе. Хотел бы написать статью про таких архитекторов' },
    { from: 'other', text: 'Намекаешь на интервью? 😄' },
    { from: 'me',    text: 'Можно начать с этого 😊 Расскажи о любимом проекте' },
    { from: 'other', text: 'Парк в Кракове. Придумала "тихие зоны" для интровертов' },
    { from: 'me',    text: 'Это гениально. Ты думаешь о людях' },
    { from: 'other', text: 'Стараюсь 😊' },
    { from: 'me',    text: 'За это тебя стоит знать лучше 😊' },
  ],
  [
    { from: 'other', text: 'Привет! Видела, что ты тренер. Как начал?' },
    { from: 'me',    text: 'Привет! Занимаюсь с 16 лет. Это стало смыслом жизни 💪' },
    { from: 'other', text: 'Здорово! Я хожу в зал, но без особого энтузиазма' },
    { from: 'me',    text: 'Это потому что нет цели или плана?' },
    { from: 'other', text: 'Скорее нет чёткого плана — делаю всё подряд' },
    { from: 'me',    text: 'Нужна система! Какая цель — энергия, тонус, похудеть?' },
    { from: 'other', text: 'Больше энергии и немного похудеть' },
    { from: 'me',    text: 'Реально за 2-3 месяца при правильном подходе' },
    { from: 'other', text: 'Ты меня консультируешь? 😄' },
    { from: 'me',    text: 'Немного да. Привычка 😅 Вообще хотел просто познакомиться' },
    { from: 'other', text: 'Полезный и симпатичный — мне нравится 😄' },
  ],
  [
    { from: 'other', text: 'Привет! Ты программист — на чём пишешь?' },
    { from: 'me',    text: 'Привет! React и Node.js в основном. А ты из IT?' },
    { from: 'other', text: 'Нет, я дизайнер. Но работаю с разработчиками постоянно' },
    { from: 'me',    text: 'О, понимаем друг друга тогда 😄' },
    { from: 'other', text: 'Скорее дополняем! Вы пишете, мы делаем красиво' },
    { from: 'me',    text: 'Хороший тандем 😊 Где работаешь?' },
    { from: 'other', text: 'В продуктовой компании. А ты?' },
    { from: 'me',    text: 'Стартап. Небольшой, но интересный' },
    { from: 'other', text: 'Обожаю атмосферу стартапов. Всё быстро меняется' },
    { from: 'me',    text: 'Именно! Иногда слишком быстро 😄' },
    { from: 'other', text: 'Хочется такой же работы. Ты не нанимаете дизайнеров? 😄' },
    { from: 'me',    text: 'Именно тебя — возможно 😊' },
  ],
];

// ─── Сид пользователей → molo_auth ───────────────────────────────────────────
async function seedUsers(authConn) {
  const col = authConn.collection('users');

  if (CLEAN) {
    const res = await col.deleteMany({ _isSeed: true, email: { $exists: false } });
    console.log(`🧹 Удалено старых seed-пользователей: ${res.deletedCount}`);
  }

  const users = [];
  for (let i = 0; i < 250; i++) users.push(buildUser(i, 'female'));
  for (let i = 0; i < 250; i++) users.push(buildUser(i, 'male'));

  // Пакетная вставка по 100
  let inserted = 0;
  for (let i = 0; i < users.length; i += 100) {
    const batch = users.slice(i, i + 100);
    try {
      const result = await col.insertMany(batch, { ordered: false });
      inserted += result.insertedCount;
    } catch (e) {
      if (e.code === 11000 || e.name === 'MongoBulkWriteError') {
        inserted += e.result?.nInserted ?? 0;
      } else throw e;
    }
    process.stdout.write(`\r  [${Math.min(i + 100, users.length)}/500] пользователей`);
  }
  console.log(`\n✅ Вставлено: ${inserted} пользователей`);

  const docs = await col.find(
    { _isSeed: true, email: { $exists: false }, onboardingComplete: true },
    { projection: { _id: 1, name: 1, isOnline: 1 } }
  ).toArray();

  console.log(`📋 Итого seed-пользователей в БД: ${docs.length}`);
  return docs;
}

// ─── Сид лайков → molo_likes ─────────────────────────────────────────────────
async function seedLikes(likesConn, authConn, personaIds) {
  const roman = await authConn.collection('users').findOne(
    { email: TARGET_EMAIL },
    { projection: { _id: 1, name: 1 } }
  );
  if (!roman) {
    console.error(`❌ Пользователь ${TARGET_EMAIL} не найден`);
    return null;
  }
  console.log(`🎯 Цель: ${roman.name} (${roman._id})`);

  const LikeSchema = new mongoose.Schema({
    fromUser: mongoose.Schema.Types.ObjectId,
    toUser:   mongoose.Schema.Types.ObjectId,
    status:   { type: String, default: 'pending' },
    createdAt: Date, updatedAt: Date, _isSeed: Boolean,
  });
  LikeSchema.index({ fromUser: 1, toUser: 1 }, { unique: true });
  const LikeModel = likesConn.models.Like || likesConn.model('Like', LikeSchema);

  if (CLEAN) {
    const res = await LikeModel.deleteMany({ toUser: roman._id, _isSeed: true });
    console.log(`🧹 Удалено старых лайков: ${res.deletedCount}`);
  }

  const existing = await LikeModel.find({ toUser: roman._id }).select('fromUser').lean();
  const existingSet = new Set(existing.map(l => String(l.fromUser)));

  const now = new Date();
  let created = 0, skipped = 0;

  for (let i = 0; i < personaIds.length; i += 50) {
    const batch = personaIds.slice(i, i + 50);
    const docs = [];
    for (const p of batch) {
      if (existingSet.has(String(p._id))) { skipped++; continue; }
      const createdAt = new Date(now - rand(0, 14) * 86400000);
      docs.push({ fromUser: p._id, toUser: roman._id, status: 'pending', createdAt, updatedAt: createdAt, _isSeed: true });
    }
    if (docs.length === 0) continue;
    try {
      const result = await LikeModel.collection.insertMany(docs, { ordered: false });
      created += result.insertedCount;
    } catch (e) {
      if (e.code === 11000 || e.name === 'MongoBulkWriteError') {
        created += e.result?.nInserted ?? 0;
        skipped += docs.length - (e.result?.nInserted ?? 0);
      } else throw e;
    }
    process.stdout.write(`\r  ❤️  ${created} лайков создано...`);
  }

  const total = await LikeModel.countDocuments({ toUser: roman._id });
  console.log(`\n✅ Лайков создано: ${created}  пропущено: ${skipped}  всего: ${total}`);
  return roman._id;
}

// ─── Сид чатов → molo_chat ───────────────────────────────────────────────────
async function seedChats(chatConn, personaIds, romanId) {
  const ConvSchema = new mongoose.Schema({
    participants: [mongoose.Schema.Types.ObjectId],
    lastMessage: {
      text: String, senderId: mongoose.Schema.Types.ObjectId,
      createdAt: Date, isRead: Boolean, nonce: { type: String, default: null },
    },
    unreadCount: { type: Map, of: Number, default: {} },
    isPrivate: { type: Boolean, default: false },
    deletedFor: [mongoose.Schema.Types.ObjectId],
    createdAt: Date, updatedAt: Date, _isSeed: Boolean,
  });
  const MsgSchema = new mongoose.Schema({
    conversationId: mongoose.Schema.Types.ObjectId,
    senderId: mongoose.Schema.Types.ObjectId,
    receiverId: mongoose.Schema.Types.ObjectId,
    messageType: { type: String, default: 'text' },
    text: String, isRead: Boolean, createdAt: Date, _isSeed: Boolean,
  });

  const Conversation = chatConn.models.Conversation || chatConn.model('Conversation', ConvSchema);
  const Message      = chatConn.models.Message      || chatConn.model('Message', MsgSchema);

  if (CLEAN) {
    await Message.deleteMany({ _isSeed: true });
    const res = await Conversation.deleteMany({ _isSeed: true });
    console.log(`🧹 Удалено старых чатов: ${res.deletedCount}`);
  }

  const chatPersonas = personaIds.slice(0, CHAT_COUNT);
  const now = Date.now();
  let totalConvs = 0, totalMsgs = 0;

  for (let i = 0; i < chatPersonas.length; i++) {
    const other = chatPersonas[i];
    const thread = THREADS[i % THREADS.length];

    const exists = await Conversation.findOne({
      participants: { $all: [romanId, other._id], $size: 2 },
    });
    if (exists) continue;

    const convStart = new Date(now - rand(3, 30) * 86400000);
    const conv = await Conversation.create({
      participants: [romanId, other._id],
      isPrivate: false,
      unreadCount: { [String(romanId)]: rand(0, 3) },
      createdAt: convStart, updatedAt: convStart, _isSeed: true,
    });

    const messages = [];
    let lastTs = convStart.getTime();
    for (let mi = 0; mi < thread.length; mi++) {
      lastTs += rand(60, 900) * 1000;
      if (lastTs > now) lastTs = now - rand(0, 3600) * 1000;
      const fromMe = thread[mi].from === 'me';
      messages.push({
        conversationId: conv._id,
        senderId:   fromMe ? romanId : other._id,
        receiverId: fromMe ? other._id : romanId,
        messageType: 'text',
        text: thread[mi].text,
        isRead: mi < thread.length - rand(0, 2),
        createdAt: new Date(lastTs),
        _isSeed: true,
      });
    }

    await Message.insertMany(messages);
    totalMsgs += messages.length;

    const last = messages[messages.length - 1];
    await Conversation.findByIdAndUpdate(conv._id, {
      lastMessage: { text: last.text, senderId: last.senderId, createdAt: last.createdAt, isRead: last.isRead },
      updatedAt: last.createdAt,
    });

    totalConvs++;
    if (totalConvs % 10 === 0 || i === chatPersonas.length - 1) {
      process.stdout.write(`\r  💬 ${totalConvs}/${chatPersonas.length} чатов, ${totalMsgs} сообщений`);
    }
  }
  console.log(`\n✅ Чатов создано: ${totalConvs}  Сообщений: ${totalMsgs}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║      Molo Master Seed — 500 пользователей    ║');
  console.log('╚══════════════════════════════════════════════╝\n');
  console.log('  molo_auth  →', AUTH_URI);
  console.log('  molo_likes →', LIKES_URI);
  console.log('  molo_chat  →', CHAT_URI);
  console.log('  target     →', TARGET_EMAIL);
  console.log('  CLEAN      →', CLEAN);
  console.log('  CHAT_COUNT →', CHAT_COUNT, '\n');

  const authConn  = await mongoose.createConnection(AUTH_URI).asPromise();
  const likesConn = await mongoose.createConnection(LIKES_URI).asPromise();
  const chatConn  = await mongoose.createConnection(CHAT_URI).asPromise();
  console.log('✅ Подключились ко всем трём базам\n');

  console.log('── 1/3  Пользователи → molo_auth ───────────────');
  const personaIds = await seedUsers(authConn);

  console.log('\n── 2/3  Симпатии → molo_likes ──────────────────');
  const romanId = await seedLikes(likesConn, authConn, personaIds);

  if (romanId) {
    console.log('\n── 3/3  Чаты → molo_chat ───────────────────────');
    await seedChats(chatConn, personaIds, romanId);
  }

  console.log('\n🎉 Готово!');
  console.log('   500 пользователей в Feed/Meets');
  console.log('   500 симпатий в разделе Симпатии');
  console.log(`   ${CHAT_COUNT} чатов с реальными сообщениями`);
  console.log('\n   Удалить всё:  CLEAN=true node scripts/seedMasterTest.js\n');

  await authConn.close();
  await likesConn.close();
  await chatConn.close();
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Ошибка:', err);
  process.exit(1);
});
