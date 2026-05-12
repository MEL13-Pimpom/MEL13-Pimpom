"use client";

import { useTransition } from "react";
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
import { createScheduleAction } from "@/lib/actions/admin";
import {
  createScheduleSchema,
  DAY_OF_WEEK_LABELS,
  type CreateScheduleInput,
} from "@/lib/validations/admin";

export function CreateScheduleForm() {
  const [pending, startTransition] = useTransition();
  const form = useForm<CreateScheduleInput>({
    resolver: zodResolver(createScheduleSchema),
    defaultValues: {
      area: "",
      dayOfWeek: 1,
      timeWindow: "08:00 - 10:00",
      capacity: 10,
    },
  });

  const onSubmit = (values: CreateScheduleInput) => {
    startTransition(async () => {
      const result = await createScheduleAction(values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Schedule created.");
      form.reset();
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="area"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Area</FormLabel>
              <FormControl>
                <Input placeholder="e.g. North Springfield" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="dayOfWeek"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Day of week</FormLabel>
              <Select
                onValueChange={(v) => field.onChange(Number(v))}
                defaultValue={String(field.value)}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a day" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(DAY_OF_WEEK_LABELS).map(([v, label]) => (
                    <SelectItem key={v} value={v}>
                      {label}
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
          name="timeWindow"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Time window</FormLabel>
              <FormControl>
                <Input placeholder="e.g. 08:00 - 10:00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="capacity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Capacity</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Creating..." : "Create schedule"}
        </Button>
      </form>
    </Form>
  );
}
