import {
  json,
  redirect,
  type LoaderFunction,
  type MetaFunction,
} from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import LogoutButton from "~/components/ui/button/LogoutButton";
import { getUserSession } from "~/services/auth.server";
import { ROUTES } from "~/constants/routes";

export const meta: MetaFunction = () => {
  return [
    { title: "PukuSapo App" },
    { name: "description", content: "Welcome to PukuSapo!" },
  ];
};
interface UserInfo {
  userId: string;
  name: string;
  pictureUrl: string;
}

interface loaderData {
  userInfo: UserInfo;
}

export const loader: LoaderFunction = async ({ request }) => {
  const { userInfo } = await getUserSession(request);

  if (!userInfo || !userInfo.userId) {
    return redirect(ROUTES.LOGIN);
  }

  return json<loaderData>({ userInfo });
};

export default function Index() {
  const { userInfo } = useLoaderData<loaderData>();

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-16">
        <header className="flex flex-col items-center gap-9">
          <LogoutButton />
          <h1 className="leading text-2xl font-bold text-gray-800 dark:text-gray-100">
            Welcome {userInfo.name}
          </h1>
          <p>Your id: {userInfo.userId}</p>
          <img
            src={
              userInfo.pictureUrl ||
              "https://placehold.jp/999999/ffffff/150x150.png?text=dummy"
            }
            alt="Remix"
            width={100}
            height={100}
          />
          <div className="h-[144px] w-[434px]">
            <img
              src="/logo-light.png"
              alt="Remix"
              className="block w-full dark:hidden"
            />
            <img
              src="/logo-dark.png"
              alt="Remix"
              className="hidden w-full dark:block"
            />
          </div>
        </header>
      </div>
    </div>
  );
}
