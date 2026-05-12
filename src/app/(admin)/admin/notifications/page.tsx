import { format, parseISO } from "date-fns";
import { Megaphone } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { BroadcastForm } from "./broadcast-form";

export const metadata = { title: "Notifications" };

interface BroadcastGroup {
  title: string;
  body: string | null;
  created_at: string;
  recipients: number;
}

export default async function AdminNotificationsPage() {
  await requireRole("admin");
  const supabase = await createSupabaseServerClient();

  const { data: recent } = await supabase
    .from("notifications")
    .select("title, body, created_at")
    .eq("type", "broadcast")
    .order("created_at", { ascending: false })
    .limit(500);

  const grouped: BroadcastGroup[] = [];
  const seen = new Map<string, BroadcastGroup>();
  for (const row of recent ?? []) {
    const minute = row.created_at.slice(0, 16);
    const key = `${row.title}::${row.body ?? ""}::${minute}`;
    const existing = seen.get(key);
    if (existing) {
      existing.recipients += 1;
    } else {
      const group: BroadcastGroup = {
        title: row.title,
        body: row.body,
        created_at: row.created_at,
        recipients: 1,
      };
      seen.set(key, group);
      grouped.push(group);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground mb-2">
          Notification Management
        </h1>
        <p className="text-muted-foreground">
          Broadcast announcements to residents, collectors, or everyone.
        </p>
      </div>

      <Tabs defaultValue="send">
        <TabsList>
          <TabsTrigger value="send">Send broadcast</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="send" className="mt-6">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-primary" />
                Compose
              </CardTitle>
              <CardDescription>
                The message will appear in the recipient&apos;s notifications instantly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BroadcastForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent broadcasts</CardTitle>
              <CardDescription>
                Last 500 broadcast notifications grouped by send time.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sent at</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Body</TableHead>
                      <TableHead className="text-right">Recipients</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grouped.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                          No broadcasts sent yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      grouped.map((g, idx) => (
                        <TableRow key={`${g.title}-${g.created_at}-${idx}`}>
                          <TableCell className="whitespace-nowrap">
                            {format(parseISO(g.created_at), "MMM d, yyyy HH:mm")}
                          </TableCell>
                          <TableCell className="font-medium">{g.title}</TableCell>
                          <TableCell className="max-w-md truncate" title={g.body ?? ""}>
                            {g.body}
                          </TableCell>
                          <TableCell className="text-right">{g.recipients}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
