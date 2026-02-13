import { useEffect, useState, type SubmitEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Config } from "@/schemas/config";

type Algorithm = "fixedWindow" | "slidingWindow" | "tokenBucket";

export function ConfigPanel() {
  const [config, setConfig] = useState<Config>({
    algorithm: "fixedWindow",
    limit: 10,
    windowSeconds: 60,
    upstreamURL: "https://jsonplaceholder.typicode.com",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => setConfig(data));
  }, []);

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    setSaving(true);

    const res = await fetch("/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });

    const data = await res.json();
    setConfig(data);
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="algorithm">Algorithm</Label>
        <Select
          value={config.algorithm}
          onValueChange={(value: Algorithm) =>
            setConfig({ ...config, algorithm: value })
          }
        >
          <SelectTrigger id="algorithm" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fixedWindow">Fixed Window</SelectItem>
            <SelectItem value="slidingWindow">Sliding Window</SelectItem>
            <SelectItem value="tokenBucket">Token Bucket</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="limit">Request Limit</Label>
        <Input
          id="limit"
          type="number"
          min={1}
          value={config.limit}
          onChange={(e) =>
            setConfig({ ...config, limit: Number(e.target.value) })
          }
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="windowSeconds">Window (seconds)</Label>
        <Input
          id="windowSeconds"
          type="number"
          min={1}
          value={config.windowSeconds}
          onChange={(e) =>
            setConfig({ ...config, windowSeconds: Number(e.target.value) })
          }
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="upstreamURL">Upstream URL</Label>
        <Input
          id="upstreamURL"
          type="url"
          value={config.upstreamURL}
          onChange={(e) =>
            setConfig({ ...config, upstreamURL: e.target.value })
          }
        />
      </div>

      <Button type="submit" disabled={saving}>
        {saving ? "Saving..." : "Save Configuration"}
      </Button>
    </form>
  );
}

