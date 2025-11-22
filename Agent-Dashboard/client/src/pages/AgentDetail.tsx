import { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AgentDetail() {
  const [, params] = useRoute("/agents/:id");
  const [agent, setAgent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAgent() {
      if (!params?.id) return;
      
      try {
        setLoading(true);
        const data = await api.getAgentById(params.id);
        // API returns { agent, sessions }
        if (data) {
          setAgent({
            ...data.agent,
            sessions: data.sessions,
          });
        }
      } catch (error) {
        console.error("Failed to fetch agent:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAgent();
  }, [params?.id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!agent) {
    return (
      <DashboardLayout>
        <div className="text-center">
          <p className="text-muted-foreground">Agent not found</p>
          <Link href="/agents">
            <Button variant="link">Back to Agents</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/agents">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {agent.agent_name || agent.agent_identity}
            </h1>
            <p className="text-muted-foreground">Agent Details</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Type</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="outline" className="text-lg">
                {agent.agent_type}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Total Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{agent.total_sessions || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Total Duration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {agent.total_duration_seconds > 0
                  ? formatDuration(agent.total_duration_seconds)
                  : "0s"}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Agent Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Agent Identity</p>
                <p className="font-mono text-sm">{agent.agent_identity}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">First Seen</p>
                <p className="text-sm">{formatDate(agent.first_seen_at)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Seen</p>
                <p className="text-sm">{formatDate(agent.last_seen_at)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tracks Published</p>
                <p className="text-sm">{agent.total_tracks_published || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Session History ({agent.sessions?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Room Name</TableHead>
                  <TableHead>Participant</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Left</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Tracks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agent.sessions?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No sessions found
                    </TableCell>
                  </TableRow>
                ) : (
                  agent.sessions?.map((session: any) => (
                    <TableRow key={session.id}>
                      <TableCell>
                        <Link href={`/rooms/${session.room_id}`}>
                          <Button variant="link" className="p-0 h-auto">
                            {session.room_name || session.room_sid}
                          </Button>
                        </Link>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {session.participant_identity}
                      </TableCell>
                      <TableCell>{formatDate(session.joined_at)}</TableCell>
                      <TableCell>
                        {session.left_at ? formatDate(session.left_at) : "Active"}
                      </TableCell>
                      <TableCell>
                        {session.duration_seconds > 0
                          ? formatDuration(session.duration_seconds)
                          : "-"}
                      </TableCell>
                      <TableCell>{session.tracks_published || 0}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
