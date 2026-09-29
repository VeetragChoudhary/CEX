#!/bin/sh
set -e

# Postgres accepts connections slightly before it is ready to serve them, and
# compose's healthcheck only gates the first start. Retry rather than crash.
echo "Applying database migrations..."
until npx prisma migrate deploy; do
  echo "Migration failed, database may still be starting. Retrying in 2s..."
  sleep 2
done

echo "Migrations applied. Starting server."
exec "$@"
