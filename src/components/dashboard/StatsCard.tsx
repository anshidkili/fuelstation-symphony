
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";
import React from "react";

const statCardVariants = cva(
  "transition-all duration-200 hover:shadow-elevation hover:-translate-y-1",
  {
    variants: {
      variant: {
        default: "border-border",
        success: "border-l-4 border-l-emerald-500",
        info: "border-l-4 border-l-blue-500",
        warning: "border-l-4 border-l-amber-500",
        danger: "border-l-4 border-l-red-500",
        primary: "border-l-4 border-l-primary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "success" | "info" | "warning" | "danger" | "primary";
  className?: string;
}

export function StatsCard({
  title,
  value,
  description,
  icon,
  trend,
  variant = "default",
  className,
}: StatsCardProps) {
  return (
    <Card className={cn(statCardVariants({ variant }), className)}>
      <CardHeader className="pb-2 flex justify-between">
        <div>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <CardDescription className="text-2xl font-bold mt-1 text-foreground">
            {value}
          </CardDescription>
        </div>
        {icon && (
          <div className="rounded-full p-2 bg-muted/50 text-primary">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center text-sm">
          {trend && (
            <span
              className={cn(
                "mr-1 flex items-center",
                trend.isPositive ? "text-emerald-500" : "text-red-500"
              )}
            >
              {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
            </span>
          )}
          <span className="text-muted-foreground">{description}</span>
        </div>
      </CardContent>
    </Card>
  );
}
