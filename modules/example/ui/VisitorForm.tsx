"use client";

import { useSubmitName } from "../hooks/useSubmitName";
import { Button } from "@/components/ui/button";

/**
 * Client component for visitor name form
 * Follows architecture: UI only, uses hooks for server interaction
 */
export function VisitorForm() {
  const { mutate: submitName, isPending } = useSubmitName();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    submitName(formData);
    e.currentTarget.reset();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block text-sm font-medium">
        What's your name?
        <input
          type="text"
          name="name"
          placeholder="Enter your name"
          required
          className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring focus:ring-ring/50"
        />
      </label>
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Saving..." : "Save to cookie"}
      </Button>
    </form>
  );
}
