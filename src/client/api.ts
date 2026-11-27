export type ClientVersion = {
  clientId?: string;
  updatedAt?: string;
  asOf?: string;
  file?: string;
};

export type LoadResult =
  | { kind: "cached"; version: ClientVersion; output: unknown }
  | { kind: "imported"; version: ClientVersion; output: unknown }
  | { kind: "missing" }
  | { kind: "unreachable"; output: unknown | null; version: ClientVersion | null };

const CODE = /^[A-Za-z][A-Za-z]*_[0-9]{4}$/;

export function isPassword(code: string) {
  return CODE.test(code);
}

export function sameVersion(savedUpdatedAt: string | null, remoteUpdatedAt: string | undefined) {
  return Boolean(remoteUpdatedAt) && savedUpdatedAt === remoteUpdatedAt;
}

async function post(path: string, code: string): Promise<Response> {
  return fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ code }),
  });
}

export async function loadClient(code: string, savedUpdatedAt: string | null, savedOutput: unknown | null): Promise<LoadResult> {
  if (!isPassword(code)) return { kind: "missing" };
  let response: Response;
  try {
    response = await post("/api/client/version", code);
  } catch {
    return { kind: "unreachable", output: savedOutput, version: savedUpdatedAt ? { updatedAt: savedUpdatedAt } : null };
  }
  if (response.status === 404) return { kind: "missing" };
  if (!response.ok) return { kind: "unreachable", output: savedOutput, version: null };
  const version = versionFrom(await response.json());
  if (sameVersion(savedUpdatedAt, version.updatedAt) && savedOutput != null) {
    return { kind: "cached", version, output: savedOutput };
  }
  try {
    const data = await post("/api/client/data", code);
    if (data.status === 404) return { kind: "missing" };
    if (!data.ok) return { kind: "unreachable", output: savedOutput, version };
    return { kind: "imported", version, output: await data.json() };
  } catch {
    return { kind: "unreachable", output: savedOutput, version };
  }
}

function versionFrom(raw: unknown): ClientVersion {
  const row = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  const text = (value: unknown) => typeof value === "string" ? value : undefined;
  return {
    clientId: text(row.clientId) ?? text(row.client_id),
    updatedAt: text(row.updatedAt) ?? text(row.updated_at),
    asOf: text(row.asOf) ?? text(row.as_of),
    file: text(row.file),
  };
}
