"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";
import { UserForm, type UserFormValues } from "@/components/cms/users/user-form";
import { UserNoAccess } from "@/components/cms/users/user-access";
import type { User } from "@/types/api";

export default function NewUserPage() {
  const router = useRouter();
  const { role } = useAuth();

  const canManage = role === "ADMIN";

  async function handleSave(values: UserFormValues) {
    await apiClient.post<User>(
      "/users",
      {
        name: values.name,
        email: values.email,
        password: values.password,
        role: values.role,
      },
      { requiresAuth: true },
    );

    router.replace("/cms/users?created=1");
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="text-sm text-zinc-500">
        <Link href="/cms/users" className="hover:underline">
          Users
        </Link>
        <span className="px-1">/</span>
        <span>New</span>
      </div>

      <h1 className="mt-2 text-2xl font-semibold">New User</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Create an account for a team member. New accounts are active immediately.
      </p>

      {role && !canManage ? (
        <UserNoAccess
          title="You don't have permission to create users."
          description="User management is restricted to administrators."
        />
      ) : (
        <UserForm submitLabel="Create User" submittingLabel="Creating…" onSave={handleSave} />
      )}
    </div>
  );
}
