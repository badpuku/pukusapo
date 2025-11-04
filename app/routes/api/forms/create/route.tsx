import { getAuth } from "@clerk/react-router/ssr.server";
import { err, ok, Result } from "neverthrow";
import { data } from "react-router";

import {
  ERROR_CODES,
  ERROR_MESSAGES_MAP,
  ERROR_STATUS_MAP,
} from "~/constants/errors";
import { createServerSupabaseClient } from "~/services/supabase/client.server";
import { getProfileByUserId } from "~/services/supabase/profiles";
import { hasModeratorPermission } from "~/utils/permissions";

import type { Route } from "./+types/route";
import { createFormSchema } from "./validation";

type JsonParseError = {
  code: typeof ERROR_CODES.INVALID_JSON;
  message: string;
};
type SchemaValidationError = {
  code: typeof ERROR_CODES.VALIDATION_ERROR;
  message: string;
  details: Record<string, string[] | undefined>;
};

type RequestBodyError = JsonParseError | SchemaValidationError;

export const action = async (args: Route.ActionArgs) => {
  const { request } = args;
  const auth = await getAuth(args);
  const userId = auth.userId;

  if (!userId) {
    return data(
      {
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: ERROR_MESSAGES_MAP[ERROR_CODES.UNAUTHORIZED],
        },
      },
      { status: ERROR_STATUS_MAP[ERROR_CODES.UNAUTHORIZED] },
    );
  }

  const parseJsonResult: Result<unknown, RequestBodyError> = await request
    .json()
    .then((data) => ok(data))
    .catch(() =>
      err({
        code: ERROR_CODES.INVALID_JSON,
        message: ERROR_MESSAGES_MAP[ERROR_CODES.INVALID_JSON],
      }),
    );

  const validationResult = parseJsonResult.andThen((requestData) => {
    const parseResult = createFormSchema.safeParse(requestData);
    if (parseResult.success) {
      return ok(parseResult.data);
    }
    return err({
      code: ERROR_CODES.VALIDATION_ERROR,
      message: ERROR_MESSAGES_MAP[ERROR_CODES.VALIDATION_ERROR],
      details: parseResult.error.flatten().fieldErrors,
    });
  });

  if (validationResult.isErr()) {
    const error = validationResult.error;
    return data(
      {
        success: false,
        error:
          error.code === ERROR_CODES.VALIDATION_ERROR
            ? {
                code: error.code,
                message: error.message,
                details: error.details,
              }
            : {
                code: error.code,
                message: error.message,
              },
      },
      {
        status: ERROR_STATUS_MAP[error.code],
      },
    );
  }

  const { title, description, status } = validationResult.value;

  const supabase = createServerSupabaseClient(args);

  const profileResponse = await getProfileByUserId(supabase, userId);

  if (!profileResponse?.data) {
    return data(
      {
        success: false,
        error: {
          code: ERROR_CODES.PROFILE_NOT_FOUND,
          message: ERROR_MESSAGES_MAP[ERROR_CODES.PROFILE_NOT_FOUND],
        },
      },
      { status: ERROR_STATUS_MAP[ERROR_CODES.PROFILE_NOT_FOUND] },
    );
  }

  const userProfile = profileResponse.data;
  const permissionLevel = userProfile.roles?.permission_level;
  if (!hasModeratorPermission(permissionLevel)) {
    return data(
      {
        success: false,
        error: {
          code: ERROR_CODES.FORBIDDEN,
          message: ERROR_MESSAGES_MAP[ERROR_CODES.FORBIDDEN],
        },
      },
      { status: ERROR_STATUS_MAP[ERROR_CODES.FORBIDDEN] },
    );
  }

  const { data: newForm, error: insertError } = await supabase
    .from("forms")
    .insert({
      title,
      description: description || null,
      status,
      created_by: userProfile.id,
    })
    .select()
    .single();

  if (insertError) {
    console.error("Form creation error:", insertError);
    return data(
      {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: ERROR_MESSAGES_MAP[ERROR_CODES.DATABASE_ERROR],
        },
      },
      { status: ERROR_STATUS_MAP[ERROR_CODES.DATABASE_ERROR] },
    );
  }

  return data(
    {
      success: true,
      data: newForm,
    },
    { status: 201 },
  );
};
