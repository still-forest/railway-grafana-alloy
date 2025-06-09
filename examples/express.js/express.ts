import express, {
	type Request,
	type Response,
	type NextFunction,
} from "express";
import client from "prom-client";
import axios from "axios";

const app = express();

// Prometheus metrics
const register = new client.Registry();

const httpRequestsTotal = new client.Counter({
	name: "http_requests_total",
	help: "Total HTTP requests",
	labelNames: ["method", "route", "status_code"],
});

const httpRequestDuration = new client.Histogram({
	name: "http_request_duration_seconds",
	help: "HTTP request duration in seconds",
	labelNames: ["method", "route", "status_code"],
	buckets: [0.001, 0.01, 0.1, 0.5, 1, 2, 5],
});

register.registerMetric(httpRequestsTotal);
register.registerMetric(httpRequestDuration);

interface LogMetadata {
	[key: string]: any;
}

interface LogStream {
	stream: {
		app: string;
		level: string;
		service: string;
	};
	values: [string, string][];
}

interface LogEntry {
	streams: LogStream[];
}

class AlloyLogger {
	private logsUrl: string;

	constructor(alloyUrl: string) {
		this.logsUrl = `${alloyUrl}/loki/api/v1/push`;
	}

	async log(
		level: string,
		message: string,
		meta: LogMetadata = {},
	): Promise<void> {
		const logEntry: LogEntry = {
			streams: [
				{
					stream: {
						app: "express-app",
						level: level,
						service: "still-forest-dot-dev",
					},
					values: [
						[
							(Date.now() * 1000000).toString(), // nanosecond timestamp
							JSON.stringify({
								message,
								timestamp: new Date().toISOString(),
								...meta,
							}),
						],
					],
				},
			],
		};

		try {
			await axios.post(this.logsUrl, logEntry, { timeout: 5000 });
		} catch (error) {
			// Don't break app if logging fails
			console.error(
				"Failed to send log to Alloy:",
				error instanceof Error ? error.message : "Unknown error",
			);
		}
	}

	async info(message: string, meta?: LogMetadata): Promise<void> {
		return this.log("info", message, meta);
	}

	async warn(message: string, meta?: LogMetadata): Promise<void> {
		return this.log("warn", message, meta);
	}

	async error(message: string, meta?: LogMetadata): Promise<void> {
		return this.log("error", message, meta);
	}

	async debug(message: string, meta?: LogMetadata): Promise<void> {
		if (process.env.NODE_ENV === "development") {
			return this.log("debug", message, meta);
		}
	}
}

// Initialize logger
const logger = new AlloyLogger(
	process.env.GRAFANA_ALLOY_URL ||
		"http://grafana-alloy-service.railway.internal:3100",
);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Metrics endpoint (optional - Alloy can scrape this)
app.get("/metrics", async (req: Request, res: Response) => {
	res.set("Content-Type", register.contentType);
	res.end(await register.metrics());
});

// Health check endpoint
app.get("/health", async (req: Request, res: Response) => {
	await logger.info("Health check accessed");
	res.json({
		status: "healthy",
		timestamp: new Date().toISOString(),
		uptime: process.uptime(),
	});
});

// Observability middleware
app.use((req: Request, res: Response, next: NextFunction) => {
	const start = Date.now();

	// Log request
	logger.info(`${req.method} ${req.path}`, {
		method: req.method,
		path: req.path,
		userAgent: req.get("User-Agent"),
		ip: req.ip,
		query: req.query,
		body: req.method === "POST" ? req.body : undefined,
	});

	res.on("finish", () => {
		const duration = (Date.now() - start) / 1000;
		const route = req.route?.path || req.path;

		// Record metrics
		httpRequestsTotal
			.labels(req.method, route, res.statusCode.toString())
			.inc();
		httpRequestDuration
			.labels(req.method, route, res.statusCode.toString())
			.observe(duration);

		// Log response
		logger.info(`Response ${res.statusCode}`, {
			method: req.method,
			path: req.path,
			statusCode: res.statusCode,
			duration: duration,
		});
	});

	next();
});

// Example routes
interface User {
	id: number;
	name: string;
	email?: string;
	createdAt?: string;
}

interface CreateUserRequest {
	name: string;
	email: string;
}

