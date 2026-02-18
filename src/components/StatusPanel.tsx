import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Status {
	allowed: boolean;
	limit: number;
	remaining: number;
	count: number;
}

export function StatusPanel() {
	const [ip, setIp] = useState("");
	const [status, setStatus] = useState<Status | null>(null);
	const [error, setError] = useState<string | null>(null);

	const checkStatus = async () => {
		if (!ip) return;
		try {
			setError(null);
			const res = await fetch(`/api/config/status/${ip}`, {
				method: "GET",
			});

			if (!res.ok) {
				setError(`Server error: ${res.status}`);
				return;
			}

			const data = await res.json();
			setStatus(data);
		} catch {
			setError("Network error - could not reach server");
		}
	};

	return (
		<div className="flex flex-col gap-4">
			<div className="flex gap-2">
				<div className="flex flex-col gap-2 flex-1">
					<Label htmlFor="ip">IP Address</Label>
					<Input
						id="ip"
						type="text"
						placeholder="e.g. 127.0.0.1"
						value={ip}
						onChange={(e) => setIp(e.target.value)}
					/>
				</div>
				<Button className="self-end" onClick={checkStatus}>
					Check
				</Button>
			</div>

			{error && <p className="text-sm text-destructive">{error}</p>}

			{status && (
				<div className="grid grid-cols-2 gap-3">
					<div className="rounded-md border p-3">
						<p className="text-xs text-muted-foreground">Status</p>
						<p
							className={`text-lg font-semibold ${status.allowed ? "text-green-700" : "text-red-700"}`}
						>
							{status.allowed ? "Allowed" : "Blocked"}
						</p>
					</div>
					<div className="rounded-md border p-3">
						<p className="text-xs text-muted-foreground">Requests Made</p>
						<p className="text-lg font-semibold">{status.count}</p>
					</div>
					<div className="rounded-md border p-3">
						<p className="text-xs text-muted-foreground">Remaining</p>
						<p className="text-lg font-semibold">{status.remaining}</p>
					</div>
					<div className="rounded-md border p-3">
						<p className="text-xs text-muted-foreground">Limit</p>
						<p className="text-lg font-semibold">{status.limit}</p>
					</div>
				</div>
			)}
		</div>
	);
}
