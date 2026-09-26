"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import {
  createLibrary,
  defineComponent,
  generateSystemPrompt,
} from "@openuidev/lang-core";
import { z } from "zod/v4";
import { chatCompletion } from "./openllm";

/**
 * OpenUI generative action — beUI component library through OpenLLM.
 *
 * The model does not answer in markdown: `generateSystemPrompt` teaches it
 * the OpenUI Lang grammar plus the signature and description of every
 * registered beUI component, so it can only emit nodes the library defines.
 * The reply (a whole OpenUI Lang program) is rendered client-side by
 * <Renderer library={beuiLibrary}> on /lab.
 *
 * The library spec is declared here with componentless defineComponent
 * shells (zod schemas are plain data), mirroring src/lib/beui-library.tsx —
 * so the server bundle never imports client components. Keep the two in
 * sync: name, description, props.
 */
const BeButton = defineComponent({
  name: "Button",
  description:
    "Spring-pressed action button. `action` is the message sent to the model when pressed.",
  props: z.object({
    label: z.string(),
    action: z.string(),
    variant: z.enum(["primary", "secondary", "ghost", "outline"]).default("primary"),
    ripple: z.boolean().default(false),
  }),
  component: () => null,
});

const BeBadge = defineComponent({
  name: "Badge",
  description:
    "Status pill. Pick a status colour; set pulse for live or in-progress states.",
  props: z.object({
    label: z.string(),
    status: z
      .enum(["neutral", "info", "success", "warning", "danger", "loading"])
      .default("neutral"),
    pulse: z.boolean().default(false),
  }),
  component: () => null,
});

const BeStat = defineComponent({
  name: "Stat",
  description: "A single numeric metric that springs up from zero when shown.",
  props: z.object({ label: z.string(), value: z.number() }),
  component: () => null,
});

const StackChild = z.union([BeButton.ref, BeBadge.ref, BeStat.ref]);

const Stack = defineComponent({
  name: "Stack",
  description: "Vertical container. Children stack top to bottom with spacing.",
  props: z.object({ children: z.array(StackChild) }),
  component: () => null,
});

const beuiLibrary = createLibrary({
  root: "Stack",
  components: [Stack, BeButton, BeBadge, BeStat],
  componentGroups: [
    {
      name: "Layout",
      components: ["Stack"],
      notes: ["Every response is a single Stack at the root."],
    },
    {
      name: "beUI motion",
      components: ["Button", "Badge", "Stat"],
      notes: [
        "Use Badge with pulse for live or streaming status.",
        "One Button per response, as the primary action.",
      ],
    },
  ],
});

// generateSystemPrompt expects the serialized LibrarySpec (root/components
// with signatures), not the runtime library object.
const beuiLibrarySpec = beuiLibrary.toSpec();

/** One turn of the generative conversation: messages in, OpenUI Lang out. */
export const generate = action({
  args: {
    messages: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
      }),
    ),
    model: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const system = generateSystemPrompt({ library: beuiLibrarySpec });

    const result = await chatCompletion({
      messages: [
        { role: "system" as const, content: system },
        ...args.messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ],
      model: args.model,
      temperature: 0.3,
      maxOutputTokens: 1200,
    });

    if (!result.ok) {
      return { ok: false as const, reason: result.reason, detail: result.detail };
    }

    return { ok: true as const, response: result.text };
  },
});
