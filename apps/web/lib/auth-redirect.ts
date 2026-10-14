export function getAuthReturnPath(value: string | null, origin: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return "/dashboard";
  }
  try {
    const destination = new URL(value, origin);
    if (destination.origin !== origin) return "/dashboard";
    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return "/dashboard";
  }
}

export function getAuthCallbackUrl(value: string | null, origin: string) {
  return `${origin}${getAuthReturnPath(value, origin)}`;
}

export function getAuthPageHref(path: "/login" | "/sign-up", next: string | null) {
  if (!next) return path;
  const params = new URLSearchParams({ next });
  return `${path}?${params.toString()}`;
}
