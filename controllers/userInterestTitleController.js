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

    // Нормализация поля interests к объекту
    // Теперь interests это одиночный объект { title, icon }
    user.interests = { title, icon };

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
