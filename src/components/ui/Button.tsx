import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg" | "xl";
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      loading,
      fullWidth,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed select-none",
          {
            primary:
              "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-sm",
            secondary:
              "bg-slate-100 text-slate-800 hover:bg-slate-200 focus:ring-slate-400",
            ghost:
              "bg-transparent text-slate-600 hover:bg-slate-100 focus:ring-slate-400",
            danger:
              "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm",
            outline:
              "border-2 border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 focus:ring-slate-400",
          }[variant],
          {
            sm: "h-8 px-3 text-sm rounded-lg",
            md: "h-10 px-4 text-sm",
            lg: "h-12 px-6 text-base",
            xl: "h-14 px-8 text-base",
          }[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            {children}
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
