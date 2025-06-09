import fs from "fs";
import path from "path";

interface LogEntry {
	timestamp: string;
	level: string;
	message: string;
	service: string;
	domain: string;
	environment: string;
	[key: string]: any;
}

class FileLogger {
	private logDir = path.join(process.cwd(), "logs");
	private logFile = path.join(this.logDir, "app.log");

	constructor() {
		this.ensureLogDirectory();
	}

	private ensureLogDirectory() {
		if (!fs.existsSync(this.logDir)) {
			fs.mkdirSync(this.logDir, { recursive: true });
		}
	}

	private writeLog(
		level: string,
		message: string,
		meta: Record<string, any> = {},
	) {
		const entry: LogEntry = {
			timestamp: new Date().toISOString(),
			level: level.toLowerCase(),
			message,
			service: "express-app",
			domain: meta.domain || "app",
			environment: process.env.NODE_ENV || "development",
			...meta,
		};

		const logLine = JSON.stringify(entry) + "\n";

		// Always log to console for Railway logs
		console.log(logLine.trim());

		try {
			// Write to file for Grafana Alloy to pick up
			fs.appendFileSync(this.logFile, logLine);
		} catch (error) {
			// If file writing fails, at least we have console logs
			console.error("Failed to write to log file:", error);
		}
	}

	info(message: string, meta?: Record<string, any>) {
		this.writeLog("info", message, meta);
	}

	warn(message: string, meta?: Record<string, any>) {
		this.writeLog("warn", message, meta);
	}

	error(message: string, meta?: Record<string, any>) {
		this.writeLog("error", message, meta);
	}

	debug(message: string, meta?: Record<string, any>) {
		if (process.env.NODE_ENV === "development") {
			this.writeLog("debug", message, meta);
		}
	}

	// Method to manually flush logs (useful for testing)
	flush() {
		// File operations are synchronous, so no need to flush
		// This method exists for compatibility with other logging libraries
	}
}

// Export singleton instance
export const logger = new FileLogger();
