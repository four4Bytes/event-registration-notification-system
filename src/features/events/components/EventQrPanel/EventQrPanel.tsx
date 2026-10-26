"use client";

import Image from "next/image";
import { useState } from "react";
import { FaCopy, FaDownload, FaShareNodes } from "react-icons/fa6";

import { Button } from "@/components/ui/Button/Button";
import { toastError, toastSuccess } from "@/lib/hooks/toast-utils";

import styles from "./EventQrPanel.module.css";

interface EventQrPanelProps {
  eventTitle: string;
  link: string;
  qrDataUrl: string;
}

function toFileName(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${slug || "event"}-qr.png`;
}

export function EventQrPanel({ eventTitle, link, qrDataUrl }: EventQrPanelProps) {
  const [isSharing, setIsSharing] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(link);
      toastSuccess("Link copied", "The event link is now on your clipboard.");
    } catch {
      toastError("Failed to copy link", "Select the link and copy it manually instead.");
    }
  }

  async function handleShare() {
    if (isSharing) return;
    if (!navigator.share) {
      await handleCopy();
      return;
    }
    setIsSharing(true);
    try {
      await navigator.share({
        title: eventTitle,
        text: `Scan this QR code to view ${eventTitle}.`,
        url: link,
      });
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        toastError("Failed to share", "Copy the link below and share it manually instead.");
      }
    } finally {
      setIsSharing(false);
    }
  }

  return (
    <section className={styles.panel} aria-label="Event QR code">
      <Image
        className={styles.qr}
        src={qrDataUrl}
        alt={`QR code for ${eventTitle}`}
        width={512}
        height={512}
        unoptimized
      />
      <p className={styles.hint}>
        Point a phone camera at this code to open the event. Scanning requires signing in.
      </p>
      <p className={styles.link}>{link}</p>
      <div className={styles.actions}>
        <Button variant="secondary" onPress={handleCopy}>
          <FaCopy aria-hidden="true" /> Copy link
        </Button>
        <Button variant="secondary" onPress={handleShare} isDisabled={isSharing}>
          <FaShareNodes aria-hidden="true" /> Share
        </Button>
        <a className={styles.download} href={qrDataUrl} download={toFileName(eventTitle)}>
          <FaDownload aria-hidden="true" /> Download PNG
        </a>
      </div>
    </section>
  );
}
