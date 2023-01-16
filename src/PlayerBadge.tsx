import { Badge } from "@nextui-org/react";
import React from "react";

export function PlayerBadge({
  color,
  children,
}: {
  children: React.ReactNode;
  color: "primary" | "secondary" | "default";
}) {
  return (
    <Badge isSquared variant="bordered" color={color} size="lg">
      {children}
    </Badge>
  );
}
