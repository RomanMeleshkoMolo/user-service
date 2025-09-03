const User = require('../models/userModel'); // путь к твоей модели

// req.user.id - идентификатор пользователя из токена
// req.body.title - строка, выбранный заголовок интереса
const saveUserInterest = async (req, res) => {
  try {
    const userId = (req.user && (req.user.id || req.user.sub || req.user.userId)) || null;

    const { title } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!title) {
      return res.status(400).json({ message: 'Interest title is required' });
    }

    // Найдем пользователя
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Добавить или заменить: здесь можно хранить как один элемент или несколько.
    // Ниже реализовано как замена текущего первого элемента, если нужен один выбор.
    // Если хочешь хранить несколько, используй push и избегай дублей.
    user.interests = [title];

    await user.save();

    return res.json({ message: 'Interest saved', user });
  } catch (err) {
    console.error('Error saving user interest:', err);
    return res.status(500).json({ message: err.message || 'Server error' });
  }
};

module.exports = { saveUserInterest };
