#!/bin/sh
set -e

# Clear any old caches from the build phase
php artisan config:clear
php artisan route:clear
php artisan view:clear

# 🔑 FIXED: Changed --noscript to --no-interaction
php artisan storage:link --no-interaction

# Run database migrations safely
echo "Running database migrations..."
php artisan migrate --force

# Optimize for production speed
echo "Optimizing application layout..."
php artisan optimize
php artisan view:cache

# Re-secure permissions for www-data after running commands as root
chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache
chmod -R 775 /var/www/storage /var/www/bootstrap/cache

# Hand off execution to Supervisor
exec "$@"