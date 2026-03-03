/* Main App - Новый главный файл приложения */
/* Версия: 1.63.0 */

// NOTE: Это новый главный файл для будущего использования
// Пока старый app.js содержит весь функционал
// После переноса всех функций, этот файл заменит старый app.js

// Инициализация приложения
function initApp() {
  loadState();
  loadDb();
  setupNavigation();
  setupPWA();
  scheduleDailyCleanup();
  ensureMonthlyPurge();
  render();
}

// Загрузка базы данных блюд
async function loadDb() {
  try {
    if (window.DISHES_DATA) {
      db = { dishes: window.DISHES_DATA };
    }
  } catch (error) {
    console.error('Error loading database:', error);
  }
}

// Роутинг
function render() {
  const hash = location.hash || '#/';
  root.innerHTML = '';
  
  if (hash.startsWith('#/table/')) {
    const id = Number(hash.split('/').pop());
    // TODO: Использовать viewTable из table-view.js
    root.appendChild(viewTable(id));
  } else if (hash === '#/') {
    // TODO: Использовать viewHome из table-manager.js
    root.appendChild(viewHome());
  } else if (hash === '#/profile') {
    // TODO: Использовать viewProfile из profile-view.js
    root.appendChild(viewProfile());
  } else if (hash === '#/settings') {
    // Уже работает из settings-view.js
    root.appendChild(viewSettings());
  } else if (hash === '#/learning') {
    // TODO: Использовать viewLearning из learning-view.js
    root.appendChild(viewLearning());
  } else if (hash === '#/course-settings') {
    // Уже работает из course-settings.js
    root.appendChild(viewCourseSettings());
  } else if (hash === '#/dish-chain-settings') {
    // Уже работает из additional-sales-settings.js
    root.appendChild(viewDishChainSettings());
  } else if (hash === '#/order-history') {
    // Уже работает из order-history.js
    root.appendChild(viewOrderHistory());
  }
  
  updateNavigation();
}

// Навигация
function navigate(hash) {
  location.hash = hash;
}

// Обновление нижней навигации
function updateNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const hash = location.hash || '#/';
  
  navItems.forEach(item => {
    const page = item.dataset.page;
    item.classList.remove('active');
    
    if (page === 'tables' && hash === '#/') {
      item.classList.add('active');
    } else if (page === 'profile' && hash === '#/profile') {
      item.classList.add('active');
    } else if (page === 'settings' && hash.includes('settings')) {
      item.classList.add('active');
    } else if (page === 'learn' && hash.includes('learning')) {
      item.classList.add('active');
    }
  });
}

// Настройка PWA
function setupPWA() {
  const installBtn = document.getElementById('btn-install');
  let deferredPrompt = null;
  
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (installBtn) installBtn.hidden = false;
  });
  
  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      installBtn.disabled = true;
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      installBtn.hidden = true;
      installBtn.disabled = false;
      deferredPrompt = null;
    });
  }
}

// Настройка навигации
function setupNavigation() {
  window.addEventListener('hashchange', render);
  
  // Навигационные кнопки
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const page = e.currentTarget.dataset.page;
      
      switch (page) {
        case 'tables':
          navigate('#/');
          break;
        case 'profile':
          navigate('#/profile');
          break;
        case 'settings':
          navigate('#/settings');
          break;
        case 'learn':
          navigate('#/learning');
          break;
        case 'tools':
          // TODO: Добавить страницу инструментов
          break;
      }
    });
  });
}

// Запуск приложения
// NOTE: Пока не используется, старый app.js инициализирует приложение
// document.addEventListener('DOMContentLoaded', initApp);
