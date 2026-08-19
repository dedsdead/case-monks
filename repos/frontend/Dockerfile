# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:1.25-alpine

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration - override main config
COPY nginx.conf /etc/nginx/nginx.conf

# Create cache directories with proper permissions
RUN mkdir -p /var/cache/nginx/client_temp /var/cache/nginx/proxy_temp /var/run/nginx /tmp/nginx /var/log/nginx && \
    chmod -R 777 /var/cache/nginx /var/run/nginx /tmp/nginx /var/log/nginx && \
    touch /var/log/nginx/access.log /var/log/nginx/error.log

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]