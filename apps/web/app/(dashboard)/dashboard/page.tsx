"use client";

import { useUser } from "~/hooks/api/auth";

export default function DashboardPage() {
  const { user } = useUser()

  return (
    <div>
      <h1>you are logged in as {user?.fullName}</h1>
    </div>
  );
}