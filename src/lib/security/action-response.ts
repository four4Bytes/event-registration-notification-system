import { FORBIDDEN_MESSAGE } from "@/lib/security/rbac";

export type ActionErrorCode =
  "unauthorized" | "forbidden" | "not_found" | "validation" | "conflict" | "unknown";

export interface ActionError {
  code: ActionErrorCode;
  title: string;
  description: string;
}

export interface ActionStatusResponse {
  success: boolean;
  error?: ActionError;
}

export interface ActionDataResponse<T> extends ActionStatusResponse {
  data?: T;
}

export function actionError(
  code: ActionErrorCode,
  title: string,
  description: string,
): ActionStatusResponse {
  return { success: false, error: { code, title, description } };
}

export function actionInvalid(entity: string): ActionStatusResponse {
  return actionError(
    "validation",
    `Invalid ${entity} data`,
    "Some fields are missing or malformed. Review your input and try again.",
  );
}

export function actionForbidden(): ActionStatusResponse {
  return actionError("forbidden", "Access denied", FORBIDDEN_MESSAGE);
}

export function actionUnauthorized(): ActionStatusResponse {
  return actionError("unauthorized", "Session expired", "Please sign in again to continue.");
}

export function actionDeactivated(): ActionStatusResponse {
  return actionError(
    "unauthorized",
    "Account deactivated",
    "Your account has been deactivated. Please contact an administrator.",
  );
}

export function actionNotFound(entity: string): ActionStatusResponse {
  return actionError(
    "not_found",
    `${entity} not found`,
    `The ${entity.toLowerCase()} may have been removed. Please refresh and try again.`,
  );
}

export function actionConflict(title: string, description: string): ActionStatusResponse {
  return actionError("conflict", title, description);
}
