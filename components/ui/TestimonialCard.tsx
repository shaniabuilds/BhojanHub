import React, { forwardRef, type HTMLAttributes } from "react";
import { Star, Quote } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export interface TestimonialCardProps extends HTMLAttributes<HTMLDivElement> {
  quote: string;
  name: string;
  restaurant: string;
  role?: string;
  metric?: string;
  rating?: number;
}

export const TestimonialCard = forwardRef<HTMLDivElement, TestimonialCardProps>(
  (
    {
      quote,
      name,
      restaurant,
      role = "Executive Chef & Owner",
      metric,
      rating = 5,
      className = "",
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={`relative flex flex-col justify-between rounded-2xl border border-secondary-200/80 bg-white p-8 shadow-sm transition-all duration-200 hover:shadow-md ${className}`}
        {...props}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-primary-500">
              {Array.from({ length: rating }).map((_, i) => (
                <Star key={i} size={16} fill="currentColor" />
              ))}
            </div>

            {metric && (
              <Badge variant="success" size="sm" withDot>
                {metric}
              </Badge>
            )}
          </div>

          <div className="relative">
            <Quote className="absolute -left-1 -top-2 text-primary-100/80" size={36} aria-hidden="true" />
            <p className="relative z-10 font-display text-lg sm:text-xl font-medium leading-relaxed text-secondary-900 italic pt-2">
              &ldquo;{quote}&rdquo;
            </p>
          </div>
        </div>

        <div className="mt-8 flex items-center gap-3.5 border-t border-secondary-100 pt-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cream-100 text-primary-700 font-display font-bold text-base border border-cream-200">
            {name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)}
          </div>
          <div>
            <h4 className="font-sans text-sm font-bold text-secondary-950">{name}</h4>
            <p className="font-sans text-xs text-secondary-500">
              {role} • <span className="text-primary-700 font-semibold">{restaurant}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }
);

TestimonialCard.displayName = "TestimonialCard";

