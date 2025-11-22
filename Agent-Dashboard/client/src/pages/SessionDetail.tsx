import { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { formatBytes, formatCurrency, formatDate, formatDuration } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function SessionDetail() {
  // Support both /rooms/:id and /sessions/:id routes
  const [, roomParams] = useRoute("/rooms/:id");
  const [, sessionParams] = useRoute("/sessions/:id");
  const params = roomParams || sessionParams;
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSession() {
      if (!params?.id) return;
      
      try {
        setLoading(true);
        const data = await api.getSessionById(params.id);
        // API returns { session, participants, tracks }
        if (data) {
          setSession({
            ...data.session,
            participants: data.participants,
            tracks: data.tracks,
          });
        }
      } catch (error) {
        console.error("Failed to fetch session:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSession();
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

  if (!session) {
    return (
      <DashboardLayout>
        <div className="text-center">
          <p className="text-muted-foreground">Room not found</p>
          <Link href="/rooms">
            <Button variant="link">Back to Rooms</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/rooms">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{session.room_name}</h1>
            <p className="text-muted-foreground">Room Details</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={session.is_active ? "default" : "secondary"}>
                {session.is_active ? "Active" : "Ended"}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Duration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {session.duration_seconds > 0
                  ? formatDuration(session.duration_seconds)
                  : "Ongoing"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Total Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {formatCurrency(Number(session.total_cost || 0))}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Participants</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {session.participants?.length || 0}
              </p>
            </CardContent>
          </Card>
        </div>

        {session.total_cost > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Cost Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Participant Minutes</p>
                  <p className="text-lg font-semibold">{session.participant_minutes || 0}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(Number(session.participant_cost || 0))}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Egress</p>
                  <p className="text-lg font-semibold">{session.egress_gb || 0} GB</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(Number(session.egress_cost || 0))}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ingress</p>
                  <p className="text-lg font-semibold">{session.ingress_gb || 0} GB</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(Number(session.ingress_cost || 0))}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(Number(session.total_cost || 0))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Bandwidth Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Egress</p>
                <p className="text-2xl font-bold">
                  {formatBytes(Number(session.total_egress_bytes || 0))}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Ingress</p>
                <p className="text-2xl font-bold">
                  {formatBytes(Number(session.total_ingress_bytes || 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Session Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Room SID</p>
                <p className="font-mono text-sm">{session.room_sid}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Started At</p>
                <p className="text-sm">{formatDate(session.started_at)}</p>
              </div>
              {session.ended_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Ended At</p>
                  <p className="text-sm">{formatDate(session.ended_at)}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Max Participants</p>
                <p className="text-sm">{session.max_participants || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Participants ({session.participants?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Identity</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Tracks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {session.participants?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No participants
                    </TableCell>
                  </TableRow>
                ) : (
                  session.participants?.map((participant: any) => (
                    <TableRow key={participant.id}>
                      <TableCell className="font-mono text-sm">
                        <Link href={`/sessions/${participant.id}`}>
                          <Button variant="link" className="p-0 h-auto font-mono">
                            {participant.identity}
                          </Button>
                        </Link>
                      </TableCell>
                      <TableCell>{participant.name || participant.agent_name || "-"}</TableCell>
                      <TableCell>{formatDate(participant.joined_at)}</TableCell>
                      <TableCell>
                        {participant.duration_seconds > 0
                          ? formatDuration(participant.duration_seconds)
                          : "Active"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={participant.is_agent ? "default" : "outline"}>
                          {participant.is_agent ? "Agent" : "User"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{participant.track_count || 0} tracks</span>
                          {participant.total_egress_bytes > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {formatBytes(Number(participant.total_egress_bytes || 0))} egress
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tracks ({session.tracks?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Track Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Participant</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Bandwidth</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {session.tracks?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No tracks
                    </TableCell>
                  </TableRow>
                ) : (
                  session.tracks?.map((track: any) => (
                    <TableRow key={track.id}>
                      <TableCell className="font-mono text-sm">{track.track_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{track.track_type}</Badge>
                      </TableCell>
                      <TableCell>{track.source}</TableCell>
                      <TableCell>
                        <Link href={`/sessions/${track.participant_id}`}>
                          <Button variant="link" className="p-0 h-auto">
                            {track.participant_identity}
                          </Button>
                        </Link>
                      </TableCell>
                      <TableCell>{formatDate(track.published_at)}</TableCell>
                      <TableCell>
                        {track.duration_seconds > 0
                          ? formatDuration(track.duration_seconds)
                          : "Active"}
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
