# Grafana Alloy on Railway

This deploys Grafana Alloy to Railway with a basic Prometheus scrape configuration.

## Setup

1. Add the following environment variables in Railway:
   - `GRAFANA_CLOUD_METRICS_URL`
   - `GRAFANA_CLOUD_USERNAME`
   - `GRAFANA_CLOUD_API_KEY`

2. Deploy the project.

3. View logs and metrics on your Grafana Cloud dashboard.

## Notes

- This image is stateless. No persistence.
- Make sure your targets are reachable from within Railway’s network.
