import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, Upload, ArrowLeft, FileText, Loader2, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { STAKEHOLDER_ARCHETYPES, INDUSTRIES, COMPANY_SIZES, GEOGRAPHIES } from "@shared/types";
import type { ContextFormData } from "@shared/types";
import { DEMO_DOCUMENT } from "../lib/demoDocument";

export default function Analyze() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Form state
  const [documentTitle, setDocumentTitle] = useState("");
  const [documentContent, setDocumentContent] = useState("");
  const [industry, setIndustry] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [geography, setGeography] = useState("");
  const [selectedArchetypes, setSelectedArchetypes] = useState<string[]>([]);
  const [additionalContext, setAdditionalContext] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  const toggleArchetype = (id: string) => {
    setSelectedArchetypes(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setDocumentContent(text);
      if (!documentTitle) {
        setDocumentTitle(file.name.replace(/\.[^.]+$/, ""));
      }
    };
    reader.readAsText(file);
  };

  const loadDemoDocument = () => {
    setDocumentTitle(DEMO_DOCUMENT.title);
    setDocumentContent(DEMO_DOCUMENT.content);
    setIndustry(DEMO_DOCUMENT.industry);
    setCompanySize(DEMO_DOCUMENT.companySize);
    setGeography(DEMO_DOCUMENT.geography);
    setSelectedArchetypes([...DEMO_DOCUMENT.archetypes]);
    setAdditionalContext(DEMO_DOCUMENT.additionalContext);
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!documentTitle || !documentContent || !industry || !companySize || !geography || selectedArchetypes.length === 0) return;

    setIsSubmitting(true);

    const contextData: ContextFormData = {
      industry,
      companySize,
      geography,
      stakeholderArchetypes: selectedArchetypes,
      additionalContext: additionalContext || undefined,
    };

    // Navigate to results page with data in sessionStorage
    sessionStorage.setItem("warRoomPayload", JSON.stringify({
      documentTitle,
      documentContent,
      contextData,
    }));
    navigate("/results");
  };

  const canProceedToStep2 = documentTitle.trim() && documentContent.trim();
  const canSubmit = canProceedToStep2 && industry && companySize && geography && selectedArchetypes.length > 0;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-5xl mx-auto">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-[#8A8A8A] hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#FF4C4C] rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold font-['Inter']">THE WAR ROOM</span>
        </div>
        <div className="w-16" />
      </nav>

      <main className="max-w-3xl mx-auto px-8 py-8">
        {/* Progress indicator */}
        <div className="flex items-center gap-4 mb-10">
          <div className={`flex items-center gap-2 ${step >= 1 ? "text-white" : "text-[#555]"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? "bg-[#FF4C4C]" : "bg-[#1A1A1A]"}`}>1</div>
            <span className="text-sm font-medium">Document</span>
          </div>
          <div className={`h-px flex-1 ${step >= 2 ? "bg-[#FF4C4C]" : "bg-[#222]"}`} />
          <div className={`flex items-center gap-2 ${step >= 2 ? "text-white" : "text-[#555]"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? "bg-[#FF4C4C]" : "bg-[#1A1A1A]"}`}>2</div>
            <span className="text-sm font-medium">Context</span>
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold mb-2 font-['Inter']">Upload Your Document</h2>
              <p className="text-[#8A8A8A]">Paste your strategy proposal, deck content, or upload a text file.</p>
            </div>

            {/* Demo button */}
            <button
              onClick={loadDemoDocument}
              className="w-full flex items-center gap-4 p-4 bg-[#FF4C4C]/5 border border-[#FF4C4C]/20 rounded-xl hover:bg-[#FF4C4C]/10 hover:border-[#FF4C4C]/30 transition-all duration-200 text-left group"
            >
              <div className="w-10 h-10 bg-[#FF4C4C]/10 rounded-lg flex items-center justify-center group-hover:bg-[#FF4C4C]/20 transition-colors">
                <Sparkles className="w-5 h-5 text-[#FF4C4C]" />
              </div>
              <div>
                <p className="font-semibold text-sm text-white">Try the Demo</p>
                <p className="text-xs text-[#8A8A8A]">Load a sample strategy document with pre-configured context to see The War Room in action</p>
              </div>
            </button>

            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-sm text-[#8A8A8A] mb-2 block">Document Title</Label>
                <Input
                  id="title"
                  value={documentTitle}
                  onChange={e => setDocumentTitle(e.target.value)}
                  placeholder="e.g., Market Entry Strategy for Southeast Asia"
                  className="bg-[#121212] border-white/10 text-white placeholder:text-[#555] focus:border-[#FF4C4C] h-12"
                />
              </div>

              <div>
                <Label className="text-sm text-[#8A8A8A] mb-2 block">Document Content</Label>
                <div className="relative">
                  <Textarea
                    value={documentContent}
                    onChange={e => setDocumentContent(e.target.value)}
                    placeholder="Paste your strategy document here..."
                    className="bg-[#121212] border-white/10 text-white placeholder:text-[#555] focus:border-[#FF4C4C] min-h-[300px] font-mono text-sm"
                  />
                  {!documentContent && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <label className="pointer-events-auto cursor-pointer flex flex-col items-center gap-3 p-8 border-2 border-dashed border-white/10 rounded-xl hover:border-[#FF4C4C]/30 transition-colors">
                        <Upload className="w-8 h-8 text-[#555]" />
                        <span className="text-sm text-[#555]">or drag & drop a .txt / .md file</span>
                        <input type="file" accept=".txt,.md,.csv" onChange={handleFileUpload} className="hidden" />
                      </label>
                    </div>
                  )}
                </div>
                {documentContent && (
                  <p className="text-xs text-[#555] mt-2 flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {documentContent.length.toLocaleString()} characters loaded
                  </p>
                )}
              </div>
            </div>

            <Button
              onClick={() => setStep(2)}
              disabled={!canProceedToStep2}
              className="bg-[#FF4C4C] hover:bg-[#E04343] text-white font-semibold px-8 py-6 text-base rounded-xl disabled:opacity-30"
            >
              Continue to Context Setup
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold mb-2 font-['Inter']">Set the Context</h2>
              <p className="text-[#8A8A8A]">Help the AI build accurate personas by describing the client environment.</p>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm text-[#8A8A8A] mb-2 block">Industry</Label>
                  <Select value={industry} onValueChange={setIndustry}>
                    <SelectTrigger className="bg-[#121212] border-white/10 text-white h-12">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A1A] border-white/10">
                      {INDUSTRIES.map(ind => (
                        <SelectItem key={ind} value={ind} className="text-white hover:bg-[#222]">{ind}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm text-[#8A8A8A] mb-2 block">Company Size</Label>
                  <Select value={companySize} onValueChange={setCompanySize}>
                    <SelectTrigger className="bg-[#121212] border-white/10 text-white h-12">
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A1A] border-white/10">
                      {COMPANY_SIZES.map(size => (
                        <SelectItem key={size} value={size} className="text-white hover:bg-[#222]">{size}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm text-[#8A8A8A] mb-2 block">Geography</Label>
                  <Select value={geography} onValueChange={setGeography}>
                    <SelectTrigger className="bg-[#121212] border-white/10 text-white h-12">
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A1A] border-white/10">
                      {GEOGRAPHIES.map(geo => (
                        <SelectItem key={geo} value={geo} className="text-white hover:bg-[#222]">{geo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-sm text-[#8A8A8A] mb-3 block">Stakeholder Personas (select up to 3)</Label>
                <div className="space-y-3">
                  {STAKEHOLDER_ARCHETYPES.map(arch => (
                    <label
                      key={arch.id}
                      className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                        selectedArchetypes.includes(arch.id)
                          ? "bg-[#FF4C4C]/5 border-[#FF4C4C]/30"
                          : "bg-[#121212] border-white/5 hover:border-white/10"
                      }`}
                    >
                      <Checkbox
                        checked={selectedArchetypes.includes(arch.id)}
                        onCheckedChange={() => toggleArchetype(arch.id)}
                        className="mt-0.5 border-white/20 data-[state=checked]:bg-[#FF4C4C] data-[state=checked]:border-[#FF4C4C]"
                      />
                      <div>
                        <p className="font-medium text-sm">{arch.label}</p>
                        <p className="text-xs text-[#8A8A8A] mt-0.5">{arch.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm text-[#8A8A8A] mb-2 block">Additional Context (optional)</Label>
                <Textarea
                  value={additionalContext}
                  onChange={e => setAdditionalContext(e.target.value)}
                  placeholder="e.g., The board is particularly risk-averse due to a recent failed acquisition. The CEO is pushing for aggressive growth..."
                  className="bg-[#121212] border-white/10 text-white placeholder:text-[#555] focus:border-[#FF4C4C] min-h-[100px]"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button
                onClick={() => setStep(1)}
                variant="outline"
                className="border-white/10 text-white hover:bg-[#1A1A1A] px-6 py-6 rounded-xl"
              >
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit || isSubmitting}
                className="bg-[#FF4C4C] hover:bg-[#E04343] text-white font-semibold px-8 py-6 text-base rounded-xl disabled:opacity-30 flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Entering The War Room...
                  </>
                ) : (
                  <>
                    Enter The War Room <Shield className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
