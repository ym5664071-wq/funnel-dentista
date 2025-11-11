// TAREA 1: Leer el archivo .env
require('dotenv').config();

const express = require('express');
const mysql = require('mysql2'); // Paquete actualizado
const cors = require('cors');
const jwt = require('jsonwebtoken'); 

// TAREA 3 y 4: Importar AMBAS funciones
const { enviarConfirmacion, enviarEnlaceModificacion } = require('./notificaciones.js');

const app = express();
app.use(cors());
app.use(express.json());

// ARREGLO: Servir archivos estáticos (HTML, CSS, JS)
app.use(express.static('.'));

// TAREA 1: Usar las variables de entorno
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT,
    ssl: {
      rejectUnauthorized: false 
    },
    dateStrings: true 
});

db.connect(err => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err);
        return;
    }
    console.log('¡Conexión exitosa a la base de datos MySQL (dentafunnel_db)!');
});

// Endpoint para mostrar disponibilidad
app.get('/api/disponibilidad', (req, res) => {
    // CORRECCIÓN: Nombre de tabla en minúscula
    const sql = 'SELECT * FROM disponibilidad WHERE esta_disponible = TRUE';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error al consultar la disponibilidad:', err);
            return res.status(500).json({ message: 'Error interno del servidor.' });
        }
        res.json(results);
    });
});


// --- TAREA: MANEJO DE PACIENTES RECURRENTES ---
app.post('/api/citas', (req, res) => {
    const { nombre, email, telefono, slot_id } = req.body;
    if (!nombre || !email || !slot_id) {
        return res.status(400).json({ message: "Faltan datos." });
    }

    // CORRECCIÓN: Nombre de tabla en minúscula
    const sqlCheckSlot = 'SELECT * FROM disponibilidad WHERE slot_id = ? AND esta_disponible = TRUE';
    db.query(sqlCheckSlot, [slot_id], (err, slotResults) => {
        if (err) return res.status(500).json({ message: "Error al verificar horario." });
        if (slotResults.length === 0) {
            return res.status(400).json({ message: "Horario no disponible." });
        }
        
        const horario = slotResults[0];

        const crearCitaParaPaciente = (pacienteId) => {
            // CORRECCIÓN: Nombre de tabla en minúscula
            const sqlInsertCita = 'INSERT INTO citas (paciente_id, slot_id) VALUES (?, ?)';
            db.query(sqlInsertCita, [pacienteId, slot_id], (err, citaResult) => {
                if (err) return res.status(500).json({ message: "Error al crear la cita." });

                // CORRECCIÓN: Nombre de tabla en minúscula
                const sqlUpdateSlot = 'UPDATE disponibilidad SET esta_disponible = FALSE WHERE slot_id = ?';
                db.query(sqlUpdateSlot, [slot_id], (err, updateResult) => {
                    if (err) return res.status(500).json({ message: "Error al actualizar horario." });

                    console.log("¡Cita creada y horario actualizado en la BD!");
                    
                    const fechaCita = new Date(horario.fecha_hora_inicio);
                    const detallesParaCorreo = {
                        servicio: "Valoración completa + Limpieza dental",
                        fecha: fechaCita.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
                        hora: fechaCita.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
                    };
                    enviarConfirmacion(email, detallesParaCorreo);

                    res.status(201).json({
                        message: "Cita creada exitosamente.",
                        cita: {
                            nombre: nombre,
                            fecha_hora_inicio: horario.fecha_hora_inicio
                        }
                    });
                });
            });
        };

        // CORRECCIÓN: Nombre de tabla en minúscula
        const sqlFindPaciente = 'SELECT * FROM pacientes WHERE email = ?';
        db.query(sqlFindPaciente, [email], (err, pacienteResults) => {
            if (err) return res.status(500).json({ message: "Error al buscar paciente." });

            if (pacienteResults.length > 0) {
                const pacienteExistente = pacienteResults[0];
                console.log(`Paciente recurrente: ${pacienteExistente.paciente_id}`);
                crearCitaParaPaciente(pacienteExistente.paciente_id);
            } else {
                console.log("Paciente nuevo, creando registro...");
                // CORRECCIÓN: Nombre de tabla en minúscula
                const sqlInsertPaciente = 'INSERT INTO pacientes (nombre_completo, email, telefono) VALUES (?, ?, ?)';
                db.query(sqlInsertPaciente, [nombre, email, telefono], (err, pacienteResult) => {
                    if (err) return res.status(500).json({ message: "Error al crear paciente." });
                    
                    const nuevoPacienteId = pacienteResult.insertId;
                    console.log(`Paciente nuevo creado: ${nuevoPacienteId}`);
                    crearCitaParaPaciente(nuevoPacienteId);
                });
            }
        });
    });
});
// --- FIN TAREA PACIENTES RECURRENTES ---


