import { ThemeProvider } from "next-themes";
import localFont from "next/font/local"
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/toaster";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Mech-Panic Button",
  description: "Request assistance from a mechanic with the push of a button.",
  manifest: '/manifest.json',
  themeColor: '#8E0801',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Mech-Panic',
  },
  openGraph: {
    title: 'Mech-Panic Button',
    description: 'The Mech-Panic Button is a simple tool to request on-demand and scheduled support from the best mechanics  in your area.',
    images: ['/og-image.jpg'],
  },
};

const robotoRegular = localFont({
  src: "./_fonts/Roboto-Regular.ttf",
  variable: "--font-roboto-regular",
})
const michromaSans = localFont({
  src: "./_fonts/Michroma-Regular.ttf",
  variable: "--font-michroma-sans",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${robotoRegular.variable} ${michromaSans.variable} font-roboto-regular overflow-x-hidden`} suppressHydrationWarning>
      <head>
        <meta name="application-name" content="Mech-Panic" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Mech-Panic" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#8E0801" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
      </head>
      <ClerkProvider
        appearance={{
          variables: { colorPrimary: "#8E0801" },
          elements: {
            headerTitle: "text-2xl font-bold text-text font-michroma-sans",
            formButtonPrimary:
              "border border-black border-solid hover:bg-white hover:text-black",
            formFieldLabel: "text-text",
            formFieldCheckboxLabel: "text-text font-semibold",
            socialButtonsBlockButton:
              "bg-white border-gray-200 hover:bg-primary text-gray-600 hover:text-text ",
            socialButtonsBlockButtonText: "font-semibold",
            formButtonReset:
              "bg-white border border-solid border-gray-200 hover:bg-transparent hover:border-black text-gray-500 hover:text-black",
            membersPageInviteButton:
              "bg-black border border-black border-solid hover:bg-white hover:text-black",
            card: "bg-background",
          },
        }}
      >
        <body className="bg-background text-foreground overflow-x-hidden">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Toaster />
            <main className="min-h-screen w-full flex flex-col items-center">
              {children}
            </main>
          
          </ThemeProvider>
          
        </body>
      </ClerkProvider>
    </html>
  );
}
