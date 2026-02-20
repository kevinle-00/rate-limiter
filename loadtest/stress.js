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
		stress: {
			executor: "ramping-arrival-rate",
			startRate: 50,
			timeUnit: "1s",
			preAllocatedVUs: 500,
			maxVUs: 1000,
			stages: [
				{ duration: "10s", target: 200 },
				{ duration: "20s", target: 500 },
				{ duration: "20s", target: 1000 },
				{ duration: "10s", target: 0 },
			],
		},
	},
	thresholds: {
		http_req_duration: ["p(95)<300"],
		http_req_failed: ["rate<0.1"],
	},
};

export function setup() {
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

	rateLimitedRate.add(res.status === 429);
	if (res.status !== 429) proxiedRequests.add(1);
	rateLimitLatency.add(res.timings.duration);

	check(res, {
		"status is 200 or 429": (r) => r.status === 200 || r.status === 429,
	});
}

export function teardown(data) {
	console.log(`\n========================================`);
	console.log(`  Stress Test Complete — ${data.algorithm}`);
	console.log(`========================================\n`);
}
