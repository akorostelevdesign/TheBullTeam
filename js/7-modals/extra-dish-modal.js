/* Extra Dish Modal - Добавление дополнительных блюд */
/* Версия: 1.63.0 */

// Main entry point for extra dish modal
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
      addonType: 'extra' // Mark as extra addon
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
      addonType: 'extra'
    });
  }
  
  saveTableOrders();
  
  // Refresh the view
  render();
}
