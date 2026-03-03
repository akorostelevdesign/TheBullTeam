/* Settings View - Главная страница настроек */
/* Версия: 1.63.0 */

// Main settings page
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
      
      <div class="settings-row-redesign settings-row-clickable" id="stop-list-btn">
        <div class="settings-row-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        <div class="settings-row-content">
          <span class="settings-row-title">Стоп-лист</span>
          <span class="settings-row-subtitle">Stop List</span>
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

  // Stop list button
  wrapper.querySelector('#stop-list-btn').addEventListener('click', () => {
    navigate('#/stop-list');
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
