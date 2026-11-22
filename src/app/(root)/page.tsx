import FeaturedTuitionsSection from "@/components/shared/featured-tutions";
import HeroSection from "@/components/shared/Hero-Banner";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <HeroSection></HeroSection>
      <FeaturedTuitionsSection></FeaturedTuitionsSection>
    </div>
  );
}
