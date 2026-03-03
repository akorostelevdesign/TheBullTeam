/* Stop List Settings - Управление стоп-листом */
/* Версия: 1.67 */

console.log('stop-list-settings.js v1.67 loaded');

// Stop list settings page
function viewStopListSettings() {
  console.log('=== viewStopListSettings called ===');
  console.log('stopList:', stopList);
  console.log('stopList length:', stopList.length);
  console.log('stopList type:', typeof stopList);
  console.log('stopList JSON:', JSON.stringify(stopList));
  console.log('localStorage stopList:', localStorage.getItem('waiter.stopList'));
  
  const wrapper = document.createElement('div');
  wrapper.className = 'page';

  const panel = document.createElement('section');
  panel.className = 'panel';
  panel.innerHTML = `
    <div class="panel-header">
      <button class="back-btn" id="stop-list-back">‹</button>
      <h2 style="flex: 1; text-align: center; margin: 0;">Стоп-лист</h2>
      <button class="btn danger" id="clear-stop-list" style="font-size: 12px; padding: 6px 10px;">Очистить</button>
    </div>
    
    <div class="settings-section">
      <p class="settings-description">Добавьте блюда, которых нет в наличии. Они будут помечены при добавлении в заказ</p>
      
      <!-- Search box -->
      <div class="stop-list-search-container">
        <div class="search-icon">🔍</div>
        <input 
          type="text" 
          class="stop-list-search-input" 
          id="stop-list-search" 
          placeholder="Поиск блюда для добавления в стоп-лист..."
        >
      </div>
      
      <!-- Search results -->
      <div class="stop-list-search-results" id="stop-list-search-results"></div>
    </div>
    
    <div class="settings-section">
      <h3 style="margin-bottom: 16px; color: var(--foreground); font-size: 18px; font-weight: 600;">
        Блюда в стоп-листе (<span id="stop-list-count">0</span>)
      </h3>
      <div class="stop-list-items" id="stop-list-items">
        <div class="empty-state">Стоп-лист пуст</div>
      </div>
    </div>
  `;

  wrapper.appendChild(panel);
  
  // Back button
  wrapper.querySelector('#stop-list-back').addEventListener('click', () => {
    window.location.hash = '#/settings';
  });
  
  // Clear all button
  wrapper.querySelector('#clear-stop-list').addEventListener('click', () => {
    if (stopList.length === 0) {
      alert('Стоп-лист уже пуст');
      return;
    }
    
    if (confirm('Удалить все блюда из стоп-листа?')) {
      stopList = [];
      saveStopList();
      renderStopList(wrapper);
      console.log('Stop list cleared');
    }
  });
  
  // Search input handler
  const searchInput = wrapper.querySelector('#stop-list-search');
  const searchResults = wrapper.querySelector('#stop-list-search-results');
  
  searchInput.addEventListener('input', async () => {
    const query = searchInput.value.trim().toLowerCase();
    
    if (query.length < 2) {
      searchResults.innerHTML = '';
      searchResults.style.display = 'none';
      return;
    }
    
    // Load database if not loaded
    if (!db || !db.dishes || db.dishes.length === 0) {
      console.log('Loading database...');
      try {
        await loadDb();
      } catch (error) {
        console.error('Error loading database:', error);
      }
    }
    
    // Check if db is loaded
    if (!db || !db.dishes || db.dishes.length === 0) {
      console.error('Database not loaded! db:', db);
      
      // Try to use window.DISHES_DATA directly
      if (typeof window.DISHES_DATA !== 'undefined' && window.DISHES_DATA.dishes) {
        console.log('Using window.DISHES_DATA directly');
        db = window.DISHES_DATA;
        
        // Add bar drinks if available
        if (typeof window.BAR_DRINKS_DATA !== 'undefined' && window.BAR_DRINKS_DATA.dishes) {
          db.dishes = [...db.dishes, ...window.BAR_DRINKS_DATA.dishes];
          console.log('Added bar drinks, total:', db.dishes.length);
        }
      } else {
        searchResults.innerHTML = '<div class="empty-state">Ошибка загрузки базы данных</div>';
        searchResults.style.display = 'block';
        return;
      }
    }
    
    console.log('Searching in', db.dishes.length, 'dishes');
    
    // Search in dishes
    const results = db.dishes.filter(dish => {
      // Exclude dishes already in stop list
      if (isInStopList(dish.name)) return false;
      return dish.name.toLowerCase().includes(query);
    }).slice(0, 10); // Limit to 10 results
    
    console.log('Found', results.length, 'results');
    
    if (results.length === 0) {
      searchResults.innerHTML = '<div class="empty-state">Ничего не найдено</div>';
      searchResults.style.display = 'block';
      return;
    }
    
    searchResults.innerHTML = results.map(dish => `
      <div class="stop-list-search-item" data-dish-name="${dish.name}" data-rkeeper="${dish.R_keeper}">
        <div class="stop-list-search-info">
          <span class="stop-list-search-name">${dish.name}</span>
          <span class="stop-list-search-category">${dish.category}</span>
        </div>
        <button class="stop-list-add-btn">
          <span>➕</span>
        </button>
      </div>
    `).join('');
    
    searchResults.style.display = 'block';
    
    // Add click handlers
    searchResults.querySelectorAll('.stop-list-search-item').forEach(item => {
      item.querySelector('.stop-list-add-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        const dishName = item.dataset.dishName;
        const rkeeper = item.dataset.rkeeper;
        
        // Add to stop list
        addToStopList(dishName, rkeeper);
        
        // Clear search
        searchInput.value = '';
        searchResults.innerHTML = '';
        searchResults.style.display = 'none';
        
        // Refresh list
        renderStopList(wrapper);
      });
    });
  });
  
  // Initial render
  renderStopList(wrapper);
  
  return wrapper;
}

