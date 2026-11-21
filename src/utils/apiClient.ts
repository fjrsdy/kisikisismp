function extractErrorMessage(parsed: unknown): string | null {
  if (!parsed || typeof parsed !== 'object') return null;
  const obj = parsed as Record<string, unknown>;

  if (typeof obj.error === 'string' && obj.error.trim()) {
    return obj.error.trim();
  }
  if (obj.error && typeof obj.error === 'object') {
    const nested = obj.error as Record<string, unknown>;
    if (typeof nested.message === 'string' && nested.message.trim()) {
      return nested.message.trim();
    }
  }
  if (typeof obj.message === 'string' && obj.message.trim()) {
    return obj.message.trim();
  }
  if (typeof obj.detail === 'string' && obj.detail.trim()) {
    return obj.detail.trim();
  }
  return null;
}

export async function postApiJson<TResponse>(
  url: string,
  payload: unknown,
  localFallback?: () => TResponse
): Promise<TResponse> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const rawText = await response.text();
    let parsed: unknown = null;

    if (rawText) {
      try {
        parsed = JSON.parse(rawText);
      } catch {
        parsed = null;
      }
    }

    if (parsed && typeof parsed === 'object') {
      if (!response.ok) {
        if (response.status === 404 && localFallback) {
          return localFallback();
        }
        const extracted = extractErrorMessage(parsed);
        throw new Error(
          extracted ||
            `Permintaan gagal diproses oleh server (HTTP ${response.status}).`
        );
      }
      return parsed as TResponse;
    }

    if (localFallback) {
      return localFallback();
    }

    throw new Error(
      `Server memberikan respons yang tidak dapat dibaca sebagai JSON (HTTP ${response.status}). Silakan coba lagi.`
    );
  } catch (err) {
    if (localFallback && !(err instanceof Error && err.message.startsWith('Mata pelajaran'))) {
      return localFallback();
    }
    throw err;
  }
}
