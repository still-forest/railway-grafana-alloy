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
                    │ • Alerting          │
                    └─────────────────────┘
```

## 🔧 Customization

### Adding Custom Metrics

```typescript
// In src/utils/metrics.ts
const myCustomMetric = new client.Counter({
  name: "my_custom_events_total",
  help: "Total custom events",
  labelNames: ["event_type"],
});

register.registerMetric(myCustomMetric);

// Usage
myCustomMetric.inc({ event_type: "user_signup" });
```

### Adding Custom Log Fields

```typescript
// In your route handlers
logger.info("Custom event", {
  userId: 123,
  action: "purchase",
  amount: 99.99,
  metadata: { plan: "premium" },
});
```

### Database Integration Example

```typescript
import { metrics } from "./utils/metrics";

async function getUser(id: string) {
  return await metrics.timeOperation("select", "users", async () => {
    // Your database query here
    return await db.users.findById(id);
  });
}
```

## 📋 Monitoring Best Practices

### Essential Dashboards

Create these dashboards in Grafana Cloud:

1. **Application Overview**

   - Request rate, latency, error rate
   - System resources (CPU, memory)
   - Active connections

2. **Error Tracking**

   - Error rate over time
   - Top error messages
   - Error logs with stack traces

3. **Business Metrics**
   - User registrations
   - API endpoint usage
   - Database performance

### Alerting Rules

Set up alerts for:

```promql
# High error rate (>5% for 5 minutes)
rate(http_requests_total{status_code=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05

# High response time (>1s for 95th percentile)
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1

# High memory usage (>80%)
process_resident_memory_bytes / process_virtual_memory_max_bytes > 0.8
```

## 🚨 Troubleshooting

### Logs Not Appearing in Grafana

1. Check Railway logs for Alloy errors
2. Verify environment variables are set correctly
3. Ensure log files are being created in `/app/logs/`
4. Test Grafana Cloud credentials

```bash
# Check if logs are being written
railway run ls -la /app/logs/

# Check Alloy status
railway run pm2 status
```

### Metrics Not Appearing

1. Check if `/metrics` endpoint is accessible
2. Verify Alloy is scraping the endpoint
3. Check Grafana Cloud Prometheus credentials

```bash
# Test metrics endpoint locally
curl http://localhost:3000/metrics

# Check PM2 processes
railway run pm2 logs grafana-alloy
```

### Railway Deployment Issues

1. Check build logs for compilation errors
2. Verify Dockerfile syntax
3. Ensure all required files are included

```bash
# Check Railway service status
railway status

# View deployment logs
railway logs
```

## 🔄 Scaling Considerations

### Multiple Services

This template can be extended for multiple services:

1. **Shared Alloy Service**: Deploy one Alloy instance that collects from multiple apps
2. **Per-Service Alloy**: Each service has its own Alloy instance
3. **Hybrid**: Mix of shared and dedicated depending on requirements

### Performance Optimization

For high-traffic applications:

```hcl
// In alloy-config.alloy - optimize batching
prometheus.remote_write "grafana_cloud" {
  endpoint {
    queue_config {
      capacity = 50000
      max_shards = 500
      max_samples_per_send = 5000
      batch_send_deadline = "1s"
    }
  }
}
```

## 💰 Cost Optimization

### Railway Hobby Plan ($5/month)

This template is optimized for the Railway Hobby plan:

- **Single container** reduces resource usage
- **Efficient batching** minimizes network overhead
- **Conditional logging** (errors in prod, all in dev)
- **Resource limits** prevent runaway costs

### Expected Usage

For a typical application:

- **Base subscription**: $5/month
- **Resource usage**: $2-4/month (usually under the $5 included)
- **Total cost**: ~$5/month

### Multiple Apps Strategy

When you have multiple apps:

- **App 1**: Financial Planning (with Alloy)
- **App 2**: Family Tree (logs to App 1's Alloy)
- **App 3**: Simpsons Ipsum (logs to App 1's Alloy)

This shared approach scales cost-effectively.

## 📚 Additional Resources

- [Grafana Alloy Documentation](https://grafana.com/docs/alloy/)
- [Prometheus Metrics Best Practices](https://prometheus.io/docs/practices/naming/)
- [Railway Documentation](https://docs.railway.app/)
- [Express.js Guide](https://expressjs.com/en/guide/)
- [Grafana Cloud Getting Started](https://grafana.com/docs/grafana-cloud/)

## 🎯 Template Usage

### For Single Applications

Perfect for:

- Personal projects
- Portfolio applications
- Small business apps
- Development/staging environments

### For Multiple Applications

Excellent foundation for:

- Microservices architecture
- Multi-tenant applications
- Development teams
- Production environments

## 🔐 Security Considerations

This template includes:

- **Helmet.js** for security headers
- **CORS** configuration
- **Input validation** examples
- **Environment variable** validation
- **Error handling** without information leaks

For production, also consider:

- Rate limiting
- Authentication/authorization
- Input sanitization
- Audit logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- [Railway Discord](https://discord.gg/railway)
- [Grafana Community](https://community.grafana.com/)
- [GitHub Issues](https://github.com/your-username/your-repo/issues)

## 🏷️ Tags

`express` `typescript` `grafana` `observability` `monitoring` `prometheus` `loki` `railway` `nodejs` `alloy`

---

**Made with ❤️ for Railway and Grafana Cloud**

_Start monitoring your applications in minutes, not hours._
