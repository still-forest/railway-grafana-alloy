## 🚀 Grafana Alloy + Railway

This template sets up [Grafana Alloy](https://grafana.com/docs/alloy/) to stream **metrics** and **logs** to your **Grafana Cloud** account—perfect for real-time observability with zero hassle.

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/-pwwc8?referralCode=fPHbu5)

### 📦 What’s Included

- **🔧 Remote Write to Grafana Cloud**
  - Sends Prometheus metrics and Loki logs to your Grafana Cloud instance
- **🌐 Local Endpoints**
  - Metrics receiver on `:9091`
  - Logs receiver on `:3100`
- **📉 System Metrics**
  - Lightweight host monitoring (with noisy collectors disabled)

---

### ⚙️ Setup

1. **Create a [Grafana Cloud](https://grafana.com/products/cloud/) account** (if you don't have one).
2. **Get your endpoint credentials:**

   - From the _Cloud Portal_, go to **Connections → Prometheus → Details**
   - Do the same for **Loki** (under **Connections → Loki**)

3. **Add these environment variables to Railway:**

| Variable                       | Description                             |
| ------------------------------ | --------------------------------------- |
| `GRAFANA_PROMETHEUS_HOST`      | Your Prometheus remote write endpoint   |
| `GRAFANA_PROMETHEUS_USERNAME`  | Provided in Grafana Cloud               |
| `GRAFANA_PROMETHEUS_PASSWORD`  | Provided in Grafana Cloud               |
| `LOKI_HOST`                    | Your Loki endpoint                      |
| `LOKI_USERNAME`                | Provided in Grafana Cloud               |
| `LOKI_PASSWORD`                | Provided in Grafana Cloud               |
| _(optional)_ `SCRAPE_INTERVAL` | Metrics scrape interval (default `30s`) |

---

### 🧪 How to Use

Make sure your targets are reachable from within Railway’s network. Then:

- Send metrics via Prometheus to `http://<your-app>.railway.app:9091/metrics`
- Send logs in [Loki Push API](https://grafana.com/docs/loki/latest/api/#post-lokiapiv1push) format to `http://<your-app>.railway.app:3100/loki/api/v1/push`

---

### 🎯 Example Use Cases

- Drop-in logging/metrics layer for any microservice
- Monitor background workers, queues, or cron jobs
- Build dashboards and alerts in Grafana Cloud
