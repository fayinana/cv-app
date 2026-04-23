type ApiEnvelope<T> = {
  data?: T;
  error?: { code?: string; message: string };
};

export async function postJson<TResponse, TBody>(
  url: string,
  body: TBody
): Promise<TResponse> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const payload = (await response.json()) as ApiEnvelope<TResponse>;
  if (!response.ok || payload.error) {
    throw new Error(payload.error?.message || "Request failed");
  }

  return payload.data as TResponse;
}
