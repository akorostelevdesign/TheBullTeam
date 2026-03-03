/* Order History - История заказов */
/* Версия: 1.63.0 */

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
