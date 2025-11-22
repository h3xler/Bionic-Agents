import { useRoute } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { formatNumber, formatCurrency, formatDuration } from "@/lib/utils";
import StatCard from "@/components/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Activity, DollarSign, AlertCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function TenantDetail() {
  const [, params] = useRoute("/tenants/:tenantId");
  const tenantId = params ? parseInt(params.tenantId, 10) : 0;

  const { data: tenantStats, isLoading } = trpc.livekit.getTenantStats.useQuery({
    tenantId,
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tenant Details</h1>
            <p className="text-muted-foreground">Tenant ID: {tenantId}</p>
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

  const stats = tenantStats && !Array.isArray(tenantStats) ? tenantStats : null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tenant Details</h1>
          <p className="text-muted-foreground">Tenant ID: {tenantId}</p>
        </div>

        {stats ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Active Agents"
                value={formatNumber(stats.activeAgents, 0).toString()}
                description="Currently active"
                icon={Users}
              />
              <StatCard
                title="Total Sessions"
                value={formatNumber(stats.totalSessions, 0).toString()}
                description="Today"
                icon={Activity}
              />
              <StatCard
                title="Total Duration"
                value={formatDuration(stats.totalDurationSeconds || 0)}
                description="Session time"
                icon={Activity}
              />
              <StatCard
                title="Total Cost"
                value={formatCurrency((stats.totalCost || 0) / 100)}
                description="Today"
                icon={DollarSign}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <StatCard
                title="Average Latency"
                value={`${formatNumber(stats.avgLatency || 0, 0)}ms`}
                description="LLM response time"
                icon={Activity}
              />
              <StatCard
                title="Errors"
                value={formatNumber(stats.errorCount || 0, 0).toString()}
                description="Failed sessions"
                icon={AlertCircle}
              />
            </div>
          </>
        ) : (
          <div className="text-center text-muted-foreground">
            Tenant not found or no data available
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

