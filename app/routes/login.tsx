import { LoaderFunction, LoaderFunctionArgs } from "@remix-run/node";

// export const loader: LoaderFunction = async ({
//   request,
// }: LoaderFunctionArgs) => {
//   // TODO:: ログイン機能を実装
// };

export default function Login() {
  return <p>This is login page</p>;
}
