import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 1,
  duration: "10s",
  thresholds: {
    http_req_duration: ["p(95)<500"],
    http_req_failed: ["rate<0.01"],
  },
};

const BASE = __ENV.BASE_URL || "http://localhost:3000";

export function setup() {
  // Set a high rate limit so we're testing throughput, not getting 429s
  http.put(
    `${BASE}/api/config`,
    JSON.stringify({
      algorithm: "tokenBucket",
      limit: 100000,
      windowSeconds: 60,
      upstreamURL: "https://jsonplaceholder.typicode.com",
    }),
    { headers: { "Content-Type": "application/json" } },
  );
}

const params = { headers: { "Accept-Encoding": "" } };

export default function () {
  const res = http.get(`${BASE}/api/proxy/posts/1`, params);
  check(res, {
    "status is 200": (r) => r.status === 200,
    "latency < 500ms": (r) => r.timings.duration < 500,
  });
  sleep(0.1);
}
