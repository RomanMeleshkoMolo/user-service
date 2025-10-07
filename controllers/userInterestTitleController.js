// const User = require('../models/userModel'); // путь к твоей модели
// const { getUserById } = require('../services/userService');
//
// // req.user.id - идентификатор пользователя из токена
// // req.body.title - строка, выбранный заголовок интереса
// const saveUserInterest = async (req, res) => {
//   try {
//     const userId = (req.user && (req.user.id || req.user.sub || req.user.userId)) || null;
//
//     const { title } = req.body;
//
//     if (!userId) {
//       return res.status(401).json({ message: 'User not authenticated' });
//     }
//
//     if (!title) {
//       return res.status(400).json({ message: 'Interest title is required' });
//     }
//
//     // Найдем пользователя
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }
//
//     // Добавить или заменить: здесь можно хранить как один элемент или несколько.
//     // Ниже реализовано как замена текущего первого элемента, если нужен один выбор.
//     // Если хочешь хранить несколько, используй push и избегай дублей.
//     user.interests = [title];
//
//     await user.save();
//
//     return res.json({ message: 'Interest saved', user });
//   } catch (err) {
//     console.error('Error saving user interest:', err);
//     return res.status(500).json({ message: err.message || 'Server error' });
//   }
// };
//
// module.exports = { saveUserInterest };


const User = require('../models/userModel');
const { getUserById } = require('../services/userService');

// Ожидает в body: { title: string, icon: string }
// Сохраняет в user.interests элементы формата { title, icon }
const saveUserInterest = async (req, res) => {
  try {
    const userId =
      (req.user && (req.user.id || req.user.sub || req.user.userId)) || null;

    const { title, icon } = req.body || {};

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

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

    // Инициализируем массив интересов, если его нет
    if (!Array.isArray(user.interests)) {
      user.interests = [];
    }

    // Нормализуем старые данные: если раньше были строки — конвертируем в объекты
    // Пример: ["Найти любовь"] -> [{ title: "Найти любовь", icon: "" }]
    user.interests = user.interests.map((it) =>
      typeof it === 'string' ? { title: it, icon: '' } : it
    );

    // Поиск по title (без учета регистра)
    const idx = user.interests.findIndex(
      (it) =>
        typeof it?.title === 'string' &&
        it.title.trim().toLowerCase() === title.trim().toLowerCase()
    );

    const newItem = { title, icon };

    if (idx >= 0) {
      // Уже есть такой title — обновим icon (и title на случай разных регистров)
      user.interests[idx] = newItem;
    } else {
      // Нет дубля — добавим
      user.interests.push(newItem);
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

