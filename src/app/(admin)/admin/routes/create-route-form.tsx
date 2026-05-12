"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { createRouteAction } from "@/lib/actions/admin";
import {
  createRouteSchema,
  type CreateRouteInput,
} from "@/lib/validations/admin";

const UNASSIGNED = "__unassigned";

interface Props {
  collectors: { id: string; full_name: string }[];
}

export function CreateRouteForm({ collectors }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const form = useForm<CreateRouteInput>({
    resolver: zodResolver(createRouteSchema),
    defaultValues: {
      name: "",
      scheduledDate: new Date().toISOString().split("T")[0],
      collectorId: "",
      notes: "",
    },
  });

  const onSubmit = (values: CreateRouteInput) => {
    startTransition(async () => {
      const result = await createRouteAction(values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Route created.");
      form.reset({
        name: "",
        scheduledDate: new Date().toISOString().split("T")[0],
        collectorId: "",
        notes: "",
      });
      router.refresh();
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Route name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. North Springfield AM" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="scheduledDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Scheduled date</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="collectorId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Collector (optional)</FormLabel>
              <Select
                onValueChange={(v) =>
                  field.onChange(v === UNASSIGNED ? "" : v)
                }
                value={field.value && field.value.length > 0 ? field.value : UNASSIGNED}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Assign later" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={UNASSIGNED}>Assign later</SelectItem>
                  {collectors.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (optional)</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="Special instructions for this route"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Creating..." : "Create route"}
        </Button>
      </form>
    </Form>
  );
}
