/**
 * beUI library — OpenUI integration (generative UI).
 *
 * defineComponent maps one OpenUI Lang node to a beUI component. The Zod
 * props schema validates the model's output as it streams, the description
 * is injected into the system prompt so the model learns each component's
 * intent, and useTriggerAction keeps rendered controls interactive.
 */
import { createLibrary, defineComponent, useTriggerAction } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { Button } from "@/components/motion/button";
import { AnimatedBadge } from "@/components/motion/animated-badge";
import { AnimatedNumber } from "@/components/motion/animated-number";

// beUI Button — the model picks a variant and an optional press signal.
// `useTriggerAction` keeps it live: pressing it sends `action` back to the
// model, so generated buttons continue the conversation instead of inert.
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
  component: ({ props }) => {
    const triggerAction = useTriggerAction();
    return (
      <Button
        variant={props.variant}
        ripple={props.ripple}
        onClick={() => triggerAction(props.action)}
      >
        {props.label}
      </Button>
    );
  },
});

// beUI status pill with a pulse and semantic status color.
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
  component: ({ props }) => (
    <AnimatedBadge status={props.status} pulse={props.pulse}>
      {props.label}
    </AnimatedBadge>
  ),
});

// beUI spring count-up for a single metric.
const BeStat = defineComponent({
  name: "Stat",
  description: "A single numeric metric that springs up from zero when shown.",
  props: z.object({ label: z.string(), value: z.number() }),
  component: ({ props }) => (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">{props.label}</p>
      <AnimatedNumber value={props.value} className="text-2xl font-semibold" />
    </div>
  ),
});

// The root node stacks the components above. Children described as a union of
// each component's `.ref`: the runtime validates what may nest here, and the
// model sees exactly which nodes are allowed inside.
const StackChild = z.union([BeButton.ref, BeBadge.ref, BeStat.ref]);

const Stack = defineComponent({
  name: "Stack",
  description: "Vertical container. Children stack top to bottom with spacing.",
  props: z.object({ children: z.array(StackChild) }),
  component: ({ props, renderNode }) => (
    <div className="flex flex-col gap-3">{renderNode(props.children)}</div>
  ),
});

/**
 * Assemble the library. `createLibrary` names the root node and organises the
 * prompt into componentGroups with notes that steer how the model reaches for
 * each one.
 */
export const beuiLibrary = createLibrary({
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
