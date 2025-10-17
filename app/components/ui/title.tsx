import { cn } from "~/lib/utils"

const TitleMap = {
  h1: "scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance",
  h2: "scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0",
  h3: "scroll-m-20 text-2xl font-semibold tracking-tight",
  h4: "scroll-m-20 text-xl font-semibold tracking-tight",
} as const;

type Props = {
  as: keyof typeof TitleMap;
  className?: string;
  children: React.ReactNode;
}

function Title({ as = "h1", className, children }: Props) {
  const Comp = as;
  return <Comp className={cn(TitleMap[as], className)}>{children}</Comp>;
}

export { Title };