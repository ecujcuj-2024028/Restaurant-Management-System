FROM node:22-bookworm-slim

# Instalamos la versión 8 de pnpm para evitar el bloqueo estricto de la v9
RUN npm install -g pnpm@8.15.6

WORKDIR /app

COPY package.json ./

# Ahora pnpm instalará todo de corrido sin quejarse de los scripts
RUN pnpm install --no-frozen-lockfile

COPY . .

# Recuerda cambiar este puerto según el servicio (3000, 3001, 3002, 3003, 3004)
EXPOSE 3003

CMD ["node", "index.js"]