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
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export default function Rooms() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRooms() {
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
        
        const data = await api.getSessions(params);
        setRooms(data?.sessions || []);
        if (data?.total !== undefined) {
          setPagination(prev => ({
            ...prev,
            total: data.total,
            totalPages: Math.ceil(data.total / prev.limit),
          }));
        }
      } catch (error) {
        console.error("Failed to fetch rooms:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchRooms();
    const interval = setInterval(fetchRooms, 30000);
    return () => clearInterval(interval);
  }, [pagination.page, dateRange]);

  // Using imported formatDuration from utils

  // Using imported formatDateUtil from utils

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Rooms</h1>
            <p className="text-muted-foreground">
              Monitor all LiveKit rooms and their sessions
            </p>
          </div>
          <div className="flex items-center gap-2">
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
          </div>
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
                    <TableHead>Room Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Participants</TableHead>
                    <TableHead>Tracks</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rooms.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No rooms found
                      </TableCell>
                    </TableRow>
                  ) : (
                    rooms.map((room) => (
                      <TableRow key={room.id}>
                        <TableCell className="font-medium">{room.room_name}</TableCell>
                        <TableCell>
                          <Badge variant={room.is_active ? "default" : "secondary"}>
                            {room.is_active ? "Active" : "Ended"}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDateUtil(room.started_at)}</TableCell>
                        <TableCell>
                          {room.duration_seconds > 0
                            ? formatDuration(room.duration_seconds)
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {room.current_participants || 0} / {room.total_participants || 0}
                        </TableCell>
                        <TableCell>{room.total_tracks || 0}</TableCell>
                        <TableCell>
                          <Link href={`/rooms/${room.id}`}>
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
