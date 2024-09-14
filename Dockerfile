# Stage 1: Build the React frontend
FROM node:20 as frontend-build
WORKDIR /app/frontend
COPY shram_game/package*.json ./
RUN npm install
COPY shram_game/ ./
RUN npm run build

# Stage 2: Build the Node.js backend
FROM node:20 as backend-build
WORKDIR /app/backend
COPY server/package*.json ./
RUN npm install
COPY server/ ./

# Stage 3: Create the final image
FROM node:20-slim
WORKDIR /app

# Copy backend files
COPY --from=backend-build /app/backend ./backend

# Copy frontend build files
COPY --from=frontend-build /app/frontend/build ./frontend/build

# Install production dependencies for backend
WORKDIR /app/backend
RUN npm install --only=production

# Set environment variables
ENV NODE_ENV=production
ENV PORT=10000

# Expose the port the app runs on
EXPOSE 10000

# Start the application
CMD ["node", "server.js"]