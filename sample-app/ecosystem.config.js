module.exports = {
	apps: [
		{
			name: "express-app",
			script: "dist/index.js",
			env: {
				NODE_ENV: "production",
				PORT: process.env.PORT || 3000,
			},
			// Restart on crash
			autorestart: true,
			max_restarts: 10,
			min_uptime: "10s",
			// Log configuration
			log_file: "/app/logs/pm2-app.log",
			error_file: "/app/logs/pm2-app-error.log",
			out_file: "/app/logs/pm2-app-out.log",
			log_date_format: "YYYY-MM-DD HH:mm:ss Z",
		},
		{
			name: "grafana-alloy",
			script: "alloy",
			args: "run /app/alloy-config.alloy",
			env: {
				// Grafana Cloud Prometheus
				GRAFANA_PROMETHEUS_URL: process.env.GRAFANA_PROMETHEUS_URL,
				GRAFANA_PROMETHEUS_USER: process.env.GRAFANA_PROMETHEUS_USER,
				GRAFANA_PROMETHEUS_PASSWORD: process.env.GRAFANA_PROMETHEUS_PASSWORD,
				// Grafana Cloud Loki
				LOKI_HOST: process.env.LOKI_HOST,
				LOKI_USERNAME: process.env.LOKI_USERNAME,
				LOKI_API_KEY: process.env.LOKI_API_KEY,
				// App environment
				NODE_ENV: process.env.NODE_ENV || "production",
			},
			// Restart on crash
			autorestart: true,
			max_restarts: 10,
			min_uptime: "10s",
			// Log configuration
			log_file: "/app/logs/pm2-alloy.log",
			error_file: "/app/logs/pm2-alloy-error.log",
			out_file: "/app/logs/pm2-alloy-out.log",
			log_date_format: "YYYY-MM-DD HH:mm:ss Z",
		},
	],
};
