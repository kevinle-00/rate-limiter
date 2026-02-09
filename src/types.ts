export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  count: number;
}