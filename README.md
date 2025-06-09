# Grafana Alloy on Railway

This deploys Grafana Alloy to Railway with a basic Prometheus scrape configuration.

## Setup

1. Add the following environment variables in Railway:

   ```sh
   GRAFANA_PROMETHEUS_HOST=https://prometheus-prod-XX-XX-X.grafana.net/api/prom
   GRAFANA_PROMETHEUS_USERNAME=your_instance_id
   GRAFANA_PROMETHEUS_PASSWORD=your_api_key
   LOKI_HOST=https://logs-prod-XX-XX-X.grafana.net
   LOKI_USERNAME=your_instance_id
   LOKI_PASSWORD=your_api_key
   ```

2. Deploy the project.

3. View logs and metrics on your Grafana Cloud dashboard.

## Notes

- This image is stateless. No persistence.
- Make sure your targets are reachable from within Railway’s network.
