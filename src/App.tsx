import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfigPanel } from "@/components/ConfigPanel";
import { StatusPanel } from "./components/StatusPanel";
import { RequestLogPanel } from "@/components/RequestLogPanel";
import "./index.css";

export function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8">Rate Limiter Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <ConfigPanel />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusPanel />
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Request Log</CardTitle>
            </CardHeader>
            <CardContent>
              <RequestLogPanel />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default App;
