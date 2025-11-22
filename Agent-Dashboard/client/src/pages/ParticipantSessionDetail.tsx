import { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, User, Bot } from "lucide-react";
import { formatBytes, formatCurrency, formatDate, formatDuration } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ParticipantSessionDetail() {
  const [, params] = useRoute("/sessions/:id");
  const [participant, setParticipant] = useState<any>(null);
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchParticipant() {
      if (!params?.id) return;
      
      try {
        setLoading(true);
        const data = await api.getParticipantSessionById(params.id);
        if (data) {
          setParticipant(data.participant);
          setTracks(data.tracks || []);
        }
      } catch (error) {
        console.error("Failed to fetch participant session:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchParticipant();
  }, [params?.id]);

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

  if (!participant) {
    return (
      <DashboardLayout>
        <div className="text-center">
          <p className="text-muted-foreground">Participant session not found</p>
          <Link href="/sessions">
            <Button variant="link">Back to Sessions</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/sessions">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            {participant.is_agent ? (
              <Bot className="h-6 w-6 text-blue-500" />
            ) : (
              <User className="h-6 w-6 text-green-500" />
            )}
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {participant.name || participant.agent_name || participant.identity}
              </h1>
              <p className="text-muted-foreground">Participant Session Details</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={participant.left_at ? "secondary" : "default"}>
                {participant.left_at ? "Ended" : "Active"}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Duration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {participant.duration_seconds > 0
                  ? formatDuration(participant.duration_seconds)
                  : "Active"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tracks</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{participant.track_count || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Type</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={participant.is_agent ? "default" : "outline"}>
                {participant.is_agent ? "Agent" : "User"}
              </Badge>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Session Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Participant SID</p>
                <p className="font-mono text-sm">{participant.participant_sid}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Identity</p>
                <p className="font-mono text-sm">{participant.identity}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Joined At</p>
                <p className="text-sm">{formatDate(participant.joined_at)}</p>
              </div>
              {participant.left_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Left At</p>
                  <p className="text-sm">{formatDate(participant.left_at)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Room Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Room Name</p>
                <Link href={`/rooms/${participant.room_id}`}>
                  <Button variant="link" className="p-0 h-auto">
                    {participant.room_name}
                  </Button>
                </Link>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Room SID</p>
                <p className="font-mono text-sm">{participant.room_sid}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Room Started</p>
                <p className="text-sm">{formatDate(participant.room_started_at)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Room Status</p>
                <Badge variant={participant.room_status === "active" ? "default" : "secondary"}>
                  {participant.room_status}
                </Badge>
              </div>
            </div>
            {participant.room_total_cost > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">Room Total Cost</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(Number(participant.room_total_cost || 0))}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {participant.is_agent && participant.agent_name && (
          <Card>
            <CardHeader>
              <CardTitle>Agent Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Agent Name</p>
                  <p className="text-sm font-semibold">{participant.agent_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Agent ID</p>
                  <p className="font-mono text-sm">{participant.agent_identity}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Agent Type</p>
                  <Badge variant="outline">{participant.agent_type || "Unknown"}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {(participant.total_egress_bytes > 0 || participant.total_ingress_bytes > 0) && (
          <Card>
            <CardHeader>
              <CardTitle>Bandwidth Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Egress</p>
                  <p className="text-2xl font-bold">
                    {formatBytes(Number(participant.total_egress_bytes || 0))}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Ingress</p>
                  <p className="text-2xl font-bold">
                    {formatBytes(Number(participant.total_ingress_bytes || 0))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Tracks ({tracks.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Track Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Bandwidth</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tracks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No tracks
                    </TableCell>
                  </TableRow>
                ) : (
                  tracks.map((track: any) => (
                    <TableRow key={track.id}>
                      <TableCell className="font-mono text-sm">{track.track_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{track.track_type}</Badge>
                      </TableCell>
                      <TableCell>{track.source}</TableCell>
                      <TableCell>{formatDate(track.published_at)}</TableCell>
                      <TableCell>
                        {track.duration_seconds > 0
                          ? formatDuration(track.duration_seconds)
                          : track.unpublished_at ? "Ended" : "Active"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-xs">
                          {track.egress_bytes > 0 && (
                            <span>Egress: {formatBytes(Number(track.egress_bytes || 0))}</span>
                          )}
                          {track.ingress_bytes > 0 && (
                            <span>Ingress: {formatBytes(Number(track.ingress_bytes || 0))}</span>
                          )}
                          {!track.egress_bytes && !track.ingress_bytes && <span>-</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link href={`/tracks/${track.id}`}>
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
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

