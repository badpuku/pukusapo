import { Title } from "~/components/ui/title";

type Props = {
  title: string;
}

function PageTitle({ title }: Props) {
  return (
    <Title as="h1">{title}</Title>
  );
}

export { PageTitle };
