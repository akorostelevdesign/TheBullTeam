/* Cooking Level Modal - Выбор прожарки стейка */
/* Версия: 1.63.0 */

// Show cooking level selection modal for steaks
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
