/**
 * beUI AnimatedNumber — spring count-up for a single metric (OpenUI).
 *
 * Springs from zero on mount (SPRING_LAYOUT physics); under reduced motion
 * the value renders instantly with no travel.
 */
import { useEffect } from "react";
import {
  useMotionValue,
  useSpring,
  useTransform,
  motion,
  useReducedMotion,
} from "framer-motion";
import { cn } from "@/lib/utils";

export function AnimatedNumber({
  value,
  className,
  format,
}: {
  value: number;
  className?: string;
  format?: (v: number) => string;
}) {
  const reduce = useReducedMotion() ?? false;
  const motionValue = useMotionValue(reduce ? value : 0);
  const spring = useSpring(motionValue, {
    stiffness: 90,
    damping: 20,
    mass: 0.6,
  });
  const text = useTransform(spring, (latest) =>
    format ? format(latest) : Math.round(latest).toLocaleString("es-ES"),
  );

  useEffect(() => {
    if (reduce) {
      motionValue.jump(value);
    } else {
      motionValue.set(value);
    }
  }, [value, reduce, motionValue]);

  return <motion.span className={cn("tabular-nums", className)}>{text}</motion.span>;
}
