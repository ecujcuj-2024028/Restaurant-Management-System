import nodemailer from 'nodemailer';
import { config } from '../configs/configs.js';

const createTransporter = () => {
    if (!config.smtp.username || !config.smtp.password) {
        console.warn(
            'SMTP credentials not configured. Email functionality will not work.'
        );
        return null;
    }

    return nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.enableSsl,
        auth: {
            user: config.smtp.username,
            pass: config.smtp.password,
        },
        connectionTimeout: 10_000,
        greetingTimeout  : 10_000,
        socketTimeout    : 10_000,
        tls: { rejectUnauthorized: true },
    });
};

const transporter = createTransporter();

const emailStyles = {
    container: "font-family: 'Inter', 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; color: #18181b; border: 1px solid #e4e4e7;",
    header: "background-color: #09090b; padding: 48px 20px; text-align: center;",
    body: "padding: 48px; line-height: 1.5;",
    title: "margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.05em; color: #ffffff; text-transform: uppercase;",
    heading: "color: #09090b; font-size: 22px; font-weight: 800; margin-bottom: 24px; letter-spacing: -0.025em;",
    text: "color: #52525b; font-size: 16px; margin-bottom: 32px;",
    button: "display: inline-block; background-color: #f97316; color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px; box-shadow: 0 10px 15px -3px rgba(249, 115, 22, 0.3);",
    footer: "background-color: #f4f4f5; padding: 32px; text-align: center;",
    footerText: "margin: 0; color: #71717a; font-size: 13px; font-weight: 500;",
    badge: "display: inline-block; background-color: #f9731610; color: #f97316; padding: 6px 12px; border-radius: 99px; font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 16px;"
};

const getFrontendUrl = () => {
    // La AuthPage ahora detecta el token y cambia a la vista de reset automáticamente
    return 'http://localhost:5173/login'; 
};

/* --- AUTENTICACIÓN --- */

export const sendVerificationEmail = async (email, name, verificationToken) => {
    if (!transporter) throw new Error('SMTP transporter not configured');
    const url = `${getFrontendUrl()}?token=${verificationToken}`;

    await transporter.sendMail({
        from: `"${config.smtp.fromName}" <${config.smtp.fromEmail}>`,
        to: email,
        subject: 'Verifica tu cuenta — GastroManager',
        html: `
            <div style="${emailStyles.container}">
                <div style="${emailStyles.header}">
                    <h1 style="${emailStyles.title}">GastroManager</h1>
                </div>
                <div style="${emailStyles.body}">
                    <div style="${emailStyles.badge}">Seguridad</div>
                    <h2 style="${emailStyles.heading}">Hola, ${name}</h2>
                    <p style="${emailStyles.text}">Bienvenido a la red de gestión gastronómica más avanzada. Para comenzar a utilizar tu cuenta, es necesario confirmar tu dirección de correo electrónico.</p>
                    <div style="text-align: center;">
                        <a href="${url}" style="${emailStyles.button}">Confirmar Cuenta</a>
                    </div>
                </div>
                <div style="${emailStyles.footer}">
                    <p style="${emailStyles.footerText}">GastroManager System &copy; ${new Date().getFullYear()}</p>
                </div>
            </div>`
    });
};

export const sendPasswordResetEmail = async (email, name, resetToken) => {
    if (!transporter) throw new Error('SMTP transporter not configured');
    const url = `${getFrontendUrl()}?token=${resetToken}`;

    await transporter.sendMail({
        from: `"${config.smtp.fromName}" <${config.smtp.fromEmail}>`,
        to: email,
        subject: 'Restablecer Contraseña — GastroManager',
        html: `
            <div style="${emailStyles.container}">
                <div style="${emailStyles.header}">
                    <h1 style="${emailStyles.title}">GastroManager</h1>
                </div>
                <div style="${emailStyles.body}">
                    <div style="${emailStyles.badge}">Recuperación</div>
                    <h2 style="${emailStyles.heading}">Solicitud de acceso</h2>
                    <p style="${emailStyles.text}">Hola ${name}, hemos recibido una solicitud para restablecer la seguridad de tu cuenta. Si no has sido tú, puedes ignorar este mensaje.</p>
                    <div style="text-align: center; margin-bottom: 32px;">
                        <a href="${url}" style="${emailStyles.button}">Restablecer Contraseña</a>
                    </div>
                    <p style="color: #ef4444; font-size: 13px; font-weight: 600; text-align: center;">Este enlace caducará en 60 minutos por motivos de seguridad.</p>
                </div>
                <div style="${emailStyles.footer}">
                    <p style="${emailStyles.footerText}">Enviado de forma automática por el sistema de seguridad.</p>
                </div>
            </div>`
    });
};

