# Grafana Alloy on Railway

This deploys Grafana Alloy to Railway with a basic Prometheus scrape configuration.

## Setup

Define the following environment variables in Railway:

```sh
NODE_ENV=production
RAILWAY_SERVICE_NAME=your-service-name
RAILWAY_INSTANCE_NAME= # idk what this should be
GRAFANA_PROMETHEUS_URL=
GRAFANA_PROMETHEUS_USER=your-prometheus-user # typically an integer
GRAFANA_PROMETHEUS_PASSWORD=your-prometheus-api-key
LOKI_HOST=
LOKI_USERNAME=your-loki-username # typically an integer
LOKI_API_KEY=your-loki-api-key
```

---

# Express + Grafana Cloud Observability Template

A production-ready Express.js template with unified observability using Grafana Alloy for both metrics and logs collection.

## 🚀 Features

- **Express.js** with TypeScript
- **Grafana Alloy** for unified observability (metrics + logs)
- **Prometheus Metrics** - HTTP requests, system metrics, custom business metrics
- **Structured Logging** - JSON logs with automatic parsing in Grafana
- **Railway Deployment** - Optimized for Railway hosting
- **Security** - Helmet, CORS, compression middleware
- **Health Checks** - Built-in health and metrics endpoints
- **Process Management** - PM2 for running app + Alloy together

## 📊 What Gets Monitored

### Metrics (sent to Grafana Cloud Prometheus)

- HTTP request duration and count
- System metrics (CPU, memory, disk, network)
- Node.js metrics (event loop lag, garbage collection)
- Custom business metrics (user actions, API calls)

### Logs (sent to Grafana Cloud Loki)

- Application logs with structured JSON format
- Automatic log level extraction
- Request/response logging
- Error tracking with stack traces

## 🛠 Setup

### 1. Deploy to Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/YOUR_TEMPLATE_ID)

### 2. Configure Grafana Cloud

You'll need a Grafana Cloud account. Get your credentials:

1. **Prometheus**: Go to Grafana Cloud → Prometheus → Details
2. **Loki**: Go to Grafana Cloud → Logs → Details
3. **API Key**: Create an API key with `MetricsPublisher` role

### 3. Set Environment Variables

In Railway, configure these environment variables:

```env
# Grafana Cloud Prometheus
GRAFANA_PROMETHEUS_URL=https://prometheus-prod-XX-XX-X.grafana.net
GRAFANA_PROMETHEUS_USER=your_instance_id
GRAFANA_PROMETHEUS_PASSWORD=your_api_key

# Grafana Cloud Loki
LOKI_HOST=https://logs-prod-XX-XX-X.grafana.net
LOKI_USERNAME=your_instance_id
LOKI_API_KEY=your_api_key

# Application
NODE_ENV=production
PORT=3000
```

### 4. Local Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Start in development
npm run dev

# Start production build
npm start
```

## 📈 Endpoints

- `GET /` - API documentation
- `GET /health` - Health check
- `GET /metrics` - Prometheus metrics (scraped by Alloy)
- `GET /api/users` - Example API endpoint
- `POST /api/users` - Example API endpoint

## 🔍 Grafana Queries

### Metrics (Prometheus)

```promql
# Request rate
rate(http_requests_total[5m])

# Request duration
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Error rate
rate(http_requests_total{status_code=~"5.."}[5m])
```

### Logs (Loki)

```logql
# All application logs
{app="express-app"}

# Error logs only
{app="express-app", level="error"}

# Logs with specific message
{app="express-app"} |= "User created"
```

## 🏗 Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   Express App   │    │  Grafana Alloy  │
│                 │    │                 │
│ • HTTP Server   │    │ • Scrapes /metrics
│ • JSON Logs     │◄───┤ • Reads log files
│ • Prometheus    │    │ • Sends to Cloud
│   Metrics       │    │                 │
└─────────────────┘    └─────────────────┘
                                │
                                ▼
                    ┌─────────────────────┐
                    │   Grafana Cloud     │
                    │                     │
                    │ • Prometheus        │
                    │ • Loki              │
                    │ • Dashboards        │
                    │ • Alerting
```
