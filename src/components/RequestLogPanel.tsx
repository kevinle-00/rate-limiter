import { useState, useEffect } from "react";
import type { RequestLogEntry } from "@/types";

export function RequestLogPanel() {
  const [logs, setLogs] = useState<RequestLogEntry[]>([]);

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/logs", {
        method: "GET",
      });

      if (!res.ok) return;

      const data = await res.json();
      setLogs(data);
    } catch {}
  };

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:3000/ws");
    ws.onmessage = (event) => {
      const entry = JSON.parse(event.data);
      setLogs((prev) => [entry, ...prev]);
    };
    fetchLogs();
    return () => ws.close();
  }, []);

  if (logs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No requests logged yet.</p>
    );
  }

  return (
    <div className="overflow-auto max-h-80">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="py-2 pr-4">Time</th>
            <th className="py-2 pr-4">Method</th>
            <th className="py-2 pr-4">Path</th>
            <th className="py-2 pr-4">IP</th>
            <th className="py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((entry, i) => (
            <tr key={i} className="border-b last:border-0">
              <td className="py-2 pr-4 text-muted-foreground">
                {new Date(entry.timestamp).toLocaleTimeString()}
              </td>
              <td className="py-2 pr-4 font-mono">{entry.method}</td>
              <td className="py-2 pr-4 font-mono">{entry.path}</td>
              <td className="py-2 pr-4 font-mono">{entry.ip}</td>
              <td
                className={`py-2 font-semibold ${entry.result.allowed ? "text-green-700" : "text-red-500"}`}
              >
                {entry.result.allowed ? "Allowed" : "Blocked"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

