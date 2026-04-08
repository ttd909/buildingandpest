import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

export function Card({ children, hoverable, padding = "md", className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-slate-100 shadow-sm",
        hoverable && "transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 cursor-pointer",
        {
          none: "",
          sm: "p-3",
          md: "p-4",
          lg: "p-6",
        }[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center justify-between mb-3", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("font-semibold text-slate-900 text-base leading-tight", className)} {...props}>
      {children}
    </h3>
  );
}
