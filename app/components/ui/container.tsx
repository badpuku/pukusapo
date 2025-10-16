import { cn } from "~/lib/utils";

function Container({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("w-full border-1 border-zinc-200 bg-white p-4", className)} {...props} />;
}

export { Container };