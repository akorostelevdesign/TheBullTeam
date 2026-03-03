/* Salary Calculator - Расчёт зарплаты */
/* Версия: 1.63.0 */

// Конфигурация грейдов для расчёта зарплаты
const GRADE_CONFIG = {
  '0': { baseFull: 2000, baseHalf: 1000, breakageFull: 200, breakageHalf: 100, percent: 0, name: 'Стажер' },
  '1': { baseFull: 2000, baseHalf: 1000, breakageFull: 200, breakageHalf: 100, percent: 1, name: 'Стажер-официант' },
  '2': { baseFull: 2500, baseHalf: 1250, breakageFull: 200, breakageHalf: 100, percent: 1, name: 'Официант' },
  '3': { baseFull: 2500, baseHalf: 1250, breakageFull: 200, breakageHalf: 100, percent: 2, name: 'Старший официант' }
};

/**
 * Рассчитывает зарплату официанта за смену
 * @param {string} grade - Грейд (0, 1, 2, 3)
 * @param {number} shiftType - Тип смены (1 = полная, 0.5 = пол смены)
 * @param {number} revenue - Выручка за месяц
 * @returns {Object} - Детализация расчёта
 */
function calculateSalary(grade, shiftType, revenue) {
  // Валидация входных данных
  const validGrade = GRADE_CONFIG[grade] ? grade : '0';
  const validRevenue = Math.max(0, revenue || 0);
  const isFullShift = shiftType === 1;
  
  const config = GRADE_CONFIG[validGrade];
  const base = isFullShift ? config.baseFull : config.baseHalf;
  const breakage = isFullShift ? config.breakageFull : config.breakageHalf;
  const percentAmount = Math.round(validRevenue * config.percent / 100);
  const total = base - breakage + percentAmount;
  
  return {
    base,
    breakage,
    percent: config.percent,
    percentAmount,
    total,
    gradeName: config.name
  };
}

// Расчёт общей суммы за стол
function computeTableTotalAmount(tableNumber) {
  const items = tableOrders[tableNumber] || [];
  return items.reduce((sum, item) => {
    const price = parseFloat(item.price) || 0;
    const quantity = item.quantity || 1;
    return sum + (price * quantity);
  }, 0);
}
