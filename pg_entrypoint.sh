#!/bin/sh

if [ ! "$(ls -A ${PGDATA})" ]; then
  echo "Postgresql data directory is empty, initializing..."
  chmod 0700 -R "${PGDATA}"
  tmp_pass=$(< /dev/urandom tr -dc _A-Z-a-z-0-9 | head -c${1:-12}; echo)
  echo "postgres user pass is '$tmp_pass'"
  initdb -U "postgres" "${PGDATA}"
  cp /usr/share/postgresql${PG_VERSION}/postgresql.conf.sample "${PGDATA}/postgresql.conf"
  echo "Starting Postgresql..."
  pg_ctl -D "${PGDATA}" -w start
  if [ "$INIT_ONLY" == "1" ]; then
    pg_ctl -D "${PGDATA}" -w stop
  fi
else
  echo "Starting Postgresql..."
  if [ "$INIT_ONLY" != "1" ]; then
    pg_ctl -D "${PGDATA}" -w start
  fi
fi

if [ "$INIT_ONLY" != "1" ]; then
  if [ "$( psql -XtA -U postgres -c "SELECT 1 FROM pg_database WHERE datname='${POSTGRES_DB}'" )" != '1' ]; then
    psql -U postgres --dbname postgres --set db=${POSTGRES_DB} --set user=${POSTGRES_USER} --set password=${POSTGRES_PASSWORD} <<-'EOSQL'
      CREATE DATABASE :db ;
      CREATE USER :user WITH ENCRYPTED PASSWORD :'password' ;
      GRANT ALL PRIVILEGES ON DATABASE :db TO :user ;
EOSQL
    if [ -d "/docker-entrypoint-initdb.d/" ]; then
      echo "Running init scripts..."
      for f in /docker-entrypoint-initdb.d/*.sql; do
        echo "Executing $f"
        psql -U ${POSTGRES_USER} --dbname ${POSTGRES_DB} -f "$f"
      done
    fi
  fi
fi
