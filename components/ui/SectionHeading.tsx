import React, { forwardRef, type HTMLAttributes, type ReactNode } from "react";

export type SectionHeadingAlign = "left" | "center" | "right";
export type SectionHeadingSize = "sm" | "md" | "lg";

export interface SectionHeadingProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  align?: SectionHeadingAlign;
  size?: SectionHeadingSize;
}

const alignClasses: Record<SectionHeadingAlign, { container: string; eyebrow: string; desc: string }> = {
  left: {
    container: "text-left",
    eyebrow: "justify-start",
    desc: "mx-0"
  },
  center: {
    container: "text-center mx-auto",
    eyebrow: "justify-center",
    desc: "mx-auto"
  },
  right: {
    container: "text-right ml-auto",
    eyebrow: "justify-end",
    desc: "ml-auto"
  }
};

const titleSizeClasses: Record<SectionHeadingSize, string> = {
  sm: "text-2xl sm:text-3xl font-semibold tracking-tight",
  md: "text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight",
  lg: "text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight"
};

export const SectionHeading = forwardRef<HTMLDivElement, SectionHeadingProps>(
  (
    {
      eyebrow,
      title,
      description,
      align = "left",
      size = "md",
      className = "",
      ...props
    },
    ref
  ) => {
    const alignment = alignClasses[align];

    return (
      <div
        ref={ref}
        className={`max-w-3xl ${alignment.container} ${className}`}
        {...props}
      >
        {eyebrow && (
          <div
            className={`mb-3 inline-flex items-center text-xs sm:text-sm font-semibold uppercase tracking-[0.18em] text-primary-700 font-sans ${alignment.eyebrow}`}
          >
            {eyebrow}
          </div>
        )}
        <h2 className={`font-display text-secondary-950 ${titleSizeClasses[size]}`}>
          {title}
        </h2>
        {description && (
          <p className={`mt-4 text-base sm:text-lg leading-relaxed text-secondary-600 font-sans ${alignment.desc}`}>
            {description}
          </p>
        )}
      </div>
    );
  }
);

SectionHeading.displayName = "SectionHeading";
