"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Camera,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Save,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { getMyProfile, type ProfileData } from "@/lib/action";
import { updateProfile, uploadProfileImage } from "@/lib/mutation";

export default function StudentProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [bio, setBio] = useState("");
  const [image, setImage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [removeImageOpen, setRemoveImageOpen] = useState(false);

  const applyProfile = useCallback((data: ProfileData) => {
    setProfile(data);
    setName(data.name ?? "");
    setPhone(data.phone ?? "");
    setAddress(data.address ?? "");
    setBio(data.bio ?? "");
    setImage(data.image ?? "");
  }, []);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getMyProfile();
      applyProfile(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load your profile."
      );
    } finally {
      setIsLoading(false);
    }
  }, [applyProfile]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await getMyProfile();
        if (!cancelled) {
          applyProfile(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load your profile."
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [applyProfile]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Please select a JPG, PNG, or WEBP image.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB.");
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
    setImage(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setImage("");
    setRemoveImageOpen(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      toast.error("Please enter your name.");
      return;
    }

    if (trimmedName.length > 80) {
      toast.error("Name must be 80 characters or fewer.");
      return;
    }

    if (phone.trim().length > 30) {
      toast.error("Phone must be 30 characters or fewer.");
      return;
    }

    if (address.trim().length > 200) {
      toast.error("Address must be 200 characters or fewer.");
      return;
    }

    if (bio.trim().length > 1000) {
      toast.error("Bio must be 1000 characters or fewer.");
      return;
    }

    setIsSaving(true);

    try {
      let profileImage = image.startsWith("blob:") ? "" : image;

      if (selectedFile) {
        profileImage = await uploadProfileImage(selectedFile);
      }

      const result = await updateProfile({
        name: trimmedName,
        phone: phone.trim(),
        address: address.trim(),
        bio: bio.trim(),
        image: profileImage,
      });

      applyProfile(result.user);
      setSelectedFile(null);
      setImage(result.user.image ?? "");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      toast.success("Profile updated successfully.");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update your profile."
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
        <Card>
          <CardContent className="space-y-6 p-6">
            <div className="flex items-center gap-4">
              <Skeleton className="size-24 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-8 w-full rounded-lg" />
                </div>
              ))}
            </div>
            <Skeleton className="h-24 w-full rounded-lg" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-10 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="size-6" />
            </span>
            <h1 className="mt-3 text-base font-semibold">
              Could not load your profile
            </h1>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              {error ?? "Profile not found."}
            </p>
            <Button
              variant="outline"
              onClick={() => void loadProfile()}
              className="mt-4 gap-1.5"
            >
              <RefreshCw className="size-4" />
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const initials = (name || profile.email || "S")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const isPro = profile.plan === "pro";

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">
          Profile Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your personal information, contact details, and profile photo.
        </p>
      </div>

      <Card>
        <CardContent className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
              <div className="relative">
                <div className="flex size-24 items-center justify-center overflow-hidden rounded-full bg-muted ring-1 ring-foreground/10">
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={image}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-semibold text-muted-foreground">
                      {initials}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Change profile image"
                  className="absolute bottom-0 right-0 flex size-9 items-center justify-center rounded-full border bg-background shadow-md transition hover:bg-muted"
                >
                  <Camera className="size-4" />
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </div>

              <div className="text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <h2 className="font-semibold text-foreground">
                    Profile Picture
                  </h2>
                  <Badge variant="secondary" className="capitalize">
                    {profile.role}
                  </Badge>
                  <Badge variant={isPro ? "default" : "outline"}>
                    {isPro ? "Pro" : "Free plan"}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  JPG, PNG or WEBP. Maximum 5MB.
                </p>
                <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Upload image
                  </Button>
                  {image ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setRemoveImageOpen(true)}
                    >
                      Remove
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="profile-name">Full Name</Label>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="profile-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Enter your full name"
                    className="pl-9"
                    maxLength={80}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-email">Email Address</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="profile-email"
                    value={profile.email}
                    disabled
                    className="cursor-not-allowed bg-muted pl-9"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Email address cannot be changed.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="profile-phone"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="e.g. +880 1XXX-XXXXXX"
                    className="pl-9"
                    maxLength={30}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-address">Address</Label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="profile-address"
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    placeholder="Area, city"
                    className="pl-9"
                    maxLength={200}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-bio">Bio</Label>
              <Textarea
                id="profile-bio"
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                placeholder="Tell tutors a little about yourself, your goals, and your preferred schedule…"
                rows={5}
                maxLength={1000}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {bio.length}/1000 characters
              </p>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                Your email, role, and plan are managed by MentorLagbe.
              </p>
              <Button type="submit" disabled={isSaving} className="gap-1.5">
                {isSaving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={removeImageOpen}
        title="Remove profile image?"
        description="Your profile will show your initials instead of a photo. Save changes to apply this."
        confirmLabel="Remove image"
        onConfirm={handleRemoveImage}
        onCancel={() => setRemoveImageOpen(false)}
      />
    </div>
  );
}
