"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { broadcastNotificationAction } from "@/lib/actions/admin";
import {
  broadcastSchema,
  type BroadcastInput,
} from "@/lib/validations/admin";

export function BroadcastForm() {
  const [pending, startTransition] = useTransition();
  const form = useForm<BroadcastInput>({
    resolver: zodResolver(broadcastSchema),
    defaultValues: {
      title: "",
      body: "",
      targetRole: "all",
    },
  });

  const onSubmit = (values: BroadcastInput) => {
    startTransition(async () => {
      const result = await broadcastNotificationAction(values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Broadcast sent.");
      form.reset({ title: "", body: "", targetRole: values.targetRole });
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="targetRole"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Audience</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="all">Everyone</SelectItem>
                  <SelectItem value="resident">All residents</SelectItem>
                  <SelectItem value="collector">All collectors</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Service update" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="body"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message</FormLabel>
              <FormControl>
                <Textarea
                  rows={5}
                  placeholder="Type your message here..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={pending}>
          <Send className="w-4 h-4 mr-2" />
          {pending ? "Sending..." : "Send broadcast"}
        </Button>
      </form>
    </Form>
  );
}
