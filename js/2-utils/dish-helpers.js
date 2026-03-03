/* Dish Helper Functions - Функции для работы с блюдами */
/* Версия: 1.63.0 */

// Проверка: это стейк? (нужны гарнир и соус)
function isSteak(dishName) {
  if (!db || !db.dishes) return false;
  const dish = db.dishes.find(d => d.name === dishName);
  if (!dish) return false;
  
  // Альтернативные стейки
  if (dish.category === 'Альтернативные стейки') return true;
  
  // Стейки из Прайм (по списку названий)
  if (PRIME_STEAKS_WITH_COOKING.includes(dish.name)) return true;
  
  return false;
}

// Проверка: это альтернативный стейк? (без прожарки)
function isAlternativeSteak(dishName) {
  if (!db || !db.dishes) return false;
  const dish = db.dishes.find(d => d.name === dishName);
  if (!dish || !dish.category) return false;
  return STEAK_CATEGORIES_WITHOUT_COOKING.includes(dish.category);
}

// Проверка: это классический стейк? (с прожаркой)
function isClassicSteak(dishName) {
  if (!db || !db.dishes) return false;
  const dish = db.dishes.find(d => d.name === dishName);
  if (!dish) return false;
  
  // Только стейки из списка PRIME_STEAKS_WITH_COOKING требуют прожарку
  return PRIME_STEAKS_WITH_COOKING.includes(dish.name);
}

// Проверка: блюдо в стоп-листе?
function isInStopList(dishName) {
  console.log('isInStopList called with:', dishName, 'current stopList:', JSON.stringify(stopList));
  if (!dishName || stopList.length === 0) {
    console.log('Early return: dishName empty or stopList empty');
    return false;
  }
  const nameLower = (dishName || '').toLowerCase().trim();
  const result = stopList.some(item => {
    // item может быть строкой или объектом с полем dishName
    const itemName = typeof item === 'string' ? item : (item.dishName || item.name || '');
    const itemLower = (itemName || '').toLowerCase().trim();
    const match = itemLower === nameLower;
    console.log(`Comparing "${itemLower}" with "${nameLower}": ${match}`);
    return match;
  });
  console.log('isInStopList result:', result);
  return result;
}

// Проверка: это напиток из бара?
function isBarItem(order) {
  const drinkKeywords = [
    'напиток', 'сок', 'чай', 'кофе', 'вода', 'лимонад', 'компот', 'морс', 'коктейль',
    'пиво', 'вино', 'водка', 'коньяк', 'виски', 'ром', 'джин', 'текила', 'шампанское',
    'кола', 'пепси', 'спрайт', 'фанта', 'миринда', 'энергетик', 'газировка',
    'молоко', 'кефир', 'йогурт', 'ряженка', 'снежок', 'тан', 'айран'
  ];
  
  return drinkKeywords.some(keyword => 
    order.itemName.toLowerCase().includes(keyword)
  );
}
