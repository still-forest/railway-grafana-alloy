import os
import httpx
import json
import time
from datetime import datetime
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from fastapi import Request, Response

# Prometheus metrics
REQUEST_COUNT = Counter(
    "http_requests_total", "Total HTTP requests", ["method", "endpoint", "status"]
)
REQUEST_DURATION = Histogram("http_request_duration_seconds", "HTTP request duration")


class AlloyLogger:
    def __init__(self, alloy_url: str):
        self.logs_url = f"{alloy_url}/loki/api/v1/push"
        self.metrics_url = f"{alloy_url}/api/v1/write"

    async def log(self, level: str, message: str, **kwargs):
        log_entry = {
            "streams": [
                {
                    "stream": {
                        "app": "fastapi-app",
                        "level": level,
                        "service": "financial-planning",
                    },
                    "values": [
                        [
                            str(int(datetime.now().timestamp() * 1_000_000_000)),
                            json.dumps(
                                {
                                    "message": message,
                                    "timestamp": datetime.now().isoformat(),
                                    **kwargs,
                                }
                            ),
                        ]
                    ],
                }
            ]
        }

        try:
            async with httpx.AsyncClient() as client:
                await client.post(self.logs_url, json=log_entry, timeout=5.0)
        except Exception:
            pass  # Don't break app if logging fails


# Initialize logger
logger = AlloyLogger(f"{os.getenv('GRAFANA_ALLOY_HOST')}:3100")


# Metrics endpoint for Alloy to scrape (optional)
@app.get("/metrics")
async def metrics():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)


# Middleware for metrics and logging
@app.middleware("http")
async def observability_middleware(request: Request, call_next):
    start_time = time.time()

    # Log request
    await logger.log(
        "info",
        f"{request.method} {request.url.path}",
        {
            "method": request.method,
            "path": request.url.path,
            "client_ip": request.client.host if request.client else None,
        },
    )

    response = await call_next(request)

    # Record metrics
    duration = time.time() - start_time
    REQUEST_COUNT.labels(
        method=request.method, endpoint=request.url.path, status=response.status_code
    ).inc()
    REQUEST_DURATION.observe(duration)

    # Log response
    await logger.log(
        "info",
        f"Response {response.status_code}",
        {
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "duration": duration,
        },
    )

    return response


# Example usage in routes
@app.get("/")
async def root():
    await logger.log("info", "Root endpoint accessed")
    return {"message": "Hello World"}


@app.post("/api/portfolio")
async def create_portfolio(portfolio_data: dict):
    try:
        await logger.log(
            "info",
            "Creating portfolio",
            {
                "user_id": portfolio_data.get("user_id"),
                "portfolio_type": portfolio_data.get("type"),
            },
        )

        # Your portfolio creation logic here
        result = {"id": 123, "status": "created"}

        await logger.log(
            "info",
            "Portfolio created successfully",
            {"portfolio_id": result["id"], "user_id": portfolio_data.get("user_id")},
        )

        return result

    except Exception as e:
        await logger.log(
            "error",
            "Failed to create portfolio",
            {"error": str(e), "user_id": portfolio_data.get("user_id")},
        )
        raise
