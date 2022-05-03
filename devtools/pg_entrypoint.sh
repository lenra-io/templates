#!/bin/sh

if [ "$(ls -A ${PGDATA})" ]; then
  pg_ctl -D "${PGDATA}" -w start
else
  echo "Postgresql data directory is empty, initializing..."
  /bin/sh -c /lenra/devtools/pg_init.sh
fi

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
