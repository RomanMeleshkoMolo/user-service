const User = require('../models/userModel');

// Ожидает в body: { payload: { title: string, icon: string } }
// Гарантирует, что user.interests содержит ровно один объект { title, icon }
const saveUserInterest = async (req, res) => {
  try {
    const userId =
      (req.user && (req.user.id || req.user.sub || req.user.userId)) || null;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // ВАЖНО: достаём из req.body.payload
    const payload = req.body && req.body.payload ? req.body.payload : {};
    let { title, icon } = payload;

    title = typeof title === 'string' ? title.trim() : '';
    icon = typeof icon === 'string' ? icon.trim() : '';

    if (!title) {
      return res.status(400).json({ message: 'Interest title is required' });
    }
    if (!icon) {
      return res.status(400).json({ message: 'Interest icon is required' });
    }

    // Обновляем interests одним запросом
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { interests: { title, icon } } },
      { new: true, runValidators: true } // вернёт обновлённый документ и применит валидации схемы
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ message: 'Interest saved', user: updatedUser });
  } catch (err) {
    console.error('Error saving user interest:', err);
    return res.status(500).json({ message: err.message || 'Server error' });
  }
};

module.exports = { saveUserInterest };
