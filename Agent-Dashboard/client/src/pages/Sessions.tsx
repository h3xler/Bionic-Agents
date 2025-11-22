import { useState, useEffect } from "react";
import { Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { api } from "@/lib/api";
import { DateRangePicker } from "@/components/DateRangePicker";
import { DateRange } from "react-day-picker";
import { formatDate as formatDateUtil, formatDuration } from "@/lib/utils";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, X, User, Bot } from "lucide-react";

export default function Sessions() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedAgent, setSelectedAgent] = useState<string>("all");
  const [sessionType, setSessionType] = useState<string>("all"); // all, user, agent
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAgents() {
      try {
        const data = await api.getAgents();
        setAgents(data?.agents || []);
      } catch (error) {
        console.error("Failed to fetch agents:", error);
      }
    }
    fetchAgents();
  }, []);

  useEffect(() => {
    async function fetchSessions() {
      try {
        setLoading(true);
        const params: any = {
          page: pagination.page,
          limit: pagination.limit,
        };
        
        if (dateRange?.from) {
          params.startDate = dateRange.from.toISOString();
        }
        if (dateRange?.to) {
          params.endDate = dateRange.to.toISOString();
        }
        
        if (selectedAgent && selectedAgent !== "all") {
          params.agentId = selectedAgent;
        }
        
        if (sessionType && sessionType !== "all") {
          params.sessionType = sessionType;
        }
        
        const data = await api.getParticipantSessions(params);
        setSessions(data?.sessions || []);
        if (data?.total !== undefined) {
          setPagination(prev => ({
            ...prev,
            total: data.total,
            totalPages: Math.ceil(data.total / prev.limit),
          }));
        }
      } catch (error) {
        console.error("Failed to fetch participant sessions:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSessions();
    const interval = setInterval(fetchSessions, 30000);
    return () => clearInterval(interval);
  }, [pagination.page, dateRange, selectedAgent, sessionType]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sessions</h1>
            <p className="text-muted-foreground">
              Monitor user and agent participant sessions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          {dateRange && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDateRange(undefined)}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          
          <Select value={sessionType} onValueChange={setSessionType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Session Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sessions</SelectItem>
              <SelectItem value="user">User Sessions</SelectItem>
              <SelectItem value="agent">Agent Sessions</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedAgent} onValueChange={setSelectedAgent}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by Agent" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Agents</SelectItem>
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.agent_id}>
                  {agent.agent_name || agent.agent_id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={`session-skeleton-${i}`} className="h-16" />
            ))}
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Participant</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Left</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        No sessions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    sessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {session.is_agent ? (
                              <Bot className="h-4 w-4 text-blue-500" />
                            ) : (
                              <User className="h-4 w-4 text-green-500" />
                            )}
                            <span>{session.name || session.identity}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={session.is_agent ? "default" : "secondary"}>
                            {session.is_agent ? "Agent" : "User"}
                          </Badge>
                        </TableCell>
                        <TableCell>{session.room_name}</TableCell>
                        <TableCell>
                          <Badge variant={session.left_at ? "secondary" : "default"}>
                            {session.left_at ? "Ended" : "Active"}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDateUtil(session.joined_at)}</TableCell>
                        <TableCell>
                          {session.left_at ? formatDateUtil(session.left_at) : "-"}
                        </TableCell>
                        <TableCell>
                          {session.duration_seconds > 0
                            ? formatDuration(session.duration_seconds)
                            : session.left_at ? "0s" : "Active"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Link href={`/sessions/${session.id}`}>
                              <Button variant="ghost" size="sm">
                                View Details
                              </Button>
                            </Link>
                            <Link href={`/rooms/${session.room_id}`}>
                              <Button variant="outline" size="sm">
                                View Room
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                    disabled={pagination.page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                    disabled={pagination.page === pagination.totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

