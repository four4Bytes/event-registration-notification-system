"use client";

import jsQR from "jsqr";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FaCamera } from "react-icons/fa6";

import { Button } from "@/components/ui/Button/Button";
import { TextField } from "@/components/ui/TextField/TextField";
import { toastError } from "@/lib/hooks/toast-utils";

import styles from "./QrScanner.module.css";

type ScannerStatus = "idle" | "starting" | "scanning" | "error";

const TOKEN_PATTERN = /^[a-f0-9]{32}$/;

function extractToken(value: string): string | null {
  const trimmed = value.trim();
  if (TOKEN_PATTERN.test(trimmed)) return trimmed;
  try {
    const url = new URL(trimmed);
    const match = url.pathname.match(/^\/e\/([a-f0-9]{32})$/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

function describeCameraError(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError")
      return "Camera permission was denied. Allow camera access in your browser settings, then try again.";
    if (error.name === "NotFoundError")
      return "No camera was found on this device. Use the event link or code below instead.";
    if (error.name === "NotReadableError")
      return "The camera is already in use by another app. Close it and try again.";
  }
  return "The camera could not be started. Use the event link or code below instead.";
}

export function QrScanner() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const stoppedRef = useRef(true);

  const [status, setStatus] = useState<ScannerStatus>("idle");
  const [message, setMessage] = useState("");
  const [manualValue, setManualValue] = useState("");

  useEffect(() => {
    return () => {
      stoppedRef.current = true;
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  function stopCamera() {
    stoppedRef.current = true;
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setStatus("idle");
  }

  function openToken(token: string) {
    stopCamera();
    router.push(`/e/${token}`);
  }

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("error");
      setMessage("This browser does not support camera access. Use the event link or code below.");
      return;
    }

    setStatus("starting");
    setMessage("");
    stoppedRef.current = false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      if (stoppedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) {
        stopCamera();
        return;
      }

      video.srcObject = stream;
      await video.play();
      setStatus("scanning");

      const context = canvas.getContext("2d", { willReadFrequently: true });
      let frame = 0;

      const tick = () => {
        if (stoppedRef.current) return;
        if (video.readyState === video.HAVE_ENOUGH_DATA && context) {
          frame += 1;
          if (frame % 3 === 0) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const image = context.getImageData(0, 0, canvas.width, canvas.height);
            const result = jsQR(image.data, image.width, image.height, {
              inversionAttempts: "dontInvert",
            });
            const token = result?.data ? extractToken(result.data) : null;
            if (token) {
              openToken(token);
              return;
            }
          }
        }
        frameRef.current = requestAnimationFrame(tick);
      };

      frameRef.current = requestAnimationFrame(tick);
    } catch (error) {
      stoppedRef.current = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setStatus("error");
      setMessage(describeCameraError(error));
    }
  }

  function handleManualOpen() {
    const token = extractToken(manualValue);
    if (!token) {
      toastError(
        "Invalid event link",
        "Paste the full event link or the 32-character code shown under the QR image.",
      );
      return;
    }
    openToken(token);
  }

  return (
    <div className={styles.page}>
      <section className={styles.scanner} aria-label="QR camera scanner">
        <video
          ref={videoRef}
          className={styles.video}
          data-active={status === "scanning"}
          playsInline
          muted
        />
        <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
        {status !== "scanning" && (
          <div className={styles.placeholder}>
            <FaCamera aria-hidden="true" className={styles.placeholderIcon} />
            <p className={styles.placeholderText}>
              Use your phone camera to scan an event QR code.
            </p>
          </div>
        )}
        {message && (
          <p className={styles.message} role="alert">
            {message}
          </p>
        )}
        <div className={styles.controls}>
          {status === "scanning" ? (
            <Button variant="secondary" onPress={stopCamera}>
              Stop camera
            </Button>
          ) : (
            <Button variant="primary" onPress={startCamera} isDisabled={status === "starting"}>
              {status === "starting" ? "Starting camera..." : "Start camera"}
            </Button>
          )}
        </div>
      </section>

      <section className={styles.manual} aria-label="Open event manually">
        <h2 className={styles.manualTitle}>No camera?</h2>
        <p className={styles.manualText}>
          Paste the event link or the code printed under the QR image.
        </p>
        <div className={styles.manualRow}>
          <TextField
            label="Event link or code"
            value={manualValue}
            onChange={setManualValue}
            placeholder="http://localhost:3000/e/…"
          />
          <Button variant="secondary" onPress={handleManualOpen}>
            Open event
          </Button>
        </div>
      </section>
    </div>
  );
}
