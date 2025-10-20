import { cn } from "~/lib/utils";

function Container({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("w-full bg-white p-6", className)} {...props} />;
}

export { Container };
