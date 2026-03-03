/* Order Manager - Управление заказами */
/* Версия: 1.63.0 */

// Function to categorize order for sorting
function getCategoryGroup(order) {
  const category = (order.category || '').toLowerCase();
  
  // 1. Напитки - ТОЛЬКО из bar_drinks (проверяем по source === 'bar')
  if (db && db.dishes) {
    const barDrink = db.dishes.find(d => 
      d.source === 'bar' && 
      (d.name === order.itemName || d.R_keeper === order.rkeeper)
    );
    if (barDrink) {
      return 1; // Напитки из бара
    }
  }
  
  // Проверка по категории для напитков
  const barCategories = [
    'безалкогольные напитки', 'алкогольные напитки', 'коктейли', 
    'вино', 'пиво', 'крепкий алкоголь', 'кофе', 'чай'
  ];
  if (barCategories.some(cat => category.includes(cat.toLowerCase()))) {
    return 1; // Напитки
  }
  
  // 2. Холодные блюда - Закуски, Гарниры, Салаты, Супы
  const coldDishCategories = [
    'закуски', 'салат', 'супы', 'гарниры', 'гарнир'
  ];
  if (coldDishCategories.some(cat => category === cat || category.includes(cat))) {
    return 2; // Холодные блюда
  }
  
  // 4. Десерты - только категория "Десерты"
  if (category === 'десерты') {
    return 4; // Десерты
  }
  
  // 3. Горячие блюда - Пицца, Хоспер, Разное, Бургеры, Сеты, Альтернативные стейки, Прайм
  const hotDishCategories = [
    'римская пицца', 'хоспер', 'разное', 'бургеры', 'сеты', 
    'альтернативные стейки', 'прайм'
  ];
  if (hotDishCategories.some(cat => category === cat || category.includes(cat))) {
    return 3; // Горячие блюда
  }
  
  // По умолчанию - горячие блюда (если не попало ни в одну категорию)
  return 3; // Горячие блюда
}

// Check if category grouping is enabled
function isCategoryGroupEnabled(groupId) {
  // В ручном режиме группировка отключена
  if (courseMode === 'manual') return false;
  
  const cfg = CATEGORY_CONFIG[groupId];
  if (!cfg) return true;
  return categoryGrouping[cfg.key] !== false;
}

// Sort table orders by category
function sortTableOrdersByCategory(tableNum) {
  if (!tableOrders[tableNum] || tableOrders[tableNum].length === 0) {
    return;
  }
  
  // Ensure all orders have addedAt timestamp
  const now = Date.now();
  tableOrders[tableNum].forEach((order, index) => {
    if (!order.addedAt) {
      // If no addedAt, use createdAt or assign based on current position
      order.addedAt = order.createdAt || (now - (tableOrders[tableNum].length - index) * 1000);
    }
    
    const baseGroup = getCategoryGroup(order);
    const groupEnabled = isCategoryGroupEnabled(baseGroup);
    order._categoryGroup = baseGroup;
    order._categoryEnabled = groupEnabled;
    order._sortGroup = groupEnabled ? baseGroup : 1000;
    order._statusRank = order.status === 'served' ? 2 : (order.status === 'rkeeper' ? 1 : 0);
  });
  
  // Sort: category group -> status -> newest first
  tableOrders[tableNum].sort((a, b) => {
    // 1. Sort by category group (1=drinks, 2=cold, 3=hot, 4=dessert, 1000=disabled)
    if (a._sortGroup !== b._sortGroup) {
      return a._sortGroup - b._sortGroup;
    }
    
    // 2. Within same category, sort by status (0=no status first, 1=rkeeper, 2=served last)
    if (a._statusRank !== b._statusRank) {
      return a._statusRank - b._statusRank;
    }
    
    // 3. Within same status, newest first (higher timestamp = newer = comes first)
    return (b.addedAt || 0) - (a.addedAt || 0);
  });
  
  saveTableOrders();
}

// Sort table orders by status only
function sortTableOrdersByStatus(tableNum) {
  if (!tableOrders[tableNum] || tableOrders[tableNum].length === 0) {
    return;
  }
  
  tableOrders[tableNum].forEach((order) => {
    // 0 = no status (white), 1 = rkeeper, 2 = served
    order._statusRank = order.status === 'served' ? 2 : (order.status === 'rkeeper' ? 1 : 0);
  });
  
  // Sort only by status, preserve relative order within same status (stable sort)
  tableOrders[tableNum].sort((a, b) => {
    return a._statusRank - b._statusRank;
  });
}

// Reapply category grouping to all tables
function reapplyCategoryGroupingToAllTables() {
  Object.keys(tableOrders || {}).forEach(key => {
    const tableNum = Number(key);
    if (!Number.isNaN(tableNum)) {
      sortTableOrdersByCategory(tableNum);
    }
  });
}

// TODO: Перенести функции управления заказами из app.js:
// - addDishToTable() - добавление блюда в заказ
// - removeDishFromTable() - удаление блюда
// - changeQuantity() - изменение количества (+1 или -1)
// - toggleTakeaway() - переключение "Навынос"
// - toggleOrderStatus() - переключение статуса (R_keeper, Вынесен)
// - updateOrderNote() - обновление заметки к блюду
