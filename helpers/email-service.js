import nodemailer from 'nodemailer';
import { config } from '../configs/configs.js';

// Configurar el transportador de email (aligned with .NET SmtpSettings)
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
        secure: config.smtp.enableSsl, // true para 465, false para 587
        auth: {
            user: config.smtp.username,
            pass: config.smtp.password,
        },
        // Evitar que las peticiones HTTP queden colgadas si SMTP no responde
        connectionTimeout: 10_000, // 10s
        greetingTimeout: 10_000, // 10s
        socketTimeout: 10_000, // 10s
        tls: {
            rejectUnauthorized: false,
        },
    });
};

const transporter = createTransporter();

/* ============================================================
   EMAILS DE AUTENTICACIÓN
   ============================================================ */

export const sendVerificationEmail = async (email, name, verificationToken) => {
    if (!transporter) throw new Error('SMTP transporter not configured');

    try {
        const frontendUrl = config.app.frontendUrl || 'http://localhost:3006/restaurantManagement/v1/';
        const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;

        const mailOptions = {
            from: `${config.smtp.fromName} <${config.smtp.fromEmail}>`,
            to: email,
            subject: 'Verify your email address',
            html: `
                <h2>Welcome ${name}!</h2>
                <p>Please verify your email address by clicking the link below:</p>
                <a href='${verificationUrl}' style='background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>
                    Verify Email
                </a>
                <p>If you cannot click the link, copy and paste this URL into your browser:</p>
                <p>${verificationUrl}</p>
                <p>This link will expire in 24 hours.</p>
                <p>If you didn't create an account, please ignore this email.</p>
            `,
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending verification email:', error);
        throw error;
    }
};

export const sendPasswordResetEmail = async (email, name, resetToken) => {
    if (!transporter) throw new Error('SMTP transporter not configured');

    try {
        const frontendUrl = config.app.frontendUrl || 'http://localhost:3006/restaurantManagement/v1/';
        const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

        const mailOptions = {
            from: `${config.smtp.fromName} <${config.smtp.fromEmail}>`,
            to: email,
            subject: 'Reset your password',
            html: `
                <h2>Password Reset Request</h2>
                <p>Hello ${name},</p>
                <p>You requested to reset your password. Click the link below to reset it:</p>
                <a href='${resetUrl}' style='background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>
                    Reset Password
                </a>
                <p>If you cannot click the link, copy and paste this URL into your browser:</p>
                <p>${resetUrl}</p>
                <p>This link will expire in 1 hour.</p>
                <p>If you didn't request this, please ignore this email.</p>
            `,
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending password reset email:', error);
        throw error;
    }
};

export const sendWelcomeEmail = async (email, name) => {
    if (!transporter) throw new Error('SMTP transporter not configured');

    try {
        const mailOptions = {
            from: `${config.smtp.fromName} <${config.smtp.fromEmail}>`,
            to: email,
            subject: 'Welcome to Kinal Restaurant!',
            html: `
                <h2>Welcome to Kinal Restaurant, ${name}!</h2>
                <p>Your account has been successfully verified and activated.</p>
                <p>You can now enjoy all the features of our platform.</p>
                <p>Thank you for joining us!</p>
            `,
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending welcome email:', error);
        throw error;
    }
};

export const sendPasswordChangedEmail = async (email, name) => {
    if (!transporter) throw new Error('SMTP transporter not configured');

    try {
        const mailOptions = {
            from: `${config.smtp.fromName} <${config.smtp.fromEmail}>`,
            to: email,
            subject: 'Password Changed Successfully',
            html: `
                <h2>Password Changed</h2>
                <p>Hello ${name},</p>
                <p>Your password has been successfully updated.</p>
                <p>If you didn't make this change, please contact our support team immediately.</p>
            `,
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending password changed email:', error);
        throw error;
    }
};

export const sendRoleRequestEmail = async ({ adminEmail, userName, userEmail, currentRole, requestedRole, requestId }) => {
    if (!transporter) throw new Error('SMTP transporter not configured');

    const frontendUrl = config.app.frontendUrl || 'http://localhost:3006/restaurantManagement/v1';
    const approveUrl = `${frontendUrl}/auth/role-requests/${requestId}/approve?token=${process.env.ROOT_ADMIN_TOKEN}`;
    const rejectUrl = `${frontendUrl}/auth/role-requests/${requestId}/reject?token=${process.env.ROOT_ADMIN_TOKEN}`;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e4e4e4; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #1a237e; color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">GastroManager Admin</h1>
            </div>
            <div style="padding: 30px; color: #333; line-height: 1.6;">
                <h2 style="color: #1a237e;">Solicitud de Cambio de Rol</h2>
                <p>Se ha recibido una nueva solicitud de ascenso para el usuario <b>${userName}</b>:</p>
                
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
                    <span style="color: #666; font-size: 14px; display: block; margin-bottom: 5px;">CAMBIO SOLICITADO</span>
                    <span style="font-weight: bold; color: #333;">${currentRole}</span>
                    <span style="margin: 0 15px; color: #1a237e; font-size: 20px;">➔</span>
                    <span style="font-weight: bold; color: #1a237e;">${requestedRole}</span>
                </div>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Correo:</td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">${userEmail}</td>
                    </tr>
                </table>

                <p>Acciones administrativas:</p>
                <div style="text-align: center; margin-top: 30px;">
                    <a href="${approveUrl}" style="background-color: #2e7d32; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-right: 10px;">Aprobar</a>
                    <a href="${rejectUrl}" style="background-color: #c62828; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Rechazar</a>
                </div>
            </div>
        </div>
    `;

    try {
        await transporter.sendMail({
            from: `"${config.smtp.fromName}" <${config.smtp.fromEmail}>`,
            to: adminEmail,
            subject: `Solicitud de Rol: ${currentRole} a ${requestedRole}`,
            html
        });
    } catch (error) {
        console.error('Error sending role request email:', error);
    }
};

// Email que recibe el USUARIO con la respuesta final
export const sendRoleUpgradeResponseEmail = async ({ userEmail, userName, requestedRole, status }) => {
    if (!transporter) throw new Error('SMTP transporter not configured');

    const isApproved = status === 'APPROVED';
    const statusText = isApproved ? 'Aprobada' : 'Declinada';
    const statusColor = isApproved ? '#2e7d32' : '#c62828';

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e4e4e4; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #1a237e; color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">Kinal Restaurant</h1>
            </div>
            <div style="padding: 30px; color: #333; line-height: 1.6;">
                <h2 style="color: #1a237e;">Actualización de Solicitud</h2>
                <p>Hola <b>${userName}</b>,</p>
                <p>El administrador ha revisado tu solicitud para el rol de <b>${requestedRole}</b>.</p>
                <div style="background-color: #f9f9f9; border-left: 5px solid ${statusColor}; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; font-weight: bold; color: ${statusColor};">Estado de la solicitud: ${statusText}</p>
                </div>
                ${isApproved
            ? '<p>Tus nuevos privilegios han sido activados. Por favor, cierra sesión y vuelve a ingresar para aplicar los cambios.</p>'
            : '<p>Lamentablemente, tu solicitud no ha sido aprobada en este momento. Si crees que esto es un error, contacta a soporte.</p>'}
                <p>Saludos,<br>El equipo de Kinal Restaurant</p>
            </div>
            <div style="background-color: #f5f5f5; color: #777; padding: 15px; text-align: center; font-size: 12px;">
                © 2026 Kinal Restaurant Infrastructure. Todos los derechos reservados.
            </div>
        </div>
    `;

    try {
        await transporter.sendMail({
            from: `"${config.smtp.fromName}" <${config.smtp.fromEmail}>`,
            to: userEmail,
            subject: `Resultado de tu solicitud de rol: ${statusText}`,
            html
        });
    } catch (error) {
        console.error('Error sending role upgrade response email:', error);
    }
};