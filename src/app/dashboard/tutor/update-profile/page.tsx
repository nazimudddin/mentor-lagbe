"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import {
  updateProfile,
  uploadProfileImage,
} from "@/lib/mutation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import {
  Camera,
  Loader2,
  UserRound,
  Mail,
  Phone,
  Save,
} from "lucide-react";

import { toast } from "sonner";

export default function ProfilePage() {
  const { data: session, isPending } = authClient.useSession();

  const user = session?.user;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [image, setImage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setImage(user.image || "");
    }
  }, [user]);

  const handleImageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB.");
      return;
    }

    setSelectedFile(file);
    setImage(URL.createObjectURL(file));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setLoading(true);

      let profileImage = image;

      if (selectedFile) {
        profileImage = await uploadProfileImage(selectedFile);
      }

      await updateProfile({
        name,
        phone,
        bio,
        image: profileImage,
      });

      toast.success("Profile updated successfully!");

      setSelectedFile(null);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update profile."
      );
    } finally {
      setLoading(false);
    }
  };

  if (isPending) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Profile Settings
        </h1>

        <p className="mt-2 text-muted-foreground">
          Manage your personal information and profile.
        </p>
      </div>

      {/* Profile Card */}
      <div className="rounded-2xl border bg-card p-6 shadow-sm md:p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Profile Image */}
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <div className="relative">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border bg-muted">
                {image ? (
                  <img
                    src={image}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserRound className="h-12 w-12 text-muted-foreground" />
                )}
              </div>

              <label
                htmlFor="profile-image"
                className="absolute bottom-0 right-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border bg-background shadow-md transition hover:bg-muted"
              >
                <Camera className="h-4 w-4" />

                <input
                  id="profile-image"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
            </div>

            <div className="text-center sm:text-left">
              <h2 className="font-semibold">
                Profile Picture
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                JPG, PNG or WEBP. Maximum 5MB.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Full Name
              </label>

              <div className="relative">
                <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Email Address
              </label>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  value={email}
                  disabled
                  className="cursor-not-allowed bg-muted pl-10"
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Email address cannot be changed.
              </p>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Phone Number
              </label>

              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your phone number"
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Bio
            </label>

            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us a little about yourself..."
              rows={5}
              className="resize-none"
            />

            <p className="text-xs text-muted-foreground">
              Write something about yourself.
            </p>
          </div>

          {/* Submit */}
          <div className="flex justify-end border-t pt-6">
            <Button
              type="submit"
              disabled={loading}
              className="gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}