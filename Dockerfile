# Build Image
FROM node:20.10.0-alpine as build

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json .

# Install dependencies
RUN npm install

# Prisma
COPY ./prisma .

RUN npx prisma generate

# Copy source code
COPY . .

# Build source code
RUN npm run build

# Production Image
FROM node:20.10.0-alpine as production

ENV NODE_ENV="production"
ENV PORT=5000

WORKDIR /app

RUN mkdir uploads
RUN mkdir uploads/originals
RUN mkdir uploads/scenes

# Copy package.json and package-lock.json
COPY package*.json .

# Copy prisma client
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY ./prisma .

# Install dependencies
RUN npm ci --only=production

# Copy build folder
COPY --from=build /app/dist ./dist

# Start application
CMD [ "npm", "run", "start" ]