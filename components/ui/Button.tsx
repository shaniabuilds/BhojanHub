import React, { forwardRef, type ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "success";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary-600 text-white shadow-sm hover:bg-primary-700 active:bg-primary-800 focus-visible:ring-primary-500",
  secondary:
    "bg-secondary-900 text-white shadow-sm hover:bg-secondary-800 active:bg-secondary-950 focus-visible:ring-secondary-700",
  outline:
    "border border-secondary-200 bg-white text-secondary-900 shadow-sm hover:bg-cream-100 hover:border-secondary-300 focus-visible:ring-secondary-500",
  ghost:
    "bg-transparent text-secondary-700 hover:bg-cream-200 hover:text-secondary-900 focus-visible:ring-secondary-500",
  success:
    "bg-accent-600 text-white shadow-sm hover:bg-accent-700 active:bg-accent-800 focus-visible:ring-accent-500"
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2.5"
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      size = "md",
      variant = "primary",
      type = "button",
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-50 disabled:pointer-events-none disabled:opacity-50 select-none ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
