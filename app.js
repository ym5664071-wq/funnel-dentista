import { initializeCalendar } from './calendar.js';

document.addEventListener('DOMContentLoaded', function () {
    // --- OBTENER ELEMENTOS DEL DOM (Generales) ---
    const timeSlotsContainer = document.getElementById('time-slots');
    const userFormContainer = document.getElementById('user-form');
    const userForm = document.getElementById('booking-form');
    const nameInput = document.getElementById('name-input');
    const emailInput = document.getElementById('email-input');
    const phoneInput = document.getElementById('phone-input');
    const ctaHeroBtn = document.getElementById('cta-hero-btn');
    const ctaFinalBtn = document.getElementById('cta-final-btn');
    const bookingSection = document.getElementById('booking-section');

    // --- ESTADO DE LA APLICACIÓN ---
    let disponibilidadData = [];
    let selectedSlotId = null;
 
    // --- FUNCIONES DE LA APP ---

    function scrollToBooking(event) {
        event.preventDefault();
        bookingSection.scrollIntoView({ behavior: 'smooth' });
    }

    function displayTimeSlots(selectedDate) {
        if (!selectedDate) {
            timeSlotsContainer.innerHTML = '<p>Selecciona un día.</p>';
            userFormContainer.style.display = 'none';
            selectedSlotId = null;
            return;
        }

        timeSlotsContainer.innerHTML = '';
        const slotsDelDia = disponibilidadData.filter(slot =>
            slot.fecha_hora_inicio.startsWith(selectedDate) && slot.esta_disponible
        );

        if (slotsDelDia.length === 0) {
            timeSlotsContainer.innerHTML = '<p>No hay horarios disponibles para este día.</p>';
            return;
        }

        slotsDelDia.forEach(slot => {
           // --- INICIO DE LA CORRECCIÓN DE ZONA HORARIA ---
            // 1. Reemplazamos '-' por '/' para forzar la interpretación como hora local.
            const localDateString = slot.fecha_hora_inicio.replace(/-/g, "/"); 
            
            const dateObj = new Date(localDateString);
            
            // 2. Usamos el objeto Date local para obtener la hora
            const hora = dateObj.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
            // --- FIN DE LA CORRECCIÓN ---
            
            timeSlotsContainer.insertAdjacentHTML('beforeend',
                `<button class="time-slot-btn" data-slot-id="${slot.slot_id}">${hora}</button>`
            );
            
        });
    }

    async function handleFormSubmit(event) {
        event.preventDefault();
        const nombre = nameInput.value.trim();
        const email = emailInput.value.trim();
        const telefono = phoneInput ? phoneInput.value.trim() : '';

        if (!nombre || !email || !selectedSlotId) {
            alert('Por favor, completa todos los campos y selecciona un horario.');
            return;
        }

        const submitButton = userForm.querySelector('.cta-button');
        submitButton.textContent = 'Procesando...';
        submitButton.disabled = true;

        try {
            const response = await fetch('https://funnel-dentista.onrender.com/api/citas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre: nombre, email: email, telefono: telefono,
                    slot_id: parseInt(selectedSlotId)
                }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Error al crear la cita.');

            // --- CÓDIGO CRÍTICO CORREGIDO ---
            // Redirigimos pasando los datos necesarios en la URL
            const nombrePaciente = encodeURIComponent(result.cita.nombre);
            const fechaCita = encodeURIComponent(result.cita.fecha_hora_inicio);
            window.location.href = `confirmacion.html?nombre=${nombrePaciente}&fecha=${fechaCita}`;

        } catch (error) {
            console.error(error);
            alert(`Error: ${error.message}`);
            submitButton.textContent = 'Confirmar Cita';
            submitButton.disabled = false;
        }
    }

    async function main() {
        try {
            const response = await fetch('https://funnel-dentista.onrender.com/api/disponibilidad');
            if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
            disponibilidadData = await response.json();
            
            initializeCalendar({
                calendarGridId: 'calendar-grid',
                monthYearDisplayId: 'month-year-display',
                prevBtnId: 'prev-month-btn',
                nextBtnId: 'next-month-btn',
                disponibilidad: disponibilidadData,
                onDateSelect: (date) => {
                    displayTimeSlots(date);
                }
            });

        } catch (error) {
            console.error("Error al cargar la aplicación:", error);
            document.getElementById('booking-component').innerHTML = "<p>Error al cargar horarios. Revisa la consola (F12).</p>";
        }
    }

    // --- EVENT LISTENERS (Generales) ---
    ctaHeroBtn.addEventListener('click', scrollToBooking);
    ctaFinalBtn.addEventListener('click', scrollToBooking);
    userForm.addEventListener('submit', handleFormSubmit);

    timeSlotsContainer.addEventListener('click', function (event) {
        if (event.target.classList.contains('time-slot-btn')) {
            selectedSlotId = event.target.dataset.slotId;
            const prevSelected = document.querySelector('.selected-time');
            if (prevSelected) prevSelected.classList.remove('selected-time');
            event.target.classList.add('selected-time');
            userFormContainer.style.display = 'block';
        }
    });

    // --- INICIALIZACIÓN DE LA APP ---
    main();

   // --- Lógica del Carrusel de Testimonios (Versión Google Reviews) ---
const track = document.querySelector('.testimonial-track');
if (track) {
    const slides = Array.from(track.children);
    const nextButton = document.getElementById('next-testimonial');
    const prevButton = document.getElementById('prev-testimonial');

    let currentIndex = 0;

    const moveToSlide = (targetIndex) => {
        // --- CÓDIGO CRÍTICO MODIFICADO AQUÍ ---
        // 1. Recalcula el ancho de la tarjeta visible (incluyendo el gap de 20px)
        const currentSlideWidth = slides.length > 0 ? slides[0].offsetWidth + 20 : 0;
        
        // 2. Determina el índice máximo visible (cuántas tarjetas se muestran)
        let maxIndex;
        if (window.innerWidth <= 600) {
            maxIndex = slides.length - 1; // Muestra 1 a la vez
        } else if (window.innerWidth <= 992) {
            maxIndex = slides.length - 2; // Muestra 2 a la vez
        } else {
            maxIndex = slides.length - 3; // Muestra 3 a la vez
        }
        
        // 3. Controla los límites
        if (targetIndex > maxIndex) targetIndex = 0;
        if (targetIndex < 0) targetIndex = maxIndex;

        // 4. Aplica la transformación con el ancho recién calculado
        if(track) {
            track.style.transform = 'translateX(-' + (currentSlideWidth * targetIndex) + 'px)';
        }
        currentIndex = targetIndex;
    }

    nextButton.addEventListener('click', () => {
        moveToSlide(currentIndex + 1);
    });

    prevButton.addEventListener('click', () => {
        moveToSlide(currentIndex - 1);
    });

    // Añadir un listener para que el carrusel se reajuste al cambiar el tamaño de la ventana
    window.addEventListener('resize', () => {
        moveToSlide(currentIndex); // Reajusta a la posición actual
    });

    moveToSlide(0);
}
});