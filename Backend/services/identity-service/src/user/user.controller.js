'use strict';

import { Op } from 'sequelize';
import { User, UserProfile } from './user.model.js';
import { UserRole, Role } from '../auth/role.model.js';
import { cloudinary, extractPublicId } from '../../middlewares/restaurant-uploader.js';
import { hashPassword, verifyPassword } from '../../utils/password-utils.js';

const getPagination = (query) => {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    return {
        page,
        limit,
        offset
    };
};

const buildPaginationMeta = (page, limit, total) => {
    const totalPages = Math.ceil(total / limit) || 1;

    return {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
    };
};

/* =========================
   GET /users/:id
   Obtiene un usuario por su ID
   ========================= */
export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findByPk(id, {
            attributes: ['Id', 'Name', 'Surname', 'Username', 'Email', 'Status'],
            include: [
                {
                    model: UserProfile,
                    as: 'UserProfile',
                    attributes: ['Phone', 'ProfilePicture'],
                },
                {
                    model: UserRole,
                    as: 'UserRole',
                    include: [{ model: Role, as: 'Role', attributes: ['Name'] }],
                },
            ],
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
        }

        return res.status(200).json({
            success: true,
            user: formatearUsuario(user)
        });
    } catch (error) {
        console.error('[UserController] getUserById:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

const formatearUsuario = (user) => ({
    id: user.Id,
    name: user.Name,
    surname: user.Surname,
    username: user.Username || user.username,
    email: user.Email,
    status: user.Status,
    phone: user.UserProfile?.Phone || null,
    profilePicture: user.UserProfile?.ProfilePicture || null,
    expoToken: user.ExpoToken || null,
    roles: user.UserRole?.Role?.Name ? [user.UserRole.Role.Name] : [],
    createdAt: user.CreatedAt,
    updatedAt: user.UpdatedAt
});

export const saveExpoToken = async (req, res) => {
    try {
        const userId = req.user.Id;
        const { expoToken } = req.body;

        if (!expoToken) {
            return res.status(400).json({ success: false, message: 'El token de Expo es requerido.' });
        }

        await User.update({ ExpoToken: expoToken }, { where: { Id: userId } });

        return res.status(200).json({ success: true, message: 'Token de notificaciones guardado correctamente.' });
    } catch (error) {
        console.error('[UserController] saveExpoToken:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/* =========================
   GET /users
   Lista usuarios del sistema para ADMIN_SISTEMA
   ========================= */
export const getUsers = async (req, res) => {
    try {
        const { search, status, role } = req.query;
        const { page, limit, offset } = getPagination(req.query);

        const where = {};

        if (search) {
            const terminoBusqueda = `%${search.trim()}%`;

            where[Op.or] = [
                { Name: { [Op.iLike]: terminoBusqueda } },
                { Surname: { [Op.iLike]: terminoBusqueda } },
                { Username: { [Op.iLike]: terminoBusqueda } },
                { Email: { [Op.iLike]: terminoBusqueda } }
            ];
        }

        if (status === 'active') {
            where.Status = true;
        }

        if (status === 'inactive') {
            where.Status = false;
        }

        const includeRoles = {
            model: UserRole,
            as: 'UserRoles',
            required: Boolean(role),
            include: [
                {
                    model: Role,
                    as: 'Role',
                    attributes: ['Name'],
                    ...(role && { where: { Name: role } })
                }
            ]
        };

        const { count, rows } = await User.findAndCountAll({
            where,
            attributes: [
                'Id',
                'Name',
                'Surname',
                'Username',
                'Email',
                'Status',
                'CreatedAt',
                'UpdatedAt'
            ],
            include: [
                {
                    model: UserProfile,
                    as: 'UserProfile',
                    attributes: ['Phone', 'ProfilePicture'],
                    required: false
                },
                includeRoles
            ],
            order: [['CreatedAt', 'DESC']],
            limit,
            offset,
            distinct: true
        });

        return res.status(200).json({
            success: true,
            users: rows.map(formatearUsuario),
            pagination: buildPaginationMeta(page, limit, count)
        });

    } catch (error) {
        console.error('[UserController] getUsers:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener usuarios',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/* =========================
   GET /users/profile
   Retorna el perfil completo del usuario autenticado
   ========================= */
export const getProfile = async (req, res) => {
    try {
        const userId = req.user.Id;

        const user = await User.findByPk(userId, {
            attributes: ['Id', 'Name', 'Surname', 'Username', 'Email', 'Status'],
            include: [
                {
                    model: UserProfile,
                    as: 'UserProfile',
                    attributes: ['Phone', 'ProfilePicture'],
                },
                {
                    model: UserRole,
                    as: 'UserRole',
                    include: [{ model: Role, as: 'Role', attributes: ['Name'] }],
                },
            ],
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
        }

        return res.status(200).json({
            success: true,
            user: {
                id            : user.Id,
                name          : user.Name,
                surname       : user.Surname,
                username      : user.Username || user.username,
                email         : user.Email,
                status        : user.Status,
                phone         : user.UserProfile?.Phone         || null,
                profilePicture: user.UserProfile?.ProfilePicture || null,
                roles         : user.UserRole?.Role?.Name ? [user.UserRole.Role.Name] : [],
            },
        });

    } catch (error) {
        console.error('[UserController] getProfile:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/* =========================
   PUT /users/profile
   Actualiza nombre, apellido y teléfono
   ========================= */
export const updateProfile = async (req, res) => {
    try {
        const userId      = req.user.Id;
        const { name, surname, username, phone } = req.body;

        if (!name && !surname && !username && !phone) {
            return res.status(400).json({
                success: false,
                message: 'Debes enviar al menos un campo para actualizar (name, surname, username, phone).',
            });
        }

        // Validar unicidad de username si se desea cambiar
        if (username) {
            const trimmedUsername = username.trim().toLowerCase();
            if (trimmedUsername) {
                const existing = await User.findOne({
                    where: {
                        Username: trimmedUsername,
                        Id: { [Op.ne]: userId }
                    }
                });
                if (existing) {
                    return res.status(400).json({
                        success: false,
                        message: 'El nombre de usuario ya está en uso.',
                    });
                }
            }
        }

        // Actualizar User si hay cambios de nombre/apellido/username
        if (name || surname || username) {
            const updates = {};
            if (name)      updates.Name     = name;
            if (surname)   updates.Surname  = surname;
            if (username)  updates.Username = username.trim().toLowerCase();

            await User.update(updates, { where: { Id: userId } });
        }

        // Actualizar UserProfile si hay cambio de teléfono
        if (phone) {
            await UserProfile.update({ Phone: phone }, { where: { UserId: userId } });
        }

        // Retornar perfil actualizado completo
        const updated = await User.findByPk(userId, {
            attributes: ['Id', 'Name', 'Surname', 'Username', 'Email', 'Status'],
            include: [
                {
                    model: UserProfile,
                    as: 'UserProfile',
                    attributes: ['Phone', 'ProfilePicture'],
                },
                {
                    model: UserRole,
                    as: 'UserRole',
                    include: [{ model: Role, as: 'Role', attributes: ['Name'] }],
                },
            ],
        });

        return res.status(200).json({
            success: true,
            message: 'Perfil actualizado correctamente.',
            user: {
                id            : updated.Id,
                name          : updated.Name,
                surname       : updated.Surname,
                username      : updated.Username || updated.username,
                email         : updated.Email,
                status        : updated.Status,
                phone         : updated.UserProfile?.Phone         || null,
                profilePicture: updated.UserProfile?.ProfilePicture || null,
                roles         : updated.UserRole?.Role?.Name ? [updated.UserRole.Role.Name] : [],
            },
        });

    } catch (error) {
        console.error('[UserController] updateProfile:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/* =========================
   PATCH /users/profile/picture
   Sube foto de perfil a Cloudinary y elimina la anterior
   ========================= */
export const updateProfilePicture = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No se proporcionó ninguna imagen.' });
        }

        const userId = req.user.Id;

        // Obtener imagen anterior para eliminarla de Cloudinary
        const profile = await UserProfile.findOne({ where: { UserId: userId } });

        if (profile?.ProfilePicture) {
            try {
                const publicId = extractPublicId(profile.ProfilePicture);
                if (publicId) {
                    await cloudinary.uploader.destroy(publicId);
                }
            } catch (err) {
                // No bloquear si falla la eliminación de la imagen anterior
                console.warn('[UserController] No se pudo eliminar imagen anterior:', err.message);
            }
        }

        // Guardar nueva URL de Cloudinary
        const newPictureUrl = req.file.path;
        await UserProfile.update({ ProfilePicture: newPictureUrl }, { where: { UserId: userId } });

        // Retornar perfil actualizado completo
        const updated = await User.findByPk(userId, {
            attributes: ['Id', 'Name', 'Surname', 'Username', 'Email', 'Status'],
            include: [
                {
                    model: UserProfile,
                    as: 'UserProfile',
                    attributes: ['Phone', 'ProfilePicture'],
                },
                {
                    model: UserRole,
                    as: 'UserRole',
                    include: [{ model: Role, as: 'Role', attributes: ['Name'] }],
                },
            ],
        });

        return res.status(200).json({
            success: true,
            message: 'Foto de perfil actualizada correctamente.',
            user: {
                id            : updated.Id,
                name          : updated.Name,
                surname       : updated.Surname,
                username      : updated.Username || updated.username,
                email         : updated.Email,
                status        : updated.Status,
                phone         : updated.UserProfile?.Phone         || null,
                profilePicture: updated.UserProfile?.ProfilePicture || null,
                roles         : updated.UserRole?.Role?.Name ? [updated.UserRole.Role.Name] : [],
            },
        });

    } catch (error) {
        console.error('[UserController] updateProfilePicture:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/* =========================
   PATCH /users/profile/password
   Cambia la contraseña del usuario validando la actual
   ========================= */
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.Id;

        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

        const isMatch = await verifyPassword(user.Password, currentPassword);
        if (!isMatch) return res.status(400).json({ success: false, message: 'La contraseña actual es incorrecta' });

        const hashedPassword = await hashPassword(newPassword);
        user.Password = hashedPassword;
        await user.save();

        return res.status(200).json({ success: true, message: 'Contraseña actualizada correctamente' });
    } catch (error) {
        console.error('[UserController] changePassword:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};