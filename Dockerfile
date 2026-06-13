# ==========================================
# Stage 1: Build Assets
# ==========================================
FROM node:20-alpine AS assets-builder

# Define build arguments for environment variables
ARG VITE_REVERB_APP_KEY=nzxstkahsb1doshpfx1q
ARG VITE_REVERB_PORT=8080
ARG VITE_REVERB_SCHEME=http
ARG VITE_VAPID_PUBLIC_KEY=BG1qIsC59QXhmz1g2tiwzugGVI_WZ24BovpxEyVuug9VSBBXdZz2mIFdv52yf5qLw-qiEgDVrLLesmbMGy5C5tQ

# Set environment variables during the build process
ENV VITE_REVERB_APP_KEY=$VITE_REVERB_APP_KEY
ENV VITE_REVERB_PORT=$VITE_REVERB_PORT
ENV VITE_REVERB_SCHEME=$VITE_REVERB_SCHEME
ENV VITE_VAPID_PUBLIC_KEY=$VITE_VAPID_PUBLIC_KEY

RUN apk add --no-cache \
    libc6-compat \
    php \
    php-cli \
    php-phar \
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

# Cache Node dependencies
COPY package*.json ./
RUN npm ci

# Bring in Composer temporarily to satisfy the Vite wayfinder plugin
COPY --from=composer:2.7 /usr/bin/composer /usr/bin/composer

# Cache PHP dependencies for Stage 1 artisan requirements (--ignore-platform-reqs added)
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-interaction --no-scripts --no-autoloader --ignore-platform-reqs

# Copy source and map autoloader so artisan wayfinder command runs safely
COPY . .
RUN composer dump-autoload --no-dev --optimize

# Compile the assets
RUN npm run build


# ==========================================
# Stage 2: Runtime PHP + Nginx Environment
# ==========================================
FROM php:8.3-fpm-alpine AS runtime

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

RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
    pdo_pgsql \
    pgsql \
    zip \
    gd \
    pcntl \
    opcache \
    intl

WORKDIR /var/www

# Copy configurations (Cached unless config files change)
COPY docker/nginx/default.conf /etc/nginx/http.d/default.conf
COPY docker/supervisor/supervisord.conf /etc/supervisord.conf
COPY --from=composer:2.7 /usr/bin/composer /usr/bin/composer

# Cache Composer dependencies for the production runtime environment
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --no-interaction

# Copy application source code
COPY --chown=www-data:www-data . .

# Copy built assets from assets-builder stage
COPY --from=assets-builder --chown=www-data:www-data /app/public/build ./public/build

# Finalize composer production optimizations
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Set up application structure permissions
RUN mkdir -p storage/framework/cache/data \
    && mkdir -p storage/framework/sessions \
    && mkdir -p storage/framework/views \
    && chmod -R 775 storage bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache

COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 80 8080

ENTRYPOINT ["entrypoint.sh"]
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]