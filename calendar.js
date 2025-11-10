// Estado interno del calendario
let currentDate = new Date();

// Guardamos referencias a los elementos del DOM y a los datos
let calendarGridEl, monthYearDisplayEl, disponibilidadData, onDateSelectCallback;

function renderCalendar() {
    calendarGridEl.innerHTML = '';
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    monthYearDisplayEl.textContent = `${currentDate.toLocaleString('es-MX', { month: 'long' })} ${year}`;
    
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < startDay; i++) {
        calendarGridEl.insertAdjacentHTML('beforeend', `<div class="day other-month"></div>`);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const fullDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayDate = new Date(year, month, day);
        let dayClasses = 'day';

        if (dayDate < today) {
            dayClasses += ' day-past';
        } else {
            const hasSlots = disponibilidadData.some(slot => 
                slot.fecha_hora_inicio.startsWith(fullDate) && slot.esta_disponible
            );
            if (hasSlots) {
                dayClasses += ' available';
            }
        }
        
        calendarGridEl.insertAdjacentHTML('beforeend', 
            `<div class="${dayClasses}" data-date="${fullDate}">${day}</div>`
        );
    }
}

export function initializeCalendar(config) {
    calendarGridEl = document.getElementById(config.calendarGridId);
    monthYearDisplayEl = document.getElementById(config.monthYearDisplayId);
    const prevMonthBtn = document.getElementById(config.prevBtnId);
    const nextMonthBtn = document.getElementById(config.nextBtnId);
    disponibilidadData = config.disponibilidad;
    onDateSelectCallback = config.onDateSelect;

    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
        onDateSelectCallback(null);
    });

    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
        onDateSelectCallback(null);
    });
    
    calendarGridEl.addEventListener('click', function(event) {
        const dayEl = event.target;
        if (!dayEl.classList.contains('day') || dayEl.classList.contains('day-past') || !dayEl.dataset.date) {
            return; 
        }

        const prevSelected = calendarGridEl.querySelector('.selected-day');
        if (prevSelected) prevSelected.classList.remove('selected-day');
        dayEl.classList.add('selected-day');
        
        onDateSelectCallback(dayEl.dataset.date);
    });

    renderCalendar();
}