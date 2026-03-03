/* Extra Dishes Configuration */
/* Конфигурация дополнительных блюд и добавок */

const EXTRA_DISHES_CONFIG = {
  // Все доступные добавки для поиска
  allExtras: [
    { name: 'Мёд', rkeeper: '-', price: '50', emoji: '🍯', category: 'Добавки' },
    { name: 'Мята', rkeeper: '-', price: '30', emoji: '🌿', category: 'Добавки' },
    { name: 'Чабрец', rkeeper: '-', price: '30', emoji: '🌿', category: 'Добавки' },
    { name: 'Яйцо перепелиное', rkeeper: '-', price: '100', emoji: '🥚', category: 'Добавки' },
    { name: 'Лимон', rkeeper: '-', price: '40', emoji: '🍋', category: 'Добавки' },
    { name: 'Имбирь', rkeeper: '-', price: '40', emoji: '🫚', category: 'Добавки' },
    { name: 'Корица', rkeeper: '-', price: '30', emoji: '🌰', category: 'Добавки' },
    { name: 'Сливки', rkeeper: '-', price: '50', emoji: '🥛', category: 'Добавки' },
    { name: 'Сироп карамельный', rkeeper: '-', price: '50', emoji: '🍯', category: 'Добавки' },
    { name: 'Сироп ванильный', rkeeper: '-', price: '50', emoji: '🍦', category: 'Добавки' },
    { name: 'Маршмеллоу', rkeeper: '-', price: '60', emoji: '☁️', category: 'Добавки' },
  ],
  
  // Быстрый выбор для конкретных блюд (по названию или категории)
  quickSelect: {
    // Для чая - показываем быстрый выбор
    'Чай': ['Мёд', 'Мята', 'Имбирь', 'Корица', 'Чабрец', 'Лимон'],
    'Чай черный': ['Мёд', 'Мята', 'Имбирь', 'Корица', 'Чабрец', 'Лимон'],
    'Чай зеленый': ['Мёд', 'Мята', 'Имбирь', 'Корица', 'Чабрец', 'Лимон'],
    'Чай фруктовый': ['Мёд', 'Мята', 'Имбирь', 'Корица', 'Чабрец', 'Лимон'],
    
    // Для кофе
    'Капучино': ['Сливки', 'Сироп карамельный', 'Сироп ванильный', 'Корица', 'Маршмеллоу'],
    'Латте': ['Сливки', 'Сироп карамельный', 'Сироп ванильный', 'Корица', 'Маршмеллоу'],
    'Американо': ['Сливки', 'Сироп карамельный', 'Сироп ванильный'],
    'Эспрессо': ['Сливки', 'Лимон'],
    'Раф': ['Сироп карамельный', 'Сироп ванильный', 'Корица'],
    
    // Для тар-тара
    'Тартар из говядины': ['Яйцо перепелиное'],
    'Тар-Тар из авокадо с креветками': ['Яйцо перепелиное', 'Лимон'],
  },
  
  // Функция для получения быстрых добавок для блюда
  getQuickExtrasForDish: function(dishName) {
    // Проверяем точное совпадение
    if (this.quickSelect[dishName]) {
      return this.allExtras.filter(extra => 
        this.quickSelect[dishName].includes(extra.name)
      );
    }
    
    // Проверяем частичное совпадение (например, "Чай черный с бергамотом" содержит "Чай")
    for (const key in this.quickSelect) {
      if (dishName.includes(key)) {
        return this.allExtras.filter(extra => 
          this.quickSelect[key].includes(extra.name)
        );
      }
    }
    
    return null; // Нет быстрого выбора для этого блюда
  }
};

// Export for use in app.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EXTRA_DISHES_CONFIG;
}
