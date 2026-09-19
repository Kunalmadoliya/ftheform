"use client"

import { useHealth } from "~/hooks/api/health";

export default  function Home() {
  const { status } =  useHealth();
  return (
    <main className="min-h-screen min-w-screen flex justify-center items-center">
      <div>
        <h1 className="text-3xl">FTHEFORMS</h1>
        <h2>Server Status: {status}</h2>
      </div>
    </main>
  );
}
