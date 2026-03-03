/* Waiter PWA SPA */
/* Версия: 1.672 - ФИНАЛЬНЫЙ FIX */
console.log('%c🐂 TheBullTeam v1.672 LOADED', 'color: #ef4444; font-size: 20px; font-weight: bold;');
console.log('%cВсе исправления применены', 'color: #10b981; font-size: 14px;');
(function () {
  const STORAGE_KEYS = {
    tableOrders: 'waiter.tableOrders',
    tables: 'waiter.tables',
    tableMode: 'waiter.tableMode',
    tableNames: 'waiter.tableNames',
    orderHistory: 'waiter.orderHistory',
    meta: 'waiter.meta',
    activePage: 'waiter.activePage',
    profile: 'waiter.profile',
    searchFilters: 'waiter.searchFilters',
    learnProgress: 'waiter.learnProgress',
    categoryGrouping: 'waiter.categoryGrouping',
    courseMode: 'waiter.courseMode', // Режим курсов: 'auto' или 'manual'
    learningProgress: 'waiter.learningProgress',
    learningLevel: 'waiter.learningLevel',
    learningXP: 'waiter.learningXP',
    shifts: 'waiter.shifts',
    darkMode: 'waiter.darkMode',
    dishChain: 'waiter.dishChain', // Настройки цепочки блюд
    stopList: 'waiter.stopList', // Стоп-лист блюд
  // AUTH DISABLED: Auth session storage key commented out
  // authSession: 'waiter.authSession' // Сессия авторизации
};
  
  // Функция для получения ключа с userId (для персональных данных)
  function getUserStorageKey(baseKey, userId) {
    if (!userId) {
      // Если userId нет, используем старый ключ (для обратной совместимости)
      return baseKey;
    }
    return `${baseKey}.user${userId}`;
  }
  
  // Dish chain settings (upsell recommendations)
  // MOVED TO state.js - не нужно дублировать здесь
  /*
  let dishChainSettings = {
    steaks: {
      garnishes: true, // Рекомендовать гарниры
      sauces: true     // Рекомендовать соусы
    },
    tea: {
      mint: true,      // Мята
      honey: true,     // Мёд
      thyme: true,     // Чабрец
      sugar: true      // Сахар
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
  */
  
  // Stop list - dishes that are out of stock
  let stopList = [];
  
  // AUTH DISABLED: Auth session state commented out
  // let authSession = null;
  
  /* AUTH DISABLED: Backend API Configuration commented out
  // Backend API Configuration
  // Автоматически определяем URL API в зависимости от окружения
  const API_BASE_URL = (() => {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    console.log('Current location:', window.location.href);
    console.log('Hostname:', hostname, 'Protocol:', protocol);
    
    // Если файл открыт напрямую (file://) или localhost
    if (protocol === 'file:' || hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '' || !hostname) {
      console.log('Using local API server');
      return 'http://localhost:3002/api';
    }
    
    // Продакшн на Selectel
    // Если фронтенд на app.your-domain.com, то API на api.your-domain.com
    if (hostname.startsWith('app.')) {
      const domain = hostname.replace('app.', 'api.');
      return `https://${domain}/api`;
    }
    
    // Если открыто по IP адресу Selectel
    if (hostname === '90.156.158.191') {
      return 'http://90.156.158.191:3002/api';
    }
    
    // По умолчанию локальный сервер
    console.log('Fallback to local API server');
    return 'http://localhost:3002/api';
  })();
  
  // API Client Module
  class APIClient {
    constructor(baseURL) {
      this.baseURL = baseURL;
    }

    // Get auth token from localStorage
    getToken() {
      const session = localStorage.getItem(STORAGE_KEYS.authSession);
      if (session) {
        try {
          const parsed = JSON.parse(session);
          return parsed.token || null;
        } catch (e) {
          return null;
        }
      }
      return null;
    }

    // Handle unauthorized error - clear session and show auth form
    handleUnauthorized() {
      authSession = null;
      localStorage.removeItem(STORAGE_KEYS.authSession);
      showAuthOverlay();
    }

    // Make authenticated request
    async request(endpoint, options = {}) {
      const url = `${this.baseURL}${endpoint}`;
      const token = this.getToken();
      
      console.log('API Request:', options.method || 'GET', url);
      console.log('Has token:', !!token);
      
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers
      };
      
      // Add Authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Добавляем таймаут 10 секунд для всех запросов
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const config = {
        ...options,
        headers,
        signal: controller.signal
      };
      
      try {
        console.log('Sending fetch request...');
        const response = await fetch(url, config);
        console.log('Response status:', response.status);
        clearTimeout(timeoutId);
        
        // Handle 401 - token expired or invalid
        if (response.status === 401) {
          this.handleUnauthorized();
          throw new Error('Unauthorized');
        }
        
        // Handle 403 - forbidden
        if (response.status === 403) {
          throw new Error('Доступ запрещен');
        }
        
        // Handle 400 - bad request
        if (response.status === 400) {
          const error = await response.json();
          throw new Error(error.error || 'Неверный запрос');
        }
        
        // Handle 500 - server error
        if (response.status === 500) {
          throw new Error('Ошибка сервера. Попробуйте позже');
        }
        
        // Handle other errors
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Ошибка запроса');
        }
        
        return await response.json();
      } catch (error) {
        clearTimeout(timeoutId);
        
        // Handle timeout/abort
        if (error.name === 'AbortError') {
          console.error('Request timeout:', url);
          throw new Error('Превышено время ожидания (10 сек)');
        }
        
        // Handle network errors
        if (error.name === 'TypeError') {
          console.error('Network error:', url, error);
          throw new Error('Ошибка подключения к серверу');
        }
        
        // Re-throw other errors
        throw error;
      }
    }

    // HTTP Methods
    async get(endpoint) {
      return this.request(endpoint, { method: 'GET' });
    }

    async post(endpoint, data) {
      return this.request(endpoint, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    }

    async put(endpoint, data) {
      return this.request(endpoint, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    }

    async delete(endpoint) {
      return this.request(endpoint, { method: 'DELETE' });
    }
  }

  // Initialize API Client
  const apiClient = new APIClient(API_BASE_URL);
  
  console.log('API Base URL:', API_BASE_URL);
  console.log('API Client initialized');
  END AUTH DISABLED */
  
  /* AUTH DISABLED: All auth functions commented out
  // Функция для перевода ролей на русский язык
  function translateRole(role) {
    const roleTranslations = {
      'waiter': 'Официант',
      'manager': 'Менеджер', 
      'admin': 'Администратор',
      'Официант': 'Официант',
      'Менеджер': 'Менеджер',
      'Администратор': 'Администратор'
    };
    return roleTranslations[role] || 'Официант';
  }

  // Email validation regex
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  // Validate email format
  function validateEmail(email) {
    if (!email || typeof email !== 'string') return false;
    return EMAIL_REGEX.test(email.trim());
  }
  
  // Validate name (first name or last name) - must not be empty or whitespace only
  function validateName(name) {
    if (!name || typeof name !== 'string') return false;
    return name.trim().length > 0;
  }
  
  // Check if user is authenticated
  function isAuthenticated() {
    if (authSession && authSession.isAuthenticated === true) {
      return true;
    }
    return false;
  }
  
  // Get current session
  function getSession() {
    return authSession;
  }
  
  // Login user with Backend API
  async function login(email, password) {
    console.log('Login attempt:', email);
    console.log('API Base URL:', API_BASE_URL);
    
    if (!validateEmail(email)) {
      return { success: false, error: 'Неверный формат email' };
    }
    if (!password || password.trim().length === 0) {
      return { success: false, error: 'Введите пароль' };
    }
    
    try {
      console.log('Sending login request to:', apiClient.baseURL + '/auth/login');
      const response = await apiClient.post('/auth/login', {
        email: email.trim(),
        password: password
      });
      
      console.log('Login response:', response);

      if (response.success && response.token) {
        console.log('Login successful, creating session');
        // Create session with full structure
        authSession = {
          token: response.token,
          email: response.user.email,
          firstName: response.user.firstName,
          lastName: response.user.lastName,
          userId: response.user.id,
          role: response.user.role,
          locationId: response.user.locationId,
          locationName: response.user.locationName || '',
          isAuthenticated: true,
          loginAt: Date.now()
        };

        // Save to localStorage
        saveAuthSession();

        // Перезагружаем данные с новым userId
        loadState();
        
        // Загружаем стоп-лист с Backend
        await loadStopListFromBackend();

        // Update local profile
        profile.name = response.user.firstName;
        profile.surname = response.user.lastName;
        profile.role = translateRole(response.user.role);
        profile.grade = response.user.grade?.toString() || '';
        profile.location = response.user.locationName || '';
        saveProfile();

        return { success: true, user: response.user };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  }
  
  // Register user with Supabase
  // Register user with Backend API
  async function register(email, password, locationCode, role, firstName, lastName) {
    if (!validateName(firstName)) {
      return { success: false, error: 'Введите имя' };
    }
    if (!validateName(lastName)) {
      return { success: false, error: 'Введите фамилию' };
    }
    if (!validateEmail(email)) {
      return { success: false, error: 'Неверный формат email' };
    }
    if (!password || password.trim().length < 6) {
      return { success: false, error: 'Пароль должен быть минимум 6 символов' };
    }
    if (!locationCode || locationCode.trim().length === 0) {
      return { success: false, error: 'Введите код точки' };
    }
    
    try {
      const response = await apiClient.post('/auth/register', {
        email: email.trim(),
        password: password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        locationCode: locationCode.trim()
      });

      if (response.success && response.token) {
        // Create session with full structure
        authSession = {
          token: response.token,
          email: response.user.email,
          firstName: response.user.firstName,
          lastName: response.user.lastName,
          userId: response.user.id,
          role: response.user.role,
          locationId: response.user.locationId,
          locationName: response.user.locationName || '',
          isAuthenticated: true,
          loginAt: Date.now()
        };

        // Save to localStorage
        saveAuthSession();

        // Перезагружаем данные с новым userId
        loadState();
        
        // Загружаем стоп-лист с Backend
        await loadStopListFromBackend();

        // Update local profile
        profile.name = response.user.firstName;
        profile.surname = response.user.lastName;
        profile.role = translateRole(response.user.role);
        profile.grade = response.user.grade?.toString() || '';
        profile.location = response.user.locationName || '';
        saveProfile();

        return { success: true, user: response.user };
      }
      
      return { success: false, error: 'Ошибка регистрации' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  // Logout user
  async function logout() {
    authSession = null;
    localStorage.removeItem(STORAGE_KEYS.authSession);
    showAuthOverlay();
  }
  
  // Delete user account
  async function deleteAccount() {
    // TODO: Implement account deletion via Backend API
    // For now, just logout the user
    try {
      await logout();
      return { success: true, message: 'Для удаления аккаунта обратитесь к администратору.' };
    } catch (err) {
      console.error('Delete account error:', err);
      return { success: false, error: 'Ошибка удаления аккаунта' };
    }
  }
  
  // Save auth session to localStorage
  function saveAuthSession() {
    if (authSession) {
      localStorage.setItem(STORAGE_KEYS.authSession, JSON.stringify(authSession));
    }
  }
  
  // Load auth session from localStorage
  // Load auth session from localStorage
  async function loadAuthSession() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.authSession);
      if (stored) {
        authSession = JSON.parse(stored);
        
        // Validate session structure
        if (!authSession || !authSession.token || !authSession.isAuthenticated) {
          authSession = null;
          return;
        }

        // Проверяем возраст токена - если старше 7 дней, удаляем
        const tokenAge = Date.now() - (authSession.loginAt || 0);
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        if (tokenAge > sevenDays) {
          console.log('Token expired (older than 7 days), clearing session');
          authSession = null;
          localStorage.removeItem(STORAGE_KEYS.authSession);
          return;
        }

        // НЕ проверяем токен при загрузке - это замедляет старт
        // Токен будет проверен при первом API запросе
        // Если токен невалидный, пользователь увидит форму входа автоматически
        console.log('Session loaded from localStorage, skipping token verification for faster startup');
      }
    } catch (e) {
      console.error('Error loading auth session:', e);
      authSession = null;
    }
  }
  
  // Show auth overlay
  function showAuthOverlay() {
    const overlay = document.getElementById('auth-overlay');
    if (overlay) {
      overlay.classList.remove('hidden');
    }
  }
  
  // Hide auth overlay
  function hideAuthOverlay() {
    const overlay = document.getElementById('auth-overlay');
    if (overlay) {
      overlay.classList.add('hidden');
    }
  }
  
  // Show error message in form
  function showAuthError(form, message) {
    let errorEl = form.querySelector('.auth-error');
    if (!errorEl) {
      errorEl = document.createElement('div');
      errorEl.className = 'auth-error';
      form.appendChild(errorEl);
    }
    errorEl.textContent = message;
  }
  
  // Clear error message
  function clearAuthError(form) {
    const errorEl = form.querySelector('.auth-error');
    if (errorEl) {
      errorEl.remove();
    }
  }
  
  // Toggle between login and register forms
  function showLoginForm() {
    document.getElementById('auth-form').style.display = 'flex';
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('auth-toggle-register').style.display = 'block';
    document.getElementById('auth-toggle-login').style.display = 'none';
    document.getElementById('auth-forgot').style.display = 'block';
  }
  
  function showRegisterForm() {
    document.getElementById('auth-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'flex';
    document.getElementById('auth-toggle-register').style.display = 'none';
    document.getElementById('auth-toggle-login').style.display = 'block';
    document.getElementById('auth-forgot').style.display = 'none';
  }
  
  // Initialize auth form handlers
  function initAuthForm() {
    console.log('initAuthForm called');
    const loginForm = document.getElementById('auth-form');
    const registerForm = document.getElementById('register-form');
    const forgotLink = document.getElementById('auth-forgot');
    const registerLink = document.getElementById('auth-register-link');
    const loginLink = document.getElementById('auth-login-link');
    
    console.log('Form elements found:', {
      loginForm: !!loginForm,
      registerForm: !!registerForm,
      forgotLink: !!forgotLink,
      registerLink: !!registerLink,
      loginLink: !!loginLink
    });
    
    // Password toggle handlers
    const toggleButtons = document.querySelectorAll('.auth-password-toggle');
    console.log('Found password toggle buttons:', toggleButtons.length);
    
    toggleButtons.forEach((btn, index) => {
      console.log(`Setting up toggle button ${index}`);
      btn.addEventListener('click', (e) => {
        console.log('Password toggle clicked');
        e.preventDefault();
        const targetId = btn.getAttribute('data-target');
        const input = document.getElementById(targetId);
        const eyeIcon = btn.querySelector('.eye-icon');
        const eyeOffIcon = btn.querySelector('.eye-off-icon');
        
        console.log('Toggle elements:', {
          targetId,
          input: !!input,
          eyeIcon: !!eyeIcon,
          eyeOffIcon: !!eyeOffIcon
        });
        
        if (input) {
          if (input.type === 'password') {
            input.type = 'text';
            if (eyeIcon) eyeIcon.style.display = 'none';
            if (eyeOffIcon) eyeOffIcon.style.display = 'block';
            console.log('Password shown');
          } else {
            input.type = 'password';
            if (eyeIcon) eyeIcon.style.display = 'block';
            if (eyeOffIcon) eyeOffIcon.style.display = 'none';
            console.log('Password hidden');
          }
        }
      });
    });
    
    // Login form handler
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearAuthError(loginForm);
        
        const email = document.getElementById('auth-email')?.value || '';
        const password = document.getElementById('auth-password')?.value || '';
        
        // Disable button during request
        const submitBtn = document.getElementById('auth-submit');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Вход...';
        }
        
        const result = await login(email, password);
        
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Войти';
        }
        
        if (result.success) {
          hideAuthOverlay();
          updateNavigation(); // Обновляем навигацию после успешного входа
          loginForm.reset();
        } else {
          showAuthError(loginForm, result.error);
        }
      });
    }
    
    // Register form handler
    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearAuthError(registerForm);
        
        const firstName = document.getElementById('register-first-name')?.value || '';
        const lastName = document.getElementById('register-last-name')?.value || '';
        const email = document.getElementById('register-email')?.value || '';
        const password = document.getElementById('register-password')?.value || '';
        const passwordConfirm = document.getElementById('register-password-confirm')?.value || '';
        const locationCode = document.getElementById('register-location-code')?.value || '';
        const role = 'Официант'; // Всегда официант, менеджера может назначить только админ
        
        // Validate passwords match
        if (password !== passwordConfirm) {
          showAuthError(registerForm, 'Пароли не совпадают');
          return;
        }
        
        // Disable button during request
        const submitBtn = document.getElementById('register-submit');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Регистрация...';
        }
        
        const result = await register(email, password, locationCode, role, firstName, lastName);
        
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Зарегистрироваться';
        }
        
        if (result.success) {
          hideAuthOverlay();
          updateNavigation(); // Обновляем навигацию после успешной регистрации
          registerForm.reset();
          showLoginForm();
        } else {
          showAuthError(registerForm, result.error);
        }
      });
    }
    
    // Toggle to register form
    if (registerLink) {
      registerLink.addEventListener('click', (e) => {
        e.preventDefault();
        showRegisterForm();
      });
    }
    
    // Toggle to login form
    if (loginLink) {
      loginLink.addEventListener('click', (e) => {
        e.preventDefault();
        showLoginForm();
      });
    }
    
    // Forgot password
    if (forgotLink) {
      forgotLink.addEventListener('click', async (e) => {
        e.preventDefault();
        const email = document.getElementById('auth-email')?.value || '';
        
        if (!validateEmail(email)) {
          alert('Введите email для восстановления пароля');
          return;
        }
        
        // TODO: Implement password reset via Backend API
        alert('Функция восстановления пароля временно недоступна. Обратитесь к администратору.');
      });
    }
    
    // Show login form by default
    showLoginForm();
  }
  
  // Check auth on app start
  async function checkAuthOnStart() {
    await loadAuthSession();
    
    if (isAuthenticated()) {
      hideAuthOverlay();
    } else {
      showAuthOverlay();
    }
  }
  END AUTH DISABLED */
  
  // AUTH DISABLED: Заглушки для функций, которые используются в профиле
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
  
  function isAuthenticated() {
    return false; // Всегда false, так как авторизация отключена
  }
  
  // Garnishes data for steak chain
  const STEAK_GARNISHES = [
    { name: 'Овощи гриль', rkeeper: '239', price: '400 рублей', emoji: '🥗', image: 'Pictures/menu/Гарниры/Овощи-гриль.jpg' },
    { name: 'Брокколи', rkeeper: '236', price: '400 рублей', emoji: '🥦', image: 'Pictures/menu/Гарниры/Брокколи.jpg' },
    { name: 'Рис с овощами', rkeeper: '559', price: '400 рублей', emoji: '🍚', image: 'Pictures/menu/Гарниры/Рис-с-овощами.jpg' },
    { name: 'Картофель фри', rkeeper: '233', price: '400 рублей', emoji: '🍟', image: 'Pictures/menu/Гарниры/Картофель-фри.jpg' },
    { name: 'Фри с пармезаном', rkeeper: '29', price: '400 рублей', emoji: '🧀', image: 'Pictures/menu/Гарниры/Картофель-фри-с-пармезаном.jpg' },
    { name: 'Батат фри', rkeeper: '655', price: '400 рублей', emoji: '🍠', image: 'Pictures/menu/Гарниры/Картофель-батат-фри.jpg' },
    { name: 'Картофельные дипперы', rkeeper: '291', price: '400 рублей', emoji: '🥔', image: 'Pictures/menu/Гарниры/Картофель-диппер.jpg' },
    { name: 'Картофельное пюре', rkeeper: '1083', price: '400 рублей', emoji: '🫕', image: 'Pictures/menu/Гарниры/Картофельное-пюре.jpg' }
  ];
  
  // Sauces data for steak chain
  const STEAK_SAUCES = [
    { name: 'Брусничный', rkeeper: '440', price: '70', emoji: '🫐', image: 'Pictures/menu/Соусы/Соусы.jpg' },
    { name: 'Перечный', rkeeper: '341', price: '70', emoji: '🫑', image: 'Pictures/menu/Соусы/Соусы.jpg' },
    { name: 'Грибной', rkeeper: '753', price: '70', emoji: '🍄', image: 'Pictures/menu/Соусы/Соусы.jpg' },
    { name: 'Сальса', rkeeper: '494', price: '70', emoji: '🍅', image: 'Pictures/menu/Соусы/Соусы.jpg' },
    { name: 'Джек Дэниелс', rkeeper: '581', price: '70', emoji: '🥃', image: 'Pictures/menu/Соусы/Соусы.jpg' },
    { name: 'Медово-горчичный', rkeeper: '495', price: '70', emoji: '🍯', image: 'Pictures/menu/Соусы/Соусы.jpg' },
    { name: '1000 островов', rkeeper: '366', price: '70', emoji: '🏝️', image: 'Pictures/menu/Соусы/Соусы.jpg' },
    { name: 'Сладкий чили', rkeeper: '368', price: '70', emoji: '🌶️', image: 'Pictures/menu/Соусы/Соусы.jpg' },
    { name: 'Барбекю', rkeeper: '342', price: '70', emoji: '🔥', image: 'Pictures/menu/Соусы/Соусы.jpg' },
    { name: 'Кетчуп', rkeeper: '343', price: '70', emoji: '🥫', image: 'Pictures/menu/Соусы/Соусы.jpg' },
    { name: 'Сырный', rkeeper: '115', price: '70', emoji: '🧀', image: 'Pictures/menu/Соусы/Соусы.jpg' }
  ];

  // Steak categories - dishes in these categories will show steak chain
  const STEAK_CATEGORIES_WITHOUT_COOKING = ['Альтернативные стейки']; // Без выбора прожарки
  
  // Названия стейков из категории "Прайм" которые требуют выбор прожарки
  // ВАЖНО: Названия должны точно совпадать с названиями в dishes-data.js
  const PRIME_STEAKS_WITH_COOKING = [
    'Стейк Рибай (зерно)',
    'Стейк Стриплойн (зерно)', 
    'Стейк Филе Миньон (травяной)',
    'Стейк Шато Бриан',
    'Стейк The Бык Кинг Сайз травяной',
    'Стейк Рибай (трава)',
    'Нью-Йорк травяной',
    'Стейк Бавет зерновой'
  ];

  // Helper function to check if dish is a steak (needs garnish/sauce recommendations)
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

  // Helper function to check if dish is an alternative steak (no cooking level)
  function isAlternativeSteak(dishName) {
    if (!db || !db.dishes) return false;
    const dish = db.dishes.find(d => d.name === dishName);
    if (!dish || !dish.category) return false;
    return STEAK_CATEGORIES_WITHOUT_COOKING.includes(dish.category);
  }

  // Helper function to check if dish is a classic steak (needs cooking level)
  function isClassicSteak(dishName) {
    if (!db || !db.dishes) return false;
    const dish = db.dishes.find(d => d.name === dishName);
    if (!dish) return false;
    
    // Только стейки из списка PRIME_STEAKS_WITH_COOKING требуют прожарку
    return PRIME_STEAKS_WITH_COOKING.includes(dish.name);
  }


  /** @type {Object<number, Array<{id:string, itemName:string, quantity:number, notes?:string, createdAt:number, status?:'rkeeper'|'served', addedAt:number}>>} */
  let tableOrders = {};
  /** @type {Array<number>} */
  let activeTables = [];
  /** @type {Object<number, string>} */
  let tableNames = {};
  /** @type {Array<any>} */
  let orderHistory = [];
  /** @type {{ lastPurgeMonth?: string } } */
  let meta = {};
  /** @type {{ name?: string, surname?: string, role?: string, grade?: string, location?: string }} */
  let profile = {};
  /** @type {Object<string, number>} - shifts: { "2025-06-05": 1, "2025-06-13": 0.5 } */
  let shifts = {};
  /** @type {{dishes:any[]} | null} */
  let db = null;
  const CATEGORY_CONFIG = {
    1: { key: 'drinks', label: 'Напитки' },
    2: { key: 'cold', label: 'Холодные блюда и закуски' },
    3: { key: 'hot', label: 'Горячие блюда' },
    4: { key: 'dessert', label: 'Десерты' }
  };
  const CATEGORY_KEYS = Object.fromEntries(Object.entries(CATEGORY_CONFIG).map(([id, cfg]) => [cfg.key, Number(id)]));
  /** @type {{drinks:boolean,cold:boolean,hot:boolean,dessert:boolean}} */
  let categoryGrouping = {
    drinks: true,
    cold: true,
    hot: true,
    dessert: true
  };
  
  /** @type {'auto' | 'manual'} */
  let courseMode = 'auto'; // Режим курсов: 'auto' - автоматическая группировка, 'manual' - ручная сортировка
  
  // Learning system state
  let learningProgress = {}; // { sectionId: { topicId: boolean, flashcardId: { attempts, correct }, testId: { attempts, correct } } }
  let learningLevel = 1;
  let learningXP = 0;
  
  /** @type {'search' | 'todo'} */
  let tableMode = 'todo';

  const root = document.getElementById('app');
  const installBtn = document.getElementById('btn-install');
  let deferredPrompt = null;
  let currentPage = 'tables';

  function loadState() {
    // Сначала загружаем authSession, чтобы получить userId
    try { 
      authSession = JSON.parse(localStorage.getItem(STORAGE_KEYS.authSession) || 'null'); 
    } catch { 
      authSession = null; 
    }
    
    // Получаем userId для персональных данных
    const userId = authSession?.userId || authSession?.id || null;
    
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
    
    // Load course mode
    try { courseMode = localStorage.getItem(STORAGE_KEYS.courseMode) || 'auto'; } catch { courseMode = 'auto'; }
    
    // Load learning system data (персональные данные)
    try { learningProgress = JSON.parse(localStorage.getItem(getUserStorageKey(STORAGE_KEYS.learningProgress, userId)) || '{}'); } catch { learningProgress = {}; }
    try { learningLevel = parseInt(localStorage.getItem(getUserStorageKey(STORAGE_KEYS.learningLevel, userId)) || '1') || 1; } catch { learningLevel = 1; }
    try { learningXP = parseInt(localStorage.getItem(getUserStorageKey(STORAGE_KEYS.learningXP, userId)) || '0') || 0; } catch { learningXP = 0; }
    
    // Load dark mode
    try {
      const darkMode = localStorage.getItem(STORAGE_KEYS.darkMode) === 'true';
      if (darkMode) {
        document.documentElement.classList.add('dark');
      }
    } catch {}
    
    // Load dish chain settings
    try {
      const storedChain = JSON.parse(localStorage.getItem(STORAGE_KEYS.dishChain) || 'null');
      if (storedChain && typeof storedChain === 'object') {
        dishChainSettings = { ...dishChainSettings, ...storedChain };
      }
    } catch { /* ignore */ }
    
    // Load stop list
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

  function saveTableOrders() { 
    const userId = authSession?.userId || authSession?.id || null;
    localStorage.setItem(getUserStorageKey(STORAGE_KEYS.tableOrders, userId), JSON.stringify(tableOrders)); 
  }
  function saveDishChainSettings() { localStorage.setItem(STORAGE_KEYS.dishChain, JSON.stringify(dishChainSettings)); }
  function saveStopList() { 
    console.log('Saving stop list:', stopList);
    localStorage.setItem(STORAGE_KEYS.stopList, JSON.stringify(stopList)); 
  }
  
  // Check if dish is in stop list
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
      const itemLower = itemName.toLowerCase().trim();
      const match = itemLower === nameLower || nameLower.includes(itemLower) || itemLower.includes(nameLower);
      console.log('Comparing:', nameLower, 'with:', itemLower, 'match:', match);
      return match;
    });
    console.log('isInStopList result:', result);
    return result;
  }
  
  /* AUTH DISABLED: loadStopListFromBackend function commented out
  // Load stop list from Backend API
  async function loadStopListFromBackend() {
    try {
      const response = await apiClient.get('/stoplist');
      const backendStopList = response.stopList || response.stoplist || [];
      
      if (Array.isArray(backendStopList)) {
        // Обновляем локальный массив stopList
        // Backend возвращает объекты с полями dish_name, поэтому извлекаем названия
        stopList = backendStopList.map(item => item.dish_name || item.dishName || item.name || item);
        console.log('Stop list loaded from backend:', stopList);
        
        // Сохраняем в localStorage для кэширования
        saveStopList();
      }
    } catch (error) {
      console.error('Error loading stoplist from backend:', error);
      // Если ошибка, используем данные из localStorage
    }
  }
  END AUTH DISABLED */
  
  function saveTables() { 
    const userId = authSession?.userId || authSession?.id || null;
    localStorage.setItem(getUserStorageKey(STORAGE_KEYS.tables, userId), JSON.stringify(activeTables)); 
  }
  function saveTableMode() { 
    const userId = authSession?.userId || authSession?.id || null;
    localStorage.setItem(getUserStorageKey(STORAGE_KEYS.tableMode, userId), tableMode); 
  }
  function saveTableNames() { 
    const userId = authSession?.userId || authSession?.id || null;
    localStorage.setItem(getUserStorageKey(STORAGE_KEYS.tableNames, userId), JSON.stringify(tableNames)); 
  }
  function saveOrderHistory() { 
    const userId = authSession?.userId || authSession?.id || null;
    localStorage.setItem(getUserStorageKey(STORAGE_KEYS.orderHistory, userId), JSON.stringify(orderHistory)); 
  }
  function saveMeta() { 
    const userId = authSession?.userId || authSession?.id || null;
    localStorage.setItem(getUserStorageKey(STORAGE_KEYS.meta, userId), JSON.stringify(meta)); 
  }
  function saveProfile() { localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profile)); }
  function saveShifts() { 
    const userId = authSession?.userId || authSession?.id || null;
    localStorage.setItem(getUserStorageKey(STORAGE_KEYS.shifts, userId), JSON.stringify(shifts)); 
  }
  function saveCategoryGrouping() { localStorage.setItem(STORAGE_KEYS.categoryGrouping, JSON.stringify(categoryGrouping)); }
  function saveCourseMode() { localStorage.setItem(STORAGE_KEYS.courseMode, courseMode); }
  function saveLearningProgress() { 
    const userId = authSession?.userId || authSession?.id || null;
    localStorage.setItem(getUserStorageKey(STORAGE_KEYS.learningProgress, userId), JSON.stringify(learningProgress)); 
  }
  function saveLearningLevel() { 
    const userId = authSession?.userId || authSession?.id || null;
    localStorage.setItem(getUserStorageKey(STORAGE_KEYS.learningLevel, userId), learningLevel.toString()); 
  }
  function saveLearningXP() { 
    const userId = authSession?.userId || authSession?.id || null;
    localStorage.setItem(getUserStorageKey(STORAGE_KEYS.learningXP, userId), learningXP.toString()); 
  }
  function saveDarkMode(enabled) { localStorage.setItem(STORAGE_KEYS.darkMode, enabled ? 'true' : 'false'); }

  function normalizeCategoryGrouping() {
    Object.keys(CATEGORY_KEYS).forEach((key) => {
      if (typeof categoryGrouping[key] !== 'boolean') {
        categoryGrouping[key] = true;
      }
    });
  }
  
  // Learning system helpers
  function calculateOverallProgress() {
    if (!window.TRAINING_DATA) return 0;
    let total = 0;
    let completed = 0;
    
    window.TRAINING_DATA.sections.forEach(section => {
      section.topics.forEach(topic => {
        total++;
        if (learningProgress[section.id]?.[topic.id]) completed++;
      });
    });
    
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }
  
  function addXP(amount) {
    learningXP += amount;
    
    // Level up system: level 1-10, each level requires more XP
    const xpForNextLevel = learningLevel * 100;
    if (learningXP >= xpForNextLevel && learningLevel < 10) {
      learningLevel++;
      learningXP = learningXP - xpForNextLevel;
      saveLearningLevel();
    }
    
    saveLearningXP();
    return { leveledUp: learningXP >= xpForNextLevel, newLevel: learningLevel };
  }
  
  function getLevelInfo() {
    const xpForNext = learningLevel * 100;
    const progress = learningLevel >= 10 ? 100 : Math.round((learningXP / xpForNext) * 100);
    const titles = ['', 'Стажёр', 'Новичок', 'Практикант', 'Официант', 'Профессионал', 'Эксперт', 'Мастер', 'Гуру', 'Легенда', 'Супер-звезда'];
    const achievementTitles = ['', 'Trainee', 'Waiter', 'Senior Waiter', 'Junior Sommelier', 'Sommelier', 'Senior Sommelier', 'Master', 'Expert', 'Legend', 'Superstar'];
    return {
      level: learningLevel,
      xp: learningXP,
      xpForNext,
      progress,
      title: titles[learningLevel] || 'Официант',
      achievementTitle: achievementTitles[learningLevel] || 'Waiter'
    };
  }

  // Helper function for gamification - get stars based on progress
  function getStars(progress) {
    const stars = Math.floor(progress / 20);
    return '⭐'.repeat(stars) + '☆'.repeat(5 - stars);
  }

  function calculateCategoryProgress(categoryId) {
    if (!window.TRAINING_DATA) return 0;
    
    if (categoryId === 'menu') {
      // Calculate menu progress based on flashcards learned
      try {
        const progress = JSON.parse(localStorage.getItem(STORAGE_KEYS.learnProgress) || '{"correct":0,"wrong":0}');
        // Estimate progress based on correct answers (simplified)
        return Math.min(67, Math.round((progress.correct / 225) * 100)); // 115 dishes + 110 drinks
      } catch {
        return 0;
      }
    }
    
    if (categoryId === 'bar') {
      // Calculate bar progress based on bar drinks flashcards learned
      try {
        let learningProgress = {};
        try {
          learningProgress = JSON.parse(localStorage.getItem(STORAGE_KEYS.learningProgress) || '{}');
        } catch {}
        
        // Count bar drinks studied
        let studied = 0;
        for (let key in learningProgress) {
          if (key.startsWith('bar_')) studied++;
        }
        
        // Get total bar drinks count
        if (db && db.dishes) {
          const barDrinks = db.dishes.filter(d => d.source === 'bar');
          const total = barDrinks.length;
          return total > 0 ? Math.round((studied / total) * 100) : 0;
        }
        
        // Fallback: try to get count from loaded data
        return 0;
      } catch {
        return 0;
      }
    }
    
    if (categoryId === 'theory') {
      // Overall theory progress (meat + bar + competencies)
      let total = 0;
      let completed = 0;
      ['meat', 'bar', 'competencies'].forEach(sectionId => {
        const section = window.TRAINING_DATA.sections.find(s => s.id === sectionId);
        if (section) {
          section.topics.forEach(topic => {
            total++;
            if (learningProgress[sectionId]?.[topic.id]) completed++;
          });
        }
      });
      return total > 0 ? Math.round((completed / total) * 100) : 0;
    }
    
    if (categoryId === 'steps') {
      // 6 steps of service progress - check if any steps were studied
      const steps = window.TRAINING_DATA.serviceSteps || [];
      if (steps.length === 0) return 50; // Default 50% if no data
      // For now, return a default progress or calculate based on actual study
      // You can track steps completion in learningProgress['steps']
      let completed = 0;
      steps.forEach(step => {
        if (learningProgress['steps']?.[step.id]) completed++;
      });
      // If none studied, return default 50%
      return steps.length > 0 ? Math.round((completed / steps.length) * 100) : 50;
    }
    
    return 0;
  }

  function calculateModuleProgress(moduleId) {
    // Calculate progress for each module card
    if (moduleId === 'dishes') {
      return calculateCategoryProgress('menu');
    }
    if (moduleId === 'bar-study') {
      return calculateCategoryProgress('bar');
    }
    if (moduleId === 'theory') {
      return calculateCategoryProgress('theory');
    }
    if (moduleId === 'service-steps') {
      return calculateCategoryProgress('steps');
    }
    return 0;
  }

  // Purge history monthly to avoid storage bloat
  function ensureMonthlyPurge(daysToKeep = 31) {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    if (meta.lastPurgeMonth === monthKey) return;

    const cutoff = now.getTime() - daysToKeep * 24 * 60 * 60 * 1000;
    orderHistory = (orderHistory || []).filter(h => {
      const closedAt = typeof h?.closedAt === 'number' ? h.closedAt : 0;
      return closedAt >= cutoff;
    });
    meta.lastPurgeMonth = monthKey;
    saveOrderHistory();
    saveMeta();
  }

  // Daily cleanup: clear and delete all tables at 23:50 MSK
  function scheduleDailyCleanup() {
    function checkAndCleanup() {
      // Get current time in MSK (UTC+3)
      const now = new Date();
      const mskOffset = 3 * 60; // MSK is UTC+3
      const localOffset = now.getTimezoneOffset(); // minutes from UTC (negative for east of UTC)
      const mskTime = new Date(now.getTime() + (mskOffset + localOffset) * 60 * 1000);
      
      const hours = mskTime.getHours();
      const minutes = mskTime.getMinutes();
      const dateKey = mskTime.toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Check if it's 23:50 MSK and we haven't cleaned today
      if (hours === 23 && minutes === 50) {
        const lastCleanup = localStorage.getItem('waiter.lastDailyCleanup');
        
        if (lastCleanup !== dateKey) {
          console.log('🧹 Автоматическая очистка столов в 23:50 МСК');
          
          // Save all table orders to history before clearing
          activeTables.forEach(tableNum => {
            const items = tableOrders[tableNum] || [];
            if (items.length === 0) return;
            
            const total = computeTableTotalAmount(tableNum);
            const displayName = tableNames[tableNum] || `Стол ${tableNum}`;
            
            orderHistory.push({
              table: tableNum,
              tableName: displayName,
              items: items.map(i => ({ itemName: i.itemName, quantity: i.quantity, price: i.price })),
              total: total,
              createdAt: items[0]?.createdAt || Date.now(),
              closedAt: Date.now()
            });
          });
          
          // Clear all tables
          tableOrders = {};
          activeTables = [];
          tableNames = {};
          
          // Save changes
          saveTableOrders();
          saveTables();
          saveTableNames();
          saveOrderHistory();
          
          // Mark cleanup as done for today
          localStorage.setItem('waiter.lastDailyCleanup', dateKey);
          
          // Refresh UI if on tables page
          if (currentPage === 'tables') {
            render();
          }
          
          console.log('✅ Все столы очищены и перенесены в историю');
        }
      }
      
      // Check if it's 23:55 MSK and we haven't deleted history today
      if (hours === 23 && minutes === 55) {
        const lastHistoryDelete = localStorage.getItem('waiter.lastHistoryDelete');
        
        if (lastHistoryDelete !== dateKey) {
          console.log('🗑️ Автоматическое удаление истории заказов в 23:55 МСК');
          
          // Clear order history
          orderHistory = [];
          saveOrderHistory();
          
          // Mark history deletion as done for today
          localStorage.setItem('waiter.lastHistoryDelete', dateKey);
          
          // Refresh UI if on order history page
          if (currentPage === 'order-history') {
            render();
          }
          
          console.log('✅ История заказов удалена');
        }
      }
    }
    
    // Check every minute
    setInterval(checkAndCleanup, 60 * 1000);
    
    // Check immediately on load
    checkAndCleanup();
  }

  // Compute monthly metrics for profile
  function computeMonthlyMetrics(targetDate = new Date()) {
    const monthKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
    const isSameMonth = (ts) => {
      const d = new Date(ts);
      return d.getFullYear() === targetDate.getFullYear() && d.getMonth() === targetDate.getMonth();
    };
    const monthOrders = (orderHistory || []).filter(h => h.closedAt ? isSameMonth(h.closedAt) : isSameMonth(h.createdAt));
    const numTables = monthOrders.length;
    const revenue = monthOrders.reduce((sum, h) => sum + (h.total || 0), 0);
    const averageCheck = numTables ? Math.round(revenue / numTables) : 0;
    const dishSales = new Map();
    for (const h of monthOrders) {
      for (const item of (h.items || [])) {
        const key = item.itemName || item.name || item.id || 'unknown';
        dishSales.set(key, (dishSales.get(key) || 0) + (item.quantity || 1));
      }
    }
    const top3 = Array.from(dishSales.entries()).sort((a,b) => b[1]-a[1]).slice(0,3).map(([name, qty]) => ({ name, qty }));
    return { monthKey, numTables, revenue, averageCheck, top3 };
  }

  // Function to get current app version
  function getAppVersion() {
    return '1.64.0';
  }
  
  // Format money with proper spacing and abbreviations for large numbers
  function formatMoney(amount) {
    if (amount >= 1000000) {
      // Millions: 1.5М ₽
      const millions = amount / 1000000;
      return `${millions % 1 === 0 ? millions : millions.toFixed(1)}М ₽`;
    } else if (amount >= 100000) {
      // Hundreds of thousands: 150К ₽
      const thousands = Math.round(amount / 1000);
      return `${thousands}К ₽`;
    } else if (amount >= 10000) {
      // Tens of thousands with space: 15 000 ₽
      return `${amount.toLocaleString('ru-RU')} ₽`;
    } else {
      // Regular: 1500 ₽
      return `${amount.toLocaleString('ru-RU')} ₽`;
    }
  }

  // Salary calculator function
  // Конфигурация грейдов для расчёта зарплаты
  const GRADE_CONFIG = {
    '0': { baseFull: 2000, baseHalf: 1000, breakageFull: 200, breakageHalf: 100, percent: 0, name: 'Стажер' },
    '1': { baseFull: 2000, baseHalf: 1000, breakageFull: 200, breakageHalf: 100, percent: 1, name: 'Стажер-официант' },
    '2': { baseFull: 2500, baseHalf: 1250, breakageFull: 200, breakageHalf: 100, percent: 1, name: 'Официант' },
    '3': { baseFull: 2500, baseHalf: 1250, breakageFull: 200, breakageHalf: 100, percent: 2, name: 'Старший официант' }
  };

  /**
   * Рассчитывает зарплату официанта за смену
   * @param {string} grade - Грейд (0, 1, 2, 3)
   * @param {number} shiftType - Тип смены (1 = полная, 0.5 = пол смены)
   * @param {number} revenue - Выручка за месяц
   * @returns {Object} - Детализация расчёта
   */
  function calculateSalary(grade, shiftType, revenue) {
    // Валидация входных данных
    const validGrade = GRADE_CONFIG[grade] ? grade : '0';
    const validRevenue = Math.max(0, revenue || 0);
    const isFullShift = shiftType === 1;
    
    const config = GRADE_CONFIG[validGrade];
    const base = isFullShift ? config.baseFull : config.baseHalf;
    const breakage = isFullShift ? config.breakageFull : config.breakageHalf;
    const percentAmount = Math.round(validRevenue * config.percent / 100);
    const total = base - breakage + percentAmount;
    
    return {
      base,
      breakage,
      percent: config.percent,
      percentAmount,
      total,
      gradeName: config.name
    };
  }

  // Show salary calculator modal
  function showSalaryCalculatorModal(revenue) {
    const grade = profile.grade || '';
    const gradeInfo = GRADE_CONFIG[grade];
    
    // Get current date for default month
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    // Function to calculate salary for a specific month
    function calculateForMonth(year, month) {
      const monthKey = `${year}-${String(month).padStart(2, '0')}`;
      let fullShifts = 0;
      let halfShifts = 0;
      
      Object.entries(shifts).forEach(([dateKey, value]) => {
        if (dateKey.startsWith(monthKey)) {
          if (value === 1) fullShifts++;
          else if (value === 0.5) halfShifts++;
        }
      });
      
      return { fullShifts, halfShifts };
    }
    
    // Initial calculation for current month
    let selectedYear = currentYear;
    let selectedMonth = currentMonth;
    let { fullShifts, halfShifts } = calculateForMonth(selectedYear, selectedMonth);
    let totalShifts = fullShifts + halfShifts * 0.5;
    
    const modal = document.createElement('div');
    modal.className = 'rename-modal salary-modal';
    
    if (!grade || !gradeInfo) {
      // No grade selected - show warning
      modal.innerHTML = `
        <div class="salary-modal-content">
          <div class="salary-modal-header">
            <h2 class="salary-modal-title">⚠️ Грейд не выбран</h2>
          </div>
          <div class="salary-modal-body">
            <p class="salary-warning-text">Для расчёта зарплаты необходимо выбрать грейд в профиле.</p>
          </div>
          <button class="btn primary salary-modal-close" id="salary-close">Понятно</button>
        </div>
      `;
    } else {
      // Generate month options (current year and next year)
      const monthNames = [
        'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
      ];
      
      let monthOptions = '';
      // Previous 3 months
      for (let i = 3; i >= 1; i--) {
        const d = new Date(currentYear, currentMonth - i, 1);
        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        monthOptions += `<option value="${y}-${m}">${monthNames[m - 1]} ${y}</option>`;
      }
      // Current month
      monthOptions += `<option value="${currentYear}-${currentMonth}" selected>${monthNames[currentMonth - 1]} ${currentYear}</option>`;
      // Next 12 months
      for (let i = 1; i <= 12; i++) {
        const d = new Date(currentYear, currentMonth - 1 + i, 1);
        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        monthOptions += `<option value="${y}-${m}">${monthNames[m - 1]} ${y}</option>`;
      }
      
      // Calculate monthly salary
      const basePerShift = gradeInfo.baseFull - gradeInfo.breakageFull; // Net base per full shift
      const baseHalfShift = gradeInfo.baseHalf - gradeInfo.breakageHalf; // Net base per half shift
      const totalBase = (fullShifts * basePerShift) + (halfShifts * baseHalfShift);
      const percentAmount = Math.round(revenue * gradeInfo.percent / 100);
      const totalSalary = totalBase + percentAmount;
      
      modal.innerHTML = `
        <div class="salary-modal-content">
          <div class="salary-modal-header">
            <h2 class="salary-modal-title">🧮 Расчёт зарплаты</h2>
            <div class="form-group" style="margin-top: 12px;">
              <label style="font-size: 14px; color: var(--muted-foreground); margin-bottom: 6px; display: block;">Выберите месяц:</label>
              <select class="rename-input" id="salary-month-select" style="width: 100%;">
                ${monthOptions}
              </select>
            </div>
          </div>
          <div class="salary-modal-info">
            <div class="salary-info-row">
              <span class="salary-info-label">Ваш грейд:</span>
              <span class="salary-info-value">${grade} - ${gradeInfo.name}</span>
            </div>
            <div class="salary-info-row">
              <span class="salary-info-label">Смен отработано:</span>
              <span class="salary-info-value" id="shifts-count">${fullShifts} полных${halfShifts > 0 ? ` + ${halfShifts} пол` : ''}</span>
            </div>
            <div class="salary-info-row">
              <span class="salary-info-label">Выручка за месяц:</span>
              <span class="salary-info-value">${formatMoney(revenue)}</span>
            </div>
          </div>
          
          <div class="salary-result" id="salary-result">
            <div class="salary-result-title">Расчёт за месяц:</div>
            <div class="salary-result-rows" id="salary-result-rows">
              ${fullShifts > 0 ? `
              <div class="salary-row">
                <span>${fullShifts} полных смен × ${formatMoney(basePerShift)}</span>
                <span>${formatMoney(fullShifts * basePerShift)}</span>
              </div>
              ` : ''}
              ${halfShifts > 0 ? `
              <div class="salary-row">
                <span>${halfShifts} пол смен × ${formatMoney(baseHalfShift)}</span>
                <span>${formatMoney(halfShifts * baseHalfShift)}</span>
              </div>
              ` : ''}
              ${totalShifts === 0 ? `
              <div class="salary-row">
                <span>Нет отмеченных смен</span>
                <span>0 ₽</span>
              </div>
              ` : ''}
              ${gradeInfo.percent > 0 ? `
              <div class="salary-row salary-row-plus">
                <span>${gradeInfo.percent}% от выручки</span>
                <span>+${formatMoney(percentAmount)}</span>
              </div>
              ` : ''}
            </div>
            <div class="salary-result-total" id="salary-result-total">
              <div class="salary-total-row">
                <span>Итого:</span>
                <span class="salary-total-value">${formatMoney(totalSalary)}</span>
              </div>
            </div>
          </div>
          
          <div class="salary-single-shift">
            <div class="salary-single-title">Расчёт за одну смену:</div>
            <div class="salary-single-grid">
              <div class="salary-single-item">
                <span class="salary-single-label">Полная</span>
                <span class="salary-single-value">${formatMoney(basePerShift)}${gradeInfo.percent > 0 ? ` + ${gradeInfo.percent}%` : ''}</span>
              </div>
              <div class="salary-single-item">
                <span class="salary-single-label">Пол смены</span>
                <span class="salary-single-value">${formatMoney(baseHalfShift)}${gradeInfo.percent > 0 ? ` + ${gradeInfo.percent}%` : ''}</span>
              </div>
            </div>
          </div>
          
          <button class="btn secondary salary-modal-close" id="salary-close">Закрыть</button>
        </div>
      `;
    }
    
    document.body.appendChild(modal);
    
    // Month selector change handler
    const monthSelect = modal.querySelector('#salary-month-select');
    if (monthSelect) {
      monthSelect.addEventListener('change', () => {
        const [year, month] = monthSelect.value.split('-').map(Number);
        selectedYear = year;
        selectedMonth = month;
        
        // Recalculate for selected month
        const result = calculateForMonth(selectedYear, selectedMonth);
        fullShifts = result.fullShifts;
        halfShifts = result.halfShifts;
        totalShifts = fullShifts + halfShifts * 0.5;
        
        // Update display
        const shiftsCount = modal.querySelector('#shifts-count');
        if (shiftsCount) {
          shiftsCount.textContent = `${fullShifts} полных${halfShifts > 0 ? ` + ${halfShifts} пол` : ''}`;
        }
        
        // Recalculate salary
        const basePerShift = gradeInfo.baseFull - gradeInfo.breakageFull;
        const baseHalfShift = gradeInfo.baseHalf - gradeInfo.breakageHalf;
        const totalBase = (fullShifts * basePerShift) + (halfShifts * baseHalfShift);
        const percentAmount = Math.round(revenue * gradeInfo.percent / 100);
        const totalSalary = totalBase + percentAmount;
        
        // Update result rows
        const resultRows = modal.querySelector('#salary-result-rows');
        if (resultRows) {
          resultRows.innerHTML = `
            ${fullShifts > 0 ? `
            <div class="salary-row">
              <span>${fullShifts} полных смен × ${formatMoney(basePerShift)}</span>
              <span>${formatMoney(fullShifts * basePerShift)}</span>
            </div>
            ` : ''}
            ${halfShifts > 0 ? `
            <div class="salary-row">
              <span>${halfShifts} пол смен × ${formatMoney(baseHalfShift)}</span>
              <span>${formatMoney(halfShifts * baseHalfShift)}</span>
            </div>
            ` : ''}
            ${totalShifts === 0 ? `
            <div class="salary-row">
              <span>Нет отмеченных смен</span>
              <span>0 ₽</span>
            </div>
            ` : ''}
            ${gradeInfo.percent > 0 ? `
            <div class="salary-row salary-row-plus">
              <span>${gradeInfo.percent}% от выручки</span>
              <span>+${formatMoney(percentAmount)}</span>
            </div>
            ` : ''}
          `;
        }
        
        // Update total
        const totalValue = modal.querySelector('.salary-total-value');
        if (totalValue) {
          totalValue.textContent = formatMoney(totalSalary);
        }
      });
    }
    
    // Close button handler
    modal.querySelector('#salary-close').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
    
    // Close on Escape
    const escHandler = (e) => {
      if (e.key === 'Escape' && document.body.contains(modal)) {
        document.body.removeChild(modal);
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  }

  // Compute daily revenue from order history
  function computeDailyRevenue(targetDate = new Date()) {
    const isSameMonth = (ts) => {
      const d = new Date(ts);
      return d.getFullYear() === targetDate.getFullYear() && d.getMonth() === targetDate.getMonth();
    };
    
    const monthOrders = (orderHistory || []).filter(h => h.closedAt ? isSameMonth(h.closedAt) : isSameMonth(h.createdAt));
    
    // Group by date
    const dailyRevenue = {};
    monthOrders.forEach(h => {
      const dt = h.closedAt || h.createdAt || Date.now();
      const d = new Date(dt);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      
      if (!dailyRevenue[dateKey]) {
        dailyRevenue[dateKey] = { total: 0, orders: 0, date: d };
      }
      dailyRevenue[dateKey].total += (h.total || 0);
      dailyRevenue[dateKey].orders += 1;
    });
    
    // Convert to sorted array
    return Object.entries(dailyRevenue)
      .map(([key, data]) => ({ dateKey: key, ...data }))
      .sort((a, b) => new Date(b.dateKey) - new Date(a.dateKey));
  }

  // Show daily revenue modal
  function showDailyRevenueModal() {
    const dailyData = computeDailyRevenue(new Date());
    const totalRevenue = dailyData.reduce((sum, d) => sum + d.total, 0);
    const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    const currentMonth = monthNames[new Date().getMonth()];
    
    const modal = document.createElement('div');
    modal.className = 'rename-modal daily-revenue-modal';
    
    let listHtml = '';
    if (dailyData.length === 0) {
      listHtml = '<div class="daily-revenue-empty">Нет данных о выручке за этот месяц</div>';
    } else {
      dailyData.forEach(day => {
        const d = new Date(day.dateKey);
        const dayName = d.toLocaleDateString('ru-RU', { weekday: 'short' });
        const dayNum = d.getDate();
        const monthShort = d.toLocaleDateString('ru-RU', { month: 'short' });
        
        listHtml += `
          <div class="daily-revenue-item">
            <div class="daily-revenue-date">
              <span class="daily-date-num">${dayNum}</span>
              <span class="daily-date-month">${monthShort}</span>
              <span class="daily-date-day">${dayName}</span>
            </div>
            <div class="daily-revenue-info">
              <span class="daily-revenue-amount">${formatMoney(day.total)}</span>
              <span class="daily-revenue-orders">${day.orders} ${day.orders === 1 ? 'стол' : day.orders < 5 ? 'стола' : 'столов'}</span>
            </div>
          </div>
        `;
      });
    }
    
    modal.innerHTML = `
      <div class="daily-revenue-content">
        <div class="daily-revenue-header">
          <h2 class="daily-revenue-title">📊 Выручка по дням</h2>
          <p class="daily-revenue-subtitle">${currentMonth}</p>
        </div>
        <div class="daily-revenue-total">
          <span class="daily-total-label">Итого за месяц:</span>
          <span class="daily-total-value">${formatMoney(totalRevenue)}</span>
        </div>
        <div class="daily-revenue-list">
          ${listHtml}
        </div>
        <button class="btn secondary daily-revenue-close" id="daily-close">Закрыть</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close button
    modal.querySelector('#daily-close').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
    
    // Close on Escape
    const escHandler = (e) => {
      if (e.key === 'Escape' && document.body.contains(modal)) {
        document.body.removeChild(modal);
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  }

  
  function getTableDisplayName(tableNumber) {
    return tableNames[tableNumber] || `Стол ${tableNumber}`;
  }
  
  function showRenameTableModal(tableNumber) {
    const modal = document.createElement('div');
    modal.className = 'rename-modal';
    modal.innerHTML = `
      <div class="rename-content">
        <div class="rename-title">Переименовать стол</div>
        <input type="text" class="rename-input" id="rename-input" value="${getTableDisplayName(tableNumber)}" placeholder="Введите название стола">
        <div class="rename-actions">
          <button class="btn secondary" id="rename-cancel">Отмена</button>
          <button class="btn primary" id="rename-save">Сохранить</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    const input = modal.querySelector('#rename-input');
    const cancelBtn = modal.querySelector('#rename-cancel');
    const saveBtn = modal.querySelector('#rename-save');
    
    // Focus and select text
    input.focus();
    input.select();
    
    // Event handlers
    cancelBtn.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    saveBtn.addEventListener('click', () => {
      const newName = input.value.trim();
      if (newName) {
        tableNames[tableNumber] = newName;
        saveTableNames();
        render(); // Re-render to update all table names
      }
      document.body.removeChild(modal);
    });
    
    // Close on Enter key
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        saveBtn.click();
      }
    });
    
    // Close on Escape key
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        cancelBtn.click();
      }
    });
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        cancelBtn.click();
      }
    });
  }

  function showTableManagementModal(tableNumber) {
    const displayName = getTableDisplayName(tableNumber);
    const hasOrders = tableOrders[tableNumber] && tableOrders[tableNumber].length > 0;
    
    const modal = document.createElement('div');
    modal.className = 'rename-modal table-management-modal';
    modal.innerHTML = `
      <div class="table-management-content">
        <div class="table-management-header">
          <h2 class="table-management-title">${displayName}</h2>
          <p class="table-management-subtitle">Управление столом</p>
          <button class="modal-close-btn" id="modal-close">&times;</button>
        </div>
        
        <div class="table-management-actions">
          <button class="table-action-btn rename-action disabled-temp" id="action-rename" disabled>
            <span class="action-icon">✏️</span>
            <span class="action-text">Переименовать</span>
          </button>
          
          <button class="table-action-btn clear-action disabled-temp ${!hasOrders ? 'disabled' : ''}" id="action-clear" disabled>
            <span class="action-icon">🧹</span>
            <span class="action-text">Очистить стол</span>
          </button>
          
          <button class="table-action-btn delete-action disabled-temp" id="action-delete" disabled>
            <span class="action-icon">🗑️</span>
            <span class="action-text">Удалить стол</span>
          </button>
        </div>
        
        <button class="table-management-cancel disabled-temp" id="action-cancel" disabled>Отмена</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Enable buttons after 350ms delay to prevent accidental clicks
    setTimeout(() => {
      modal.querySelectorAll('.disabled-temp').forEach(btn => {
        btn.classList.remove('disabled-temp');
        btn.disabled = false;
        // Re-disable clear button if no orders
        if (btn.id === 'action-clear' && !hasOrders) {
          btn.disabled = true;
        }
      });
    }, 350);
    
    // Close button
    modal.querySelector('#modal-close').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    // Rename action
    modal.querySelector('#action-rename').addEventListener('click', () => {
      if (modal.querySelector('#action-rename').disabled) return;
      document.body.removeChild(modal);
      showRenameTableModal(tableNumber);
    });
    
    // Clear table action
    modal.querySelector('#action-clear').addEventListener('click', () => {
      if (!hasOrders || modal.querySelector('#action-clear').disabled) return;
      
      document.body.removeChild(modal);
      showConfirmModal(
        'Очистить стол',
        `Удалить все заказы из "${displayName}"?`,
        () => {
          // Save to order history before clearing
          const items = tableOrders[tableNumber] || [];
          const total = computeTableTotalAmount(tableNumber);
          if (items.length > 0) {
            orderHistory.push({
              table: tableNumber,
              tableName: displayName,
              items: items.map(i => ({ itemName: i.itemName, quantity: i.quantity, price: i.price })),
              total: total,
              createdAt: items[0]?.createdAt || Date.now(),
              closedAt: Date.now()
            });
            saveOrderHistory();
          }
          
          tableOrders[tableNumber] = [];
          saveTableOrders();
          updateTakeoutButtonVisibility();
          render();
        }
      );
    });
    
    // Delete table action
    modal.querySelector('#action-delete').addEventListener('click', () => {
      if (modal.querySelector('#action-delete').disabled) return;
      document.body.removeChild(modal);
      showConfirmModal(
        'Удалить стол',
        `Удалить "${displayName}" и все его заказы?`,
        () => {
          // Save to order history before deleting
          const items = tableOrders[tableNumber] || [];
          const total = computeTableTotalAmount(tableNumber);
          if (items.length > 0) {
            orderHistory.push({
              table: tableNumber,
              tableName: displayName,
              items: items.map(i => ({ itemName: i.itemName, quantity: i.quantity, price: i.price })),
              total: total,
              createdAt: items[0]?.createdAt || Date.now(),
              closedAt: Date.now()
            });
            saveOrderHistory();
          }
          
          activeTables = activeTables.filter(t => t !== tableNumber);
          delete tableOrders[tableNumber];
          delete tableNames[tableNumber];
          saveTables();
          saveTableOrders();
          saveTableNames();
          updateTakeoutButtonVisibility();
          render();
        }
      );
    });
    
    // Cancel
    modal.querySelector('#action-cancel').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    // УБРАНО: Закрытие по клику на backdrop - теперь только через кнопки
    // modal.addEventListener('click', (e) => {
    //   if (e.target === modal) {
    //     document.body.removeChild(modal);
    //   }
    // });
    
    // Show with animation
    requestAnimationFrame(() => {
      modal.classList.add('visible');
    });
  }

  function showCookingLevelModal(dishName, callback) {
    const modal = document.createElement('div');
    modal.className = 'rename-modal chain-modal';
    modal.innerHTML = `
      <div class="chain-content">
        <div class="chain-header">
          <div class="chain-step-indicator">
            <span class="step-dot active"></span>
            <span class="step-line"></span>
            <span class="step-dot"></span>
            <span class="step-line"></span>
            <span class="step-dot"></span>
          </div>
          <span class="chain-step-text">Шаг 1 из 3</span>
          <h2 class="chain-title">Прожарка стейка</h2>
          <p class="chain-subtitle">Желаемая прожарка стейка у гостя</p>
        </div>
        
        <div class="chain-list-vertical cooking-grid">
          <button class="chain-list-btn" data-level="Blue">
            <span class="chain-btn-name">Blue</span>
            <span class="chain-btn-desc">С кровью</span>
          </button>
          <button class="chain-list-btn" data-level="Rare">
            <span class="chain-btn-name">Rare</span>
            <span class="chain-btn-desc">Слабая</span>
          </button>
          <button class="chain-list-btn" data-level="Medium Rare">
            <span class="chain-btn-name">Medium Rare</span>
            <span class="chain-btn-desc">Средне-слабая</span>
          </button>
          <button class="chain-list-btn" data-level="Medium">
            <span class="chain-btn-name">Medium</span>
            <span class="chain-btn-desc">Средняя</span>
          </button>
          <button class="chain-list-btn" data-level="Medium Well">
            <span class="chain-btn-name">Medium Well</span>
            <span class="chain-btn-desc">Средне-сильная</span>
          </button>
          <button class="chain-list-btn" data-level="Well Done">
            <span class="chain-btn-name">Well Done</span>
            <span class="chain-btn-desc">Полная</span>
          </button>
        </div>
        
        <button class="chain-skip-btn" id="cooking-cancel">Отмена</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    const cancelBtn = modal.querySelector('#cooking-cancel');
    const levelBtns = modal.querySelectorAll('.chain-list-btn');
    
    // Event handlers for cooking level buttons
    levelBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const level = btn.dataset.level;
        document.body.removeChild(modal);
        callback(level);
      });
    });
    
    // Cancel button
    cancelBtn.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
    
    // Close on Escape key
    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape') {
        if (document.body.contains(modal)) {
          document.body.removeChild(modal);
        }
        document.removeEventListener('keydown', escHandler);
      }
    });
  }

  function showIceCreamFlavorModal(dishName, callback) {
    const flavors = {
      vanilla: { name: 'Ваниль', emoji: '🤍' },
      chocolate: { name: 'Шоколад', emoji: '🤎' },
      strawberry: { name: 'Клубника', emoji: '🩷' }
    };
    
    let selectedFlavors = { vanilla: 0, chocolate: 0, strawberry: 0 };
    let totalScoops = 0;
    
    const modal = document.createElement('div');
    modal.className = 'rename-modal ice-cream-modal';
    modal.innerHTML = `
      <div class="rename-content ice-cream-content">
        <div class="rename-title">Выберите вкусы мороженого</div>
        <div class="ice-cream-dish">${dishName}</div>
        <div class="ice-cream-subtitle">Выберите 3 шарика (можно одинаковые)</div>
        
        <div class="ice-cream-flavors">
          <div class="ice-cream-flavor-item" data-flavor="vanilla">
            <div class="flavor-name">${flavors.vanilla.emoji} ${flavors.vanilla.name}</div>
            <div class="flavor-controls">
              <button class="flavor-btn flavor-minus" data-flavor="vanilla">−</button>
              <span class="flavor-count" data-flavor="vanilla">0</span>
              <button class="flavor-btn flavor-plus" data-flavor="vanilla">+</button>
            </div>
          </div>
          
          <div class="ice-cream-flavor-item" data-flavor="chocolate">
            <div class="flavor-name">${flavors.chocolate.emoji} ${flavors.chocolate.name}</div>
            <div class="flavor-controls">
              <button class="flavor-btn flavor-minus" data-flavor="chocolate">−</button>
              <span class="flavor-count" data-flavor="chocolate">0</span>
              <button class="flavor-btn flavor-plus" data-flavor="chocolate">+</button>
            </div>
          </div>
          
          <div class="ice-cream-flavor-item" data-flavor="strawberry">
            <div class="flavor-name">${flavors.strawberry.emoji} ${flavors.strawberry.name}</div>
            <div class="flavor-controls">
              <button class="flavor-btn flavor-minus" data-flavor="strawberry">−</button>
              <span class="flavor-count" data-flavor="strawberry">0</span>
              <button class="flavor-btn flavor-plus" data-flavor="strawberry">+</button>
            </div>
          </div>
        </div>
        
        <div class="ice-cream-total">Выбрано шариков: <span id="total-scoops">0</span> / 3</div>
        
        <div class="ice-cream-actions">
          <button class="btn secondary" id="ice-cream-cancel">Отмена</button>
          <button class="btn primary" id="ice-cream-confirm" disabled>Подтвердить</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    const updateTotal = () => {
      totalScoops = selectedFlavors.vanilla + selectedFlavors.chocolate + selectedFlavors.strawberry;
      modal.querySelector('#total-scoops').textContent = totalScoops;
      modal.querySelector('#ice-cream-confirm').disabled = totalScoops !== 3;
    };
    
    // Plus buttons
    modal.querySelectorAll('.flavor-plus').forEach(btn => {
      btn.addEventListener('click', () => {
        const flavor = btn.dataset.flavor;
        if (totalScoops < 3) {
          selectedFlavors[flavor]++;
          modal.querySelector(`.flavor-count[data-flavor="${flavor}"]`).textContent = selectedFlavors[flavor];
          updateTotal();
        }
      });
    });
    
    // Minus buttons
    modal.querySelectorAll('.flavor-minus').forEach(btn => {
      btn.addEventListener('click', () => {
        const flavor = btn.dataset.flavor;
        if (selectedFlavors[flavor] > 0) {
          selectedFlavors[flavor]--;
          modal.querySelector(`.flavor-count[data-flavor="${flavor}"]`).textContent = selectedFlavors[flavor];
          updateTotal();
        }
      });
    });
    
    // Confirm button
    modal.querySelector('#ice-cream-confirm').addEventListener('click', () => {
      const flavorText = [];
      if (selectedFlavors.vanilla > 0) flavorText.push(`${flavors.vanilla.name} x${selectedFlavors.vanilla}`);
      if (selectedFlavors.chocolate > 0) flavorText.push(`${flavors.chocolate.name} x${selectedFlavors.chocolate}`);
      if (selectedFlavors.strawberry > 0) flavorText.push(`${flavors.strawberry.name} x${selectedFlavors.strawberry}`);
      
      const result = flavorText.join(', ');
      console.log('Ice cream modal confirm - flavorText:', result);
      document.body.removeChild(modal);
      callback(result);
    });
    
    // Cancel button
    modal.querySelector('#ice-cream-cancel').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }

  // Juice flavor selection modal
  function showJuiceFlavorModal(dishName, callback) {
    const flavors = [
      { id: 'apple', name: 'Яблоко', emoji: '🍏' },
      { id: 'orange', name: 'Апельсин', emoji: '🍊' },
      { id: 'cherry', name: 'Вишня', emoji: '🍒' },
      { id: 'tomato', name: 'Томат', emoji: '🍅' }
    ];
    
    const modal = document.createElement('div');
    modal.className = 'rename-modal ice-cream-modal';
    modal.innerHTML = `
      <div class="rename-content ice-cream-content">
        <div class="rename-title">Выберите вкус сока</div>
        <div class="ice-cream-dish">${dishName}</div>
        
        <div class="ice-cream-flavors juice-flavors">
          ${flavors.map(f => `
            <div class="juice-flavor-item" data-flavor="${f.id}">
              <span class="flavor-emoji">${f.emoji}</span>
              <span class="flavor-name">${f.name}</span>
            </div>
          `).join('')}
        </div>
        
        <div class="ice-cream-actions">
          <button class="btn secondary" id="juice-cancel">Отмена</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Flavor selection
    modal.querySelectorAll('.juice-flavor-item').forEach(item => {
      item.addEventListener('click', () => {
        const flavorId = item.dataset.flavor;
        const flavor = flavors.find(f => f.id === flavorId);
        document.body.removeChild(modal);
        callback(flavor.name);
      });
    });
    
    // Cancel button
    modal.querySelector('#juice-cancel').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }

  // Red Bull flavor selection modal
  function showRedBullFlavorModal(dishName, callback) {
    const flavors = [
      { id: 'energy', name: 'Energy Drink', emoji: '⚡' },
      { id: 'sugarfree', name: 'Sugarfree (Без сахара)', emoji: '💚' },
      { id: 'red', name: 'The Red Edition', emoji: '❤️' }
    ];
    
    const modal = document.createElement('div');
    modal.className = 'rename-modal ice-cream-modal';
    modal.innerHTML = `
      <div class="rename-content ice-cream-content">
        <div class="rename-title">Выберите вид Red Bull</div>
        <div class="ice-cream-dish">${dishName}</div>
        
        <div class="ice-cream-flavors juice-flavors">
          ${flavors.map(f => `
            <div class="juice-flavor-item" data-flavor="${f.id}">
              <span class="flavor-emoji">${f.emoji}</span>
              <span class="flavor-name">${f.name}</span>
            </div>
          `).join('')}
        </div>
        
        <div class="ice-cream-actions">
          <button class="btn secondary" id="redbull-cancel">Отмена</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Flavor selection
    modal.querySelectorAll('.juice-flavor-item').forEach(item => {
      item.addEventListener('click', () => {
        const flavorId = item.dataset.flavor;
        const flavor = flavors.find(f => f.id === flavorId);
        document.body.removeChild(modal);
        callback(flavor.name);
      });
    });
    
    // Cancel button
    modal.querySelector('#redbull-cancel').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }

  // Green/Herbal tea flavor selection modal
  function showGreenTeaFlavorModal(dishName, callback) {
    const flavors = [
      { id: 'sencha', name: 'Сенча', emoji: '🍃' },
      { id: 'jasmine', name: 'Жасмин', emoji: '🌸' },
      { id: 'oolong', name: 'Молочный Улун', emoji: '🥛' },
      { id: 'taiga', name: 'Таёжный', emoji: '🌲' },
      { id: 'chamomile', name: 'Ромашковый', emoji: '🌼' },
      { id: 'buckwheat', name: 'Гречишный', emoji: '🌾' }
    ];
    
    const modal = document.createElement('div');
    modal.className = 'rename-modal ice-cream-modal';
    modal.innerHTML = `
      <div class="rename-content ice-cream-content">
        <div class="rename-title">Выберите вкус чая</div>
        <div class="ice-cream-dish">${dishName}</div>
        
        <div class="ice-cream-flavors juice-flavors tea-flavors">
          ${flavors.map(f => `
            <div class="juice-flavor-item" data-flavor="${f.id}">
              <span class="flavor-emoji">${f.emoji}</span>
              <span class="flavor-name">${f.name}</span>
            </div>
          `).join('')}
        </div>
        
        <div class="ice-cream-actions">
          <button class="btn secondary" id="tea-cancel">Отмена</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Flavor selection
    modal.querySelectorAll('.juice-flavor-item').forEach(item => {
      item.addEventListener('click', () => {
        const flavorId = item.dataset.flavor;
        const flavor = flavors.find(f => f.id === flavorId);
        document.body.removeChild(modal);
        callback(flavor.name);
      });
    });
    
    // Cancel button
    modal.querySelector('#tea-cancel').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }

  // Black/Fruit tea flavor selection modal
  function showBlackTeaFlavorModal(dishName, callback) {
    const flavors = [
      { id: 'assam', name: 'Ассам', emoji: '🫖' },
      { id: 'earlgrey', name: 'Эрл Грей', emoji: '🍋' },
      { id: 'fruitpunch', name: 'Фруктовый пунш', emoji: '🍹' },
      { id: 'ceylon', name: 'Цейлонский с чабрецом', emoji: '🌿' }
    ];
    
    const modal = document.createElement('div');
    modal.className = 'rename-modal ice-cream-modal';
    modal.innerHTML = `
      <div class="rename-content ice-cream-content">
        <div class="rename-title">Выберите вкус чая</div>
        <div class="ice-cream-dish">${dishName}</div>
        
        <div class="ice-cream-flavors juice-flavors">
          ${flavors.map(f => `
            <div class="juice-flavor-item" data-flavor="${f.id}">
              <span class="flavor-emoji">${f.emoji}</span>
              <span class="flavor-name">${f.name}</span>
            </div>
          `).join('')}
        </div>
        
        <div class="ice-cream-actions">
          <button class="btn secondary" id="tea-cancel">Отмена</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Flavor selection
    modal.querySelectorAll('.juice-flavor-item').forEach(item => {
      item.addEventListener('click', () => {
        const flavorId = item.dataset.flavor;
        const flavor = flavors.find(f => f.id === flavorId);
        document.body.removeChild(modal);
        callback(flavor.name);
      });
    });
    
    // Cancel button
    modal.querySelector('#tea-cancel').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }

  // Garnish selection modal for steak chain
  function showGarnishModal(steakName, callback) {
    const modal = document.createElement('div');
    modal.className = 'rename-modal chain-modal';
    modal.innerHTML = `
      <div class="chain-content">
        <div class="chain-header">
          <div class="chain-step-indicator">
            <span class="step-dot completed"></span>
            <span class="step-line completed"></span>
            <span class="step-dot active"></span>
            <span class="step-line"></span>
            <span class="step-dot"></span>
          </div>
          <span class="chain-step-text">Шаг 2 из 3</span>
          <h2 class="chain-title">Гарнир к стейку</h2>
          <p class="chain-subtitle">Выберите гарнир или пропустите этот шаг</p>
        </div>
        
        <div class="chain-list-vertical">
          ${STEAK_GARNISHES.map(g => `
            <button class="chain-list-btn" data-name="${g.name}" data-rkeeper="${g.rkeeper}" data-price="${g.price}">
              <span class="chain-btn-emoji">${g.emoji}</span>
              <span class="chain-btn-name">${g.name}</span>
            </button>
          `).join('')}
        </div>
        
        <button class="chain-skip-btn" id="garnish-skip">Пропустить</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Garnish selection
    modal.querySelectorAll('.chain-list-btn').forEach(item => {
      item.addEventListener('click', () => {
        const garnish = {
          name: item.dataset.name,
          rkeeper: item.dataset.rkeeper,
          price: item.dataset.price
        };
        document.body.removeChild(modal);
        callback(garnish);
      });
    });
    
    // Skip button
    modal.querySelector('#garnish-skip').addEventListener('click', () => {
      document.body.removeChild(modal);
      callback(null);
    });
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
        callback(null);
      }
    });
  }

  // Sauce selection modal for steak chain
  function showSauceModal(steakName, callback) {
    const modal = document.createElement('div');
    modal.className = 'rename-modal chain-modal';
    modal.innerHTML = `
      <div class="chain-content">
        <div class="chain-header">
          <div class="chain-step-indicator">
            <span class="step-dot completed"></span>
            <span class="step-line completed"></span>
            <span class="step-dot completed"></span>
            <span class="step-line completed"></span>
            <span class="step-dot active"></span>
          </div>
          <span class="chain-step-text">Шаг 3 из 3</span>
          <h2 class="chain-title">Соус к стейку</h2>
          <p class="chain-subtitle">Выберите соус или пропустите этот шаг</p>
        </div>
        
        <div class="chain-list-vertical">
          ${STEAK_SAUCES.map(s => `
            <button class="chain-list-btn" data-name="${s.name}" data-rkeeper="${s.rkeeper}" data-price="${s.price}">
              <span class="chain-btn-emoji">${s.emoji}</span>
              <span class="chain-btn-name">${s.name}</span>
            </button>
          `).join('')}
        </div>
        
        <button class="chain-skip-btn" id="sauce-skip">Пропустить</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Sauce selection
    modal.querySelectorAll('.chain-list-btn').forEach(item => {
      item.addEventListener('click', () => {
        const sauce = {
          name: item.dataset.name,
          rkeeper: item.dataset.rkeeper,
          price: item.dataset.price
        };
        document.body.removeChild(modal);
        callback(sauce);
      });
    });
    
    // Skip button
    modal.querySelector('#sauce-skip').addEventListener('click', () => {
      document.body.removeChild(modal);
      callback(null);
    });
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
        callback(null);
      }
    });
  }

  // Full steak chain: Cooking Level (for classic) -> Garnish -> Sauce
  function showSteakChain(dish, tableNumber, onComplete) {
    const isAlternative = isAlternativeSteak(dish.name);
    
    const steakOrder = {
      dish: dish,
      cookingLevel: null,
      garnish: null,
      sauce: null
    };
    
    // Function to continue with garnish/sauce chain
    const continueWithGarnishSauce = () => {
      // Step: Garnish (if enabled)
      if (dishChainSettings.steaks.garnishes) {
        showGarnishModal(dish.name, (garnish) => {
          steakOrder.garnish = garnish;
          
          // Step: Sauce (if enabled)
          if (dishChainSettings.steaks.sauces) {
            showSauceModal(dish.name, (sauce) => {
              steakOrder.sauce = sauce;
              onComplete(steakOrder);
            });
          } else {
            onComplete(steakOrder);
          }
        });
      } else if (dishChainSettings.steaks.sauces) {
        // Skip garnish, go to sauce
        showSauceModal(dish.name, (sauce) => {
          steakOrder.sauce = sauce;
          onComplete(steakOrder);
        });
      } else {
        // No chain options enabled
        onComplete(steakOrder);
      }
    };
    
    // Alternative steaks: skip cooking level, go directly to garnish/sauce
    if (isAlternative) {
      continueWithGarnishSauce();
    } else {
      // Classic steaks: start with cooking level
      showCookingLevelModal(dish.name, (cookingLevel) => {
        if (!cookingLevel) {
          return; // Cancelled
        }
        steakOrder.cookingLevel = cookingLevel;
        continueWithGarnishSauce();
      });
    }
  }

  async function loadDb(forceReload = false) {
    if (db && !forceReload) return db;
    try {
  // Try to load from embedded data first
  if (typeof DISHES_DATA !== 'undefined') {
    db = DISHES_DATA;
    // Mark kitchen dishes with source property
    if (db.dishes && Array.isArray(db.dishes)) {
      db.dishes = db.dishes.map(dish => ({ ...dish, source: dish.source || 'kitchen' }));
    }
    console.log('Loaded dishes from embedded data:', db.dishes.length, 'dishes');
    
    // Add bar drinks if available
    if (typeof BAR_DRINKS_DATA !== 'undefined' && BAR_DRINKS_DATA.dishes) {
      // Mark bar drinks with source: 'bar'
      const markedBarDrinks = BAR_DRINKS_DATA.dishes.map(drink => ({ ...drink, source: 'bar' }));
      db.dishes = [...db.dishes, ...markedBarDrinks];
      console.log('Added bar drinks:', markedBarDrinks.length, 'drinks');
      console.log('Total items:', db.dishes.length);
    }
    
    return db;
  }
      
      // Fallback to fetch
      const res = await fetch(`./dishes.json?t=${Date.now()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      
      const text = await res.text();
      console.log('Raw response length:', text.length);
      
      // Try to parse JSON
      try {
        db = JSON.parse(text);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.log('First 500 chars of response:', text.substring(0, 500));
        throw new Error(`JSON parse error: ${parseError.message}`);
      }
      
      if (!db || !db.dishes || !Array.isArray(db.dishes)) {
        throw new Error('Invalid JSON structure: missing dishes array');
      }
      
      // Mark dishes with source property (default 'kitchen' if not set)
      db.dishes = db.dishes.map(dish => ({ ...dish, source: dish.source || 'kitchen' }));
      
      console.log('Successfully loaded dishes.json:', db.dishes.length, 'dishes');
      console.log('First few dishes:', db.dishes.slice(0, 3).map(d => d.name));
      console.log('Categories found:', [...new Set(db.dishes.map(d => d.category))]);
      return db;
    } catch (error) {
      console.error('Failed to load dishes.json:', error);
      throw error; // Re-throw to trigger error handling in viewTable
    }
  }

  function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (crypto.getRandomValues(new Uint8Array(1))[0] & 15) >> 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function calculatePrice(priceString, category) {
    if (!priceString) return '—';
    
    // Extract base prices from string like "350/400 рублей"
    const prices = priceString.match(/(\d+)/g);
    if (!prices || prices.length < 2) return priceString;
    
    const weekdayPrice = parseInt(prices[0]);
    const weekendPrice = parseInt(prices[1]);
    
    // Use Moscow time for pricing rules
    const now = new Date();
    const moscowString = now.toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });
    const [datePart, timePart] = moscowString.split(',').map(s => s.trim());
    const parts = timePart ? timePart.split(':').map(n => parseInt(n, 10)) : [now.getHours(), now.getMinutes(), 0];
    const hours = parts[0] || 0;
    const moscowDay = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Moscow' })).getDay();
    const isWeekend = moscowDay === 0 || moscowDay === 6; // Sunday or Saturday
    const isBefore5PM = hours < 17;
    
    if (isWeekend || !isBefore5PM) {
      return `${weekendPrice} ₽`;
    } else {
      return `${weekdayPrice} ₽`;
    }
  }
  
  // Helper functions to determine item type (bar drink or dish)
  function isBarItem(order) {
    // First check source field (new orders)
    if (order.source === 'bar') return true;
    if (order.source === 'dishes' || order.source === 'kitchen') return false;
    
    // Fallback for old orders without source field - check category
    const category = (order.category || '').toUpperCase();
    // All categories from bar_drinks.js
    const barCategories = [
      // Безалкогольные
      'НАПИТКИ', 'ГАЗ. НАПИТКИ', 'ПИВО', 'ЛИМОНАДЫ', 'ЧАЙ', 'КОФЕ', 
      'КОФЕ НА АЛЬТЕРНАТИВНОМ МОЛОКЕ', 'БАБЛ ТИ',
      // Вино
      'ИГРИСТОЕ БРЮТ', 'SPARKLING BRUT', 'БЕЛОЕ', 'WHITE', 'КРАСНОЕ', 'RED', 
      'РОЗОВОЕ', 'ROSE', 'SPLIT BOTTLE',
      // Крепкий алкоголь
      'ДЖИН', 'GIN', 'ВИСКИ', 'WHISKY', 'WHISKEY', 'ВОДКА', 'VODKA', 
      'ТЕКИЛА', 'TEQUILA', 'РОМ', 'RUM', 'КОНЬЯК', 'COGNAC', 'БРЕНДИ', 'BRANDY',
      'ЛИКЕР', 'LIQUEUR', 'АПЕРИТИВ', 'ДИЖЕСТИВ',
      // Коктейли
      'НА РОМЕ', 'НА ВОДКЕ', 'НА ВИСКИ', 'НА ДЖИНЕ', 'НА ТЕКИЛЕ',
      'НА ИГРИСТОМ ВИНЕ', 'THE БЫК',
      'ШОТЫ', 'SHOTS', 'КОКТЕЙЛИ', 'COCKTAILS', 'АВТОРСКИЕ', 'КЛАССИЧЕСКИЕ',
      // Другое
      'ГЛИНТВЕЙН', 'ГРОГ', 'ПУНШ'
    ];
    return barCategories.some(cat => category.includes(cat));
  }
  
  function isDishItem(order) {
    // First check source field (new orders)
    if (order.source === 'dishes' || order.source === 'kitchen') return true;
    if (order.source === 'bar') return false;
    
    // Fallback for old orders without source field - not a bar item = dish
    return !isBarItem(order);
  }

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

  // Helpers to compute totals
  function parsePriceToNumber(text) {
    const m = String(text || '').match(/(\d+)/);
    return m ? parseInt(m[1], 10) : 0;
  }
  function computeItemsTotal(items) {
    return (Array.isArray(items) ? items : []).reduce((sum, o) => {
      const unit = parsePriceToNumber(o.calculatedPrice) || parsePriceToNumber(o.price);
      const qty = o.quantity || 1;
      return sum + unit * qty;
    }, 0);
  }
  function computeTableTotalAmount(tableNum) {
    return computeItemsTotal(tableOrders[tableNum]);
  }
  function isCategoryGroupEnabled(groupId) {
    // В ручном режиме группировка отключена
    if (courseMode === 'manual') return false;
    
    const cfg = CATEGORY_CONFIG[groupId];
    if (!cfg) return true;
    return categoryGrouping[cfg.key] !== false;
  }
  
  // Function to sort table orders by category
  // Sort only by status (no status -> rkeeper -> served)
  // This is called when user changes status of an order
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

  function reapplyCategoryGroupingToAllTables() {
    Object.keys(tableOrders || {}).forEach(key => {
      const tableNum = Number(key);
      if (!Number.isNaN(tableNum)) {
        sortTableOrdersByCategory(tableNum);
      }
    });
  }

  // Router
  function navigate(path) {
    history.pushState({}, '', path);
    render();
  }
  window.addEventListener('popstate', render);

  // Page navigation
  function setPage(page) {
    currentPage = page;
    try { localStorage.setItem(STORAGE_KEYS.activePage, currentPage); } catch {}
    updateNavItems();
    render();
  }

  function updateNavItems() {
    // Support both old and new nav items
    document.querySelectorAll('.nav-item, .nav-item-redesign').forEach(item => {
      item.classList.toggle('active', item.dataset.page === currentPage);
    });
  }

  // Update navigation based on user role
  function updateNavigation() {
    const bottomNav = document.querySelector('.bottom-nav');
    if (!bottomNav) return;
    
    // Убираем все менеджерские вкладки, если они были добавлены
    const managerTabs = ['users', 'stoplist', 'positions'];
    managerTabs.forEach(tab => {
      const navItem = bottomNav.querySelector(`[data-page="${tab}"]`);
      if (navItem) {
        navItem.remove();
      }
    });
  }

  // Search Hub - главная страница поиска с кнопками
  // Проверка роли менеджера (включая старших официантов с грейдом 3+)
  function isManager() {
    // Проверяем authSession (данные с сервера)
    if (authSession && authSession.role) {
      const role = authSession.role.toLowerCase();
      if (role === 'manager' || role === 'admin') {
        return true;
      }
    }
    
    // Проверяем локальный profile (для обратной совместимости)
    const role = (profile.role || '').toLowerCase();
    const grade = parseInt(profile.grade) || 0;
    
    // Менеджеры и админы
    if (role.includes('менеджер') || role.includes('manager') || 
        role.includes('админ') || role.includes('admin')) {
      return true;
    }
    
    // Старшие официанты (грейд 3+)
    if (grade >= 3) {
      return true;
    }
    
    return false;
  }

  // Tools Hub - главная страница инструментов
  function viewTools() {
    const wrapper = document.createElement('div');
    wrapper.className = 'page';
    
    const panel = document.createElement('section');
    panel.className = 'panel settings-panel';
    
    // Базовые функции для всех
    let html = `
      <div class="panel-header">
        <h2>Инструменты</h2>
      </div>
      
      <div class="settings-section">
        <div class="settings-item" id="search-dishes-btn">
          <div class="settings-item-content">
            <span class="settings-icon">🔍</span>
            <div class="settings-text">
              <div class="settings-title">Поиск блюд</div>
              <div class="settings-subtitle">Найти блюдо по названию, составу или аллергенам</div>
            </div>
          </div>
          <span class="settings-arrow">›</span>
        </div>
        
        <div class="settings-item" id="stop-list-view-btn">
          <div class="settings-item-content">
            <span class="settings-icon">🚫</span>
            <div class="settings-text">
              <div class="settings-title">Стоп-лист</div>
              <div class="settings-subtitle">Управление блюдами, которые недоступны</div>
            </div>
          </div>
          <span class="settings-arrow">›</span>
        </div>
        
        <div class="settings-item" id="positions-btn">
          <div class="settings-item-content">
            <span class="settings-icon">📋</span>
            <div class="settings-text">
              <div class="settings-title">Позиционник</div>
              <div class="settings-subtitle">Распределение официантов по позициям</div>
            </div>
          </div>
          <span class="settings-arrow">›</span>
        </div>
        
        <div class="settings-item" id="transfer-order-btn">
          <div class="settings-item-content">
            <span class="settings-icon">📤</span>
            <div class="settings-text">
              <div class="settings-title">Передать официанту</div>
              <div class="settings-subtitle">Передать заказ другому официанту</div>
            </div>
          </div>
          <span class="settings-arrow">›</span>
        </div>
        
        <div class="settings-item" id="restaurant-map-btn">
          <div class="settings-item-content">
            <span class="settings-icon">🗺️</span>
            <div class="settings-text">
              <div class="settings-title">Карта ресторана</div>
              <div class="settings-subtitle">Схема зала и расположение столов</div>
            </div>
          </div>
          <span class="settings-arrow">›</span>
        </div>
      </div>
    `;
    
    // Менеджерская секция (только для менеджеров и админов)
    if (isManager()) {
      html += `
      <div class="settings-section manager-section">
        <div class="section-header manager-header">
          <span class="section-icon">👔</span>
          <span class="section-title">Для менеджеров</span>
        </div>
        
        <div class="settings-item" id="users-management-btn">
          <div class="settings-item-content">
            <span class="settings-icon">👥</span>
            <div class="settings-text">
              <div class="settings-title">Пользователи</div>
              <div class="settings-subtitle">Управление пользователями и их профилями</div>
            </div>
          </div>
          <span class="settings-arrow">›</span>
        </div>
        
        <div class="settings-item" id="stop-list-edit-btn">
          <div class="settings-item-content">
            <span class="settings-icon">✏️</span>
            <div class="settings-text">
              <div class="settings-title">Редактирование стоп-листа</div>
              <div class="settings-subtitle">Добавить или убрать блюда из стоп-листа</div>
            </div>
          </div>
          <span class="settings-arrow">›</span>
        </div>
        
        <div class="settings-item" id="positions-edit-btn">
          <div class="settings-item-content">
            <span class="settings-icon">📍</span>
            <div class="settings-text">
              <div class="settings-title">Редактирование позиционника</div>
              <div class="settings-subtitle">Назначение столов официантам</div>
            </div>
          </div>
          <span class="settings-arrow">›</span>
        </div>
      </div>
      `;
    }
    
    panel.innerHTML = html;
    wrapper.appendChild(panel);
    
    // Event handlers - базовые функции
    panel.querySelector('#search-dishes-btn').addEventListener('click', () => {
      navigate('#/search-dishes');
    });
    
    panel.querySelector('#stop-list-view-btn').addEventListener('click', () => {
      navigate('#/stop-list');
    });
    
    panel.querySelector('#positions-btn').addEventListener('click', () => {
      navigate('#/positions');
    });
    
    panel.querySelector('#transfer-order-btn').addEventListener('click', () => {
      navigate('#/transfer-order');
    });
    
    panel.querySelector('#restaurant-map-btn').addEventListener('click', () => {
      navigate('#/restaurant-map');
    });
    
    // Event handlers - менеджерские функции
    if (isManager()) {
      panel.querySelector('#users-management-btn').addEventListener('click', () => {
        setPage('users');
      });
      
      panel.querySelector('#stop-list-edit-btn').addEventListener('click', () => {
        setPage('stoplist');
      });
      
      panel.querySelector('#positions-edit-btn').addEventListener('click', () => {
        setPage('positions');
      });
    }
    
    return wrapper;
  }

  // Просмотр стоп-листа (для всех)
  function viewStopListView() {
    const wrapper = document.createElement('div');
    wrapper.className = 'page';
    
    const panel = document.createElement('section');
    panel.className = 'panel';
    
    // Получаем все остановленные элементы (блюда и напитки)
    const allItems = db?.dishes || [];
    // Исправляем логику фильтрации - stopList содержит названия блюд
    const stoppedItems = allItems.filter(item => isInStopList(item.name));
    
    let dishesHtml = '';
    if (stoppedItems.length === 0) {
      dishesHtml = `
        <div class="empty-state">
          <div class="empty-icon">✅</div>
          <p>Стоп-лист пуст</p>
          <p class="empty-subtitle">Все блюда и напитки доступны для заказа</p>
        </div>
      `;
    } else {
      // Группируем по типу
      const stoppedDishes = stoppedItems.filter(item => item.source !== 'bar');
      const stoppedDrinks = stoppedItems.filter(item => item.source === 'bar');
      
      // Блюда
      if (stoppedDishes.length > 0) {
        dishesHtml += `<div class="stop-list-section-header">🍽️ Блюда</div>`;
        dishesHtml += stoppedDishes.map(item => `
          <div class="stop-list-item">
            <div class="stop-list-item-info">
              <div class="stop-list-item-name">${item.name}</div>
              <div class="stop-list-item-category">${item.category || ''}</div>
            </div>
            <span class="stop-badge">СТОП</span>
          </div>
        `).join('');
      }
      
      // Напитки
      if (stoppedDrinks.length > 0) {
        dishesHtml += `<div class="stop-list-section-header">🍹 Напитки</div>`;
        dishesHtml += stoppedDrinks.map(item => `
          <div class="stop-list-item">
            <div class="stop-list-item-info">
              <div class="stop-list-item-name">${item.name}</div>
              <div class="stop-list-item-category">${item.category || ''}</div>
            </div>
            <span class="stop-badge">СТОП</span>
          </div>
        `).join('');
      }
    }
    
    panel.innerHTML = `
      <div class="panel-header" style="display: flex; align-items: center; gap: 12px;">
        <button class="back-btn" id="stop-list-back">‹</button>
        <h2 style="flex: 1; margin: 0;">Стоп-лист</h2>
      </div>
      
      <div class="stop-list-container">
        ${dishesHtml}
      </div>
    `;
    
    wrapper.appendChild(panel);
    
    panel.querySelector('#stop-list-back').addEventListener('click', () => {
      navigate('#/tools');
      setPage('tools');
    });
    
    return wrapper;
  }

  // Редактирование стоп-листа (только для менеджеров)
  function viewStopListEdit() {
    const wrapper = document.createElement('div');
    wrapper.className = 'page';

    const panel = document.createElement('section');
    panel.className = 'panel';
    
    const renderStopList = () => {
      panel.innerHTML = `
        <div class="panel-header">
          <button class="back-btn" id="stop-list-edit-back">‹</button>
          <h2 style="flex: 1; text-align: center; margin: 0;">Стоп-лист</h2>
          <button class="btn danger" id="clear-stop-list" style="font-size: 12px; padding: 6px 10px;">Очистить</button>
        </div>
        
        <div class="settings-section">
          <p class="settings-description">Блюда в стоп-листе будут подсвечены красным при поиске</p>
        </div>
        
        <div class="stop-list-search">
          <input type="text" id="stop-list-input" class="filter-input" placeholder="Поиск блюда или напитка..." />
          <div id="stop-list-suggestions" class="stop-list-suggestions"></div>
        </div>
        
        <div class="stop-list-items" id="stop-list-items">
          ${stopList.length === 0 ? '<div class="stop-list-empty">Стоп-лист пуст</div>' : ''}
          ${stopList.map((item, index) => `
            <div class="stop-list-item">
              <span class="stop-list-item-name">${item}</span>
              <button class="stop-list-remove" data-index="${index}">✕</button>
            </div>
          `).join('')}
        </div>
      `;
      
      // Back button
      panel.querySelector('#stop-list-edit-back').addEventListener('click', () => {
        navigate('#/tools');
        setPage('tools');
      });
      
      // Clear all button
      panel.querySelector('#clear-stop-list').addEventListener('click', () => {
        if (stopList.length === 0) return;
        showConfirmModal(
          'Очистить стоп-лист',
          'Удалить все блюда из стоп-листа?',
          () => {
            stopList = [];
            saveStopList();
            renderStopList();
          },
          null,
          'Очистить'
        );
      });
      
      // Remove item buttons
      panel.querySelectorAll('.stop-list-remove').forEach(btn => {
        btn.addEventListener('click', () => {
          const index = parseInt(btn.dataset.index);
          stopList.splice(index, 1);
          saveStopList();
          renderStopList();
        });
      });
      
      // Search input
      const searchInput = panel.querySelector('#stop-list-input');
      const suggestionsEl = panel.querySelector('#stop-list-suggestions');
      
      searchInput.addEventListener('input', async () => {
        const query = searchInput.value.trim().toLowerCase();
        if (query.length < 2) {
          suggestionsEl.innerHTML = '';
          return;
        }
        
        await loadDb();
        if (!db || !db.dishes) return;
        
        // Ищем и блюда и напитки
        const matches = db.dishes
          .filter(d => d.name.toLowerCase().includes(query))
          .filter(d => !isInStopList(d.name))
          .slice(0, 20);
        
        if (matches.length === 0) {
          suggestionsEl.innerHTML = '<div class="stop-list-no-results">Ничего не найдено</div>';
          return;
        }
        
        suggestionsEl.innerHTML = matches.map(d => `
          <div class="stop-list-suggestion" data-name="${d.name}">
            <span class="suggestion-name">${d.name}</span>
            <span class="suggestion-category">${d.category || ''}${d.source === 'bar' ? ' 🍹' : ''}</span>
          </div>
        `).join('');
        
        // Add click handlers
        suggestionsEl.querySelectorAll('.stop-list-suggestion').forEach(item => {
          item.addEventListener('click', () => {
            const name = item.dataset.name;
            if (!isInStopList(name)) {
              stopList.push(name);
              saveStopList();
              searchInput.value = '';
              suggestionsEl.innerHTML = '';
              renderStopList();
            }
          });
        });
      });
    };
    
    renderStopList();
    wrapper.appendChild(panel);
    return wrapper;
  }

  // Функция для рендеринга раздела "Позиционник"
  async function renderPositionMapSection(container) {
    try {
      // Загружаем позиционник и пользователей
      const [positionResponse, usersResponse] = await Promise.all([
        apiClient.get('/position-map'),
        apiClient.get('/admin/users')
      ]);
      
      console.log('Position map API response:', positionResponse); // Для отладки
      console.log('Users API response for positions:', usersResponse); // Для отладки
      
      // Backend возвращает positionMap, а не positions
      const positions = positionResponse.positionMap || positionResponse.positions || [];
      const users = usersResponse.users || [];
      
      // Проверяем, что есть массивы
      if (!Array.isArray(positions) || !Array.isArray(users)) {
        console.error('Invalid position/users response:', positionResponse, usersResponse);
        throw new Error('Ошибка загрузки данных');
      }
      
      const waiters = users.filter(u => u.role === 'waiter');
      
      container.innerHTML = `
        <div class="admin-section-header">
          <h3>Назначение столов</h3>
        </div>
        
        <div class="admin-position-form">
          <select class="rename-input" id="position-waiter-select">
            <option value="">Выберите официанта</option>
            ${waiters.map(w => `
              <option value="${w.id}">${w.firstName} ${w.lastName}</option>
            `).join('')}
          </select>
          <input type="number" class="rename-input" id="position-table-number" placeholder="Номер стола" min="1" />
          <button class="btn primary" id="assign-table-btn">Назначить</button>
        </div>
        
        <div class="admin-positions-list">
          ${positions.length === 0 ? `
            <div class="empty-state">
              <div class="empty-icon">📍</div>
              <p>Нет назначений</p>
            </div>
          ` : positions.map(pos => `
            <div class="admin-position-card">
              <div class="admin-position-info">
                <div class="admin-position-table">Стол ${pos.tableNumber}</div>
                <div class="admin-position-waiter">${pos.waiterName || 'Неизвестно'}</div>
                <div class="admin-position-updated">Обновлено: ${new Date(pos.updatedAt).toLocaleString('ru-RU')}</div>
              </div>
              <button class="btn secondary admin-remove-position-btn" data-user-id="${pos.userId}" data-table="${pos.tableNumber}">Удалить</button>
            </div>
          `).join('')}
        </div>
      `;
      
      // Обработчик назначения стола
      const assignBtn = container.querySelector('#assign-table-btn');
      if (assignBtn) {
        assignBtn.addEventListener('click', async () => {
          const waiterId = container.querySelector('#position-waiter-select').value;
          const tableNumber = container.querySelector('#position-table-number').value;
          
          if (!waiterId || !tableNumber) {
            alert('Выберите официанта и введите номер стола');
            return;
          }
          
          try {
            await apiClient.post('/admin/assign-table', {
              userId: parseInt(waiterId),
              tableNumber: parseInt(tableNumber)
            });
            renderPositionMapSection(container);
          } catch (error) {
            alert('Ошибка назначения: ' + error.message);
          }
        });
      }
      
      // Обработчики удаления
      container.querySelectorAll('.admin-remove-position-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const userId = btn.dataset.userId;
          const tableNumber = btn.dataset.table;
          
          if (!confirm('Удалить назначение стола?')) return;
          
          try {
            await apiClient.delete(`/admin/assign-table/${userId}/${tableNumber}`);
            renderPositionMapSection(container);
          } catch (error) {
            alert('Ошибка удаления: ' + error.message);
          }
        });
      });
      
    } catch (error) {
      console.error('Error loading position map:', error);
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">❌</div>
          <p>Ошибка загрузки: ${error.message}</p>
          <button class="btn secondary" id="retry-position-btn">Повторить</button>
        </div>
      `;
      
      const retryBtn = container.querySelector('#retry-position-btn');
      if (retryBtn) {
        retryBtn.addEventListener('click', () => renderPositionMapSection(container));
      }
    }
  }

  // Функция для показа модального окна добавления в стоп-лист с поиском
  async function showAddStopListModal(onSuccess) {
    // Загружаем базу данных блюд
    try {
      await loadDb();
    } catch (error) {
      console.error('Error loading dishes database:', error);
      alert('Ошибка загрузки базы данных блюд');
      return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'rename-modal';
    modal.innerHTML = `
      <div class="rename-content" style="max-width: 500px; max-height: 80vh;">
        <h3 class="rename-title">Добавить в стоп-лист</h3>
        
        <div class="form-group">
          <label>Поиск блюда</label>
          <div class="search-container" style="position: relative;">
            <input type="text" class="rename-input" id="stoplist-search" placeholder="Начните вводить название..." />
            <div id="stoplist-suggestions" class="suggestions-container" style="display: none; position: absolute; top: 100%; left: 0; right: 0; background: var(--card); border: 1px solid var(--border); border-radius: 8px; max-height: 300px; overflow-y: auto; z-index: 1000; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
              <div class="suggestions-list"></div>
            </div>
          </div>
        </div>
        
        <div class="rename-actions" style="margin-top: 16px;">
          <button class="btn secondary" id="stoplist-cancel">Отмена</button>
        </div>
        
        <div id="stoplist-error" class="auth-error" style="display: none; margin-top: 12px;"></div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    const searchInput = modal.querySelector('#stoplist-search');
    const suggestionsContainer = modal.querySelector('#stoplist-suggestions');
    const suggestionsList = modal.querySelector('.suggestions-list');
    const errorEl = modal.querySelector('#stoplist-error');
    
    // Умный поиск блюд (копия из поиска в столе)
    function smartSearchDishes(query) {
      if (!query || query.length < 1) {
        return [];
      }
      
      const allDishes = db?.dishes || [];
      console.log('Searching in dishes:', allDishes.length, 'query:', query);
      
      // Добавляем гарниры и соусы для стейков к поиску
      const steakGarnishes = STEAK_GARNISHES.map(item => ({
        ...item,
        category: 'Гарниры',
        R_keeper: item.rkeeper,
        source: 'steak_garnish'
      }));
      
      const steakSauces = STEAK_SAUCES.map(item => ({
        ...item,
        category: 'Соусы',
        R_keeper: item.rkeeper,
        source: 'steak_sauce'
      }));
      
      // Объединяем все источники данных
      const allItems = [...allDishes, ...steakGarnishes, ...steakSauces];
      console.log('Total searchable items:', allItems.length, '(dishes:', allDishes.length, 'garnishes:', steakGarnishes.length, 'sauces:', steakSauces.length, ')');
      
      const normalizedQuery = query.toLowerCase().trim();
      const matches = [];
      
      allItems.forEach(item => {
        if (!item || !item.name) {
          console.warn('Invalid item object:', item);
          return;
        }
        
        const itemName = item.name.toLowerCase();
        
        // Skip if already in matches
        if (matches.some(m => m.name === item.name)) return;
        
        // Exact match gets highest priority
        if (itemName === normalizedQuery) {
          matches.push({...item, matchType: 'exact', score: 100});
        }
        // Starts with query
        else if (itemName.startsWith(normalizedQuery)) {
          matches.push({...item, matchType: 'starts', score: 80});
        }
        // Contains query
        else if (itemName.includes(normalizedQuery)) {
          matches.push({...item, matchType: 'contains', score: 60});
        }
        // Word match - check if any word in item name starts with query
        else {
          const itemWords = itemName.split(' ');
          const queryWords = normalizedQuery.split(' ');
          
          for (let queryWord of queryWords) {
            for (let itemWord of itemWords) {
              if (itemWord.startsWith(queryWord) && queryWord.length > 1) {
                matches.push({...item, matchType: 'word', score: 40});
                break;
              }
            }
            if (matches.some(m => m.name === item.name)) break;
          }
        }
      });
      
      // Sort by score and return top 10
      const results = matches
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
        
      console.log('Search results:', results.length, 'matches for query:', query);
      if (results.length > 0) {
        console.log('First few results:', results.slice(0, 3).map(r => `${r.name} (${r.source || 'dish'})`));
      }
      return results;
    }
    
    function renderSuggestions(matches) {
      suggestionsList.innerHTML = '';
      
      if (matches.length === 0) {
        suggestionsContainer.style.display = 'none';
        return;
      }
      
      const frag = document.createDocumentFragment();
      
      matches.forEach(dish => {
        const suggestion = document.createElement('div');
        const inStopList = isInStopList(dish.name);
        suggestion.className = 'suggestion-item' + (inStopList ? ' in-stop-list' : '');
        suggestion.innerHTML = `
          ${inStopList ? '<div class="stop-list-overlay">УЖЕ В СТОПЕ</div>' : ''}
          <div class="suggestion-content">
            <div class="suggestion-name">${dish.name}</div>
            <div class="suggestion-category">${dish.category || 'Без категории'}${dish.R_keeper ? ` • Код: ${dish.R_keeper}` : ''}</div>
          </div>
          <div class="suggestion-price">${dish.price || '—'}</div>
        `;
        
        suggestion.addEventListener('click', async () => {
          if (inStopList) {
            errorEl.textContent = 'Блюдо уже в стоп-листе';
            errorEl.style.display = 'block';
            return;
          }
          
          // Добавляем в стоп-лист
          try {
            errorEl.style.display = 'none';
            suggestion.style.opacity = '0.5';
            suggestion.style.pointerEvents = 'none';
            
            /* AUTH DISABLED: Backend stoplist API call commented out
            const response = await apiClient.post('/stoplist', {
              dishName: dish.name,
              rkeeperCode: dish.R_keeper || ''
            });
            
            if (response.success || response.stopList) {
              // Обновляем локальный массив stopList
              await loadStopListFromBackend();
              
              modal.remove();
              if (onSuccess) onSuccess();
            } else {
              throw new Error(response.error || 'Ошибка добавления в стоп-лист');
            }
            END AUTH DISABLED */
            
            // Add to local stoplist without backend
            if (!stopList.includes(dish.name)) {
              stopList.push(dish.name);
              saveStopList();
            }
            modal.remove();
            if (onSuccess) onSuccess();
          } catch (error) {
            console.error('Error adding to stoplist:', error);
            errorEl.textContent = error.message;
            errorEl.style.display = 'block';
            suggestion.style.opacity = '1';
            suggestion.style.pointerEvents = 'auto';
          }
        });
        
        frag.appendChild(suggestion);
      });
      
      suggestionsList.appendChild(frag);
      suggestionsContainer.style.display = 'block';
    }
    
    // Обработчик поиска с задержкой
    let searchTimeout;
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        const matches = smartSearchDishes(searchInput.value);
        renderSuggestions(matches);
      }, 150);
    });
    
    // Скрыть подсказки при клике вне
    searchInput.addEventListener('blur', () => {
      setTimeout(() => {
        suggestionsContainer.style.display = 'none';
      }, 200);
    });
    
    // Показать подсказки при фокусе
    searchInput.addEventListener('focus', () => {
      if (searchInput.value.length > 0) {
        const matches = smartSearchDishes(searchInput.value);
        renderSuggestions(matches);
      }
    });
    
    modal.querySelector('#stoplist-cancel').addEventListener('click', () => {
      modal.remove();
    });
    
    // Закрытие по клику вне модального окна
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
    
    // Фокус на поле поиска
    setTimeout(() => searchInput.focus(), 100);
  }

  // Функция для рендеринга раздела "Стоп-лист"
  async function renderStopListSection(container) {
    try {
      const response = await apiClient.get('/stoplist');
      
      console.log('Stoplist API response:', response); // Для отладки
      
      // Backend возвращает stopList (с заглавной L), а не stoplist
      const stoplist = response.stopList || response.stoplist || [];
      
      // Проверяем, что есть массив
      if (!Array.isArray(stoplist)) {
        console.error('Invalid stoplist response:', response);
        throw new Error(response.error || 'Ошибка загрузки стоп-листа');
      }
      
      if (stoplist.length === 0) {
        container.innerHTML = `
          <div class="admin-section-header">
            <div class="search-container" style="position: relative; flex: 1;">
              <input type="text" class="search-input" id="stoplist-search-input" placeholder="Поиск блюда для добавления в стоп-лист..." style="width: 100%; padding: 12px; border: 1px solid var(--border); border-radius: var(--radius); background: var(--background); color: var(--foreground);" />
              <div id="stoplist-search-suggestions" class="suggestions-container" style="display: none; position: absolute; top: 100%; left: 0; right: 0; background: var(--card); border: 1px solid var(--border); border-radius: 8px; max-height: 300px; overflow-y: auto; z-index: 1000; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                <div class="suggestions-list"></div>
              </div>
            </div>
          </div>
          <div class="empty-state">
            <div class="empty-icon">🚫</div>
            <p>Стоп-лист пуст</p>
            <p style="color: var(--muted-foreground); font-size: 14px;">Используйте поиск выше для добавления блюд</p>
          </div>
        `;
      } else {
        container.innerHTML = `
          <div class="admin-section-header">
            <div class="search-container" style="position: relative; flex: 1; margin-right: 12px;">
              <input type="text" class="search-input" id="stoplist-search-input" placeholder="Поиск блюда для добавления в стоп-лист..." style="width: 100%; padding: 12px; border: 1px solid var(--border); border-radius: var(--radius); background: var(--background); color: var(--foreground);" />
              <div id="stoplist-search-suggestions" class="suggestions-container" style="display: none; position: absolute; top: 100%; left: 0; right: 0; background: var(--card); border: 1px solid var(--border); border-radius: 8px; max-height: 300px; overflow-y: auto; z-index: 1000; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                <div class="suggestions-list"></div>
              </div>
            </div>
          </div>
          <div class="admin-stoplist-list">
            ${stoplist.map(item => `
              <div class="admin-stoplist-card" data-id="${item.id || ''}">
                <div class="admin-stoplist-info">
                  <div class="admin-stoplist-name" style="font-size: 18px; font-weight: 700; color: var(--foreground); margin-bottom: 6px;">${item.dish_name || item.dishName || 'Неизвестное блюдо'}</div>
                  <div class="admin-stoplist-details" style="font-size: 13px; color: var(--muted-foreground);">
                    <span style="background: var(--primary); color: var(--primary-foreground); padding: 2px 8px; border-radius: 4px; font-weight: 600; margin-right: 8px;">Код: ${item.rkeeper_code || item.rkeeperCode || 'Нет кода'}</span>
                    Добавил: ${item.first_name && item.last_name ? `${item.first_name} ${item.last_name}` : (item.addedBy || 'Неизвестно')} • 
                    ${item.added_at ? new Date(item.added_at).toLocaleString('ru-RU') : (item.createdAt ? new Date(item.createdAt).toLocaleString('ru-RU') : 'Дата неизвестна')}
                  </div>
                </div>
                <button class="btn danger admin-remove-stoplist-btn" data-id="${item.id || ''}" style="min-width: 80px;">Удалить</button>
              </div>
            `).join('')}
          </div>
        `;
      }
      
      // Настраиваем поиск для добавления в стоп-лист (работает как для пустого, так и для заполненного стоп-листа)
      const searchInput = container.querySelector('#stoplist-search-input');
      const suggestionsContainer = container.querySelector('#stoplist-search-suggestions');
      const suggestionsList = container.querySelector('.suggestions-list');
      
      if (searchInput && suggestionsContainer && suggestionsList) {
        // Загружаем базу данных блюд если не загружена
        if (!db || !db.dishes) {
          console.log('Database not loaded, loading now...');
          try {
            await loadDb();
            console.log('Database loaded successfully:', db?.dishes?.length, 'dishes');
          } catch (error) {
            console.error('Error loading dishes database:', error);
            return; // Выходим если не удалось загрузить базу
          }
        } else {
          console.log('Database already loaded:', db.dishes.length, 'dishes');
        }
        
        // Умный поиск блюд (копия из showAddStopListModal)
        function smartSearchDishes(query) {
          if (!query || query.length < 1) {
            return [];
          }
          
          const allDishes = db?.dishes || [];
          console.log('Searching in dishes:', allDishes.length, 'query:', query);
          console.log('Database loaded:', !!db, 'dishes array exists:', !!db?.dishes);
          
          // Добавляем гарниры и соусы для стейков к поиску
          const steakGarnishes = STEAK_GARNISHES.map(item => ({
            ...item,
            category: 'Гарниры',
            R_keeper: item.rkeeper,
            source: 'steak_garnish'
          }));
          
          const steakSauces = STEAK_SAUCES.map(item => ({
            ...item,
            category: 'Соусы',
            R_keeper: item.rkeeper,
            source: 'steak_sauce'
          }));
          
          // Объединяем все источники данных
          const allItems = [...allDishes, ...steakGarnishes, ...steakSauces];
          console.log('Total searchable items:', allItems.length, '(dishes:', allDishes.length, 'garnishes:', steakGarnishes.length, 'sauces:', steakSauces.length, ')');
          
          if (allItems.length === 0) {
            console.warn('No items found for search!');
            return [];
          }
          
          const normalizedQuery = query.toLowerCase().trim();
          const matches = [];
          
          allItems.forEach(item => {
            if (!item || !item.name) {
              console.warn('Invalid item object:', item);
              return;
            }
            
            const itemName = item.name.toLowerCase();
            
            // Skip if already in matches
            if (matches.some(m => m.name === item.name)) return;
            
            // Exact match gets highest priority
            if (itemName === normalizedQuery) {
              matches.push({...item, matchType: 'exact', score: 100});
            }
            // Starts with query
            else if (itemName.startsWith(normalizedQuery)) {
              matches.push({...item, matchType: 'starts', score: 80});
            }
            // Contains query
            else if (itemName.includes(normalizedQuery)) {
              matches.push({...item, matchType: 'contains', score: 60});
            }
            // Word match - check if any word in item name starts with query
            else {
              const itemWords = itemName.split(' ');
              const queryWords = normalizedQuery.split(' ');
              
              for (let queryWord of queryWords) {
                for (let itemWord of itemWords) {
                  if (itemWord.startsWith(queryWord) && queryWord.length > 1) {
                    matches.push({...item, matchType: 'word', score: 40});
                    break;
                  }
                }
                if (matches.some(m => m.name === item.name)) break;
              }
            }
          });
          
          // Sort by score and return top 10
          const results = matches
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);
            
          console.log('Search results:', results.length, 'matches for query:', query);
          if (results.length > 0) {
            console.log('First few results:', results.slice(0, 3).map(r => `${r.name} (${r.source || 'dish'})`));
          }
          return results;
        }
        
        function renderSuggestions(matches) {
          suggestionsList.innerHTML = '';
          
          if (matches.length === 0) {
            suggestionsContainer.style.display = 'none';
            return;
          }
          
          const frag = document.createDocumentFragment();
          
          matches.forEach(dish => {
            const suggestion = document.createElement('div');
            const inStopList = isInStopList(dish.name);
            suggestion.className = 'suggestion-item' + (inStopList ? ' in-stop-list' : '');
            suggestion.style.cssText = 'padding: 12px; border-bottom: 1px solid var(--border); cursor: pointer; display: flex; justify-content: space-between; align-items: center; position: relative;';
            
            if (inStopList) {
              suggestion.style.background = 'rgba(239, 68, 68, 0.1)';
              suggestion.style.borderColor = 'var(--destructive)';
            }
            
            suggestion.innerHTML = `
              ${inStopList ? '<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: var(--destructive); color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; z-index: 10;">УЖЕ В СТОПЕ</div>' : ''}
              <div class="suggestion-content" style="flex: 1; ${inStopList ? 'opacity: 0.6;' : ''}">
                <div class="suggestion-name" style="font-weight: 600; color: var(--foreground); margin-bottom: 2px;">${dish.name}</div>
                <div class="suggestion-category" style="font-size: 12px; color: var(--muted-foreground);">${dish.category || 'Без категории'}${(dish.R_keeper || dish.rkeeper) ? ` • Код: ${dish.R_keeper || dish.rkeeper}` : ''}</div>
              </div>
              <div class="suggestion-price" style="font-weight: 600; color: var(--primary);">${dish.price || '—'}</div>
            `;
            
            suggestion.addEventListener('click', async () => {
              if (inStopList) {
                alert('Блюдо уже в стоп-листе');
                return;
              }
              
              // Добавляем в стоп-лист
              try {
                suggestion.style.opacity = '0.5';
                suggestion.style.pointerEvents = 'none';
                
                /* AUTH DISABLED: Backend stoplist API call commented out
                const response = await apiClient.post('/stoplist', {
                  dishName: dish.name,
                  rkeeperCode: dish.R_keeper || ''
                });
                
                if (response.success || response.stopList) {
                  // Обновляем локальный массив stopList
                  await loadStopListFromBackend();
                  
                  // Очищаем поиск и перерендериваем
                  searchInput.value = '';
                  suggestionsContainer.style.display = 'none';
                  renderStopListSection(container);
                } else {
                  throw new Error(response.error || 'Ошибка добавления в стоп-лист');
                }
                END AUTH DISABLED */
                
                // Add to local stoplist without backend
                if (!stopList.includes(dish.name)) {
                  stopList.push(dish.name);
                  saveStopList();
                }
                
                // Очищаем поиск и перерендериваем
                searchInput.value = '';
                suggestionsContainer.style.display = 'none';
                renderStopListSection(container);
              } catch (error) {
                console.error('Error adding to stoplist:', error);
                alert('Ошибка: ' + error.message);
                suggestion.style.opacity = '1';
                suggestion.style.pointerEvents = 'auto';
              }
            });
            
            frag.appendChild(suggestion);
          });
          
          suggestionsList.appendChild(frag);
          suggestionsContainer.style.display = 'block';
        }
        
        // Обработчик поиска с задержкой
        let searchTimeout;
        searchInput.addEventListener('input', () => {
          clearTimeout(searchTimeout);
          searchTimeout = setTimeout(() => {
            const matches = smartSearchDishes(searchInput.value);
            renderSuggestions(matches);
          }, 150);
        });
        
        // Скрыть подсказки при клике вне
        searchInput.addEventListener('blur', () => {
          setTimeout(() => {
            suggestionsContainer.style.display = 'none';
          }, 200);
        });
        
        // Показать подсказки при фокусе
        searchInput.addEventListener('focus', () => {
          if (searchInput.value.length > 0) {
            const matches = smartSearchDishes(searchInput.value);
            renderSuggestions(matches);
          }
        });
      }
      
      // Удаляем старый код для кнопки добавления
      const addBtn = container.querySelector('#add-stoplist-btn');
      if (addBtn) {
        addBtn.addEventListener('click', async () => {
          await showAddStopListModal(() => renderStopListSection(container));
        });
      }
      
      container.querySelectorAll('.admin-remove-stoplist-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.id;
          if (!confirm('Удалить блюдо из стоп-листа?')) return;
          
          try {
            /* AUTH DISABLED: Backend stoplist delete API call commented out
            await apiClient.delete(`/stoplist/${id}`);
            
            // Обновляем локальный массив stopList
            await loadStopListFromBackend();
            END AUTH DISABLED */
            
            // Remove from local stoplist without backend
            const dishName = btn.dataset.name || id;
            const index = stopList.indexOf(dishName);
            if (index > -1) {
              stopList.splice(index, 1);
              saveStopList();
            }
            
            renderStopListSection(container);
          } catch (error) {
            alert('Ошибка удаления: ' + error.message);
          }
        });
      });
      
    } catch (error) {
      console.error('Error loading stoplist:', error);
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">❌</div>
          <p>Ошибка загрузки: ${error.message}</p>
          <button class="btn secondary" id="retry-stoplist-btn">Повторить</button>
        </div>
      `;
      
      const retryBtn = container.querySelector('#retry-stoplist-btn');
      if (retryBtn) {
        retryBtn.addEventListener('click', () => renderStopListSection(container));
      }
    }
  }

  // Функция для показа модального окна создания пользователя
  async function showCreateUserModal(onSuccess) {
    // Загружаем список ресторанов
    let locations = [];
    try {
      const response = await apiClient.get('/admin/locations');
      locations = response.locations || [];
    } catch (error) {
      console.error('Error loading locations:', error);
    }

    const modal = document.createElement('div');
    modal.className = 'rename-modal';
    
    // Группируем рестораны по городам
    const locationsByCity = {};
    locations.forEach(loc => {
      const city = loc.city || 'Не указан';
      if (!locationsByCity[city]) {
        locationsByCity[city] = [];
      }
      locationsByCity[city].push(loc);
    });
    
    modal.innerHTML = `
      <div class="rename-content" style="max-width: 400px;">
        <h3 class="rename-title">Создать пользователя</h3>
        
        <div class="form-group">
          <label>Имя *</label>
          <input type="text" class="rename-input" id="create-first-name" placeholder="Иван" required />
        </div>
        
        <div class="form-group">
          <label>Фамилия *</label>
          <input type="text" class="rename-input" id="create-last-name" placeholder="Иванов" required />
        </div>
        
        <div class="form-group">
          <label>Email *</label>
          <input type="email" class="rename-input" id="create-email" placeholder="ivan@example.com" required />
        </div>
        
        <div class="form-group">
          <label>Пароль *</label>
          <input type="password" class="rename-input" id="create-password" placeholder="Минимум 6 символов" required />
        </div>
        
        <div class="form-group">
          <label>Роль *</label>
          <select class="rename-input" id="create-role" required>
            <option value="waiter">Официант</option>
            <option value="manager">Менеджер</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>Грейд</label>
          <input type="number" class="rename-input" id="create-grade" value="0" min="0" max="5" />
        </div>
        
        <div class="form-group">
          <label>Ресторан *</label>
          <select class="rename-input" id="create-location" required>
            <option value="">Выберите ресторан</option>
            ${Object.entries(locationsByCity).map(([city, locs]) => `
              <optgroup label="${city}">
                ${locs.map(loc => `
                  <option value="${loc.id}">${loc.address || loc.name}</option>
                `).join('')}
              </optgroup>
            `).join('')}
          </select>
        </div>
        
        <div class="rename-actions">
          <button class="btn secondary" id="create-cancel">Отмена</button>
          <button class="btn primary" id="create-save">Создать</button>
        </div>
        
        <div id="create-error" class="auth-error" style="display: none; margin-top: 12px;"></div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Обработчик отмены
    modal.querySelector('#create-cancel').addEventListener('click', () => {
      modal.remove();
    });
    
    // Обработчик создания
    modal.querySelector('#create-save').addEventListener('click', async () => {
      const firstName = modal.querySelector('#create-first-name').value.trim();
      const lastName = modal.querySelector('#create-last-name').value.trim();
      const email = modal.querySelector('#create-email').value.trim();
      const password = modal.querySelector('#create-password').value;
      const role = modal.querySelector('#create-role').value;
      const grade = parseInt(modal.querySelector('#create-grade').value) || 0;
      const locationId = parseInt(modal.querySelector('#create-location').value);
      
      const errorEl = modal.querySelector('#create-error');
      
      // Валидация
      if (!firstName || !lastName) {
        errorEl.textContent = 'Заполните имя и фамилию';
        errorEl.style.display = 'block';
        return;
      }
      
      if (!validateEmail(email)) {
        errorEl.textContent = 'Неверный формат email';
        errorEl.style.display = 'block';
        return;
      }
      
      if (!password || password.length < 6) {
        errorEl.textContent = 'Пароль должен быть минимум 6 символов';
        errorEl.style.display = 'block';
        return;
      }
      
      if (!locationId) {
        errorEl.textContent = 'Выберите ресторан';
        errorEl.style.display = 'block';
        return;
      }
      
      // Отключаем кнопку во время запроса
      const saveBtn = modal.querySelector('#create-save');
      saveBtn.disabled = true;
      saveBtn.textContent = 'Создание...';
      
      try {
        // Отправляем запрос на создание пользователя
        console.log('Creating user with data:', { firstName, lastName, email, role, grade, locationId });
        const response = await apiClient.post('/admin/register-user', {
          firstName,
          lastName,
          email,
          password,
          role,
          grade,
          locationId
        });
        
        console.log('Create user response:', response);
        
        if (response.success) {
          console.log('User created successfully!');
          modal.remove();
          if (onSuccess) onSuccess();
        } else {
          throw new Error(response.error || 'Ошибка создания пользователя');
        }
      } catch (error) {
        console.error('Error creating user:', error);
        errorEl.textContent = error.message;
        errorEl.style.display = 'block';
        saveBtn.disabled = false;
        saveBtn.textContent = 'Создать';
      }
    });
  }

  // Функция для рендеринга раздела "Пользователи"
  async function renderUsersSection(container) {
    try {
      // Загружаем список пользователей через Backend API
      console.log('Fetching users from /admin/users...');
      console.log('Current user session:', authSession);
      console.log('Current user locationId:', authSession?.locationId);
      
      const response = await apiClient.get('/admin/users');
      
      console.log('Users API response:', response); // Для отладки
      console.log('Response type:', typeof response);
      console.log('Response.users:', response.users);
      console.log('Is array?', Array.isArray(response.users));
      
      // Проверяем, что есть массив users (даже если пустой)
      if (!response || !Array.isArray(response.users)) {
        console.error('Invalid response format:', response);
        throw new Error(response.error || 'Ошибка загрузки пользователей');
      }
      
      const users = response.users;
      console.log('Users count:', users.length);
      console.log('Users data:', users);
      
      if (users.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">👥</div>
            <p>Нет пользователей в вашей локации</p>
            <p style="font-size: 12px; color: var(--muted-foreground); margin-top: 8px;">
              Локация: ${authSession?.locationName || 'Не указана'} (ID: ${authSession?.locationId || 'N/A'})
            </p>
            <button class="btn primary" id="create-user-btn">+ Создать пользователя</button>
          </div>
        `;
      } else {
        container.innerHTML = `
          <div class="admin-section-header">
            <button class="btn primary" id="create-user-btn">+ Создать пользователя</button>
          </div>
          <div class="admin-users-list">
            ${users.map(user => `
              <div class="admin-user-card" data-user-id="${user.id}">
                <div class="admin-user-info">
                  <div class="admin-user-name">${user.firstName || user.first_name || ''} ${user.lastName || user.last_name || ''}</div>
                  <div class="admin-user-details">
                    ${user.email || ''} • ${translateRole(user.role)} 
                    ${user.grade ? `• Грейд ${user.grade}` : ''}
                  </div>
                  ${(user.locationCity || user.location_city || user.locationAddress || user.location_address) ? `
                    <div class="admin-user-location">
                      📍 ${user.locationCity || user.location_city || ''}${(user.locationCity || user.location_city) && (user.locationAddress || user.location_address) ? ', ' : ''}${user.locationAddress || user.location_address || ''}
                    </div>
                  ` : ''}
                </div>
                <div class="admin-user-actions">
                  <button class="btn secondary admin-edit-user-btn" data-user-id="${user.id}">Изменить</button>
                  <button class="btn danger admin-delete-user-btn" data-user-id="${user.id}" data-user-name="${user.firstName || user.first_name || ''} ${user.lastName || user.last_name || ''}">Удалить</button>
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }
      
      // Обработчик кнопки "Создать пользователя"
      const createBtn = container.querySelector('#create-user-btn');
      if (createBtn) {
        createBtn.addEventListener('click', () => {
          showCreateUserModal(() => renderUsersSection(container));
        });
      }
      
      // Обработчики кнопок "Изменить"
      container.querySelectorAll('.admin-edit-user-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const userId = btn.dataset.userId;
          const user = users.find(u => u.id === parseInt(userId));
          if (user) {
            showEditUserModal(user, () => renderUsersSection(container));
          }
        });
      });
      
      // Обработчики кнопок "Удалить"
      container.querySelectorAll('.admin-delete-user-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const userId = btn.dataset.userId;
          const userName = btn.dataset.userName;
          
          // Подтверждение удаления
          if (!confirm(`Вы уверены, что хотите удалить пользователя "${userName}"?\n\nЭто действие нельзя отменить.`)) {
            return;
          }
          
          try {
            btn.disabled = true;
            btn.textContent = 'Удаление...';
            
            const response = await apiClient.delete(`/admin/users/${userId}`);
            
            if (response.success) {
              showToast('Пользователь успешно удалён', 'success');
              renderUsersSection(container);
            } else {
              throw new Error(response.error || 'Ошибка удаления пользователя');
            }
          } catch (error) {
            console.error('Error deleting user:', error);
            showToast(error.message, 'error');
            btn.disabled = false;
            btn.textContent = 'Удалить';
          }
        });
      });
      
    } catch (error) {
      console.error('Error loading users:', error);
      console.error('Error details:', error.message, error.stack);
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">❌</div>
          <p>Ошибка загрузки: ${error.message}</p>
          <p style="font-size: 12px; color: var(--muted-foreground); margin-top: 8px;">
            Проверьте консоль для деталей
          </p>
          <button class="btn secondary" id="retry-users-btn">Повторить</button>
        </div>
      `;
      
      const retryBtn = container.querySelector('#retry-users-btn');
      if (retryBtn) {
        retryBtn.addEventListener('click', () => renderUsersSection(container));
      }
    }
  }

  // Админ-панель (только для менеджеров)
  function renderAdminPanel() {
    // Проверка роли пользователя
    if (!authSession || (authSession.role !== 'manager' && authSession.role !== 'admin')) {
      const wrapper = document.createElement('div');
      wrapper.className = 'page';
      wrapper.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔒</div>
          <p>Доступ запрещён. Только для менеджеров.</p>
        </div>
      `;
      return wrapper;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'page';
    
    const panel = document.createElement('section');
    panel.className = 'panel';
    
    // Текущий активный раздел (по умолчанию - пользователи)
    let activeSection = 'users';
    
    // Функция для рендеринга навигации
    function renderNavigation() {
      return `
        <div class="admin-nav">
          <button class="admin-nav-btn ${activeSection === 'users' ? 'active' : ''}" data-section="users">
            👥 Пользователи
          </button>
          <button class="admin-nav-btn ${activeSection === 'stoplist' ? 'active' : ''}" data-section="stoplist">
            🚫 Стоп-лист
          </button>
          <button class="admin-nav-btn ${activeSection === 'position' ? 'active' : ''}" data-section="position">
            📍 Позиционник
          </button>
        </div>
      `;
    }
    
    // Функция для рендеринга контента раздела
    function renderSectionContent() {
      if (activeSection === 'users') {
        return `
          <div class="admin-section" id="users-section">
            <div class="loading-state">
              <p>Загрузка пользователей...</p>
            </div>
          </div>
        `;
      } else if (activeSection === 'stoplist') {
        return `
          <div class="admin-section" id="stoplist-section">
            <div class="loading-state">
              <p>Загрузка стоп-листа...</p>
            </div>
          </div>
        `;
      } else if (activeSection === 'position') {
        return `
          <div class="admin-section" id="position-section">
            <div class="loading-state">
              <p>Загрузка позиционника...</p>
            </div>
          </div>
        `;
      }
    }
    
    // Функция для обновления панели
    function updatePanel() {
      panel.innerHTML = `
        <div class="panel-header" style="display: flex; align-items: center; gap: 12px;">
          <button class="back-btn" id="admin-panel-back">‹</button>
          <h2 style="flex: 1; margin: 0;">Админ-панель</h2>
        </div>
        ${renderNavigation()}
        <div class="admin-content">
          ${renderSectionContent()}
        </div>
      `;
      
      // Обработчики навигации
      panel.querySelectorAll('.admin-nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          activeSection = btn.dataset.section;
          updatePanel();
          loadSectionData();
        });
      });
      
      // Обработчик кнопки "Назад"
      panel.querySelector('#admin-panel-back').addEventListener('click', () => {
        navigate('#/tools');
        setPage('tools');
      });
      
      // Загружаем данные для текущего раздела
      loadSectionData();
    }
    
    // Функция для загрузки данных раздела
    async function loadSectionData() {
      if (activeSection === 'users') {
        const container = panel.querySelector('#users-section');
        await renderUsersSection(container);
      } else if (activeSection === 'stoplist') {
        const container = panel.querySelector('#stoplist-section');
        await renderStopListSection(container);
      } else if (activeSection === 'position') {
        const container = panel.querySelector('#position-section');
        await renderPositionMapSection(container);
      }
    }
    
    wrapper.appendChild(panel);
    updatePanel();
    
    return wrapper;
  }
  
  // Страница "Пользователи" (отдельная вкладка для менеджеров)
  function renderUsersPage() {
    // Проверка роли пользователя
    if (!authSession || (authSession.role !== 'manager' && authSession.role !== 'admin')) {
      const wrapper = document.createElement('div');
      wrapper.className = 'page';
      wrapper.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔒</div>
          <p>Доступ запрещён. Только для менеджеров.</p>
        </div>
      `;
      return wrapper;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'page';
    
    const panel = document.createElement('section');
    panel.className = 'panel';
    
    panel.innerHTML = `
      <div class="panel-header">
        <h2>Пользователи</h2>
      </div>
      <div id="users-content" class="admin-section">
        <div class="loading-state">
          <p>Загрузка пользователей...</p>
        </div>
      </div>
    `;
    
    wrapper.appendChild(panel);
    
    // Загружаем данные
    const container = panel.querySelector('#users-content');
    renderUsersSection(container);
    
    return wrapper;
  }
  
  // Страница "Стоп-лист" (отдельная вкладка для менеджеров)
  function renderStopListPage() {
    // Проверка роли пользователя
    if (!authSession || (authSession.role !== 'manager' && authSession.role !== 'admin')) {
      const wrapper = document.createElement('div');
      wrapper.className = 'page';
      wrapper.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔒</div>
          <p>Доступ запрещён. Только для менеджеров.</p>
        </div>
      `;
      return wrapper;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'page';
    
    const panel = document.createElement('section');
    panel.className = 'panel';
    
    panel.innerHTML = `
      <div class="panel-header">
        <h2>Стоп-лист</h2>
      </div>
      <div id="stoplist-content" class="admin-section">
        <div class="loading-state">
          <p>Загрузка стоп-листа...</p>
        </div>
      </div>
    `;
    
    wrapper.appendChild(panel);
    
    // Загружаем данные
    const container = panel.querySelector('#stoplist-content');
    renderStopListSection(container);
    
    return wrapper;
  }
  
  // Страница "Позиционник" (отдельная вкладка для менеджеров)
  function renderPositionsPage() {
    // Проверка роли пользователя
    if (!authSession || (authSession.role !== 'manager' && authSession.role !== 'admin')) {
      const wrapper = document.createElement('div');
      wrapper.className = 'page';
      wrapper.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔒</div>
          <p>Доступ запрещён. Только для менеджеров.</p>
        </div>
      `;
      return wrapper;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'page';
    
    const panel = document.createElement('section');
    panel.className = 'panel';
    
    panel.innerHTML = `
      <div class="panel-header">
        <h2>Позиционник</h2>
      </div>
      <div id="positions-content" class="admin-section">
        <div class="loading-state">
          <p>Загрузка позиционника...</p>
        </div>
      </div>
    `;
    
    wrapper.appendChild(panel);
    
    // Загружаем данные
    const container = panel.querySelector('#positions-content');
    renderPositionMapSection(container);
    
    return wrapper;
  }
  
  // Старая функция viewAdminPanel - оставлена для совместимости
  function viewAdminPanel() {
    return renderAdminPanel();
  }

  // Модальное окно редактирования пользователя
  async function showEditUserModal(userData, onSuccess) {
    // Загружаем список ресторанов
    let locations = [];
    try {
      const response = await apiClient.get('/admin/locations');
      locations = response.locations || [];
    } catch (error) {
      console.error('Error loading locations:', error);
    }

    const modal = document.createElement('div');
    modal.className = 'rename-modal';
    
    // Поддержка обоих форматов полей (camelCase и snake_case)
    const firstName = userData.firstName || userData.first_name || '';
    const lastName = userData.lastName || userData.last_name || '';
    const email = userData.email || '';
    const role = userData.role || 'waiter';
    const grade = userData.grade || 0;
    const locationId = userData.locationId || userData.location_id || '';
    
    // Группируем рестораны по городам
    const locationsByCity = {};
    locations.forEach(loc => {
      const city = loc.city || 'Не указан';
      if (!locationsByCity[city]) {
        locationsByCity[city] = [];
      }
      locationsByCity[city].push(loc);
    });
    
    modal.innerHTML = `
      <div class="rename-content" style="max-width: 400px;">
        <h3 class="rename-title">Редактировать пользователя</h3>
        
        <div class="form-group">
          <label>Имя *</label>
          <input type="text" class="rename-input" id="edit-first-name" value="${firstName}" required />
        </div>
        
        <div class="form-group">
          <label>Фамилия *</label>
          <input type="text" class="rename-input" id="edit-last-name" value="${lastName}" required />
        </div>
        
        <div class="form-group">
          <label>Email *</label>
          <input type="email" class="rename-input" id="edit-email" value="${email}" required />
        </div>
        
        <div class="form-group">
          <label>Роль *</label>
          <select class="rename-input" id="edit-role" required>
            <option value="waiter" ${role === 'waiter' ? 'selected' : ''}>Официант</option>
            <option value="manager" ${role === 'manager' ? 'selected' : ''}>Менеджер</option>
            <option value="admin" ${role === 'admin' ? 'selected' : ''}>Администратор</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>Грейд</label>
          <input type="number" class="rename-input" id="edit-grade" value="${grade}" min="0" max="5" />
        </div>
        
        <div class="form-group">
          <label>Ресторан *</label>
          <select class="rename-input" id="edit-location" required>
            <option value="">Выберите ресторан</option>
            ${Object.entries(locationsByCity).map(([city, locs]) => `
              <optgroup label="${city}">
                ${locs.map(loc => `
                  <option value="${loc.id}" ${loc.id === locationId ? 'selected' : ''}>${loc.address || loc.name}</option>
                `).join('')}
              </optgroup>
            `).join('')}
          </select>
        </div>
        
        <div class="rename-actions">
          <button class="btn secondary" id="edit-cancel">Отмена</button>
          <button class="btn primary" id="edit-save">Сохранить</button>
        </div>
        
        <div id="edit-error" class="auth-error" style="display: none; margin-top: 12px;"></div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Обработчик отмены
    modal.querySelector('#edit-cancel').addEventListener('click', () => {
      modal.remove();
    });
    
    // Обработчик сохранения
    modal.querySelector('#edit-save').addEventListener('click', async () => {
      const newFirstName = modal.querySelector('#edit-first-name').value.trim();
      const newLastName = modal.querySelector('#edit-last-name').value.trim();
      const newEmail = modal.querySelector('#edit-email').value.trim();
      const newRole = modal.querySelector('#edit-role').value;
      const newGrade = parseInt(modal.querySelector('#edit-grade').value) || 0;
      const newLocationId = parseInt(modal.querySelector('#edit-location').value);
      
      const errorEl = modal.querySelector('#edit-error');
      
      // Валидация
      if (!newFirstName || !newLastName) {
        errorEl.textContent = 'Заполните имя и фамилию';
        errorEl.style.display = 'block';
        return;
      }
      
      if (!validateEmail(newEmail)) {
        errorEl.textContent = 'Неверный формат email';
        errorEl.style.display = 'block';
        return;
      }
      
      if (!newLocationId) {
        errorEl.textContent = 'Выберите ресторан';
        errorEl.style.display = 'block';
        return;
      }
      
      // Отключаем кнопку во время запроса
      const saveBtn = modal.querySelector('#edit-save');
      saveBtn.disabled = true;
      saveBtn.textContent = 'Сохранение...';
      
      try {
        console.log('Updating user:', userData.id, { firstName: newFirstName, lastName: newLastName, email: newEmail, role: newRole, grade: newGrade, locationId: newLocationId });
        
        // Отправляем запрос на обновление пользователя
        const response = await apiClient.put(`/admin/users/${userData.id}`, {
          firstName: newFirstName,
          lastName: newLastName,
          email: newEmail,
          role: newRole,
          grade: newGrade,
          locationId: newLocationId
        });
        
        console.log('Update user response:', response);
        
        if (response.success) {
          console.log('User updated successfully!');
          modal.remove();
          if (onSuccess) onSuccess();
        } else {
          throw new Error(response.error || 'Ошибка обновления пользователя');
        }
      } catch (error) {
        console.error('Error updating user:', error);
        errorEl.textContent = error.message;
        errorEl.style.display = 'block';
        saveBtn.disabled = false;
        saveBtn.textContent = 'Сохранить';
      }
    });
    
    // Закрытие по клику вне модального окна
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  // Модальное окно добавления нового официанта
  function showAddWaiterModal(onSuccess) {
    const modal = document.createElement('div');
    modal.className = 'rename-modal';
    modal.innerHTML = `
      <div class="rename-content" style="max-width: 400px;">
        <h3 class="rename-title">Добавить официанта</h3>
        
        <div class="form-group">
          <label>Имя</label>
          <input type="text" class="rename-input" id="add-first-name" placeholder="Имя" />
        </div>
        
        <div class="form-group">
          <label>Фамилия</label>
          <input type="text" class="rename-input" id="add-last-name" placeholder="Фамилия" />
        </div>
        
        <div class="form-group">
          <label>Email</label>
          <input type="email" class="rename-input" id="add-email" placeholder="email@example.com" />
        </div>
        
        <div class="form-group">
          <label>Пароль</label>
          <input type="text" class="rename-input" id="add-password" placeholder="Минимум 6 символов" />
        </div>
        
        <div class="form-group">
          <label>Грейд</label>
          <input type="number" class="rename-input" id="add-grade" value="0" min="0" max="10" />
        </div>
        
        <div class="rename-actions">
          <button class="btn secondary" id="add-cancel">Отмена</button>
          <button class="btn primary" id="add-save">Добавить</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('#add-cancel').addEventListener('click', () => {
      modal.remove();
    });
    
    modal.querySelector('#add-save').addEventListener('click', async () => {
      const firstName = modal.querySelector('#add-first-name').value.trim();
      const lastName = modal.querySelector('#add-last-name').value.trim();
      const email = modal.querySelector('#add-email').value.trim();
      const password = modal.querySelector('#add-password').value;
      const grade = parseInt(modal.querySelector('#add-grade').value) || 0;
      
      if (!firstName || !lastName || !email || !password) {
        alert('Заполните все поля');
        return;
      }
      
      if (password.length < 6) {
        alert('Пароль должен быть минимум 6 символов');
        return;
      }
      
      try {
        // Получаем location_id текущего пользователя
        const { data: { user } } = await supabase.auth.getUser();
        const { data: currentProfile } = await supabase
          .from('profiles')
          .select('location_id')
          .eq('user_id', user.id)
          .single();
        
        if (!currentProfile?.location_id) {
          alert('Локация не найдена');
          return;
        }
        
        // Создаём пользователя через Supabase Auth
        // Примечание: для создания пользователей от имени админа нужен service_role key
        // Пока используем обычную регистрацию
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: email,
          password: password
        });
        
        if (signUpError) throw signUpError;
        
        if (!signUpData.user) {
          alert('Не удалось создать пользователя');
          return;
        }
        
        // Создаём профиль
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: signUpData.user.id,
            location_id: currentProfile.location_id,
            first_name: firstName,
            last_name: lastName,
            role: 'Официант',
            grade: grade
          });
        
        if (profileError) throw profileError;
        
        modal.remove();
        alert('Официант добавлен! На email отправлено письмо для подтверждения.');
        if (onSuccess) onSuccess();
        
      } catch (err) {
        alert('Ошибка: ' + err.message);
      }
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  // Позиционник - распределение официантов по позициям
  // Storage key for positions data
  const POSITIONS_STORAGE_KEY = 'waiter.positionsData';
  
  // Load positions data from localStorage
  function loadPositionsData() {
    try {
      const data = localStorage.getItem(POSITIONS_STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  }
  
  // Save positions data to localStorage
  function savePositionsData(data) {
    localStorage.setItem(POSITIONS_STORAGE_KEY, JSON.stringify(data));
  }
  
  // Get positions data for a specific date
  function getPositionsForDate(dateStr) {
    const allData = loadPositionsData();
    return allData[dateStr] || { waiters: {}, tables: {} };
  }
  
  // Save positions data for a specific date
  function savePositionsForDate(dateStr, posData) {
    const allData = loadPositionsData();
    allData[dateStr] = posData;
    savePositionsData(allData);
  }
  
  // Check if current user can edit positions (managers and grade 3+ waiters)
  function canEditPositions() {
    const role = profile.role?.toLowerCase() || '';
    const grade = parseInt(profile.grade) || 0;
    
    // Managers and admins can always edit
    if (role.includes('менеджер') || role.includes('manager') || 
        role.includes('админ') || role.includes('admin')) {
      return true;
    }
    
    // Waiters with grade 3+ can edit
    if (grade >= 3) {
      return true;
    }
    
    return false;
  }
  
  function viewPositions() {
    const wrapper = document.createElement('div');
    wrapper.className = 'page';
    
    const canEdit = canEditPositions();
    
    const panel = document.createElement('section');
    panel.className = 'panel';
    panel.innerHTML = `
      <div class="panel-header" style="display: flex; align-items: center; gap: 12px;">
        <button class="back-btn" id="positions-back">‹</button>
        <h2 style="flex: 1; margin: 0;">Позиционник</h2>
      </div>
      
      <div class="settings-section">
        <div class="positions-date-selector">
          <button class="btn secondary" id="prev-date">‹</button>
          <span id="current-date" class="positions-date"></span>
          <button class="btn secondary" id="next-date">›</button>
        </div>
      </div>
      
      <div class="settings-section">
        <div class="section-title">Позиции</div>
        <div class="positions-tabs" id="positions-tabs">
          <button class="position-tab active" data-position="1">Позиция 1</button>
          <button class="position-tab" data-position="2">Позиция 2</button>
        </div>
      </div>
      
      ${canEdit ? `
      <div class="settings-section">
        <button class="btn primary" id="assign-waiter-btn" style="width: 100%;">+ Назначить официанта</button>
      </div>
      ` : ''}
      
      <div class="settings-section">
        <div id="position-map-container" class="position-map-container">
          <div class="map-loading">Загрузка карты...</div>
        </div>
      </div>
      
      <div class="settings-section">
        <div class="section-title">Назначенные официанты</div>
        <div id="assigned-waiters-list" class="assigned-waiters-list">
          <p class="no-waiters">Официанты пока не назначены</p>
        </div>
      </div>
    `;
    
    wrapper.appendChild(panel);
    
    // State
    let currentDate = new Date();
    let currentPosition = 1;
    let positionsData = {};
    let selectedTables = [];
    
    const dateDisplay = panel.querySelector('#current-date');
    const mapContainer = panel.querySelector('#position-map-container');
    const assignedWaitersList = panel.querySelector('#assigned-waiters-list');
    
    function formatDateKey(date) {
      return date.toISOString().split('T')[0];
    }
    
    function formatDate(date) {
      const options = { weekday: 'short', day: 'numeric', month: 'short' };
      return date.toLocaleDateString('ru-RU', options);
    }
    
    function updateDateDisplay() {
      dateDisplay.textContent = formatDate(currentDate);
      loadCurrentPositionsData();
    }
    
    function loadCurrentPositionsData() {
      const dateKey = formatDateKey(currentDate);
      positionsData = getPositionsForDate(dateKey);
      renderAssignedWaiters();
      loadPositionMap(currentPosition);
    }
    
    function saveCurrentPositionsData() {
      const dateKey = formatDateKey(currentDate);
      savePositionsForDate(dateKey, positionsData);
    }
    
    // Embedded SVG maps for positions (to avoid CORS issues with file://)
    const POSITION_MAPS = {
      1: `<svg width="100%" viewBox="0 0 300 600" fill="none" xmlns="http://www.w3.org/2000/svg">

<!-- Верхние круглые столы 127, 126 -->
<circle cx="250" cy="35" r="28" fill="#D9D9D9" stroke="#888" stroke-width="1.5" data-table="127" style="cursor:pointer"/>
<text x="250" y="41" fill="#222" font-size="14" font-family="Arial" font-weight="bold" text-anchor="middle" pointer-events="none">127</text>
<circle cx="150" cy="75" r="28" fill="#D9D9D9" stroke="#888" stroke-width="1.5" data-table="126" style="cursor:pointer"/>
<text x="150" y="81" fill="#222" font-size="14" font-family="Arial" font-weight="bold" text-anchor="middle" pointer-events="none">126</text>

<!-- Левая колонка (КОЛОСЬЯ): 106, 105, 104, RK, 103, 102, 101, 100 -->
<text x="15" y="180" fill="#fff" font-size="10" font-family="Arial" font-weight="bold" writing-mode="vertical-rl" text-orientation="mixed" transform="rotate(180, 15, 280)">КОЛОСЬЯ</text>

<rect x="35" y="115" width="56" height="40" rx="6" fill="#D9D9D9" stroke="#888" stroke-width="1.5" data-table="106" style="cursor:pointer"/>
<text x="63" y="140" fill="#222" font-size="13" font-family="Arial" font-weight="bold" text-anchor="middle" pointer-events="none">106</text>

<rect x="35" y="163" width="56" height="40" rx="6" fill="#D9D9D9" stroke="#888" stroke-width="1.5" data-table="105" style="cursor:pointer"/>
<text x="63" y="188" fill="#222" font-size="13" font-family="Arial" font-weight="bold" text-anchor="middle" pointer-events="none">105</text>

<rect x="35" y="211" width="56" height="40" rx="6" fill="#D9D9D9" stroke="#888" stroke-width="1.5" data-table="104" style="cursor:pointer"/>
<text x="63" y="236" fill="#222" font-size="13" font-family="Arial" font-weight="bold" text-anchor="middle" pointer-events="none">104</text>

<!-- RK блок между 104 и 103 -->
<rect x="35" y="259" width="56" height="32" rx="4" fill="#333" stroke="#555" stroke-width="1"/>
<text x="63" y="280" fill="#fff" font-size="11" font-family="Arial" font-weight="bold" text-anchor="middle">RK</text>

<rect x="35" y="299" width="56" height="40" rx="6" fill="#D9D9D9" stroke="#888" stroke-width="1.5" data-table="103" style="cursor:pointer"/>
<text x="63" y="324" fill="#222" font-size="13" font-family="Arial" font-weight="bold" text-anchor="middle" pointer-events="none">103</text>

<rect x="35" y="347" width="56" height="40" rx="6" fill="#D9D9D9" stroke="#888" stroke-width="1.5" data-table="102" style="cursor:pointer"/>
<text x="63" y="372" fill="#222" font-size="13" font-family="Arial" font-weight="bold" text-anchor="middle" pointer-events="none">102</text>

<rect x="35" y="395" width="56" height="40" rx="6" fill="#D9D9D9" stroke="#888" stroke-width="1.5" data-table="101" style="cursor:pointer"/>
<text x="63" y="420" fill="#222" font-size="13" font-family="Arial" font-weight="bold" text-anchor="middle" pointer-events="none">101</text>

<rect x="35" y="443" width="56" height="40" rx="6" fill="#D9D9D9" stroke="#888" stroke-width="1.5" data-table="100" style="cursor:pointer"/>
<text x="63" y="468" fill="#222" font-size="13" font-family="Arial" font-weight="bold" text-anchor="middle" pointer-events="none">100</text>

<!-- Центральная колонка: 115, 114, 113, 112, 111, 110 -->
<rect x="122" y="139" width="56" height="40" rx="6" fill="#D9D9D9" stroke="#888" stroke-width="1.5" data-table="115" style="cursor:pointer"/>
<text x="150" y="164" fill="#222" font-size="13" font-family="Arial" font-weight="bold" text-anchor="middle" pointer-events="none">115</text>

<rect x="122" y="211" width="56" height="40" rx="6" fill="#D9D9D9" stroke="#888" stroke-width="1.5" data-table="114" style="cursor:pointer"/>
<text x="150" y="236" fill="#222" font-size="13" font-family="Arial" font-weight="bold" text-anchor="middle" pointer-events="none">114</text>

<rect x="122" y="275" width="56" height="40" rx="6" fill="#D9D9D9" stroke="#888" stroke-width="1.5" data-table="113" style="cursor:pointer"/>
<text x="150" y="300" fill="#222" font-size="13" font-family="Arial" font-weight="bold" text-anchor="middle" pointer-events="none">113</text>

<rect x="122" y="347" width="56" height="40" rx="6" fill="#D9D9D9" stroke="#888" stroke-width="1.5" data-table="112" style="cursor:pointer"/>
<text x="150" y="372" fill="#222" font-size="13" font-family="Arial" font-weight="bold" text-anchor="middle" pointer-events="none">112</text>

<rect x="122" y="407" width="56" height="40" rx="6" fill="#D9D9D9" stroke="#888" stroke-width="1.5" data-table="111" style="cursor:pointer"/>
<text x="150" y="432" fill="#222" font-size="13" font-family="Arial" font-weight="bold" text-anchor="middle" pointer-events="none">111</text>

<rect x="122" y="467" width="56" height="40" rx="6" fill="#D9D9D9" stroke="#888" stroke-width="1.5" data-table="110" style="cursor:pointer"/>
<text x="150" y="492" fill="#222" font-size="13" font-family="Arial" font-weight="bold" text-anchor="middle" pointer-events="none">110</text>

<!-- Правая колонка: 125, 124, 123, 122, 121, 120 -->
<rect x="209" y="139" width="56" height="40" rx="6" fill="#D9D9D9" stroke="#888" stroke-width="1.5" data-table="125" style="cursor:pointer"/>
<text x="237" y="164" fill="#222" font-size="13" font-family="Arial" font-weight="bold" text-anchor="middle" pointer-events="none">125</text>

<rect x="209" y="211" width="56" height="40" rx="6" fill="#D9D9D9" stroke="#888" stroke-width="1.5" data-table="124" style="cursor:pointer"/>
<text x="237" y="236" fill="#222" font-size="13" font-family="Arial" font-weight="bold" text-anchor="middle" pointer-events="none">124</text>

<rect x="209" y="275" width="56" height="40" rx="6" fill="#D9D9D9" stroke="#888" stroke-width="1.5" data-table="123" style="cursor:pointer"/>
<text x="237" y="300" fill="#222" font-size="13" font-family="Arial" font-weight="bold" text-anchor="middle" pointer-events="none">123</text>

<rect x="209" y="347" width="56" height="40" rx="6" fill="#D9D9D9" stroke="#888" stroke-width="1.5" data-table="122" style="cursor:pointer"/>
<text x="237" y="372" fill="#222" font-size="13" font-family="Arial" font-weight="bold" text-anchor="middle" pointer-events="none">122</text>

<rect x="209" y="407" width="56" height="40" rx="6" fill="#D9D9D9" stroke="#888" stroke-width="1.5" data-table="121" style="cursor:pointer"/>
<text x="237" y="432" fill="#222" font-size="13" font-family="Arial" font-weight="bold" text-anchor="middle" pointer-events="none">121</text>

<rect x="209" y="467" width="56" height="40" rx="6" fill="#D9D9D9" stroke="#888" stroke-width="1.5" data-table="120" style="cursor:pointer"/>
<text x="237" y="492" fill="#222" font-size="13" font-family="Arial" font-weight="bold" text-anchor="middle" pointer-events="none">120</text>

<!-- Нижняя зона: ОФИС КАССА и RK -->
<rect x="35" y="525" width="100" height="40" rx="4" fill="#222" stroke="#444" stroke-width="1"/>
<text x="85" y="542" fill="#fff" font-size="10" font-family="Arial" font-weight="bold" text-anchor="middle">ОФИС</text>
<text x="85" y="556" fill="#fff" font-size="10" font-family="Arial" font-weight="bold" text-anchor="middle">КАССА</text>

<rect x="165" y="525" width="100" height="40" rx="4" fill="#222" stroke="#444" stroke-width="1"/>
<text x="215" y="551" fill="#fff" font-size="13" font-family="Arial" font-weight="bold" text-anchor="middle">RK</text>

<!-- Легенда (будет заполняться динамически) -->
<g id="legend-container"></g>
</svg>`
    };
    
    // Load SVG map for position
    function loadPositionMap(positionNum) {
      const svgContent = POSITION_MAPS[positionNum];
      
      if (!svgContent) {
        mapContainer.innerHTML = '<div class="map-placeholder"><p>Карта позиции ' + positionNum + ' пока не добавлена</p></div>';
        return;
      }
      
      mapContainer.innerHTML = svgContent;
      
      // Add click handlers to tables
      setupTableClickHandlers();
      updateTableColors();
    }
    
    function setupTableClickHandlers() {
      const svg = mapContainer.querySelector('svg');
      if (!svg) return;
      
      // Find all elements with data-table attribute (rect and circle)
      const tables = svg.querySelectorAll('[data-table]');
      
      tables.forEach(el => {
        // Only make clickable if user can edit
        if (canEdit) {
          el.style.cursor = 'pointer';
        } else {
          el.style.cursor = 'default';
        }
        el.style.transition = 'fill 0.2s, stroke 0.2s';
        
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          if (!canEdit) return; // Don't allow editing if no permission
          const tableNum = el.getAttribute('data-table');
          if (tableNum) {
            showTableAssignmentModal(tableNum, el);
          }
        });
      });
    }
    
    function findTableNumber(rect, svg) {
      return rect.getAttribute('data-table') || null;
    }
    
    function showTableAssignmentModal(tableNum, rectElement) {
      if (!canEdit) return; // Double check permission
      
      // Create modal overlay
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.innerHTML = `
        <div class="modal-content table-assignment-modal">
          <div class="modal-header">
            <h3>Стол ${tableNum}</h3>
            <button class="modal-close">&times;</button>
          </div>
          <div class="modal-body">
            <div class="current-assignment">
              <span class="label">Текущий официант:</span>
              <span class="value" id="current-waiter-name">${getWaiterForTable(tableNum) || 'Не назначен'}</span>
            </div>
            <div class="stop-list-search" style="padding: 0;">
              <input type="text" id="assign-waiter-input" class="filter-input" placeholder="Поиск официанта...">
              <div id="waiter-suggestions" class="stop-list-suggestions" style="position: relative; top: 0;"></div>
            </div>
            <div class="modal-actions">
              <button class="btn secondary" id="clear-assignment">Очистить</button>
              <button class="btn primary" id="save-assignment">Сохранить</button>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(overlay);
      
      const closeBtn = overlay.querySelector('.modal-close');
      const clearBtn = overlay.querySelector('#clear-assignment');
      const saveBtn = overlay.querySelector('#save-assignment');
      const input = overlay.querySelector('#assign-waiter-input');
      const suggestions = overlay.querySelector('#waiter-suggestions');
      
      let selectedWaiter = getWaiterForTable(tableNum) || '';
      let supabaseWaiters = []; // Cache for Supabase waiters
      
      // Load waiters from Supabase
      async function loadWaitersFromSupabase() {
        if (!supabase) return [];
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .order('last_name');
          
          if (error) {
            console.error('Error loading waiters:', error);
            return [];
          }
          
          return data.map(p => `${p.last_name} ${p.first_name}`.trim()).filter(n => n.length > 0);
        } catch (err) {
          console.error('Supabase error:', err);
          return [];
        }
      }
      
      // Initialize - load waiters
      loadWaitersFromSupabase().then(waiters => {
        supabaseWaiters = waiters;
      });
      
      // Close modal
      function closeModal() {
        overlay.remove();
      }
      
      closeBtn.addEventListener('click', closeModal);
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
      });
      
      // Waiter suggestions - search from Supabase
      input.addEventListener('input', async () => {
        const query = input.value.trim().toLowerCase();
        if (query.length < 1) {
          suggestions.innerHTML = '';
          return;
        }
        
        // Combine Supabase waiters with locally assigned waiters
        const localWaiters = getAllWaiters();
        const allWaiters = [...new Set([...supabaseWaiters, ...localWaiters])];
        const filtered = allWaiters.filter(w => w.toLowerCase().includes(query));
        
        if (filtered.length === 0) {
          suggestions.innerHTML = '<div class="stop-list-no-results">Официант не найден</div>';
          return;
        }
        
        suggestions.innerHTML = filtered.slice(0, 8).map(w => 
          `<div class="stop-list-suggestion" data-name="${w}">
            <span class="suggestion-name">${w}</span>
          </div>`
        ).join('');
        
        suggestions.querySelectorAll('.stop-list-suggestion').forEach(el => {
          el.addEventListener('click', () => {
            input.value = el.dataset.name;
            selectedWaiter = el.dataset.name;
            suggestions.innerHTML = '';
          });
        });
      });
      
      // Clear assignment
      clearBtn.addEventListener('click', () => {
        removeTableAssignment(tableNum);
        saveCurrentPositionsData();
        updateTableColors();
        renderAssignedWaiters();
        closeModal();
      });
      
      // Save assignment
      saveBtn.addEventListener('click', () => {
        const waiterName = input.value.trim();
        if (waiterName) {
          assignTableToWaiter(tableNum, waiterName);
          saveCurrentPositionsData();
          updateTableColors();
          renderAssignedWaiters();
        }
        closeModal();
      });
      
      input.focus();
    }
    
    function getWaiterForTable(tableNum) {
      return positionsData.tables?.[tableNum] || null;
    }
    
    function getAllWaiters() {
      const waiters = new Set();
      if (positionsData.waiters) {
        Object.keys(positionsData.waiters).forEach(w => waiters.add(w));
      }
      return Array.from(waiters);
    }
    
    function assignTableToWaiter(tableNum, waiterName) {
      if (!positionsData.waiters) positionsData.waiters = {};
      if (!positionsData.tables) positionsData.tables = {};
      
      // Remove table from previous waiter
      const prevWaiter = positionsData.tables[tableNum];
      if (prevWaiter && positionsData.waiters[prevWaiter]) {
        positionsData.waiters[prevWaiter] = positionsData.waiters[prevWaiter].filter(t => t !== tableNum);
        if (positionsData.waiters[prevWaiter].length === 0) {
          delete positionsData.waiters[prevWaiter];
        }
      }
      
      // Assign to new waiter
      if (!positionsData.waiters[waiterName]) {
        positionsData.waiters[waiterName] = [];
      }
      if (!positionsData.waiters[waiterName].includes(tableNum)) {
        positionsData.waiters[waiterName].push(tableNum);
      }
      positionsData.tables[tableNum] = waiterName;
    }
    
    function removeTableAssignment(tableNum) {
      if (!positionsData.tables) return;
      
      const waiter = positionsData.tables[tableNum];
      if (waiter && positionsData.waiters?.[waiter]) {
        positionsData.waiters[waiter] = positionsData.waiters[waiter].filter(t => t !== tableNum);
        if (positionsData.waiters[waiter].length === 0) {
          delete positionsData.waiters[waiter];
        }
      }
      delete positionsData.tables[tableNum];
    }
    
    // Color palette for waiters
    const waiterColors = [
      '#4CAF50', '#2196F3', '#FF9800', '#E91E63', '#9C27B0',
      '#00BCD4', '#FF5722', '#795548', '#607D8B', '#3F51B5'
    ];
    
    function getWaiterColor(waiterName) {
      const waiters = getAllWaiters();
      const index = waiters.indexOf(waiterName);
      return waiterColors[index % waiterColors.length];
    }
    
    function updateTableColors() {
      const svg = mapContainer.querySelector('svg');
      if (!svg) return;
      
      // Find all tables by data-table attribute (rect and circle)
      const tables = svg.querySelectorAll('[data-table]');
      
      tables.forEach(el => {
        const tableNum = el.getAttribute('data-table');
        if (!tableNum) return;
        
        const waiter = getWaiterForTable(tableNum);
        if (waiter) {
          const color = getWaiterColor(waiter);
          el.setAttribute('fill', color);
        } else {
          el.setAttribute('fill', '#D9D9D9');
        }
      });
      
      // Update legend in SVG
      updateSvgLegend(svg);
    }
    
    function updateSvgLegend(svg) {
      const legendContainer = svg.querySelector('#legend-container');
      if (!legendContainer) return;
      
      const waiters = positionsData.waiters || {};
      const waiterNames = Object.keys(waiters);
      
      // Clear existing legend
      legendContainer.innerHTML = '';
      
      if (waiterNames.length === 0) return;
      
      // Compact horizontal legend with wrapping
      let startY = 575;
      let currentX = 15;
      const dotRadius = 5;
      const spacing = 6;
      const lineHeight = 16;
      const maxWidth = 285;
      
      waiterNames.forEach((name, index) => {
        const color = getWaiterColor(name);
        
        // Get short name: Имя + первая буква фамилии (например "Иван П.")
        const parts = name.split(' ');
        let shortName = parts[0]; // Имя
        if (parts.length > 1 && parts[1].length > 0) {
          shortName += ' ' + parts[1][0] + '.'; // + первая буква фамилии
        }
        const itemWidth = dotRadius * 2 + 4 + (shortName.length * 6) + spacing;
        
        // Check if need to wrap to next line
        if (currentX + itemWidth > maxWidth && currentX > 15) {
          currentX = 15;
          startY += lineHeight;
        }
        
        // Color dot
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', String(currentX + dotRadius));
        circle.setAttribute('cy', String(startY));
        circle.setAttribute('r', String(dotRadius));
        circle.setAttribute('fill', color);
        legendContainer.appendChild(circle);
        
        // Waiter name
        const nameText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        nameText.setAttribute('x', String(currentX + dotRadius * 2 + 3));
        nameText.setAttribute('y', String(startY + 4));
        nameText.setAttribute('fill', '#fff');
        nameText.setAttribute('font-size', '10');
        nameText.setAttribute('font-family', 'Arial');
        nameText.setAttribute('font-weight', 'bold');
        nameText.textContent = shortName;
        legendContainer.appendChild(nameText);
        
        currentX += itemWidth;
      });
      
      // Adjust viewBox height if legend wraps to multiple lines
      const totalHeight = Math.max(600, startY + 25);
      svg.setAttribute('viewBox', `0 0 300 ${totalHeight}`);
    }
    
    function renderAssignedWaiters() {
      const waiters = positionsData.waiters || {};
      const waiterNames = Object.keys(waiters);
      
      if (waiterNames.length === 0) {
        assignedWaitersList.innerHTML = '<p class="no-waiters">Официанты пока не назначены</p>';
        return;
      }
      
      assignedWaitersList.innerHTML = waiterNames.map(name => {
        const tables = waiters[name] || [];
        const color = getWaiterColor(name);
        return `
          <div class="assigned-waiter-item">
            <div class="waiter-color-dot" style="background: ${color}"></div>
            <div class="waiter-info">
              <span class="waiter-name">${name}</span>
              <span class="waiter-tables">Столы: ${tables.sort((a,b) => parseInt(a) - parseInt(b)).join(', ')}</span>
            </div>
            ${canEdit ? `<button class="btn-remove-waiter" data-waiter="${name}">&times;</button>` : ''}
          </div>
        `;
      }).join('');
      
      // Add remove handlers (only if can edit)
      if (canEdit) {
        assignedWaitersList.querySelectorAll('.btn-remove-waiter').forEach(btn => {
          btn.addEventListener('click', () => {
            const waiterName = btn.dataset.waiter;
            removeWaiterAssignments(waiterName);
            saveCurrentPositionsData();
            updateTableColors();
            renderAssignedWaiters();
          });
        });
      }
    }
    
    function removeWaiterAssignments(waiterName) {
      if (!positionsData.waiters?.[waiterName]) return;
      
      // Remove all table assignments for this waiter
      const tables = positionsData.waiters[waiterName] || [];
      tables.forEach(t => {
        delete positionsData.tables[t];
      });
      delete positionsData.waiters[waiterName];
    }
    
    // Position tabs
    const positionTabs = panel.querySelectorAll('.position-tab');
    positionTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        positionTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentPosition = parseInt(tab.dataset.position);
        loadPositionMap(currentPosition);
      });
    });
    
    // Date navigation
    panel.querySelector('#positions-back').addEventListener('click', () => {
      navigate('#/tools');
      setPage('tools');
    });
    
    panel.querySelector('#prev-date').addEventListener('click', () => {
      currentDate.setDate(currentDate.getDate() - 1);
      updateDateDisplay();
    });
    
    panel.querySelector('#next-date').addEventListener('click', () => {
      currentDate.setDate(currentDate.getDate() + 1);
      updateDateDisplay();
    });
    
    // State for bulk assignment mode
    let bulkAssignmentMode = false;
    let bulkAssignmentWaiter = '';
    
    // Assign waiter button - bulk assignment (only if button exists)
    const assignWaiterBtn = panel.querySelector('#assign-waiter-btn');
    if (assignWaiterBtn) {
      assignWaiterBtn.addEventListener('click', () => {
        if (bulkAssignmentMode) {
          // Exit bulk assignment mode
          exitBulkAssignmentMode();
        } else {
          // Enter bulk assignment mode - show waiter selection modal
          showWaiterSelectionModal();
        }
      });
    }
    
    function showWaiterSelectionModal() {
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.innerHTML = `
        <div class="modal-content table-assignment-modal" style="max-width: 350px;">
          <div class="modal-header">
            <h3>Выберите официанта</h3>
            <button class="modal-close">&times;</button>
          </div>
          <div class="modal-body">
            <p style="color: #888; font-size: 13px; margin-bottom: 12px;">Введите имя официанта, затем нажмите на столы на карте</p>
            <div class="stop-list-search" style="padding: 0; margin-bottom: 16px;">
              <input type="text" id="bulk-waiter-input" class="filter-input" placeholder="Имя официанта..." style="font-size: 16px;">
              <div id="bulk-waiter-suggestions" class="stop-list-suggestions" style="position: relative; top: 0;"></div>
            </div>
            
            <div class="modal-actions">
              <button class="btn secondary" id="cancel-bulk">Отмена</button>
              <button class="btn primary" id="start-bulk">Выбрать столы</button>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(overlay);
      
      const closeBtn = overlay.querySelector('.modal-close');
      const cancelBtn = overlay.querySelector('#cancel-bulk');
      const startBtn = overlay.querySelector('#start-bulk');
      const input = overlay.querySelector('#bulk-waiter-input');
      const suggestions = overlay.querySelector('#bulk-waiter-suggestions');
      
      let supabaseWaiters = [];
      
      // Load waiters from Supabase for suggestions
      async function loadWaitersFromSupabase() {
        if (!supabase) return [];
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .order('last_name');
          
          if (error) return [];
          return data.map(p => `${p.last_name} ${p.first_name}`.trim()).filter(n => n.length > 0);
        } catch (err) {
          return [];
        }
      }
      
      loadWaitersFromSupabase().then(waiters => {
        supabaseWaiters = waiters;
      });
      
      function closeModal() {
        overlay.remove();
      }
      
      closeBtn.addEventListener('click', closeModal);
      cancelBtn.addEventListener('click', closeModal);
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
      });
      
      // Waiter suggestions
      input.addEventListener('input', () => {
        const query = input.value.trim().toLowerCase();
        if (query.length < 1) {
          suggestions.innerHTML = '';
          return;
        }
        
        const localWaiters = getAllWaiters();
        const allWaiters = [...new Set([...supabaseWaiters, ...localWaiters])];
        const filtered = allWaiters.filter(w => w.toLowerCase().includes(query));
        
        if (filtered.length === 0) {
          suggestions.innerHTML = '';
          return;
        }
        
        suggestions.innerHTML = filtered.slice(0, 5).map(w => 
          `<div class="stop-list-suggestion" data-name="${w}">
            <span class="suggestion-name">${w}</span>
          </div>`
        ).join('');
        
        suggestions.querySelectorAll('.stop-list-suggestion').forEach(el => {
          el.addEventListener('click', () => {
            input.value = el.dataset.name;
            suggestions.innerHTML = '';
          });
        });
      });
      
      // Start bulk assignment
      startBtn.addEventListener('click', () => {
        const waiterName = input.value.trim();
        if (!waiterName) {
          alert('Введите имя официанта');
          return;
        }
        
        bulkAssignmentWaiter = waiterName;
        bulkAssignmentMode = true;
        closeModal();
        enterBulkAssignmentMode();
      });
      
      input.focus();
    }
    
    function enterBulkAssignmentMode() {
      // Update button to show "Done" state
      const btn = panel.querySelector('#assign-waiter-btn');
      btn.textContent = `✓ Готово (${bulkAssignmentWaiter})`;
      btn.classList.add('active-assignment');
      
      // Add visual indicator to map container
      mapContainer.classList.add('bulk-assignment-active');
      
      // Show instruction banner
      let banner = panel.querySelector('.bulk-assignment-banner');
      if (!banner) {
        banner = document.createElement('div');
        banner.className = 'bulk-assignment-banner';
        banner.innerHTML = `<span>Нажимайте на столы для назначения: <strong>${bulkAssignmentWaiter}</strong></span>`;
        mapContainer.parentNode.insertBefore(banner, mapContainer);
      }
      
      // Update table click handlers for bulk mode
      setupBulkTableClickHandlers();
    }
    
    function exitBulkAssignmentMode() {
      bulkAssignmentMode = false;
      bulkAssignmentWaiter = '';
      
      // Reset button
      const btn = panel.querySelector('#assign-waiter-btn');
      btn.textContent = '+ Назначить официанта';
      btn.classList.remove('active-assignment');
      
      // Remove visual indicators
      mapContainer.classList.remove('bulk-assignment-active');
      
      const banner = panel.querySelector('.bulk-assignment-banner');
      if (banner) banner.remove();
      
      // Restore normal click handlers
      setupTableClickHandlers();
    }
    
    function setupBulkTableClickHandlers() {
      const svg = mapContainer.querySelector('svg');
      if (!svg) return;
      
      const tables = svg.querySelectorAll('[data-table]');
      
      tables.forEach(el => {
        el.style.cursor = 'pointer';
        
        // Remove old listeners by cloning
        const newEl = el.cloneNode(true);
        el.parentNode.replaceChild(newEl, el);
        
        newEl.addEventListener('click', (e) => {
          e.stopPropagation();
          const tableNum = newEl.getAttribute('data-table');
          if (tableNum && bulkAssignmentMode && bulkAssignmentWaiter) {
            assignTableToWaiter(tableNum, bulkAssignmentWaiter);
            saveCurrentPositionsData();
            updateTableColors();
            renderAssignedWaiters();
          }
        });
      });
    }
    
    // Initialize
    updateDateDisplay();
    
    return wrapper;
  }

  // Передать заказ официанту
  function viewTransferOrder() {
    const wrapper = document.createElement('div');
    wrapper.className = 'page';
    
    const panel = document.createElement('section');
    panel.className = 'panel';
    panel.innerHTML = `
      <div class="panel-header" style="display: flex; align-items: center; gap: 12px;">
        <button class="back-btn" id="transfer-back">‹</button>
        <h2 style="flex: 1; margin: 0;">Передать официанту</h2>
      </div>
      
      <div class="settings-section">
        <div class="section-title">Найти официанта</div>
        <div class="search-row">
          <input id="waiter-search" placeholder="Введите код или имя официанта" />
        </div>
        
        <div id="waiter-results" class="waiter-results">
          <div class="search-placeholder">
            <div class="placeholder-icon">👤</div>
            <p>Введите код официанта (например: 001) или имя</p>
          </div>
        </div>
      </div>
      
      <div class="settings-section">
        <div class="section-title">Передать заказ</div>
        <div class="transfer-form" style="display: none;" id="transfer-form">
          <div class="form-field">
            <label>Номер стола:</label>
            <input type="text" id="transfer-table" placeholder="Например: 401" />
          </div>
          <div class="form-field">
            <label>Что передать:</label>
            <textarea id="transfer-message" placeholder="Например: Стейк рибай зерно, Medium"></textarea>
          </div>
          <button class="btn primary" id="send-transfer">📤 Отправить</button>
        </div>
      </div>
    `;
    
    wrapper.appendChild(panel);
    
    // Event handlers
    panel.querySelector('#transfer-back').addEventListener('click', () => {
      navigate('#/tools');
      setPage('tools');
    });
    
    const waiterSearch = panel.querySelector('#waiter-search');
    const waiterResults = panel.querySelector('#waiter-results');
    const transferForm = panel.querySelector('#transfer-form');
    
    // Mock waiter data (в будущем будет из Supabase)
    const waiters = [
      { code: '001', name: 'Олег Б', position: '5', tables: '220-230' },
      { code: '002', name: 'Алина Б', position: '5', tables: '220-230' },
      { code: '003', name: 'Ислом', position: '4', tables: '240-255' },
      { code: '004', name: 'Олимхон', position: '4', tables: '240-255' },
      { code: '005', name: 'Егор А', position: '3', tables: '260-274' },
      { code: '006', name: 'Игорь', position: '3', tables: '260-274' }
    ];
    
    waiterSearch.addEventListener('input', (e) => {
      const query = e.target.value.trim().toLowerCase();
      
      if (query.length < 1) {
        waiterResults.innerHTML = `
          <div class="search-placeholder">
            <div class="placeholder-icon">👤</div>
            <p>Введите код официанта (например: 001) или имя</p>
          </div>
        `;
        transferForm.style.display = 'none';
        return;
      }
      
      const matches = waiters.filter(w => 
        w.code.includes(query) || 
        w.name.toLowerCase().includes(query)
      );
      
      if (matches.length === 0) {
        waiterResults.innerHTML = `
          <div class="search-placeholder">
            <div class="placeholder-icon">❌</div>
            <p>Официант не найден</p>
          </div>
        `;
        transferForm.style.display = 'none';
        return;
      }
      
      waiterResults.innerHTML = matches.map(w => `
        <div class="waiter-card" data-code="${w.code}">
          <div class="waiter-avatar">👤</div>
          <div class="waiter-info">
            <div class="waiter-name">${w.name}</div>
            <div class="waiter-details">Код: ${w.code} • Позиция ${w.position} • Столы: ${w.tables}</div>
          </div>
          <button class="btn primary btn-select-waiter">Выбрать</button>
        </div>
      `).join('');
      
      // Add click handlers
      waiterResults.querySelectorAll('.btn-select-waiter').forEach(btn => {
        btn.addEventListener('click', () => {
          transferForm.style.display = 'block';
          waiterResults.querySelectorAll('.waiter-card').forEach(c => c.classList.remove('selected'));
          btn.closest('.waiter-card').classList.add('selected');
        });
      });
    });
    
    // Send transfer
    panel.querySelector('#send-transfer').addEventListener('click', () => {
      const table = panel.querySelector('#transfer-table').value;
      const message = panel.querySelector('#transfer-message').value;
      
      if (!table || !message) {
        alert('Заполните все поля');
        return;
      }
      
      alert(`Заказ передан!\nСтол: ${table}\nСообщение: ${message}`);
      
      // Reset form
      panel.querySelector('#transfer-table').value = '';
      panel.querySelector('#transfer-message').value = '';
      transferForm.style.display = 'none';
    });
    
    return wrapper;
  }

  // Карта ресторана (заглушка)
  function viewRestaurantMap() {
    const wrapper = document.createElement('div');
    wrapper.className = 'page';
    
    const panel = document.createElement('section');
    panel.className = 'panel';
    panel.innerHTML = `
      <div class="panel-header" style="display: flex; align-items: center; gap: 12px;">
        <button class="back-btn" id="map-back">‹</button>
        <h2 style="flex: 1; margin: 0;">Карта ресторана</h2>
      </div>
      
      <div class="settings-section">
        <div class="search-placeholder" style="padding: 40px 20px;">
          <div class="placeholder-icon">🗺️</div>
          <h3>В разработке</h3>
          <p>Интерактивная карта ресторана будет доступна в следующем обновлении</p>
        </div>
      </div>
    `;
    
    wrapper.appendChild(panel);
    
    panel.querySelector('#map-back').addEventListener('click', () => {
      navigate('#/tools');
      setPage('tools');
    });
    
    return wrapper;
  }

  function viewSearchDishes() {
    const wrapper = document.createElement('div');
    wrapper.className = 'page';
    
    const panel = document.createElement('section');
    panel.className = 'panel search-panel';
    panel.innerHTML = `
      <div class="panel-header" style="display: flex; align-items: center; gap: 12px;">
        <button class="back-btn" id="search-dishes-back">‹</button>
        <h2 style="flex: 1; margin: 0;">Поиск блюд</h2>
      </div>
      <div class="search-row">
        <input id="search-main" placeholder="Напишите название блюда" />
        <button id="filter-btn" class="btn secondary" title="Фильтры">🔍</button>
      </div>
      
      <!-- Filters Panel -->
      <div id="filters-panel" class="filters-panel" style="display: none;">
        <div class="filters-header">
          <h3>Фильтры</h3>
          <button id="close-filters" class="btn-close">✕</button>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">Категория:</label>
          <select id="category-filter" class="filter-select">
            <option value="">Все категории</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">Цена (₽):</label>
          <div class="filter-range">
            <input type="number" id="price-min" class="filter-input" placeholder="От" min="0" />
            <span class="range-separator">—</span>
            <input type="number" id="price-max" class="filter-input" placeholder="До" min="0" />
          </div>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">Калории (ккал на 100г):</label>
          <div class="filter-range">
            <input type="number" id="calorie-min" class="filter-input" placeholder="От" min="0" />
            <span class="range-separator">—</span>
            <input type="number" id="calorie-max" class="filter-input" placeholder="До" min="0" />
          </div>
        </div>

      <div class="filter-group">
        <label class="filter-label">Исключить аллергены (через запятую):</label>
        <input type="text" id="allergens-exclude" class="filter-input" placeholder="например: глютен, орехи, лактоза" />
      </div>

      <div class="filter-group">
        <label class="filter-label">Поиск по аллергенам (через запятую):</label>
        <input type="text" id="allergens-include" class="filter-input" placeholder="например: перец, яйца, молоко" />
      </div>
        
        <div class="filter-group">
          <label class="filter-label">Сортировка:</label>
          <select id="sort-select" class="filter-select">
            <option value="relevance">По релевантности</option>
            <option value="name">По названию (А-Я)</option>
            <option value="price-asc">Цена: по возрастанию</option>
            <option value="price-desc">Цена: по убыванию</option>
            <option value="calories-asc">Калории: по возрастанию</option>
            <option value="calories-desc">Калории: по убыванию</option>
          </select>
        </div>
        
        <div class="filter-actions">
          <button id="apply-filters" class="btn primary">Применить</button>
          <button id="clear-filters" class="btn secondary">Сбросить</button>
        </div>
        
        <div class="active-filters" id="active-filters" style="display: none;"></div>
      </div>
      
      <div class="search-suggestions" id="search-suggestions" style="display: none;">
        <div class="suggestions-list" id="suggestions-list"></div>
      </div>
      
      <div class="search-results-container" id="search-results">
        <div class="search-placeholder">
          <div class="placeholder-icon">🔍</div>
          <h3>Поиск блюд</h3>
          <p>Напишите название блюда</p>
          <div class="search-examples">
            <span class="example-tag">Борщ</span>
            <span class="example-tag">Стейк Рибай</span>
            <span class="example-tag">Цезарь</span>
            <span class="example-tag">Лимонад</span>
          </div>
        </div>
      </div>
    `;
    wrapper.appendChild(panel);
    
    // Back button handler
    panel.querySelector('#search-dishes-back').addEventListener('click', () => {
      navigate('#/tools');
      setPage('tools');
    });
    
    const searchInput = panel.querySelector('#search-main');
    const suggestionsContainer = panel.querySelector('#search-suggestions');
    const suggestionsList = panel.querySelector('#suggestions-list');
    const resultsContainer = panel.querySelector('#search-results');
    const filterBtn = panel.querySelector('#filter-btn');
    const filtersPanel = panel.querySelector('#filters-panel');
    const closeFiltersBtn = panel.querySelector('#close-filters');
    const categoryFilter = panel.querySelector('#category-filter');
    const priceMin = panel.querySelector('#price-min');
    const priceMax = panel.querySelector('#price-max');
    const calorieMin = panel.querySelector('#calorie-min');
    const calorieMax = panel.querySelector('#calorie-max');
    const allergensExcludeInput = panel.querySelector('#allergens-exclude');
    const allergensIncludeInput = panel.querySelector('#allergens-include');
    const sortSelect = panel.querySelector('#sort-select');
    const applyFiltersBtn = panel.querySelector('#apply-filters');
    const clearFiltersBtn = panel.querySelector('#clear-filters');
    const activeFiltersContainer = panel.querySelector('#active-filters');
    
    let searchTimeout;
    let allDishes = [];
    let filteredDishes = [];
    let currentFilters = {
      category: '',
      priceMin: null,
      priceMax: null,
      calorieMin: null,
      calorieMax: null,
      allergensExclude: [],
      allergensInclude: [],
      sort: 'relevance'
    };
    
    // Filter button - toggle filters panel
    filterBtn.addEventListener('click', () => {
      const isVisible = filtersPanel.style.display !== 'none';
      filtersPanel.style.display = isVisible ? 'none' : 'block';
    });
    
    // Close filters button
    closeFiltersBtn.addEventListener('click', () => {
      filtersPanel.style.display = 'none';
    });
    
    // Load dishes data
    loadDb().then(({dishes}) => {
      allDishes = dishes;
      filteredDishes = [...allDishes];
      console.log('Loaded dishes for search:', allDishes.length);
      
      // Initialize category filter options
      initializeCategories();
      // Restore saved filters
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.searchFilters) || 'null');
        if (saved && typeof saved === 'object') {
          currentFilters = {
            category: saved.category || '',
            priceMin: saved.priceMin ?? null,
            priceMax: saved.priceMax ?? null,
            calorieMin: saved.calorieMin ?? null,
            calorieMax: saved.calorieMax ?? null,
            allergensExclude: Array.isArray(saved.allergensExclude) ? saved.allergensExclude : [],
            allergensInclude: Array.isArray(saved.allergensInclude) ? saved.allergensInclude : [],
            sort: saved.sort || 'relevance'
          };
          categoryFilter.value = currentFilters.category;
          priceMin.value = currentFilters.priceMin ?? '';
          priceMax.value = currentFilters.priceMax ?? '';
          calorieMin.value = currentFilters.calorieMin ?? '';
          calorieMax.value = currentFilters.calorieMax ?? '';
          allergensExcludeInput.value = (currentFilters.allergensExclude || []).join(', ');
          allergensIncludeInput.value = (currentFilters.allergensInclude || []).join(', ');
          sortSelect.value = currentFilters.sort;
          // Apply immediately to reflect saved state
          applyFilters();
        }
      } catch {}
      
      // Add click handlers to example tags
      panel.querySelectorAll('.example-tag').forEach(tag => {
        tag.addEventListener('click', () => {
          searchInput.value = tag.textContent;
          searchInput.dispatchEvent(new Event('input'));
        });
      });
    }).catch(err => {
      console.error('Failed to load dishes for search:', err);
      resultsContainer.innerHTML = `
        <div style="padding: 20px; text-align: center; color: var(--danger);">
          Ошибка загрузки меню
        </div>
      `;
    });
    
    // Initialize categories
    function initializeCategories() {
      const categories = [...new Set(allDishes.map(dish => dish.category).filter(Boolean))];
      categories.sort();
      categoryFilter.innerHTML = '<option value="">Все категории</option>' + 
        categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
    }
    
    // Extract price from price string
    function extractPrice(priceStr) {
      if (!priceStr || priceStr === '—') return null;
      const match = priceStr.match(/(\d+)/);
      return match ? parseInt(match[1]) : null;
    }
    
    // Extract calories from KBJU string
    function extractCalories(kbjuStr) {
      if (!kbjuStr || kbjuStr === '—') return null;
      const match = kbjuStr.match(/К[.:\s]*(\d+)/i);
      return match ? parseInt(match[1]) : null;
    }
    
    // Apply filters
    function applyFilters() {
      // Update filters from inputs
      currentFilters.category = categoryFilter.value;
      currentFilters.priceMin = priceMin.value ? parseInt(priceMin.value) : null;
      currentFilters.priceMax = priceMax.value ? parseInt(priceMax.value) : null;
      currentFilters.calorieMin = calorieMin.value ? parseInt(calorieMin.value) : null;
      currentFilters.calorieMax = calorieMax.value ? parseInt(calorieMax.value) : null;
      currentFilters.allergensExclude = (allergensExcludeInput.value || '')
        .split(',')
        .map(s => s.trim().toLowerCase())
        .filter(Boolean);
      currentFilters.allergensInclude = (allergensIncludeInput.value || '')
        .split(',')
        .map(s => s.trim().toLowerCase())
        .filter(Boolean);
      currentFilters.sort = sortSelect.value;
      try { localStorage.setItem(STORAGE_KEYS.searchFilters, JSON.stringify(currentFilters)); } catch {}
      
      // Filter dishes
      filteredDishes = allDishes.filter(dish => {
        // Category filter
        if (currentFilters.category && dish.category !== currentFilters.category) {
          return false;
        }
        
        // Price filter
        if (currentFilters.priceMin !== null || currentFilters.priceMax !== null) {
          const price = extractPrice(dish.price);
          if (price !== null) {
            if (currentFilters.priceMin !== null && price < currentFilters.priceMin) return false;
            if (currentFilters.priceMax !== null && price > currentFilters.priceMax) return false;
          }
        }
        
        // Calorie filter
        if (currentFilters.calorieMin !== null || currentFilters.calorieMax !== null) {
          const calories = extractCalories(dish.kbju);
          if (calories !== null) {
            if (currentFilters.calorieMin !== null && calories < currentFilters.calorieMin) return false;
            if (currentFilters.calorieMax !== null && calories > currentFilters.calorieMax) return false;
          }
        }

        // Allergens exclude filter
        if (currentFilters.allergensExclude && currentFilters.allergensExclude.length > 0) {
          const dishAll = Array.isArray(dish.allergens) ? dish.allergens.map(a => String(a).toLowerCase()) : [];
          const hasExcluded = currentFilters.allergensExclude.some(ex => dishAll.includes(ex));
          if (hasExcluded) return false;
        }

        // Allergens include filter (search by allergen)
        if (currentFilters.allergensInclude && currentFilters.allergensInclude.length > 0) {
          const dishAll = Array.isArray(dish.allergens) ? dish.allergens.map(a => String(a).toLowerCase()) : [];
          // Check if dish contains any of the included allergens
          const hasIncluded = currentFilters.allergensInclude.some(inc => {
            // Check exact match or substring match
            return dishAll.some(allergen => allergen.includes(inc) || inc.includes(allergen));
          });
          if (!hasIncluded) return false;
        }
        
        return true;
      });
      
      // Sort dishes
      sortDishes();
      
      // Show filtered results
      showFilteredResults();
      
      // Update active filters display
      updateActiveFilters();
      
      // Close filters panel
      filtersPanel.style.display = 'none';
    }
    
    // Sort dishes
    function sortDishes() {
      if (currentFilters.sort === 'name') {
        filteredDishes.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
      } else if (currentFilters.sort === 'price-asc') {
        filteredDishes.sort((a, b) => {
          const priceA = extractPrice(a.price) || 0;
          const priceB = extractPrice(b.price) || 0;
          return priceA - priceB;
        });
      } else if (currentFilters.sort === 'price-desc') {
        filteredDishes.sort((a, b) => {
          const priceA = extractPrice(a.price) || 0;
          const priceB = extractPrice(b.price) || 0;
          return priceB - priceA;
        });
      } else if (currentFilters.sort === 'calories-asc') {
        filteredDishes.sort((a, b) => {
          const calA = extractCalories(a.kbju) || 0;
          const calB = extractCalories(b.kbju) || 0;
          return calA - calB;
        });
      } else if (currentFilters.sort === 'calories-desc') {
        filteredDishes.sort((a, b) => {
          const calA = extractCalories(a.kbju) || 0;
          const calB = extractCalories(b.kbju) || 0;
          return calB - calA;
        });
      }
    }
    
    // Show filtered results
    function showFilteredResults() {
      if (filteredDishes.length === 0) {
        resultsContainer.innerHTML = `
          <div class="search-placeholder">
            <div class="placeholder-icon">🔍</div>
            <h3>Ничего не найдено</h3>
            <p>Попробуйте изменить фильтры</p>
          </div>
        `;
        return;
      }
      
      resultsContainer.innerHTML = '';
      const resultsGrid = document.createElement('div');
      resultsGrid.className = 'filtered-results-grid';
      
      const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const highlight = (text, query) => {
        const q = (query || '').trim();
        if (!q) return text;
        try {
          const re = new RegExp(escapeRegExp(q), 'ig');
          return String(text).replace(re, (m) => `<mark>${m}</mark>`);
        } catch { return text; }
      };

      const currentQuery = (searchInput.value || '').trim();
      filteredDishes.slice(0, 50).forEach(dish => {
        const card = document.createElement('div');
        card.className = 'dish-result-card';
        card.innerHTML = `
          <div class="dish-result-name">${highlight(dish.name, currentQuery)}</div>
          <div class="dish-result-category">${dish.category || '—'}</div>
          <div class="dish-result-footer">
            <span class="dish-result-price">${dish.price || '—'}</span>
            ${extractCalories(dish.kbju) ? `<span class="dish-result-calories">${extractCalories(dish.kbju)} ккал</span>` : ''}
          </div>
        `;
        
        card.addEventListener('click', () => {
          selectDish(dish);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        
        resultsGrid.appendChild(card);
      });
      
      resultsContainer.appendChild(resultsGrid);
      
      if (filteredDishes.length > 50) {
        const moreInfo = document.createElement('div');
        moreInfo.className = 'results-more-info';
        moreInfo.textContent = `Показано 50 из ${filteredDishes.length} результатов`;
        resultsContainer.appendChild(moreInfo);
      }
    }
    
    // Update active filters display
    function updateActiveFilters() {
      const filters = [];
      
      if (currentFilters.category) {
        filters.push(`Категория: ${currentFilters.category}`);
      }
      if (currentFilters.priceMin !== null || currentFilters.priceMax !== null) {
        const priceText = `Цена: ${currentFilters.priceMin || 0}₽ — ${currentFilters.priceMax || '∞'}₽`;
        filters.push(priceText);
      }
      if (currentFilters.calorieMin !== null || currentFilters.calorieMax !== null) {
        const calText = `Калории: ${currentFilters.calorieMin || 0} — ${currentFilters.calorieMax || '∞'} ккал`;
        filters.push(calText);
      }
      if (currentFilters.allergensExclude && currentFilters.allergensExclude.length > 0) {
        filters.push(`Без аллергенов: ${currentFilters.allergensExclude.join(', ')}`);
      }
      if (currentFilters.allergensInclude && currentFilters.allergensInclude.length > 0) {
        filters.push(`С аллергенами: ${currentFilters.allergensInclude.join(', ')}`);
      }
      if (currentFilters.sort !== 'relevance') {
        const sortNames = {
          'name': 'По названию',
          'price-asc': 'Цена ↑',
          'price-desc': 'Цена ↓',
          'calories-asc': 'Калории ↑',
          'calories-desc': 'Калории ↓'
        };
        filters.push(`Сортировка: ${sortNames[currentFilters.sort]}`);
      }
      
      if (filters.length > 0) {
        activeFiltersContainer.style.display = 'block';
        activeFiltersContainer.innerHTML = '<div class="active-filters-label">Активные фильтры:</div>' +
          filters.map(f => `<span class="filter-tag">${f}</span>`).join('');
      } else {
        activeFiltersContainer.style.display = 'none';
      }
    }
    
    // Clear filters
    function clearFilters() {
      currentFilters = {
        category: '',
        priceMin: null,
        priceMax: null,
        calorieMin: null,
        calorieMax: null,
        allergensExclude: [],
        allergensInclude: [],
        sort: 'relevance'
      };
      
      categoryFilter.value = '';
      priceMin.value = '';
      priceMax.value = '';
      calorieMin.value = '';
      calorieMax.value = '';
      allergensExcludeInput.value = '';
      allergensIncludeInput.value = '';
      sortSelect.value = 'relevance';
      try { localStorage.removeItem(STORAGE_KEYS.searchFilters); } catch {}
      
      filteredDishes = [...allDishes];
      activeFiltersContainer.style.display = 'none';
      
      resultsContainer.innerHTML = `
        <div class="search-placeholder">
          <div class="placeholder-icon">🔍</div>
          <h3>Поиск блюд</h3>
          <p>Введите название блюда для поиска</p>
          <div class="search-examples">
            <span class="example-tag">Борщ</span>
            <span class="example-tag">Стейк Рибай</span>
            <span class="example-tag">Цезарь</span>
            <span class="example-tag">Лимонад</span>
          </div>
        </div>
      `;
      
      // Re-add click handlers to example tags
      resultsContainer.querySelectorAll('.example-tag').forEach(tag => {
        tag.addEventListener('click', () => {
          searchInput.value = tag.textContent;
          searchInput.dispatchEvent(new Event('input'));
        });
      });
      
      filtersPanel.style.display = 'none';
    }
    
    // Event listeners
    applyFiltersBtn.addEventListener('click', applyFilters);
    clearFiltersBtn.addEventListener('click', clearFilters);
    
    function normalize(text) {
      return (text || '').toLowerCase().trim();
    }
    
    function findMatchingDishes(query) {
      if (!query || query.length < 2) return [];
      
      const normalizedQuery = normalize(query);
      const matches = [];
      
      allDishes.forEach(dish => {
        const dishName = normalize(dish.name);
        
        // Exact match gets highest priority
        if (dishName === normalizedQuery) {
          matches.push({...dish, matchType: 'exact', score: 100});
        }
        // Starts with query
        else if (dishName.startsWith(normalizedQuery)) {
          matches.push({...dish, matchType: 'starts', score: 80});
        }
        // Contains query
        else if (dishName.includes(normalizedQuery)) {
          matches.push({...dish, matchType: 'contains', score: 60});
        }
        // Word match - check if any word in dish name starts with query
        else {
          const dishWords = dishName.split(' ');
          const queryWords = normalizedQuery.split(' ');
          
          for (let queryWord of queryWords) {
            for (let dishWord of dishWords) {
              if (dishWord.startsWith(queryWord) && queryWord.length > 1) {
                matches.push({...dish, matchType: 'word', score: 40});
                break;
              }
            }
            if (matches.some(m => m.name === dish.name)) break;
          }
        }
      });
      
      // Sort by score and return top 10
      return matches
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
    }
    
    function renderSuggestions(matches) {
      suggestionsList.innerHTML = '';
      
      if (matches.length === 0) {
        suggestionsContainer.style.display = 'none';
        return;
      }
      
      const frag = document.createDocumentFragment();
      
      matches.forEach(dish => {
        const suggestion = document.createElement('div');
        suggestion.className = 'suggestion-item';
        suggestion.innerHTML = `
          <div class="suggestion-content">
            <div class="suggestion-name">${dish.name}</div>
            <div class="suggestion-category">${dish.category || 'Без категории'}</div>
          </div>
          <div class="suggestion-price">${dish.price || '—'}</div>
        `;
        
        suggestion.addEventListener('click', () => {
          selectDish(dish);
        });
        
        frag.appendChild(suggestion);
      });
      
      suggestionsList.appendChild(frag);
      suggestionsContainer.style.display = 'block';
    }
    
    function selectDish(dish) {
      // Fill search input with selected dish name
      searchInput.value = dish.name;
      
      // Hide suggestions
      suggestionsContainer.style.display = 'none';
      
      // Show full dish details
      showDishDetails(dish);
    }
    
    function showDishDetails(dish) {
      // Prepare image HTML
      let imageHTML = '';
      if (dish.image && dish.image !== '' && dish.image !== '-') {
        imageHTML = `
          <img src="${dish.image}" 
               alt="${dish.name}" 
               class="dish-detail-image-img"
               onclick="showImageLightbox('${dish.image}', '${dish.name}', '${dish.name}')"
               onerror="this.style.display='none'; this.parentElement.innerHTML='<div class=\\'dish-detail-image-placeholder\\'>🍽️</div>';" />
        `;
      } else {
        imageHTML = '<div class="dish-detail-image-placeholder">🍽️</div>';
      }
      
      resultsContainer.innerHTML = `
        <div class="dish-detail-card">
          <div class="dish-detail-image">
            ${imageHTML}
          </div>
          
          <div class="dish-detail-header">
            <h3>${dish.name}</h3>
            <div class="dish-detail-price">${calculatePrice(dish.price, dish.category) || dish.price || '—'}</div>
          </div>
          
          <div class="dish-detail-info">
            <div class="dish-detail-section category-section">
              <strong>Категория:</strong> <span class="category-value">${dish.category || '—'}</span>
            </div>
            
            ${dish.gramm ? `
            <div class="dish-detail-section">
              <strong>Вес:</strong> ${dish.gramm}
            </div>
            ` : ''}
            
            ${dish.kbju ? `
            <div class="dish-detail-section">
              <strong>КБЖУ:</strong> ${dish.kbju}
            </div>
            ` : ''}
            
            ${dish.composition && dish.composition.length > 0 ? `
            <div class="dish-detail-section">
              <strong>Состав:</strong>
              <ul class="composition-list">
                ${dish.composition.map(ingredient => `<li>${ingredient}</li>`).join('')}
              </ul>
            </div>
            ` : ''}
            
            ${dish.allergens && dish.allergens.length > 0 ? `
            <div class="dish-detail-section">
              <strong>Аллергены:</strong>
              <div class="allergens-list">
                ${dish.allergens.map(allergen => `<span class="allergen-tag">${allergen}</span>`).join('')}
              </div>
            </div>
            ` : ''}
            
            ${dish.description && dish.description.length > 0 ? `
            <div class="dish-detail-section">
              <strong>Описание:</strong>
              <p class="dish-description">${dish.description.join(' ')}</p>
            </div>
            ` : ''}
            
            ${dish.R_keeper ? `
            <div class="dish-detail-section rkeeper-section">
              <strong>R_keeper:</strong> <span class="rkeeper-code">${dish.R_keeper}</span>
            </div>
            ` : ''}
          </div>
        </div>
      `;
    }
    
    // Search input handler
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      
      // Clear previous timeout
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
      
      if (query.length < 2) {
        suggestionsContainer.style.display = 'none';
        resultsContainer.innerHTML = `
          <div style="padding: 20px; text-align: center; color: var(--muted-foreground);">
            Введите минимум 2 символа для поиска
          </div>
        `;
        return;
      }
      
      // Debounce search
      searchTimeout = setTimeout(() => {
        const matches = findMatchingDishes(query);
        renderSuggestions(matches);
        
        // If no suggestions, show "not found" message
        if (matches.length === 0) {
          resultsContainer.innerHTML = `
          <div style="padding: 20px; text-align: center; color: var(--muted-foreground);">
              По запросу "${query}" ничего не найдено
          </div>
        `;
        }
      }, 150);
    });
    
    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
      if (!panel.contains(e.target)) {
        suggestionsContainer.style.display = 'none';
      }
    });
    
    // Handle Enter key
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const query = e.target.value.trim();
        if (query) {
          const matches = findMatchingDishes(query);
          if (matches.length > 0) {
            selectDish(matches[0]); // Select first match
          }
        }
      }
    });
    
    return wrapper;
  }

  function viewLearn() {
    const hash = location.hash || '';
    
    // Route to sub-pages
    if (hash === '#/learn/in-development') return viewInDevelopment();
    if (hash === '#/learn/menu') return viewLearnMenu();
    if (hash.startsWith('#/learn/menu/category') || hash.startsWith('#/learn/menu/flashcards')) return viewLearnMenuFlashcards();
    if (hash === '#/learn/bar') return viewLearnBar();
    if (hash.startsWith('#/learn/bar/category') || hash.startsWith('#/learn/bar/flashcards')) return viewLearnBarFlashcards();
    if (hash === '#/learn/theory') return viewLearnTheory();
    if (hash === '#/learn/steps') return viewServiceSteps();
    if (hash.startsWith('#/learn/reference/')) return viewReference();
    if (hash.startsWith('#/learn/flashcards/')) return viewFlashcards();
    if (hash.startsWith('#/learn/tests/')) return viewTests();
    
    // Main learning page - gamified with circular progress and level system
    const wrapper = document.createElement('div');
    wrapper.className = 'page learn-page learn-page-gamified';
    
    // Calculate module progress
    const dishesProgress = calculateModuleProgress('dishes');
    const barStudyProgress = calculateModuleProgress('bar-study');
    const theoryModuleProgress = calculateModuleProgress('theory');
    const serviceStepsProgress = calculateModuleProgress('service-steps');
    const overallProgress = calculateOverallProgress();
    const levelInfo = getLevelInfo();
    
    wrapper.innerHTML = `
      <!-- Header with title and overall progress -->
      <div class="learn-header-new">
        <div class="learn-header-left">
          <h1 class="learn-title-new">Изучение</h1>
          <div class="learn-level-badge-new">
            <span class="level-bull-icon">🐂</span>
            <span class="level-text-new">Level ${levelInfo.level} — ${levelInfo.title} • ${levelInfo.xp} / ${levelInfo.xpForNext} XP</span>
          </div>
        </div>
        <div class="learn-header-right">
          <div class="overall-progress-circle-new">
            <svg viewBox="0 0 100 100">
              <circle class="progress-track-new" cx="50" cy="50" r="42" fill="none" stroke="#2a2a2a" stroke-width="6"/>
              <circle class="progress-bar-new" cx="50" cy="50" r="42" fill="none" 
                      stroke="#dc2626" stroke-width="6" stroke-linecap="round"
                      stroke-dasharray="${Math.PI * 84}" 
                      stroke-dashoffset="${Math.PI * 84 * (1 - overallProgress / 100)}"
                      transform="rotate(-90 50 50)"/>
            </svg>
            <div class="overall-progress-text-new">
              <span class="overall-percent-new">${overallProgress}%</span>
            </div>
          </div>
          <div class="overall-progress-label-new">Общий прогресс</div>
        </div>
      </div>
      
      <!-- Learning Module Cards Grid 2x2 -->
      <div class="learn-modules-grid-new">
        <div class="learn-module-card-new" data-module="dishes" data-progress="${dishesProgress}">
          <div class="module-title-new">Изучение блюд</div>
          <div class="module-icon-new">🍛</div>
          <div class="module-progress-circle-new">
            <svg viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="32" fill="none" stroke="#2a2a2a" stroke-width="5"/>
              <circle cx="40" cy="40" r="32" fill="none" 
                      stroke="#dc2626" stroke-width="5" stroke-linecap="round"
                      stroke-dasharray="${Math.PI * 64}" 
                      stroke-dashoffset="${Math.PI * 64 * (1 - dishesProgress / 100)}"
                      transform="rotate(-90 40 40)"/>
            </svg>
            <span class="module-percent-new">${dishesProgress}%</span>
          </div>
        </div>
        
        <div class="learn-module-card-new" data-module="bar-study" data-progress="${barStudyProgress}">
          <div class="module-title-new">Изучение бара</div>
          <div class="module-icon-new">🍹</div>
          <div class="module-progress-circle-new">
            <svg viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="32" fill="none" stroke="#2a2a2a" stroke-width="5"/>
              <circle cx="40" cy="40" r="32" fill="none" 
                      stroke="#dc2626" stroke-width="5" stroke-linecap="round"
                      stroke-dasharray="${Math.PI * 64}" 
                      stroke-dashoffset="${Math.PI * 64 * (1 - barStudyProgress / 100)}"
                      transform="rotate(-90 40 40)"/>
            </svg>
            <span class="module-percent-new">${barStudyProgress}%</span>
          </div>
        </div>
        
        <div class="learn-module-card-new" data-module="theory" data-progress="${theoryModuleProgress}">
          <div class="module-title-new">Изучение напитков</div>
          <div class="module-icon-new">🍷</div>
          <div class="module-progress-circle-new">
            <svg viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="32" fill="none" stroke="#2a2a2a" stroke-width="5"/>
              <circle cx="40" cy="40" r="32" fill="none" 
                      stroke="#dc2626" stroke-width="5" stroke-linecap="round"
                      stroke-dasharray="${Math.PI * 64}" 
                      stroke-dashoffset="${Math.PI * 64 * (1 - theoryModuleProgress / 100)}"
                      transform="rotate(-90 40 40)"/>
            </svg>
            <span class="module-percent-new">${theoryModuleProgress}%</span>
          </div>
        </div>
        
        <div class="learn-module-card-new" data-module="service-steps" data-progress="${serviceStepsProgress}">
          <div class="module-title-new">Изучение сервиса</div>
          <div class="module-icon-new">🛎️</div>
          <div class="module-progress-circle-new">
            <svg viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="32" fill="none" stroke="#2a2a2a" stroke-width="5"/>
              <circle cx="40" cy="40" r="32" fill="none" 
                      stroke="#dc2626" stroke-width="5" stroke-linecap="round"
                      stroke-dasharray="${Math.PI * 64}" 
                      stroke-dashoffset="${Math.PI * 64 * (1 - serviceStepsProgress / 100)}"
                      transform="rotate(-90 40 40)"/>
            </svg>
            <span class="module-percent-new">${serviceStepsProgress}%</span>
          </div>
        </div>
      </div>
    `;
    
    // Module cards - show "In Development" page
    wrapper.querySelectorAll('.learn-module-card-new').forEach(card => {
      card.addEventListener('click', () => {
        navigate('#/learn/in-development');
      });
    });
    
    return wrapper;
  }
  
  // "In Development" page for learning modules
  function viewInDevelopment() {
    const wrapper = document.createElement('div');
    wrapper.className = 'page in-development-page';
    
    const isDarkMode = document.documentElement.classList.contains('dark');
    const imageSrc = isDarkMode 
      ? './В разработке (тёмный).png' 
      : './В разработке (светлый).png';
    
    wrapper.innerHTML = `
      <div class="in-development-container">
        <button class="back-btn in-development-back" id="dev-back">‹</button>
        <img src="${imageSrc}" alt="В разработке" class="in-development-image" />
      </div>
    `;
    
    wrapper.querySelector('#dev-back').addEventListener('click', () => {
      navigate('#/learn');
    });
    
    return wrapper;
  }
  
  // Original menu flashcards (kept for backward compatibility)
  function viewLearnMenu() {
    const wrapper = document.createElement('div');
    wrapper.className = 'page learn-menu-page';
    
    wrapper.innerHTML = `
      <div class="learn-menu-header">
        <button id="btn-back-learn-menu" class="back-btn">←</button>
        <h1 class="learn-menu-title">Изучение блюд</h1>
        <div style="width: 40px;"></div>
      </div>
      <p class="learn-menu-subtitle">Выберите категорию меню для изучения</p>
      
      <div class="learn-menu-search">
        <span class="search-icon">🔍</span>
        <input type="text" id="menu-search-input" class="menu-search-input" placeholder="Поиск по меню..." />
      </div>
      
      <div id="learn-categories-grid" class="learn-categories-grid">
        <!-- Categories will be loaded here -->
      </div>
      
      <button id="check-all-menu-btn" class="check-all-menu-btn">Проверить всё меню</button>
      <a href="#" id="associations-link" class="associations-link">Ассоциации</a>
    `;
    
    // Load categories and render cards
    loadDb().then(({dishes}) => {
      const kitchenDishes = dishes.filter(d => d.source !== 'bar' && (!d.source || d.source === 'kitchen'));
      
      // Get unique categories
      const categoriesMap = new Map();
      kitchenDishes.forEach(dish => {
        const category = dish.category || 'Без категории';
        if (!categoriesMap.has(category)) {
          categoriesMap.set(category, []);
        }
        categoriesMap.get(category).push(dish);
      });
      
      // Get learning progress
      let learningProgress = {};
      try {
        learningProgress = JSON.parse(localStorage.getItem(STORAGE_KEYS.learningProgress) || '{}');
      } catch {}
      
      // Calculate progress for each category
      const categories = Array.from(categoriesMap.entries()).map(([categoryName, categoryDishes]) => {
        let studied = 0;
        categoryDishes.forEach(dish => {
          if (learningProgress[`menu_${dish.name}`]) studied++;
        });
        const progress = categoryDishes.length > 0 ? Math.round((studied / categoryDishes.length) * 100) : 0;
        
        // Get first dish with image for category image
        const dishWithImage = categoryDishes.find(d => d.image && d.image !== '-' && d.image !== './images/-.jpg');
        const imageUrl = dishWithImage?.image || categoryDishes[0]?.image || '';
        
        return {
          name: categoryName,
          progress,
          count: categoryDishes.length,
          image: imageUrl
        };
      });
      
      // Render category cards
      const grid = wrapper.querySelector('#learn-categories-grid');
      categories.forEach(category => {
        const card = document.createElement('div');
        card.className = 'learn-category-card';
        card.dataset.category = category.name;
        card.innerHTML = `
          <div class="category-card-image-wrapper">
            ${category.image && category.image !== '-' && category.image !== './images/-.jpg' 
              ? `<img src="${category.image}" alt="${category.name}" class="category-card-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />`
              : ''}
            <div class="category-card-placeholder" style="display: ${category.image && category.image !== '-' ? 'none' : 'flex'};">
              <span class="placeholder-icon">🍽️</span>
            </div>
            <div class="category-card-label">${category.name}</div>
          </div>
          <div class="category-card-name">${category.name}</div>
        `;
        grid.appendChild(card);
        
        card.addEventListener('click', () => {
          navigate(`#/learn/menu/category?cat=${encodeURIComponent(category.name)}`);
        });
      });
    }).catch(err => {
      console.error('Error loading categories:', err);
      wrapper.querySelector('#learn-categories-grid').innerHTML = '<p style="padding: 20px; text-align: center; color: var(--danger);">Ошибка загрузки категорий</p>';
    });
    
    // Search functionality
    const searchInput = wrapper.querySelector('#menu-search-input');
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      const cards = wrapper.querySelectorAll('.learn-category-card');
      cards.forEach(card => {
        const categoryName = card.dataset.category.toLowerCase();
        if (categoryName.includes(query) || query === '') {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    });
    
    // Back button
    wrapper.querySelector('#btn-back-learn-menu')?.addEventListener('click', () => navigate('#/learn'));
    
    // Check all menu button
    wrapper.querySelector('#check-all-menu-btn')?.addEventListener('click', () => {
      navigate('#/learn/menu/flashcards');
    });
    
    // Associations link
    wrapper.querySelector('#associations-link')?.addEventListener('click', (e) => {
      e.preventDefault();
      // TODO: Implement associations page
      alert('Страница ассоциаций в разработке');
    });
    
    return wrapper;
  }

  function viewLearnMenuFlashcards() {
    const wrapper = document.createElement('div');
    wrapper.className = 'page learn-flashcards-page';
    
    // Get category from URL
    const hash = location.hash || '';
    const urlParams = new URLSearchParams(hash.split('?')[1] || '');
    const categoryName = urlParams.get('cat') || '';
    const isAllMenu = hash.includes('/flashcards');
    
    let dishes = [];
    let currentIndex = 0;
    let isFlipped = false;
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let currentY = 0;
    let isDragging = false;
    
    wrapper.innerHTML = `
      <div class="flashcards-header">
        <button id="btn-back-flashcards" class="back-btn">←</button>
        <div class="flashcards-progress">
          <div class="flashcards-progress-bar">
            <div id="flashcards-progress-fill" class="flashcards-progress-fill"></div>
          </div>
        </div>
        <div style="width: 40px;"></div>
      </div>
      
      <div class="flashcards-container">
        <div id="flashcard" class="flashcard">
          <div class="flashcard-inner">
            <div class="flashcard-front">
              <div class="flashcard-image-wrapper">
                <div class="flashcard-image-placeholder"></div>
                <img id="flashcard-image" class="flashcard-image" style="display: none;" />
              </div>
              <div class="flashcard-content">
                <div class="flashcard-name"></div>
                <div class="flashcard-category-tag"></div>
              </div>
              <button id="flip-btn" class="flip-btn">
                <span class="flip-icon">↻</span>
                <span>Перевернуть</span>
              </button>
            </div>
            <div class="flashcard-back">
              <div class="flashcard-back-content">
                <div class="flashcard-back-title">Состав / Ингредиенты</div>
                <div id="flashcard-composition" class="flashcard-composition"></div>
                <div class="flashcard-back-title" style="margin-top: 20px;">Аллергены</div>
                <div id="flashcard-allergens" class="flashcard-allergens"></div>
              </div>
              <button id="flip-back-btn" class="flip-btn">
                <span class="flip-icon">↻</span>
                <span>Перевернуть</span>
              </button>
            </div>
          </div>
        </div>
        
        <div class="flashcards-hint">
          <span>Свайп вправо → ЗНАЮ</span>
          <span>Свайп влево ← НЕ ЗНАЮ</span>
        </div>
      </div>
      
      <div class="flashcards-actions">
        <button id="know-btn" class="action-btn know-btn">✅ ЗНАЮ</button>
        <button id="dont-know-btn" class="action-btn dont-know-btn">❌ НЕ ЗНАЮ</button>
      </div>
    `;
    
    const flashcard = wrapper.querySelector('#flashcard');
    const flashcardInner = flashcard.querySelector('.flashcard-inner');
    const flipBtn = wrapper.querySelector('#flip-btn');
    const flipBackBtn = wrapper.querySelector('#flip-back-btn');
    const knowBtn = wrapper.querySelector('#know-btn');
    const dontKnowBtn = wrapper.querySelector('#dont-know-btn');
    const progressFill = wrapper.querySelector('#flashcards-progress-fill');
    
    // Load dishes
    loadDb().then(({dishes: allDishes}) => {
      if (isAllMenu) {
        dishes = allDishes.filter(d => d.source !== 'bar' && (!d.source || d.source === 'kitchen'));
      } else if (categoryName) {
        dishes = allDishes.filter(d => 
          d.source !== 'bar' && 
          (!d.source || d.source === 'kitchen') &&
          d.category === decodeURIComponent(categoryName)
        );
      }
      
      if (dishes.length === 0) {
        wrapper.innerHTML = `
          <div style="padding: 40px; text-align: center; color: #ffffff;">
            <p>Блюда не найдены</p>
            <button id="btn-back-flashcards" class="back-btn" style="margin-top: 20px;">← Назад</button>
          </div>
        `;
        wrapper.querySelector('#btn-back-flashcards')?.addEventListener('click', () => navigate('#/learn/menu'));
        return;
      }
      
      // Shuffle dishes
      function shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
      }
      dishes = shuffle(dishes);
      
      renderCard();
    });
    
    function renderCard() {
      if (currentIndex >= dishes.length) {
        wrapper.innerHTML = `
          <div style="padding: 40px; text-align: center; color: #ffffff;">
            <h2>🎉 Готово!</h2>
            <p>Вы изучили все блюда (${dishes.length})</p>
            <button id="btn-back-flashcards" class="back-btn" style="margin-top: 20px;">← Назад</button>
          </div>
        `;
        wrapper.querySelector('#btn-back-flashcards')?.addEventListener('click', () => navigate('#/learn/menu'));
        return;
      }
      
      const dish = dishes[currentIndex];
      isFlipped = false;
      flashcardInner.style.transform = 'rotateY(0deg)';
      
      // Update progress
      const progress = ((currentIndex) / dishes.length) * 100;
      progressFill.style.width = `${progress}%`;
      
      // Front side
      const nameEl = wrapper.querySelector('.flashcard-name');
      const categoryTagEl = wrapper.querySelector('.flashcard-category-tag');
      const imageEl = wrapper.querySelector('#flashcard-image');
      const placeholderEl = wrapper.querySelector('.flashcard-image-placeholder');
      
      nameEl.textContent = dish.name || 'Без названия';
      categoryTagEl.textContent = dish.category || 'Без категории';
      
      if (dish.image && dish.image !== '-' && dish.image !== './images/-.jpg') {
        imageEl.src = dish.image;
        imageEl.style.display = 'block';
        placeholderEl.style.display = 'none';
        imageEl.onerror = () => {
          imageEl.style.display = 'none';
          placeholderEl.style.display = 'flex';
        };
      } else {
        imageEl.style.display = 'none';
        placeholderEl.style.display = 'flex';
      }
      
      // Back side
      const compositionEl = wrapper.querySelector('#flashcard-composition');
      const allergensEl = wrapper.querySelector('#flashcard-allergens');
      
      if (dish.composition && Array.isArray(dish.composition) && dish.composition.length && dish.composition[0] !== '-') {
        compositionEl.textContent = dish.composition.join(', ');
      } else {
        compositionEl.textContent = 'Не указано';
      }
      
      if (dish.allergens && Array.isArray(dish.allergens) && dish.allergens.length && dish.allergens[0] !== '-') {
        allergensEl.textContent = dish.allergens.join(', ');
      } else {
        allergensEl.textContent = 'Не указано';
      }
    }
    
    function flipCard() {
      isFlipped = !isFlipped;
      flashcardInner.style.transform = isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)';
    }
    
    function markAsKnown() {
      const dish = dishes[currentIndex];
      let learningProgress = {};
      try {
        learningProgress = JSON.parse(localStorage.getItem(STORAGE_KEYS.learningProgress) || '{}');
      } catch {}
      learningProgress[`menu_${dish.name}`] = { known: true, timestamp: Date.now() };
      localStorage.setItem(STORAGE_KEYS.learningProgress, JSON.stringify(learningProgress));
      
      currentIndex++;
      renderCard();
    }
    
    function markAsUnknown() {
      const dish = dishes[currentIndex];
      let learningProgress = {};
      try {
        learningProgress = JSON.parse(localStorage.getItem(STORAGE_KEYS.learningProgress) || '{}');
      } catch {}
      learningProgress[`menu_${dish.name}`] = { known: false, timestamp: Date.now() };
      localStorage.setItem(STORAGE_KEYS.learningProgress, JSON.stringify(learningProgress));
      
      currentIndex++;
      renderCard();
    }
    
    // Touch/swipe handlers
    flashcard.addEventListener('touchstart', (e) => {
      if (isFlipped) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isDragging = true;
      currentX = 0;
      currentY = 0;
    });
    
    flashcard.addEventListener('touchmove', (e) => {
      if (!isDragging || isFlipped) return;
      currentX = e.touches[0].clientX - startX;
      currentY = e.touches[0].clientY - startY;
      
      const rotate = currentX * 0.1;
      const opacity = 1 - Math.abs(currentX) / 200;
      
      flashcard.style.transform = `translateX(${currentX}px) rotateZ(${rotate}deg)`;
      flashcard.style.opacity = Math.max(0.3, opacity);
    });
    
    flashcard.addEventListener('touchend', (e) => {
      if (!isDragging || isFlipped) return;
      isDragging = false;
      
      const threshold = 100;
      if (Math.abs(currentX) > threshold) {
        if (currentX > 0) {
          // Swipe right - KNOW
          flashcard.style.transform = 'translateX(500px) rotateZ(30deg)';
          flashcard.style.opacity = '0';
          setTimeout(() => {
            markAsKnown();
            flashcard.style.transform = '';
            flashcard.style.opacity = '1';
          }, 300);
        } else {
          // Swipe left - DON'T KNOW
          flashcard.style.transform = 'translateX(-500px) rotateZ(-30deg)';
          flashcard.style.opacity = '0';
          setTimeout(() => {
            markAsUnknown();
            flashcard.style.transform = '';
            flashcard.style.opacity = '1';
          }, 300);
        }
      } else {
        // Return to original position
        flashcard.style.transform = '';
        flashcard.style.opacity = '1';
      }
    });
    
    // Mouse drag handlers (for desktop testing)
    flashcard.addEventListener('mousedown', (e) => {
      if (isFlipped) return;
      startX = e.clientX;
      startY = e.clientY;
      isDragging = true;
      currentX = 0;
      currentY = 0;
      flashcard.style.cursor = 'grabbing';
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!isDragging || isFlipped) return;
      currentX = e.clientX - startX;
      currentY = e.clientY - startY;
      
      const rotate = currentX * 0.1;
      const opacity = 1 - Math.abs(currentX) / 200;
      
      flashcard.style.transform = `translateX(${currentX}px) rotateZ(${rotate}deg)`;
      flashcard.style.opacity = Math.max(0.3, opacity);
    });
    
    document.addEventListener('mouseup', () => {
      if (!isDragging || isFlipped) return;
      isDragging = false;
      flashcard.style.cursor = '';
      
      const threshold = 100;
      if (Math.abs(currentX) > threshold) {
        if (currentX > 0) {
          flashcard.style.transform = 'translateX(500px) rotateZ(30deg)';
          flashcard.style.opacity = '0';
          setTimeout(() => {
            markAsKnown();
            flashcard.style.transform = '';
            flashcard.style.opacity = '1';
          }, 300);
        } else {
          flashcard.style.transform = 'translateX(-500px) rotateZ(-30deg)';
          flashcard.style.opacity = '0';
          setTimeout(() => {
            markAsUnknown();
            flashcard.style.transform = '';
            flashcard.style.opacity = '1';
          }, 300);
        }
      } else {
        flashcard.style.transform = '';
        flashcard.style.opacity = '1';
      }
    });
    
    flipBtn.addEventListener('click', flipCard);
    flipBackBtn.addEventListener('click', flipCard);
    knowBtn.addEventListener('click', markAsKnown);
    dontKnowBtn.addEventListener('click', markAsUnknown);
    
    wrapper.querySelector('#btn-back-flashcards')?.addEventListener('click', () => navigate('#/learn/menu'));
    
    return wrapper;
  }

  // Bar drinks learning page (similar to menu learning)
  function viewLearnBar() {
    const wrapper = document.createElement('div');
    wrapper.className = 'page learn-menu-page';
    
    wrapper.innerHTML = `
      <div class="learn-menu-header">
        <button id="btn-back-learn-bar" class="back-btn">←</button>
        <h1 class="learn-menu-title">Изучение бара</h1>
        <div style="width: 40px;"></div>
      </div>
      <p class="learn-menu-subtitle">Выберите категорию напитков для изучения</p>
      
      <div class="learn-menu-search">
        <span class="search-icon">🔍</span>
        <input type="text" id="bar-search-input" class="menu-search-input" placeholder="Поиск по барному меню..." />
      </div>
      
      <div id="learn-bar-categories-grid" class="learn-categories-grid">
        <!-- Categories will be loaded here -->
      </div>
      
      <button id="check-all-bar-btn" class="check-all-menu-btn">Проверить весь бар</button>
    `;
    
    // Load categories and render cards
    loadDb().then(({dishes}) => {
      const barDrinks = dishes.filter(d => d.source === 'bar');
      
      // Get unique categories
      const categoriesMap = new Map();
      barDrinks.forEach(drink => {
        const category = drink.category || 'Без категории';
        if (!categoriesMap.has(category)) {
          categoriesMap.set(category, []);
        }
        categoriesMap.get(category).push(drink);
      });
      
      // Get learning progress
      let learningProgress = {};
      try {
        learningProgress = JSON.parse(localStorage.getItem(STORAGE_KEYS.learningProgress) || '{}');
      } catch {}
      
      // Calculate progress for each category
      const categories = Array.from(categoriesMap.entries()).map(([categoryName, categoryDrinks]) => {
        let studied = 0;
        categoryDrinks.forEach(drink => {
          if (learningProgress[`bar_${drink.name}`]) studied++;
        });
        const progress = categoryDrinks.length > 0 ? Math.round((studied / categoryDrinks.length) * 100) : 0;
        
        // Get first drink with image for category image
        const drinkWithImage = categoryDrinks.find(d => d.image && d.image !== '-' && d.image !== './images/-.jpg');
        const imageUrl = drinkWithImage?.image || categoryDrinks[0]?.image || '';
        
        return {
          name: categoryName,
          progress,
          count: categoryDrinks.length,
          image: imageUrl
        };
      });
      
      // Render category cards
      const grid = wrapper.querySelector('#learn-bar-categories-grid');
      categories.forEach(category => {
        const card = document.createElement('div');
        card.className = 'learn-category-card';
        card.dataset.category = category.name;
        card.innerHTML = `
          <div class="category-card-image-wrapper">
            ${category.image && category.image !== '-' && category.image !== './images/-.jpg' 
              ? `<img src="${category.image}" alt="${category.name}" class="category-card-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />`
              : ''}
            <div class="category-card-placeholder" style="display: ${category.image && category.image !== '-' ? 'none' : 'flex'};">
              <span class="placeholder-icon">🍷</span>
            </div>
            <div class="category-card-label">${category.name}</div>
          </div>
          <div class="category-card-name">${category.name}</div>
        `;
        grid.appendChild(card);
        
        card.addEventListener('click', () => {
          navigate(`#/learn/bar/category?cat=${encodeURIComponent(category.name)}`);
        });
      });
    }).catch(err => {
      console.error('Error loading bar categories:', err);
      wrapper.querySelector('#learn-bar-categories-grid').innerHTML = '<p style="padding: 20px; text-align: center; color: var(--danger);">Ошибка загрузки категорий</p>';
    });
    
    // Search functionality
    const searchInput = wrapper.querySelector('#bar-search-input');
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      const cards = wrapper.querySelectorAll('.learn-category-card');
      cards.forEach(card => {
        const categoryName = card.dataset.category.toLowerCase();
        if (categoryName.includes(query) || query === '') {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    });
    
    // Back button
    wrapper.querySelector('#btn-back-learn-bar')?.addEventListener('click', () => navigate('#/learn'));
    
    // Check all bar button
    wrapper.querySelector('#check-all-bar-btn')?.addEventListener('click', () => {
      navigate('#/learn/bar/flashcards');
    });
    
    return wrapper;
  }

  function viewLearnBarFlashcards() {
    const wrapper = document.createElement('div');
    wrapper.className = 'page learn-flashcards-page';
    
    // Get category from URL
    const hash = location.hash || '';
    const urlParams = new URLSearchParams(hash.split('?')[1] || '');
    const categoryName = urlParams.get('cat') || '';
    const isAllBar = hash.includes('/flashcards');
    
    let drinks = [];
    let currentIndex = 0;
    let isFlipped = false;
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let currentY = 0;
    let isDragging = false;
    
    wrapper.innerHTML = `
      <div class="flashcards-header">
        <button id="btn-back-bar-flashcards" class="back-btn">←</button>
        <div class="flashcards-progress">
          <div class="flashcards-progress-bar">
            <div id="flashcards-progress-fill" class="flashcards-progress-fill"></div>
          </div>
        </div>
        <div style="width: 40px;"></div>
      </div>
      
      <div class="flashcards-container">
        <div id="flashcard" class="flashcard">
          <div class="flashcard-inner">
            <div class="flashcard-front">
              <div class="flashcard-image-wrapper">
                <div class="flashcard-image-placeholder"></div>
                <img id="flashcard-image" class="flashcard-image" style="display: none;" />
              </div>
              <div class="flashcard-content">
                <div class="flashcard-name"></div>
                <div class="flashcard-category-tag"></div>
              </div>
              <button id="flip-btn" class="flip-btn">
                <span class="flip-icon">↻</span>
                <span>Перевернуть</span>
              </button>
            </div>
            <div class="flashcard-back">
              <div class="flashcard-back-content">
                <div class="flashcard-back-title">Состав / Ингредиенты</div>
                <div id="flashcard-composition" class="flashcard-composition"></div>
                <div class="flashcard-back-title" style="margin-top: 20px;">Аллергены</div>
                <div id="flashcard-allergens" class="flashcard-allergens"></div>
              </div>
              <button id="flip-back-btn" class="flip-btn">
                <span class="flip-icon">↻</span>
                <span>Перевернуть</span>
              </button>
            </div>
          </div>
        </div>
        
        <div class="flashcards-hint">
          <span>Свайп вправо → ЗНАЮ</span>
          <span>Свайп влево ← НЕ ЗНАЮ</span>
        </div>
      </div>
      
      <div class="flashcards-actions">
        <button id="know-btn" class="action-btn know-btn">✅ ЗНАЮ</button>
        <button id="dont-know-btn" class="action-btn dont-know-btn">❌ НЕ ЗНАЮ</button>
      </div>
    `;
    
    const flashcard = wrapper.querySelector('#flashcard');
    const flashcardInner = flashcard.querySelector('.flashcard-inner');
    const flipBtn = wrapper.querySelector('#flip-btn');
    const flipBackBtn = wrapper.querySelector('#flip-back-btn');
    const knowBtn = wrapper.querySelector('#know-btn');
    const dontKnowBtn = wrapper.querySelector('#dont-know-btn');
    const progressFill = wrapper.querySelector('#flashcards-progress-fill');
    
    // Load drinks
    loadDb().then(({dishes: allDishes}) => {
      if (isAllBar) {
        drinks = allDishes.filter(d => d.source === 'bar');
      } else if (categoryName) {
        drinks = allDishes.filter(d => 
          d.source === 'bar' &&
          d.category === decodeURIComponent(categoryName)
        );
      }
      
      if (drinks.length === 0) {
        wrapper.innerHTML = `
          <div style="padding: 40px; text-align: center; color: #ffffff;">
            <p>Напитки не найдены</p>
            <button id="btn-back-bar-flashcards" class="back-btn" style="margin-top: 20px;">← Назад</button>
          </div>
        `;
        wrapper.querySelector('#btn-back-bar-flashcards')?.addEventListener('click', () => navigate('#/learn/bar'));
        return;
      }
      
      // Shuffle drinks
      function shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
      }
      drinks = shuffle(drinks);
      
      renderCard();
    });
    
    function renderCard() {
      if (currentIndex >= drinks.length) {
        wrapper.innerHTML = `
          <div style="padding: 40px; text-align: center; color: #ffffff;">
            <h2>🎉 Готово!</h2>
            <p>Вы изучили все напитки (${drinks.length})</p>
            <button id="btn-back-bar-flashcards" class="back-btn" style="margin-top: 20px;">← Назад</button>
          </div>
        `;
        wrapper.querySelector('#btn-back-bar-flashcards')?.addEventListener('click', () => navigate('#/learn/bar'));
        return;
      }
      
      const drink = drinks[currentIndex];
      isFlipped = false;
      flashcardInner.style.transform = 'rotateY(0deg)';
      
      // Update progress
      const progress = ((currentIndex) / drinks.length) * 100;
      progressFill.style.width = `${progress}%`;
      
      // Front side
      const nameEl = wrapper.querySelector('.flashcard-name');
      const categoryTagEl = wrapper.querySelector('.flashcard-category-tag');
      const imageEl = wrapper.querySelector('#flashcard-image');
      const placeholderEl = wrapper.querySelector('.flashcard-image-placeholder');
      
      nameEl.textContent = drink.name || 'Без названия';
      categoryTagEl.textContent = drink.category || 'Без категории';
      
      if (drink.image && drink.image !== '-' && drink.image !== './images/-.jpg') {
        imageEl.src = drink.image;
        imageEl.style.display = 'block';
        placeholderEl.style.display = 'none';
        imageEl.onerror = () => {
          imageEl.style.display = 'none';
          placeholderEl.style.display = 'flex';
        };
      } else {
        imageEl.style.display = 'none';
        placeholderEl.style.display = 'flex';
      }
      
      // Back side
      const compositionEl = wrapper.querySelector('#flashcard-composition');
      const allergensEl = wrapper.querySelector('#flashcard-allergens');
      
      if (drink.composition && Array.isArray(drink.composition) && drink.composition.length && drink.composition[0] !== '-') {
        compositionEl.textContent = drink.composition.join(', ');
      } else {
        compositionEl.textContent = 'Не указано';
      }
      
      if (drink.allergens && Array.isArray(drink.allergens) && drink.allergens.length && drink.allergens[0] !== '-') {
        allergensEl.textContent = drink.allergens.join(', ');
      } else {
        allergensEl.textContent = 'Не указано';
      }
    }
    
    function flipCard() {
      isFlipped = !isFlipped;
      flashcardInner.style.transform = isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)';
    }
    
    function markAsKnown() {
      const drink = drinks[currentIndex];
      let learningProgress = {};
      try {
        learningProgress = JSON.parse(localStorage.getItem(STORAGE_KEYS.learningProgress) || '{}');
      } catch {}
      learningProgress[`bar_${drink.name}`] = { known: true, timestamp: Date.now() };
      localStorage.setItem(STORAGE_KEYS.learningProgress, JSON.stringify(learningProgress));
      
      currentIndex++;
      renderCard();
    }
    
    function markAsUnknown() {
      const drink = drinks[currentIndex];
      let learningProgress = {};
      try {
        learningProgress = JSON.parse(localStorage.getItem(STORAGE_KEYS.learningProgress) || '{}');
      } catch {}
      learningProgress[`bar_${drink.name}`] = { known: false, timestamp: Date.now() };
      localStorage.setItem(STORAGE_KEYS.learningProgress, JSON.stringify(learningProgress));
      
      currentIndex++;
      renderCard();
    }
    
    // Touch/swipe handlers
    flashcard.addEventListener('touchstart', (e) => {
      if (isFlipped) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isDragging = true;
      currentX = 0;
      currentY = 0;
    });
    
    flashcard.addEventListener('touchmove', (e) => {
      if (!isDragging || isFlipped) return;
      currentX = e.touches[0].clientX - startX;
      currentY = e.touches[0].clientY - startY;
      
      const rotate = currentX * 0.1;
      const opacity = 1 - Math.abs(currentX) / 200;
      
      flashcard.style.transform = `translateX(${currentX}px) rotateZ(${rotate}deg)`;
      flashcard.style.opacity = Math.max(0.3, opacity);
    });
    
    flashcard.addEventListener('touchend', (e) => {
      if (!isDragging || isFlipped) return;
      isDragging = false;
      
      const threshold = 100;
      if (Math.abs(currentX) > threshold) {
        if (currentX > 0) {
          // Swipe right - KNOW
          flashcard.style.transform = 'translateX(500px) rotateZ(30deg)';
          flashcard.style.opacity = '0';
          setTimeout(() => {
            markAsKnown();
            flashcard.style.transform = '';
            flashcard.style.opacity = '1';
          }, 300);
        } else {
          // Swipe left - DON'T KNOW
          flashcard.style.transform = 'translateX(-500px) rotateZ(-30deg)';
          flashcard.style.opacity = '0';
          setTimeout(() => {
            markAsUnknown();
            flashcard.style.transform = '';
            flashcard.style.opacity = '1';
          }, 300);
        }
      } else {
        // Return to original position
        flashcard.style.transform = '';
        flashcard.style.opacity = '1';
      }
    });
    
    // Mouse drag handlers (for desktop testing)
    flashcard.addEventListener('mousedown', (e) => {
      if (isFlipped) return;
      startX = e.clientX;
      startY = e.clientY;
      isDragging = true;
      currentX = 0;
      currentY = 0;
      flashcard.style.cursor = 'grabbing';
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!isDragging || isFlipped) return;
      currentX = e.clientX - startX;
      currentY = e.clientY - startY;
      
      const rotate = currentX * 0.1;
      const opacity = 1 - Math.abs(currentX) / 200;
      
      flashcard.style.transform = `translateX(${currentX}px) rotateZ(${rotate}deg)`;
      flashcard.style.opacity = Math.max(0.3, opacity);
    });
    
    document.addEventListener('mouseup', () => {
      if (!isDragging || isFlipped) return;
      isDragging = false;
      flashcard.style.cursor = '';
      
      const threshold = 100;
      if (Math.abs(currentX) > threshold) {
        if (currentX > 0) {
          flashcard.style.transform = 'translateX(500px) rotateZ(30deg)';
          flashcard.style.opacity = '0';
          setTimeout(() => {
            markAsKnown();
            flashcard.style.transform = '';
            flashcard.style.opacity = '1';
          }, 300);
        } else {
          flashcard.style.transform = 'translateX(-500px) rotateZ(-30deg)';
          flashcard.style.opacity = '0';
          setTimeout(() => {
            markAsUnknown();
            flashcard.style.transform = '';
            flashcard.style.opacity = '1';
          }, 300);
        }
      } else {
        flashcard.style.transform = '';
        flashcard.style.opacity = '1';
      }
    });
    
    flipBtn.addEventListener('click', flipCard);
    flipBackBtn.addEventListener('click', flipCard);
    knowBtn.addEventListener('click', markAsKnown);
    dontKnowBtn.addEventListener('click', markAsUnknown);
    
    wrapper.querySelector('#btn-back-bar-flashcards')?.addEventListener('click', () => navigate('#/learn/bar'));
    
    return wrapper;
  }

  function viewLearnTheory() {
    const wrapper = document.createElement('div');
    wrapper.className = 'page';
    
    if (!window.TRAINING_DATA || !window.TRAINING_DATA.sections) {
      wrapper.innerHTML = `
        <div class="panel">
          <div class="panel-header">
            <div class="page-title"><h2>Теория для 2 грейда</h2></div>
            <button id="btn-back-learn" class="btn">Назад</button>
          </div>
          <div style="padding:16px; text-align:center; color:var(--danger);">
            <p>Ошибка: Данные обучения не загружены.</p>
            <p style="font-size:14px; margin-top:8px;">Пожалуйста, обновите страницу.</p>
          </div>
        </div>
      `;
      wrapper.querySelector('#btn-back-learn')?.addEventListener('click', () => navigate('#/learn'));
      return wrapper;
    }
    
    wrapper.innerHTML = `
      <div class="panel">
        <div class="panel-header">
          <div class="page-title"><h2>Теория для 2 грейда</h2></div>
          <button id="btn-back-learn" class="btn">Назад</button>
        </div>
        
        <div class="learn-theory-modes">
          <button class="theory-mode-card" data-section="meat" data-mode="reference">
            <div class="theory-icon">🥩</div>
            <div class="theory-title">Мясо</div>
            <div class="theory-actions">
              <button class="btn secondary small">Справочник</button>
              <button class="btn secondary small">Флешкарты</button>
              <button class="btn secondary small">Тесты</button>
            </div>
          </button>
          
          <button class="theory-mode-card" data-section="bar" data-mode="reference">
            <div class="theory-icon">🍸</div>
            <div class="theory-title">Барное меню</div>
            <div class="theory-actions">
              <button class="btn secondary small">Справочник</button>
              <button class="btn secondary small">Флешкарты</button>
              <button class="btn secondary small">Тесты</button>
            </div>
          </button>
          
          <button class="theory-mode-card" data-section="competencies" data-mode="reference">
            <div class="theory-icon">⭐</div>
            <div class="theory-title">Компетенции</div>
            <div class="theory-actions">
              <button class="btn secondary small">Справочник</button>
              <button class="btn secondary small">Флешкарты</button>
              <button class="btn secondary small">Тесты</button>
            </div>
          </button>
        </div>
      </div>
    `;
    
    wrapper.querySelector('#btn-back-learn')?.addEventListener('click', () => navigate('#/learn'));
    
    wrapper.querySelectorAll('.theory-mode-card').forEach(card => {
      const section = card.dataset.section;
      const buttons = card.querySelectorAll('.theory-actions button');
      
      if (!section || buttons.length < 3) {
        console.warn('Invalid theory card setup:', section);
        return;
      }
      
      buttons[0]?.addEventListener('click', (e) => { 
        e.stopPropagation(); 
        e.preventDefault();
        navigate(`#/learn/reference/${section}`); 
      });
      buttons[1]?.addEventListener('click', (e) => { 
        e.stopPropagation(); 
        e.preventDefault();
        navigate(`#/learn/flashcards/${section}`); 
      });
      buttons[2]?.addEventListener('click', (e) => { 
        e.stopPropagation(); 
        e.preventDefault();
        navigate(`#/learn/tests/${section}`); 
      });
    });
    
    return wrapper;
  }
  
  function viewServiceSteps() {
    const wrapper = document.createElement('div');
    wrapper.className = 'page';
    
    if (!window.TRAINING_DATA) {
      wrapper.innerHTML = '<div class="panel"><div class="panel-header"><h2>Ошибка</h2></div><p style="padding:16px;">Данные не загружены</p></div>';
      return wrapper;
    }
    
    const steps = window.TRAINING_DATA.serviceSteps || [];
    
    wrapper.innerHTML = `
      <div class="panel">
        <div class="panel-header">
          <div class="page-title"><h2>6 шагов сервиса</h2></div>
          <button id="btn-back-learn" class="btn">Назад</button>
        </div>
        
        <div class="service-steps-list">
          ${steps.map(step => `
            <div class="service-step-card">
              <h3>${step.title}</h3>
              <p>${step.content}</p>
            </div>
          `).join('')}
        </div>
        
        <div style="padding:16px;">
          <button id="start-steps-flashcards" class="btn primary" style="width:100%;">Тренировать флешкартами</button>
        </div>
      </div>
    `;
    
    wrapper.querySelector('#btn-back-learn')?.addEventListener('click', () => navigate('#/learn'));
    wrapper.querySelector('#start-steps-flashcards')?.addEventListener('click', () => navigate('#/learn/flashcards/steps'));
    
    return wrapper;
  }
  
  function viewReference() {
    const wrapper = document.createElement('div');
    wrapper.className = 'page';
    
    const sectionId = (location.hash || '').split('/').pop();
    if (!window.TRAINING_DATA || !window.TRAINING_DATA.sections) {
      wrapper.innerHTML = `
        <div class="panel">
          <div class="panel-header">
            <h2>Ошибка</h2>
            <button id="btn-back-theory" class="btn">Назад</button>
          </div>
          <p style="padding:16px;">Данные обучения не загружены. Пожалуйста, обновите страницу.</p>
        </div>
      `;
      wrapper.querySelector('#btn-back-theory')?.addEventListener('click', () => navigate('#/learn/theory'));
      return wrapper;
    }
    
    const section = window.TRAINING_DATA.sections.find(s => s.id === sectionId);
    if (!section) {
      wrapper.innerHTML = `
        <div class="panel">
          <div class="panel-header">
            <h2>Ошибка</h2>
            <button id="btn-back-theory" class="btn">Назад</button>
          </div>
          <p style="padding:16px;">Раздел "${sectionId}" не найден. Доступные разделы: ${window.TRAINING_DATA.sections.map(s => s.id).join(', ')}</p>
        </div>
      `;
      wrapper.querySelector('#btn-back-theory')?.addEventListener('click', () => navigate('#/learn/theory'));
      return wrapper;
    }
    
    wrapper.innerHTML = `
      <div class="panel">
        <div class="panel-header">
          <div class="page-title"><h2>${section.title}</h2></div>
          <button id="btn-back-theory" class="btn">Назад</button>
        </div>
        
        <div class="reference-search" style="padding:12px;">
          <input id="reference-search-input" class="filter-input" placeholder="Поиск по темам..." />
        </div>
        
        <div class="reference-topics" id="reference-topics">
          ${section.topics.map((topic, idx) => {
            const isRead = learningProgress[section.id]?.[topic.id] || false;
            return `
              <div class="reference-topic" data-topic-id="${topic.id}">
                <div class="topic-header">
                  <h3>${topic.title}</h3>
                  <label class="topic-checkbox">
                    <input type="checkbox" ${isRead ? 'checked' : ''} data-section="${section.id}" data-topic="${topic.id}" />
                    <span>Изучено</span>
                  </label>
                </div>
                <div class="topic-content">${topic.content}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
    
    wrapper.querySelector('#btn-back-theory')?.addEventListener('click', () => navigate('#/learn/theory'));
    
    // Search functionality
    const searchInput = wrapper.querySelector('#reference-search-input');
    searchInput?.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      wrapper.querySelectorAll('.reference-topic').forEach(topic => {
        const text = topic.textContent.toLowerCase();
        topic.style.display = text.includes(query) ? '' : 'none';
      });
    });
    
    // Checkbox handlers
    wrapper.querySelectorAll('.topic-checkbox input').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const sectionId = e.target.dataset.section;
        const topicId = e.target.dataset.topic;
        if (!learningProgress[sectionId]) learningProgress[sectionId] = {};
        learningProgress[sectionId][topicId] = e.target.checked;
        saveLearningProgress();
        
        if (e.target.checked) {
          const result = addXP(15);
          if (result.leveledUp) {
            alert(`Поздравляю! Вы достигли уровня ${result.newLevel}!`);
          }
        }
      });
    });
    
    return wrapper;
  }
  
  function viewFlashcards() {
    const wrapper = document.createElement('div');
    wrapper.className = 'page';
    
    const sectionId = (location.hash || '').split('/').pop();
    if (!window.TRAINING_DATA || !window.TRAINING_DATA.sections) {
      wrapper.innerHTML = `
        <div class="panel">
          <div class="panel-header">
            <h2>Ошибка</h2>
            <button id="btn-back-theory" class="btn">Назад</button>
          </div>
          <p style="padding:16px;">Данные обучения не загружены. Пожалуйста, обновите страницу.</p>
        </div>
      `;
      wrapper.querySelector('#btn-back-theory')?.addEventListener('click', () => navigate('#/learn/theory'));
      return wrapper;
    }
    
    let flashcards = [];
    let sectionTitle = '';
    
    if (sectionId === 'steps') {
      sectionTitle = '6 шагов сервиса';
      flashcards = (window.TRAINING_DATA.serviceSteps || []).map(s => s.flashcard).filter(Boolean);
    } else {
      const section = window.TRAINING_DATA.sections.find(s => s.id === sectionId);
      if (!section) {
        wrapper.innerHTML = `
          <div class="panel">
            <div class="panel-header">
              <h2>Ошибка</h2>
              <button id="btn-back-theory" class="btn">Назад</button>
            </div>
            <p style="padding:16px;">Раздел "${sectionId}" не найден. Доступные разделы: ${window.TRAINING_DATA.sections.map(s => s.id).join(', ')}</p>
          </div>
        `;
        wrapper.querySelector('#btn-back-theory')?.addEventListener('click', () => navigate('#/learn/theory'));
        return wrapper;
      }
      sectionTitle = section.title;
      flashcards = section.flashcards || [];
    }
    
    let currentIndex = 0;
    let userAnswer = '';
    let isAnswered = false;
    let stats = { correct: 0, wrong: 0 };
    
    function shuffle(arr){ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]];} return arr; }
    flashcards = shuffle([...flashcards]);
    
    wrapper.innerHTML = `
      <div class="panel">
        <div class="panel-header">
          <div class="page-title"><h2>${sectionTitle}</h2></div>
          <button id="btn-back-theory" class="btn">Назад</button>
        </div>
        
        <div class="flashcard-progress" style="padding:12px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span id="card-counter">Карточка 1 / ${flashcards.length}</span>
            <span id="card-stats">✅ 0 | ❌ 0</span>
          </div>
        </div>
        
        <div class="flashcard-container" id="flashcard-container">
          <div class="flashcard-question" id="question-text"></div>
          <div class="flashcard-input-area" id="input-area">
            <textarea id="user-answer" placeholder="Введите ваш ответ..." rows="3"></textarea>
            <button id="check-answer-btn" class="btn primary">Проверить</button>
          </div>
          <div class="flashcard-result" id="result-area" style="display:none;">
            <div class="result-message" id="result-message"></div>
            <div class="correct-answer" id="correct-answer"></div>
            <div class="flashcard-actions">
              <button id="next-card-btn" class="btn primary">Следующая карточка</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    const questionEl = wrapper.querySelector('#question-text');
    const answerInput = wrapper.querySelector('#user-answer');
    const inputArea = wrapper.querySelector('#input-area');
    const resultArea = wrapper.querySelector('#result-area');
    const resultMessage = wrapper.querySelector('#result-message');
    const correctAnswerEl = wrapper.querySelector('#correct-answer');
    const checkBtn = wrapper.querySelector('#check-answer-btn');
    const nextBtn = wrapper.querySelector('#next-card-btn');
    const counterEl = wrapper.querySelector('#card-counter');
    const statsEl = wrapper.querySelector('#card-stats');
    
    function renderCard() {
      if (currentIndex >= flashcards.length) {
        wrapper.querySelector('#flashcard-container').innerHTML = `
          <div style="text-align:center; padding:40px;">
            <h2>🎉 Готово!</h2>
            <p>Правильных ответов: ${stats.correct} из ${flashcards.length}</p>
            <p>Процент: ${Math.round((stats.correct / flashcards.length) * 100)}%</p>
            <button id="restart-btn" class="btn primary">Начать заново</button>
          </div>
        `;
        wrapper.querySelector('#restart-btn')?.addEventListener('click', () => {
          currentIndex = 0;
          stats = { correct: 0, wrong: 0 };
          flashcards = shuffle([...flashcards]);
          renderCard();
        });
        return;
      }
      
      const card = flashcards[currentIndex];
      questionEl.textContent = card.question;
      answerInput.value = '';
      inputArea.style.display = '';
      resultArea.style.display = 'none';
      isAnswered = false;
      
      counterEl.textContent = `Карточка ${currentIndex + 1} / ${flashcards.length}`;
      statsEl.textContent = `✅ ${stats.correct} | ❌ ${stats.wrong}`;
    }
    
    function checkAnswer() {
      if (isAnswered) return;
      isAnswered = true;
      
      const card = flashcards[currentIndex];
      userAnswer = answerInput.value.trim();
      const normalizedUser = userAnswer.toLowerCase().replace(/\s+/g, ' ');
      const normalizedCorrect = card.answer.toLowerCase().replace(/\s+/g, ' ');
      
      let isCorrect = false;
      
      // Check if contains key words
      if (card.keywords && card.keywords.length) {
        const foundKeywords = card.keywords.filter(kw => normalizedUser.includes(kw.toLowerCase()));
        isCorrect = foundKeywords.length >= Math.min(2, card.keywords.length);
      } else {
        // Exact or partial match
        isCorrect = normalizedUser === normalizedCorrect || normalizedUser.includes(normalizedCorrect) || normalizedCorrect.includes(normalizedUser);
      }
      
      if (isCorrect) {
        stats.correct++;
        resultMessage.innerHTML = '<div style="color:#22c55e; font-size:20px; font-weight:600;">✅ Правильно!</div>';
        addXP(10);
      } else {
        stats.wrong++;
        resultMessage.innerHTML = '<div style="color:#ef4444; font-size:20px; font-weight:600;">❌ Неправильно</div>';
      }
      
      correctAnswerEl.innerHTML = `<p><strong>Правильный ответ:</strong></p><p>${card.answer}</p>`;
      if (userAnswer) {
        correctAnswerEl.innerHTML += `<p><strong>Ваш ответ:</strong> ${userAnswer}</p>`;
      }
      
      inputArea.style.display = 'none';
      resultArea.style.display = '';
      statsEl.textContent = `✅ ${stats.correct} | ❌ ${stats.wrong}`;
    }
    
    checkBtn.addEventListener('click', checkAnswer);
    answerInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        checkAnswer();
      }
    });
    
    nextBtn.addEventListener('click', () => {
      currentIndex++;
      renderCard();
    });
    
    wrapper.querySelector('#btn-back-theory')?.addEventListener('click', () => navigate('#/learn/theory'));
    
    renderCard();
    return wrapper;
  }
  
  function viewTests() {
    const wrapper = document.createElement('div');
    wrapper.className = 'page';
    
    const sectionId = (location.hash || '').split('/').pop();
    if (!window.TRAINING_DATA || !window.TRAINING_DATA.sections) {
      wrapper.innerHTML = `
        <div class="panel">
          <div class="panel-header">
            <h2>Ошибка</h2>
            <button id="btn-back-theory" class="btn">Назад</button>
          </div>
          <p style="padding:16px;">Данные обучения не загружены. Пожалуйста, обновите страницу.</p>
        </div>
      `;
      wrapper.querySelector('#btn-back-theory')?.addEventListener('click', () => navigate('#/learn/theory'));
      return wrapper;
    }
    
    const section = window.TRAINING_DATA.sections.find(s => s.id === sectionId);
    if (!section) {
      wrapper.innerHTML = `
        <div class="panel">
          <div class="panel-header">
            <h2>Ошибка</h2>
            <button id="btn-back-theory" class="btn">Назад</button>
          </div>
          <p style="padding:16px;">Раздел "${sectionId}" не найден. Доступные разделы: ${window.TRAINING_DATA.sections.map(s => s.id).join(', ')}</p>
        </div>
      `;
      wrapper.querySelector('#btn-back-theory')?.addEventListener('click', () => navigate('#/learn/theory'));
      return wrapper;
    }
    
    if (!section.tests || section.tests.length === 0) {
      wrapper.innerHTML = `
        <div class="panel">
          <div class="panel-header">
            <h2>Тесты: ${section.title}</h2>
            <button id="btn-back-theory" class="btn">Назад</button>
          </div>
          <p style="padding:16px;">Тесты для этого раздела пока не добавлены.</p>
        </div>
      `;
      wrapper.querySelector('#btn-back-theory')?.addEventListener('click', () => navigate('#/learn/theory'));
      return wrapper;
    }
    
    let currentIndex = 0;
    let selectedAnswer = null;
    let stats = { correct: 0, wrong: 0 };
    const tests = shuffle([...section.tests]);
    
    function shuffle(arr){ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]];} return arr; }
    
    wrapper.innerHTML = `
      <div class="panel">
        <div class="panel-header">
          <div class="page-title"><h2>Тесты: ${section.title}</h2></div>
          <button id="btn-back-theory" class="btn">Назад</button>
        </div>
        
        <div class="flashcard-progress" style="padding:12px;">
          <div style="display:flex; justify-content:space-between;">
            <span id="test-counter">Вопрос 1 / ${tests.length}</span>
            <span id="test-stats">✅ 0 | ❌ 0</span>
          </div>
        </div>
        
        <div class="test-container" id="test-container"></div>
      </div>
    `;
    
    const container = wrapper.querySelector('#test-container');
    const counterEl = wrapper.querySelector('#test-counter');
    const statsEl = wrapper.querySelector('#test-stats');
    
    function renderTest() {
      if (currentIndex >= tests.length) {
        container.innerHTML = `
          <div style="text-align:center; padding:40px;">
            <h2>🎉 Тест завершён!</h2>
            <p style="font-size:24px; margin:20px 0;">Результат: ${stats.correct} / ${tests.length}</p>
            <p style="font-size:18px;">Процент: ${Math.round((stats.correct / tests.length) * 100)}%</p>
            <button id="restart-test-btn" class="btn primary" style="margin-top:20px;">Пройти заново</button>
          </div>
        `;
        container.querySelector('#restart-test-btn')?.addEventListener('click', () => {
          currentIndex = 0;
          stats = { correct: 0, wrong: 0 };
          renderTest();
        });
        return;
      }
      
      const test = tests[currentIndex];
      selectedAnswer = null;
      
      container.innerHTML = `
        <div class="test-question-card">
          <h3>${test.question}</h3>
          <div class="test-options" id="test-options">
            ${test.options.map((opt, idx) => `
              <button class="test-option" data-index="${idx}">
                <span class="option-letter">${String.fromCharCode(65 + idx)}</span>
                <span class="option-text">${opt}</span>
              </button>
            `).join('')}
          </div>
          <div class="test-actions">
            <button id="submit-test-btn" class="btn primary" disabled>Ответить</button>
          </div>
          <div id="test-result" class="test-result" style="display:none;"></div>
        </div>
      `;
      
      counterEl.textContent = `Вопрос ${currentIndex + 1} / ${tests.length}`;
      statsEl.textContent = `✅ ${stats.correct} | ❌ ${stats.wrong}`;
      
      const submitBtn = container.querySelector('#submit-test-btn');
      const resultDiv = container.querySelector('#test-result');
      
      container.querySelectorAll('.test-option').forEach(btn => {
        btn.addEventListener('click', () => {
          container.querySelectorAll('.test-option').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          selectedAnswer = parseInt(btn.dataset.index);
          submitBtn.disabled = false;
        });
      });
      
      submitBtn.addEventListener('click', () => {
        if (selectedAnswer === null) return;
        
        const isCorrect = selectedAnswer === test.correct;
        if (isCorrect) {
          stats.correct++;
          addXP(20);
          resultDiv.innerHTML = '<div style="color:#22c55e; font-size:18px; padding:16px;">✅ Правильно!</div>';
        } else {
          stats.wrong++;
          const correctOpt = test.options[test.correct];
          resultDiv.innerHTML = `<div style="color:#ef4444; font-size:18px; padding:16px;">❌ Неправильно<br>Правильный ответ: ${correctOpt}</div>`;
        }
        
        resultDiv.style.display = '';
        submitBtn.textContent = 'Следующий вопрос';
        submitBtn.onclick = () => { currentIndex++; renderTest(); };
        container.querySelectorAll('.test-option').forEach(btn => btn.disabled = true);
        
        statsEl.textContent = `✅ ${stats.correct} | ❌ ${stats.wrong}`;
      });
    }
    
    wrapper.querySelector('#btn-back-theory')?.addEventListener('click', () => navigate('#/learn/theory'));
    renderTest();
    
    return wrapper;
  }

  function viewHome() {
    const wrapper = document.createElement('div');
    wrapper.className = 'page tables-page-redesign';

    // Header with logo - TheBullTeam | Miraxa
    const header = document.createElement('div');
    header.className = 'tables-header-redesign';
    header.innerHTML = `
      <div class="tables-logo-redesign">
        <span class="logo-text-redesign">TheBullTeam</span>
        <span class="logo-separator-redesign">|</span>
        <span class="logo-name-redesign">Miraxa</span>
      </div>
    `;
    wrapper.appendChild(header);

    // Add table button
    const addBtnContainer = document.createElement('div');
    addBtnContainer.className = 'add-table-container-redesign';
    addBtnContainer.innerHTML = `<button id="btn-add-table" class="btn-add-table-redesign">Добавить стол</button>`;
    wrapper.appendChild(addBtnContainer);

    // Takeout drinks button - only show if there are pending drinks
    const pendingDrinks = getPendingDrinksByTable();
    const takeoutBtnContainer = document.createElement('div');
    takeoutBtnContainer.className = 'takeout-container-redesign' + (pendingDrinks.length === 0 ? ' hidden' : ' bubble-in');
    takeoutBtnContainer.innerHTML = `<button id="btn-takeout" class="btn-takeout-redesign">↓ Есть напитки для выноса ↓</button>`;
    wrapper.appendChild(takeoutBtnContainer);

    // Tables grid
    const grid = document.createElement('div');
    grid.className = 'tables-grid-redesign';
    grid.id = 'tables-grid';
    wrapper.appendChild(grid);

    // Render tables
    const frag = document.createDocumentFragment();
    activeTables.forEach(n => {
      const card = document.createElement('div');
      card.className = 'table-card-redesign';
      const itemsArr = Array.isArray(tableOrders[n]) ? tableOrders[n] : [];
      const totalAmount = computeTableTotalAmount(n);
      const displayName = getTableDisplayName(n);
      
      // Calculate bar and dishes status using isBarItem/isDishItem functions
      const barItems = itemsArr.filter(item => isBarItem(item));
      const dishItems = itemsArr.filter(item => isDishItem(item));
      
      // Check if all items are served (status === 'served')
      const barAllServed = barItems.length > 0 && barItems.every(item => item.status === 'served');
      const dishAllServed = dishItems.length > 0 && dishItems.every(item => item.status === 'served');
      
      // Determine badge class
      let barClass = 'status-empty';
      if (barItems.length > 0) {
        barClass = barAllServed ? 'status-served' : 'status-pending';
      }
      
      let dishClass = 'status-empty';
      if (dishItems.length > 0) {
        dishClass = dishAllServed ? 'status-served' : 'status-pending';
      }
      
      card.innerHTML = `
        <h3 class="table-number-new">${displayName}</h3>
        <div class="table-total-new">${totalAmount} ₽</div>
        <div class="table-status-badges">
          <span class="status-badge ${barClass}">Бар</span>
          <span class="status-badge ${dishClass}">Блюда</span>
        </div>
      `;
      
      // Long press detection for table management
      let pressTimer = null;
      let isLongPress = false;
      let touchStartTime = 0;
      let touchStartX = 0;
      let touchStartY = 0;
      let hasMoved = false;
      
      const startPress = (e) => {
        isLongPress = false;
        hasMoved = false;
        touchStartTime = Date.now();
        
        // Store initial touch position
        if (e.touches && e.touches[0]) {
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
        } else {
          touchStartX = e.clientX;
          touchStartY = e.clientY;
        }
        
        pressTimer = setTimeout(() => {
          isLongPress = true;
          // Vibrate if supported
          if (navigator.vibrate) navigator.vibrate(50);
          showTableManagementModal(n);
        }, 500); // 0.5 seconds for long press menu
      };
      
      const endPress = () => {
        if (pressTimer) {
          clearTimeout(pressTimer);
          pressTimer = null;
        }
      };
      
      const cancelPress = (e) => {
        // Check if moved more than 10px - consider it a scroll
        if (e.touches && e.touches[0]) {
          const dx = Math.abs(e.touches[0].clientX - touchStartX);
          const dy = Math.abs(e.touches[0].clientY - touchStartY);
          if (dx > 10 || dy > 10) {
            hasMoved = true;
            endPress();
          }
        }
      };
      
      // Touch events for mobile
      card.addEventListener('touchstart', startPress, { passive: true });
      card.addEventListener('touchend', (e) => {
        endPress();
        const touchDuration = Date.now() - touchStartTime;
        
        // Only navigate if: not long press, not moved (scrolling), and held for at least 35ms
        if (!isLongPress && !hasMoved && touchDuration >= 35) {
          navigate(`#/table/${n}`);
        }
        e.preventDefault();
      });
      card.addEventListener('touchmove', cancelPress, { passive: true });
      card.addEventListener('touchcancel', () => { hasMoved = true; endPress(); });
      
      // Mouse events for desktop
      card.addEventListener('mousedown', startPress);
      card.addEventListener('mouseup', (e) => {
        endPress();
        if (!isLongPress) {
          navigate(`#/table/${n}`);
        }
      });
      card.addEventListener('mouseleave', () => { endPress(); });
      
      frag.appendChild(card);
    });
    grid.appendChild(frag);

    // Add table handler
    wrapper.querySelector('#btn-add-table').addEventListener('click', () => {
      const tableNumber = prompt('Номер стола?', '');
      if (!tableNumber) return;
      const n = Number(tableNumber);
      if (!Number.isInteger(n) || n <= 0) { alert('Введите корректный номер'); return; }
      
      if (!activeTables.includes(n)) { 
        activeTables.push(n); 
        activeTables.sort((a,b)=>a-b);
        saveTables();
      }
      
      if (!tableOrders[n]) {
        tableOrders[n] = [];
      }
      
      navigate(`#/table/${n}`);
    });

    // Takeout drinks handler - show slide-up panel with pending drinks
    wrapper.querySelector('#btn-takeout').addEventListener('click', () => {
      showTakeoutDrinksPanel();
    });

    return wrapper;
  }

  function viewTable(tableNumber) {
    const wrapper = document.createElement('div');
    wrapper.className = 'page';

    if (tableMode === 'todo') {
      return viewTableTodo(tableNumber);
    }

    const panelMenu = document.createElement('section');
    panelMenu.className = 'panel';
    panelMenu.innerHTML = `
      <div class="panel-header">
        <div class="page-title">
          <h2>${getTableDisplayName(tableNumber)}</h2>
        </div>
        <div class="panel-actions">
          <button id="btn-sort" class="btn secondary" title="Обновить и отсортировать">🔄</button>
          <button id="btn-reload" class="btn secondary" title="Перезагрузить меню">⟳</button>
          <button id="btn-back" class="btn">Назад</button>
        </div>
      </div>
      <div class="search-row"><input id="search" placeholder="Поиск блюд" inputmode="search" /></div>
      <div class="menu-list" id="menu-list"></div>
      <div class="bottom-bar">
        <span class="chip">Заказов в столе: ${tableOrders[tableNumber] ? tableOrders[tableNumber].reduce((sum, o) => sum + o.quantity, 0) : 0}</span>
      </div>
    `;
    wrapper.appendChild(panelMenu);

    panelMenu.querySelector('#btn-back').addEventListener('click', () => navigate('#/'));
    
    // Sort button handler - sorts dishes by category (only when refresh button is pressed)
    panelMenu.querySelector('#btn-sort').addEventListener('click', () => {
      sortTableOrdersByCategory(tableNumber);
      renderTableOrders(true);
      
      // Update counter
      const totalItems = tableOrders[tableNumber] ? tableOrders[tableNumber].reduce((sum, o) => sum + o.quantity, 0) : 0;
      const chip = panelMenu.querySelector('.chip');
      if (chip) {
        chip.textContent = `Заказов в столе: ${totalItems}`;
      }
    });
    
    // Reload button handler
    panelMenu.querySelector('#btn-reload').addEventListener('click', async () => {
      console.log('Reloading dishes...');
      try {
        await loadDb(true); // Force reload
        render(); // Re-render the page
      } catch (error) {
        console.error('Failed to reload dishes:', error);
        alert('Ошибка перезагрузки меню');
      }
    });

    // Load dishes and render
    loadDb().then(({dishes}) => {
      const list = panelMenu.querySelector('#menu-list');
      const searchInput = panelMenu.querySelector('#search');

      const normalize = (s) => (s || '').toLowerCase();

      // Function to render table orders with details
      function renderTableOrders(shouldSort = false) {
        if (shouldSort) {
          sortTableOrdersByCategory(tableNumber);
        }
        list.innerHTML = '';
        if (!tableOrders[tableNumber] || tableOrders[tableNumber].length === 0) {
          list.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--muted-foreground);">Заказов пока нет. Начните поиск блюд выше</div>';
          return;
        }

        const frag = document.createDocumentFragment();
        
        // Group orders by category
        let lastCategoryGroup = null;
        
        // Track which orders are already processed (to avoid duplicates in chain groups)
        const processedOrders = new Set();
        
        tableOrders[tableNumber].forEach((order, index) => {
          // Skip if already processed as part of a chain
          if (processedOrders.has(order.id)) {
            return;
          }
          
          const currentGroup = order._categoryGroup ?? getCategoryGroup(order);
          const categoryConfig = CATEGORY_CONFIG[currentGroup];
          // Always check current state, not cached _categoryEnabled
          const groupingEnabled = currentGroup && isCategoryGroupEnabled(currentGroup);

          if (groupingEnabled && currentGroup) {
            if (currentGroup !== lastCategoryGroup) {
              const separator = document.createElement('div');
              separator.className = 'category-separator';
              separator.innerHTML = `
                <div class="separator-line"></div>
                <div class="separator-text">${categoryConfig?.label || 'Категория'}</div>
                <div class="separator-line"></div>
              `;
              frag.appendChild(separator);
              lastCategoryGroup = currentGroup;
            }
          } else {
            // Reset last group when we hit disabled categories
            if (lastCategoryGroup !== null && lastCategoryGroup < 1000) {
              lastCategoryGroup = null;
            }
          }
          
          // Check if this order has linked items (garnish, sauce, extra)
          const linkedOrders = tableOrders[tableNumber].filter(o => o.linkedTo === order.id);
          
          if (linkedOrders.length > 0) {
            // Create chain group container
            const chainGroup = document.createElement('div');
            chainGroup.className = 'order-chain-group';
            
            // Add main dish
            chainGroup.appendChild(createOrderElement(order));
            processedOrders.add(order.id);
            
            // Add linked items
            linkedOrders.forEach(linkedOrder => {
              chainGroup.appendChild(createOrderElement(linkedOrder));
              processedOrders.add(linkedOrder.id);
            });
            
            frag.appendChild(chainGroup);
          } else {
            // Regular order without links
            frag.appendChild(createOrderElement(order));
            processedOrders.add(order.id);
          }
        });
        
        list.appendChild(frag);
        
      }

      // Helper function to check if order is a drink
      function isDrink(order) {
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

      // SVG Icons for action buttons
      const ICONS = {
        takeaway: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M18 6h-2V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6-2h2v2h-2V4zM6 20V8h12v12H6z"/></svg>`,
        rkeeper: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M17 1H7c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2zm0 18H7V5h10v14zm-5 3c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1z"/></svg>`,
        delivered: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`,
        delete: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`
      };

      // Helper function to create order element
      function createOrderElement(order) {
          const row = document.createElement('div');
          row.className = 'dish-card';
          if (order.isTakeaway) row.classList.add('takeaway-order');
          
          // Add chain-addon-card class for garnish, sauce, or extra addons
          if (order.addonType === 'garnish' || order.addonType === 'sauce' || order.addonType === 'extra') {
            row.classList.add('chain-addon-card');
          }
          
          // Check if dish is in stop list and highlight
          if (isInStopList(order.itemName)) {
            row.classList.add('in-stop-list');
          }
          
          // Header section with image placeholder, title, code and controls
          const header = document.createElement('div');
          header.className = 'dish-header';
          
          // Try to get image from order, or fallback to database lookup
          let orderImage = order.image;
          if ((!orderImage || orderImage === '' || orderImage === '-') && db && db.dishes) {
            // Get base name - remove last parentheses if it contains cooking level
            let baseName = order.itemName;
            // Match pattern: ends with " (something)" where something is a cooking level
            const cookingMatch = baseName.match(/^(.+)\s+\((Rare|Medium Rare|Medium|Medium Well|Well Done|Blue)\)$/i);
            if (cookingMatch) {
              baseName = cookingMatch[1];
            }
            
            // Find dish by base name
            let dishFromDb = db.dishes.find(d => d.name === baseName);
            
            // If not found by exact name, try partial match
            if (!dishFromDb) {
              dishFromDb = db.dishes.find(d => baseName.startsWith(d.name));
            }
            
            // If still not found, try by rkeeper code
            if (!dishFromDb && order.rkeeper && order.rkeeper !== '—') {
              dishFromDb = db.dishes.find(d => d.R_keeper === order.rkeeper);
            }
            
            if (dishFromDb && dishFromDb.image) {
              orderImage = dishFromDb.image;
            }
          }
          
          // Image or placeholder
          let imgElement;
          if (orderImage && orderImage !== '' && orderImage !== '-') {
            imgElement = document.createElement('img');
            imgElement.className = 'dish-image';
            imgElement.src = orderImage;
            imgElement.alt = order.itemName;
            imgElement.onclick = (e) => {
              e.stopPropagation();
              showImageLightbox(orderImage, order.itemName, order.itemName);
            };
            imgElement.onerror = function() {
              this.style.display = 'none';
              const placeholder = document.createElement('div');
              placeholder.className = 'dish-image-placeholder';
              this.parentNode.insertBefore(placeholder, this);
            };
          } else {
            imgElement = document.createElement('div');
            imgElement.className = 'dish-image-placeholder';
          }
          
          const headerContent = document.createElement('div');
          headerContent.className = 'dish-header-content';
          
          // Add addon type label for chain addons (garnish, sauce, extra)
          if (order.addonType === 'garnish' || order.addonType === 'sauce' || order.addonType === 'extra') {
            const addonLabel = document.createElement('div');
            addonLabel.className = 'chain-addon-type-label';
            addonLabel.textContent = order.addonType === 'garnish' ? '+ Гарнир' : 
                                     order.addonType === 'sauce' ? '+ Соус' : 
                                     '+ Добавка';
            headerContent.appendChild(addonLabel);
          }
          
          const title = document.createElement('h3'); 
          title.textContent = order.itemName;
          title.className = 'dish-title';
          
          // Add custom dish indicator
          if (order.isCustom) {
            title.style.fontStyle = 'italic';
            title.style.opacity = '0.8';
          }
          
          // Add strikethrough styling based on status
          if (order.status === 'rkeeper') {
            title.style.textDecoration = 'line-through';
            title.style.color = '#22c55e';
          } else if (order.status === 'served') {
            title.style.textDecoration = 'line-through';
            title.style.color = '#ef4444';
          }
          
          // Dish code display (prominent)
          const codeEl = document.createElement('div');
          codeEl.className = 'dish-code';
          if (order.rkeeper && order.rkeeper !== '—') {
            codeEl.innerHTML = `<span class="dish-code-label">Код: </span><span class="dish-code-value">${order.rkeeper}</span>`;
          }
          
          // Cooking level display (prominent)
          const cookingEl = document.createElement('div');
          cookingEl.className = 'dish-cooking-level';
          if (order.cookingLevel) {
            cookingEl.innerHTML = `<span class="cooking-level-label">Прожарка: </span><span class="cooking-level-value">${order.cookingLevel}</span>`;
          }
          
          // Ice cream flavors / juice / redbull display
          const flavorsEl = document.createElement('div');
          flavorsEl.className = 'dish-flavors';
          if (order.iceCreamFlavors) {
            flavorsEl.innerHTML = `<span class="flavors-label">Вкус: </span><span class="flavors-value">${order.iceCreamFlavors}</span>`;
          }
          
          // Quantity controls
          const quantityControls = document.createElement('div');
          quantityControls.className = 'quantity-controls';
          
          const minusBtn = document.createElement('button');
          minusBtn.textContent = '−';
          minusBtn.className = 'btn quantity-btn';
          minusBtn.onclick = () => changeQuantity(order.id, -1);
          
          const quantity = document.createElement('span');
          quantity.textContent = order.quantity;
          quantity.className = 'quantity';
          
          const plusBtn = document.createElement('button');
          plusBtn.textContent = '+';
          plusBtn.className = 'btn quantity-btn';
          plusBtn.onclick = () => changeQuantity(order.id, 1);
          
          quantityControls.appendChild(minusBtn);
          quantityControls.appendChild(quantity);
          quantityControls.appendChild(plusBtn);
          
          headerContent.appendChild(title);
          if (order.rkeeper && order.rkeeper !== '—') headerContent.appendChild(codeEl);
          if (order.cookingLevel) headerContent.appendChild(cookingEl);
          if (order.iceCreamFlavors) headerContent.appendChild(flavorsEl);
          headerContent.appendChild(quantityControls);
          
          header.appendChild(imgElement);
          header.appendChild(headerContent);
          
          // Action icons row
          const actions = document.createElement('div');
          actions.className = 'dish-actions';
          
          // Takeaway button (icon only)
          const takeawayBtn = document.createElement('button');
          takeawayBtn.className = `action-btn takeaway${order.isTakeaway ? ' active' : ''}`;
          takeawayBtn.innerHTML = ICONS.takeaway;
          takeawayBtn.title = 'Навынос';
          takeawayBtn.onclick = () => toggleTakeaway(order.id);
          
          // R_keeper button (icon only)
          const rkeeperBtn = document.createElement('button');
          rkeeperBtn.className = `action-btn rkeeper${order.status === 'rkeeper' ? ' active' : ''}`;
          rkeeperBtn.innerHTML = ICONS.rkeeper;
          rkeeperBtn.title = 'Printed R_keeper';
          rkeeperBtn.onclick = () => toggleOrderStatus(order.id, 'rkeeper');
          
          // Delivered button (icon only)
          const deliveredBtn = document.createElement('button');
          deliveredBtn.className = `action-btn delivered${order.status === 'served' ? ' active' : ''}`;
          deliveredBtn.innerHTML = ICONS.delivered;
          deliveredBtn.title = 'Вынесен';
          deliveredBtn.onclick = () => toggleOrderStatus(order.id, 'served');
          
          // Delete button (icon only) - REMOVED
          // const deleteBtn = document.createElement('button');
          // deleteBtn.className = 'action-btn delete';
          // deleteBtn.innerHTML = ICONS.delete;
          // deleteBtn.title = 'Удалить';
          // deleteBtn.onclick = () => removeOrder(order.id);
          
          // Add extra dish button (icon only)
          const extraDishBtn = document.createElement('button');
          extraDishBtn.className = 'action-btn extra-dish';
          extraDishBtn.innerHTML = '➕'; // Plus icon
          extraDishBtn.title = 'Добавить доп. блюдо';
          extraDishBtn.onclick = () => showExtraDishModal(order);
          
          actions.appendChild(takeawayBtn);
          actions.appendChild(rkeeperBtn);
          actions.appendChild(deliveredBtn);
          actions.appendChild(extraDishBtn);
          
          // Notes field
          const notes = document.createElement('div');
          notes.className = 'dish-notes';
          const notesInput = document.createElement('textarea');
          notesInput.className = 'dish-notes-input';
          notesInput.placeholder = 'Заметка...';
          notesInput.value = order.notes || '';
          notesInput.rows = 1;
          notesInput.addEventListener('blur', () => {
            updateOrderNote(order.id, notesInput.value.trim());
          });
          notesInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              notesInput.blur();
            }
          });
          notes.appendChild(notesInput);
          
          row.appendChild(header);
          row.appendChild(actions);
          row.appendChild(notes);
          
          return row;
      }

      // Global functions for order management
      window.updateOrderNote = (orderId, note) => {
        if (tableOrders[tableNumber]) {
          const order = tableOrders[tableNumber].find(o => o.id === orderId);
          if (order) {
            order.notes = note || undefined;
            saveTableOrders();
          }
        }
      };


      window.changeQuantity = (orderId, delta) => {
        if (tableOrders[tableNumber]) {
          const order = tableOrders[tableNumber].find(o => o.id === orderId);
          if (order) {
            const nextQty = (order.quantity || 1) + delta;
            if (nextQty <= 0) {
              // remove item if decremented from 1
              tableOrders[tableNumber] = tableOrders[tableNumber].filter(o => o.id !== orderId);
            } else {
              order.quantity = nextQty;
            }
            saveTableOrders();
            renderTableOrders();
            // Update counter - count total items, not unique dishes
            const totalItems = tableOrders[tableNumber].reduce((sum, o) => sum + o.quantity, 0);
            const chip = panelMenu.querySelector('.chip');
            if (chip) {
              chip.textContent = `Заказов в столе: ${totalItems}`;
            }
          }
        }
      };

      window.removeOrder = (orderId) => {
        if (tableOrders[tableNumber]) {
          tableOrders[tableNumber] = tableOrders[tableNumber].filter(o => o.id !== orderId);
          saveTableOrders();
          renderTableOrders();
          // Update counter - count total items
          const totalItems = tableOrders[tableNumber].reduce((sum, o) => sum + o.quantity, 0);
          const chip = panelMenu.querySelector('.chip');
          if (chip) {
            chip.textContent = `Заказов в столе: ${totalItems}`;
          }
        }
      };

      window.toggleOrderStatus = (orderId, status) => {
        if (tableOrders[tableNumber]) {
          const order = tableOrders[tableNumber].find(o => o.id === orderId);
          if (order) {
            // If clicking the same status, remove it (toggle off)
            if (order.status === status) {
              order.status = undefined;
            } else {
              // Set new status
              order.status = status;
            }
            // Sort by status: no status first, rkeeper in middle, served at bottom
            sortTableOrdersByStatus(tableNumber);
            saveTableOrders();
            renderTableOrders();
          }
        }
      };

      // Live suggestion container
      const suggestEl = document.createElement('div');
      suggestEl.className = 'suggestion';
      suggestEl.style.display = 'none';
      suggestEl.innerHTML = '<span>Добавить: <b></b></span><button class="btn primary">Добавить</button>';
      const suggestNameEl = suggestEl.querySelector('b');
      const suggestBtn = suggestEl.querySelector('button');
      panelMenu.insertBefore(suggestEl, list);

      function renderList(filter) {
        list.innerHTML='';
        const norm = normalize(filter);
        console.log('Searching for:', norm);
        console.log('Total dishes available:', dishes.length);
        console.log('Dish names:', dishes.map(d => d.name));
        
        const items = dishes.filter(d => {
          const name = normalize(d.name);
          const matches = !norm || name.includes(norm);
          if (norm && matches) {
            console.log('Found match:', d.name);
          }
          return matches;
        });
        
        console.log('Filtered items count:', items.length);
        
        const frag = document.createDocumentFragment();
        items.forEach(d => {
          const row = document.createElement('div');
          row.className='dish-card';
          
          // Check if dish is in stop list
          const inStopList = isInStopList(d.name);
          if (inStopList) {
            row.classList.add('in-stop-list');
          }
          
          // Header section with image placeholder, title, code and controls
          const header = document.createElement('div');
          header.className = 'dish-header';
          
          // Image or placeholder
          let imgElement;
          if (d.image && d.image !== '-') {
            imgElement = document.createElement('img');
            imgElement.className = 'dish-image';
            imgElement.src = d.image;
            imgElement.alt = d.name;
            imgElement.onclick = (e) => {
              e.stopPropagation();
              showImageLightbox(d.image, d.name, d.name);
            };
            imgElement.onerror = function() {
              this.style.display = 'none';
              const placeholder = document.createElement('div');
              placeholder.className = 'dish-image-placeholder';
              this.parentNode.insertBefore(placeholder, this);
            };
          } else {
            imgElement = document.createElement('div');
            imgElement.className = 'dish-image-placeholder';
          }
          
          const headerContent = document.createElement('div');
          headerContent.className = 'dish-header-content';
          
          const title = document.createElement('h3'); 
          title.textContent = d.name;
          title.className = 'dish-title';
          
          // Dish code display (prominent)
          const codeEl = document.createElement('div');
          codeEl.className = 'dish-code';
          if (d.R_keeper && d.R_keeper !== '—') {
            codeEl.innerHTML = `<span class="dish-code-label">Код: </span><span class="dish-code-value">${d.R_keeper}</span>`;
          }
          
          const price = document.createElement('div');
          price.className = 'dish-price-header';
          price.textContent = calculatePrice(d.price, d.category) || d.price || '—';
          
          const controls = document.createElement('div');
          controls.className = 'dish-controls';
          
          const quantityControls = document.createElement('div');
          quantityControls.className = 'quantity-controls';
          
          const minusBtn = document.createElement('button');
          minusBtn.textContent = '-';
          minusBtn.className = 'btn quantity-btn';
          
          const quantity = document.createElement('span');
          quantity.textContent = '1';
          quantity.className = 'quantity';
          
          const plusBtn = document.createElement('button');
          plusBtn.textContent = '+';
          plusBtn.className = 'btn quantity-btn';
          
          quantityControls.appendChild(minusBtn);
          quantityControls.appendChild(quantity);
          quantityControls.appendChild(plusBtn);
          
          const addBtn = document.createElement('button');
          addBtn.textContent = 'Добавить';
          addBtn.className = 'btn primary add-btn';
          
          controls.appendChild(quantityControls);
          controls.appendChild(addBtn);
          
          headerContent.appendChild(title);
          if (d.R_keeper && d.R_keeper !== '—') headerContent.appendChild(codeEl);
          headerContent.appendChild(price);
          headerContent.appendChild(controls);
          
          header.appendChild(imgElement);
          header.appendChild(headerContent);
          
          // Details section with composition and allergens
          const details = document.createElement('div');
          details.className = 'dish-details';
          
          if (d.composition && d.composition.length > 0) {
            const composition = document.createElement('div');
            composition.className = 'dish-composition';
            const compLabel = document.createElement('span');
            compLabel.textContent = 'Состав: ';
            compLabel.className = 'detail-label';
            const compText = document.createElement('span');
            compText.textContent = d.composition.slice(0, 3).join(', ');
            composition.appendChild(compLabel);
            composition.appendChild(compText);
            details.appendChild(composition);
          }
          
          if (d.allergens && d.allergens.length > 0) {
            const allergens = document.createElement('div');
            allergens.className = 'dish-allergens';
            const allLabel = document.createElement('span');
            allLabel.textContent = 'Аллергены: ';
            allLabel.className = 'detail-label allergens-label';
            const allText = document.createElement('span');
            allText.textContent = d.allergens.slice(0, 3).join(', ');
            allergens.appendChild(allLabel);
            allergens.appendChild(allText);
            details.appendChild(allergens);
          }
          
          // Notes field (simplified)
          const notes = document.createElement('div');
          notes.className = 'dish-notes';
          const notesInput = document.createElement('input');
          notesInput.type = 'text';
          notesInput.placeholder = 'Заметка...';
          notesInput.className = 'notes-input';
          notes.appendChild(notesInput);
          
          row.appendChild(header);
          row.appendChild(details);
          row.appendChild(notes);
          
          // Add stop list badge if needed
          if (inStopList) {
            const stopBadge = document.createElement('div');
            stopBadge.className = 'stop-list-badge';
            stopBadge.innerHTML = '⛔ СТОП';
            details.appendChild(stopBadge);
          }
          
          // Event listeners
          addBtn.addEventListener('click', () => {
            console.log('Add button clicked for:', d.name);
            console.log('Current stopList:', stopList);
            
            // Proceed with adding (stop list check is inside proceedWithAddDish)
            proceedWithAddDish();
          });
          
          function proceedWithAddDish() {
            // CHECK STOP LIST FIRST
            if (isInStopList(d.name)) {
              console.warn('Dish is in stop list:', d.name);
              showConfirmModal(
                '⚠️ Блюдо в стоп-листе',
                `"${d.name}" находится в стоп-листе и может быть недоступно. Добавить в заказ?`,
                () => {
                  // User confirmed, proceed with adding
                  continueAddingDish();
                },
                null,
                'Добавить',
                'Отмена'
              );
              return; // Stop here and wait for user confirmation
            }
            
            // If not in stop list, continue normally
            continueAddingDish();
          }
          
          function continueAddingDish() {
            // Check if this is a steak that needs cooking level + chain
            const dishName = (d.name || '').toLowerCase();
            const isSteakDish = isSteak(d.name);
            
            // Check if this is ice cream
            const isIceCream = dishName.toLowerCase().includes('мороженое') || dishName.toLowerCase().includes('мороженное');
            
            // Check if this is juice assortment
            const isJuice = dishName.toLowerCase().includes('сок в ассортименте');
            
            // Check if this is Red Bull
            const isRedBull = dishName.toLowerCase().includes('рэд булл') || dishName.toLowerCase().includes('ред булл') || dishName.toLowerCase().includes('red bull');
            
            // NEW: Check if this is tea with code 59 (both green and black tea)
            const isTea = d.R_keeper === '59';
            
            // NEW: Check if this is tartare (only beef tartare, not trout)
            const isTartare = d.name === 'Тартар из говядины';
            
            // NEW: Check if this is cocktail with small volume
            const isCocktail = (d.category === 'НА РОМЕ' || d.category === 'НА ВОДКЕ' || d.category === 'НА ВИСКИ' || 
                               d.category === 'НА ДЖИНЕ' || d.category === 'НА ТЕКИЛЕ' || d.category === 'НА ИГРИСТОМ ВИНЕ' ||
                               d.category === 'АВТОРСКИЕ' || d.category === 'КЛАССИЧЕСКИЕ') && 
                              (d.gramm === '200 мл' || d.gramm === '250 мл' || d.gramm === '300 мл');
            
            // NEW: Check if this is Vitello tonnato
            const isVitello = d.name === 'Вителло тоннато';
            
            // NEW: Check if this is beer
            const isBeer = d.category === 'ПИВО';
            
            console.log('Dish check:', {
              name: d.name,
              isSteakDish,
              isIceCream,
              isJuice,
              isRedBull,
              isTea,
              isTartare,
              isCocktail,
              isVitello,
              isBeer,
              dishChainSettings
            });
            
            // Function to add dish with optional cooking level or ice cream flavors
            let lastAddedDishId = null; // Store ID of last added dish for linking
            
            const addDishToTable = (cookingLevel = null, iceCreamFlavors = null, qty = null) => {
              // Initialize table orders if not exists
              if (!tableOrders[tableNumber]) {
                tableOrders[tableNumber] = [];
              }
              
              const dishId = uuid();
              lastAddedDishId = dishId; // Save ID for linking
              
              // Add to specific table with full details (new items go to top)
              tableOrders[tableNumber].unshift({ 
                id: dishId, 
                itemName: d.name, 
                quantity: qty !== null ? qty : parseInt(quantity.textContent), 
                price: d.price,
                calculatedPrice: calculatePrice(d.price, d.category),
                composition: d.composition ? d.composition.slice(0, 3).join(', ') : '',
                allergens: d.allergens ? d.allergens.slice(0, 3).join(', ') : '',
                rkeeper: d.R_keeper,
                notes: notesInput.value,
                createdAt: Date.now(),
                addedAt: Date.now(),
                category: d.category || '', // Store category for sorting
                source: d.source || 'dishes', // Store source for bar/dishes detection
                cookingLevel: cookingLevel, // Store cooking level for steaks
                iceCreamFlavors: iceCreamFlavors // Store ice cream flavors
              });
              saveTableOrders();
              // Don't auto-sort - user can press refresh button to sort by courses
              // Switch to table orders view
              renderTableOrders();
              // Update counter
              const chip = panelMenu.querySelector('.chip');
              if (chip) {
                chip.textContent = `Заказов в столе: ${tableOrders[tableNumber].length}`;
              }
              // Show feedback
              addBtn.textContent = '✓ Добавлено';
              addBtn.disabled = true;
              setTimeout(() => {
                addBtn.textContent = 'Добавить';
                addBtn.disabled = false;
              }, 1000);
            };
            
            // If it's a steak, show steak chain
            if (isSteakDish) {
              console.log('Showing steak chain for:', d.name);
              showSteakChain(d, tableNumber, (steakOrder) => {
                if (!steakOrder) return;
                
                // Add steak chain in correct order
                addSteakChainToTable(tableNumber, d, steakOrder);
                renderTableOrders();
              });
            } else if (isIceCream) {
              // If it's ice cream, show flavor selection modal
              console.log('Showing ice cream modal for:', d.name);
              showIceCreamFlavorModal(d.name, (selectedFlavors) => {
                console.log('Selected flavors:', selectedFlavors);
                addDishToTable(null, selectedFlavors);
              });
            } else if (isJuice) {
              // If it's juice, show flavor selection modal
              console.log('Showing juice modal for:', d.name);
              showJuiceFlavorModal(d.name, (selectedFlavor) => {
                console.log('Selected juice flavor:', selectedFlavor);
                addDishToTable(null, selectedFlavor);
              });
            } else if (isRedBull) {
              // If it's Red Bull, show flavor selection modal
              console.log('Showing Red Bull modal for:', d.name);
              showRedBullFlavorModal(d.name, (selectedFlavor) => {
                console.log('Selected Red Bull flavor:', selectedFlavor);
                addDishToTable(null, selectedFlavor);
              });
            } else if (isTea && dishChainSettings.tea) {
              // NEW: If it's tea with code 59, show tea addons modal
              console.log('Showing Tea Addons modal for:', d.name);
              showTeaAddonsModal(d.name, (result) => {
                if (!result) {
                  // User cancelled
                  return;
                }
                
                console.log('Selected tea:', result.teaType, 'with addons:', result.addons);
                
                // Initialize table orders if not exists
                if (!tableOrders[tableNumber]) {
                  tableOrders[tableNumber] = [];
                }
                
                // Add the specific tea type to the order (not the generic name)
                const teaOrder = {
                  id: uuid(),
                  itemName: result.teaType,
                  quantity: parseInt(quantity.textContent),
                  price: d.price,
                  calculatedPrice: calculatePrice(d.price, d.category),
                  composition: d.composition ? d.composition.slice(0, 3).join(', ') : '',
                  allergens: d.allergens ? d.allergens.slice(0, 3).join(', ') : '',
                  rkeeper: d.R_keeper,
                  notes: notesInput.value,
                  createdAt: Date.now(),
                  addedAt: Date.now(),
                  category: d.category || '',
                  source: d.source || 'bar'
                };
                
                tableOrders[tableNumber].unshift(teaOrder);
                lastAddedDishId = teaOrder.id;
                
                // Add selected addons as linked items (free)
                result.addons.forEach(addon => {
                  const addonOrder = {
                    id: uuid(),
                    itemName: addon,
                    quantity: 1,
                    price: '0 рублей',
                    calculatedPrice: 0,
                    linkedTo: lastAddedDishId,
                    addonType: 'extra',
                    createdAt: Date.now(),
                    addedAt: Date.now()
                  };
                  tableOrders[tableNumber].push(addonOrder);
                });
                
                saveTableOrders();
                renderTableOrders();
                
                // Update counter
                const chip = panelMenu.querySelector('.chip');
                if (chip) {
                  chip.textContent = `Заказов в столе: ${tableOrders[tableNumber].length}`;
                }
                
                // Show feedback
                addBtn.textContent = '✓ Добавлено';
                addBtn.disabled = true;
                setTimeout(() => {
                  addBtn.textContent = 'Добавить';
                  addBtn.disabled = false;
                }, 1000);
              });
            } else if (isTartare && dishChainSettings.tartare) {
              // NEW: If it's tartare, show tartare addons modal
              console.log('Showing Tartare Addons modal for:', d.name);
              showTartareAddonsModal(d.name, (addons) => {
                console.log('Selected tartare addons:', addons);
                addDishToTable(null, null);
                
                // Add selected addons as linked items
                addons.forEach(addon => {
                  const addonOrder = {
                    id: uuid(),
                    itemName: addon.name,
                    quantity: 1,
                    price: addon.price,
                    calculatedPrice: calculatePrice(addon.price, ''),
                    rkeeper: addon.rkeeper,
                    linkedTo: lastAddedDishId,
                    addonType: 'extra',
                    createdAt: Date.now(),
                    addedAt: Date.now()
                  };
                  tableOrders[tableNumber].push(addonOrder);
                });
                
                saveTableOrders();
                renderTableOrders();
              });
            } else if (isCocktail && dishChainSettings.cocktails?.double) {
              // NEW: If it's cocktail, show double portion modal
              console.log('Showing Cocktail Double modal for:', d.name);
              showCocktailDoubleModal(d.name, d.gramm, (isDouble) => {
                console.log('Is double portion:', isDouble);
                if (isDouble) {
                  addDishToTable(null, null, 2); // Add 2 portions
                } else {
                  addDishToTable(null, null);
                }
              });
            } else if (isVitello && dishChainSettings.vitello?.focaccia) {
              // NEW: If it's Vitello tonnato, show focaccia modal
              console.log('Showing Vitello Focaccia modal for:', d.name);
              showVitelloFocacciaModal(d.name, (focacciaName) => {
                console.log('Selected focaccia:', focacciaName);
                
                // Initialize table orders if not exists
                if (!tableOrders[tableNumber]) {
                  tableOrders[tableNumber] = [];
                }
                
                // Add Vitello tonnato
                const vitelloOrder = {
                  id: uuid(),
                  itemName: d.name,
                  quantity: parseInt(quantity.textContent),
                  price: d.price,
                  calculatedPrice: calculatePrice(d.price, d.category),
                  composition: d.composition ? d.composition.slice(0, 3).join(', ') : '',
                  allergens: d.allergens ? d.allergens.slice(0, 3).join(', ') : '',
                  rkeeper: d.R_keeper,
                  notes: notesInput.value,
                  createdAt: Date.now(),
                  addedAt: Date.now(),
                  category: d.category || '',
                  source: d.source || 'dishes'
                };
                
                tableOrders[tableNumber].unshift(vitelloOrder);
                lastAddedDishId = vitelloOrder.id;
                
                // Add focaccia if selected
                if (focacciaName) {
                  // Find focaccia in db.dishes by exact name
                  const focaccia = db.dishes.find(dish => dish.name === focacciaName);
                  
                  if (focaccia) {
                    const focacciaOrder = {
                      id: uuid(),
                      itemName: focaccia.name,
                      quantity: 1,
                      price: focaccia.price,
                      calculatedPrice: calculatePrice(focaccia.price, focaccia.category),
                      rkeeper: focaccia.R_keeper,
                      linkedTo: lastAddedDishId,
                      addonType: 'extra',
                      createdAt: Date.now(),
                      addedAt: Date.now()
                    };
                    tableOrders[tableNumber].push(focacciaOrder);
                  }
                }
                
                saveTableOrders();
                renderTableOrders();
                
                // Update counter
                const chip = panelMenu.querySelector('.chip');
                if (chip) {
                  chip.textContent = `Заказов в столе: ${tableOrders[tableNumber].length}`;
                }
                
                // Show feedback
                addBtn.textContent = '✓ Добавлено';
                addBtn.disabled = true;
                setTimeout(() => {
                  addBtn.textContent = 'Добавить';
                  addBtn.disabled = false;
                }, 1000);
              });
            } else if (isBeer && dishChainSettings.beer) {
              // NEW: If it's beer, show beer snacks modal
              console.log('Showing Beer Snacks modal for:', d.name);
              showBeerSnacksModal(d.name, (snacks) => {
                console.log('Selected beer snacks:', snacks);
                addDishToTable(null, null);
                
                // Add selected snacks as linked items
                snacks.forEach(snack => {
                  const snackOrder = {
                    id: uuid(),
                    itemName: snack.name,
                    quantity: 1,
                    price: snack.price,
                    calculatedPrice: calculatePrice(snack.price, ''),
                    rkeeper: snack.rkeeper,
                    linkedTo: lastAddedDishId,
                    addonType: 'extra',
                    createdAt: Date.now(),
                    addedAt: Date.now()
                  };
                  tableOrders[tableNumber].push(snackOrder);
                });
                
                saveTableOrders();
                renderTableOrders();
              });
            } else {
              // Check for custom chains
              let customChainTriggered = false;
              
              if (dishChainSettings.custom) {
                for (const [chainKey, chain] of Object.entries(dishChainSettings.custom)) {
                  // Check if chain is enabled and trigger dish matches
                  if (chain.enabled !== false && chain.triggerDish.rkeeper === d.R_keeper) {
                    console.log('Custom chain triggered:', chain.name);
                    customChainTriggered = true;
                    
                    // Show custom chain modal
                    showCustomChainModal(d, chain, tableNumber, () => {
                      // Refresh table orders after adding
                      renderTableOrders();
                    });
                    break;
                  }
                }
              }
              
              // If no custom chain triggered, add dish normally
              if (!customChainTriggered) {
                console.log('Adding dish without modal');
                addDishToTable(null, null);
              }
            }
          } // End of continueAddingDish
          
          minusBtn.addEventListener('click', () => {
            const currentQty = parseInt(quantity.textContent);
            if (currentQty > 1) {
              quantity.textContent = currentQty - 1;
            }
          });
          
          plusBtn.addEventListener('click', () => {
            const currentQty = parseInt(quantity.textContent);
            quantity.textContent = currentQty + 1;
          });
          
          frag.appendChild(row);
        });
        list.appendChild(frag);

        // Suggest best prefix match
        if (norm) {
          const best = dishes.find(d => normalize(d.name).startsWith(norm));
          if (best) {
            suggestNameEl.textContent = best.name;
            suggestEl.style.display = '';
            suggestBtn.onclick = () => {
              // Initialize table orders if not exists
              if (!tableOrders[tableNumber]) {
                tableOrders[tableNumber] = [];
              }
              // Add to specific table with full details (new items go to top)
              tableOrders[tableNumber].unshift({ 
                id: uuid(), 
                itemName: best.name, 
                quantity: 1, 
                price: best.price,
                calculatedPrice: calculatePrice(best.price, best.category),
                composition: best.composition ? best.composition.slice(0, 3).join(', ') : '',
                allergens: best.allergens ? best.allergens.slice(0, 3).join(', ') : '',
                rkeeper: best.R_keeper,
                notes: '',
                createdAt: Date.now(),
                addedAt: Date.now(),
                category: best.category || '' // Store category for sorting
              });
              saveTableOrders();
              // Don't auto-sort - user can press refresh button to sort by courses
              // Switch to table orders view
              renderTableOrders();
              // Update counter
              const chip = panelMenu.querySelector('.chip');
              if (chip) {
                chip.textContent = `Заказов в столе: ${tableOrders[tableNumber].length}`;
              }
              // Clear search and hide suggestion
              searchInput.value = '';
              suggestEl.style.display = 'none';
              
              // Keep focus on search input to continue adding dishes
              setTimeout(() => {
                searchInput.focus();
              }, 100);
            };
          } else {
            suggestEl.style.display = 'none';
          }
        } else {
          suggestEl.style.display = 'none';
        }
      }
      // Show table orders initially, not all dishes
      renderTableOrders();
      
      searchInput.addEventListener('input', (e) => {
        const v = (e.target.value || '').trim();
        if (v) {
          renderList(v);
        } else {
          renderTableOrders();
        }
      });
      // Enter adds suggestion
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && suggestEl.style.display !== 'none') { e.preventDefault(); suggestBtn.click(); }
      });
    }).catch(err => {
      console.error('Failed to load dishes:', err);
      const list = panelMenu.querySelector('#menu-list');
      list.innerHTML = `
        <div style="padding: 20px; text-align: center; color: var(--muted-foreground);">
          <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
          <h3>Ошибка загрузки меню</h3>
          <p>Не удалось загрузить файл dishes.json</p>
          <p style="font-size: 12px; color: var(--divider); margin-top: 8px;">
            ${err.message}
          </p>
          <button onclick="location.reload()" class="btn primary" style="margin-top: 16px;">
            Перезагрузить страницу
          </button>
        </div>
      `;
    });

    return wrapper;
  }

  // Extra dish selection modal (for adding extras like honey, mint, etc.)
  function showExtraDishModal(mainDish) {
    // Check if there are quick select options for this dish
    const quickExtras = EXTRA_DISHES_CONFIG.getQuickExtrasForDish(mainDish.itemName);
    
    if (quickExtras && quickExtras.length > 0) {
      // Show quick select modal
      showQuickExtraModal(mainDish, quickExtras);
    } else {
      // Show search modal
      showSearchExtraModal(mainDish);
    }
  }
  
  // Quick select modal for specific dishes (tea, coffee, etc.)
  function showQuickExtraModal(mainDish, quickExtras) {
    const modal = document.createElement('div');
    modal.className = 'rename-modal chain-modal';
    modal.innerHTML = `
      <div class="chain-content">
        <div class="chain-header">
          <h2 class="chain-title">Добавить к блюду</h2>
          <p class="chain-subtitle">${mainDish.itemName}</p>
        </div>
        
        <div class="chain-list-vertical">
          ${quickExtras.map(extra => `
            <button class="chain-list-btn" data-name="${extra.name}" data-rkeeper="${extra.rkeeper}" data-price="${extra.price}">
              <span class="chain-btn-emoji">${extra.emoji}</span>
              <span class="chain-btn-name">${extra.name}</span>
              <span class="chain-btn-price">${extra.price} ₽</span>
            </button>
          `).join('')}
        </div>
        
        <button class="chain-skip-btn" id="extra-search">Поиск других добавок</button>
        <button class="chain-skip-btn" id="extra-cancel" style="margin-top: 8px;">Отмена</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Extra dish selection
    modal.querySelectorAll('.chain-list-btn').forEach(item => {
      item.addEventListener('click', () => {
        const extra = {
          name: item.dataset.name,
          rkeeper: item.dataset.rkeeper,
          price: item.dataset.price
        };
        
        addExtraToTable(mainDish, extra);
        document.body.removeChild(modal);
      });
    });
    
    // Search button
    modal.querySelector('#extra-search').addEventListener('click', () => {
      document.body.removeChild(modal);
      showSearchExtraModal(mainDish);
    });
    
    // Cancel button
    modal.querySelector('#extra-cancel').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }
  
  // Search modal for all extras and dishes
  function showSearchExtraModal(mainDish) {
    const modal = document.createElement('div');
    modal.className = 'rename-modal chain-modal search-modal';
    modal.innerHTML = `
      <div class="chain-content">
        <div class="chain-header">
          <h2 class="chain-title">Поиск блюд</h2>
          <p class="chain-subtitle">К блюду: ${mainDish.itemName}</p>
        </div>
        
        <div class="search-box">
          <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input type="text" class="search-input-modern" id="extra-search-input" placeholder="Начните вводить название..." autocomplete="off" />
        </div>
        
        <div class="search-results" id="extra-results"></div>
        
        <button class="chain-skip-btn" id="extra-cancel">Отмена</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    const searchInput = modal.querySelector('#extra-search-input');
    const resultsContainer = modal.querySelector('#extra-results');
    
    // Combine extras and dishes for search
    function getAllSearchableItems() {
      const items = [];
      
      // Add extras from config
      EXTRA_DISHES_CONFIG.allExtras.forEach(extra => {
        items.push({
          type: 'extra',
          name: extra.name,
          rkeeper: extra.rkeeper,
          price: extra.price,
          emoji: extra.emoji,
          category: extra.category,
          image: null
        });
      });
      
      // Add dishes from database
      if (db && db.dishes) {
        db.dishes.forEach(dish => {
          items.push({
            type: 'dish',
            name: dish.name,
            rkeeper: dish.R_keeper || '—',
            price: dish.price || '—',
            emoji: null,
            category: dish.category,
            image: dish.image
          });
        });
      }
      
      return items;
    }
    
    const allItems = getAllSearchableItems();
    
    // Render search results
    function renderResults(items) {
      if (items.length === 0) {
        resultsContainer.innerHTML = `
          <div class="search-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <p>Ничего не найдено</p>
          </div>
        `;
        return;
      }
      
      // Group by category
      const grouped = {};
      items.forEach(item => {
        const cat = item.category || 'Другое';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(item);
      });
      
      let html = '';
      Object.keys(grouped).forEach(category => {
        html += `<div class="search-category-group">`;
        html += `<div class="search-category-title">${category}</div>`;
        html += `<div class="search-items-grid">`;
        
        grouped[category].forEach(item => {
          const displayEmoji = item.emoji || '🍽️';
          const displayPrice = item.price !== '—' ? `${item.price} ₽` : '';
          
          html += `
            <button class="search-item-card" 
                    data-type="${item.type}"
                    data-name="${item.name}" 
                    data-rkeeper="${item.rkeeper}" 
                    data-price="${item.price}"
                    data-image="${item.image || ''}">
              <div class="search-item-emoji">${displayEmoji}</div>
              <div class="search-item-info">
                <div class="search-item-name">${item.name}</div>
                ${displayPrice ? `<div class="search-item-price">${displayPrice}</div>` : ''}
              </div>
            </button>
          `;
        });
        
        html += `</div></div>`;
      });
      
      resultsContainer.innerHTML = html;
      attachSearchClickHandlers();
    }
    
    // Search functionality with debounce
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      
      clearTimeout(searchTimeout);
      
      if (query.length === 0) {
        resultsContainer.innerHTML = `
          <div class="search-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <p>Начните вводить для поиска</p>
          </div>
        `;
        return;
      }
      
      searchTimeout = setTimeout(() => {
        // Filter items by query
        const filtered = allItems.filter(item => 
          item.name.toLowerCase().includes(query) ||
          (item.category && item.category.toLowerCase().includes(query))
        );
        
        renderResults(filtered);
      }, 150);
    });
    
    // Item selection
    function attachSearchClickHandlers() {
      resultsContainer.querySelectorAll('.search-item-card').forEach(card => {
        card.addEventListener('click', () => {
          const item = {
            type: card.dataset.type,
            name: card.dataset.name,
            rkeeper: card.dataset.rkeeper,
            price: card.dataset.price,
            image: card.dataset.image
          };
          
          addExtraToTable(mainDish, item);
          document.body.removeChild(modal);
        });
      });
    }
    
    // Cancel button
    modal.querySelector('#extra-cancel').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
    
    // Show initial empty state
    resultsContainer.innerHTML = `
      <div class="search-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <p>Начните вводить для поиска</p>
      </div>
    `;
    
    // Focus search input
    setTimeout(() => searchInput.focus(), 100);
  }
  
  // Helper function to add extra to table and link it to main dish
  function addExtraToTable(mainDish, extra) {
    const tableNumber = parseInt(location.hash.split('/').pop());
    if (!tableOrders[tableNumber]) {
      tableOrders[tableNumber] = [];
    }
    
    // Find the main dish in the table orders
    const mainDishIndex = tableOrders[tableNumber].findIndex(order => order.id === mainDish.id);
    
    if (mainDishIndex !== -1) {
      // Create extra dish order
      const extraOrder = {
        id: uuid(),
        itemName: extra.name,
        quantity: 1,
        price: extra.price,
        calculatedPrice: extra.price,
        rkeeper: extra.rkeeper,
        notes: `К блюду: ${mainDish.itemName}`,
        createdAt: Date.now(),
        addedAt: Date.now(),
        category: 'Добавки',
        linkedTo: mainDish.id, // Link to main dish
        addonType: 'extra', // Mark as extra addon
        image: extra.image || null
      };
      
      // Insert extra right after the main dish
      tableOrders[tableNumber].splice(mainDishIndex + 1, 0, extraOrder);
    } else {
      // If main dish not found, add to top
      tableOrders[tableNumber].unshift({
        id: uuid(),
        itemName: extra.name,
        quantity: 1,
        price: extra.price,
        calculatedPrice: extra.price,
        rkeeper: extra.rkeeper,
        notes: `К блюду: ${mainDish.itemName}`,
        createdAt: Date.now(),
        addedAt: Date.now(),
        category: 'Добавки',
        addonType: 'extra',
        image: extra.image || null
      });
    }
    
    saveTableOrders();
    
    // Refresh the view
    render();
  }

  function render() {
    const hash = location.hash || '#/';
    root.innerHTML = '';
    
    if (hash.startsWith('#/table/')) {
      const id = Number(hash.split('/').pop());
      root.appendChild(viewTable(id));
    } else if (hash === '#/course-settings') {
      root.appendChild(viewCourseSettings());
    } else if (hash === '#/dish-chain-settings') {
      root.appendChild(viewDishChainSettings());
    } else if (hash === '#/stop-list') {
      if (typeof viewStopListSettings === 'function') {
        root.appendChild(viewStopListSettings());
      } else {
        console.error('viewStopListSettings is not defined!');
        root.innerHTML = '<div style="padding: 40px; text-align: center; color: white;"><h2>Ошибка загрузки стоп-листа</h2><p>Функция viewStopListSettings не найдена. Попробуйте обновить страницу (Ctrl+F5)</p></div>';
      }
    } else if (hash === '#/order-history') {
      root.appendChild(viewOrderHistory());
    } else if (hash === '#/about') {
      root.appendChild(viewAbout());
    } else if (hash === '#/pending-drinks') {
      root.appendChild(viewPendingDrinks());
    } else if (hash === '#/search-dishes') {
      root.appendChild(viewSearchDishes());
    } else if (hash === '#/positions') {
      root.appendChild(viewPositions());
    } else if (hash === '#/transfer-order') {
      root.appendChild(viewTransferOrder());
    } else if (hash === '#/restaurant-map') {
      root.appendChild(viewRestaurantMap());
    } else if (hash === '#/stop-list-view') {
      root.appendChild(viewStopListView());
    } else if (hash === '#/stop-list-edit') {
      root.appendChild(viewStopListEdit());
    } else if (hash === '#/admin-panel') {
      root.appendChild(viewAdminPanel());
    } else {
      // Show current page based on navigation
      switch (currentPage) {
        case 'users':
          root.appendChild(renderUsersPage());
          break;
        case 'stoplist':
          root.appendChild(renderStopListPage());
          break;
        case 'positions':
          root.appendChild(renderPositionsPage());
          break;
        case 'admin':
          root.appendChild(renderAdminPanel());
          break;
        case 'tools':
          root.appendChild(viewTools());
          break;
        case 'learn':
          root.appendChild(viewLearn());
          break;
        case 'profile':
          root.appendChild(viewProfile());
          break;
        case 'settings':
          root.appendChild(viewSettings());
          break;
        case 'tables':
        default:
          root.appendChild(viewHome());
          break;
      }
    }
  }

  // PWA install
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); deferredPrompt = e; installBtn.hidden = false;
  });
  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return; installBtn.disabled = true;
    await deferredPrompt.prompt(); await deferredPrompt.userChoice; installBtn.hidden = true; installBtn.disabled = false; deferredPrompt = null;
  });
  if ('serviceWorker' in navigator) {
    const showUpdateBanner = (onReload) => {
      let banner = document.getElementById('sw-update-banner');
      if (!banner) {
        banner = document.createElement('div');
        banner.id = 'sw-update-banner';
        banner.style.position = 'fixed';
        banner.style.left = '12px';
        banner.style.right = '12px';
        banner.style.bottom = '16px';
        banner.style.zIndex = '9999';
        banner.style.background = 'var(--card-bg, #0f172a)';
        banner.style.color = '#fff';
        banner.style.borderRadius = '12px';
        banner.style.boxShadow = '0 8px 24px rgba(0,0,0,.35)';
        banner.style.padding = '12px 12px';
        banner.style.display = 'flex';
        banner.style.gap = '8px';
        banner.style.alignItems = 'center';
        banner.style.justifyContent = 'space-between';
        banner.innerHTML = `
          <span>Доступно обновление приложения</span>
          <div style="display:flex; gap:8px;">
            <button id="sw-update-reload" class="btn primary">Обновить</button>
            <button id="sw-update-dismiss" class="btn secondary">Позже</button>
          </div>
        `;
        document.body.appendChild(banner);
        banner.querySelector('#sw-update-dismiss').addEventListener('click', () => {
          banner.remove();
        });
      }
      const reloadBtn = banner.querySelector('#sw-update-reload');
      reloadBtn.onclick = () => onReload && onReload();
    };

    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').then((registration) => {
        // When a new SW is found
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New update available
                showUpdateBanner(() => {
                  // Ask SW to activate immediately, then reload
                  if (registration.waiting) {
                    registration.waiting.postMessage('SKIP_WAITING');
                  }
                });
              }
            }
          });
        });

        // Ensure page refreshes to use new SW after it takes control
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (refreshing) return;
          refreshing = true;
          window.location.reload();
        });
      }).catch(() => {});
    });
  }

  // Navigation handlers
  document.querySelectorAll('.nav-item, .nav-item-redesign').forEach(item => {
    item.addEventListener('click', () => {
      setPage(item.dataset.page);
    });
  });

  // Clear cache function
  window.clearCache = async () => {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log('Cache cleared');
      location.reload();
    }
  };
  
  // Force reload function
  window.forceReload = () => {
    location.reload(true);
  };

  // Image lightbox function - открытие изображения в полноэкранном режиме
  function showImageLightbox(imageSrc, imageAlt, dishName) {
    const lightbox = document.createElement('div');
    lightbox.className = 'image-lightbox';
    lightbox.innerHTML = `
      <div class="lightbox-backdrop"></div>
      <div class="lightbox-content">
        <img src="${imageSrc}" alt="${imageAlt || 'Изображение блюда'}" class="lightbox-image" />
        ${dishName ? `<button class="lightbox-details-btn" id="lightbox-details">Подробнее</button>` : ''}
      </div>
    `;
    
    document.body.appendChild(lightbox);
    
    // Кнопка "Подробнее" - открывает карточку блюда
    if (dishName) {
      const detailsBtn = lightbox.querySelector('#lightbox-details');
      if (detailsBtn) {
        detailsBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          // Закрываем lightbox
          lightbox.classList.add('closing');
          setTimeout(() => {
            if (document.body.contains(lightbox)) {
              document.body.removeChild(lightbox);
            }
          }, 200);
          
          // Показываем модальное окно с деталями блюда
          showDishDetailsModal(dishName);
        });
      }
    }
    
    // Закрытие по клику на backdrop или изображение
    lightbox.addEventListener('click', (e) => {
      // Не закрывать если клик по кнопке
      if (e.target.id === 'lightbox-details') return;
      
      lightbox.classList.add('closing');
      setTimeout(() => {
        if (document.body.contains(lightbox)) {
          document.body.removeChild(lightbox);
        }
      }, 200);
    });
    
    // Анимация появления
    requestAnimationFrame(() => {
      lightbox.classList.add('active');
    });
  }

  // Show dish details modal - модальное окно с полной информацией о блюде
  function showDishDetailsModal(dishName) {
    // Загружаем данные блюд
    loadDb().then(({dishes}) => {
      // Убираем прожарку из названия если есть
      let dishNameToSearch = dishName;
      const cookingLevels = [' - Rare', ' - Medium Rare', ' - Medium', ' - Medium Well', ' - Well Done', ' (Rare)', ' (Medium Rare)', ' (Medium)', ' (Medium Well)', ' (Well Done)'];
      for (const level of cookingLevels) {
        if (dishNameToSearch.endsWith(level)) {
          dishNameToSearch = dishNameToSearch.slice(0, -level.length);
          break;
        }
      }
      
      // Ищем блюдо в базе
      const dish = dishes.find(d => d.name === dishNameToSearch);
      
      if (!dish) {
        alert('Блюдо не найдено в базе данных');
        return;
      }
      
      // Создаем модальное окно
      const modal = document.createElement('div');
      modal.className = 'dish-details-modal';
      
      // Подготавливаем HTML с изображением
      let imageHTML = '';
      if (dish.image && dish.image !== '' && dish.image !== '-') {
        imageHTML = `
          <img src="${dish.image}" 
               alt="${dish.name}" 
               class="dish-detail-modal-image"
               onclick="showImageLightbox('${dish.image}', '${dish.name}')"
               onerror="this.style.display='none';" />
        `;
      } else {
        imageHTML = '<div class="dish-detail-image-placeholder">🍽️</div>';
      }
      
      modal.innerHTML = `
        <div class="dish-details-backdrop"></div>
        <div class="dish-details-content">
          <button class="dish-details-close" id="close-dish-details">✕</button>
          
          <div class="dish-detail-card">
            <div class="dish-detail-image">
              ${imageHTML}
            </div>
            
            <div class="dish-detail-header">
              <h3>${dish.name}</h3>
              <div class="dish-detail-price">${calculatePrice(dish.price, dish.category) || dish.price || '—'}</div>
            </div>
            
            <div class="dish-detail-info">
              <div class="dish-detail-section category-section">
                <strong>Категория:</strong> <span class="category-value">${dish.category || '—'}</span>
              </div>
              
              ${dish.gramm ? `
              <div class="dish-detail-section">
                <strong>Вес:</strong> ${dish.gramm}
              </div>
              ` : ''}
              
              ${dish.kbju ? `
              <div class="dish-detail-section">
                <strong>КБЖУ:</strong> ${dish.kbju}
              </div>
              ` : ''}
              
              ${dish.composition && dish.composition.length > 0 ? `
              <div class="dish-detail-section">
                <strong>Состав:</strong>
                <ul class="composition-list">
                  ${dish.composition.map(ingredient => `<li>${ingredient}</li>`).join('')}
                </ul>
              </div>
              ` : ''}
              
              ${dish.allergens && dish.allergens.length > 0 ? `
              <div class="dish-detail-section">
                <strong>Аллергены:</strong>
                <div class="allergens-list">
                  ${dish.allergens.map(allergen => `<span class="allergen-tag">${allergen}</span>`).join('')}
                </div>
              </div>
              ` : ''}
              
              ${dish.description && dish.description.length > 0 ? `
              <div class="dish-detail-section">
                <strong>Описание:</strong>
                <p class="dish-description">${dish.description.join(' ')}</p>
              </div>
              ` : ''}
              
              ${dish.R_keeper ? `
              <div class="dish-detail-section rkeeper-section">
                <strong>R_keeper:</strong> <span class="rkeeper-code">${dish.R_keeper}</span>
              </div>
              ` : ''}
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      // Закрытие модального окна
      const closeBtn = modal.querySelector('#close-dish-details');
      const backdrop = modal.querySelector('.dish-details-backdrop');
      
      const closeModal = () => {
        modal.classList.add('closing');
        setTimeout(() => {
          if (document.body.contains(modal)) {
            document.body.removeChild(modal);
          }
        }, 200);
      };
      
      closeBtn.addEventListener('click', closeModal);
      backdrop.addEventListener('click', closeModal);
      
      // Анимация появления
      requestAnimationFrame(() => {
        modal.classList.add('active');
      });
      
    }).catch(err => {
      console.error('Failed to load dish details:', err);
      alert('Ошибка загрузки данных блюда');
    });
  }

  // Confirmation modal functions
  function showConfirmModal(title, message, onConfirm, onCancel, confirmButtonText = 'Удалить') {
    const modal = document.createElement('div');
    modal.className = 'confirm-modal';
    modal.innerHTML = `
      <div class="confirm-content">
        <div class="confirm-title">${title}</div>
        <div class="confirm-message">${message}</div>
        <div class="confirm-actions">
          <button class="btn secondary" id="confirm-cancel">Отмена</button>
          <button class="btn danger" id="confirm-ok">${confirmButtonText}</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('#confirm-cancel').addEventListener('click', () => {
      document.body.removeChild(modal);
      if (onCancel) onCancel();
    });
    
    modal.querySelector('#confirm-ok').addEventListener('click', () => {
      document.body.removeChild(modal);
      if (onConfirm) onConfirm();
    });
  }

  // Todo mode table view
  function viewTableTodo(tableNumber) {
    const wrapper = document.createElement('div');
    wrapper.className = 'page';

    const panelMenu = document.createElement('section');
    panelMenu.className = 'panel';
    panelMenu.innerHTML = `
      <div class="panel-header">
        <div class="page-title">
          <h2>${getTableDisplayName(tableNumber)} - To-Do</h2>
        </div>
        <div class="panel-actions">
          <button id="btn-refresh" class="btn secondary" title="Обновить и отсортировать">🔄</button>
          <button id="btn-back" class="btn">Назад</button>
        </div>
      </div>
      <div class="todo-input-section">
        <div class="todo-input-row">
          <input id="todo-input" placeholder="Напишите название блюда" inputmode="text" />
          <button id="btn-add-todo" class="btn primary">Добавить</button>
        </div>
      </div>
      <div class="menu-list" id="todo-list"></div>
      <div class="bottom-bar">
        <span class="chip">Заказов в столе: ${tableOrders[tableNumber] ? tableOrders[tableNumber].reduce((sum, o) => sum + o.quantity, 0) : 0}</span>
      </div>
    `;
    wrapper.appendChild(panelMenu);

    panelMenu.querySelector('#btn-back').addEventListener('click', () => navigate('#/'));
    
    // Refresh button handler - sorts dishes by category
    panelMenu.querySelector('#btn-refresh').addEventListener('click', () => {
      sortTableOrdersByCategory(tableNumber);
      renderTodoList();
      
      // Update counter
      const totalItems = tableOrders[tableNumber] ? tableOrders[tableNumber].reduce((sum, o) => sum + o.quantity, 0) : 0;
      const chip = panelMenu.querySelector('.chip');
      if (chip) {
        chip.textContent = `Заказов в столе: ${totalItems}`;
      }
    });

    // Todo input handlers
    const todoInput = panelMenu.querySelector('#todo-input');
    const addBtn = panelMenu.querySelector('#btn-add-todo');
    const todoList = panelMenu.querySelector('#todo-list');
    
    // Add suggestions container for todo mode
    const suggestionsContainer = document.createElement('div');
    suggestionsContainer.className = 'search-suggestions';
    suggestionsContainer.id = 'todo-suggestions';
    suggestionsContainer.style.display = 'none';
    suggestionsContainer.innerHTML = '<div class="suggestions-list" id="todo-suggestions-list"></div>';
    
    // Insert suggestions container after todo input section
    const todoInputSection = panelMenu.querySelector('.todo-input-section');
    todoInputSection.parentNode.insertBefore(suggestionsContainer, todoInputSection.nextSibling);
    
    const suggestionsList = suggestionsContainer.querySelector('#todo-suggestions-list');
    let searchTimeout;
    let allDishes = [];

    function normalize(text) {
      return (text || '').toLowerCase().trim();
    }

    function findMatchingDishes(query) {
      if (!query || query.length < 2) return [];
      
      const normalizedQuery = normalize(query);
      const matches = [];
      
      // Добавляем гарниры и соусы для стейков к поиску
      const steakGarnishes = STEAK_GARNISHES.map(item => ({
        ...item,
        category: 'Гарниры',
        R_keeper: item.rkeeper,
        source: 'steak_garnish'
      }));
      
      const steakSauces = STEAK_SAUCES.map(item => ({
        ...item,
        category: 'Соусы',
        R_keeper: item.rkeeper,
        source: 'steak_sauce'
      }));
      
      // Объединяем все источники данных
      const allItems = [...allDishes, ...steakGarnishes, ...steakSauces];
      console.log('Search in table - Total searchable items:', allItems.length, '(dishes:', allDishes.length, 'garnishes:', steakGarnishes.length, 'sauces:', steakSauces.length, ')');
      
      allItems.forEach(item => {
        if (!item || !item.name) {
          console.warn('Invalid item object:', item);
          return;
        }
        
        const itemName = normalize(item.name);
        
        // Skip if already in matches
        if (matches.some(m => m.name === item.name)) return;
        
        // Exact match gets highest priority
        if (itemName === normalizedQuery) {
          matches.push({...item, matchType: 'exact', score: 100});
        }
        // Starts with query
        else if (itemName.startsWith(normalizedQuery)) {
          matches.push({...item, matchType: 'starts', score: 80});
        }
        // Contains query
        else if (itemName.includes(normalizedQuery)) {
          matches.push({...item, matchType: 'contains', score: 60});
        }
        // Word match - check if any word in item name starts with query
        else {
          const itemWords = itemName.split(' ');
          const queryWords = normalizedQuery.split(' ');
          
          for (let queryWord of queryWords) {
            for (let itemWord of itemWords) {
              if (itemWord.startsWith(queryWord) && queryWord.length > 1) {
                matches.push({...item, matchType: 'word', score: 40});
                break;
              }
            }
            if (matches.some(m => m.name === item.name)) break;
          }
        }
      });
      
      // Sort by score and return top 10
      const results = matches
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
        
      console.log('Search in table results:', results.length, 'matches for query:', query);
      if (results.length > 0) {
        console.log('First few results:', results.slice(0, 3).map(r => `${r.name} (${r.source || 'dish'})`));
      }
      
      return results;
    }
    
    function renderSuggestions(matches) {
      suggestionsList.innerHTML = '';
      
      if (matches.length === 0) {
        suggestionsContainer.style.display = 'none';
        return;
      }
      
      const frag = document.createDocumentFragment();
      
      matches.forEach(dish => {
        const suggestion = document.createElement('div');
        const inStopList = isInStopList(dish.name);
        suggestion.className = 'suggestion-item' + (inStopList ? ' in-stop-list' : '');
        suggestion.innerHTML = `
          ${inStopList ? '<div class="stop-list-overlay">БЛЮДО В СТОПЕ</div>' : ''}
          <div class="suggestion-content">
            <div class="suggestion-name">${dish.name}</div>
            <div class="suggestion-category">${dish.category || 'Без категории'}</div>
          </div>
          <div class="suggestion-price">${dish.price || '—'}</div>
        `;
        
        suggestion.addEventListener('click', () => {
          selectDish(dish);
        });
        
        frag.appendChild(suggestion);
      });
      
      suggestionsList.appendChild(frag);
      suggestionsContainer.style.display = 'block';
    }

    function selectDish(dish) {
      console.log('selectDish called for:', dish.name);
      
      // Check if dish is in stop list and show warning
      if (isInStopList(dish.name)) {
        showConfirmModal(
          'Блюдо в стоп-листе',
          `"${dish.name}" находится в стоп-листе. Всё равно добавить?`,
          () => {
            // Continue with adding the dish
            proceedWithSelectDish(dish);
          },
          null,
          'Добавить'
        );
        return;
      }
      
      proceedWithSelectDish(dish);
    }
    
    function proceedWithSelectDish(dish) {
      // Check if it's a steak that needs cooking level + chain
      const dishName = (dish.name || '').toLowerCase();
      const isSteakDish = isSteak(dish.name);
      
      // Check if it's ice cream
      const isIceCream = dish.name.toLowerCase().includes('мороженое') || 
                        dish.name.toLowerCase().includes('мороженное');
      
      // Check if it's juice assortment
      const isJuice = dishName.toLowerCase().includes('сок в ассортименте');
      
      // Check if it's Red Bull
      const isRedBull = dishName.toLowerCase().includes('рэд булл') || dishName.toLowerCase().includes('ред булл') || dishName.toLowerCase().includes('red bull');
      
      // NEW: Check if this is tea with code 59 (both green and black tea)
      const isTea = dish.R_keeper === '59';
      
      // NEW: Check if this is tartare (only beef tartare, not trout)
      const isTartare = dish.name === 'Тартар из говядины';
      
      // NEW: Check if this is cocktail with small volume
      const isCocktail = (dish.category === 'НА РОМЕ' || dish.category === 'НА ВОДКЕ' || dish.category === 'НА ВИСКИ' || 
                         dish.category === 'НА ДЖИНЕ' || dish.category === 'НА ТЕКИЛЕ' || dish.category === 'НА ИГРИСТОМ ВИНЕ' ||
                         dish.category === 'АВТОРСКИЕ' || dish.category === 'КЛАССИЧЕСКИЕ') && 
                        (dish.gramm === '200 мл' || dish.gramm === '250 мл' || dish.gramm === '300 мл');
      
      // NEW: Check if this is Vitello tonnato
      const isVitello = dish.name === 'Вителло тоннато';
      
      // NEW: Check if this is beer
      const isBeer = dish.category === 'ПИВО';
      
      console.log('Select dish check:', {
        name: dish.name,
        isSteakDish,
        isIceCream,
        isJuice,
        isRedBull,
        isTea,
        isTartare,
        isCocktail,
        isVitello,
        isBeer
      });
      
      if (isSteakDish) {
        console.log('Showing steak chain from suggestion');
        showSteakChain(dish, tableNumber, (steakOrder) => {
          if (!steakOrder) return; // Cancelled
          
          // Add steak chain in correct order
          addSteakChainToTable(tableNumber, dish, steakOrder);
          
          todoInput.value = '';
          suggestionsContainer.style.display = 'none';
          renderTodoList();
        });
      } else if (isIceCream) {
        console.log('Showing ice cream modal from suggestion');
        showIceCreamFlavorModal(dish.name, (selectedFlavors) => {
          console.log('Ice cream callback received:', selectedFlavors);
          addOrderToTable(tableNumber, dish, null, selectedFlavors);
          todoInput.value = '';
          suggestionsContainer.style.display = 'none';
          renderTodoList();
        });
      } else if (isJuice) {
        console.log('Showing juice modal from suggestion');
        showJuiceFlavorModal(dish.name, (selectedFlavor) => {
          addOrderToTable(tableNumber, dish, null, selectedFlavor);
          todoInput.value = '';
          suggestionsContainer.style.display = 'none';
          renderTodoList();
        });
      } else if (isRedBull) {
        console.log('Showing Red Bull modal from suggestion');
        showRedBullFlavorModal(dish.name, (selectedFlavor) => {
          addOrderToTable(tableNumber, dish, null, selectedFlavor);
          todoInput.value = '';
          suggestionsContainer.style.display = 'none';
          renderTodoList();
        });
      } else if (isTea && dishChainSettings.tea) {
        console.log('Showing Tea Addons modal from suggestion');
        showTeaAddonsModal(dish.name, (result) => {
          if (!result) {
            // User cancelled
            todoInput.value = '';
            suggestionsContainer.style.display = 'none';
            return;
          }
          
          // Initialize table orders if not exists
          if (!tableOrders[tableNumber]) {
            tableOrders[tableNumber] = [];
          }
          
          // Add the specific tea type (not the generic name)
          const teaOrder = {
            id: uuid(),
            itemName: result.teaType,
            quantity: 1,
            price: dish.price,
            calculatedPrice: calculatePrice(dish.price, dish.category),
            composition: dish.composition ? dish.composition.slice(0, 3).join(', ') : '',
            allergens: dish.allergens ? dish.allergens.slice(0, 3).join(', ') : '',
            rkeeper: dish.R_keeper,
            notes: '',
            createdAt: Date.now(),
            addedAt: Date.now(),
            category: dish.category || '',
            source: dish.source || 'bar'
          };
          
          tableOrders[tableNumber].unshift(teaOrder);
          const mainDishId = teaOrder.id;
          
          // Add selected addons as linked items (free)
          if (result.addons && result.addons.length > 0) {
            result.addons.forEach(addon => {
              const addonOrder = {
                id: uuid(),
                itemName: addon,
                quantity: 1,
                price: '0 рублей',
                calculatedPrice: 0,
                linkedTo: mainDishId,
                addonType: 'extra',
                createdAt: Date.now(),
                addedAt: Date.now()
              };
              tableOrders[tableNumber].push(addonOrder);
            });
          }
          
          saveTableOrders();
          todoInput.value = '';
          suggestionsContainer.style.display = 'none';
          renderTodoList();
        });
      } else if (isTartare && dishChainSettings.tartare) {
        console.log('Showing Tartare Addons modal from suggestion');
        showTartareAddonsModal(dish.name, (addons) => {
          addOrderToTable(tableNumber, dish, null, null);
          
          // Add selected addons as linked items
          if (addons && addons.length > 0) {
            const mainDishId = tableOrders[tableNumber][0].id;
            addons.forEach(addon => {
              const addonOrder = {
                id: uuid(),
                itemName: addon.name,
                quantity: 1,
                price: addon.price,
                calculatedPrice: calculatePrice(addon.price, ''),
                rkeeper: addon.rkeeper,
                linkedTo: mainDishId,
                addonType: 'extra',
                createdAt: Date.now(),
                addedAt: Date.now()
              };
              tableOrders[tableNumber].push(addonOrder);
            });
            saveTableOrders();
          }
          
          todoInput.value = '';
          suggestionsContainer.style.display = 'none';
          renderTodoList();
        });
      } else if (isCocktail && dishChainSettings.cocktails?.double) {
        console.log('Showing Cocktail Double modal from suggestion');
        showCocktailDoubleModal(dish.name, dish.gramm, (isDouble) => {
          if (isDouble) {
            addOrderToTable(tableNumber, dish, null, null, 2);
          } else {
            addOrderToTable(tableNumber, dish, null, null);
          }
          todoInput.value = '';
          suggestionsContainer.style.display = 'none';
          renderTodoList();
        });
      } else if (isVitello && dishChainSettings.vitello?.focaccia) {
        console.log('Showing Vitello Focaccia modal from suggestion');
        showVitelloFocacciaModal(dish.name, (focacciaName) => {
          // Initialize table orders if not exists
          if (!tableOrders[tableNumber]) {
            tableOrders[tableNumber] = [];
          }
          
          // Add Vitello tonnato
          const vitelloOrder = {
            id: uuid(),
            itemName: dish.name,
            quantity: 1,
            price: dish.price,
            calculatedPrice: calculatePrice(dish.price, dish.category),
            composition: dish.composition ? dish.composition.slice(0, 3).join(', ') : '',
            allergens: dish.allergens ? dish.allergens.slice(0, 3).join(', ') : '',
            rkeeper: dish.R_keeper,
            notes: '',
            createdAt: Date.now(),
            addedAt: Date.now(),
            category: dish.category || '',
            source: dish.source || 'dishes'
          };
          
          tableOrders[tableNumber].unshift(vitelloOrder);
          const mainDishId = vitelloOrder.id;
          
          // Add focaccia if selected
          if (focacciaName) {
            const focaccia = db.dishes.find(d => d.name === focacciaName);
            if (focaccia) {
              const focacciaOrder = {
                id: uuid(),
                itemName: focaccia.name,
                quantity: 1,
                price: focaccia.price,
                calculatedPrice: calculatePrice(focaccia.price, focaccia.category),
                rkeeper: focaccia.R_keeper,
                linkedTo: mainDishId,
                addonType: 'extra',
                createdAt: Date.now(),
                addedAt: Date.now()
              };
              tableOrders[tableNumber].push(focacciaOrder);
            }
          }
          
          saveTableOrders();
          todoInput.value = '';
          suggestionsContainer.style.display = 'none';
          renderTodoList();
        });
      } else if (isBeer && dishChainSettings.beer) {
        console.log('Showing Beer Snacks modal from suggestion');
        showBeerSnacksModal(dish.name, (snacks) => {
          addOrderToTable(tableNumber, dish, null, null);
          
          // Add selected snacks as linked items
          if (snacks && snacks.length > 0) {
            const mainDishId = tableOrders[tableNumber][0].id;
            snacks.forEach(snack => {
              const snackOrder = {
                id: uuid(),
                itemName: snack.name,
                quantity: 1,
                price: snack.price,
                calculatedPrice: calculatePrice(snack.price, ''),
                rkeeper: snack.rkeeper,
                linkedTo: mainDishId,
                addonType: 'extra',
                createdAt: Date.now(),
                addedAt: Date.now()
              };
              tableOrders[tableNumber].push(snackOrder);
            });
            saveTableOrders();
          }
          
          todoInput.value = '';
          suggestionsContainer.style.display = 'none';
          renderTodoList();
        });
      } else {
        // Add the dish to table directly
        addOrderToTable(tableNumber, dish);
        
        // Clear input and hide suggestions
        todoInput.value = '';
        suggestionsContainer.style.display = 'none';
        
        // Re-render the list
        renderTodoList();
      }
    }

    function addTodoItem() {
      console.log('=== addTodoItem called ===');
      const input = todoInput.value.trim();
      console.log('Input value:', input);
      if (!input) {
        console.log('Input is empty, returning');
        return;
      }

      // Try to find matching dish
      const matchingDish = findDishByName(input);
      console.log('Matching dish:', matchingDish);
      
      if (matchingDish) {
        console.log('Found dish:', matchingDish.name);
        
        // Check if it's a steak that needs cooking level + chain
        const dishNameLower = (matchingDish.name || '').toLowerCase();
        const isSteakDish = isSteak(matchingDish.name);
        
        // Check if it's ice cream
        const isIceCream = matchingDish.name.toLowerCase().includes('мороженое') || 
                          matchingDish.name.toLowerCase().includes('мороженное');
        
        // Check if it's juice assortment
        const isJuice = dishNameLower.includes('сок в ассортименте');
        
        // Check if it's Red Bull
        const isRedBull = dishNameLower.includes('рэд булл') || dishNameLower.includes('ред булл') || dishNameLower.includes('red bull');
        
        // Check if it's Green/Herbal tea
        const isGreenTea = dishNameLower.includes('зеленый и травяной листовой чай');
        
        // Check if it's Black/Fruit tea
        const isBlackTea = dishNameLower.includes('черный и фруктовый листовой чай');
        
        console.log('Is steak:', isSteakDish, 'Is ice cream:', isIceCream, 'Is juice:', isJuice, 'Is Red Bull:', isRedBull, 'Is Green Tea:', isGreenTea, 'Is Black Tea:', isBlackTea);
        
        if (isSteakDish) {
          console.log('Showing steak chain');
          showSteakChain(matchingDish, tableNumber, (steakOrder) => {
            if (!steakOrder) return;
            
            // Add steak chain in correct order
            addSteakChainToTable(tableNumber, matchingDish, steakOrder);
            
            todoInput.value = '';
            renderTodoList();
          });
        } else if (isIceCream) {
          console.log('Showing ice cream modal');
          showIceCreamFlavorModal(matchingDish.name, (selectedFlavors) => {
            addOrderToTable(tableNumber, matchingDish, null, selectedFlavors);
            todoInput.value = '';
            renderTodoList();
          });
        } else if (isJuice) {
          console.log('Showing juice modal');
          showJuiceFlavorModal(matchingDish.name, (selectedFlavor) => {
            addOrderToTable(tableNumber, matchingDish, null, selectedFlavor);
            todoInput.value = '';
            renderTodoList();
          });
        } else if (isRedBull) {
          console.log('Showing Red Bull modal');
          showRedBullFlavorModal(matchingDish.name, (selectedFlavor) => {
            addOrderToTable(tableNumber, matchingDish, null, selectedFlavor);
            todoInput.value = '';
            renderTodoList();
          });
        } else if (isGreenTea) {
          console.log('Showing Green Tea modal');
          showGreenTeaFlavorModal(matchingDish.name, (selectedFlavor) => {
            addOrderToTable(tableNumber, matchingDish, null, selectedFlavor);
            todoInput.value = '';
            renderTodoList();
          });
        } else if (isBlackTea) {
          console.log('Showing Black Tea modal');
          showBlackTeaFlavorModal(matchingDish.name, (selectedFlavor) => {
            addOrderToTable(tableNumber, matchingDish, null, selectedFlavor);
            todoInput.value = '';
            renderTodoList();
          });
        } else {
          addOrderToTable(tableNumber, matchingDish);
          todoInput.value = '';
          renderTodoList();
        }
      } else {
        // Create custom dish if not found
        const customDish = createCustomDish(input);
        addOrderToTable(tableNumber, customDish);
        todoInput.value = '';
        renderTodoList();
      }
    }

    function createCustomDish(name) {
      // Create a custom dish object for unknown items
      return {
        name: name,
        price: '—', // No price for custom dishes
        R_keeper: '—', // No R_keeper code for custom dishes
        category: 'Произвольное блюдо',
        composition: [],
        allergens: [],
        description: ['Блюдо добавлено вручную'],
        gramm: '—',
        kbju: '—',
        image: '-',
        isCustom: true // Flag to identify custom dishes
      };
    }

    function findDishByName(name) {
      if (!db || !db.dishes) {
        console.log('No dishes data available');
        return null;
      }
      
      const searchName = name.toLowerCase().trim();
      console.log('Searching for:', searchName);
      console.log('Available dishes count:', db.dishes.length);
      
      // Exact match first
      let match = db.dishes.find(dish => 
        dish.name.toLowerCase() === searchName
      );
      
      if (match) {
        console.log('Exact match found:', match.name);
        return match;
      }
      
      // Partial match (search term in dish name)
      match = db.dishes.find(dish => 
        dish.name.toLowerCase().includes(searchName)
      );
      
      if (match) {
        console.log('Partial match found:', match.name);
        return match;
      }
      
      // Reverse partial match (dish name in search term)
      match = db.dishes.find(dish => 
        searchName.includes(dish.name.toLowerCase())
      );
      
      if (match) {
        console.log('Reverse partial match found:', match.name);
        return match;
      }
      
      // Word match - split by spaces and find dishes containing any of the words
      const searchWords = searchName.split(' ').filter(w => w.length > 1);
      if (searchWords.length > 0) {
        match = db.dishes.find(dish => {
          const dishWords = dish.name.toLowerCase().split(' ');
          return searchWords.some(searchWord => 
            dishWords.some(dishWord => dishWord.includes(searchWord))
          );
        });
        
        if (match) {
          console.log('Word match found:', match.name);
          return match;
        }
      }
      
      // Character match - find dishes that start with the same characters
      match = db.dishes.find(dish => 
        dish.name.toLowerCase().startsWith(searchName)
      );
      
      if (match) {
        console.log('Character match found:', match.name);
        return match;
      }
      
      console.log('No match found for:', searchName);
      return null;
    }

    function showTodoNotFound(input) {
      const notFoundDiv = document.createElement('div');
      notFoundDiv.className = 'todo-not-found';
      notFoundDiv.innerHTML = `
        <div class="not-found-content">
          <div class="not-found-icon">❌</div>
          <div class="not-found-text">
            <strong>Блюдо не найдено</strong><br>
            "${input}" не найдено в меню
          </div>
          <button class="btn secondary" onclick="this.parentElement.parentElement.remove()">Закрыть</button>
        </div>
      `;
      
      todoList.appendChild(notFoundDiv);
      
      // Auto remove after 3 seconds
      setTimeout(() => {
        if (notFoundDiv.parentElement) {
          notFoundDiv.remove();
        }
      }, 3000);
    }

    function addOrderToTable(tableNum, dish, cookingLevel = null, iceCreamFlavors = null) {
      console.log('addOrderToTable called:', {
        dish: dish.name,
        cookingLevel,
        iceCreamFlavors
      });
      
      if (!tableOrders[tableNum]) {
        tableOrders[tableNum] = [];
      }
      
      // Check if it's a steak that needs cooking level in name
      const isSteakDish = isSteak(dish.name);
      
      let itemName = dish.name;
      if (isSteakDish && cookingLevel) {
        itemName = `${dish.name} (${cookingLevel})`;
      }
      
      const orderId = uuid();
      const order = {
        id: orderId,
        itemName: itemName,
        quantity: 1,
        price: dish.price || '—',
        calculatedPrice: calculatePrice(dish.price, dish.category), // Calculate price based on day/time
        rkeeper: dish.R_keeper || '—',
        composition: dish.composition && dish.composition.length > 0 ? dish.composition.join(', ') : '—',
        allergens: dish.allergens && dish.allergens.length > 0 ? dish.allergens.join(', ') : '—',
        notes: '',
        createdAt: Date.now(),
        addedAt: Date.now(),
        isCustom: dish.isCustom || false, // Flag for custom dishes
        cookingLevel: cookingLevel || null, // Store cooking level for steaks
        iceCreamFlavors: iceCreamFlavors || null, // Store ice cream flavors
        category: dish.category || '', // Store category for sorting
        source: dish.source || null, // Store source (bar/dishes) for filtering
        // Chain addon properties
        isChainAddon: dish.isChainAddon || false,
        parentId: dish.parentId || null,
        addonType: dish.addonType || null, // 'garnish' or 'sauce'
      };
      
      // Add new items to the top
      tableOrders[tableNum].unshift(order);
      saveTableOrders();
      // Don't auto-sort - user can press refresh button to sort by courses
      
      return orderId; // Return ID for chain linking
    }

    // Add steak chain in correct order: Steak -> Garnish -> Sauce
    function addSteakChainToTable(tableNum, steakDish, steakOrder) {
      if (!tableOrders[tableNum]) {
        tableOrders[tableNum] = [];
      }
      
      const chainId = uuid(); // Unique ID for this chain group
      const now = Date.now();
      
      // Create steak order - with or without cooking level
      const steakId = uuid();
      const steakName = steakOrder.cookingLevel 
        ? `${steakDish.name} (${steakOrder.cookingLevel})`
        : steakDish.name;
      
      const steakOrderObj = {
        id: steakId,
        itemName: steakName,
        quantity: 1,
        price: steakDish.price || '—',
        calculatedPrice: calculatePrice(steakDish.price, steakDish.category),
        rkeeper: steakDish.R_keeper || '—',
        composition: steakDish.composition && steakDish.composition.length > 0 ? steakDish.composition.join(', ') : '—',
        allergens: steakDish.allergens && steakDish.allergens.length > 0 ? steakDish.allergens.join(', ') : '—',
        notes: '',
        createdAt: now,
        addedAt: now,
        cookingLevel: steakOrder.cookingLevel || null,
        category: steakDish.category || '',
        source: steakDish.source || null, // Store source (bar/dishes)
        image: steakDish.image || '',
        // Chain properties
        chainId: chainId,
        isChainParent: true
      };
      
      // Build chain array in correct order
      const chainItems = [steakOrderObj];
      
      // Add garnish if selected
      if (steakOrder.garnish) {
        chainItems.push({
          id: uuid(),
          itemName: steakOrder.garnish.name,
          quantity: 1,
          price: steakOrder.garnish.price || '—',
          calculatedPrice: calculatePrice(steakOrder.garnish.price, 'Гарниры'),
          rkeeper: steakOrder.garnish.rkeeper || '—',
          composition: '—',
          allergens: '—',
          notes: '',
          createdAt: now + 1,
          addedAt: now + 1,
          category: 'Гарниры',
          image: steakOrder.garnish.image || '',
          // Chain properties
          chainId: chainId,
          isChainAddon: true,
          linkedTo: steakId, // Link to main steak
          addonType: 'garnish'
        });
      }
      
      // Add sauce if selected
      if (steakOrder.sauce) {
        chainItems.push({
          id: uuid(),
          itemName: steakOrder.sauce.name,
          quantity: 1,
          price: steakOrder.sauce.price || '—',
          calculatedPrice: calculatePrice(steakOrder.sauce.price, 'Соусы'),
          rkeeper: steakOrder.sauce.rkeeper || '—',
          composition: '—',
          allergens: '—',
          notes: '',
          createdAt: now + 2,
          addedAt: now + 2,
          category: 'Соусы',
          image: steakOrder.sauce.image || '',
          // Chain properties
          chainId: chainId,
          isChainAddon: true,
          linkedTo: steakId, // Link to main steak
          addonType: 'sauce'
        });
      }
      
      // Add chain to the beginning of orders (but in correct internal order)
      tableOrders[tableNum] = [...chainItems, ...tableOrders[tableNum]];
      saveTableOrders();
      
      return steakId;
    }

    function renderTodoList() {
      todoList.innerHTML = '';
      
      if (!tableOrders[tableNumber] || tableOrders[tableNumber].length === 0) {
        todoList.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--muted-foreground);">Заказов пока нет. Добавьте блюда выше</div>';
        return;
      }

      const frag = document.createDocumentFragment();
      
      // Group orders by category
      let lastCategoryGroup = null;
      
      // Track which orders are already processed (to avoid duplicates in chain groups)
      const processedOrders = new Set();
      
      tableOrders[tableNumber].forEach((order, index) => {
        // Skip if already processed as part of a chain
        if (processedOrders.has(order.id)) {
          return;
        }
        
        // Skip chain addons - they will be rendered with their parent
        if (order.isChainAddon && order.chainId) {
          return; // Will be rendered as part of chain group
        }
        
        // Debug: log order data including flavors
        if (order.iceCreamFlavors || order.cookingLevel) {
          console.log('Rendering order with special data:', {
            name: order.itemName,
            iceCreamFlavors: order.iceCreamFlavors,
            cookingLevel: order.cookingLevel
          });
        }
        
        const currentGroup = order._categoryGroup ?? getCategoryGroup(order);
        const categoryConfig = CATEGORY_CONFIG[currentGroup];
        const groupingEnabled = currentGroup && isCategoryGroupEnabled(currentGroup);
        
        // Add separator only for ENABLED category groups (skip for chain items)
        if (groupingEnabled && currentGroup && !order.chainId) {
          if (currentGroup !== lastCategoryGroup) {
            const separator = document.createElement('div');
            separator.className = 'category-separator';
            separator.innerHTML = `
              <div class="separator-line"></div>
              <div class="separator-text">${categoryConfig?.label || 'Категория'}</div>
              <div class="separator-line"></div>
            `;
            frag.appendChild(separator);
            lastCategoryGroup = currentGroup;
          }
        } else if (!order.chainId) {
          // Reset when hitting disabled categories (but not for chains)
          if (lastCategoryGroup !== null && lastCategoryGroup < 1000) {
            lastCategoryGroup = null;
          }
        }
        
        // Check if this order has linked items (garnish, sauce, extra)
        const linkedOrders = tableOrders[tableNumber].filter(o => o.linkedTo === order.id);
        
        if (linkedOrders.length > 0) {
          // Create chain group container
          const chainGroup = document.createElement('div');
          chainGroup.className = 'order-chain-group';
          
          // Add main dish
          chainGroup.appendChild(createTodoOrderElement(order));
          processedOrders.add(order.id);
          
          // Add linked items
          linkedOrders.forEach(linkedOrder => {
            chainGroup.appendChild(createTodoOrderElement(linkedOrder));
            processedOrders.add(linkedOrder.id);
          });
          
          frag.appendChild(chainGroup);
          return;
        }
        
        // SVG Icons
        const ICONS = {
          takeaway: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M18 6h-2V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6-2h2v2h-2V4zM6 20V8h12v12H6z"/></svg>`,
          rkeeper: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M17 1H7c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2zm0 18H7V5h10v14zm-5 3c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1z"/></svg>`,
          delivered: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`,
          delete: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`
        };

        const row = createTodoOrderElement(order);
        processedOrders.add(order.id);
        frag.appendChild(row);
      });
      
      todoList.appendChild(frag);
    }
    
    // Helper function to create todo order element
    function createTodoOrderElement(order) {
        // SVG Icons
        const ICONS = {
          takeaway: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M18 6h-2V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6-2h2v2h-2V4zM6 20V8h12v12H6z"/></svg>`,
          rkeeper: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M17 1H7c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2zm0 18H7V5h10v14zm-5 3c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1z"/></svg>`,
          delivered: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`,
          delete: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`
        };
        
        const row = document.createElement('div');
        row.className = 'dish-card';
        if (order.isTakeaway) row.classList.add('takeaway-order');
        
        // Add chain-addon-card class for garnish, sauce, or extra addons
        if (order.addonType === 'garnish' || order.addonType === 'sauce' || order.addonType === 'extra') {
          row.classList.add('chain-addon-card');
        }

        // Header with image placeholder and info
        const header = document.createElement('div');
        header.className = 'dish-header';

        // Find dish in database to get image
        // First, get base name - remove cooking level suffix if present
        let baseName = order.itemName;
        const cookingMatch = baseName.match(/^(.+)\s+\((Rare|Medium Rare|Medium|Medium Well|Well Done|Blue)\)$/i);
        if (cookingMatch) {
          baseName = cookingMatch[1];
        }
        
        // Find dish by base name or by rkeeper code
        let dishData = db?.dishes?.find(d => d.name === baseName);
        if (!dishData && order.rkeeper && order.rkeeper !== '—') {
          dishData = db?.dishes?.find(d => d.R_keeper === order.rkeeper);
        }
        
        let imgElement;
        if (dishData && dishData.image && dishData.image !== '-') {
          imgElement = document.createElement('img');
          imgElement.className = 'dish-image';
          imgElement.src = dishData.image;
          imgElement.alt = order.itemName;
          imgElement.onclick = (e) => {
            e.stopPropagation();
            showImageLightbox(dishData.image, order.itemName, order.itemName);
          };
          imgElement.onerror = function() {
            this.style.display = 'none';
            const placeholder = document.createElement('div');
            placeholder.className = 'dish-image-placeholder';
            this.parentNode.insertBefore(placeholder, this);
          };
        } else {
          imgElement = document.createElement('div');
          imgElement.className = 'dish-image-placeholder';
        }

        const headerContent = document.createElement('div');
        headerContent.className = 'dish-header-content';

        const title = document.createElement('h3');
        title.className = 'dish-title';
        title.textContent = order.itemName;
        
        // Add custom dish indicator
        if (order.isCustom) {
          title.style.fontStyle = 'italic';
          title.style.opacity = '0.8';
        }
        
        // Add strikethrough styling based on status
        if (order.status === 'rkeeper') {
          title.style.textDecoration = 'line-through';
          title.style.color = '#22c55e';
        } else if (order.status === 'served') {
          title.style.textDecoration = 'line-through';
          title.style.color = '#ef4444';
        }

        // Dish code (prominent)
        const codeEl = document.createElement('div');
        codeEl.className = 'dish-code';
        if (order.rkeeper && order.rkeeper !== '—') {
          codeEl.innerHTML = `<span class="dish-code-label">Код: </span><span class="dish-code-value">${order.rkeeper}</span>`;
        }

        // Cooking level (prominent)
        const cookingEl = document.createElement('div');
        cookingEl.className = 'dish-cooking-level';
        if (order.cookingLevel) {
          cookingEl.innerHTML = `<span class="cooking-level-label">Прожарка: </span><span class="cooking-level-value">${order.cookingLevel}</span>`;
        }

        // Ice cream flavors / juice / redbull display
        const flavorsEl = document.createElement('div');
        flavorsEl.className = 'dish-flavors';
        console.log('Order iceCreamFlavors check:', order.itemName, 'flavors:', order.iceCreamFlavors, 'type:', typeof order.iceCreamFlavors);
        if (order.iceCreamFlavors) {
          console.log('Adding flavors element for:', order.itemName);
          flavorsEl.innerHTML = `<span class="flavors-label">Вкус: </span><span class="flavors-value">${order.iceCreamFlavors}</span>`;
        }

        // Quantity controls
        const quantityControls = document.createElement('div');
        quantityControls.className = 'quantity-controls';

        const minusBtn = document.createElement('button');
        minusBtn.textContent = '−';
        minusBtn.className = 'btn quantity-btn';
        minusBtn.onclick = () => changeQuantity(order.id, -1);

        const quantity = document.createElement('span');
        quantity.textContent = order.quantity;
        quantity.className = 'quantity';

        const plusBtn = document.createElement('button');
        plusBtn.textContent = '+';
        plusBtn.className = 'btn quantity-btn';
        plusBtn.onclick = () => changeQuantity(order.id, 1);

        quantityControls.appendChild(minusBtn);
        quantityControls.appendChild(quantity);
        quantityControls.appendChild(plusBtn);

        headerContent.appendChild(title);
        if (order.rkeeper && order.rkeeper !== '—') headerContent.appendChild(codeEl);
        if (order.cookingLevel) headerContent.appendChild(cookingEl);
        if (order.iceCreamFlavors) headerContent.appendChild(flavorsEl);
        headerContent.appendChild(quantityControls);

        header.appendChild(imgElement);
        header.appendChild(headerContent);

        // Action icons row
        const actions = document.createElement('div');
        actions.className = 'dish-actions';

        const takeawayBtn = document.createElement('button');
        takeawayBtn.className = `action-btn takeaway${order.isTakeaway ? ' active' : ''}`;
        takeawayBtn.innerHTML = ICONS.takeaway;
        takeawayBtn.title = 'Навынос';
        takeawayBtn.onclick = () => toggleTakeaway(order.id);

        const rkeeperBtn = document.createElement('button');
        rkeeperBtn.className = `action-btn rkeeper${order.status === 'rkeeper' ? ' active' : ''}`;
        rkeeperBtn.innerHTML = ICONS.rkeeper;
        rkeeperBtn.title = 'Printed R_keeper';
        rkeeperBtn.onclick = () => toggleOrderStatus(order.id, 'rkeeper');

        const deliveredBtn = document.createElement('button');
        deliveredBtn.className = `action-btn delivered${order.status === 'served' ? ' active' : ''}`;
        deliveredBtn.innerHTML = ICONS.delivered;
        deliveredBtn.title = 'Вынесен';
        deliveredBtn.onclick = () => toggleOrderStatus(order.id, 'served');

        // Delete button removed - replaced with extra dish button
        // const deleteBtn = document.createElement('button');
        // deleteBtn.className = 'action-btn delete';
        // deleteBtn.innerHTML = ICONS.delete;
        // deleteBtn.title = 'Удалить';
        // deleteBtn.onclick = () => removeOrder(order.id);
        
        // Add extra dish button
        const extraDishBtn = document.createElement('button');
        extraDishBtn.className = 'action-btn extra-dish';
        extraDishBtn.innerHTML = '➕';
        extraDishBtn.title = 'Добавить доп. блюдо';
        extraDishBtn.onclick = () => showExtraDishModal(order);

        actions.appendChild(takeawayBtn);
        actions.appendChild(rkeeperBtn);
        actions.appendChild(deliveredBtn);
        actions.appendChild(extraDishBtn);

        // Notes field
        const notes = document.createElement('div');
        notes.className = 'dish-notes';
        const notesInput = document.createElement('textarea');
        notesInput.className = 'dish-notes-input';
        notesInput.placeholder = 'Заметка...';
        notesInput.value = order.notes || '';
        notesInput.rows = 1;
        notesInput.addEventListener('blur', () => {
          updateOrderNote(order.id, notesInput.value.trim());
        });
        notesInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            notesInput.blur();
          }
        });
        notes.appendChild(notesInput);

        row.appendChild(header);
        row.appendChild(actions);
        row.appendChild(notes);
        
        return row;
    }

    // Create a full dish card for chain addon (garnish/sauce)
    function createChainAddonRow(addon) {
      const ICONS = {
        takeaway: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M18 6h-2V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6-2h2v2h-2V4zM6 20V8h12v12H6z"/></svg>`,
        rkeeper: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M17 1H7c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2zm0 18H7V5h10v14zm-5 3c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1z"/></svg>`,
        delivered: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`,
        delete: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`
      };
      
      const addonLabel = addon.addonType === 'garnish' ? '+ Гарнир' : 
                         addon.addonType === 'sauce' ? '+ Соус' : 
                         '+ Добавка';
      
      const row = document.createElement('div');
      row.className = 'dish-card chain-addon-card';
      if (addon.isTakeaway) row.classList.add('takeaway-order');

      // Header
      const header = document.createElement('div');
      header.className = 'dish-header';

      // Try to get image from addon, or fallback to database lookup by rkeeper
      let addonImage = addon.image;
      if ((!addonImage || addonImage === '' || addonImage === '-') && addon.rkeeper && addon.rkeeper !== '—' && db && db.dishes) {
        const dishFromDb = db.dishes.find(d => d.R_keeper === addon.rkeeper);
        if (dishFromDb && dishFromDb.image) {
          addonImage = dishFromDb.image;
        }
      }

      // Image or placeholder
      let imgElement;
      if (addonImage && addonImage !== '' && addonImage !== '-') {
        imgElement = document.createElement('img');
        imgElement.className = 'dish-image';
        imgElement.src = addonImage;
        imgElement.alt = addon.itemName;
        imgElement.onclick = (e) => {
          e.stopPropagation();
          showImageLightbox(addonImage, addon.itemName, addon.itemName);
        };
        imgElement.onerror = function() {
          this.style.display = 'none';
          const placeholder = document.createElement('div');
          placeholder.className = 'dish-image-placeholder';
          this.parentNode.insertBefore(placeholder, this);
        };
      } else {
        imgElement = document.createElement('div');
        imgElement.className = 'dish-image-placeholder';
      }

      const headerContent = document.createElement('div');
      headerContent.className = 'dish-header-content';

      // Addon label
      const labelEl = document.createElement('div');
      labelEl.className = 'chain-addon-type-label';
      labelEl.textContent = addonLabel;

      const title = document.createElement('h3');
      title.className = 'dish-title';
      title.textContent = addon.itemName;
      
      if (addon.status === 'rkeeper') {
        title.style.textDecoration = 'line-through';
        title.style.color = '#22c55e';
      } else if (addon.status === 'served') {
        title.style.textDecoration = 'line-through';
        title.style.color = '#ef4444';
      }

      // Dish code
      const codeEl = document.createElement('div');
      codeEl.className = 'dish-code';
      if (addon.rkeeper && addon.rkeeper !== '—') {
        codeEl.innerHTML = `<span class="dish-code-label">Код: </span><span class="dish-code-value">${addon.rkeeper}</span>`;
      }

      // Quantity controls
      const quantityControls = document.createElement('div');
      quantityControls.className = 'quantity-controls';

      const minusBtn = document.createElement('button');
      minusBtn.textContent = '−';
      minusBtn.className = 'btn quantity-btn';
      minusBtn.onclick = () => changeQuantity(addon.id, -1);

      const quantity = document.createElement('span');
      quantity.textContent = addon.quantity;
      quantity.className = 'quantity';

      const plusBtn = document.createElement('button');
      plusBtn.textContent = '+';
      plusBtn.className = 'btn quantity-btn';
      plusBtn.onclick = () => changeQuantity(addon.id, 1);

      quantityControls.appendChild(minusBtn);
      quantityControls.appendChild(quantity);
      quantityControls.appendChild(plusBtn);

      headerContent.appendChild(labelEl);
      headerContent.appendChild(title);
      if (addon.rkeeper && addon.rkeeper !== '—') headerContent.appendChild(codeEl);
      headerContent.appendChild(quantityControls);

      header.appendChild(imgElement);
      header.appendChild(headerContent);

      // Action icons row
      const actions = document.createElement('div');
      actions.className = 'dish-actions';

      const takeawayBtn = document.createElement('button');
      takeawayBtn.className = `action-btn takeaway${addon.isTakeaway ? ' active' : ''}`;
      takeawayBtn.innerHTML = ICONS.takeaway;
      takeawayBtn.title = 'Навынос';
      takeawayBtn.onclick = () => toggleTakeaway(addon.id);

      const rkeeperBtn = document.createElement('button');
      rkeeperBtn.className = `action-btn rkeeper${addon.status === 'rkeeper' ? ' active' : ''}`;
      rkeeperBtn.innerHTML = ICONS.rkeeper;
      rkeeperBtn.title = 'Printed R_keeper';
      rkeeperBtn.onclick = () => toggleOrderStatus(addon.id, 'rkeeper');

      const deliveredBtn = document.createElement('button');
      deliveredBtn.className = `action-btn delivered${addon.status === 'served' ? ' active' : ''}`;
      deliveredBtn.innerHTML = ICONS.delivered;
      deliveredBtn.title = 'Вынесен';
      deliveredBtn.onclick = () => toggleOrderStatus(addon.id, 'served');

      // Delete button removed - replaced with extra dish button
      // const deleteBtn = document.createElement('button');
      // deleteBtn.className = 'action-btn delete';
      // deleteBtn.innerHTML = ICONS.delete;
      // deleteBtn.title = 'Удалить';
      // deleteBtn.onclick = () => removeOrder(addon.id);
      
      // Add extra dish button
      const extraDishBtn = document.createElement('button');
      extraDishBtn.className = 'action-btn extra-dish';
      extraDishBtn.innerHTML = '➕';
      extraDishBtn.title = 'Добавить доп. блюдо';
      extraDishBtn.onclick = () => showExtraDishModal(addon);

      actions.appendChild(takeawayBtn);
      actions.appendChild(rkeeperBtn);
      actions.appendChild(deliveredBtn);
      actions.appendChild(extraDishBtn);

      row.appendChild(header);
      row.appendChild(actions);
      
      return row;
    }

    function changeQuantity(orderId, delta) {
      const order = tableOrders[tableNumber].find(o => o.id === orderId);
      if (!order) return;
      
      order.quantity += delta;
      if (order.quantity <= 0) {
        removeOrder(orderId);
        return;
      }
      
      saveTableOrders();
      renderTodoList();
    }

    function removeOrder(orderId) {
      tableOrders[tableNumber] = tableOrders[tableNumber].filter(o => o.id !== orderId);
      saveTableOrders();
      renderTodoList();
    }

    function toggleOrderStatus(orderId, status) {
      const order = tableOrders[tableNumber].find(o => o.id === orderId);
      if (order) {
        // If clicking the same status, remove it (toggle off)
        if (order.status === status) {
          order.status = undefined;
        } else {
          // Set new status
          order.status = status;
        }
        // Sort by status: no status first, rkeeper in middle, served at bottom
        sortTableOrdersByStatus(tableNumber);
        saveTableOrders();
        renderTodoList();
      }
    }

    function toggleTakeaway(orderId) {
      const order = tableOrders[tableNumber].find(o => o.id === orderId);
      if (order) {
        order.isTakeaway = !order.isTakeaway;
        saveTableOrders();
        renderTodoList();
      }
    }

    function updateOrderNote(orderId, note) {
      const order = tableOrders[tableNumber].find(o => o.id === orderId);
      if (order) {
        order.notes = note || '';
        saveTableOrders();
      }
    }

    // Event listeners
    addBtn.addEventListener('click', addTodoItem);

    // Add search input handler for suggestions
    todoInput.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      
      // Clear previous timeout
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
      
      if (query.length < 2) {
        suggestionsContainer.style.display = 'none';
        return;
      }
      
      // Debounce search
      searchTimeout = setTimeout(() => {
        const matches = findMatchingDishes(query);
        renderSuggestions(matches);
      }, 150);
    });

    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
      if (!panelMenu.contains(e.target)) {
        suggestionsContainer.style.display = 'none';
      }
    });

    // Handle Enter key to select first suggestion or add item
    todoInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault(); // Prevent form submission
        const query = e.target.value.trim();
        if (query) {
          const matches = findMatchingDishes(query);
          if (matches.length > 0) {
            selectDish(matches[0]); // Select first match
            return;
          }
        }
        // If no suggestions, try to add the item
        addTodoItem();
      }
    });

    // Load dishes and initial render
    loadDb().then(({dishes}) => {
      allDishes = dishes;
      console.log('Loaded dishes for todo mode:', allDishes.length);
      renderTodoList();
    }).catch(error => {
      console.error('Failed to load dishes for todo mode:', error);
      todoList.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--danger);">Ошибка загрузки меню</div>';
    });

    return wrapper;
  }

  // Settings page
  function viewSettings() {
    const wrapper = document.createElement('div');
    wrapper.className = 'page settings-page-redesign';

    const isDarkMode = document.documentElement.classList.contains('dark');
    
    wrapper.innerHTML = `
      <h1 class="settings-title-redesign">Настройки</h1>
      
      <div class="settings-card-redesign">
        <div class="settings-row-redesign" id="dark-mode-toggle">
          <span class="settings-row-label">Тёмная тема</span>
          <div class="settings-toggle-redesign ${isDarkMode ? 'active' : ''}" id="dark-mode-switch">
            <div class="toggle-knob"></div>
          </div>
        </div>
        
      </div>
      
      <div class="settings-card-redesign">
        <div class="settings-row-redesign settings-row-clickable" id="order-history-btn">
          <div class="settings-row-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2">
              <path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2-3-2z"/>
              <line x1="8" y1="8" x2="16" y2="8"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
          </div>
          <div class="settings-row-content">
            <span class="settings-row-title">История заказов</span>
            <span class="settings-row-subtitle">Order History</span>
          </div>
          <div class="settings-row-arrow">›</div>
        </div>
        
        <div class="settings-row-redesign settings-row-clickable" id="course-settings-btn">
          <div class="settings-row-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M3 9h18"/>
              <path d="M9 21V9"/>
            </svg>
          </div>
          <div class="settings-row-content">
            <span class="settings-row-title">Настройка курсов</span>
            <span class="settings-row-subtitle">Course Settings</span>
          </div>
          <div class="settings-row-arrow">›</div>
        </div>
        
        <div class="settings-row-redesign settings-row-clickable" id="dish-chain-settings-btn">
          <div class="settings-row-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
          </div>
          <div class="settings-row-content">
            <span class="settings-row-title">Дополнительные продажи</span>
            <span class="settings-row-subtitle">Additional Sales</span>
          </div>
          <div class="settings-row-arrow">›</div>
        </div>
      </div>
      
      <div class="settings-card-redesign">
        <div class="settings-row-redesign settings-row-clickable" id="about-app-btn">
          <div class="settings-row-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
          </div>
          <div class="settings-row-content">
            <span class="settings-row-title">О приложении</span>
            <span class="settings-row-subtitle">About the App</span>
          </div>
          <div class="settings-row-arrow">›</div>
        </div>
        
        <div class="settings-row-redesign settings-row-clickable" id="feedback-btn">
          <div class="settings-row-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div class="settings-row-content">
            <span class="settings-row-title">Проблемы | Предложения</span>
            <span class="settings-row-subtitle">Feedback & Suggestions</span>
          </div>
          <div class="settings-row-arrow">›</div>
        </div>
      </div>
      
      <!-- AUTH DISABLED: Logout button removed
      <div class="settings-card-redesign" style="margin-top: 24px;">
        <button class="logout-btn" id="logout-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Выйти из аккаунта
        </button>
      </div>
      END AUTH DISABLED -->
    `;

    // Dark mode toggle
    const darkModeToggle = wrapper.querySelector('#dark-mode-toggle');
    const darkModeSwitch = wrapper.querySelector('#dark-mode-switch');
    darkModeToggle.addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('dark');
      darkModeSwitch.classList.toggle('active', isDark);
      saveDarkMode(isDark);
    });

    // Course settings button
    wrapper.querySelector('#course-settings-btn').addEventListener('click', () => {
      navigate('#/course-settings');
    });

    // Dish chain settings button
    wrapper.querySelector('#dish-chain-settings-btn').addEventListener('click', () => {
      navigate('#/dish-chain-settings');
    });

    // Order history button
    wrapper.querySelector('#order-history-btn').addEventListener('click', () => {
      navigate('#/order-history');
    });

    // About app button
    wrapper.querySelector('#about-app-btn').addEventListener('click', () => {
      navigate('#/about');
    });

    // Feedback button - opens Telegram
    wrapper.querySelector('#feedback-btn').addEventListener('click', () => {
      window.open('https://t.me/miraxa19', '_blank');
    });

    /* AUTH DISABLED: Logout button commented out
    // Logout button
    wrapper.querySelector('#logout-btn').addEventListener('click', () => {
      if (confirm('Вы уверены, что хотите выйти из аккаунта?')) {
        logout();
        showAuthOverlay();
      }
    });
    END AUTH DISABLED */

    return wrapper;
  }

  // About app page
  
  // ===== TAKEOUT DRINKS SLIDE-UP PANEL =====
  
  /**
   * Собирает невынесенные напитки по столам
   * @returns {Array<{tableNum: number, tableName: string, drinks: Array}>}
   */
  function getPendingDrinksByTable() {
    const pendingByTable = [];
    
    activeTables.forEach(tableNum => {
      const items = tableOrders[tableNum] || [];
      const pendingDrinks = items.filter(item => {
        return isBarItem(item) && item.status !== 'served';
      });
      
      if (pendingDrinks.length > 0) {
        pendingByTable.push({
          tableNum,
          tableName: getTableDisplayName(tableNum),
          drinks: pendingDrinks
        });
      }
    });
    
    return pendingByTable;
  }
  
  /**
   * Показывает выдвижную панель с невынесенными напитками
   */
  function showTakeoutDrinksPanel() {
    // Remove existing panel if any
    const existingOverlay = document.querySelector('.takeout-panel-overlay');
    const existingPanel = document.querySelector('.takeout-panel');
    if (existingOverlay) existingOverlay.remove();
    if (existingPanel) existingPanel.remove();
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'takeout-panel-overlay';
    document.body.appendChild(overlay);
    
    // Create panel
    const panel = document.createElement('div');
    panel.className = 'takeout-panel';
    
    // Get pending drinks data
    const pendingByTable = getPendingDrinksByTable();
    
    // Build content
    let contentHTML = '';
    if (pendingByTable.length === 0) {
      contentHTML = `
        <div class="takeout-panel-empty">
          <div class="takeout-panel-empty-icon">🍹</div>
          <p>Все напитки вынесены!</p>
        </div>
      `;
    } else {
      contentHTML = pendingByTable.map(({ tableNum, tableName, drinks }) => {
        const drinksList = drinks.map(d => `
          <div class="takeout-drink-item" data-order-id="${d.id}" data-table="${tableNum}">
            <div class="takeout-drink-info">
              <span class="takeout-drink-name">${d.itemName}</span>
              <span class="takeout-drink-qty">×${d.quantity}</span>
            </div>
            <button class="takeout-served-btn" data-order-id="${d.id}" data-table="${tableNum}">
              <span class="served-icon">✓</span>
            </button>
          </div>
        `).join('');
        
        return `
          <div class="takeout-table-section" data-table="${tableNum}">
            <div class="takeout-table-header" data-table="${tableNum}">
              <h3 class="takeout-table-name">${tableName}</h3>
              <span class="takeout-table-count">${drinks.length} напитков</span>
            </div>
            <div class="takeout-drinks-list">
              ${drinksList}
            </div>
          </div>
        `;
      }).join('');
    }
    
    panel.innerHTML = `
      <div class="takeout-panel-handle"></div>
      <div class="takeout-panel-header">
        <h2 class="takeout-panel-title">Напитки для выноса</h2>
      </div>
      <div class="takeout-panel-content">
        ${contentHTML}
      </div>
    `;
    
    document.body.appendChild(panel);
    
    // Close panel and update UI
    const closePanel = () => {
      // Clean up temporary _previousStatus fields
      activeTables.forEach(tableNum => {
        const orders = tableOrders[tableNum] || [];
        orders.forEach(order => {
          delete order._previousStatus;
        });
      });
      
      // Update takeout button visibility
      updateTakeoutButtonVisibility();
      
      panel.classList.remove('visible');
      overlay.classList.remove('visible');
      setTimeout(() => {
        panel.remove();
        overlay.remove();
      }, 300);
    };
    
    // Click on overlay to close
    overlay.addEventListener('click', closePanel);
    
    // Click on served button to toggle - changes apply immediately
    panel.querySelectorAll('.takeout-served-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const orderId = btn.dataset.orderId;
        const tableNum = parseInt(btn.dataset.table);
        const drinkItem = btn.closest('.takeout-drink-item');
        
        // Find the order in tableOrders
        const orders = tableOrders[tableNum] || [];
        const order = orders.find(o => o.id === orderId);
        if (!order) return;
        
        // Toggle served state - apply immediately
        if (drinkItem.classList.contains('served')) {
          // Undo - set status back to undefined/rkeeper
          drinkItem.classList.remove('served');
          btn.classList.remove('active');
          // Remove served status (set to previous state or undefined)
          if (order._previousStatus) {
            order.status = order._previousStatus;
            delete order._previousStatus;
          } else {
            delete order.status;
          }
        } else {
          // Mark as served - save previous status for undo
          drinkItem.classList.add('served');
          btn.classList.add('active');
          order._previousStatus = order.status;
          order.status = 'served';
        }
        
        // Save immediately
        saveTableOrders();
        
        // Update table count
        const tableSection = drinkItem.closest('.takeout-table-section');
        const allItems = tableSection.querySelectorAll('.takeout-drink-item');
        const servedItems = tableSection.querySelectorAll('.takeout-drink-item.served');
        const remainingCount = allItems.length - servedItems.length;
        const countSpan = tableSection.querySelector('.takeout-table-count');
        countSpan.textContent = `${remainingCount} напитков`;
      });
    });
    
    // Click on table header to navigate
    panel.querySelectorAll('.takeout-table-header').forEach(header => {
      header.addEventListener('click', () => {
        const tableNum = header.dataset.table;
        closePanel();
        setTimeout(() => {
          navigate(`#/table/${tableNum}`);
        }, 300);
      });
    });
    
    // Swipe down to close
    let startY = 0;
    let currentY = 0;
    const handle = panel.querySelector('.takeout-panel-handle');
    
    const onTouchStart = (e) => {
      startY = e.touches[0].clientY;
      currentY = startY;
      panel.style.transition = 'none';
    };
    
    const onTouchMove = (e) => {
      currentY = e.touches[0].clientY;
      const diff = currentY - startY;
      if (diff > 0) {
        panel.style.transform = `translateY(${diff}px)`;
      }
    };
    
    const onTouchEnd = () => {
      panel.style.transition = 'transform 0.3s ease';
      const diff = currentY - startY;
      if (diff > 100) {
        closePanel();
      } else {
        panel.style.transform = 'translateY(0)';
      }
    };
    
    handle.addEventListener('touchstart', onTouchStart);
    handle.addEventListener('touchmove', onTouchMove);
    handle.addEventListener('touchend', onTouchEnd);
    
    // Also allow swipe on the whole panel header
    const panelHeader = panel.querySelector('.takeout-panel-header');
    panelHeader.addEventListener('touchstart', onTouchStart);
    panelHeader.addEventListener('touchmove', onTouchMove);
    panelHeader.addEventListener('touchend', onTouchEnd);
    
    // Show panel with animation
    requestAnimationFrame(() => {
      overlay.classList.add('visible');
      panel.classList.add('visible');
    });
  }
  
  /**
   * Обновляет видимость кнопки "Напитки для выноса"
   */
  function updateTakeoutButtonVisibility() {
    const takeoutBtn = document.querySelector('#btn-takeout');
    if (!takeoutBtn) return;
    
    const pendingByTable = getPendingDrinksByTable();
    const hasPendingDrinks = pendingByTable.length > 0;
    
    if (hasPendingDrinks) {
      takeoutBtn.parentElement.classList.remove('hidden');
      takeoutBtn.parentElement.classList.add('bubble-in');
    } else {
      takeoutBtn.parentElement.classList.add('bubble-out');
      setTimeout(() => {
        takeoutBtn.parentElement.classList.add('hidden');
        takeoutBtn.parentElement.classList.remove('bubble-out');
      }, 300);
    }
  }
  
  // Pending drinks page - shows all unserved drinks grouped by table
  function viewPendingDrinks() {
    const wrapper = document.createElement('div');
    wrapper.className = 'page pending-drinks-page';

    const panel = document.createElement('section');
    panel.className = 'panel';
    
    // Header
    panel.innerHTML = `
      <div class="panel-header">
        <button class="back-btn" id="pending-drinks-back">‹</button>
        <h2 style="flex: 1; text-align: center; margin: 0;">Напитки для выноса</h2>
        <div style="width: 40px;"></div>
      </div>
    `;
    
    // Collect all pending drinks from all tables
    const pendingByTable = [];
    
    activeTables.forEach(tableNum => {
      const items = tableOrders[tableNum] || [];
      const pendingDrinks = items.filter(item => {
        return isBarItem(item) && item.status !== 'served';
      });
      
      if (pendingDrinks.length > 0) {
        pendingByTable.push({
          tableNum,
          tableName: getTableDisplayName(tableNum),
          drinks: pendingDrinks
        });
      }
    });
    
    // Content
    const content = document.createElement('div');
    content.className = 'pending-drinks-content';
    
    if (pendingByTable.length === 0) {
      content.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🍹</div>
          <p>Все напитки вынесены!</p>
        </div>
      `;
    } else {
      pendingByTable.forEach(({ tableNum, tableName, drinks }) => {
        const tableSection = document.createElement('div');
        tableSection.className = 'pending-table-section';
        
        const drinksList = drinks.map(d => `
          <div class="pending-drink-item">
            <span class="drink-name">${d.itemName}</span>
            <span class="drink-qty">×${d.quantity}</span>
          </div>
        `).join('');
        
        tableSection.innerHTML = `
          <div class="pending-table-header" data-table="${tableNum}">
            <h3>${tableName}</h3>
            <span class="drinks-count">${drinks.length} напитков</span>
          </div>
          <div class="pending-drinks-list">
            ${drinksList}
          </div>
        `;
        
        // Click on table header to go to that table
        tableSection.querySelector('.pending-table-header').addEventListener('click', () => {
          navigate(`#/table/${tableNum}`);
        });
        
        content.appendChild(tableSection);
      });
    }
    
    panel.appendChild(content);
    wrapper.appendChild(panel);
    
    // Back button handler
    wrapper.querySelector('#pending-drinks-back').addEventListener('click', () => {
      navigate('#/');
    });
    
    return wrapper;
  }

  function viewAbout() {
    const wrapper = document.createElement('div');
    wrapper.className = 'page';

    const panel = document.createElement('section');
    panel.className = 'panel';
    panel.innerHTML = `
      <div class="panel-header">
        <button class="back-btn" id="about-back">‹</button>
        <h2 style="flex: 1; text-align: center; margin: 0;">О приложении</h2>
        <div style="width: 40px;"></div>
      </div>
      
      <div class="settings-section">
        <div class="settings-item">
          <div class="settings-item-label">Версия</div>
          <div class="settings-item-value">${getAppVersion()}</div>
        </div>
        
        <div class="settings-item">
          <div class="settings-item-label">BullTeam PWA</div>
          <div class="settings-item-value">Система управления заказами</div>
        </div>
      </div>

      <div class="settings-section">
        <h3>Данные</h3>
        <div class="settings-item">
          <button id="clear-cache-btn" class="btn secondary">Очистить кэш</button>
        </div>
        
        <div class="settings-item">
          <button id="export-data-btn" class="btn secondary">Экспорт данных</button>
        </div>
        <div class="settings-item">
          <button id="import-data-btn" class="btn secondary">Импорт данных</button>
          <input type="file" id="import-file" accept="application/json" style="display:none;" />
        </div>
        
        <div class="settings-item">
          <button id="reset-app-btn" class="btn danger">Сбросить приложение</button>
        </div>
      </div>
    `;

    wrapper.appendChild(panel);

    // Back button
    wrapper.querySelector('#about-back').addEventListener('click', () => {
      navigate('#/settings');
    });

    // Event handlers
    wrapper.querySelector('#clear-cache-btn').addEventListener('click', () => {
      showConfirmModal(
        'Очистить кэш',
        'Это действие очистит все кэшированные данные и перезагрузит приложение. Продолжить?',
        () => {
          window.clearCache();
        }
      );
    });
    
    wrapper.querySelector('#export-data-btn').addEventListener('click', () => {
      const data = {
        tables: activeTables,
        orders: tableOrders,
        orderHistory,
        profile,
        meta,
        exportDate: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bullteam-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    const importBtn = wrapper.querySelector('#import-data-btn');
    const importFile = wrapper.querySelector('#import-file');
    importBtn.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', async () => {
      const file = importFile.files && importFile.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (Array.isArray(data.tables)) {
          const set = new Set(activeTables);
          data.tables.forEach(n => set.add(n));
          activeTables = Array.from(set).sort((a,b)=>a-b);
          saveTables();
        }
        if (data.orders && typeof data.orders === 'object') {
          tableOrders = { ...tableOrders, ...data.orders };
          saveTableOrders();
        }
        if (Array.isArray(data.orderHistory)) {
          const existing = new Set(orderHistory.map(h => `${h.table}-${h.closedAt}-${h.total}`));
          const merged = [...orderHistory];
          for (const h of data.orderHistory) {
            const key = `${h.table}-${h.closedAt}-${h.total}`;
            if (!existing.has(key)) merged.push(h);
          }
          orderHistory = merged.sort((a,b) => (a.closedAt||0) - (b.closedAt||0));
          saveOrderHistory();
        }
        if (data.profile && typeof data.profile === 'object') {
          profile = { ...profile, ...data.profile };
          saveProfile();
        }
        if (data.meta && typeof data.meta === 'object') {
          meta = { ...meta, ...data.meta };
          saveMeta();
        }
        alert('Импорт завершён');
        render();
      } catch (e) {
        alert('Ошибка импорта: ' + e.message);
      } finally {
        importFile.value = '';
      }
    });

    wrapper.querySelector('#reset-app-btn').addEventListener('click', () => {
      showConfirmModal(
        'Сбросить приложение',
        'Это действие удалит ВСЕ данные: столы, заказы, настройки. Действие необратимо! Продолжить?',
        () => {
          localStorage.clear();
          location.reload();
        }
      );
    });

    return wrapper;
  }

  // Course settings page
  function viewCourseSettings() {
    const wrapper = document.createElement('div');
    wrapper.className = 'page';

    const panel = document.createElement('section');
    panel.className = 'panel';
    panel.innerHTML = `
      <div class="panel-header">
        <button class="back-btn" id="course-settings-back">‹</button>
        <h2 style="flex: 1; text-align: center; margin: 0;">Настройка курсов</h2>
        <div style="width: 40px;"></div>
      </div>
      
      <div class="settings-section">
        <h3>Режим курсов</h3>
        <div class="settings-item">
          <div class="settings-item-label">Автоматические курсы</div>
          <div class="settings-toggle ${courseMode === 'auto' ? 'active' : ''}" id="course-mode-auto"></div>
        </div>
        <div class="settings-item">
          <div class="settings-item-label">Ручные курсы</div>
          <div class="settings-toggle ${courseMode === 'manual' ? 'active' : ''}" id="course-mode-manual"></div>
        </div>
      </div>
      
      <div class="settings-section" id="auto-course-settings" style="display: ${courseMode === 'auto' ? 'block' : 'none'};">
        <h3>Группировка блюд</h3>
        <div class="settings-item">
          <div class="settings-item-label">Напитки</div>
          <div class="settings-toggle ${categoryGrouping.drinks ? 'active' : ''}" data-category-toggle="drinks"></div>
        </div>
        <div class="settings-item">
          <div class="settings-item-label">Холодные блюда</div>
          <div class="settings-toggle ${categoryGrouping.cold ? 'active' : ''}" data-category-toggle="cold"></div>
        </div>
        <div class="settings-item">
          <div class="settings-item-label">Горячие блюда</div>
          <div class="settings-toggle ${categoryGrouping.hot ? 'active' : ''}" data-category-toggle="hot"></div>
        </div>
        <div class="settings-item">
          <div class="settings-item-label">Десерты</div>
          <div class="settings-toggle ${categoryGrouping.dessert ? 'active' : ''}" data-category-toggle="dessert"></div>
        </div>
      </div>
    `;

    wrapper.appendChild(panel);

    // Back button
    wrapper.querySelector('#course-settings-back').addEventListener('click', () => {
      navigate('#/settings');
    });

    // Course mode toggles
    const autoToggle = wrapper.querySelector('#course-mode-auto');
    const manualToggle = wrapper.querySelector('#course-mode-manual');
    const autoSettings = wrapper.querySelector('#auto-course-settings');
    
    autoToggle.addEventListener('click', () => {
      if (courseMode !== 'auto') {
        courseMode = 'auto';
        autoToggle.classList.add('active');
        manualToggle.classList.remove('active');
        autoSettings.style.display = 'block';
        saveCourseMode();
        reapplyCategoryGroupingToAllTables();
      }
    });
    
    manualToggle.addEventListener('click', () => {
      if (courseMode !== 'manual') {
        courseMode = 'manual';
        manualToggle.classList.add('active');
        autoToggle.classList.remove('active');
        autoSettings.style.display = 'none';
        saveCourseMode();
        reapplyCategoryGroupingToAllTables();
      }
    });

    // Category toggles (only for auto mode)
    wrapper.querySelectorAll('[data-category-toggle]').forEach(toggle => {
      const key = toggle.dataset.categoryToggle;
      toggle.addEventListener('click', () => {
        const currentValue = categoryGrouping[key] !== false;
        const nextValue = !currentValue;
        categoryGrouping[key] = nextValue;
        toggle.classList.toggle('active', nextValue);
        saveCategoryGrouping();
        reapplyCategoryGroupingToAllTables();
      });
    });
    
    return wrapper;
  }

  // Dish chain settings page
  // MOVED TO additional-sales-settings.js - не нужно дублировать здесь
  /*
  function viewDishChainSettings() {
    const wrapper = document.createElement('div');
    wrapper.className = 'page';

    const panel = document.createElement('section');
    panel.className = 'panel';
    panel.innerHTML = `
      <div class="panel-header">
        <button class="back-btn" id="dish-chain-back">‹</button>
        <h2 style="flex: 1; text-align: center; margin: 0;">Дополнительные продажи</h2>
        <div style="width: 40px;"></div>
      </div>
      
      <div class="settings-section">
        <p class="settings-description">Настройте автоматические предложения дополнительных блюд при добавлении в заказ</p>
      </div>
      
      <div class="settings-section chain-settings-section">
        <div class="chain-settings-card" id="steak-chain-card">
          <div class="chain-settings-header">
            <div class="chain-settings-icon">🥩</div>
            <div class="chain-settings-info">
              <span class="chain-settings-title">Стейки</span>
              <span class="chain-settings-subtitle">Прожарка → Гарнир → Соус</span>
            </div>
            <div class="chain-settings-arrow" id="steak-arrow">›</div>
          </div>
          
          <div class="chain-settings-body" id="steak-chain-body">
            <div class="chain-toggle-item">
              <div class="chain-toggle-info">
                <span class="chain-toggle-label">Прожарка</span>
                <span class="chain-toggle-desc">Выбор степени прожарки</span>
              </div>
              <div class="settings-toggle active disabled" data-chain-toggle="cooking">
                <span class="toggle-lock">🔒</span>
              </div>
            </div>
            
            <div class="chain-toggle-item">
              <div class="chain-toggle-info">
                <span class="chain-toggle-label">Гарнир</span>
                <span class="chain-toggle-desc">Предложение гарнира к стейку</span>
              </div>
              <div class="settings-toggle ${dishChainSettings.steaks.garnishes ? 'active' : ''}" data-chain-toggle="garnishes"></div>
            </div>
            
            <div class="chain-toggle-item">
              <div class="chain-toggle-info">
                <span class="chain-toggle-label">Соус</span>
                <span class="chain-toggle-desc">Предложение соуса к стейку</span>
              </div>
              <div class="settings-toggle ${dishChainSettings.steaks.sauces ? 'active' : ''}" data-chain-toggle="sauces"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    wrapper.appendChild(panel);

    // Back button
    wrapper.querySelector('#dish-chain-back').addEventListener('click', () => {
      navigate('#/settings');
    });

    // Steak chain card expand/collapse
    const steakCard = wrapper.querySelector('#steak-chain-card');
    const steakHeader = wrapper.querySelector('.chain-settings-header');
    const steakBody = wrapper.querySelector('#steak-chain-body');
    const steakArrow = wrapper.querySelector('#steak-arrow');
    
    steakHeader.addEventListener('click', () => {
      steakCard.classList.toggle('expanded');
      steakArrow.textContent = steakCard.classList.contains('expanded') ? '‹' : '›';
    });

    // Toggle handlers
    wrapper.querySelectorAll('[data-chain-toggle]').forEach(toggle => {
      const key = toggle.dataset.chainToggle;
      
      // Skip cooking - it's always required
      if (key === 'cooking') return;
      
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const currentValue = dishChainSettings.steaks[key] !== false;
        const nextValue = !currentValue;
        dishChainSettings.steaks[key] = nextValue;
        toggle.classList.toggle('active', nextValue);
        saveDishChainSettings();
      });
    });

    return wrapper;
  }
  */

  // Steak chain settings modal
  function showSteakChainSettingsModal() {
    const modal = document.createElement('div');
    modal.className = 'rename-modal';
    modal.innerHTML = `
      <div class="rename-content chain-settings-modal-content">
        <div class="rename-title">Цепочка стейков</div>
        <p class="chain-settings-modal-subtitle">Настройте какие шаги показывать при добавлении стейка</p>
        
        <div class="chain-settings-toggles">
          <div class="settings-item">
            <div class="settings-item-info">
              <div class="settings-item-label">Прожарка</div>
              <div class="settings-item-desc">Выбор степени прожарки</div>
            </div>
            <div class="settings-toggle active disabled" data-chain-toggle="cooking">
              <span class="toggle-lock">🔒</span>
            </div>
          </div>
          
          <div class="settings-item">
            <div class="settings-item-info">
              <div class="settings-item-label">Гарнир</div>
              <div class="settings-item-desc">Предложение гарнира к стейку</div>
            </div>
            <div class="settings-toggle ${dishChainSettings.steaks.garnishes ? 'active' : ''}" data-chain-toggle="garnishes"></div>
          </div>
          
          <div class="settings-item">
            <div class="settings-item-info">
              <div class="settings-item-label">Соус</div>
              <div class="settings-item-desc">Предложение соуса к стейку</div>
            </div>
            <div class="settings-toggle ${dishChainSettings.steaks.sauces ? 'active' : ''}" data-chain-toggle="sauces"></div>
          </div>
        </div>
        
        <div class="rename-actions">
          <button class="btn primary" id="chain-settings-close">Готово</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Toggle handlers
    modal.querySelectorAll('[data-chain-toggle]').forEach(toggle => {
      const key = toggle.dataset.chainToggle;
      
      // Skip cooking - it's always required
      if (key === 'cooking') return;
      
      toggle.addEventListener('click', () => {
        const currentValue = dishChainSettings.steaks[key] !== false;
        const nextValue = !currentValue;
        dishChainSettings.steaks[key] = nextValue;
        toggle.classList.toggle('active', nextValue);
        saveDishChainSettings();
      });
    });

    // Close button
    modal.querySelector('#chain-settings-close').addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    // Close on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }

  // OLD Stop list page - DEPRECATED, use viewStopListSettings from stop-list-settings.js
  // function viewStopList() {
  //   ... (закомментировано)
  // }

  // Order history page
  function viewOrderHistory() {
    const wrapper = document.createElement('div');
    wrapper.className = 'page';

    const panel = document.createElement('section');
    panel.className = 'panel';
    panel.innerHTML = `
      <div class="panel-header">
        <button class="back-btn" id="order-history-back">‹</button>
        <h2 style="flex: 1; text-align: center; margin: 0;">История заказов</h2>
        <div style="width: 40px;"></div>
      </div>
      
      <div class="settings-section" style="padding-top: 0;">
        <div class="settings-item">
          <input id="history-search" class="filter-input" placeholder="Поиск по названию стола или блюду" />
        </div>
      </div>
      
      <div id="history-list" class="order-history-list"></div>
    `;

    wrapper.appendChild(panel);

    // Back button
    wrapper.querySelector('#order-history-back').addEventListener('click', () => {
      navigate('#/settings');
    });

    // Render order history grouped by date
    const historySearch = wrapper.querySelector('#history-search');
    const historyList = wrapper.querySelector('#history-list');
    
    function renderHistory(filter = '') {
      const norm = (filter || '').toLowerCase().trim();
      const items = (orderHistory || []).slice().sort((a,b) => (b.closedAt||0) - (a.closedAt||0));
      const filtered = items.filter(h => {
        if (!norm) return true;
        const t = `${h.tableName || ''} ${h.table}`.toLowerCase();
        const hasDish = (h.items || []).some(i => (i.itemName || '').toLowerCase().includes(norm));
        return t.includes(norm) || hasDish;
      });

      if (filtered.length === 0) {
        historyList.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--muted-foreground);">Пока нет записей</div>';
        return;
      }

      // Group by date
      const groupedByDate = {};
      filtered.forEach(h => {
        const dt = h.closedAt || h.updatedAt || h.createdAt || Date.now();
        const d = new Date(dt);
        const dateKey = d.toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
        
        if (!groupedByDate[dateKey]) {
          groupedByDate[dateKey] = [];
        }
        groupedByDate[dateKey].push(h);
      });

      historyList.innerHTML = '';
      
      Object.entries(groupedByDate).forEach(([dateKey, orders]) => {
        const dateHeader = document.createElement('div');
        dateHeader.className = 'order-history-date-header';
        dateHeader.textContent = dateKey;
        historyList.appendChild(dateHeader);

        orders.forEach(h => {
          const row = document.createElement('div');
          row.className = 'history-row';
          const dt = h.closedAt || h.updatedAt || h.createdAt || Date.now();
          const d = new Date(dt);
          row.innerHTML = `
            <div class="history-card">
              <div class="history-row-main">
                <div class="history-title">${h.tableName || ('Стол ' + h.table)}</div>
                <div class="history-meta">${d.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})}</div>
                <div class="history-total">${h.total || 0} ₽</div>
              </div>
              <div class="history-items" style="display:none;">${(h.items||[]).map(i => `${i.itemName} ×${i.quantity}`).join(', ') || '—'}</div>
            </div>`;
          row.addEventListener('click', () => {
            const el = row.querySelector('.history-items');
            el.style.display = el.style.display === 'none' ? 'block' : 'none';
          });
          historyList.appendChild(row);
        });
      });
    }
    
    renderHistory('');
    historySearch.addEventListener('input', (e) => renderHistory(e.target.value));
    
    return wrapper;
  }

  // Profile page
  function viewProfile() {
    const wrapper = document.createElement('div');
    wrapper.className = 'profile-content';
    
    const metrics = computeMonthlyMetrics(new Date());
    const p = {
      name: profile.name || '',
      surname: profile.surname || '',
      role: profile.role || '',
      grade: profile.grade || '',
      location: profile.location || ''
    };
    const photoUrl = profile.photo ? `data:image/jpeg;base64,${profile.photo}` : null;
    const displayName = (p.surname && p.name) ? `${p.surname} ${p.name}` : (p.name || p.surname || 'Имя');
    
    // Форматируем грейд для отображения
    const gradeDisplay = p.grade ? `${p.grade} грейд` : '';
    const roleDisplay = translateRole(p.role);

    wrapper.innerHTML = `
      <div class="profile-header-compact">
        <div class="profile-avatar-wrapper">
          <div class="profile-avatar" id="profile-avatar">
            ${photoUrl ? `<img src="${photoUrl}" alt="Фото профиля" class="avatar-image" />` : '<span class="avatar-placeholder">&#128100;</span>'}
          </div>
          <label for="pf-photo" class="profile-photo-add-btn" title="Добавить фото">
            <span>&#128247;</span>
          </label>
          <input type="file" id="pf-photo" accept="image/*" style="display:none;" />
        </div>
        <div class="profile-name-display">${displayName}</div>
        <div class="profile-info-compact">
          <div class="profile-info-row">
            <span class="profile-info-label">Должность:</span>
            <span class="profile-info-value">${roleDisplay}</span>
          </div>
          ${gradeDisplay ? `
          <div class="profile-info-row">
            <span class="profile-info-label">Грейд:</span>
            <span class="profile-info-value">${gradeDisplay}</span>
          </div>
          ` : ''}
          ${p.location ? `
          <div class="profile-info-row">
            <span class="profile-info-label">Ресторан:</span>
            <span class="profile-info-value">${p.location}</span>
          </div>
          ` : ''}
        </div>
        <button id="edit-profile-btn" class="btn secondary profile-edit-btn">&#9998; Редактировать профиль</button>
      </div>

      <div class="panel" style="margin-top: 16px;">
        <div class="panel-header"><h2>Смены</h2></div>
        <div id="shifts-calendar-container"></div>
      </div>

      <div class="panel" style="margin-top: 12px;">
        <div class="panel-header"><h2>Продажи за месяц</h2></div>
        <div class="sales-stats-grid">
          <div class="sales-stat-card">
            <div class="sales-stat-value">${metrics.numTables}</div>
            <div class="sales-stat-label">Столов</div>
          </div>
          <div class="sales-stat-card sales-stat-clickable" id="revenue-card">
            <div class="sales-stat-value">${formatMoney(metrics.revenue)}</div>
            <div class="sales-stat-label">Выручка &rsaquo;</div>
          </div>
          <div class="sales-stat-card">
            <div class="sales-stat-value">${formatMoney(metrics.averageCheck)}</div>
            <div class="sales-stat-label">Средний чек</div>
          </div>
        </div>
        <div class="top-dishes-section">
          <div class="top-dishes-title">&#127942; Топ-3 блюда</div>
          <div class="top-dishes-list">
            ${metrics.top3.length > 0 ? metrics.top3.map((t, i) => `
              <div class="top-dish-item">
                <div class="top-dish-rank">${i === 0 ? '&#129351;' : i === 1 ? '&#129352;' : '&#129353;'}</div>
                <div class="top-dish-name">${t.name}</div>
                <div class="top-dish-count">&times;${t.qty}</div>
              </div>
            `).join('') : '<div class="top-dishes-empty">Нет данных о продажах</div>'}
          </div>
        </div>
      </div>
    `;
    
    // Special handlers for table mode toggles - DISABLED
    // const searchModeToggle = wrapper.querySelector('#search-mode-toggle');
    // const todoModeToggle = wrapper.querySelector('#todo-mode-toggle');
    
    // Set initial state - DISABLED
    // searchModeToggle.classList.toggle('active', tableMode === 'search');
    // todoModeToggle.classList.toggle('active', tableMode === 'todo');
    
    // searchModeToggle.addEventListener('click', () => {
    //   tableMode = 'search';
    //   searchModeToggle.classList.add('active');
    //   todoModeToggle.classList.remove('active');
    //   saveTableMode();
    // });
    
    // todoModeToggle.addEventListener('click', () => {
    //   tableMode = 'todo';
    //   todoModeToggle.classList.add('active');
    //   searchModeToggle.classList.remove('active');
    //   saveTableMode();
    // });
    
    // Photo upload handler
    const photoInput = wrapper.querySelector('#pf-photo');
    photoInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) {
        alert('Фото слишком большое (макс. 2 МБ)');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target.result.split(',')[1];
        profile.photo = base64;
        saveProfile();
        render();
      };
      reader.readAsDataURL(file);
    });

    // Edit profile button handler
    wrapper.querySelector('#edit-profile-btn').addEventListener('click', () => {
      showEditProfileModal();
    });

    // Initialize calendar
    initShiftsCalendar(wrapper.querySelector('#shifts-calendar-container'));
    
    // Revenue card click - show daily revenue
    wrapper.querySelector('#revenue-card').addEventListener('click', () => {
      showDailyRevenueModal();
    });
    
    return wrapper;
  }

  // Show edit profile modal
  function showEditProfileModal() {
    // Проверяем, может ли пользователь изменять грейд выше 2
    const canEditHighGrade = authSession && (authSession.role === 'manager' || authSession.role === 'admin');
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>Редактировать профиль</h2>
          <button class="modal-close" id="close-edit-modal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="profile-form-section">
            <div class="profile-section-title">Персональные данные</div>
            <div class="profile-form-field">
              <input id="edit-surname" value="${profile.surname || ''}" placeholder="Фамилия" />
            </div>
            <div class="profile-form-field">
              <input id="edit-name" value="${profile.name || ''}" placeholder="Имя" />
            </div>
          </div>
          <div class="profile-form-section">
            <div class="profile-section-title">Рабочая информация</div>
            <div class="profile-form-field">
              <select id="edit-grade" class="profile-select">
                <option value="" ${!profile.grade ? 'selected' : ''}>Выберите грейд</option>
                <option value="0" ${profile.grade === '0' ? 'selected' : ''}>0 Грейд - Стажер</option>
                <option value="1" ${profile.grade === '1' ? 'selected' : ''}>1 Грейд - Стажер-официант</option>
                <option value="2" ${profile.grade === '2' ? 'selected' : ''}>2 Грейд - Официант</option>
                ${canEditHighGrade ? `<option value="3" ${profile.grade === '3' ? 'selected' : ''}>3 Грейд - Старший официант</option>` : ''}
              </select>
              <small class="field-note">${canEditHighGrade ? 'Выберите грейд' : 'Грейд 3+ назначается менеджером'}</small>
            </div>
            <div class="profile-form-field">
              <input id="edit-location" value="${profile.location || ''}" placeholder="Место работы" readonly />
              <small class="field-note">Ресторан определяется при регистрации</small>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button id="cancel-edit" class="btn secondary">Отмена</button>
          <button id="save-edit" class="btn primary">&#128190; Сохранить</button>
        </div>
      </div>
    `;

    // Event handlers
    modal.querySelector('#close-edit-modal').addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    modal.querySelector('#cancel-edit').addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    modal.querySelector('#save-edit').addEventListener('click', async () => {
      const newName = modal.querySelector('#edit-name').value.trim();
      const newSurname = modal.querySelector('#edit-surname').value.trim();
      const newGrade = modal.querySelector('#edit-grade').value;

      // Ограничение на изменение грейда (только 0-2 для самостоятельного изменения)
      const currentGrade = parseInt(profile.grade) || 0;
      const requestedGrade = parseInt(newGrade) || 0;
      
      if (requestedGrade > 2 && currentGrade <= 2) {
        alert('Грейд 3 и выше может назначить только менеджер или администратор');
        return;
      }

      // Update local profile
      profile.name = newName;
      profile.surname = newSurname;
      profile.grade = newGrade;
      saveProfile();

      // Update in Backend API
      if (authSession && authSession.userId) {
        try {
          const updateData = {
            firstName: newName,
            lastName: newSurname
          };
          
          // Добавляем grade только если он выбран и разрешен
          if (newGrade !== '' && requestedGrade <= 2) {
            updateData.grade = requestedGrade;
          }

          await apiClient.put('/users/profile', updateData);
          alert('Профиль успешно обновлен');
        } catch (err) {
          console.error('Error updating profile:', err);
          alert('Ошибка сохранения: ' + err.message);
        }
      }

      document.body.removeChild(modal);
      render(); // Refresh the profile page
    });

    // Close on background click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });

    document.body.appendChild(modal);
  }

  // Shifts calendar functions
  function initShiftsCalendar(container) {
    let currentDate = new Date();
    currentDate.setDate(1); // Start of month

    function renderCalendar() {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
      const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
      
      // Get first day of month and number of days
      let firstDay = new Date(year, month, 1).getDay();
      // Convert Sunday (0) to 7, then subtract 1 to make Monday = 0
      firstDay = firstDay === 0 ? 6 : firstDay - 1;
      
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const daysInPrevMonth = new Date(year, month, 0).getDate();
      
      let html = `
        <div class="calendar-header">
          <button class="calendar-nav-btn" id="calendar-prev">‹</button>
          <div class="calendar-month-year">${monthNames[month]} ${year}</div>
          <button class="calendar-nav-btn" id="calendar-next">›</button>
        </div>
        <div class="calendar-grid">
          <div class="calendar-days-header">
            ${dayNames.map(day => `<div class="calendar-day-header">${day}</div>`).join('')}
          </div>
          <div class="calendar-days">
      `;
      
      // Previous month days
      for (let i = firstDay - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        html += `<div class="calendar-day calendar-day-other">${day}</div>`;
      }
      
      // Current month days
      for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const shiftValue = shifts[dateKey] || 0;
        const isFullShift = shiftValue === 1;
        const isHalfShift = shiftValue === 0.5;
        const hasShift = isFullShift || isHalfShift;
        
        html += `
          <div class="calendar-day calendar-day-current ${hasShift ? 'calendar-day-has-shift' : ''}" 
               data-date="${dateKey}" 
               data-shift="${shiftValue}">
            <span class="calendar-day-number">${day}</span>
            ${isFullShift ? '<div class="calendar-shift-full"></div>' : ''}
            ${isHalfShift ? '<div class="calendar-shift-half"></div>' : ''}
          </div>
        `;
      }
      
      // Next month days (fill remaining cells to complete grid)
      const totalCells = firstDay + daysInMonth;
      const remainingCells = Math.ceil(totalCells / 7) * 7 - totalCells;
      for (let day = 1; day <= remainingCells; day++) {
        html += `<div class="calendar-day calendar-day-other">${day}</div>`;
      }
      
      html += `
          </div>
        </div>
        <div class="calendar-salary-btn-wrapper">
          <button id="btn-salary-calc" class="btn primary salary-calc-btn">🧮 Расчёт ЗП</button>
        </div>
        <div class="calendar-legend">
          <div class="calendar-legend-item">
            <div class="calendar-legend-box calendar-legend-full"></div>
            <span>Полная смена</span>
          </div>
          <div class="calendar-legend-item">
            <div class="calendar-legend-box calendar-legend-half"></div>
            <span>Пол смены</span>
          </div>
          <div class="calendar-legend-hint">Нажмите на дату для изменения смены</div>
        </div>
      `;
      
      container.innerHTML = html;
      
      // Event listeners
      container.querySelector('#calendar-prev').addEventListener('click', () => {
        currentDate.setMonth(month - 1);
        renderCalendar();
      });
      
      container.querySelector('#calendar-next').addEventListener('click', () => {
        currentDate.setMonth(month + 1);
        renderCalendar();
      });
      
      // Day click handlers
      container.querySelectorAll('.calendar-day-current').forEach(dayEl => {
        dayEl.addEventListener('click', () => {
          const dateKey = dayEl.dataset.date;
          const currentShift = shifts[dateKey] || 0;
          
          // Cycle: no shift -> half shift -> full shift -> no shift
          let newShift = 0;
          if (currentShift === 0) {
            newShift = 0.5;
          } else if (currentShift === 0.5) {
            newShift = 1;
          } else {
            newShift = 0;
          }
          
          if (newShift === 0) {
            delete shifts[dateKey];
          } else {
            shifts[dateKey] = newShift;
          }
          
          saveShifts();
          renderCalendar();
        });
      });
      
      // Salary calculator button handler
      const salaryBtn = container.querySelector('#btn-salary-calc');
      if (salaryBtn) {
        salaryBtn.addEventListener('click', () => {
          const metrics = computeMonthlyMetrics(new Date());
          showSalaryCalculatorModal(metrics.revenue);
        });
      }
    }
    
    renderCalendar();
  }

  // Navigation event handlers
  document.addEventListener('click', (e) => {
    if (e.target.closest('.nav-item')) {
      const navItem = e.target.closest('.nav-item');
      const page = navItem.dataset.page;
      if (page) {
        setPage(page);
      }
    }
  });

  // Tutorial system
  function startTutorial() {
    // Simplified tutorial - only essential steps
    const tutorialSteps = [
      // Navigation
      {
        selector: '.nav-item[data-page="tables"]',
        title: '🍽️ Столы',
        text: 'Главная страница для работы с заказами',
        position: 'top'
      },
      {
        selector: '.nav-item[data-page="tools"]',
        title: '�️ Инструменты',
        text: 'Поиск блюд, стоп-лист и другие инструменты',
        position: 'top'
      },
      {
        selector: '.nav-item[data-page="settings"]',
        title: '⚙️ Настройки',
        text: 'Тема, курсы подачи, история',
        position: 'top'
      },
      // Tables page
      {
        page: 'tables',
        selector: '.btn-add-table-redesign',
        title: '➕ Создать стол',
        text: 'Нажмите чтобы создать новый стол.\nВведите номер (например "11")',
        position: 'bottom'
      },
      // Settings
      {
        page: 'settings',
        selector: '#dark-mode-toggle',
        title: '🌙 Тёмная тема',
        text: 'Переключение светлой/тёмной темы',
        position: 'bottom'
      },
      {
        page: 'settings',
        selector: '#course-settings-btn',
        title: '📋 Курсы подачи',
        text: 'Настройка группировки блюд:\nНапитки → Холодные → Горячие → Десерты',
        position: 'bottom'
      },
      {
        page: 'tables',
        selector: '.table-card-redesign',
        title: '📋 Карточка стола',
        text: 'Каждая карточка показывает:\n• Номер/название стола\n• Время открытия\n• Количество заказов\n• Общую сумму\n\nНажмите на карточку чтобы открыть стол',
        position: 'bottom',
        optional: true
      },
      {
        page: 'tables',
        selector: '.table-rename-btn-redesign',
        title: '✏️ Переименовать стол',
        text: 'Дайте столу понятное название вместо номера.\n\nНапример: "Веранда 3" или "VIP зал"',
        position: 'left',
        optional: true
      },
      {
        page: 'tables',
        selector: '.table-clear-btn-redesign',
        title: '🗑️ Очистить стол',
        text: 'Удаляет все заказы из стола.\n\nВсе заказы автоматически сохраняются в историю, поэтому вы не потеряете данные.',
        position: 'left',
        optional: true
      },
      // 3. Profile page
      {
        page: 'profile',
        selector: '.profile-card',
        title: '👤 Ваш профиль',
        text: 'Нажмите чтобы изменить имя, должность и фото',
        position: 'bottom',
        optional: true
      },
      {
        page: 'profile',
        selector: '.shifts-calendar',
        title: '📅 Календарь смен',
        text: '1 клик = половина смены\n2 клика = полная смена\n3 клика = убрать',
        position: 'top',
        optional: true
      },
      {
        page: 'profile',
        selector: '.profile-stats',
        title: '📊 Статистика',
        text: 'Ваши продажи за месяц: столы, выручка, средний чек, топ блюд',
        position: 'top',
        optional: true
      },
      // 4. Inside table - most important!
      {
        route: 'table',
        selector: '.todo-input',
        title: '🔍 Поиск блюда',
        text: 'Введите название блюда (можно не полностью). Выберите из списка или нажмите Enter',
        position: 'bottom'
      },
      {
        route: 'table',
        selector: '.suggestion-item, .dish-row',
        title: '�  Выбор блюда',
        text: 'Нажмите на блюдо чтобы добавить его в заказ. Или нажмите красную кнопку "Добавить"',
        position: 'bottom',
        optional: true
      },
      {
        route: 'table',
        selector: '#btn-sort, #btn-refresh',
        title: '🔄 Сортировка по курсам',
        text: 'Нажмите чтобы отсортировать блюда:\n1. Напитки\n2. Холодные\n3. Горячие\n4. Десерты',
        position: 'bottom'
      },
      {
        route: 'table',
        selector: '.dish-card, .order-item',
        title: '🍽️ Карточка заказа',
        text: 'Показывает название, код R_keeper, цену и количество',
        position: 'bottom',
        optional: true
      },
      {
        route: 'table',
        selector: '.status-btn[data-status="rkeeper"], .action-btn-rkeeper',
        title: '📱 Внесён в R_keeper',
        text: 'Нажмите когда пробили блюдо в кассе. Заказ опустится вниз списка',
        position: 'top',
        optional: true
      },
      {
        route: 'table',
        selector: '.status-btn[data-status="served"], .action-btn-served',
        title: '✅ Вынесен гостю',
        text: 'Нажмите когда вынесли блюдо. Заказ уйдёт в самый низ',
        position: 'top',
        optional: true
      },
      {
        route: 'table',
        selector: '#btn-back',
        title: '← Назад',
        text: 'Вернуться к списку столов',
        position: 'bottom'
      },
      // 5. Settings
      {
        page: 'settings',
        selector: '#dark-mode-toggle',
        title: '🌙 Тёмная тема',
        text: 'Переключите для комфортной работы в темноте',
        position: 'bottom'
      },
      {
        page: 'settings',
        selector: '#course-settings-btn',
        title: '📋 Курсы подачи',
        text: 'Настройте группировку: напитки → холодные → горячие → десерты',
        position: 'bottom'
      },
      {
        page: 'settings',
        selector: '#order-history-btn',
        title: '📜 История',
        text: 'Все закрытые столы и заказы за последний месяц',
        position: 'bottom'
      }
    ];

    let currentStep = 0;

    function showStep(stepIndex) {
      // Remove existing elements
      document.querySelectorAll('.tutorial-overlay, .tutorial-highlight-tooltip').forEach(el => el.remove());

      if (stepIndex >= tutorialSteps.length) {
        showTutorialComplete();
        return;
      }

      const step = tutorialSteps[stepIndex];
      
      // Handle route-based navigation (for inside table view)
      if (step.route === 'table') {
        // Check if we're already inside a table
        const currentHash = window.location.hash;
        if (!currentHash.startsWith('#/table/')) {
          // Need to open a table first - find first available table
          const firstTable = activeTables[0];
          if (firstTable) {
            navigate(`#/table/${firstTable}`);
            setTimeout(() => showStepContent(step, stepIndex), 300);
          } else {
            // No tables exist, skip table steps
            currentStep++;
            showStep(currentStep);
          }
          return;
        }
        setTimeout(() => showStepContent(step, stepIndex), 100);
        return;
      }
      
      // Navigate to page if needed
      if (step.page && currentPage !== step.page) {
        setPage(step.page);
        setTimeout(() => showStepContent(step, stepIndex), 200);
      } else {
        showStepContent(step, stepIndex);
      }
    }

    function showStepContent(step, stepIndex) {
      const element = document.querySelector(step.selector);
      
      // Skip if element not found
      if (!element) {
        console.log(`Tutorial: Element not found for step ${stepIndex + 1}: ${step.selector}`);
        currentStep++;
        showStep(currentStep);
        return;
      }

      const rect = element.getBoundingClientRect();
      const padding = 8;
      const holeTop = rect.top - padding;
      const holeLeft = rect.left - padding;
      const holeWidth = rect.width + padding * 2;
      const holeHeight = rect.height + padding * 2;
      
      // Create overlay with SVG mask for the "hole" effect
      const overlay = document.createElement('div');
      overlay.className = 'tutorial-overlay';
      overlay.style.pointerEvents = 'none'; // Allow clicks through overlay
      overlay.innerHTML = `
        <svg class="tutorial-mask" width="100%" height="100%" style="position:fixed;top:0;left:0;pointer-events:auto;">
          <defs>
            <mask id="tutorial-hole-${stepIndex}">
              <rect width="100%" height="100%" fill="white"/>
              <rect x="${holeLeft}" y="${holeTop}" width="${holeWidth}" height="${holeHeight}" rx="10" fill="black"/>
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgba(0,0,0,0.85)" mask="url(#tutorial-hole-${stepIndex})" style="pointer-events:auto;"/>
        </svg>
        <div class="tutorial-highlight-ring" style="
          position: fixed;
          top: ${holeTop}px;
          left: ${holeLeft}px;
          width: ${holeWidth}px;
          height: ${holeHeight}px;
          border: 3px solid #dc2626;
          border-radius: 10px;
          box-shadow: 0 0 20px rgba(220, 38, 38, 0.5);
          pointer-events: none;
          animation: tutorial-ring-pulse 1.5s ease-in-out infinite;
        "></div>
      `;
      document.body.appendChild(overlay);
      
      // Make highlighted element clickable by increasing its z-index temporarily
      element.style.position = 'relative';
      element.style.zIndex = '10002';
      
      // Create tooltip
      const tooltip = document.createElement('div');
      tooltip.className = 'tutorial-highlight-tooltip';
      
      // Position tooltip
      const tooltipWidth = 260;
      let tooltipTop, tooltipLeft;
      const margin = 16;
      
      if (step.position === 'bottom') {
        tooltipTop = rect.bottom + margin;
        tooltipLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
      } else if (step.position === 'top') {
        tooltipTop = rect.top - margin - 120;
        tooltipLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
      } else if (step.position === 'left') {
        tooltipTop = rect.top;
        tooltipLeft = rect.left - tooltipWidth - margin;
      } else {
        tooltipTop = rect.top;
        tooltipLeft = rect.right + margin;
      }
      
      // Keep on screen
      tooltipLeft = Math.max(12, Math.min(tooltipLeft, window.innerWidth - tooltipWidth - 12));
      tooltipTop = Math.max(12, Math.min(tooltipTop, window.innerHeight - 150));
      
      tooltip.style.cssText = `
        position: fixed;
        top: ${tooltipTop}px;
        left: ${tooltipLeft}px;
        width: ${tooltipWidth}px;
        background: var(--card);
        border-radius: 12px;
        padding: 16px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        z-index: 10003;
        pointer-events: auto;
      `;
      
      tooltip.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <span style="font-size:11px;color:var(--muted-foreground);">${stepIndex + 1} / ${tutorialSteps.length}</span>
          <span style="font-size:15px;font-weight:700;color:var(--foreground);">${step.title}</span>
        </div>
        <div style="font-size:13px;color:var(--muted-foreground);line-height:1.5;margin-bottom:14px;white-space:pre-line;">${step.text}</div>
        <div style="display:flex;gap:8px;justify-content:space-between;">
          ${stepIndex > 0 ? '<button class="tut-btn tut-prev" style="padding:8px 12px;border:1px solid var(--border);background:var(--card);border-radius:8px;cursor:pointer;">←</button>' : '<div></div>'}
          <button class="tut-btn tut-skip" style="padding:8px 12px;border:1px solid var(--border);background:var(--card);border-radius:8px;cursor:pointer;color:var(--muted-foreground);font-size:12px;">Пропустить</button>
          <button class="tut-btn tut-next" style="padding:8px 16px;border:none;background:#dc2626;color:white;border-radius:8px;cursor:pointer;font-weight:600;">${stepIndex === tutorialSteps.length - 1 ? '✓ Готово' : 'Далее →'}</button>
        </div>
      `;
      
      document.body.appendChild(tooltip);
      
      // Event handlers
      tooltip.querySelector('.tut-next').onclick = (e) => {
        e.stopPropagation();
        // Reset element styles
        element.style.position = '';
        element.style.zIndex = '';
        currentStep++;
        showStep(currentStep);
      };
      tooltip.querySelector('.tut-skip').onclick = (e) => {
        e.stopPropagation();
        // Reset element styles
        element.style.position = '';
        element.style.zIndex = '';
        tooltip.remove();
        overlay.remove();
      };
      const prevBtn = tooltip.querySelector('.tut-prev');
      if (prevBtn) {
        prevBtn.onclick = (e) => {
          e.stopPropagation();
          // Reset element styles
          element.style.position = '';
          element.style.zIndex = '';
          currentStep--;
          showStep(currentStep);
        };
      }
      
      // Close tutorial when clicking on dark area (SVG rect)
      const svgRect = overlay.querySelector('rect[fill]');
      if (svgRect) {
        svgRect.style.cursor = 'pointer';
        svgRect.addEventListener('click', (e) => {
          e.stopPropagation();
          // Reset element styles
          element.style.position = '';
          element.style.zIndex = '';
          tooltip.remove();
          overlay.remove();
        });
      }
    }

    function showTutorialComplete() {
      const overlay = document.createElement('div');
      overlay.className = 'tutorial-overlay';
      overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.85);z-index:10000;display:flex;align-items:center;justify-content:center;';
      overlay.innerHTML = `
        <div style="background:var(--card);border-radius:16px;padding:32px;text-align:center;max-width:300px;">
          <div style="font-size:48px;margin-bottom:12px;">🎉</div>
          <div style="font-size:20px;font-weight:700;color:var(--foreground);margin-bottom:8px;">Обучение завершено!</div>
          <div style="font-size:14px;color:var(--muted-foreground);margin-bottom:20px;">Теперь вы знаете основные функции приложения</div>
          <button onclick="this.closest('.tutorial-overlay').remove()" style="padding:12px 32px;background:#dc2626;color:white;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Закрыть</button>
        </div>
      `;
      document.body.appendChild(overlay);
      overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    }

    showStep(0);
  }

  // Функция автоматического закрытия стола через URL параметры
  function checkAutoCloseTable() {
    const urlParams = new URLSearchParams(window.location.search);
    const closeTableParam = urlParams.get('close_table');
    
    if (closeTableParam) {
      const tableNumber = parseInt(closeTableParam);
      
      // Проверяем, что номер стола валидный
      if (isNaN(tableNumber) || tableNumber <= 0) {
        console.error('Неверный номер стола:', closeTableParam);
        alert('❌ Ошибка: неверный номер стола');
        // Очищаем URL
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }
      
      // Проверяем, существует ли стол
      const tableExists = activeTables.includes(tableNumber);
      const hasOrders = tableOrders[tableNumber] && tableOrders[tableNumber].length > 0;
      
      if (!tableExists) {
        console.log('Стол не найден:', tableNumber);
        alert(`ℹ️ Стол ${tableNumber} не найден или уже закрыт`);
        // Очищаем URL
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }
      
      if (!hasOrders) {
        console.log('Стол пустой:', tableNumber);
        alert(`ℹ️ Стол ${tableNumber} уже пустой`);
        // Очищаем URL
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }
      
      // Закрываем стол
      console.log('Автоматическое закрытие стола:', tableNumber);
      
      // Очищаем заказы
      tableOrders[tableNumber] = [];
      saveTableOrders();
      
      // Показываем уведомление
      const tableName = tableNames[tableNumber] || `Стол ${tableNumber}`;
      alert(`✅ ${tableName} успешно закрыт`);
      
      // Очищаем URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Перерисовываем интерфейс
      render();
      
      // Переходим на страницу столов
      setPage('tables');
    }
  }

  // init
  loadState();
  reapplyCategoryGroupingToAllTables();
  ensureMonthlyPurge(31);
  scheduleDailyCleanup(); // Автоматическая очистка столов в 23:50 МСК
  updateNavItems();
  
  // Проверяем URL на параметр автоматического закрытия стола
  checkAutoCloseTable();
  
  /* AUTH DISABLED: Auth initialization commented out
  // Initialize auth
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing auth form');
    initAuthForm();
  });
  
  // Если DOM уже загружен
  if (document.readyState === 'loading') {
    // DOM еще загружается, ждем события
  } else {
    // DOM уже загружен
    console.log('DOM already loaded, initializing auth form immediately');
    initAuthForm();
  }
  
  checkAuthOnStart().then(() => {
    // После авторизации загружаем стоп-лист с Backend
    if (isAuthenticated()) {
      loadStopListFromBackend();
    }
  });
  END AUTH DISABLED */
  
  render();
  
  // Скрываем индикатор загрузки после инициализации
  setTimeout(() => {
    const loader = document.getElementById('app-loader');
    if (loader) {
      loader.style.opacity = '0';
      loader.style.transition = 'opacity 0.3s ease';
      setTimeout(() => loader.remove(), 300);
    }
  }, 100);
})();