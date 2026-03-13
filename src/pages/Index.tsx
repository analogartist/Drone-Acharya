import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Music, Mic, Target, Zap } from "lucide-react";
import PracticeStage from "@/components/PracticeStage";
import FeatureCard from "@/components/FeatureCard";

const Index = () => {
  const [showPractice, setShowPractice] = useState(false);

  if (showPractice) {
    return <PracticeStage onBack={() => setShowPractice(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-sm font-medium text-primary mb-4">
            <Zap className="w-4 h-4" />
            AI-Powered Practice Companion
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight gradient-morning bg-clip-text text-transparent">
            Drone-Acharya
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Master Hindustani classical vocals with real-time AI feedback on sur and taal
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button 
              size="lg" 
              className="text-lg px-8 py-6 shadow-glow"
              onClick={() => setShowPractice(true)}
            >
              <Mic className="mr-2 w-5 h-5" />
              Start Practice
            </Button>
            
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-8 py-6"
            >
              <Music className="mr-2 w-5 h-5" />
              Learn More
            </Button>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-20">
          <FeatureCard
            icon={Target}
            title="Perfect Your Sur"
            description="Real-time pitch detection shows exactly when you're in tune with visual feedback"
          />
          <FeatureCard
            icon={Music}
            title="Stay in Taal"
            description="Beat detection keeps you perfectly aligned with the rhythm cycle"
          />
          <FeatureCard
            icon={Zap}
            title="Instant Feedback"
            description="Sub-50ms latency ensures you learn and correct in the moment"
          />
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20 border-t">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">Practice Like Never Before</h2>
          <p className="text-lg text-muted-foreground">
            Drone-Acharya runs entirely in your browser with on-device AI models.
            No installation, no data upload — just you, your voice, and instant guidance.
          </p>
          
          <div className="grid sm:grid-cols-2 gap-8 pt-8 text-left">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="font-semibold text-lg">Choose Your Raga</h3>
              <p className="text-muted-foreground">
                Select from Yaman, Bhupali, and more to practice specific swaras
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-2xl">🎵</span>
              </div>
              <h3 className="font-semibold text-lg">Sing Your Palta</h3>
              <p className="text-muted-foreground">
                Practice patterns while the AI tracks your pitch and timing
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-2xl">✨</span>
              </div>
              <h3 className="font-semibold text-lg">Get Visual Feedback</h3>
              <p className="text-muted-foreground">
                See green when you're in sur, red when you drift off pitch
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="font-semibold text-lg">Track Progress</h3>
              <p className="text-muted-foreground">
                Review session summaries and identify areas to improve
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mx-auto text-center space-y-6 p-12 rounded-2xl gradient-radial border">
          <h2 className="text-3xl md:text-4xl font-bold">Ready to Transform Your Practice?</h2>
          <p className="text-lg text-muted-foreground">
            Join thousands of vocalists using AI to accelerate their practice
          </p>
          <Button 
            size="lg" 
            className="text-lg px-8 py-6 shadow-glow"
            onClick={() => setShowPractice(true)}
          >
            Begin Your Journey
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
