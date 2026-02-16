import { sequelize } from '../../configs/db-postgres.js';
import { User, UserProfile, UserEmail } from '../user/user.model.js';
import { Role, UserRole } from '../auth/role.model.js';
import { CLIENTE } from '../../helpers/role-constants.js';
import { sendVerificationEmail } from '../../helpers/email-service.js';
// 1. IMPORTACIÓN COMBINADA Y AGREGADO HASH_PASSWORD
import { generateJWT, generateVerificationToken } from '../../helpers/generate-jwt.js';
import { hashPassword, verifyPassword } from '../../utils/password-utils.js'; 
import { findUserByEmailOrUsername } from '../../helpers/user-db.js';

export const register = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { name, surname, username, email, password, phone } = req.body;

        // 2. Encriptar contraseña con el helper importado
        const hashedPassword = await hashPassword(password);

        const user = await User.create({
            Name: name,
            Surname: surname,
            Username: username.toLowerCase(),
            Email: email.toLowerCase(),
            Password: hashedPassword,
            Status: false // CAMBIO: Empieza en false para obligar a verificar correo
        }, { transaction: t });

        await UserProfile.create({
            UserId: user.Id,
            Phone: phone
        }, { transaction: t });

        const role = await Role.findOne({ where: { Name: CLIENTE } });
        if (!role) throw new Error(`El rol ${CLIENTE} no existe.`);

        await UserRole.create({
            UserId: user.Id,
            RoleId: role.Id
        }, { transaction: t });

        const verificationToken = await generateVerificationToken(user.Id, 'EMAIL_VERIFICATION');
        await UserEmail.create({
            UserId: user.Id,
            EmailVerificationToken: verificationToken,
            EmailVerificationTokenExpiry: new Date(Date.now() + (24 * 60 * 60 * 1000))
        }, { transaction: t });

        await t.commit();

        // Envío de correo en segundo plano
        sendVerificationEmail(user.Email, user.Name, verificationToken)
            .then(() => console.log(`Correo enviado a: ${user.Email}`))
            .catch(err => console.error('Error enviando email:', err));

        return res.status(201).json({
            success: true,
            message: 'Usuario registrado. Por favor verifica tu correo para activar tu cuenta.',
            user: { username: user.Username, email: user.Email }
        });

    } catch (error) {
        if (t) await t.rollback();
        console.error('Error en Register:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const login = async (req, res) => {
    try {
        const { emailOrUsername, password } = req.body;
        const user = await findUserByEmailOrUsername(emailOrUsername);

        if (!user) {
            return res.status(404).json({ success: false, message: 'Credenciales inválidas.' });
        }

        // Si el Status es false, no lo deja pasar
        if (!user.Status) {
            return res.status(403).json({ 
                success: false, 
                message: 'Cuenta desactivada o correo no verificado.' 
            });
        }

        const isMatch = await verifyPassword(user.Password, password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
        }

        const roles = user.UserRoles.map(ur => ur.Role.Name);
        const token = await generateJWT(user.Id, { roles });

        return res.status(200).json({
            success: true,
            message: `Bienvenido, ${user.Name}`,
            token,
            user: { id: user.Id, username: user.Username, roles }
        });
    } catch (error) {
        console.error('Login Error:', error);
        return res.status(500).json({ success: false, message: 'Error interno.' });
    }
};

export const verifyEmail = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { token } = req.body;

        const userEmailRecord = await UserEmail.findOne({
            where: { EmailVerificationToken: token },
            transaction: t
        });

        if (!userEmailRecord) {
            return res.status(400).json({ success: false, message: "Token inválido." });
        }

        if (new Date() > userEmailRecord.EmailVerificationTokenExpiry) {
            return res.status(400).json({ success: false, message: "El token ha expirado." });
        }

        // 3. ACTUALIZACIÓN: Verificamos correo Y ACTIVAMOS al usuario
        userEmailRecord.EmailVerified = true;
        userEmailRecord.EmailVerificationToken = null;
        userEmailRecord.EmailVerificationTokenExpiry = null;
        await userEmailRecord.save({ transaction: t });

        // Buscamos al usuario dueño de este email y lo activamos (Status: true)
        await User.update({ Status: true }, {
            where: { Id: userEmailRecord.UserId },
            transaction: t
        });

        await t.commit();
        return res.status(200).json({ success: true, message: "Correo verificado y cuenta activada." });

    } catch (error) {
        if (t) await t.rollback();
        return res.status(500).json({ success: false, message: error.message });
    }
};