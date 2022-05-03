ARG TEMPLATE_IMAGE

ARG DEVTOOLS_IMAGE

FROM lenra/devtools:${DEVTOOLS_IMAGE:-1.0.0-beta.34} as devtools

FROM ${TEMPLATE_IMAGE}

COPY --from=devtools /lenra/devtools /lenra/devtools

USER root

## Postgres installation
# Choose the place where to store data
ENV PGDATA=/var/lib/postgresql/data
# Configure postgres user informations
ENV POSTGRES_DB=lenra_dev
ENV POSTGRES_USER=lenra
ENV POSTGRES_PASSWORD=lenra

ENV OF_WATCHDOG_BIN=/usr/bin/fwatchdog
ENV SHELL=/bin/sh

# Install elixir dependencies
RUN apk add --no-cache ncurses-libs libstdc++

# make the "en_US.UTF-8" locale so postgres will be utf-8 enabled by default
#
ENV LANG en_US.utf8
#
# Add the postgres user to the docker image
RUN set -eux; \
	mkdir -p /var/lib/postgresql /run/postgresql; \
	chown -R app:nogroup /var/lib/postgresql /run/postgresql; \
	chmod -R 0700 /var/lib/postgresql /run/postgresql; \
	# Install PostgeSQL using provided version \
	apk add --no-cache postgresql;

COPY pg_entrypoint.sh pg_init.sh /lenra/devtools/

RUN chmod +x /lenra/devtools/pg_entrypoint.sh /lenra/devtools/pg_init.sh

USER app

RUN /lenra/devtools/pg_init.sh --init-only

VOLUME [ "/home/app/application" ]
ENTRYPOINT [ "/bin/sh" ]
CMD ["-c", "/lenra/devtools/pg_entrypoint.sh; /lenra/devtools/rel/dev_tools/bin/dev_tools start"]
