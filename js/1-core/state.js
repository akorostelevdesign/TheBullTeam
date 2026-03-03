/* Global State - Глобальное состояние приложения */
/* Версия: 1.64.2 */

// Заказы по столам
let tableOrders = {};

// Активные столы
let activeTables = [];

// Названия столов
let tableNames = {};

// История закрытых заказов
let orderHistory = [];

// Метаданные (последняя очистка и т.д.)
let meta = {};

// Профиль пользователя
let profile = {};

// Смены официанта
let shifts = {};

// База данных блюд
let db = null;

// Группировка категорий блюд
let categoryGrouping = {
  drinks: true,
  cold: true,
  hot: true,
  dessert: true
};

// Режим курсов: 'auto' или 'manual'
let courseMode = 'auto';

// Прогресс обучения
let learningProgress = {};

// Уровень обучения
let learningLevel = 1;

// Опыт обучения
let learningXP = 0;

// Режим отображения стола: 'search' или 'todo'
let tableMode = 'todo';

// Текущая страница
let currentPage = 'tables';

// PWA установка
let deferredPrompt = null;

// Настройки дополнительных продаж (цепочки блюд)
let dishChainSettings = {
  steaks: {
    garnishes: true, // Рекомендовать гарниры
    sauces: true     // Рекомендовать соусы
  },
  tea: {
    mint: true,      // Мята
    honey: true,     // Мёд
    thyme: true,     // Чабрец
    sugar: true,     // Сахар
    lemon: true      // Лимон
  },
  tartare: {
    egg: true,       // Яйцо перепелиное
    croutons: true,  // Крутоны из багета
    bacon: true      // Чипсы из бекона
  },
  cocktails: {
    double: true     // Двойная порция
  },
  vitello: {
    focaccia: true   // Фоккача с розмарином
  },
  beer: {
    fries: true,     // Картофель фри (все виды)
    shrimp: true,    // Креветки в кляре
    croutons: true,  // Чесночные гренки
    pilpil: true     // Креветки пиль-пиль
  }
};

// Стоп-лист блюд
let stopList = [];

// DOM элементы
const root = document.getElementById('app');
const installBtn = document.getElementById('btn-install');

// AUTH DISABLED: Auth session state commented out
// let authSession = null;
