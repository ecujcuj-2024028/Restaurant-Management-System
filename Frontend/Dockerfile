FROM node:22-bookworm-slim

RUN npm install -g pnpm@8.15.6

WORKDIR /app

COPY package.json ./

RUN pnpm install --no-frozen-lockfile

COPY . .

EXPOSE 5173

CMD ["pnpm", "run", "dev"]
