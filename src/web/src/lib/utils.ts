/**
 * Utility helper functions for campusfolio-web
 */

/**
 * Extracts up to 2 uppercase initials from a person's name
 * e.g., "Moh. Rifqi Dwi Ardiansyah" -> "MR", "Dewi Sartika" -> "DS", "Rizky" -> "R"
 */
export function getInitials(name?: string | null): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
}

/**
 * Standardized API Error extractor for UI forms and notifications.
 * Handles strings, FastAPI/Pydantic validation arrays, and fallback error messages.
 */
export function getApiErrorMessage(err: unknown, fallback = "Terjadi kesalahan pada sistem."): string {
  if (!err) return fallback;
  const axiosErr = err as {
    response?: {
      data?: {
        detail?: string | Array<{ loc?: (string | number)[]; msg?: string; type?: string }>;
        message?: string;
        code?: string;
      };
      status?: number;
    };
    message?: string;
  };

  const data = axiosErr?.response?.data;
  if (!data) {
    if (typeof axiosErr?.message === "string" && axiosErr.message.trim()) {
      return axiosErr.message;
    }
    return fallback;
  }

  // 1. Array detail of Pydantic validation errors (HTTP 422)
  if (Array.isArray(data.detail)) {
    return data.detail
      .map((item) => {
        const field =
          Array.isArray(item.loc) && item.loc.length > 0
            ? String(item.loc[item.loc.length - 1])
            : "";
        const rawMsg = item.msg || "Format data tidak valid";
        const cleanMsg = rawMsg.replace(/^Value error,\s*/i, "");
        return field ? `${field}: ${cleanMsg}` : cleanMsg;
      })
      .join("; ");
  }

  // 1b. data.errors array from FastAPI RequestValidationError ({detail, code, errors})
  if (Array.isArray((data as any).errors) && (data as any).errors.length > 0) {
    return (data as any).errors
      .map((item: any) => {
        const field =
          Array.isArray(item.loc) && item.loc.length > 0
            ? String(item.loc[item.loc.length - 1])
            : "";
        const rawMsg = item.msg || "Format data tidak valid";
        const cleanMsg = rawMsg.replace(/^Value error,\s*/i, "");
        return field ? `${field}: ${cleanMsg}` : cleanMsg;
      })
      .join("; ");
  }

  // 2. String detail
  if (typeof data.detail === "string" && data.detail.trim()) {
    return data.detail;
  }

  // 3. Fallback message attribute
  if (typeof data.message === "string" && data.message.trim()) {
    return data.message;
  }

  return fallback;
}
