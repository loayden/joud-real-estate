import type { LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const colorClasses = {
  blue: "bg-primary-50 text-primary",
  green: "bg-emerald-50 text-emerald-700",
  yellow: "bg-amber-50 text-amber-700",
  gray: "bg-muted text-muted-foreground",
} as const;

export function StatsCard({
  title,
  value,
  icon: Icon,
  color = "blue",
  description,
}: {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: keyof typeof colorClasses;
  description?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
        <CardTitle className="text-sm font-semibold text-muted-foreground">
          {title}
        </CardTitle>
        <span
          className={cn(
            "flex size-10 items-center justify-center rounded-md",
            colorClasses[color],
          )}
        >
          <Icon className="size-5" />
        </span>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        {description ? (
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
