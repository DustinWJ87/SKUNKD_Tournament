    import "@/styles/globals.css";
    import type { Metadata } from "next";
    import { SkunkdShell } from "@/components/layout/skunkd-shell";

    export const metadata: Metadata = {
      title: "Skunkd Tournaments",
      description: "Register for Skunkd gaming tournaments and manage events.",
    };

    export default function RootLayout({
      children,
    }: {
      children: React.ReactNode;
    }) {
      return (
        <html lang="en" className="dark">
          <body className="bg-skunkd-midnight font-body text-white">
            <SkunkdShell>{children}</SkunkdShell>
          </body>
        </html>
      );
    }