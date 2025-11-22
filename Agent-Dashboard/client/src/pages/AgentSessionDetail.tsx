import { useRoute, Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { formatNumber, formatCurrency, formatDuration } from "@/lib/utils";
import StatCard from "@/components/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageSquare, Clock, DollarSign, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AgentSessionDetail() {
  const [, params] = useRoute("/agent-sessions/:sessionId");
  const sessionId = params?.sessionId || "";

  const { data: sessionMetrics, isLoading } = trpc.livekit.getSessionMetrics.useQuery(
    { sessionId },
    { enabled: !!sessionId }
  );

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-64" />
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

  if (!sessionMetrics) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/sessions">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Session Not Found</h1>
              <p className="text-muted-foreground">Session ID: {sessionId}</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/sessions">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Session Details</h1>
            <p className="text-muted-foreground">Session ID: {sessionId}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Messages"
            value={formatNumber(sessionMetrics.messageCount || 0, 0).toString()}
            description="All messages"
            icon={MessageSquare}
          />
          <StatCard
            title="User Messages"
            value={formatNumber(sessionMetrics.userMessageCount || 0, 0).toString()}
            description="From users"
            icon={MessageSquare}
          />
          <StatCard
            title="Agent Messages"
            value={formatNumber(sessionMetrics.agentMessageCount || 0, 0).toString()}
            description="From agent"
            icon={MessageSquare}
          />
          <StatCard
            title="Total Cost"
            value={formatCurrency((sessionMetrics.totalCost || 0) / 100)}
            description="Session cost"
            icon={DollarSign}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            title="Avg STT Latency"
            value={`${formatNumber(sessionMetrics.avgSttLatency || 0, 0)}ms`}
            description="Speech-to-text"
            icon={Clock}
          />
          <StatCard
            title="Avg TTS Latency"
            value={`${formatNumber(sessionMetrics.avgTtsLatency || 0, 0)}ms`}
            description="Text-to-speech"
            icon={Clock}
          />
          <StatCard
            title="Avg LLM Latency"
            value={`${formatNumber(sessionMetrics.avgLlmLatency || 0, 0)}ms`}
            description="LLM response"
            icon={Clock}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Token Usage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Tokens:</span>
                <span className="font-medium">{formatNumber(sessionMetrics.totalTokens || 0, 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Input Tokens:</span>
                <span className="font-medium">{formatNumber(sessionMetrics.inputTokens || 0, 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Output Tokens:</span>
                <span className="font-medium">{formatNumber(sessionMetrics.outputTokens || 0, 0)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cost Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Cost:</span>
                <span className="font-medium">{formatCurrency((sessionMetrics.totalCost || 0) / 100)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">LangFuse Cost:</span>
                <span className="font-medium">{formatCurrency((sessionMetrics.langfuseCost || 0) / 100)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Errors:</span>
                <span className="font-medium text-destructive">
                  {formatNumber(sessionMetrics.errorCount || 0, 0)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

