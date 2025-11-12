const User = require('../models/userModel'); // поправьте путь, если отличается

// Пересчёт возраста по дате рождения
function calcAge(birthDate) {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

// Безопасный парсинг 'YYYY-MM-DD' с проверкой корректности
function parseYMD(ymd) {
  if (typeof ymd !== 'string') return null;
  const match = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const [_, y, m, d] = match;
  const year = Number(y);
  const month = Number(m);
  const day = Number(d);
  const dt = new Date(year, month - 1, day);
  if (
    dt.getFullYear() !== year ||
    dt.getMonth() !== month - 1 ||
    dt.getDate() !== day
  ) {
    return null;
  }
  return dt;
}

exports.saveUserBirthday = async (req, res) => {
  try {
    // authOnboardingRequired должен устанавливать идентификатор пользователя
    // Попробуем несколько популярных мест
    const userId =
      req.user?._id ||
      req.user?.id ||
      req.auth?.userId ||
      req.regUserId ||
      req.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized: user id not found in request context' });
    }

    const payload = req.body && req.body.payload ? req.body.payload : {};
    const { birthDate, birthDateParts } = payload;

    // Валидируем и парсим дату
    const dateObj = parseYMD(birthDate);
    if (!dateObj) {
      return res.status(400).json({ message: 'Invalid birthDate. Expected format YYYY-MM-DD' });
    }

    // Пересчитываем возраст на бэке (не доверяем клиенту)
    const age = calcAge(dateObj);
    if (age < 0 || age > 120) {
      return res.status(400).json({ message: 'Unrealistic age calculated from birthDate' });
    }

    // Что хранить:
    // - Рекомендую хранить userBirthday как Date (тип Date в Mongoose),
    //   а age как Number. Возраст можно пересчитывать динамически, но
    //   если нужно поле — храните число.
    // Если оставляете типы как String — преобразуйте к строкам.
    const update = {
      userBirthday: birthDate, // если поле Date; если String — используйте birthDate
      age: age,              // если Number; если String — String(age)
    };

    // Если вам нужно сохранить и parts — можно расширить схему под это
    if (birthDateParts && typeof birthDateParts === 'object') {
      // пример: update.birthDateParts = birthDateParts;
    }

    const updated = await User.findByIdAndUpdate(
      userId,
      update,
      { new: true, runValidators: true }
    ).lean();

    if (!updated) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Санитизация ответа (на случай наличия чувствительных полей)
    delete updated.confirmationCode;

    return res.json({ ok: true, user: updated });
  } catch (err) {
    // Обработка ошибки уникального индекса (если ещё не убрали unique)
    if (err?.code === 11000) {
      return res.status(409).json({ message: 'Duplicate key error (unique index). Remove unique from age/userBirthday indexes.' });
    }
    console.error('saveUserInterest error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
