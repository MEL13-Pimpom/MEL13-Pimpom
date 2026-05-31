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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { verifyOtpSchema, type VerifyOtpInput } from "@/lib/validations/auth";
import {
  verifySignupOtpAction,
  resendSignupOtpAction,
} from "@/lib/actions/auth";

export function VerifySignupForm({ email }: { email: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [resending, startResend] = useTransition();

  const form = useForm<VerifyOtpInput>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: { email, token: "" },
  });

  const onSubmit = (values: VerifyOtpInput) => {
    startTransition(async () => {
      const result = await verifySignupOtpAction(values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Email verified. Redirecting...");
      router.replace("/");
      router.refresh();
    });
  };

  const onResend = () => {
    startResend(async () => {
      const result = await resendSignupOtpAction(email);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("A new code is on its way.");
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="token"
          render={({ field }) => (
            <FormItem className="flex flex-col items-center">
              <FormLabel>Verification code</FormLabel>
              <FormControl>
                <InputOTP maxLength={6} {...field}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full h-11 bg-primary hover:bg-primary/90"
          disabled={pending}
        >
          {pending ? "Verifying..." : "Verify email"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Didn&apos;t get a code?{" "}
          <button
            type="button"
            onClick={onResend}
            disabled={resending}
            className="text-primary hover:underline disabled:opacity-50"
          >
            {resending ? "Sending..." : "Resend"}
          </button>
        </p>
      </form>
    </Form>
  );
}
