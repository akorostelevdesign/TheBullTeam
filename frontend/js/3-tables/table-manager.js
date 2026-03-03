/* Table Manager - Управление столами */
/* Версия: 1.63.0 */

// Get table display name (custom name or default "Стол N")
function getTableDisplayName(tableNumber) {
  return tableNames[tableNumber] || `Стол ${tableNumber}`;
}

// Compute total amount for a table
function computeTableTotalAmount(tableNum) {
  return computeItemsTotal(tableOrders[tableNum]);
}

// Compute total for array of items
function computeItemsTotal(items) {
  if (!Array.isArray(items)) return 0;
  return items.reduce((sum, item) => {
    const price = parseFloat(item.calculatedPrice || item.price || 0);
    const qty = parseInt(item.quantity || 1, 10);
    return sum + (price * qty);
  }, 0);
}

// Main tables view (home page)
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

// Table management modal (long press on table card)
function showTableManagementModal(tableNumber) {
  const modal = document.createElement('div');
  modal.className = 'rename-modal';
  
  const displayName = getTableDisplayName(tableNumber);
  const hasOrders = tableOrders[tableNumber] && tableOrders[tableNumber].length > 0;
  
  modal.innerHTML = `
    <div class="rename-content table-management-modal">
      <div class="rename-title">${displayName}</div>
      <div class="table-management-actions">
        <button class="table-action-btn" id="action-rename">
          <span class="action-icon">✏️</span>
          <span class="action-text">Переименовать</span>
        </button>
        <button class="table-action-btn" id="action-clear" ${!hasOrders ? 'disabled' : ''}>
          <span class="action-icon">🗑️</span>
          <span class="action-text">Очистить заказы</span>
        </button>
        <button class="table-action-btn danger" id="action-delete">
          <span class="action-icon">❌</span>
          <span class="action-text">Удалить стол</span>
        </button>
      </div>
      <button class="chain-skip-btn" id="action-cancel">Отмена</button>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Rename action
  modal.querySelector('#action-rename').addEventListener('click', () => {
    if (modal.querySelector('#action-rename').disabled) return;
    document.body.removeChild(modal);
    showRenameTableModal(tableNumber);
  });
  
  // Clear orders action
  modal.querySelector('#action-clear').addEventListener('click', () => {
    if (modal.querySelector('#action-clear').disabled) return;
    
    document.body.removeChild(modal);
    showConfirmModal(
      'Очистить стол',
      `Удалить все заказы из "${displayName}"?`,
      () => {
        tableOrders[tableNumber] = [];
        saveTableOrders();
        render();
      },
      null,
      'Очистить'
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
        // Remove from active tables
        const idx = activeTables.indexOf(tableNumber);
        if (idx !== -1) {
          activeTables.splice(idx, 1);
        }
        
        // Remove orders
        delete tableOrders[tableNumber];
        
        // Remove custom name
        delete tableNames[tableNumber];
        
        // Save changes
        saveTables();
        saveTableOrders();
        saveTableNames();
        
        // Re-render
        render();
      },
      null,
      'Удалить'
    );
  });
  
  // Cancel action
  modal.querySelector('#action-cancel').addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  // Close on outside click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
}

// Get pending drinks by table (for takeout button)
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

// Show takeout drinks panel (slide-up panel with pending drinks)
function showTakeoutDrinksPanel() {
  const pendingDrinks = getPendingDrinksByTable();
  
  if (pendingDrinks.length === 0) {
    alert('Нет напитков для выноса');
    return;
  }
  
  const panel = document.createElement('div');
  panel.className = 'takeout-panel';
  panel.innerHTML = `
    <div class="takeout-panel-content">
      <div class="takeout-panel-header">
        <h2>Напитки для выноса</h2>
        <button class="takeout-panel-close" id="takeout-close">&times;</button>
      </div>
      <div class="takeout-panel-body" id="takeout-body"></div>
    </div>
  `;
  
  document.body.appendChild(panel);
  
  const body = panel.querySelector('#takeout-body');
  
  pendingDrinks.forEach(({ tableNum, tableName, drinks }) => {
    const tableSection = document.createElement('div');
    tableSection.className = 'takeout-table-section';
    tableSection.innerHTML = `
      <h3 class="takeout-table-name">${tableName}</h3>
      <div class="takeout-drinks-list"></div>
    `;
    
    const drinksList = tableSection.querySelector('.takeout-drinks-list');
    
    drinks.forEach(drink => {
      const drinkItem = document.createElement('div');
      drinkItem.className = 'takeout-drink-item';
      drinkItem.innerHTML = `
        <span class="takeout-drink-name">${drink.itemName}</span>
        <span class="takeout-drink-quantity">×${drink.quantity}</span>
      `;
      drinksList.appendChild(drinkItem);
    });
    
    body.appendChild(tableSection);
  });
  
  // Close button
  panel.querySelector('#takeout-close').addEventListener('click', () => {
    document.body.removeChild(panel);
  });
  
  // Close on outside click
  panel.addEventListener('click', (e) => {
    if (e.target === panel) {
      document.body.removeChild(panel);
    }
  });
}

// Update takeout button visibility
function updateTakeoutButtonVisibility() {
  const pendingDrinks = getPendingDrinksByTable();
  const takeoutBtn = document.querySelector('.takeout-container-redesign');
  
  if (takeoutBtn) {
    if (pendingDrinks.length === 0) {
      takeoutBtn.classList.add('hidden');
      takeoutBtn.classList.remove('bubble-in');
    } else {
      takeoutBtn.classList.remove('hidden');
      takeoutBtn.classList.add('bubble-in');
    }
  }
}
