import QRCode from "qrcode";

import { getOptionalEnvVar } from "@/lib/infra/env";

const DEFAULT_APP_URL = "http://localhost:3000";

/**
 * Resolves the public origin used in QR links.
 *
 * Configure `NEXT_PUBLIC_APP_URL` with the exact origin users reach the app
 * on - notably the HTTPS tunnel URL when scanning from a phone, because QR
 * links generated with `localhost` are unusable on another device.
 *
 * @returns The configured origin without a trailing slash.
 */
export function getAppBaseUrl(): string {
  const configured = getOptionalEnvVar("NEXT_PUBLIC_APP_URL", "").replace(/\/+$/, "");
  return configured || DEFAULT_APP_URL;
}

/**
 * Builds the secure event link encoded in an event QR code.
 *
 * @param publicToken - The event's 32-character hex token.
 * @returns An absolute URL to the QR landing page.
 */
export function buildEventLink(publicToken: string): string {
  return `${getAppBaseUrl()}/e/${publicToken}`;
}

/**
 * Renders an event QR code as a PNG data URL.
 *
 * @param link - The absolute URL to encode.
 * @returns A `data:image/png;base64,...` URL suitable for `<img src>` and downloads.
 */
export async function generateEventQrDataUrl(link: string): Promise<string> {
  return QRCode.toDataURL(link, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 512,
    color: { dark: "#0f2440ff", light: "#ffffffff" },
  });
}
