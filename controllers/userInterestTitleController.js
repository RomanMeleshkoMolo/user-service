const User = require('../models/userModel');

// Ожидает в body: { title: string, icon: string }
// Гарантирует, что user.interests содержит ровно один объект { title, icon }
const saveUserInterest = async (req, res) => {
  try {
    const userId =
      (req.user && (req.user.id || req.user.sub || req.user.userId)) || null;

    let { title, icon } = req.body || {};

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    title = typeof title === 'string' ? title.trim() : '';
    icon = typeof icon === 'string' ? icon.trim() : '';

    if (!title) {
      return res.status(400).json({ message: 'Interest title is required' });
    }

    if (!icon) {
      return res.status(400).json({ message: 'Interest icon is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Нормализация поля interests к массиву
    if (!Array.isArray(user.interests)) {
      user.interests = [];
    }

    // Если раньше хранились строки — конвертируем первый элемент в объект
    // и игнорируем остальные (т.к. теперь допускается только один объект)
    if (user.interests.length > 0) {
      const first = user.interests;
      const normalizedFirst =
        typeof first === 'string' ? { title: first, icon: '' } : first;

      // Обновляем только первый объект
      user.interests = [{ title, icon }];
    } else {
      // Если ничего не было — устанавливаем первый и единственный элемент
      user.interests = [{ title, icon }];
    }

    await user.save();

    return res.json({ message: 'Interest saved', user });
  } catch (err) {
    console.error('Error saving user interest:', err);
    return res
      .status(500)
      .json({ message: err.message || 'Server error' });
  }
};

module.exports = { saveUserInterest };
