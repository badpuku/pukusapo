import { ActionFunction, LoaderFunction } from "@remix-run/node";
import { logoutUser } from "~/utils/auth.server";

export const action: ActionFunction = async ({ request }) => {
  return await logoutUser(request);
};

export const loader: LoaderFunction = async ({ request }) => {
  return await logoutUser(request);
};
