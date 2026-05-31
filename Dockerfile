# Stage 1: Build Assets
FROM node:20-alpine AS assets-builder

# Install PHP and extensions required for Laravel command-line boot (Wayfinder plugin builds types during Vite compile)
RUN apk add --no-cache \
    php \
    php-cli \
    php-mbstring \
    php-xml \
    php-dom \
    php-tokenizer \
    php-curl \
    php-openssl \
    php-session \
    php-fileinfo \
    php-ctype \
    php-json \
    php-simplexml \
    php-xmlwriter

WORKDIR /app

# Install Node.js dependencies
COPY package*.json ./
RUN npm ci

# Copy full source and build assets
COPY . .
RUN npm run build

# Stage 2: Runtime PHP + Nginx Environment
FROM php:8.3-fpm-alpine AS runtime

# Install system dependencies, Nginx, and Supervisor
RUN apk add --no-cache \
    nginx \
    supervisor \
    postgresql-client \
    postgresql-dev \
    libzip-dev \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    bash \
    icu-dev

# Install and configure PHP extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
    pdo_pgsql \
    pgsql \
    zip \
    gd \
    pcntl \
    opcache \
    intl

# Set working directory
WORKDIR /var/www

# Copy Nginx and Supervisor configurations
COPY docker/nginx/default.conf /etc/nginx/http.d/default.conf
COPY docker/supervisor/supervisord.conf /etc/supervisord.conf

# Copy application files
COPY --chown=www-data:www-data . .

# Copy built assets from assets-builder stage
COPY --from=assets-builder --chown=www-data:www-data /app/public/build ./public/build

# Copy composer from official image
COPY --from=composer:2.7 /usr/bin/composer /usr/bin/composer

# Install production dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Create and set permissions for storage and bootstrap directories
RUN mkdir -p storage/framework/cache/data \
    && mkdir -p storage/framework/sessions \
    && mkdir -p storage/framework/views \
    && chmod -R 775 storage bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache

# 1. Copy the entrypoint script from your Mac into the image system path
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh

# 2. Give the container permission to execute the script
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 80

# 3. Set the Entrypoint script as the gatekeeper
ENTRYPOINT ["entrypoint.sh"]

# 4. This command gets passed into "$@" at the end of entrypoint.sh
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
