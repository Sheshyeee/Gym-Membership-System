#!/bin/sh
set -e

PORT="${PORT:-10000}"
sed -i "s/PORT_PLACEHOLDER/$PORT/g" /etc/nginx/sites-available/default

php artisan migrate --force

exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf