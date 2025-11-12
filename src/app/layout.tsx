    import "@/styles/globals.css";
    import type { Metadata } from "next";
    import { SkunkdShell } from "@/components/layout/skunkd-shell";
    import { AuthProvider } from "@/components/auth/auth-provider";

    export const metadata: Metadata = {
      title: "Skunkd Tournaments",
      description: "Register for Skunkd gaming tournaments and manage events.",
      manifest: "/manifest.json",
      appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: "SKUNKD",
      },
      viewport: {
        width: "device-width",
        initialScale: 1,
        maximumScale: 5,
        userScalable: true,
        viewportFit: "cover",
      },
      themeColor: [
        { media: "(prefers-color-scheme: dark)", color: "#9333ea" },
        { media: "(prefers-color-scheme: light)", color: "#9333ea" },
      ],
    };

    export default function RootLayout({
      children,
    }: {
      children: React.ReactNode;
    }) {
      return (
        <html lang="en" className="dark">
          <head>
            <link rel="apple-touch-icon" href="/icon-192.png" />
            <meta name="mobile-web-app-capable" content="yes" />
          </head>
          <body className="bg-skunkd-midnight font-body text-white">
            <AuthProvider>
              <SkunkdShell>{children}</SkunkdShell>
            </AuthProvider>
          </body>
        </html>
      );
    }