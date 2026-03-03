/* Storage Functions - Функции работы с localStorage */
/* Версия: 1.63.0 */

// Загрузка всех данных из localStorage при старте приложения
function loadState() {
  // AUTH DISABLED: Загрузка authSession закомментирована
  // try { 
  //   authSession = JSON.parse(localStorage.getItem(STORAGE_KEYS.authSession) || 'null'); 
  // } catch { 
  //   authSession = null; 
  // }
  
  // Получаем userId для персональных данных (пока null, так как AUTH отключен)
  const userId = null; // authSession?.userId || authSession?.id || null;
  
  // Загружаем персональные данные с userId
  try { tableOrders = JSON.parse(localStorage.getItem(getUserStorageKey(STORAGE_KEYS.tableOrders, userId)) || '{}'); } catch { tableOrders = {}; }
  try { activeTables = JSON.parse(localStorage.getItem(getUserStorageKey(STORAGE_KEYS.tables, userId)) || '[]'); } catch { activeTables = []; }
  try { tableMode = localStorage.getItem(getUserStorageKey(STORAGE_KEYS.tableMode, userId)) || 'todo'; } catch { tableMode = 'todo'; }
  try { tableNames = JSON.parse(localStorage.getItem(getUserStorageKey(STORAGE_KEYS.tableNames, userId)) || '{}'); } catch { tableNames = {}; }
  try { orderHistory = JSON.parse(localStorage.getItem(getUserStorageKey(STORAGE_KEYS.orderHistory, userId)) || '[]'); } catch { orderHistory = []; }
  try { meta = JSON.parse(localStorage.getItem(getUserStorageKey(STORAGE_KEYS.meta, userId)) || '{}'); } catch { meta = {}; }
  try { shifts = JSON.parse(localStorage.getItem(getUserStorageKey(STORAGE_KEYS.shifts, userId)) || '{}'); } catch { shifts = {}; }
  
  // Загружаем общие данные (без userId)
  try { currentPage = localStorage.getItem(STORAGE_KEYS.activePage) || 'tables'; } catch { currentPage = 'tables'; }
  try { profile = JSON.parse(localStorage.getItem(STORAGE_KEYS.profile) || '{}'); } catch { profile = {}; }
  try {
    const storedGrouping = JSON.parse(localStorage.getItem(STORAGE_KEYS.categoryGrouping) || 'null');
    if (storedGrouping && typeof storedGrouping === 'object') {
      categoryGrouping = { ...categoryGrouping, ...storedGrouping };
    }
  } catch { /* ignore */ }
  normalizeCategoryGrouping();
  
  // Загружаем режим курсов
  try { courseMode = localStorage.getItem(STORAGE_KEYS.courseMode) || 'auto'; } catch { courseMode = 'auto'; }
  
  // Загружаем данные обучения (персональные данные)
  try { learningProgress = JSON.parse(localStorage.getItem(getUserStorageKey(STORAGE_KEYS.learningProgress, userId)) || '{}'); } catch { learningProgress = {}; }
  try { learningLevel = parseInt(localStorage.getItem(getUserStorageKey(STORAGE_KEYS.learningLevel, userId)) || '1') || 1; } catch { learningLevel = 1; }
  try { learningXP = parseInt(localStorage.getItem(getUserStorageKey(STORAGE_KEYS.learningXP, userId)) || '0') || 0; } catch { learningXP = 0; }
  
  // Загружаем тёмную тему
  try {
    const darkMode = localStorage.getItem(STORAGE_KEYS.darkMode) === 'true';
    if (darkMode) {
      document.documentElement.classList.add('dark');
    }
  } catch {}
  
  // Загружаем настройки дополнительных продаж
  try {
    const storedChain = JSON.parse(localStorage.getItem(STORAGE_KEYS.dishChain) || 'null');
    if (storedChain && typeof storedChain === 'object') {
      // Объединяем настройки: для каждой категории объединяем вложенные объекты
      Object.keys(dishChainSettings).forEach(category => {
        if (storedChain[category]) {
          dishChainSettings[category] = { ...dishChainSettings[category], ...storedChain[category] };
        }
      });
      // Добавляем новые категории из storedChain, если они есть
      Object.keys(storedChain).forEach(category => {
        if (!dishChainSettings[category]) {
          dishChainSettings[category] = storedChain[category];
        }
      });
    }
  } catch { /* ignore */ }
  
  // Загружаем стоп-лист
  try {
    const rawStopList = localStorage.getItem(STORAGE_KEYS.stopList);
    console.log('Raw stop list from localStorage:', rawStopList);
    stopList = JSON.parse(rawStopList || '[]');
    console.log('Stop list loaded and parsed:', stopList);
  } catch (e) { 
    stopList = []; 
    console.log('Stop list load error:', e);
  }
}