// Add dish to stop list
function addToStopList(dishName, rkeeper) {
  console.log('Adding to stop list:', dishName, rkeeper);
  
  // Check if already in stop list
  if (isInStopList(dishName)) {
    console.log('Dish already in stop list');
    return;
  }
  
  // Add to stop list
  stopList.push({
    dishName: dishName,
    rkeeper: rkeeper,
    addedAt: Date.now()
  });
  
  console.log('Updated stop list:', stopList);
  saveStopList();
}

// Remove dish from stop list
function removeFromStopList(dishName) {
  console.log('Removing from stop list:', dishName);
  
  const nameLower = dishName.toLowerCase().trim();
  stopList = stopList.filter(item => {
    const itemName = typeof item === 'string' ? item : (item.dishName || item.name || '');
    return itemName.toLowerCase().trim() !== nameLower;
  });
  
  console.log('Updated stop list:', stopList);
  saveStopList();
}

// Render stop list items
function renderStopList(wrapper) {
  const container = wrapper.querySelector('#stop-list-items');
  const countEl = wrapper.querySelector('#stop-list-count');
  
  if (!stopList || stopList.length === 0) {
    container.innerHTML = '<div class="empty-state">Стоп-лист пуст</div>';
    countEl.textContent = '0';
    return;
  }
  
  countEl.textContent = stopList.length;
  
  container.innerHTML = stopList.map((item, index) => {
    const dishName = typeof item === 'string' ? item : (item.dishName || item.name || '');
    const rkeeper = typeof item === 'object' ? item.rkeeper : '';
    
    // Find dish in db for category
    const dish = db.dishes.find(d => d.name === dishName || d.R_keeper === rkeeper);
    const category = dish ? dish.category : '';
    
    return `
      <div class="stop-list-item" data-index="${index}">
        <div class="stop-list-item-icon">🚫</div>
        <div class="stop-list-item-info">
          <span class="stop-list-item-name">${dishName}</span>
          ${category ? `<span class="stop-list-item-category">${category}</span>` : ''}
        </div>
        <button class="stop-list-remove-btn" data-dish-name="${dishName}">
          <span>🗑️</span>
        </button>
      </div>
    `;
  }).join('');
  
  // Add remove handlers
  container.querySelectorAll('.stop-list-remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const dishName = btn.dataset.dishName;
      
      if (confirm(`Убрать "${dishName}" из стоп-листа?`)) {
        removeFromStopList(dishName);
        renderStopList(wrapper);
      }
    });
  });
}
