import { FieldError, FieldLabel } from "~/components/ui/field";
import { cn } from "~/lib/utils";

const RequiredMap = {
  required: {
    label: "必須",
    backgroundColor: "bg-red-700",  
  },
  optional: {
    label: "任意",
    backgroundColor: "bg-primary-500",
  },
} as const;

interface Props {
  label: string;
  required?: boolean;
  errors?: Array<{ message?: string } | undefined>;
}

function FieldControl({
  className,
  children,
  label,
  required = false,
  errors,
  ...props
}: React.ComponentProps<"div"> & Props) {
  const requiredLabel = RequiredMap[required ? "required" : "optional"];

  return (
    <div className={cn("flex flex-col gap-2", className)} {...props}>
      <div>
        <FieldLabel>{label}</FieldLabel>
        <span className={cn("text-white text-xs font-medium px-2 py-1", requiredLabel.backgroundColor)}>{requiredLabel.label}</span>
      </div>
      {children}
      <FieldError errors={errors} />
    </div>
  );
}

export { FieldControl };
