import { QrScanner } from "@/features/scanner/components/QrScanner/QrScanner";
import { requirePagePermission } from "@/lib/security/auth-guards";

export default async function ScanPage() {
  await requirePagePermission("event.read");
  return <QrScanner />;
}
