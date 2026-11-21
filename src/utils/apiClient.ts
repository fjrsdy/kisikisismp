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
      const errMsg =
        'error' in parsed && typeof (parsed as { error?: unknown }).error === 'string'
          ? (parsed as { error: string }).error
          : `Permintaan gagal diproses oleh server (HTTP ${response.status}).`;
      throw new Error(errMsg);
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
      'Layanan API tidak ditemukan (HTTP 404). Muat ulang halaman atau mulai ulang server aplikasi.'
    );
  }

  throw new Error(
    `Server memberikan respons yang tidak dapat dibaca sebagai JSON (HTTP ${response.status}). Silakan coba lagi.`
  );
}
