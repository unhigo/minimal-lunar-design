import { useEffect, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { TOOLS } from "@/data/tools";
import { useAuth } from "@/hooks/use-auth";

/**
 * One-shot, idempotent seed of the directory catalog.
 *
 * The DB-backed directory starts empty; this pushes the curated static
 * catalog into `tools` exactly once (the mutation itself no-ops if any tool
 * already exists). Runs while an auth session is settling or signed-in, so
 * the seed fires on the first visit without admin intervention.
 */
export function useDirectorySeed() {
  const seed = useMutation(api.tools.seedFromCatalog);
  const { isLoading } = useAuth();
  const [state, setState] = useState<"idle" | "seeding" | "done" | "error">(
    "idle",
  );
  const attempted = useRef(false);

  useEffect(() => {
    // Wait for the auth session to settle (anonymous sign-ins count) and run
    // only once per mount — the mutation is idempotent server-side anyway.
    if (isLoading || attempted.current) return;
    attempted.current = true;
    setState("seeding");
    seed({
      tools: TOOLS.map((t) => ({
        name: t.name,
        shortDescription: t.shortDescription,
        description: t.description,
        website: t.website,
        category: t.category,
        tags: t.tags,
        pricing: t.pricing,
        pricingDetails: t.pricingDetails,
        platforms: t.platforms,
        features: t.features,
        verified: t.verified,
        featured: t.featured,
        trending: t.trending,
        createdAt: t.createdAt,
      })),
    })
      .then(() => setState("done"))
      .catch(() => setState("error"));
  }, [isLoading, seed]);

  return state;
}
