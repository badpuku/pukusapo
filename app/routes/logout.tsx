import { ActionFunction, ActionFunctionArgs } from "@remix-run/node";

// export const action: ActionFunction = async ({
//   request,
// }: ActionFunctionArgs) => {
//   // TODO:: ログアウト機能を実装
// };

export default function Logout() {
  return <p>This is logout page</p>;
}
