const TWILIO_API_BASE = "https://verify.twilio.com/v2";

function authHeader(): string {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) {
    throw new Error("TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN are not configured");
  }
  return "Basic " + Buffer.from(`${sid}:${token}`).toString("base64");
}

function serviceSid(): string {
  const sid = process.env.TWILIO_VERIFY_SERVICE_SID;
  if (!sid) {
    throw new Error("TWILIO_VERIFY_SERVICE_SID is not configured");
  }
  return sid;
}

/** Normalizes a US phone number to E.164 (+1XXXXXXXXXX) for Twilio Verify. */
export function toE164(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (phone.trim().startsWith("+")) return phone.trim();
  return null;
}

/**
 * Starts a Twilio Verify SMS challenge. Twilio owns code generation,
 * expiry, and delivery — we just hold the phone number until the visitor
 * submits the code back to checkVerification.
 */
export async function startVerification(phoneE164: string): Promise<boolean> {
  const res = await fetch(
    `${TWILIO_API_BASE}/Services/${serviceSid()}/Verifications`,
    {
      method: "POST",
      headers: {
        Authorization: authHeader(),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: phoneE164, Channel: "sms" }),
    }
  );
  return res.ok;
}

export async function checkVerification(
  phoneE164: string,
  code: string
): Promise<boolean> {
  const res = await fetch(
    `${TWILIO_API_BASE}/Services/${serviceSid()}/VerificationCheck`,
    {
      method: "POST",
      headers: {
        Authorization: authHeader(),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: phoneE164, Code: code }),
    }
  );

  if (!res.ok) return false;
  const data = await res.json();
  return data.status === "approved";
}