// --- TAREA 4 (Flujo de Modificación de Cita) ---
app.post('/api/solicitar-cambio', (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: "El correo es requerido." });
    }

    // CORRECCIÓN: Nombre de tabla en minúscula
    const sqlFindPaciente = "SELECT * FROM pacientes WHERE email = ?";
    db.query(sqlFindPaciente, [email], (err, pacientes) => {
        if (err) return res.status(500).json({ message: "Error de base de datos." });
        if (pacientes.length === 0) {
            return res.status(404).json({ message: "No se encontró ninguna cita con ese correo." });
        }
        
        const paciente = pacientes[0];

        // CORRECCIÓN: Nombres de tablas en minúscula
        const sqlFindCita = `
            SELECT citas.cita_id, citas.slot_id, disponibilidad.fecha_hora_inicio 
            FROM citas 
            JOIN disponibilidad ON citas.slot_id = disponibilidad.slot_id 
            WHERE citas.paciente_id = ? AND disponibilidad.fecha_hora_inicio > NOW()
            LIMIT 1;
        `;
        
        db.query(sqlFindCita, [paciente.paciente_id], (err, citas) => {
            if (err) return res.status(500).json({ message: "Error al buscar la cita." });
            if (citas.length === 0) {
                return res.status(404).json({ message: "No tienes citas activas para modificar." });
            }

            const citaActiva = citas[0];

            const payload = {
                cita_id: citaActiva.cita_id,
                slot_id_antiguo: citaActiva.slot_id
            };
            
            const token = jwt.sign(payload, process.env.ADMIN_PASS, { expiresIn: '1h' });
            
            enviarEnlaceModificacion(email, token);

            res.status(200).json({ message: "Enlace de modificación enviado a tu correo." });
        });
    });
});

app.post('/api/confirmar-cambio', (req, res) => {
    const { token, nuevo_slot_id } = req.body;

    if (!token || !nuevo_slot_id) {
        return res.status(400).json({ message: "Faltan datos (token o nuevo horario)." });
    }

    let payload;
    try {
        payload = jwt.verify(token, process.env.ADMIN_PASS);
    } catch (err) {
        return res.status(401).json({ message: "Enlace no válido o expirado. Vuelve a solicitar el cambio." });
    }

    const { cita_id, slot_id_antiguo } = payload;
    
    db.beginTransaction(err => {
        if (err) return res.status(500).json({ message: "Error al iniciar la transacción." });

        // CORRECCIÓN: Nombre de tabla en minúscula
        const sqlLiberarSlot = "UPDATE disponibilidad SET esta_disponible = TRUE WHERE slot_id = ?";
        db.query(sqlLiberarSlot, [slot_id_antiguo], (err, result) => {
            if (err) {
                return db.rollback(() => res.status(500).json({ message: "Error al liberar horario antiguo." }));
            }

            // CORRECCIÓN: Nombre de tabla en minúscula
            const sqlOcuparSlot = "UPDATE disponibilidad SET esta_disponible = FALSE WHERE slot_id = ?";
            db.query(sqlOcuparSlot, [nuevo_slot_id], (err, result) => {
                if (err) {
                    return db.rollback(() => res.status(500).json({ message: "Error al ocupar nuevo horario." }));
                }
                
                // CORRECCIÓN: Nombre de tabla en minúscula
                const sqlActualizarCita = "UPDATE citas SET slot_id = ? WHERE cita_id = ?";
                db.query(sqlActualizarCita, [nuevo_slot_id, cita_id], (err, result) => {
                    if (err) {
                        return db.rollback(() => res.status(500).json({ message: "Error al actualizar la cita." }));
                    }

                    db.commit(err => {
                        if (err) {
                            return db.rollback(() => res.status(500).json({ message: "Error al finalizar la transacción." }));
                        }
                        
                        console.log(`¡Cita ${cita_id} modificada exitosamente!`);
                        res.status(200).json({ message: "¡Tu cita ha sido modificada con éxito!" });
                    });
                });
            });
        });
    });
});
// --- FIN TAREA 4 ---


// --- TAREA 5 (Panel de Admin) ---
app.post('/api/admin/login', (req, res) => {
    const { usuario, password } = req.body;
    if (usuario === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
        console.log("Acceso de Admin concedido.");
        res.status(200).json({ message: "Login exitoso" });
    } else {
        console.log("Intento de acceso de Admin fallido.");
        res.status(401).json({ message: "Credenciales incorrectas" });
    }
});

const checkAdminAuth = (req, res, next) => {
    const token = req.headers['authorization'];
    if (token && token === process.env.ADMIN_PASS) {
        next();
    } else {
        res.status(401).json({ message: "Acceso no autorizado" });
    }
};

// CORRECCIÓN DE ZONA HORARIA
app.post('/api/admin/disponibilidad', checkAdminAuth, (req, res) => {
    const { fecha_hora_inicio } = req.body; 

    if (!fecha_hora_inicio) {
        return res.status(400).json({ message: "Falta la fecha y hora." });
    }

    const fechaSQL = fecha_hora_inicio.replace('T', ' ') + ':00';
    
    // CORRECCIÓN: Nombre de tabla en minúscula
    const sql = "INSERT INTO disponibilidad (fecha_hora_inicio, esta_disponible) VALUES (?, TRUE)";
    
    db.query(sql, [fechaSQL], (err, result) => {
        if (err) {
            console.error('Error al insertar disponibilidad:', err);
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ message: "Error: Ese horario exacto ya existe." });
            }
            return res.status(500).json({ message: "Error al guardar en la base de datos." });
        }
        console.log(`Nuevo horario añadido: ${fechaSQL}`);
        res.status(201).json({ message: "Horario añadido exitosamente" });
    });
});
// --- FIN TAREA 5 ---

// Elige el puerto de Render, o 3000 si estamos en local
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor API corriendo en el puerto ${PORT}`);
})