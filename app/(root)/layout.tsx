import { Footer } from "@/components/layouts/footer";
import { Navbar } from "@/components/layouts/navbar";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Welcome | Mech-Panic Button",
  description:
    "The Mech-Panic Button is a simple tool to request on-demand and scheduled support from the best mechanics  in your area.",

    openGraph: {
      title: 'Mech-Panic Button',
      description: 'The Mech-Panic Button is a simple tool to request on-demand and scheduled support from the best mechanics  in your area.',
      images: ['/og-image.jpg'],
    },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Navbar/>
        {children}
      <Footer/>
    </>
        
  );
}
