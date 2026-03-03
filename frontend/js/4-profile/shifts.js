/* Shifts Management - Управление сменами */
/* Версия: 1.63.0 */

// Initialize shifts calendar
function initShiftsCalendar(container) {
  let currentDate = new Date();
  currentDate.setDate(1); // Start of month

  function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    
    // Get first day of month and number of days
    let firstDay = new Date(year, month, 1).getDay();
    // Convert Sunday (0) to 7, then subtract 1 to make Monday = 0
    firstDay = firstDay === 0 ? 6 : firstDay - 1;
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    let html = `
      <div class="calendar-header">
        <button class="calendar-nav-btn" id="calendar-prev">‹</button>
        <div class="calendar-month-year">${monthNames[month]} ${year}</div>
        <button class="calendar-nav-btn" id="calendar-next">›</button>
      </div>
      <div class="calendar-grid">
        <div class="calendar-days-header">
          ${dayNames.map(day => `<div class="calendar-day-header">${day}</div>`).join('')}
        </div>
        <div class="calendar-days">
    `;
    
    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      html += `<div class="calendar-day calendar-day-other">${day}</div>`;
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const shiftValue = shifts[dateKey] || 0;
      const isFullShift = shiftValue === 1;
      const isHalfShift = shiftValue === 0.5;
      const hasShift = isFullShift || isHalfShift;
      
      html += `
        <div class="calendar-day calendar-day-current ${hasShift ? 'calendar-day-has-shift' : ''}" 
             data-date="${dateKey}" 
             data-shift="${shiftValue}">
          <span class="calendar-day-number">${day}</span>
          ${isFullShift ? '<div class="calendar-shift-full"></div>' : ''}
          ${isHalfShift ? '<div class="calendar-shift-half"></div>' : ''}
        </div>
      `;
    }
    
    // Next month days (fill remaining cells to complete grid)
    const totalCells = firstDay + daysInMonth;
    const remainingCells = Math.ceil(totalCells / 7) * 7 - totalCells;
    for (let day = 1; day <= remainingCells; day++) {
      html += `<div class="calendar-day calendar-day-other">${day}</div>`;
    }
    
    html += `
        </div>
      </div>
      <div class="calendar-salary-btn-wrapper">
        <button id="btn-salary-calc" class="btn primary salary-calc-btn">🧮 Расчёт ЗП</button>
      </div>
      <div class="calendar-legend">
        <div class="calendar-legend-item">
          <div class="calendar-legend-box calendar-legend-full"></div>
          <span>Полная смена</span>
        </div>
        <div class="calendar-legend-item">
          <div class="calendar-legend-box calendar-legend-half"></div>
          <span>Пол смены</span>
        </div>
        <div class="calendar-legend-hint">Нажмите на дату для изменения смены</div>
      </div>
    `;
    
    container.innerHTML = html;
    
    // Event listeners
    container.querySelector('#calendar-prev').addEventListener('click', () => {
      currentDate.setMonth(month - 1);
      renderCalendar();
    });
    
    container.querySelector('#calendar-next').addEventListener('click', () => {
      currentDate.setMonth(month + 1);
      renderCalendar();
    });
    
    // Day click handlers
    container.querySelectorAll('.calendar-day-current').forEach(dayEl => {
      dayEl.addEventListener('click', () => {
        const dateKey = dayEl.dataset.date;
        const currentShift = shifts[dateKey] || 0;
        
        // Cycle: no shift -> half shift -> full shift -> no shift
        let newShift = 0;
        if (currentShift === 0) {
          newShift = 0.5;
        } else if (currentShift === 0.5) {
          newShift = 1;
        } else {
          newShift = 0;
        }
        
        if (newShift === 0) {
          delete shifts[dateKey];
        } else {
          shifts[dateKey] = newShift;
        }
        
        saveShifts();
        renderCalendar();
      });
    });
    
    // Salary calculator button handler
    const salaryBtn = container.querySelector('#btn-salary-calc');
    if (salaryBtn) {
      salaryBtn.addEventListener('click', () => {
        const metrics = computeMonthlyMetrics(new Date());
        showSalaryCalculatorModal(metrics.revenue);
      });
    }
  }
  
  renderCalendar();
}

// Add shift to calendar
function addShift(dateKey, shiftType) {
  if (shiftType === 0) {
    delete shifts[dateKey];
  } else {
    shifts[dateKey] = shiftType;
  }
  saveShifts();
}

// Remove shift from calendar
function removeShift(dateKey) {
  delete shifts[dateKey];
  saveShifts();
}

// Get shifts for a specific month
function getMonthShifts(year, month) {
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
  const monthShifts = {};
  
  Object.keys(shifts).forEach(dateKey => {
    if (dateKey.startsWith(monthKey)) {
      monthShifts[dateKey] = shifts[dateKey];
    }
  });
  
  return monthShifts;
}

// Calculate total shifts for a month
function calculateMonthShifts(year, month) {
  const monthShifts = getMonthShifts(year, month);
  let totalShifts = 0;
  
  Object.values(monthShifts).forEach(shiftValue => {
    totalShifts += shiftValue;
  });
  
  return totalShifts;
}
