// app/error.tsx
"use client";

export default function Error({ error }: { error: Error }) {
  return (
    <div className="p-8 text-red-500 text-center">
      <h2 className="text-xl font-semibold">Something went wrong.</h2>
      <p>{error.message}</p>
    </div>
  );
}
