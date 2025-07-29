'use client';

import HeroSection from "@/components/landing/HeroSection";
import FeatureSection from "@/components/landing/FeatureSection";
import ApiSection from "@/components/landing/ApiSection";
import VideoSection from "@/components/landing/VideoSection";
import KeywordSection from "@/components/landing/KeywordSection";
import DownloadSection from "@/components/landing/DownloadSection";
import Footer from "@/components/landing/Footer";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <main>
        <HeroSection />
        <FeatureSection />
        <ApiSection />
        <VideoSection />
        <KeywordSection />
        <DownloadSection />
      </main>
      <Footer />
    </div>
  );
}
