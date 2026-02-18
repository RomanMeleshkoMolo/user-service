const User = require('../models/userModel');

// Ожидает в body: { payload: { id: string, title: string, icon: string } }
// Сохраняет выбор онбординга в поле lookingFor
const saveUserInterest = async (req, res) => {
  try {
    const userId =
      (req.user && (req.user.id || req.user.sub || req.user.userId)) || null;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // ВАЖНО: достаём из req.body.payload
    const payload = req.body && req.body.payload ? req.body.payload : {};
    let { id, title, icon } = payload;

    id    = typeof id    === 'string' ? id.trim()    : '';
    title = typeof title === 'string' ? title.trim() : '';
    icon  = typeof icon  === 'string' ? icon.trim()  : '';

    if (!title) {
      return res.status(400).json({ message: 'Interest title is required' });
    }
    if (!icon) {
      return res.status(400).json({ message: 'Interest icon is required' });
    }

    // Сохраняем в lookingFor (а не в interests)
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { lookingFor: { id, title, icon } } },
      { new: true, runValidators: true }
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
