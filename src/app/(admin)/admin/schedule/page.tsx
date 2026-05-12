import { Clock, MapPin } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireRole } from "@/lib/auth/get-current-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DAY_OF_WEEK_LABELS } from "@/lib/validations/admin";
import { CreateScheduleForm } from "./create-schedule-form";
import { ScheduleRowActions } from "./schedule-row-actions";

export const metadata = { title: "Schedule Management" };

export default async function AdminSchedulePage() {
  await requireRole("admin");
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("schedules")
    .select("*")
    .order("day_of_week", { ascending: true })
    .order("time_window", { ascending: true });

  const schedules = data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground mb-2">
          Schedule Management
        </h1>
        <p className="text-muted-foreground">
          Define weekly pickup windows by area, day, and capacity.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Add a schedule</CardTitle>
            <CardDescription>Create a new weekly pickup window.</CardDescription>
          </CardHeader>
          <CardContent>
            <CreateScheduleForm />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Active and inactive windows</CardTitle>
            <CardDescription>
              Toggle a schedule off to hide it from residents and collectors.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Area</TableHead>
                    <TableHead>Day</TableHead>
                    <TableHead>Time window</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        No schedules yet. Create one to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    schedules.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            {s.area}
                          </div>
                        </TableCell>
                        <TableCell>{DAY_OF_WEEK_LABELS[s.day_of_week]}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            {s.time_window}
                          </div>
                        </TableCell>
                        <TableCell>{s.capacity}</TableCell>
                        <TableCell>
                          {s.is_active ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-green-100 text-green-800 border border-green-200">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-gray-100 text-gray-700 border border-gray-200">
                              Disabled
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <ScheduleRowActions id={s.id} isActive={s.is_active} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
