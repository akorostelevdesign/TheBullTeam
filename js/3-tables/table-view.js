/* Table View - Отображение стола с заказами и поиском блюд */
/* Главная функция viewTable для работы со столом в режиме поиска */

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

    // SVG Icons for action buttons
    const ICONS = {
      takeaway: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M18 6h-2V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6-2h2v2h-2V4zM6 20V8h12v12H6z"/></svg>`,
      rkeeper: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M17 1H7c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2zm0 18H7V5h10v14zm-5 3c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1z"/></svg>`,
      delivered: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`,
      delete: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`
    };

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
          
          // Check if this is Green/Herbal tea
          const isGreenTea = dishName.toLowerCase().includes('зеленый и травяной листовой чай');
          
          // Check if this is Black/Fruit tea
          const isBlackTea = dishName.toLowerCase().includes('черный и фруктовый листовой чай');
          
          // NEW: Check if this is tea with code 59
          const isTea = d.R_keeper === '59';
          
          // NEW: Check if this is tartare
          const isTartare = dishName.includes('тар-тар') || dishName.includes('тартар');
          
          // NEW: Check if this is cocktail with small volume
          const isCocktail = (d.category === 'НА РОМЕ' || d.category === 'НА ВОДКЕ' || d.category === 'НА ВИСКИ' || 
                             d.category === 'НА ДЖИНЕ' || d.category === 'НА ТЕКИЛЕ' || d.category === 'НА ИГРИСТОМ ВИНЕ' ||
                             d.category === 'АВТОРСКИЕ' || d.category === 'КЛАССИЧЕСКИЕ') && 
                            (d.gramm === '200 мл' || d.gramm === '250 мл' || d.gramm === '300 мл');
          
          // NEW: Check if this is Vitello tonnato
          const isVitello = dishName.includes('витело тонато') || dishName.includes('vitello tonnato') || dishName.includes('вителло тоннато');
          
          // NEW: Check if this is beer
          const isBeer = d.category === 'ПИВО';
          
          console.log('Is steak:', isSteakDish, 'Is ice cream:', isIceCream, 'Is juice:', isJuice, 'Is Red Bull:', isRedBull, 'Is Green Tea:', isGreenTea, 'Is Black Tea:', isBlackTea, 'Is Tea:', isTea, 'Is Tartare:', isTartare, 'Is Cocktail:', isCocktail, 'Is Vitello:', isVitello, 'Is Beer:', isBeer);
          
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
          } else if (isGreenTea) {
            // If it's Green/Herbal tea, show flavor selection modal
            console.log('Showing Green Tea modal for:', d.name);
            showGreenTeaFlavorModal(d.name, (selectedFlavor) => {
              console.log('Selected Green Tea flavor:', selectedFlavor);
              addDishToTable(null, selectedFlavor);
            });
          } else if (isBlackTea) {
            // If it's Black/Fruit tea, show flavor selection modal
            console.log('Showing Black Tea modal for:', d.name);
            showBlackTeaFlavorModal(d.name, (selectedFlavor) => {
              console.log('Selected Black Tea flavor:', selectedFlavor);
              addDishToTable(null, selectedFlavor);
            });
          } else if (isTea && dishChainSettings.tea) {
            // NEW: If it's tea with code 59, show tea addons modal
            console.log('Showing Tea Addons modal for:', d.name);
            showTeaAddonsModal(d.name, (addons) => {
              console.log('Selected tea addons:', addons);
              addDishToTable(null, null);
              
              // Add selected addons as linked items
              addons.forEach(addon => {
                const addonOrder = {
                  id: uuid(),
                  itemName: addon,
                  quantity: 1,
                  price: '0 рублей', // Free
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
            showVitelloFocacciaModal(d.name, (addFocaccia) => {
              console.log('Add focaccia:', addFocaccia);
              addDishToTable(null, null);
              
              if (addFocaccia) {
                // Find focaccia in dishes
                const focaccia = dishes.find(dish => 
                  dish.name.toLowerCase().includes('фоккача') && 
                  dish.name.toLowerCase().includes('розмарин')
                );
                
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
                  saveTableOrders();
                  renderTableOrders();
                }
              }
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
            console.log('Adding dish without modal');
            addDishToTable(null, null);
          }
        }
        
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
      if (e.key === 'Enter' && suggestEl.style.display !== 'none') { 
        e.preventDefault(); 
        suggestBtn.click(); 
      }
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