// Сохранение заказов столов
function saveTableOrders() { 
  const userId = null; // authSession?.userId || authSession?.id || null;
  localStorage.setItem(getUserStorageKey(STORAGE_KEYS.tableOrders, userId), JSON.stringify(tableOrders)); 
}

// Сохранение списка активных столов
function saveTables() { 
  const userId = null; // authSession?.userId || authSession?.id || null;
  localStorage.setItem(getUserStorageKey(STORAGE_KEYS.tables, userId), JSON.stringify(activeTables)); 
}

// Сохранение режима отображения стола
function saveTableMode() { 
  const userId = null; // authSession?.userId || authSession?.id || null;
  localStorage.setItem(getUserStorageKey(STORAGE_KEYS.tableMode, userId), tableMode); 
}

// Сохранение названий столов
function saveTableNames() { 
  const userId = null; // authSession?.userId || authSession?.id || null;
  localStorage.setItem(getUserStorageKey(STORAGE_KEYS.tableNames, userId), JSON.stringify(tableNames)); 
}

// Сохранение истории заказов
function saveOrderHistory() { 
  const userId = null; // authSession?.userId || authSession?.id || null;
  localStorage.setItem(getUserStorageKey(STORAGE_KEYS.orderHistory, userId), JSON.stringify(orderHistory)); 
}

// Сохранение метаданных
function saveMeta() { 
  const userId = null; // authSession?.userId || authSession?.id || null;
  localStorage.setItem(getUserStorageKey(STORAGE_KEYS.meta, userId), JSON.stringify(meta)); 
}

// Сохранение профиля
function saveProfile() { 
  localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profile)); 
}

// Сохранение смен
function saveShifts() { 
  const userId = null; // authSession?.userId || authSession?.id || null;
  localStorage.setItem(getUserStorageKey(STORAGE_KEYS.shifts, userId), JSON.stringify(shifts)); 
}

// Сохранение группировки категорий
function saveCategoryGrouping() { 
  localStorage.setItem(STORAGE_KEYS.categoryGrouping, JSON.stringify(categoryGrouping)); 
}

// Сохранение режима курсов
function saveCourseMode() { 
  localStorage.setItem(STORAGE_KEYS.courseMode, courseMode); 
}

// Сохранение прогресса обучения
function saveLearningProgress() { 
  const userId = null; // authSession?.userId || authSession?.id || null;
  localStorage.setItem(getUserStorageKey(STORAGE_KEYS.learningProgress, userId), JSON.stringify(learningProgress)); 
}

// Сохранение уровня обучения
function saveLearningLevel() { 
  const userId = null; // authSession?.userId || authSession?.id || null;
  localStorage.setItem(getUserStorageKey(STORAGE_KEYS.learningLevel, userId), learningLevel.toString()); 
}

// Сохранение опыта обучения
function saveLearningXP() { 
  const userId = null; // authSession?.userId || authSession?.id || null;
  localStorage.setItem(getUserStorageKey(STORAGE_KEYS.learningXP, userId), learningXP.toString()); 
}

// Сохранение тёмной темы
function saveDarkMode(enabled) { 
  localStorage.setItem(STORAGE_KEYS.darkMode, enabled ? 'true' : 'false'); 
}

// Сохранение настроек дополнительных продаж
function saveDishChainSettings() { 
  localStorage.setItem(STORAGE_KEYS.dishChain, JSON.stringify(dishChainSettings)); 
}

// Сохранение стоп-листа
function saveStopList() { 
  console.log('Saving stop list:', stopList);
  localStorage.setItem(STORAGE_KEYS.stopList, JSON.stringify(stopList)); 
}

// Нормализация группировки категорий
function normalizeCategoryGrouping() {
  Object.keys(CATEGORY_KEYS).forEach((key) => {
    if (typeof categoryGrouping[key] !== 'boolean') {
      categoryGrouping[key] = true;
    }
  });
}
