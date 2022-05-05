#!/bin/sh

chmod 0700 -R "${PGDATA}"
initdb -U "postgres" "${PGDATA}"
cp /usr/share/postgresql${PG_VERSION}/postgresql.conf.sample "${PGDATA}/postgresql.conf"
echo "Starting Postgresql..."
pg_ctl -D "${PGDATA}" -w start
if [ "$1" == "--init-only" ]; then
  pg_ctl -D "${PGDATA}" -w stop
fi
