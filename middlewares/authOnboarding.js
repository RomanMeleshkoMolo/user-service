const jwt = require('jsonwebtoken');

/**
 * authOnboarding({ optional })
 * - optional=false (по умолч.): токен обязателен, иначе 401
 * - optional=true: если токена нет — пропускаем (req.user=null), если есть — валидируем
 */
function authOnboarding({ optional = false } = {}) {
  return function (req, res, next) {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

    if (!token) {
      if (optional) {
        req.user = null; // новый пользователь без токена может начать регистрацию
        return next();
      }
      return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);

      // Для онбординга ожидаем спец. scope
      if (payload.scope !== 'onboarding') {
        return res.status(403).json({ message: 'Forbidden: wrong scope' });
      }

      req.user = {
        id: payload.sub,
        onboardingComplete: !!payload.onboardingComplete,
        scope: payload.scope,
      };

      return next();
    } catch (e) {
      return res.status(401).json({ message: 'Invalid token' });
    }
  };
}

// Готовые варианты
const authOnboardingRequired = authOnboarding({ optional: false });
const authOnboardingOptional = authOnboarding({ optional: true });

module.exports = {
  authOnboarding,
  authOnboardingRequired,
  authOnboardingOptional,
};


