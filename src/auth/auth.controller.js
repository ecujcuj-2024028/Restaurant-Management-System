import { sequelize } from '../../configs/db-postgres.js';
import { User, UserProfile, UserEmail } from '../user/user.model.js';
import { Role, UserRole } from '../auth/role.model.js';
import { CLIENTE } from '../../helpers/role-constants.js';
import { sendVerificationEmail } from '../../helpers/email-service.js';
import { generateVerificationToken } from '../../helpers/generate-jwt.js';
import bcrypt from 'bcryptjs';

export const register = async (req, res) => {
    // Iniciamos la transacción
    const t = await sequelize.transaction();

    try {
        const { name, surname, username, email, password, phone } = req.body;

        // 1. Encriptar la contraseña (usando el saltRounds de tu config)
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 2. Crear el Usuario
        const user = await User.create({
            Name: name,
            Surname: surname,
            Username: username,
            Email: email,
            Password: hashedPassword,
            Status: true // El usuario está activo para loguearse o false si esperas verificación
        }, { transaction: t });

        // 3. Crear el Perfil (UserProfile)
        await UserProfile.create({
            UserId: user.Id,
            Phone: phone
        }, { transaction: t });

        // 4. Buscar el Rol por defecto (CLIENTE)
        const role = await Role.findOne({ where: { Name: CLIENTE } });
        if (!role) {
            throw new Error(`El rol ${CLIENTE} no existe en la base de datos.`);
        }

        // 5. Asignar el Rol al Usuario
        await UserRole.create({
            UserId: user.Id,
            RoleId: role.Id
        }, { transaction: t });

        // 6. Generar token de verificación y guardar en UserEmail
        const verificationToken = await generateVerificationToken(user.Id, 'EMAIL_VERIFICATION');
        await UserEmail.create({
            UserId: user.Id,
            EmailVerificationToken: verificationToken,
            EmailVerificationTokenExpiry: new Date(Date.now() + (24 * 60 * 60 * 1000)) // 24h
        }, { transaction: t });

        // Si todo salió bien, guardamos cambios en la DB
        await t.commit();

        // 7. Enviar el correo (fuera de la transacción para no retrasar la DB)
        // No usamos 'await' aquí si no queremos que el usuario espere a que el SMTP responda,
        // pero es mejor manejarlo para loggear errores.
        sendVerificationEmail(user.Email, user.Name, verificationToken).catch(err => 
            console.error('Error enviando email de bienvenida:', err)
        );

        return res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente. Revisa tu correo para verificar la cuenta.',
            user: {
                id: user.Id,
                username: user.Username,
                email: user.Email
            }
        });

    } catch (error) {
        // Si algo falla, deshacemos todo lo creado en esta transacción
        if (t) await t.rollback();
        
        console.error('Error en Register:', error);
        
        // Manejo de errores de duplicados (Email/Username)
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({
                success: false,
                message: 'El nombre de usuario o el correo ya están en uso.'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Error al registrar el usuario.',
            error: error.message
        });
    }
};

export const login = async (req, res) => {
    try {
        const { emailOrUsername, password } = req.body;

        // 1. Buscar al usuario por email o username (usando Op.or de Sequelize)
        const user = await User.findOne({
            where: {
                [Op.or]: [
                    { Email: emailOrUsername },
                    { Username: emailOrUsername }
                ]
            },
            include: [{
                model: UserRole,
                as: 'UserRoles',
                include: [{ model: Role, as: 'Role' }]
            }]
        });

        // 2. Validar existencia y estado
        if (!user) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
        }

        if (!user.Status) {
            return res.status(403).json({ success: false, message: 'Tu cuenta está desactivada.' });
        }

        // 3. Verificar contraseña (comparamos con user.Password en mayúscula como tu modelo)
        const validPassword = await bcrypt.compare(password, user.Password);
        if (!validPassword) {
            return res.status(401).json({ success: false, message: 'Contraseña incorrecta.' });
        }

        // 4. Extraer roles para el token
        const roles = user.UserRoles.map(ur => ur.Role.Name);

        // 5. Generar el JWT (usando tu helper generateJWT)
        // Pasamos el ID y los roles como extraClaims
        const token = await generateJWT(user.Id, { roles });

        return res.status(200).json({
            success: true,
            message: `Bienvenido de nuevo, ${user.Name}`,
            token,
            user: {
                id: user.Id,
                username: user.Username,
                roles
            }
        });

    } catch (error) {
        console.error('Error en Login:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al intentar iniciar sesión.',
            error: error.message
        });
    }    
};

export const verifyEmail = async (req, res) => {
    try {
        const { token } = req.body;

        // 1. Buscar el registro que tenga ese token
        const userEmailRecord = await UserEmail.findOne({ 
            where: { EmailVerificationToken: token } 
        });

        if (!userEmailRecord) {
            return res.status(400).json({ success: false, message: "Token inválido." });
        }

        // 2. Verificar expiración
        if (new Date() > userEmailRecord.EmailVerificationTokenExpiry) {
            return res.status(400).json({ success: false, message: "El token ha expirado." });
        }

        // 3. Marcar como verificado y limpiar el token
        userEmailRecord.EmailVerified = true;
        userEmailRecord.EmailVerificationToken = null; 
        userEmailRecord.EmailVerificationTokenExpiry = null;
        await userEmailRecord.save();

        return res.status(200).json({ success: true, message: "Correo verificado exitosamente." });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};