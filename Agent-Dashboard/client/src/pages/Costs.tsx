import { useState, useEffect } from "react";
import { Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import { api } from "@/lib/api";
import { formatDate as formatDateUtil, formatDuration, formatNumber, formatCurrency } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, TrendingUp, Users, HardDrive } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Costs() {
  const [costs, setCosts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [costsData, statsData] = await Promise.all([
          api.getCosts({ limit: 20 }),
          api.getCostStats(),
        ]);
        setCosts(costsData.costs);
        setStats(statsData);
      } catch (error) {
        console.error("Failed to fetch costs:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Using imported format functions from utils

  const chartData = stats?.dailyTrend?.map((day: any) => {
    const costValue = typeof day.cost === 'number' ? day.cost : 0;
    return {
      date: formatDateUtil(day.date),
      cost: parseFloat((costValue / 100).toFixed(2)), // Convert cents to dollars
    };
  }) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cost Analysis</h1>
          <p className="text-muted-foreground">
            Track infrastructure costs and usage
          </p>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard
              title="Total Cost"
              value={`$${(Number(stats?.total_cost) / 100 || 0).toFixed(2)}`}
              description="Cumulative cost"
              icon={DollarSign}
            />
            <StatCard
              title="Avg per Session"
              value={`$${(Number(stats?.avg_cost_per_session) / 100 || 0).toFixed(4)}`}
              description="Average session cost"
              icon={TrendingUp}
            />
            <StatCard
              title="Participant Minutes"
              value={(Number(stats?.total_participant_minutes) || 0).toFixed(0)}
              description="Total participant time"
              icon={Users}
            />
            <StatCard
              title="Egress Data"
              value={`${(Number(stats?.total_egress_gb) || 0).toFixed(2)} GB`}
              description="Total data transferred"
              icon={HardDrive}
            />
          </div>
        )}

        {loading ? (
          <Skeleton className="h-96" />
        ) : chartData.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Daily Cost Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any, name: string) => {
                      if (name === "cost") return `$${value.toFixed(4)}`;
                      return value;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="cost"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    name="Daily Cost"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ) : null}

        {loading ? (
          <div className="space-y-2">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Recent Rooms with Costs</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Room Name</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Participant Minutes</TableHead>
                    <TableHead>Egress (GB)</TableHead>
                    <TableHead>Total Cost</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {costs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No cost data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    costs.map((cost) => (
                      <TableRow key={cost.id}>
                        <TableCell className="font-medium">{cost.room_name}</TableCell>
                        <TableCell>{formatDateUtil(cost.started_at)}</TableCell>
                        <TableCell>
                          {formatDuration(cost.duration_seconds)}
                        </TableCell>
                        <TableCell>
                          {parseFloat(cost.participant_minutes || "0").toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {parseFloat(cost.egress_gb || "0").toFixed(3)}
                        </TableCell>
                        <TableCell className="font-semibold">
                          ${(parseFloat(cost.total_cost || "0") / 100).toFixed(4)}
                        </TableCell>
                        <TableCell>
                          <Link href={`/rooms/${cost.room_id}`}>
                            <Button variant="ghost" size="sm">
                              View Room
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
