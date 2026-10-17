import type { Metadata } from "next";

import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/600.css";
import "@fontsource/roboto/700.css";
import "@/styles/globals.css";
import "@/styles/variables.css";

export const metadata: Metadata = {
  title: "Event Registration Notification System",
  description: "Event registration and notification system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
