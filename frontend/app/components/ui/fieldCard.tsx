import * as React from "react";

import { cn } from "~/lib/utils";

function FieldCard({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "border-input dark:bg-input/30 shadow-xs relative w-full bg-white rounded-md border outline-none transition-[color,box-shadow]",
        className,
      )}
      {...props}
    />
  );
}

function FieldCardContent({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("p-4", className)} {...props}>
      {children}
    </div>
  );
}

function FieldCardFooter({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex justify-end items-center gap-4 px-4 py-2 border-t border-zinc-200", className)} {...props}>
      {children}
    </div>
  );
}

export { FieldCard, FieldCardContent, FieldCardFooter };
