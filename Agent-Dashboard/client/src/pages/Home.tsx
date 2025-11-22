import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import { trpc } from "@/lib/trpc";
import { Users, Bot, DollarSign, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber, formatCurrency, formatDuration } from "@/lib/utils";

export default function Home() {
  const { data: sessionStats, isLoading: sessionLoading } = trpc.livekit.getSessionStats.useQuery();
  const { data: agentStats, isLoading: agentLoading } = trpc.livekit.getAgentStats.useQuery();
  const { data: costStats, isLoading: costLoading } = trpc.livekit.getCostStats.useQuery();

  const isLoading = sessionLoading || agentLoading || costLoading;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
            <p className="text-muted-foreground">
              Real-time monitoring of your LiveKit infrastructure
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
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="text-muted-foreground">
            Real-time monitoring of your LiveKit infrastructure
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Active Rooms"
            value={formatNumber(sessionStats?.active_sessions, 0).toString()}
            description="Currently running rooms"
            icon={Activity}
          />
          <StatCard
            title="Total Rooms"
            value={formatNumber(sessionStats?.total_sessions, 0).toString()}
            description="All-time room count"
            icon={Users}
          />
          <StatCard
            title="AI Agents"
            value={formatNumber(agentStats?.total_agents, 0).toString()}
            description="Registered agents"
            icon={Bot}
          />
          <StatCard
            title="Total Cost"
            value={formatCurrency(costStats?.total_cost ? Number(costStats.total_cost) / 100 : 0)}
            description="Cumulative infrastructure cost"
            icon={DollarSign}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            title="Avg Room Duration"
            value={formatDuration(sessionStats?.avg_duration_seconds)}
            description="Average room session length"
          />
          <StatCard
            title="Total Participants"
            value={formatNumber(sessionStats?.total_participants_all_time, 0).toString()}
            description="All-time participant count"
          />
          <StatCard
            title="Avg Cost per Room"
            value={formatCurrency(costStats?.avg_cost_per_session ? Number(costStats.avg_cost_per_session) / 100 : 0)}
            description="Average room cost"
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
