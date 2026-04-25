"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  updatePasswordFromFormAction,
  type SettingsActionState,
} from "@/app/actions/settings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/Label";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";

const initialState: SettingsActionState = { ok: false, message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button className="rounded-full px-5" type="submit" disabled={pending}>
      {pending ? "Updating..." : "Update password"}
    </Button>
  );
}

export function SettingsSecurityForm() {
  const [state, formAction] = useFormState(updatePasswordFromFormAction, initialState);

  return (
    <div className="space-y-6">
      {state.message ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            state.ok
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-destructive/40 bg-destructive/10 text-destructive"
          }`}
        >
          {state.message}
        </div>
      ) : null}

      <Card className="border-border/80 bg-card/80">
        <CardHeader>
          <CardTitle>Password and sign-in</CardTitle>
          <CardDescription>
            Use a strong password with at least 8 characters. You will remain signed in after update.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <PasswordInput id="password" name="password" minLength={8} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <PasswordInput id="confirmPassword" name="confirmPassword" minLength={8} required />
            </div>
            <SubmitButton />
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/80 bg-card/80">
        <CardHeader>
          <CardTitle>Security notes</CardTitle>
          <CardDescription>
            For best account protection, avoid reused passwords and enable provider-level MFA when available.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
