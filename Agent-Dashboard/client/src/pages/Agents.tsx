import { useState, useEffect } from "react";
import { Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { api } from "@/lib/api";
import { formatDate, formatNumber } from "@/lib/utils";
import StatCard from "@/components/StatCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Bot, Activity, Clock } from "lucide-react";

export default function Agents() {
  const [agents, setAgents] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [agentsData, statsData] = await Promise.all([
          api.getAgents(),
          api.getAgentStats(),
        ]);
        setAgents(agentsData.agents);
        setStats(statsData);
      } catch (error) {
        console.error("Failed to fetch agents:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Using imported formatDate from utils

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Agents</h1>
          <p className="text-muted-foreground">
            Monitor AI agents and their activity
          </p>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              title="Total Agents"
              value={stats?.total_agents || "0"}
              description="Registered AI agents"
              icon={Bot}
            />
            <StatCard
              title="Total Sessions"
              value={formatNumber(stats?.total_sessions_all_agents || 0, 0).toString()}
              description="Agent session count"
              icon={Activity}
            />
            <StatCard
              title="Avg Session Duration"
              value={
                stats?.avg_session_duration
                  ? formatDuration(Math.round(parseFloat(stats.avg_session_duration)))
                  : "0m"
              }
              description="Average agent session length"
              icon={Clock}
            />
          </div>
        )}

        {loading ? (
          <div className="space-y-2">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={`agent-skeleton-${i}`} className="h-16" />
            ))}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent Identity</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Sessions</TableHead>
                  <TableHead>Total Duration</TableHead>
                  <TableHead>Last Seen</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No agents found
                    </TableCell>
                  </TableRow>
                ) : (
                  agents.map((agent) => (
                    <TableRow key={agent.id}>
                      <TableCell className="font-mono text-sm">{agent.agent_id}</TableCell>
                      <TableCell>{agent.agent_name || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{agent.agent_type || 'unknown'}</Badge>
                      </TableCell>
                      <TableCell>{agent.session_count || 0}</TableCell>
                      <TableCell>
                        {agent.total_duration_seconds > 0
                          ? formatDuration(agent.total_duration_seconds)
                          : "-"}
                      </TableCell>
                      <TableCell>{formatDate(agent.last_seen_at)}</TableCell>
                      <TableCell>
                        <Link href={`/agents/${agent.id}`}>
                          <Button variant="ghost" size="sm">
                            View Details
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {stats?.agentTypes && stats.agentTypes.length > 0 && (
          <div className="rounded-md border p-4">
            <h3 className="text-lg font-semibold mb-4">Agent Types Distribution</h3>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {stats.agentTypes.map((type: any) => (
                <div key={type.agent_type} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <div>
                    <p className="font-medium">{type.agent_type}</p>
                    <p className="text-sm text-muted-foreground">{formatNumber(type.total_sessions || 0, 0)} sessions</p>
                  </div>
                  <Badge>{type.count || 0}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
