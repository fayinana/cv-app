"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useFormState, useFormStatus } from "react-dom";
import type { Profile } from "@/lib/types";
import {
  updateProfileFromFormAction,
  type ProfileActionState,
} from "@/app/actions/profile";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/Label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2, User } from "lucide-react";
import { toast } from "sonner";

const initialState: ProfileActionState = { ok: false, message: "" };
const AVATAR_UPDATED_EVENT = "cvsmart:avatar-updated";

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="rounded-full px-5 py-2.5" type="submit" disabled={pending}>
      {pending ? "Saving..." : "Save profile"}
    </Button>
  );
}

export function ProfileEditorForm({ profile }: { profile: Profile | null }) {
  const [state, formAction] = useFormState(updateProfileFromFormAction, initialState);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url ?? null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!state.message) return;
    if (state.ok) {
      toast.success(state.message);
    } else {
      toast.error(state.message);
    }
  }, [state]);

  const onSelectAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;

    const maxSizeMb = 4;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    if (file.size > maxSizeMb * 1024 * 1024) {
      toast.error(`Image is too large. Max size is ${maxSizeMb}MB.`);
      return;
    }

    setUploadingAvatar(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        toast.error("You need to be signed in to update your avatar.");
        return;
      }

      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const objectPath = `${user.id}/${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(objectPath, file, { upsert: true });

      if (uploadError) {
        toast.error(uploadError.message);
        return;
      }

      const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(objectPath);
      const nextAvatarUrl = publicUrlData.publicUrl;
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          avatar_url: nextAvatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (updateError) {
        toast.error(updateError.message);
        return;
      }

      setAvatarUrl(nextAvatarUrl);
      window.dispatchEvent(
        new CustomEvent<{ url: string }>(AVATAR_UPDATED_EVENT, {
          detail: { url: nextAvatarUrl },
        })
      );
      toast.success("Profile photo updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload avatar.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <form action={formAction} className="space-y-6">
      <Card className="border-border/80 bg-card/80">
        <CardHeader>
          <CardTitle>Profile photo</CardTitle>
          <CardDescription>Upload a clear photo for a professional first impression.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 ring-2 ring-border">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt="Profile avatar" className="object-cover" /> : null}
              <AvatarFallback className="bg-muted text-muted-foreground">
                <User className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">JPG, PNG, or WEBP</p>
              <p className="text-xs text-muted-foreground">Up to 4MB. Square images look best.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onSelectAvatar}
            />
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
            >
              {uploadingAvatar ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Camera className="mr-2 h-4 w-4" />
                  Change photo
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/80 bg-card/80">
        <CardHeader>
          <CardTitle>Identity</CardTitle>
          <CardDescription>How your name and headline appear across the app.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full name</Label>
            <Input id="full_name" name="full_name" required defaultValue={profile?.full_name ?? ""} placeholder="Your full name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Professional title</Label>
            <Input id="title" name="title" defaultValue={profile?.title ?? ""} placeholder="e.g. Frontend Engineer" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" name="location" defaultValue={profile?.location ?? ""} placeholder="City, Country" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="bio">Short bio</Label>
            <Textarea id="bio" name="bio" rows={4} defaultValue={profile?.bio ?? ""} placeholder="Brief summary about your background and goals." />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/80 bg-card/80">
        <CardHeader>
          <CardTitle>Contact and links</CardTitle>
          <CardDescription>Used for recruiter-ready exports and quick profile sharing.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" defaultValue={profile?.phone ?? ""} placeholder="+251..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input id="website" name="website" defaultValue={profile?.website ?? ""} placeholder="https://your-site.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="linkedin">LinkedIn</Label>
            <Input id="linkedin" name="linkedin" defaultValue={profile?.linkedin ?? ""} placeholder="linkedin.com/in/username" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="github">GitHub</Label>
            <Input id="github" name="github" defaultValue={profile?.github ?? ""} placeholder="github.com/username" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="twitter">X / Twitter</Label>
            <Input id="twitter" name="twitter" defaultValue={profile?.twitter ?? ""} placeholder="x.com/username" />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Changes are saved securely to your account profile.</p>
        <SaveButton />
      </div>
    </form>
  );
}
