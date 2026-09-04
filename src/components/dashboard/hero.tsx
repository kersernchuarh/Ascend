"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { MOCK_USER } from "@/data/mock";

function getGreeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function Hero() {
  const [greeting, setGreeting] = React.useState("Good day");
  const prefersReducedMotion = useReducedMotion();

  React.useEffect(() => {
    // One-time sync with the visitor's local clock — unknowable during SSR,
    // an intentional exception to the lint rule below.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGreeting(getGreeting(new Date().getHours()));
  }, []);

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <h1 className="text-h1 text-foreground">
        {greeting}, {MOCK_USER.name} 👋
      </h1>
      <p className="mt-1.5 text-body text-muted-foreground">
        You&apos;re making great progress. Keep ascending.
      </p>
    </motion.div>
  );
}

export { Hero };
