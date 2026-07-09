const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const rootEnvPath = path.join(rootDir, '.env');

if (!fs.existsSync(rootEnvPath)) {
    console.error('Error: No se encontró el archivo .env en la raíz.');
    process.exit(1);
}

// Variables compartidas que queremos sincronizar
const sharedKeys = [
    'DB_HOST',
    'DB_PORT',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD',
    'DB_URL',
    'MONGO_URI',
    'JWT_SECRET',
    'JWT_ISSUER',
    'JWT_AUDIENCE',
    'JWT_EXPIRES_IN',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'CLOUDINARY_FOLDER',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_ENABLE_SSL',
    'SMTP_USERNAME',
    'SMTP_PASSWORD',
    'EMAIL_FROM',
    'EMAIL_FROM_NAME',
    'UPLOAD_PATH',
    'ROOT_ADMIN_EMAIL',
    'ROOT_ADMIN_PASSWORD',
    'ROOT_ADMIN_USERNAME',
    'ROOT_ADMIN_TOKEN'
];

// Leer .env raíz y parsear las claves compartidas
const rootEnvContent = fs.readFileSync(rootEnvPath, 'utf8');
const rootEnvLines = rootEnvContent.split('\n');
const rootConfig = {};

for (const line of rootEnvLines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
        const key = match[1].trim();
        const val = match[2].trim();
        if (sharedKeys.includes(key)) {
            rootConfig[key] = val;
        }
    }
}

console.log('Variables a sincronizar:', Object.keys(rootConfig));

// Servicios que necesitan base de datos
const targetEnvPaths = [
    path.join(rootDir, 'Backend/services/identity-service/.env'),
    path.join(rootDir, 'Backend/services/management-service/.env'),
    path.join(rootDir, 'Backend/services/order-service/.env'),
    path.join(rootDir, 'Backend/services/analytics-events-service/.env')
];

for (const envPath of targetEnvPaths) {
    if (!fs.existsSync(envPath)) {
        console.log(`Creando archivo .env para: ${path.relative(rootDir, envPath)}`);
        fs.writeFileSync(envPath, '', 'utf8');
    }

    let content = fs.readFileSync(envPath, 'utf8');
    console.log(`Sincronizando: ${path.relative(rootDir, envPath)}`);

    for (const [key, val] of Object.entries(rootConfig)) {
        const regex = new RegExp(`^${key}\\s*=.*$`, 'm');
        if (regex.test(content)) {
            content = content.replace(regex, `${key}=${val}`);
        } else {
            // Si la clave no está en el .env del servicio, la agregamos
            content = content.trim() + `\n${key}=${val}\n`;
        }
    }

    fs.writeFileSync(envPath, content, 'utf8');
}

console.log('¡Sincronización de variables .env completada con éxito!');
