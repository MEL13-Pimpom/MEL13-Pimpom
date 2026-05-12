"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
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
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { createRequestAction } from "@/lib/actions/requests";
import {
  createRequestSchema,
  REQUEST_TYPES,
  REQUEST_TYPE_LABELS,
  TIME_WINDOWS,
  TIME_WINDOW_LABELS,
  type CreateRequestInput,
} from "@/lib/validations/request";

const WASTE_TYPE_EMOJI: Record<(typeof REQUEST_TYPES)[number], string> = {
  paper: "📄",
  plastic: "♻️",
  metal: "🔩",
  glass: "🍾",
  electronic: "📱",
  mixed: "📦",
};

interface Props {
  userId: string;
  defaultAddress: string;
}

export function NewRequestForm({ userId, defaultAddress }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, startTransition] = useTransition();

  const form = useForm<CreateRequestInput>({
    resolver: zodResolver(createRequestSchema),
    defaultValues: {
      type: "mixed",
      address: defaultAddress,
      weightKgEstimate: undefined,
      preferredDate: "",
      preferredTimeWindow: "morning",
      notes: "",
      photoUrl: "",
    },
  });

  const selectedType = form.watch("type");

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Photo must be under 5MB.");
      return;
    }

    setUploading(true);
    const preview = URL.createObjectURL(file);
    setPhotoPreview(preview);

    try {
      const supabase = createSupabaseBrowserClient();
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${userId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("pickup-photos")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("pickup-photos").getPublicUrl(path);
      setPhotoUrl(data.publicUrl);
      form.setValue("photoUrl", data.publicUrl);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Photo upload failed.");
      setPhotoPreview(null);
      setPhotoUrl(null);
      form.setValue("photoUrl", "");
    } finally {
      setUploading(false);
    }
  };

  const clearPhoto = () => {
    setPhotoPreview(null);
    setPhotoUrl(null);
    form.setValue("photoUrl", "");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = (values: CreateRequestInput) => {
    startTransition(async () => {
      const result = await createRequestAction({
        ...values,
        photoUrl: photoUrl ?? undefined,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Request submitted!", {
        description: "We'll notify you once it's reviewed.",
      });
      router.push("/resident/requests");
      router.refresh();
    });
  };

  return (
    <Card>
      <CardContent className="p-6 md:p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <section className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold">Waste type</h2>
                <p className="text-sm text-muted-foreground">
                  Pick the category that best matches what you&apos;re recycling.
                </p>
              </div>
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {REQUEST_TYPES.map((t) => {
                        const isActive = selectedType === t;
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => field.onChange(t)}
                            className={`p-4 rounded-lg border-2 transition-all text-left ${
                              isActive
                                ? "border-primary bg-accent ring-2 ring-primary/30"
                                : "border-border bg-white hover:border-primary/50"
                            }`}
                          >
                            <div className="text-3xl mb-2">
                              {WASTE_TYPE_EMOJI[t]}
                            </div>
                            <div className="font-medium">{REQUEST_TYPE_LABELS[t]}</div>
                          </button>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold">Pickup details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="preferredDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          min={new Date().toISOString().split("T")[0]}
                          className="h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="preferredTimeWindow"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred time window</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Choose a window" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TIME_WINDOWS.map((w) => (
                            <SelectItem key={w} value={w}>
                              {TIME_WINDOW_LABELS[w]}
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
                  name="weightKgEstimate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimated weight (kg)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          placeholder="e.g. 5"
                          className="h-11"
                          value={field.value ?? ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            field.onChange(v === "" ? undefined : Number(v));
                          }}
                        />
                      </FormControl>
                      <FormDescription>Optional — helps with planning.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pickup address</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={2}
                        placeholder="Street, building, unit number"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes for collector (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="e.g. Leave by the side door, ring doorbell."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            <section className="space-y-3">
              <div>
                <h2 className="text-xl font-semibold">Photo (optional)</h2>
                <p className="text-sm text-muted-foreground">
                  A picture helps collectors prepare. Max 5MB.
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                disabled={uploading}
                className="hidden"
              />
              {photoPreview ? (
                <div className="relative inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="h-40 w-40 object-cover rounded-lg border border-border"
                  />
                  {uploading ? (
                    <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={clearPhoto}
                        className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="absolute bottom-2 left-2 bg-primary text-white rounded-full p-1">
                        <Check className="w-3 h-3" />
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-40 w-40 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                  disabled={uploading}
                >
                  <ImagePlus className="w-8 h-8 mb-2" />
                  <span className="text-sm">Add photo</span>
                </button>
              )}
            </section>

            <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={submitting}
                className="h-11"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting || uploading}
                className="h-11 px-6"
              >
                {submitting ? "Submitting..." : "Submit request"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
