import { useState } from "react";
import { Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { formatNumber, formatCurrency, formatDuration } from "@/lib/utils";
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
import { Users, Activity, DollarSign } from "lucide-react";

export default function Tenants() {
  const { data: tenantStats, isLoading } = trpc.livekit.getTenantStats.useQuery({});

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tenants</h1>
            <p className="text-muted-foreground">
              Multi-tenant agent management and metrics
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </DashboardLayout>
    );
  }

  const tenants = Array.isArray(tenantStats) ? tenantStats : [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tenants</h1>
          <p className="text-muted-foreground">
            Multi-tenant agent management and metrics
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Tenants"
            value={formatNumber(tenants.length, 0).toString()}
            description="Active tenant accounts"
            icon={Users}
          />
          <StatCard
            title="Total Agents"
            value={formatNumber(
              tenants.reduce((sum, t) => sum + (t.activeAgents || 0), 0),
              0
            ).toString()}
            description="Across all tenants"
            icon={Activity}
          />
          <StatCard
            title="Total Sessions"
            value={formatNumber(
              tenants.reduce((sum, t) => sum + (t.totalSessions || 0), 0),
              0
            ).toString()}
            description="Today"
            icon={Activity}
          />
          <StatCard
            title="Total Cost"
            value={formatCurrency(
              tenants.reduce((sum, t) => sum + (t.totalCost || 0), 0) / 100
            )}
            description="Today"
            icon={DollarSign}
          />
        </div>

        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant ID</TableHead>
                <TableHead>Active Agents</TableHead>
                <TableHead>Sessions</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No tenants found
                  </TableCell>
                </TableRow>
              ) : (
                tenants.map((tenant) => (
                  <TableRow key={tenant.tenantId}>
                    <TableCell className="font-medium">{tenant.tenantId}</TableCell>
                    <TableCell>{formatNumber(tenant.activeAgents, 0)}</TableCell>
                    <TableCell>{formatNumber(tenant.totalSessions, 0)}</TableCell>
                    <TableCell>
                      {formatDuration(tenant.totalDurationSeconds || 0)}
                    </TableCell>
                    <TableCell>{formatCurrency((tenant.totalCost || 0) / 100)}</TableCell>
                    <TableCell>
                      <Link href={`/tenants/${tenant.tenantId}`}>
                        <Button variant="outline" size="sm">
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
      </div>
    </DashboardLayout>
  );
}

