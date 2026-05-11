FROM node:22-bookworm-slim

RUN npm install -g pnpm@8.15.6

WORKDIR /app

COPY package.json ./

RUN pnpm install --no-frozen-lockfile

COPY . .

# CAMBIA ESTE NÚMERO DEPENDIENDO DEL SERVICIO (3000, 3001, 3002, 3003 o 3004)
EXPOSE 3001

CMD ["node", "index.js"]