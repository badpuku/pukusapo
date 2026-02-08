import {
  ERROR_CODES,
  ERROR_MESSAGES_MAP,
  ERROR_STATUS_MAP,
} from "~/constants/errors";
import { createErrorResponse } from "~/lib/apiResponse";
import { handleUpdate } from "~/routes/api/facility/accounts/:id/handleUpdate.server";
import { loader as accountsLoader } from "~/routes/api/facility/accounts/:id/loader.server";

import type { Route } from "./+types/route";

export const loader = accountsLoader;

export const action = async (args: Route.ActionArgs) => {
  const { request } = args;
  const method = request.method;

  if (method === "PUT") {
    return handleUpdate(args);
  }

  if (method === "DELETE") {
    return handleUpdate(args);
  }

  return createErrorResponse(
    ERROR_CODES.METHOD_NOT_ALLOWED,
    ERROR_MESSAGES_MAP[ERROR_CODES.METHOD_NOT_ALLOWED],
    ERROR_STATUS_MAP[ERROR_CODES.METHOD_NOT_ALLOWED],
  );
};
