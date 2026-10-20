const TURNSTILE_VERIFY_URL =
  'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export async function verifyTurnstileToken(
  token: string,
  remoteIp?: string
): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    console.error('Missing TURNSTILE_SECRET_KEY environment variable.');
    return false;
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (remoteIp && remoteIp !== 'unknown') {
      formData.append('remoteip', remoteIp);
    }

    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      console.error(
        'Turnstile verification request failed with status:',
        response.status
      );
      return false;
    }

    const data = (await response.json()) as {
      success: boolean;
      'error-codes'?: string[];
    };

    if (!data.success && data['error-codes']) {
      console.error('Turnstile verification errors:', data['error-codes']);
    }

    return data.success === true;
  } catch (error) {
    console.error('Turnstile verification threw an error:', error);
    return false;
  }
}
