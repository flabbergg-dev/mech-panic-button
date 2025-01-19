import { ThemeProvider } from "next-themes";
import localFont from "next/font/local"
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Mech-Panic Button",
  description: "Request assistance from a mechanic with the push of a button.",

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
    <html lang="en" className={`${robotoRegular.variable} ${michromaSans.variable} font-roboto-regular overflow-x-hidden`}suppressHydrationWarning>
      <body className="bg-background text-foreground overflow-x-hidden">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <main className="min-h-screen w-full flex flex-col items-center">
           {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
