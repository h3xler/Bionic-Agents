import { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Video, Mic, User, Bot } from "lucide-react";
import { formatBytes, formatDate, formatDuration } from "@/lib/utils";

export default function TrackDetail() {
  const [, params] = useRoute("/tracks/:id");
  const [track, setTrack] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrack() {
      if (!params?.id) return;
      
      try {
        setLoading(true);
        const data = await api.getTrackById(params.id);
        if (data) {
          setTrack(data.track);
        }
      } catch (error) {
        console.error("Failed to fetch track:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchTrack();
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

  if (!track) {
    return (
      <DashboardLayout>
        <div className="text-center">
          <p className="text-muted-foreground">Track not found</p>
          <Link href="/rooms">
            <Button variant="link">Back to Rooms</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const getTrackIcon = () => {
    if (track.track_type === "video") return <Video className="h-6 w-6 text-red-500" />;
    if (track.track_type === "audio") return <Mic className="h-6 w-6 text-blue-500" />;
    return null;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/rooms/${track.room_id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            {getTrackIcon()}
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{track.track_name}</h1>
              <p className="text-muted-foreground">Track Details</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle>Type</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="outline" className="text-lg">
                {track.track_type}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={track.unpublished_at ? "secondary" : "default"}>
                {track.unpublished_at ? "Unpublished" : "Active"}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Duration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {track.duration_seconds > 0
                  ? formatDuration(track.duration_seconds)
                  : "Active"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Muted</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={track.muted ? "destructive" : "outline"}>
                {track.muted ? "Yes" : "No"}
              </Badge>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Track Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Track SID</p>
                <p className="font-mono text-sm">{track.track_sid}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Source</p>
                <Badge variant="outline">{track.source}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Published At</p>
                <p className="text-sm">{formatDate(track.published_at)}</p>
              </div>
              {track.unpublished_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Unpublished At</p>
                  <p className="text-sm">{formatDate(track.unpublished_at)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {(track.egress_bytes > 0 || track.ingress_bytes > 0) && (
          <Card>
            <CardHeader>
              <CardTitle>Bandwidth Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Egress</p>
                  <p className="text-2xl font-bold">
                    {formatBytes(Number(track.egress_bytes || 0))}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ingress</p>
                  <p className="text-2xl font-bold">
                    {formatBytes(Number(track.ingress_bytes || 0))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Participant Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Participant</p>
                <div className="flex items-center gap-2">
                  {track.is_agent ? (
                    <Bot className="h-4 w-4 text-blue-500" />
                  ) : (
                    <User className="h-4 w-4 text-green-500" />
                  )}
                  <Link href={`/sessions/${track.participant_id}`}>
                    <Button variant="link" className="p-0 h-auto">
                      {track.participant_name || track.participant_identity}
                    </Button>
                  </Link>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Identity</p>
                <p className="font-mono text-sm">{track.participant_identity}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <Badge variant={track.is_agent ? "default" : "outline"}>
                  {track.is_agent ? "Agent" : "User"}
                </Badge>
              </div>
              {track.agent_name && (
                <div>
                  <p className="text-sm text-muted-foreground">Agent Name</p>
                  <p className="text-sm font-semibold">{track.agent_name}</p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-sm text-muted-foreground">Participant Joined</p>
                <p className="text-sm">{formatDate(track.participant_joined_at)}</p>
              </div>
              {track.participant_left_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Participant Left</p>
                  <p className="text-sm">{formatDate(track.participant_left_at)}</p>
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
                <Link href={`/rooms/${track.room_id}`}>
                  <Button variant="link" className="p-0 h-auto">
                    {track.room_name}
                  </Button>
                </Link>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Room SID</p>
                <p className="font-mono text-sm">{track.room_sid}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Room Started</p>
                <p className="text-sm">{formatDate(track.room_started_at)}</p>
              </div>
              {track.room_ended_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Room Ended</p>
                  <p className="text-sm">{formatDate(track.room_ended_at)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

