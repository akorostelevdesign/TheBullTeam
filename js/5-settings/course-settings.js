/* Course Settings - Настройки курсов */
/* Версия: 1.63.0 */

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
