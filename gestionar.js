document.addEventListener('DOMContentLoaded', () => {
    const gestionarForm = document.getElementById('gestionar-form');
    const emailInput = document.getElementById('email-input');
    const feedbackMsg = document.getElementById('mensaje-feedback');

    gestionarForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        if (!email) return;

        const submitButton = gestionarForm.querySelector('.cta-button');
        submitButton.disabled = true;
        submitButton.textContent = 'Enviando...';
        feedbackMsg.textContent = '';

        try {
            // Este es el endpoint que crearemos en el Paso 2
            const response = await fetch('https://funnel-dentista.onrender.com/api/solicitar-cambio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Error al procesar la solicitud.');
            }

            feedbackMsg.style.color = 'green';
            feedbackMsg.textContent = '¡Hecho! Revisa tu correo electrónico para ver el enlace de modificación.';
            gestionarForm.reset();

        } catch (error) {
            feedbackMsg.style.color = 'red';
            feedbackMsg.textContent = `Error: ${error.message}`;
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Enviar enlace';
        }
    });
});