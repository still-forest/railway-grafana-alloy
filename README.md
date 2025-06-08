# Grafana Alloy on Railway (Metrics + Logs + Traces)

This project deploys Grafana Alloy with full observability support:

- Metrics via Prometheus remote_write
- Logs from local JSON logs to Loki
- Traces via OTLP to Tempo

## Setup

1. Add the following environment variables in Railway:

   - `GRAFANA_CLOUD_USERNAME`
   - `GRAFANA_CLOUD_API_KEY`
   - `GRAFANA_CLOUD_METRICS_URL`
   - `GRAFANA_CLOUD_LOGS_URL`
   - `GRAFANA_CLOUD_TRACES_URL`

   Typically, URLs will be of the form:

   - Metrics: `https://prometheus-prod-##.grafana.net/api/prom/`push
   - Logs: `https://logs-prod-##.grafana.net/loki/api/v1/push`
   - Traces: `https://tempo-prod-##.grafana.net/otlp`

   Use the Instance ID as the username and the API Token as the password.

2. Make sure `/var/log/app.log` is available or mount the log source.

3. Deploy to Railway as a Docker service.

## Notes

- This container runs Alloy in stateless mode.
- You can point apps to Alloy's OTLP endpoint to send traces (via gRPC or HTTP).
- Ensure logs exist at the defined path for log forwarding to work.
