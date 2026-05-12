"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, Loader2, ShieldCheck, UserCog } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  requestRoleChangeAction,
  updateProfileAction,
} from "@/lib/actions/account";
import {
  requestRoleChangeSchema,
  updateProfileSchema,
  type RequestRoleChangeInput,
  type UpdateProfileInput,
} from "@/lib/validations/account";
import type { UserRole } from "@/lib/types/database";

interface Props {
  userId: string;
  defaultValues: UpdateProfileInput;
  currentRole: UserRole;
}

const ROLE_LABELS: Record<UserRole, string> = {
  resident: "Resident",
  admin: "Administrator",
  collector: "Collector",
};

function getStoragePath(publicUrl: string, bucket: string): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return publicUrl.slice(idx + marker.length);
}

export function ProfileForm({ userId, defaultValues, currentRole }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const blobUrlRef = useRef<string | null>(null);

  const [savedAvatarUrl, setSavedAvatarUrl] = useState(defaultValues.avatarUrl ?? "");
  const [previewUrl, setPreviewUrl] = useState(defaultValues.avatarUrl ?? "");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, startSaving] = useTransition();

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, []);

  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues,
  });

  const fullName = form.watch("fullName");
  const initials = (fullName || "U")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      toast.error("Avatar must be under 3MB.");
      return;
    }

    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
    }

    const blobUrl = URL.createObjectURL(file);
    blobUrlRef.current = blobUrl;
    setPendingFile(file);
    setPreviewUrl(blobUrl);
    form.setValue("avatarUrl", blobUrl, { shouldDirty: true });

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = (values: UpdateProfileInput) => {
    startSaving(async () => {
      let finalAvatarUrl = savedAvatarUrl;

      if (pendingFile) {
        setUploading(true);
        try {
          const supabase = createSupabaseBrowserClient();
          const ext = pendingFile.name.split(".").pop()?.toLowerCase() ?? "jpg";
          const path = `${userId}/avatar-${Date.now()}.${ext}`;

          const { error: uploadError } = await supabase.storage
            .from("avatars")
            .upload(path, pendingFile, { cacheControl: "3600", upsert: false });
          if (uploadError) throw uploadError;

          const { data } = supabase.storage.from("avatars").getPublicUrl(path);
          finalAvatarUrl = data.publicUrl;

          if (savedAvatarUrl) {
            const oldPath = getStoragePath(savedAvatarUrl, "avatars");
            if (oldPath) {
              await supabase.storage.from("avatars").remove([oldPath]);
            }
          }
        } catch (err) {
          setUploading(false);
          toast.error(err instanceof Error ? err.message : "Avatar upload failed.");
          return;
        }
        setUploading(false);

        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current);
          blobUrlRef.current = null;
        }
        setPendingFile(null);
        setSavedAvatarUrl(finalAvatarUrl);
        setPreviewUrl(finalAvatarUrl);
      }

      const result = await updateProfileAction({ ...values, avatarUrl: finalAvatarUrl });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Profile updated.");
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Personal information</CardTitle>
          <CardDescription>
            Update your name, contact, and avatar. Your role is{" "}
            <span className="font-medium text-foreground">
              {ROLE_LABELS[currentRole]}
            </span>
            .
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <section className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <Avatar className="h-24 w-24 border-2 border-border">
                  {previewUrl ? <AvatarImage src={previewUrl} alt={fullName} /> : null}
                  <AvatarFallback className="text-lg bg-primary/10 text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    disabled={uploading}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <ImagePlus className="w-4 h-4 mr-2" />
                        Change avatar
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    PNG/JPG up to 3MB.
                  </p>
                </div>
              </section>

              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. 0901 234 567"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={2}
                          placeholder="Street, building, unit"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end pt-2 border-t border-border">
                <Button type="submit" disabled={saving || uploading}>
                  {saving ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {currentRole !== "admin" ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Role change request</CardTitle>
                <CardDescription>
                  Request a different role. An administrator will review and decide.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <RequestRoleChangeDialog currentRole={currentRole} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function RequestRoleChangeDialog({ currentRole }: { currentRole: UserRole }) {
  const [open, setOpen] = useState(false);
  const [submitting, startSubmit] = useTransition();

  const form = useForm<RequestRoleChangeInput>({
    resolver: zodResolver(requestRoleChangeSchema),
    defaultValues: {
      requestedRole: currentRole === "resident" ? "collector" : "resident",
      reason: "",
    },
  });

  const onSubmit = (values: RequestRoleChangeInput) => {
    startSubmit(async () => {
      const result = await requestRoleChangeAction(values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Request sent to administrators.");
      form.reset();
      setOpen(false);
    });
  };

  const options: UserRole[] = ["resident", "collector", "admin"];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <UserCog className="w-4 h-4 mr-2" />
          Request role change
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request a new role</DialogTitle>
          <DialogDescription>
            Tell the administrators which role you need and why. They will
            review your request and notify you of their decision.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="requestedRole"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Requested role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pick a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {options
                        .filter((r) => r !== currentRole)
                        .map((r) => (
                          <SelectItem key={r} value={r}>
                            {ROLE_LABELS[r]}
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
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder="Explain why you need this role..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>10–500 characters.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Sending..." : "Send request"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
