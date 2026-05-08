import Link from "next/link";
import { redirect } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SearchParams = Promise<{
  token_hash?: string;
  type?: string;
  next?: string;
  error?: string;
}>;

const VALID_TYPES: ReadonlyArray<EmailOtpType> = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
];

async function confirmEmail(formData: FormData) {
  "use server";
  const tokenHash = formData.get("token_hash");
  const type = formData.get("type");
  const next = formData.get("next");

  if (typeof tokenHash !== "string" || typeof type !== "string") {
    redirect("/auth/confirm?error=missing_token");
  }

  if (!VALID_TYPES.includes(type as EmailOtpType)) {
    redirect("/auth/confirm?error=invalid_type");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({
    type: type as EmailOtpType,
    token_hash: tokenHash,
  });

  if (error) {
    redirect(`/auth/confirm?error=${encodeURIComponent(error.message)}`);
  }

  const target = typeof next === "string" && next.startsWith("/") ? next : "/";
  redirect(target);
}

export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const tokenHash = params.token_hash;
  const type = params.type;
  const next = params.next ?? "/";
  const error = params.error;

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Confirmation failed</CardTitle>
          <CardDescription>
            {decodeURIComponent(error)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            The link may have expired or been used already. Try signing up again
            or request a new confirmation email.
          </p>
          <div className="flex gap-2">
            <Button asChild variant="outline" className="flex-1">
              <Link href="/login">Back to sign in</Link>
            </Button>
            <Button asChild className="flex-1 bg-primary hover:bg-primary/90">
              <Link href="/signup">Sign up again</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!tokenHash || !type) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invalid link</CardTitle>
          <CardDescription>
            This confirmation link is missing required information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full bg-primary hover:bg-primary/90">
            <Link href="/login">Back to sign in</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Confirm your email</CardTitle>
        <CardDescription>
          Click the button below to verify your email address and finish
          setting up your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={confirmEmail} className="space-y-3">
          <input type="hidden" name="token_hash" value={tokenHash} />
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="next" value={next} />
          <Button
            type="submit"
            className="w-full h-11 bg-primary hover:bg-primary/90"
          >
            Confirm email
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
