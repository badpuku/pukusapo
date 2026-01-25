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
  htmlFor: string;
  required?: boolean;
  noRequiredLabel?: boolean;
  errors?: string[];
}

function FieldControl({
  className,
  children,
  label,
  htmlFor,
  required = false,
  noRequiredLabel = false,
  errors,
  ...props
}: React.ComponentProps<"div"> & Props) {
  const requiredLabel = RequiredMap[required ? "required" : "optional"];

  return (
    <div className={cn("flex flex-col gap-2", className)} {...props}>
      {label !== "" && (
      <div className="flex items-center gap-2">
        <FieldLabel htmlFor={htmlFor}>{label}</FieldLabel>
        {!noRequiredLabel && <span className={cn("text-white text-xs font-medium px-2 py-1", requiredLabel.backgroundColor)}>{requiredLabel.label}</span>}
      </div>
      )}
      {children}
      {errors && errors.length > 0 && (
        <FieldError>
          {errors.join("\n")}
        </FieldError>
      )}
    </div>
  );
}

export { FieldControl };
