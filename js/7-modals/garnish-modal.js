/* Garnish Modal - Выбор гарнира к стейку */
/* Версия: 1.63.0 */

// Show garnish selection modal for steaks
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