export const sendWelcomeEmail = async (email, name) => {
    if (!transporter) return;
    await transporter.sendMail({
        from: `"${config.smtp.fromName}" <${config.smtp.fromEmail}>`,
        to: email,
        subject: 'Bienvenido a GastroManager',
        html: `
            <div style="${emailStyles.container}">
                <div style="${emailStyles.header}">
                    <h1 style="${emailStyles.title}">GastroManager</h1>
                </div>
                <div style="${emailStyles.body}">
                    <div style="${emailStyles.badge}">Éxito</div>
                    <h2 style="${emailStyles.heading}">¡Cuenta activa, ${name}!</h2>
                    <p style="${emailStyles.text}">Tu acceso ha sido configurado correctamente. Ya puedes ingresar al panel y comenzar a optimizar tus operaciones.</p>
                    <div style="text-align: center;">
                        <a href="http://localhost:5173" style="${emailStyles.button}">Ir al Dashboard</a>
                    </div>
                </div>
                <div style="${emailStyles.footer}">
                    <p style="${emailStyles.footerText}">Gracias por confiar en nuestra tecnología.</p>
                </div>
            </div>`
    });
};

export const sendPasswordChangedEmail = async (email, name) => {
    if (!transporter) return;
    await transporter.sendMail({
        from: `"${config.smtp.fromName}" <${config.smtp.fromEmail}>`,
        to: email,
        subject: 'Seguridad: Contraseña Cambiada',
        html: `
            <div style="${emailStyles.container}">
                <div style="${emailStyles.header}">
                    <h1 style="${emailStyles.title}">GastroManager</h1>
                </div>
                <div style="${emailStyles.body}">
                    <div style="${emailStyles.badge}">Seguridad</div>
                    <h2 style="${emailStyles.heading}">Cambio confirmado</h2>
                    <p style="${emailStyles.text}">Hola ${name}, te confirmamos que la contraseña de tu cuenta ha sido actualizada con éxito.</p>
                </div>
                <div style="${emailStyles.footer}">
                    <p style="${emailStyles.footerText}">Si no reconoces este cambio, contacta a soporte inmediatamente.</p>
                </div>
            </div>`
    });
};

/* --- GESTIÓN DE ROLES --- */

export const sendRoleRequestEmail = async ({ adminEmail, userName, userEmail, currentRole, requestedRole, requestId, approvalToken }) => {
    if (!transporter) return;
    const url = `${getFrontendUrl()}?token=${approvalToken}`; // Simplificado para desarrollo

    await transporter.sendMail({
        from   : `"${config.smtp.fromName}" <${config.smtp.fromEmail}>`,
        to     : adminEmail,
        subject: `Solicitud de Rol: ${userName}`,
        html: `
            <div style="${emailStyles.container}">
                <div style="${emailStyles.header}">
                    <h1 style="${emailStyles.title}">GastroManager</h1>
                </div>
                <div style="${emailStyles.body}">
                    <div style="${emailStyles.badge}">Administración</div>
                    <h2 style="${emailStyles.heading}">Nueva solicitud</h2>
                    <p style="${emailStyles.text}">El usuario <b>${userName}</b> solicita escalar su cuenta de ${currentRole} a <b>${requestedRole}</b>.</p>
                </div>
            </div>`
    });
};

