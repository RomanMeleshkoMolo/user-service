/**
 * Добавляет фото тестовым пользователям до 10 штук каждому.
 * Обновляет ТОЛЬКО поле userPhoto — не удаляет и не пересоздаёт юзеров.
 *
 * Запуск: node scripts/addPhotosToTestUsers.js
 */

const mongoose = require('mongoose');
const User = require('../models/userModel');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/users';

const wp = (n) => ({ url: `https://randomuser.me/api/portraits/women/${n}.jpg`, key: null, status: 'approved', format: 'jpg' });
const mp = (n) => ({ url: `https://randomuser.me/api/portraits/men/${n}.jpg`,   key: null, status: 'approved', format: 'jpg' });

// 10 фото на каждого юзера.
// Первые фото — уже существующие (совпадают с seedTestUsers.js).
// Дополнительные фото — диапазон 26-99, уникальный для каждого.
const photoMap = {
  // === ЖЕНЩИНЫ ===
  'Анастасия': [wp(1),  wp(2),  wp(3),  wp(26), wp(27), wp(28), wp(29), wp(30), wp(31), wp(32)],
  'Мария':     [wp(4),  wp(5),  wp(33), wp(34), wp(35), wp(36), wp(37), wp(38), wp(39), wp(40)],
  'Екатерина': [wp(6),  wp(7),  wp(8),  wp(41), wp(42), wp(43), wp(44), wp(45), wp(46), wp(47)],
  'Юлия':      [wp(9),  wp(10), wp(48), wp(49), wp(50), wp(51), wp(52), wp(53), wp(54), wp(55)],
  'Ольга':     [wp(11), wp(12), wp(13), wp(56), wp(57), wp(58), wp(59), wp(60), wp(61), wp(62)],
  'Дарья':     [wp(14), wp(15), wp(63), wp(64), wp(65), wp(66), wp(67), wp(68), wp(69), wp(70)],
  'Валерия':   [wp(16), wp(17), wp(18), wp(71), wp(72), wp(73), wp(74), wp(75), wp(76), wp(77)],
  'Алина':     [wp(19), wp(20), wp(78), wp(79), wp(80), wp(81), wp(82), wp(83), wp(84), wp(85)],
  'Анна':      [wp(21), wp(22), wp(23), wp(86), wp(87), wp(88), wp(89), wp(90), wp(91), wp(92)],
  'Полина':    [wp(24), wp(25), wp(93), wp(94), wp(95), wp(96), wp(97), wp(98), wp(99), wp(0)],

  // === МУЖЧИНЫ ===
  'Александр': [mp(1),  mp(2),  mp(3),  mp(26), mp(27), mp(28), mp(29), mp(30), mp(31), mp(32)],
  'Дмитрий':   [mp(4),  mp(5),  mp(33), mp(34), mp(35), mp(36), mp(37), mp(38), mp(39), mp(40)],
  'Иван':      [mp(6),  mp(7),  mp(8),  mp(41), mp(42), mp(43), mp(44), mp(45), mp(46), mp(47)],
  'Михаил':    [mp(9),  mp(10), mp(48), mp(49), mp(50), mp(51), mp(52), mp(53), mp(54), mp(55)],
  'Артём':     [mp(11), mp(12), mp(13), mp(56), mp(57), mp(58), mp(59), mp(60), mp(61), mp(62)],
  'Никита':    [mp(14), mp(15), mp(63), mp(64), mp(65), mp(66), mp(67), mp(68), mp(69), mp(70)],
  'Сергей':    [mp(16), mp(17), mp(18), mp(71), mp(72), mp(73), mp(74), mp(75), mp(76), mp(77)],
  'Владимир':  [mp(19), mp(20), mp(78), mp(79), mp(80), mp(81), mp(82), mp(83), mp(84), mp(85)],
  'Роман':     [mp(21), mp(22), mp(23), mp(86), mp(87), mp(88), mp(89), mp(90), mp(91), mp(92)],
  'Павел':     [mp(24), mp(25), mp(93), mp(94), mp(95), mp(96), mp(97), mp(98), mp(99), mp(0)],
};

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB:', MONGO_URI);

    let updated = 0;
    let notFound = 0;

    for (const [name, photos] of Object.entries(photoMap)) {
      // Ищем тестового юзера по имени (без email и deviceId — признак тестового)
      const result = await User.updateOne(
        { name, email: { $exists: false }, deviceId: { $exists: false } },
        { $set: { userPhoto: photos, updatedAt: new Date() } },
      );

      if (result.matchedCount > 0) {
        console.log(`✅ ${name}: обновлено (${photos.length} фото)`);
        updated++;
      } else {
        console.log(`⚠️  ${name}: не найден (пропущен)`);
        notFound++;
      }
    }

    console.log(`\n🎉 Готово! Обновлено: ${updated}, не найдено: ${notFound}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Ошибка:', err);
    process.exit(1);
  }
}

run();
