import client from "prom-client";
import type { Request, Response, NextFunction } from "express";

// Create a registry for our metrics
export const register = new client.Registry();

// Add default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({
	register,
	timeout: 5000,
	gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
});

// HTTP request duration histogram
const httpRequestDuration = new client.Histogram({
	name: "http_request_duration_seconds",
	help: "Duration of HTTP requests in seconds",
	labelNames: ["method", "route", "status_code"],
	buckets: [0.001, 0.01, 0.1, 0.5, 1, 2, 5, 10],
});

// HTTP request count counter
const httpRequestsTotal = new client.Counter({
	name: "http_requests_total",
	help: "Total number of HTTP requests",
	labelNames: ["method", "route", "status_code"],
});

// Active connections gauge
const activeConnections = new client.Gauge({
	name: "http_active_connections",
	help: "Number of active HTTP connections",
});

// Business/application specific metrics
const userRequestsTotal = new client.Counter({
	name: "user_requests_total",
	help: "Total user-related API requests",
	labelNames: ["endpoint"],
});

const usersCreatedTotal = new client.Counter({
	name: "users_created_total",
	help: "Total number of users created",
});

const databaseOperationDuration = new client.Histogram({
	name: "database_operation_duration_seconds",
	help: "Duration of database operations",
	labelNames: ["operation", "table"],
	buckets: [0.001, 0.01, 0.1, 0.5, 1, 2, 5],
});

// Register all metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(activeConnections);
register.registerMetric(userRequestsTotal);
register.registerMetric(usersCreatedTotal);
register.registerMetric(databaseOperationDuration);

// HTTP middleware to collect request metrics
const httpMiddleware = (req: Request, res: Response, next: NextFunction) => {
	const start = Date.now();

	// Increment active connections
	activeConnections.inc();

	// When response finishes, record metrics
	res.on("finish", () => {
		const duration = (Date.now() - start) / 1000;
		const route = req.route?.path || req.path;
		const statusCode = res.statusCode.toString();

		// Record request duration
		httpRequestDuration.labels(req.method, route, statusCode).observe(duration);

		// Increment request counter
		httpRequestsTotal.labels(req.method, route, statusCode).inc();

		// Decrement active connections
		activeConnections.dec();
	});

	next();
};

// Utility function to time database operations
const timeOperation = async <T>(
	operation: string,
	table: string,
	fn: () => Promise<T>,
): Promise<T> => {
	const end = databaseOperationDuration.startTimer({ operation, table });
	try {
		const result = await fn();
		return result;
	} finally {
		end();
	}
};

// Export metrics and utilities
export const metrics = {
	// Metrics instances
	httpRequestDuration,
	httpRequestsTotal,
	activeConnections,
	userRequestsTotal,
	usersCreatedTotal,
	databaseOperationDuration,

	// Middleware
	httpMiddleware,

	// Utilities
	timeOperation,

	// Manual metric recording helpers
	recordUserAction: (endpoint: string) => {
		userRequestsTotal.inc({ endpoint });
	},

	recordUserCreation: () => {
		usersCreatedTotal.inc();
	},

	recordDatabaseOperation: (
		operation: string,
		table: string,
		duration: number,
	) => {
		databaseOperationDuration.labels(operation, table).observe(duration);
	},
};
