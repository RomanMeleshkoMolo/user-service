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
        // логируем отсутствие токена
        console.log('[authOnboarding] No token provided. optional=true -> proceeding with req.user=null');
        return next();
      }
      console.warn('[authOnboarding] No token provided. Access denied (required token).');
      return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
      // Распаковка payload
      const payload = jwt.verify(token, process.env.JWT_SECRET);

      // Логируем распакованный payload для диагностики
      console.log('[authOnboarding] JWT payload:', payload);

      // Валидация структуры payload
      const hasSub = payload && (typeof payload.sub === 'string' || typeof payload.sub === 'number');
      const hasScope = payload && typeof payload.scope === 'string';
      const hasOnboardingComplete = 'onboardingComplete' in payload;

      if (!hasSub) {
        // console.error('[authOnboarding] Invalid token payload: missing sub');
        return res.status(401).json({ message: 'Invalid token: missing user id' });
      }

      if (!hasScope) {
        // console.error('[authOnboarding] Invalid token payload: missing scope');
        return res.status(401).json({ message: 'Invalid token: missing scope' });
      }

      // Для онбординга ожидаем спец. scope
      if (payload.scope !== 'onboarding') {
        // console.warn('[authOnboarding] Forbidden: wrong scope', { scope: payload.scope });
        return res.status(403).json({ message: 'Forbidden: wrong scope' });
      }

      // Проставляем req.user
      req.user = {
        id: payload.sub,
        onboardingComplete: !!payload.onboardingComplete,
        scope: payload.scope,
      };

      // логируем установленного пользователя
      console.log('[authOnboarding] req.user set:', req.user);

      return next();
    } catch (e) {
      console.error('[authOnboarding] Token verification failed:', e.message);
      return res.status(401).json({ message: 'Invalid token' });
    }
  };
}

// Готовые варианты
const authOnboardingRequired = authOnboarding({ optional: false });
const authOnboardingOptional = authOnboarding({ optional: true });

module.exports = {
  authOnboardingRequired,
  authOnboardingOptional,
};
