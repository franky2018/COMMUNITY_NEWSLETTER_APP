"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";
import { ImageUploadField } from "@/components/cms/image-upload-field";
import { changePassword, updateProfileName } from "@/lib/api/stubs";
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Input,
  Label,
  useToast,
} from "@/components/ui";
import type { User } from "@/types/api";

const NAME_MIN = 2;
const NAME_MAX = 255;
const PASSWORD_MIN = 8;

type PasswordFieldErrors = { current?: string; next?: string; confirm?: string };

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState(user?.name ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatarUrl ?? null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordFieldErrors, setPasswordFieldErrors] = useState<PasswordFieldErrors>({});

  // The CMS layout only renders children once the user is authenticated, so
  // this guard just covers the brief transitional render.
  if (!user) {
    return null;
  }

  const trimmedName = name.trim();
  const nameDirty = trimmedName !== (user.name ?? "");
  const avatarDirty = (avatarUrl ?? null) !== (user.avatarUrl ?? null);
  const profileDirty = nameDirty || avatarDirty;

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!profileDirty || savingProfile) {
      return;
    }

    setNameError(null);
    setProfileError(null);

    if (nameDirty) {
      if (trimmedName.length < NAME_MIN) {
        setNameError(`Name must be at least ${NAME_MIN} characters.`);
        return;
      }
      if (trimmedName.length > NAME_MAX) {
        setNameError(`Name must be ${NAME_MAX} characters or fewer.`);
        return;
      }
    }

    setSavingProfile(true);

    try {
      if (avatarDirty) {
        const updated = await apiClient.patch<User>(
          "/auth/me",
          { avatarUrl },
          { requiresAuth: true },
        );
        updateUser(updated);
        setAvatarUrl(updated.avatarUrl ?? null);
      }

      if (nameDirty) {
        await updateProfileName(trimmedName);
        updateUser({ name: trimmedName });
        setName(trimmedName);
      }

      toast({ title: "Profile updated.", variant: "success" });
    } catch {
      setProfileError("Unable to update your profile. Please try again.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (changingPassword) {
      return;
    }

    setPasswordError(null);

    const errors: PasswordFieldErrors = {};
    if (!currentPassword) {
      errors.current = "Enter your current password.";
    }
    if (newPassword.length < PASSWORD_MIN) {
      errors.next = `New password must be at least ${PASSWORD_MIN} characters.`;
    }
    if (confirmPassword !== newPassword) {
      errors.confirm = "Passwords do not match.";
    }

    setPasswordFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setChangingPassword(true);

    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordFieldErrors({});
      toast({ title: "Password changed.", variant: "success" });
    } catch {
      setPasswordError("Unable to change your password. Please try again.");
    } finally {
      setChangingPassword(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="text-sm text-muted">
        <Link href="/cms" className="transition-colors hover:text-primary hover:underline">
          Dashboard
        </Link>
        <span className="px-1">/</span>
        <span className="text-heading">Profile</span>
      </div>

      <h1 className="mt-2 font-serif text-2xl font-semibold text-heading">Profile</h1>
      <p className="mt-1 text-sm text-muted">Manage your account details and password.</p>

      <div className="mt-8 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Profile details</CardTitle>
          </CardHeader>
          <CardBody>
            <form className="space-y-6" onSubmit={handleProfileSubmit} noValidate>
              {profileError ? <Alert variant="error">{profileError}</Alert> : null}

              <ImageUploadField
                uploadType="avatar"
                value={avatarUrl}
                onChange={(url) => {
                  setAvatarUrl(url);
                  setProfileError(null);
                }}
                label="Profile picture"
                helpText="JPG, PNG, or WEBP up to 5 MB."
                shape="circle"
                alt={`${user.name} avatar`}
              />

              <div className="space-y-1.5">
                <Label htmlFor="name" required>
                  Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  maxLength={NAME_MAX}
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    setNameError(null);
                    setProfileError(null);
                  }}
                  error={Boolean(nameError)}
                  aria-invalid={Boolean(nameError)}
                  aria-describedby={nameError ? "name-error" : undefined}
                />
                {nameError ? (
                  <p id="name-error" role="alert" className="text-xs text-danger">
                    {nameError}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={user.email} disabled aria-describedby="email-hint" />
                <p id="email-hint" className="text-xs text-muted">
                  Your email is used to sign in and can’t be changed here.
                </p>
              </div>

              <div className="flex items-center gap-3 border-t border-border pt-5">
                <Button type="submit" disabled={!profileDirty || savingProfile}>
                  {savingProfile ? "Saving…" : "Save changes"}
                </Button>
                {profileDirty ? <span className="text-xs text-muted">Unsaved changes</span> : null}
              </div>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change password</CardTitle>
          </CardHeader>
          <CardBody>
            <form className="space-y-6" onSubmit={handlePasswordSubmit} noValidate>
              {passwordError ? <Alert variant="error">{passwordError}</Alert> : null}

              <div className="space-y-1.5">
                <Label htmlFor="current-password" required>
                  Current password
                </Label>
                <Input
                  id="current-password"
                  name="current-password"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(event) => {
                    setCurrentPassword(event.target.value);
                    setPasswordFieldErrors((prev) => ({ ...prev, current: undefined }));
                    setPasswordError(null);
                  }}
                  error={Boolean(passwordFieldErrors.current)}
                  aria-invalid={Boolean(passwordFieldErrors.current)}
                  aria-describedby={passwordFieldErrors.current ? "current-password-error" : undefined}
                />
                {passwordFieldErrors.current ? (
                  <p id="current-password-error" role="alert" className="text-xs text-danger">
                    {passwordFieldErrors.current}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="new-password" required>
                  New password
                </Label>
                <Input
                  id="new-password"
                  name="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(event) => {
                    setNewPassword(event.target.value);
                    setPasswordFieldErrors((prev) => ({ ...prev, next: undefined }));
                    setPasswordError(null);
                  }}
                  error={Boolean(passwordFieldErrors.next)}
                  aria-invalid={Boolean(passwordFieldErrors.next)}
                  aria-describedby={passwordFieldErrors.next ? "new-password-error" : "new-password-hint"}
                />
                {passwordFieldErrors.next ? (
                  <p id="new-password-error" role="alert" className="text-xs text-danger">
                    {passwordFieldErrors.next}
                  </p>
                ) : (
                  <p id="new-password-hint" className="text-xs text-muted">
                    Use at least {PASSWORD_MIN} characters.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm-password" required>
                  Confirm new password
                </Label>
                <Input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);
                    setPasswordFieldErrors((prev) => ({ ...prev, confirm: undefined }));
                    setPasswordError(null);
                  }}
                  error={Boolean(passwordFieldErrors.confirm)}
                  aria-invalid={Boolean(passwordFieldErrors.confirm)}
                  aria-describedby={passwordFieldErrors.confirm ? "confirm-password-error" : undefined}
                />
                {passwordFieldErrors.confirm ? (
                  <p id="confirm-password-error" role="alert" className="text-xs text-danger">
                    {passwordFieldErrors.confirm}
                  </p>
                ) : null}
              </div>

              <div className="border-t border-border pt-5">
                <Button type="submit" disabled={changingPassword}>
                  {changingPassword ? "Updating…" : "Update password"}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
