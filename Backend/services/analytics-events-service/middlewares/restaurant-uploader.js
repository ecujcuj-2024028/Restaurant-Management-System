import multer from "multer";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';
import { CloudinaryStorage } from "multer-storage-cloudinary";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Intentar cargar el .env de la raíz del backend si no está en el local
dotenv.config(); // Carga local si existe
dotenv.config({ path: path.resolve(__dirname, "../../.env") }); // Carga desde el root del backend

console.log("Cloudinary Config Check:", {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? "Configurado" : "FALTA",
    folder: process.env.CLOUDINARY_FOLDER || "Default",
});

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const MIMETYPES = [
    'image/jpeg',
    'image/png',
    'image/jpg',
    'image/webp',
    'image/avif'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const createCloudinaryUploader = (folder) => {
    const storage = new CloudinaryStorage({
        cloudinary: cloudinary,
        params: async (req, file) => {
            console.log("Subiendo archivo a Cloudinary:", file.originalname);
            const fileExt = extname(file.originalname);
            const baseName = file.originalname.replace(fileExt, '');

            const safeBase = baseName
                .toLowerCase()
                .replace(/[^a-z0-9]+/gi, '-')
                .replace(/^-+|-+$/g, '');

            const shortUuid = uuidv4().substring(0, 8);
            const publicId = `${safeBase}-${shortUuid}`;

            return {
                folder: folder,
                public_id: publicId,
                allowed_formats: ['jpeg', 'jpg', 'png', 'webp', 'avif'],
                transformation: [{ width: 1000, height: 1000, crop: 'limit' }],
                resource_type: 'image'
            };
        }
    });

    return multer({
        storage,
        fileFilter: (req, file, cb) => {
            console.log("Multer recibiendo archivo:", file.mimetype, file.originalname);
            if (MIMETYPES.includes(file.mimetype)) {
                cb(null, true);
            } else {
                console.error("Tipo de archivo no permitido:", file.mimetype);
                cb(new Error(`Solo se permiten imágenes: ${MIMETYPES.join(', ')}`));
            }
        },
        limits: {
            fileSize: MAX_FILE_SIZE
        }
    });
};

export const uploadRestaurantImage = createCloudinaryUploader(
    process.env.CLOUDINARY_FOLDER || 'restaurant_management/restaurants'
);

// Uploader dedicado para productos con su propia carpeta en Cloudinary
export const uploadProductImage = createCloudinaryUploader(
    'restaurant_management/products'
);

// Uploader dedicado para eventos con su propia carpeta en Cloudinary
export const uploadEventImage = createCloudinaryUploader(
    'restaurant_management/events'
);

export const extractPublicId = (cloudinaryUrl) => {
    try {
        const parts = cloudinaryUrl.split('/');
        const uploadIndex = parts.indexOf('upload');
        const withVersion = parts.slice(uploadIndex + 1).join('/');
        const withoutVersion = withVersion.replace(/^v\d+\//, '');
        return withoutVersion.replace(/\.[^/.]+$/, '');
    } catch {
        return null;
    }
};

export { cloudinary };