FROM openfaas/of-watchdog:0.7.2 as watchdog

FROM alpine:3.11 as runner

# Install packages and add non-root user
RUN apk --no-cache add curl ca-certificates \
    && addgroup -S app && adduser -S -g app app

ENV USER=app

# Copy of-watchdog binary
COPY --from=watchdog /fwatchdog /usr/bin/fwatchdog
RUN chmod +x /usr/bin/fwatchdog

WORKDIR /home/app

COPY main/target/release/main ./main
RUN pwd && ls -lia /home/app/

# Set up watchdog for HTTP mode
ENV fprocess="/home/app/main"
ENV mode="http"
ENV upstream_url="http://127.0.0.1:3000"

HEALTHCHECK --interval=3s CMD [ -e /tmp/.lock ] || exit 1

CMD ["fwatchdog"]
