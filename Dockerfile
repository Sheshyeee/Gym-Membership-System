FROM php:8.4-fpm

# Vite build-time env vars (public values, safe to hardcode — these end up
# in the browser bundle anyway, they are not secrets)
ENV VITE_REVERB_APP_KEY=m9isj37qeaowgylev7he
ENV VITE_REVERB_HOST=gym-reverb.onrender.com
ENV VITE_REVERB_PORT=443
ENV VITE_REVERB_SCHEME=https

RUN apt-get update && apt-get install -y \
    git curl zip unzip nginx supervisor \
    libpng-dev libonig-dev libxml2-dev libzip-dev libpq-dev \
    && docker-php-ext-install pdo_pgsql mbstring exif pcntl bcmath gd zip \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

COPY . .

RUN composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader \
    && chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache

RUN npm ci && npm run build

COPY docker/nginx.conf /etc/nginx/sites-available/default
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 10000

ENTRYPOINT ["/entrypoint.sh"]