export const sendRoleUpgradeResponseEmail = async ({ userEmail, userName, requestedRole, status }) => {
    if (!transporter) return;
    const isApproved = status === 'APPROVED';
    await transporter.sendMail({
        from: `"${config.smtp.fromName}" <${config.smtp.fromEmail}>`,
        to: userEmail,
        subject: `Tu solicitud de rol ha sido ${isApproved ? 'Aprobada' : 'Declinada'}`,
        html: `
            <div style="${emailStyles.container}">
                <div style="${emailStyles.header}">
                    <h1 style="${emailStyles.title}">GastroManager</h1>
                </div>
                <div style="${emailStyles.body}">
                    <div style="${emailStyles.badge}">Estado</div>
                    <h2 style="${emailStyles.heading}">${isApproved ? '¡Solicitud Aprobada!' : 'Solicitud Revisada'}</h2>
                    <p style="${emailStyles.text}">Hola ${userName}, el administrador ha revisado tu perfil y tu solicitud para el rol ${requestedRole} ha sido <b>${isApproved ? 'APROBADA' : 'DECLINADA'}</b>.</p>
                </div>
            </div>`
    });
};

/* --- INVENTARIO Y NEGOCIO --- */

export const sendLowStockEmail = async ({ adminEmail, adminName, itemName, currentStock, minStock, unit, restaurantId }) => {
    if (!transporter) return;
    await transporter.sendMail({
        from: `"${config.smtp.fromName}" <${config.smtp.fromEmail}>`,
        to: adminEmail,
        subject: 'Alerta de Inventario: Stock Bajo',
        html: `
            <div style="${emailStyles.container}">
                <div style="background-color: #ef4444; padding: 48px 20px; text-align: center;">
                    <h1 style="${emailStyles.title}">GastroManager</h1>
                </div>
                <div style="${emailStyles.body}">
                    <div style="display: inline-block; background-color: #ef444410; color: #ef4444; padding: 6px 12px; border-radius: 99px; font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 16px;">Crítico</div>
                    <h2 style="${emailStyles.heading}">Reposición Necesaria</h2>
                    <p style="${emailStyles.text}">Hola ${adminName}, el insumo <b>${itemName}</b> ha alcanzado un nivel crítico de ${currentStock} ${unit}.</p>
                </div>
            </div>`
    });
};

export const sendReservationConfirmationEmail = async ({ customerEmail, customerName, restaurantName, tableNumber, tableLocation, date, time, guestCount, reservationId }) => {
    if (!transporter) return;
    await transporter.sendMail({
        from: `"${config.smtp.fromName}" <${config.smtp.fromEmail}>`,
        to: customerEmail,
        subject: 'Confirmación de Mesa — GastroManager',
        html: `
            <div style="${emailStyles.container}">
                <div style="${emailStyles.header}">
                    <h1 style="${emailStyles.title}">GastroManager</h1>
                </div>
                <div style="${emailStyles.body}">
                    <div style="${emailStyles.badge}">Reservación</div>
                    <h2 style="${emailStyles.heading}">¡Todo listo para tu visita!</h2>
                    <p style="${emailStyles.text}">Hola ${customerName}, tu mesa ha sido reservada con éxito en ${restaurantName} para el día ${date} a las ${time}.</p>
                </div>
            </div>`
    });
};

export const sendInvoiceEmail = async ({ customerEmail, customerName, invoiceNumber, date, restaurantName, tableNumber, items, total }) => {
    if (!transporter) return;
    await transporter.sendMail({
        from: `"${config.smtp.fromName}" <${config.smtp.fromEmail}>`,
        to: customerEmail,
        subject: 'Tu comprobante de consumo — GastroManager',
        html: `
            <div style="${emailStyles.container}">
                <div style="${emailStyles.header}">
                    <h1 style="${emailStyles.title}">GastroManager</h1>
                </div>
                <div style="${emailStyles.body}">
                    <div style="${emailStyles.badge}">Factura</div>
                    <h2 style="${emailStyles.heading}">Gracias por visitarnos</h2>
                    <p style="${emailStyles.text}">Se ha generado tu comprobante por un total de <b>Q ${total.toFixed(2)}</b>.</p>
                </div>
            </div>`
    });
};
