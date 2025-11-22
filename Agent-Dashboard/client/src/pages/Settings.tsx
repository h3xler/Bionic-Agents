import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { toast } from "sonner";

export default function Settings() {
  const [config, setConfig] = useState({
    cost_per_participant_minute: "0.005",
    cost_per_egress_gb: "0.10",
    cost_per_ingress_gb: "0.05",
    cost_per_recording_minute: "0.01",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchConfig() {
      try {
        const data = await api.getCostConfig() as any;
        if (data) {
          setConfig({
            cost_per_participant_minute: data.cost_per_participant_minute || "0.005",
            cost_per_egress_gb: data.cost_per_egress_gb || "0.10",
            cost_per_ingress_gb: data.cost_per_ingress_gb || "0.05",
            cost_per_recording_minute: data.cost_per_recording_minute || "0.01",
          });
        }
      } catch (error) {
        console.error("Failed to fetch config:", error);
      }
    }

    fetchConfig();
  }, []);

  const handleSave = async () => {
    try {
      setLoading(true);
      await api.updateCostConfig({
        cost_per_participant_minute: parseFloat(config.cost_per_participant_minute),
        cost_per_egress_gb: parseFloat(config.cost_per_egress_gb),
        cost_per_ingress_gb: parseFloat(config.cost_per_ingress_gb),
        cost_per_recording_minute: parseFloat(config.cost_per_recording_minute),
      });
      toast.success("Cost configuration updated successfully");
    } catch (error) {
      console.error("Failed to update config:", error);
      toast.error("Failed to update cost configuration");
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    try {
      setLoading(true);
      await api.recalculateCosts();
      toast.success("Cost recalculation started");
    } catch (error) {
      console.error("Failed to recalculate costs:", error);
      toast.error("Failed to recalculate costs");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Configure dashboard and cost calculation settings
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Cost Configuration</CardTitle>
            <CardDescription>
              Set the pricing rates for cost calculation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="participant_cost">Cost per Participant Minute ($)</Label>
                <Input
                  id="participant_cost"
                  type="number"
                  step="0.0001"
                  value={config.cost_per_participant_minute}
                  onChange={(e) =>
                    setConfig({ ...config, cost_per_participant_minute: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="egress_cost">Cost per Egress GB ($)</Label>
                <Input
                  id="egress_cost"
                  type="number"
                  step="0.01"
                  value={config.cost_per_egress_gb}
                  onChange={(e) =>
                    setConfig({ ...config, cost_per_egress_gb: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ingress_cost">Cost per Ingress GB ($)</Label>
                <Input
                  id="ingress_cost"
                  type="number"
                  step="0.01"
                  value={config.cost_per_ingress_gb}
                  onChange={(e) =>
                    setConfig({ ...config, cost_per_ingress_gb: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="recording_cost">Cost per Recording Minute ($)</Label>
                <Input
                  id="recording_cost"
                  type="number"
                  step="0.001"
                  value={config.cost_per_recording_minute}
                  onChange={(e) =>
                    setConfig({ ...config, cost_per_recording_minute: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button onClick={handleSave} disabled={loading}>
                {loading ? "Saving..." : "Save Configuration"}
              </Button>
              <Button onClick={handleRecalculate} variant="outline" disabled={loading}>
                {loading ? "Recalculating..." : "Recalculate All Costs"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Backend Connection</CardTitle>
            <CardDescription>
              Configure the backend API connection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>API URL</Label>
              <Input
                value={import.meta.env.VITE_API_URL || "http://localhost:3001"}
                disabled
              />
              <p className="text-sm text-muted-foreground">
                Set VITE_API_URL in .env file to change the backend API URL
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
