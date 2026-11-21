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
  payload: unknown
): Promise<TResponse> {
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
      const extracted = extractErrorMessage(parsed);
      if (response.status === 404) {
        throw new Error(
          extracted
            ? `Layanan API tidak ditemukan (${extracted}). Muat ulang halaman atau mulai ulang server aplikasi.`
            : `Endpoint layanan ${url} tidak ditemukan (HTTP 404). Muat ulang halaman atau pastikan server backend sedang berjalan.`
        );
      }
      throw new Error(
        extracted ||
          `Permintaan gagal diproses oleh server (HTTP ${response.status}).`
      );
    }
    return parsed as TResponse;
  }

  const lower = rawText.toLowerCase();
  if (
    response.status === 502 ||
    response.status === 504 ||
    lower.includes('the page c') ||
    lower.includes('timeout') ||
    lower.includes('gateway')
  ) {
    throw new Error(
      `Koneksi ke server terputus atau melewati batas waktu (HTTP ${response.status || 504}). Silakan ulangi kembali.`
    );
  }

  if (response.status === 404) {
    throw new Error(
      `Endpoint layanan ${url} tidak ditemukan (HTTP 404). Muat ulang halaman atau pastikan server backend sedang berjalan.`
    );
  }

  throw new Error(
    `Server memberikan respons yang tidak dapat dibaca sebagai JSON (HTTP ${response.status}). Silakan coba lagi.`
  );
}
