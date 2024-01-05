import React from "react";
import clsx from "clsx";

export function PlayerBadge({
  color,
  children,
}: {
  children: React.ReactNode;
  color: "primary" | "secondary" | "default";
}) {
  return (
    <p
      className={clsx(
        "border-2 font-semibold text-lg sm:text-medium my-2",
        `text-${color} border-${color} rounded-lg px-2 py-1`
      )}
    >
      {children}
    </p>
  );
}
