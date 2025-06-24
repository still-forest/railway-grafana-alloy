# Deploy and Host railway-grafana-alloy on Railway

**railway-grafana-alloy** is a plug-and-play observability layer that forwards your app’s metrics and logs to **Grafana Cloud** using Grafana Alloy. With built-in HTTP receivers, it's perfect for quickly integrating Prometheus and Loki into your stack—without extra setup.

## About Hosting railway-grafana-alloy

Hosting **railway-grafana-alloy** on Railway sets up Grafana Alloy as a lightweight telemetry gateway. It runs continuously, exposing HTTP endpoints to receive metrics (`:9091`) and logs (`:3100`), forwarding them securely to your Grafana Cloud account. This setup enables full observability for any service running on Railway (or externally) with minimal configuration. Alloy also collects basic system metrics by default, helping you monitor the Alloy instance itself. Environment variables are used to connect to Grafana Cloud, keeping your setup secure and flexible.

## Common Use Cases

- Stream logs from any Railway service to Grafana Loki
- Forward Prometheus metrics for dashboards and alerts
- Add observability to microservices, workers, or scheduled jobs

## Dependencies for railway-grafana-alloy Hosting

- A [Grafana Cloud](https://grafana.com/products/cloud/) account
- Prometheus or Loki clients to send data

### Deployment Dependencies

- [Grafana Cloud Loki Push API](https://grafana.com/docs/loki/latest/api/#post-lokiapiv1push)
- [Grafana Cloud Prometheus Remote Write](https://grafana.com/docs/grafana-cloud/data-configuration/prometheus/)

## Why Deploy railway-grafana-alloy on Railway?

<!-- Recommended: Keep this section as shown below -->
Railway is a singular platform to deploy your infrastructure stack. Railway will host your infrastructure so you don't have to deal with configuration, while allowing you to vertically and horizontally scale it.

By deploying railway-grafana-alloy on Railway, you are one step closer to supporting a complete full-stack application with minimal burden. Host your servers, databases, AI agents, and more on Railway.
<!-- End recommended section -->
