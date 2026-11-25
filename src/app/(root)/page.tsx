import FeaturedTuitionsSection from "@/components/shared/featured-tutions";
import HeroSection from "@/components/shared/Hero-Banner";
import PricingSection from "@/components/shared/subcriptions";
import HowItWorksSection from "@/components/shared/work";

// The featured section fetches live tuition data without a cache tag. Allow the
// route to block during prerendering instead of failing the build.
export const instant = false;

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <HeroSection></HeroSection>
      <FeaturedTuitionsSection></FeaturedTuitionsSection>
      <PricingSection></PricingSection>
      <HowItWorksSection></HowItWorksSection>
      
    </div>
  );
}