app.get("/", async (req: Request, res: Response) => {
	await logger.info("Root endpoint accessed");
	res.json({
		message: "Express TypeScript + Grafana Alloy",
		version: "1.0.0",
		endpoints: {
			health: "/health",
			metrics: "/metrics",
			users: "/api/users",
		},
	});
});

app.get("/api/users", async (req: Request, res: Response) => {
	try {
		await logger.info("Users endpoint accessed");

		// Simulate some async work
		await new Promise((resolve) => setTimeout(resolve, Math.random() * 100));

		// Simulate occasional errors for testing
		if (Math.random() < 0.1) {
			throw new Error("Random database error for testing");
		}

		const users: User[] = [
			{ id: 1, name: "Alice", email: "alice@example.com" },
			{ id: 2, name: "Bob", email: "bob@example.com" },
			{ id: 3, name: "Charlie", email: "charlie@example.com" },
		];

		await logger.info("Users retrieved successfully", { count: users.length });
		res.json({ users, count: users.length });
	} catch (error) {
		await logger.error("Failed to retrieve users", {
			error: error instanceof Error ? error.message : "Unknown error",
			stack: error instanceof Error ? error.stack : undefined,
		});
		res.status(500).json({ error: "Internal server error" });
	}
});

app.post("/api/users", async (req: Request, res: Response) => {
	try {
		const { name, email }: CreateUserRequest = req.body;

		await logger.info("User creation requested", { name, email });

		if (!name || !email) {
			await logger.warn("Invalid user creation request - missing fields", {
				name: !!name,
				email: !!email,
			});
			return res.status(400).json({
				error: "Name and email are required",
			});
		}

		// Email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			await logger.warn("Invalid email format", { email });
			return res.status(400).json({
				error: "Invalid email format",
			});
		}

		// Simulate user creation
		const newUser: User = {
			id: Math.floor(Math.random() * 1000) + 100,
			name,
			email,
			createdAt: new Date().toISOString(),
		};

		await logger.info("User created successfully", {
			userId: newUser.id,
			name: newUser.name,
			email: newUser.email,
		});

		res.status(201).json({ user: newUser });
	} catch (error) {
		await logger.error("Failed to create user", {
			error: error instanceof Error ? error.message : "Unknown error",
			stack: error instanceof Error ? error.stack : undefined,
			body: req.body,
		});
		res.status(500).json({ error: "Internal server error" });
	}
});

app.get("/api/users/:id", async (req: Request, res: Response) => {
	try {
		const userId = Number.parseInt(req.params.id);

		await logger.info("User lookup requested", { userId });

		if (isNaN(userId)) {
			await logger.warn("Invalid user ID format", {
				providedId: req.params.id,
			});
			return res.status(400).json({ error: "Invalid user ID" });
		}

		// Simulate user lookup
		if (userId > 100) {
			const user: User = {
				id: userId,
				name: `User ${userId}`,
				email: `user${userId}@example.com`,
			};

			await logger.info("User found", { userId, name: user.name });
			res.json({ user });
		} else {
			await logger.warn("User not found", { userId });
			res.status(404).json({ error: "User not found" });
		}
	} catch (error) {
		await logger.error("Failed to lookup user", {
			error: error instanceof Error ? error.message : "Unknown error",
			userId: req.params.id,
		});
		res.status(500).json({ error: "Internal server error" });
	}
});

// 404 handler
app.use((req: Request, res: Response) => {
	logger.warn("Route not found", {
		method: req.method,
		url: req.url,
		userAgent: req.get("User-Agent"),
	});

	res.status(404).json({
		error: "Not found",
		message: `Route ${req.method} ${req.url} not found`,
	});
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
	logger.error("Unhandled error", {
		error: err.message,
		stack: err.stack,
		method: req.method,
		url: req.url,
		userAgent: req.get("User-Agent"),
	});

	res.status(500).json({
		error: "Internal server error",
		message:
			process.env.NODE_ENV === "development"
				? err.message
				: "Something went wrong",
	});
});

// Graceful shutdown
process.on("SIGINT", async () => {
	await logger.info("Received SIGINT, shutting down gracefully");
	process.exit(0);
});

process.on("SIGTERM", async () => {
	await logger.info("Received SIGTERM, shutting down gracefully");
	process.exit(0);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
	await logger.info("Server started successfully", {
		port: PORT,
		environment: process.env.NODE_ENV || "development",
		nodeVersion: process.version,
		timestamp: new Date().toISOString(),
	});
	console.log(`Server running on port ${PORT}`);
});

export default app;
