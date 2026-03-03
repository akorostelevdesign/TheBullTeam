/* Helper Functions - Вспомогательные функции */
/* Версия: 1.63.0 */

// Генерация уникального ID для заказов
function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (crypto.getRandomValues(new Uint8Array(1))[0] & 15) >> 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Форматирование денег с сокращениями для больших чисел
function formatMoney(amount) {
  if (amount >= 1000000) {
    // Миллионы: 1.5М ₽
    const millions = amount / 1000000;
    return `${millions % 1 === 0 ? millions : millions.toFixed(1)}М ₽`;
  } else if (amount >= 100000) {
    // Сотни тысяч: 150К ₽
    const thousands = Math.round(amount / 1000);
    return `${thousands}К ₽`;
  } else if (amount >= 10000) {
    // Десятки тысяч с пробелом: 15 000 ₽
    return `${amount.toLocaleString('ru-RU')} ₽`;
  } else {
    // Обычные: 1500 ₽
    return `${amount.toLocaleString('ru-RU')} ₽`;
  }
}

// Получение звёзд по прогрессу (для геймификации)
function getStars(progress) {
  const stars = Math.floor(progress / 20);
  return '⭐'.repeat(stars) + '☆'.repeat(5 - stars);
}

// Перевод роли на русский язык
function translateRole(role) {
  const roleTranslations = {
    'waiter': 'Официант',
    'manager': 'Менеджер', 
    'admin': 'Администратор',
    'Официант': 'Официант',
    'Менеджер': 'Менеджер',
    'Администратор': 'Администратор'
  };
  return roleTranslations[role] || role || 'Официант';
}

// Проверка авторизации (заглушка, так как AUTH отключен)
function isAuthenticated() {
  return false; // Всегда false, так как авторизация отключена
}

// Получение версии приложения
function getAppVersion() {
  return APP_VERSION; // Из constants.js
}

// Функция для получения ключа с userId (для персональных данных)
function getUserStorageKey(baseKey, userId) {
  if (!userId) {
    // Если userId нет, используем старый ключ (для обратной совместимости)
    return baseKey;
  }
  return `${baseKey}.user${userId}`;
}

// Расчёт цены блюда из строки
function calculatePrice(priceString, category) {
  if (!priceString) return '—';
  
  // Extract base prices from string like "350/400 рублей"
  const prices = priceString.match(/(\d+)/g);
  if (!prices || prices.length === 0) return priceString;
  
  // If multiple prices, use first one
  return prices[0];
}
