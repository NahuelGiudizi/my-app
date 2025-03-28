// src/lib/email-service.ts
import nodemailer from 'nodemailer';

interface TurnoInfo {
  id: number;
  fecha: Date;
  cliente: {
    nombre: string;
    apellido: string;
    email: string;
  };
  barbero: {
    nombre: string;
    apellido: string;
  };
  sucursal: {
    nombre: string;
    direccion: string;
  };
  servicios: Array<{
    nombre: string;
    precio: number;
  }>;
}

// Configurar el transporte de correo con Gmail y SSL
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // usar SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function enviarConfirmacionTurno(turno: TurnoInfo) {
  try {
    // Formatear la fecha y hora
    const fechaFormateada = new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'full',
      timeStyle: 'short'
    }).format(turno.fecha);

    // Calcular el precio total
    const precioTotal = turno.servicios.reduce((total, servicio) => total + servicio.precio, 0);

    // Generar la lista de servicios
    const serviciosHtml = turno.servicios
      .map(servicio => `<li>${servicio.nombre} - $${servicio.precio.toFixed(2)}</li>`)
      .join('');

    // Generar el token de cancelación (ejemplo simple, en producción usar algo más seguro)
    const tokenCancelacion = Buffer.from(`${turno.id}-${Date.now()}`).toString('base64');
    const urlCancelacion = `${process.env.NEXT_PUBLIC_APP_URL}/cancelar-turno?token=${tokenCancelacion}`;

    // Enviar el correo electrónico usando nodemailer
    const info = await transporter.sendMail({
      from: `"Barbería" <${process.env.EMAIL_USER}>`,
      to: turno.cliente.email,
      subject: 'Confirmación de Turno - Barbería',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333; text-align: center;">¡Tu turno ha sido confirmado!</h2>
          
          <div style="background-color: #f8f8f8; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <p style="margin: 5px 0;"><strong>Cliente:</strong> ${turno.cliente.nombre} ${turno.cliente.apellido}</p>
            <p style="margin: 5px 0;"><strong>Fecha y hora:</strong> ${fechaFormateada}</p>
            <p style="margin: 5px 0;"><strong>Barbero:</strong> ${turno.barbero.nombre} ${turno.barbero.apellido}</p>
            <p style="margin: 5px 0;"><strong>Sucursal:</strong> ${turno.sucursal.nombre}</p>
            <p style="margin: 5px 0;"><strong>Dirección:</strong> ${turno.sucursal.direccion}</p>
          </div>
          
          <h3 style="color: #555;">Servicios reservados:</h3>
          <ul style="list-style-type: none; padding-left: 0;">
            ${serviciosHtml}
          </ul>
          
          <p style="border-top: 1px solid #e0e0e0; padding-top: 10px;"><strong>Total a pagar:</strong> $${precioTotal.toFixed(2)}</p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${urlCancelacion}" style="display: inline-block; padding: 10px 20px; background-color: #e74c3c; color: white; text-decoration: none; border-radius: 4px;">Cancelar Turno</a>
          </div>
          
          <div style="margin-top: 30px; font-size: 14px; color: #777; text-align: center;">
            <p>Si necesitas realizar algún cambio, contáctanos al teléfono (123) 456-7890.</p>
            <p>¡Esperamos verte pronto!</p>
          </div>
        </div>
      `,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error en el servicio de email:', error);
    return { success: false, error };
  }
}

export async function enviarRecordatorioTurno(turno: TurnoInfo) {
  try {
    // Formatear la fecha y hora
    const fechaFormateada = new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'full',
      timeStyle: 'short'
    }).format(turno.fecha);

    // Enviar el correo electrónico usando nodemailer
    const info = await transporter.sendMail({
      from: `"Barbería" <${process.env.EMAIL_USER}>`,
      to: turno.cliente.email,
      subject: 'Recordatorio de tu turno mañana - Barbería',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333; text-align: center;">Recordatorio de turno</h2>
          
          <p>Hola ${turno.cliente.nombre},</p>
          
          <p>Te recordamos que mañana tienes un turno agendado en nuestra barbería.</p>
          
          <div style="background-color: #f8f8f8; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Fecha y hora:</strong> ${fechaFormateada}</p>
            <p style="margin: 5px 0;"><strong>Barbero:</strong> ${turno.barbero.nombre} ${turno.barbero.apellido}</p>
            <p style="margin: 5px 0;"><strong>Sucursal:</strong> ${turno.sucursal.nombre}</p>
            <p style="margin: 5px 0;"><strong>Dirección:</strong> ${turno.sucursal.direccion}</p>
          </div>
          
          <p style="text-align: center;">¡Te esperamos!</p>
        </div>
      `,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error en el servicio de email (recordatorio):', error);
    return { success: false, error };
  }
}

// Función para verificar la conexión al servidor de correo
export async function verificarConexionEmail() {
  try {
    await transporter.verify();
    return { success: true, message: 'Conexión establecida correctamente' };
  } catch (error) {
    console.error('Error al verificar conexión de email:', error);
    return { success: false, error };
  }
}