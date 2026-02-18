export interface RateLimitResult {
	allowed: boolean;
	limit: number;
	remaining: number;
	count: number;
	resetIn: number;
}

export interface RequestLogEntry {
	ip: string;
	path: string;
	method: string;
	timestamp: number;
	result: RateLimitResult;
}
