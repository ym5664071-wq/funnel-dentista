// --- notificaciones.js ---
const nodemailer = require('nodemailer');
require('dotenv').config(); // <-- TAREA 1: Lee el archivo .env

// 1. Configurar el servicio de envío de correos
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        // TAREA 1: Usa las variables seguras
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS  
    }
});



/**
 * FUNCIÓN: enviarConfirmacion 
 * Construye y envía el correo de confirmación al paciente.
 */
async function enviarConfirmacion(emailPaciente, detallesCita) {
    console.log(`Preparando correo para ${emailPaciente}...`);

    // 2. Componer el correo
    const mailOptions = {
        // Asegúrate que 'from' use el mismo correo que EMAIL_USER
        from: `"Clínica Dental Sonrisa" <${process.env.EMAIL_USER}>`, 
        to: emailPaciente,
        subject: `Confirmación de tu cita en Clínica Dental Sonrisa`,
        html: `
            <h1>¡Gracias por agendar con nosotros!</h1>
            <p>Hola,</p>
            <p>Tu cita ha sido confirmada con éxito. Aquí tienes los detalles:</p>
            <ul>
                <li><strong>Servicio:</strong> ${detallesCita.servicio}</li>
                <li><strong>Fecha:</strong> ${detallesCita.fecha}</li>
                <li><strong>Hora:</strong> ${detallesCita.hora}</li>
            </ul>
            <p>Nuestra dirección es: Ignacio Zaragoza 520 A, C.P. 38900, Salvatierra, Guanajuato, México.</p>
            <p>¡Te esperamos!</p>
        `
    };

    try {
        // 3. Enviar el correo
        await transporter.sendMail(mailOptions);
        console.log(`Correo de confirmación enviado exitosamente a ${emailPaciente}`);
        return { success: true };
    } catch (error) {
        // 4. Manejar errores
        console.error(`Error al enviar correo a ${emailPaciente}:`, error);
        return { success: false, error: error };
    }
}

// --- INICIO TAREA 4 (Parte 2): NUEVA FUNCIÓN ---

/**
 * FUNCIÓN: enviarEnlaceModificacion
 * Construye y envía el correo con el enlace para cambiar la cita.
 */
async function enviarEnlaceModificacion(emailPaciente, token) {
    console.log(`Preparando enlace de modificación para ${emailPaciente}...`);

    // Construimos el enlace que el usuario usará
    // (cambiar-cita.html es la página que haremos en la Parte 3)
    const enlace = `https://funnel-dentista-ym.onrender.com/cambiar-cita.html?token=${token}`;

    // Componer el correo
    const mailOptions = {
        from: `"Clínica Dental Sonrisa" <${process.env.EMAIL_USER}>`,
        to: emailPaciente,
        subject: `Modifica tu cita en Clínica Dental Sonrisa`,
        html: `
            <h1>Gestiona tu cita</h1>
            <p>Hola,</p>
            <p>Recibimos una solicitud para modificar tu cita. Usa el siguiente enlace para elegir un nuevo horario.</p>
            <p>Si tú no solicitaste esto, puedes ignorar este correo.</p>
            <br>
            <a href="${enlace}" 
               style="background-color: #007bff; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px;">
               Modificar mi Cita
            </a>
            <br>
            <p style="font-size: 12px; margin-top: 20px;">Este enlace es válido por 1 hora.</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Enlace de modificación enviado a ${emailPaciente}`);
        return { success: true };
    } catch (error) {
        console.error(`Error al enviar enlace a ${emailPaciente}:`, error);
        return { success: false, error: error };
    }
}
// --- FIN TAREA 4 (Parte 2) ---


// ¡MODIFICACIÓN! Exportamos AMBAS funciones
module.exports = {
    enviarConfirmacion,
    enviarEnlaceModificacion // <-- AÑADIMOS LA NUEVA FUNCIÓN
};