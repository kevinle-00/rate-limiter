import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Rate, Counter } from "k6/metrics";

// Custom metrics
const rateLimitedRate = new Rate("rate_limited");
const proxiedRequests = new Counter("proxied_requests");
const rateLimitLatency = new Trend("rate_limit_decision_ms");

const BASE = __ENV.BASE_URL || "http://localhost:3000";
const ALGORITHM = __ENV.ALGORITHM || "tokenBucket";

export const options = {
	scenarios: {
		// Ramp up to sustained load
		ramp_up: {
			executor: "ramping-vus",
			startVUs: 0,
			stages: [
				{ duration: "15s", target: 50 },
				{ duration: "30s", target: 200 },
				{ duration: "30s", target: 500 },
				{ duration: "15s", target: 0 },
			],
		},
	},
	thresholds: {
		http_req_duration: ["p(50)<50", "p(95)<200", "p(99)<500"],
		http_req_failed: ["rate<0.05"],
	},
};

export function setup() {
	// Configure with a high limit to measure pure throughput
	http.put(
		`${BASE}/api/config`,
		JSON.stringify({
			algorithm: ALGORITHM,
			limit: 100000,
			windowSeconds: 60,
			upstreamURL: "https://jsonplaceholder.typicode.com",
		}),
		{ headers: { "Content-Type": "application/json" } },
	);

	return { algorithm: ALGORITHM };
}

const params = { headers: { "Accept-Encoding": "" } };

export default function () {
	const res = http.get(`${BASE}/api/proxy/posts/1`, params);

	const isRateLimited = res.status === 429;
	rateLimitedRate.add(isRateLimited);

	if (!isRateLimited) {
		proxiedRequests.add(1);
	}

	rateLimitLatency.add(res.timings.duration);

	check(res, {
		"status is 200 or 429": (r) => r.status === 200 || r.status === 429,
		"has rate limit headers": (r) =>
			r.headers["X-Ratelimit-Limit"] !== undefined || r.status === 429,
	});

	sleep(0.01);
}

export function teardown(data) {
	console.log(`\n========================================`);
	console.log(`  Load Test Complete — ${data.algorithm}`);
	console.log(`========================================\n`);
}
