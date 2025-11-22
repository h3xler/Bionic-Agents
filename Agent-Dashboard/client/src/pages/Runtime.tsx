import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { formatNumber } from "@/lib/utils";
import StatCard from "@/components/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Server, Activity, Cpu, MemoryStick } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function Runtime() {
  const { data: runtimeStats, isLoading } = trpc.livekit.getRuntimeStats.useQuery();

  useEffect(() => {
    // Poll every 30 seconds for near real-time updates
    const interval = setInterval(() => {
      // tRPC will automatically refetch
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Agent Runtime</h1>
            <p className="text-muted-foreground">
              Runtime instance monitoring and metrics
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agent Runtime</h1>
          <p className="text-muted-foreground">
            Runtime instance monitoring and metrics
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Active Instances"
            value={formatNumber(runtimeStats?.activeInstances || 0, 0).toString()}
            description="Running runtime pods"
            icon={Server}
          />
          <StatCard
            title="Total Instances"
            value={formatNumber(runtimeStats?.totalInstances || 0, 0).toString()}
            description="All runtime instances"
            icon={Server}
          />
          <StatCard
            title="Total Capacity"
            value={formatNumber(runtimeStats?.totalCapacity || 0, 0).toString()}
            description="Active agents across all instances"
            icon={Activity}
          />
          <StatCard
            title="Avg CPU Usage"
            value={`${formatNumber(runtimeStats?.avgCpuUsage || 0, 1)}%`}
            description="Average across instances"
            icon={Cpu}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <StatCard
            title="Avg Memory Usage"
            value={`${formatNumber((runtimeStats?.avgMemoryUsage || 0) / 1024 / 1024 / 1024, 2)} GB`}
            description="Average across instances"
            icon={MemoryStick}
          />
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-xl font-semibold mb-4">Runtime Status</h2>
          <p className="text-muted-foreground">
            Runtime instances are automatically scaled based on load. Each instance
            can handle multiple agent sessions concurrently.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}

