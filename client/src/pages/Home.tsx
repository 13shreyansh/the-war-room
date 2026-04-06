import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { Shield, Zap, Target, ArrowRight, Play, Github } from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white relative overflow-hidden">
      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#FF4C4C] rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight font-['Inter']">THE WAR ROOM</span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/13shreyansh/the-war-room"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg hover:bg-white/5 transition-colors text-[#888] hover:text-white"
            title="View on GitHub"
          >
            <Github className="w-5 h-5" />
          </a>
          {isAuthenticated ? (
            <Button
              onClick={() => navigate("/analyze")}
              className="bg-[#FF4C4C] hover:bg-[#E04343] text-white font-semibold px-6"
            >
              Launch War Room <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={() => { window.location.href = getLoginUrl(); }}
              className="bg-[#FF4C4C] hover:bg-[#E04343] text-white font-semibold px-6"
            >
              Sign In to Start
            </Button>
          )}
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 max-w-7xl mx-auto px-8 pt-24 pb-32">
        <div className="max-w-4xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FF4C4C]/10 border border-[#FF4C4C]/20 text-[#FF4C4C] text-sm font-medium mb-8">
            <Zap className="w-3.5 h-3.5" />
            AI-Powered Strategy Stress Testing
          </div>

          <h1 className="text-6xl md:text-7xl font-bold leading-[1.05] tracking-tight font-['Inter'] mb-6">
            Your strategy won't
            <br />
            <span className="text-[#FF4C4C]">survive</span> first contact
            <br />
            with the client.
          </h1>

          <p className="text-xl text-[#8A8A8A] max-w-2xl mb-10 leading-relaxed">
            Upload your consulting deliverable. AI-generated stakeholder personas — armed with
            live industry research — will find every weakness before your client does.
          </p>

          <div className="flex items-center gap-4 flex-wrap">
            {isAuthenticated ? (
              <Button
                onClick={() => navigate("/analyze")}
                size="lg"
                className="bg-[#FF4C4C] hover:bg-[#E04343] text-white font-semibold px-8 py-6 text-lg rounded-xl"
              >
                Launch War Room <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={() => { window.location.href = getLoginUrl(); }}
                size="lg"
                className="bg-[#FF4C4C] hover:bg-[#E04343] text-white font-semibold px-8 py-6 text-lg rounded-xl"
              >
                Sign In to Get Started <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            )}
            <Button
              onClick={() => navigate("/demo")}
              size="lg"
              variant="outline"
              className="border-[#FF4C4C]/40 text-[#FF4C4C] hover:bg-[#FF4C4C]/10 font-semibold px-8 py-6 text-lg rounded-xl"
            >
              <Play className="w-5 h-5 mr-2 fill-current" /> Watch the Demo
            </Button>
          </div>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24">
          <FeatureCard
            icon={<Target className="w-6 h-6 text-[#FF4C4C]" />}
            title="Research-Backed Personas"
            description="AI generates stakeholder personas grounded in real industry data — not generic ChatGPT roleplay."
          />
          <FeatureCard
            icon={<Shield className="w-6 h-6 text-[#FF4C4C]" />}
            title="Evidence-Based Attacks"
            description="Every critique comes with citations and confidence scores. No vague 'consider the risks' feedback."
          />
          <FeatureCard
            icon={<Zap className="w-6 h-6 text-[#FF9F43]" />}
            title="Unhinged Mode"
            description="Toggle to hear your critiques in the voice of an angry partner at 2 AM. Because sometimes you need the truth delivered raw."
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 px-8 max-w-7xl mx-auto">
        <p className="text-sm text-[#555]">
          Built for the Manus × Vibecoding Consulting AI Hackathon. The War Room doesn't write your strategy — it makes sure your strategy survives.
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-[#121212] border border-white/5 rounded-xl p-6 hover:border-[#FF4C4C]/20 transition-colors duration-300">
      <div className="w-12 h-12 bg-[#1A1A1A] rounded-lg flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2 font-['Inter']">{title}</h3>
      <p className="text-sm text-[#8A8A8A] leading-relaxed">{description}</p>
    </div>
  );
}
