document.addEventListener('DOMContentLoaded', () => {
    // 1. Obtener los parámetros de la URL
    const params = new URLSearchParams(window.location.search);
    const nombrePaciente = params.get('nombre');
    const fechaCitaISO = params.get('fecha');

    // Comprobamos si hay datos de fecha
    if (!fechaCitaISO) {
        console.error("Error: No se encontraron datos de la cita en la URL.");
        // Colocamos texto de error en la pantalla si no hay datos
        document.getElementById('fecha-cita').textContent = 'Error de carga';
        document.getElementById('hora-cita').textContent = 'Error de carga';
        return;
    }

    // 2. Formatear y mostrar los datos
    // El 'Z' asegura que la hora se interprete correctamente como UTC
    const fecha = new Date(fechaCitaISO);
    
    // Mostramos el nombre
    document.getElementById('mensaje-confirmacion').textContent = `¡Tu cita está confirmada, ${nombrePaciente}!`;
    
    // Mostramos fecha y hora formateadas
    document.getElementById('fecha-cita').textContent = fecha.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById('hora-cita').textContent = fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    
    // 3. Lógica para el botón "Añadir al Calendario"
    const addToCalendarBtn = document.getElementById('add-to-calendar-btn');
    if (addToCalendarBtn) {
        addToCalendarBtn.addEventListener('click', () => {
            const startTime = fecha.toISOString().replace(/-|:|\.\d{3}/g, '');
            // 1 hora de duración
            const endTime = new Date(fecha.getTime() + 60 * 60 * 1000).toISOString().replace(/-|:|\.\d{3}/g, ''); 
            
            const event = {
                title: "Cita en Clínica Dental Sonrisa",
                details: "Cita para valoración y limpieza dental.",
                location: "Ignacio Zaragoza 520 A, C.P. 38900, Salvatierra, Guanajuato, México.",
                startTime: startTime,
                endTime: endTime
            };

            const googleCalendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${event.startTime}/${event.endTime}&details=${encodeURIComponent(event.details)}&location=${encodeURIComponent(event.location)}`;
            
            window.open(googleCalendarUrl, '_blank');
        });
    }
});