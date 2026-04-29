FROM node:22-alpine
RUN npm install -g pnpm
WORKDIR /app
COPY package.json ./
RUN pnpm install --no-frozen-lockfile
COPY . .
EXPOSE 3004
CMD ["node", "index.js"]
