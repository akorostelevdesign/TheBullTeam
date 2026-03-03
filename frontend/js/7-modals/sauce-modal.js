/* Sauce Modal - Выбор соуса к стейку */
/* Версия: 1.63.0 */

// Show sauce selection modal for steaks
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
