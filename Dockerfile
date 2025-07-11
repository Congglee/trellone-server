# ===== Stage 1: Builder =====
# This stage builds the TypeScript application into JavaScript.
# This image contains all devDependencies and the source code.
FROM node:22-alpine3.22 AS builder

WORKDIR /home/node/app

# Install the necessary dependencies for the build
# Copy only package*.json to leverage caching
COPY package*.json ./

# Use 'npm ci' for a precise and faster installation from package-lock.json
RUN npm ci

# Copy the entire source code
COPY . .

# Build the application
RUN npm run build

# Prune devDependencies to prepare for the production stage,
# keeping only the node_modules necessary for production.
RUN npm prune --production

# ===== Stage 2: Production =====
# This stage creates the final, super-lightweight image to run the application.
FROM node:22-alpine3.22

WORKDIR /home/node/app

# Install pm2-runtime globally
RUN npm install -g pm2

# Copy the pruned dependencies from the builder stage
COPY --chown=node:node --from=builder /home/node/app/node_modules ./node_modules

# Copy the built code from the builder stage
COPY --chown=node:node --from=builder /home/node/app/dist ./dist

# Copy environment files
COPY --chown=node:node --from=builder /home/node/app/.env* ./

# Copy HTML email templates (needed at runtime)
COPY --chown=node:node --from=builder /home/node/app/src/templates ./src/templates

# Copy other necessary files
COPY --chown=node:node ecosystem.config.js .
COPY --chown=node:node package.json .

# Create uploads directories with proper permissions
RUN mkdir -p uploads/images/temp uploads/documents/temp && \
    chown -R node:node uploads

# Switch to node user for security
USER node

EXPOSE 8000

# Run the application
CMD ["pm2-runtime", "start", "ecosystem.config.js"]