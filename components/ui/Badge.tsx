import React, { type HTMLAttributes, forwardRef } from "react";

export type BadgeVariant = "default" | "primary" | "secondary" | "success" | "outline";
export type BadgeSize = "sm" | "md";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  withDot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-primary-50 text-primary-800 border-primary-200/80",
  primary: "bg-primary-50 text-primary-800 border-primary-200/80",
  secondary: "bg-secondary-100 text-secondary-800 border-secondary-200/80",
  success: "bg-accent-50 text-accent-800 border-accent-200/80",
  outline: "bg-white/90 text-secondary-800 border-secondary-300"
};

const dotColorClasses: Record<BadgeVariant, string> = {
  default: "bg-primary-500",
  primary: "bg-primary-500",
  secondary: "bg-secondary-600",
  success: "bg-accent-500",
  outline: "bg-secondary-500"
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-[11px] leading-4 gap-1.5",
  md: "px-2.5 py-1 text-xs leading-4 gap-1.5"
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      children,
      className = "",
      variant = "default",
      size = "md",
      withDot = false,
      ...props
    },
    ref
  ) => {
    return (
      <span
        ref={ref}
        className={`inline-flex items-center rounded-full border font-medium tracking-wide ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {withDot && (
          <span
            className={`h-1.5 w-1.5 rounded-full ${dotColorClasses[variant]}`}
            aria-hidden="true"
          />
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";
