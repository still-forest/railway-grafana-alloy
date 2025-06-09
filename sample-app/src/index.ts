import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { logger } from "./logger";
import { metrics, register } from "./metrics";

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Metrics middleware - must be before routes
app.use(metrics.httpMiddleware);

// Health check endpoint
app.get("/health", (req, res) => {
	res.json({
		status: "healthy",
		timestamp: new Date().toISOString(),
		uptime: process.uptime(),
		memory: process.memoryUsage(),
		environment: process.env.NODE_ENV || "development",
	});
});

// Metrics endpoint for Grafana Alloy to scrape
app.get("/metrics", async (req, res) => {
	try {
		res.set("Content-Type", register.contentType);
		const metricsData = await register.metrics();
		res.end(metricsData);
	} catch (error) {
		logger.error("Failed to generate metrics", {
			error: error instanceof Error ? error.message : "Unknown error",
		});
		res.status(500).end("Error generating metrics");
	}
});

// API Routes
app.get("/", (req, res) => {
	logger.info("Root endpoint accessed", {
		userAgent: req.get("User-Agent"),
		ip: req.ip,
	});

	res.json({
		message: "Express + Grafana Observability Template",
		version: "1.0.0",
		docs: {
			health: "/health",
			metrics: "/metrics",
			api: "/api",
		},
	});
});

// Example API routes
app.get("/api/users", async (req, res) => {
	logger.info("Users endpoint accessed");

	try {
		// Simulate some work
		await new Promise((resolve) => setTimeout(resolve, Math.random() * 100));

		// Simulate occasional errors for testing
		if (Math.random() < 0.1) {
			throw new Error("Random API error for testing");
		}

		const users = [
			{ id: 1, name: "Alice", email: "alice@example.com" },
			{ id: 2, name: "Bob", email: "bob@example.com" },
			{ id: 3, name: "Charlie", email: "charlie@example.com" },
		];

		// Custom metric
		metrics.userRequestsTotal.inc({ endpoint: "list" });

		logger.info("Users retrieved successfully", { count: users.length });
		res.json({ users, count: users.length });
	} catch (error) {
		logger.error("Failed to retrieve users", {
			error: error instanceof Error ? error.message : "Unknown error",
			stack: error instanceof Error ? error.stack : undefined,
		});

		res.status(500).json({
			error: "Internal server error",
			message: "Failed to retrieve users",
		});
	}
});

app.post("/api/users", async (req, res) => {
	logger.info("User creation requested", {
		body: req.body,
		contentType: req.get("Content-Type"),
	});

	try {
		const { name, email } = req.body;

		if (!name || !email) {
			logger.warn("Invalid user creation request", { name, email });
			return res.status(400).json({
				error: "Name and email are required",
			});
		}

		// Simulate user creation
		const newUser = {
			id: Math.floor(Math.random() * 1000) + 4,
			name,
			email,
			createdAt: new Date().toISOString(),
		};

		// Custom metrics
		metrics.userRequestsTotal.inc({ endpoint: "create" });
		metrics.usersCreatedTotal.inc();

		logger.info("User created successfully", {
			userId: newUser.id,
			name: newUser.name,
		});

		res.status(201).json({ user: newUser });
	} catch (error) {
		logger.error("Failed to create user", {
			error: error instanceof Error ? error.message : "Unknown error",
			stack: error instanceof Error ? error.stack : undefined,
			body: req.body,
		});

		res.status(500).json({
			error: "Internal server error",
			message: "Failed to create user",
		});
	}
});

// Error handling middleware
app.use(
	(
		error: Error,
		req: express.Request,
		res: express.Response,
		next: express.NextFunction,
	) => {
		logger.error("Unhandled error", {
			error: error.message,
			stack: error.stack,
			method: req.method,
			url: req.url,
			userAgent: req.get("User-Agent"),
		});

		res.status(500).json({
			error: "Internal server error",
			message:
				process.env.NODE_ENV === "development"
					? error.message
					: "Something went wrong",
		});
	},
);

// 404 handler
app.use((req, res) => {
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

// Graceful shutdown
process.on("SIGINT", () => {
	logger.info("Received SIGINT, shutting down gracefully");
	process.exit(0);
});

process.on("SIGTERM", () => {
	logger.info("Received SIGTERM, shutting down gracefully");
	process.exit(0);
});

// Start server
app.listen(PORT, () => {
	logger.info("Server started successfully", {
		port: PORT,
		environment: process.env.NODE_ENV || "development",
		nodeVersion: process.version,
		timestamp: new Date().toISOString(),
	});
});

export default app;
