const User = require('../models/userModel'); // поправьте путь, если отличается

// Базовая нормализация: NFKC, сжатие пробелов, сжатие повторных дефисов/апострофов, трим
function normalizeInput(s) {
  if (typeof s !== 'string') return '';
  return s
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    // .replace(/[-'’]{2,}/g, (m) => m<a href="" class="citation-link" target="_blank" style="vertical-align: super; font-size: 0.8em; margin-left: 3px;">[0]</a>)
    .trim();
}

// Разрешаем буквы (латиница/кириллица и распространённые акцентированные символы), пробелы, дефис, апостроф и точку
const LOCATION_REGEX = /^[A-Za-zА-Яа-яЁёІіЇїЄєĞğÜüŞşÇçÖöÀ-ÖØ-öø-ÿ'’.\-\s]+$/;

// Приведение к единому виду (Title Case) с учётом дефисов и апострофов:
// "киев" -> "Киев"
// "НЬЮ-ЙОРК" -> "Нью-Йорк"
// Используем локаль 'ru' по умолчанию (работает и для латиницы).
function toTitleCase(str, locale = 'ru') {
  // Разбиваем по пробелам, затем внутри токена по дефису и апострофу, сохраняя разделители
  const splitBy = /([-'’])/g;
  return str
    .split(' ')
    .map(word => {
      if (!word) return word;
      const parts = word.split(splitBy); // вернёт буквы и разделители
      for (let i = 0; i < parts.length; i++) {
        const seg = parts[i];
        if (seg === '-' || seg === "'" || seg === '’') continue;
        if (!seg) continue;
        const lower = seg.toLocaleLowerCase(locale);
        // Первая буква в верхний регистр, остальное в нижний
        parts[i] = lower.charAt(0).toLocaleUpperCase(locale) + lower.slice(1);
      }
      return parts.join('');
    })
    .join(' ');
}

// Полная валидация + нормализация и приведение к Title Case
function validateAndCanonicalizeLocation(raw) {
  const value = normalizeInput(raw);
  if (value.length < 2 || value.length > 50) {
    return { valid: false, value, reason: 'length' };
  }
  if (!LOCATION_REGEX.test(value)) {
    return { valid: false, value, reason: 'chars' };
  }
  // Приводим к каноническому виду
  const canonical = toTitleCase(value, 'ru');
  // После приведения снова проверим длину/символы (на всякий)
  if (canonical.length < 2 || canonical.length > 50 || !LOCATION_REGEX.test(canonical)) {
    return { valid: false, value: canonical, reason: 'canonical_invalid' };
  }
  return { valid: true, value: canonical };
}

exports.saveUserLocation = async (req, res) => {
  try {
    // auth middleware должен положить id пользователя в req
    const userId =
      req.user?._id ||
      req.user?.id ||
      req.auth?.userId ||
      req.regUserId ||
      req.userId;

    if (!userId) {
      return res
        .status(401)
        .json({ message: 'Unauthorized: user id not found in request context' });
    }

    const payload = req.body && req.body.payload ? req.body.payload : {};
    const { location } = payload; // ожидаем { location: 'Город/посёлок' }

    const { valid, value, reason } = validateAndCanonicalizeLocation(location);
    if (!valid) {
      let message = 'Некорректное местоположение';
      if (reason === 'length') message = 'Длина местоположения должна быть от 2 до 50 символов';
      else if (reason === 'chars') message = 'Местоположение содержит недопустимые символы';
      return res.status(400).json({ message });
    }

    // Обновляем пользователя каноническим значением
    const update = {
      userLocation: value, // храним в едином формате Title Case
      // Дополнительно можно хранить и нижний регистр для быстрых сравнений/поиска:
      // userLocationLower: value.toLocaleLowerCase('ru'),
    };

    const updated = await User.findByIdAndUpdate(userId, update, {
      new: true,
      runValidators: true,
    }).lean();

    if (!updated) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Санитизация
    delete updated.confirmationCode;

    return res.json({ ok: true, user: updated });
  } catch (err) {
    // Если в схеме стоит unique: true для userLocation — сработает 11000 при совпадении городов у разных пользователей
    if (err?.code === 11000) {
      return res.status(409).json({
        message:
          'Duplicate key error: значение userLocation уже используется. Уберите unique с поля userLocation, чтобы разные пользователи могли указывать один и тот же город.',
      });
    }
    console.error('saveUserLocation error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
