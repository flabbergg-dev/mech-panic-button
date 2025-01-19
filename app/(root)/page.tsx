import Hero from "@/components/landing-page/hero";
import KnowMore from "@/components/landing-page/know-more";
import BookingInfo from "@/components/landing-page/booking-info";
import Online from "@/components/landing-page/online";
import SecondKnowMore from "@/components/landing-page/second-know-more";
import CompleteExperience from "@/components/landing-page/complete-experience";
import SafetyAlways from "@/components/landing-page/safety-always";
import NewsLetter from "@/components/landing-page/news-letter";

export default async function Home() {
  return (
    <>
      <Hero />
      <KnowMore />
      <BookingInfo />
      <Online />
      <SecondKnowMore />
      <CompleteExperience />
      <SafetyAlways />
      <NewsLetter />
    </>
  );
}
