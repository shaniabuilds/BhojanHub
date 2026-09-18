import React, { forwardRef, type HTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export interface FeatureCardProps extends HTMLAttributes<HTMLDivElement> {
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
}

export const FeatureCard = forwardRef<HTMLDivElement, FeatureCardProps>(
  ({ icon: Icon, title, description, badge, className = "", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`group relative rounded-2xl border border-secondary-200/80 bg-white p-7 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary-300 hover:shadow-md ${className}`}
        {...props}
      >
        <div className="flex items-center justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600 border border-primary-200/70 transition-colors duration-200 group-hover:bg-primary-600 group-hover:text-white group-hover:border-primary-600">
            <Icon size={24} />
          </div>
          {badge && (
            <Badge variant="primary" size="sm">
              {badge}
            </Badge>
          )}
        </div>

        <h3 className="mt-5 font-display text-xl font-bold tracking-tight text-secondary-950 transition-colors group-hover:text-primary-700">
          {title}
        </h3>

        <p className="mt-2.5 font-sans text-sm leading-relaxed text-secondary-600">
          {description}
        </p>
      </div>
    );
  }
);

FeatureCard.displayName = "FeatureCard";

