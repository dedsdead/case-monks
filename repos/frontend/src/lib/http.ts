import { isAxiosError } from "axios";

export function getResponseStatus(error: unknown): number | undefined {
  if (isAxiosError(error)) return error.response?.status;
  // Duck-typed fallback so non-AxiosError shapes (e.g. test doubles) still resolve
  const status = (error as { response?: { status?: unknown } } | null)?.response
    ?.status;
  return typeof status === "number" ? status : undefined;
}
