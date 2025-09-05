import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { Music, GraduationCap, Mic, BookOpen } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const TeacherDomainSelection = () => {
  const [selectedDomain, setSelectedDomain] = useState("");
  const navigate = useNavigate();
  const { logout, getUserName, getUserEmail } = useAuth();

  // Get teacher name from auth context
  const teacherFirstName = getUserName()?.split(' ')[0] || getUserEmail()?.split('@')[0] || "Teacher";

  const domains = [
    {
      id: "jazz",
      title: "Jazz Music",
      description: "Focuses on jazz theory, improvisation, and ensemble playing.",
      icon: Music
    },
    {
      id: "classical",
      title: "Classical Music", 
      description: "Covers classical theory, repertoire, and performance techniques.",
      icon: GraduationCap
    },
    {
      id: "pop",
      title: "Pop Music",
      description: "Explores contemporary popular music theory, songwriting, and performance.",
      icon: Mic
    },
    {
      id: "gmat",
      title: "GMAT",
      description: "Prepares students for the Graduate Management Admission Test, focusing on analytical, quantitative, verbal, and integrated reasoning skills.",
      icon: BookOpen
    },
    {
      id: "ielts",
      title: "IELTS",
      description: "Prepares students for the International English Language Testing System, focusing on listening, reading, writing, and speaking skills.",
      icon: BookOpen
    }
  ];

  const handleContinue = () => {
    // TODO: Save selected domain to backend
    navigate("/teacher/dashboard");
  };

  const handleSkip = () => {
    navigate("/teacher/dashboard");
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-card">
      {/* Header */}
      <header className="bg-primary shadow-lg">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-primary-foreground text-2xl font-bold">Gemeos</div>
          <Button 
            variant="outline" 
            className="border-primary-foreground text-primary-foreground bg-transparent hover:bg-primary-foreground hover:text-primary"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Welcome Message */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Welcome, {teacherFirstName}! Let's Get Started.
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            To personalize your Gemeos experience, please choose your primary teaching domain. 
            You can always add or manage additional domains later in Settings.
          </p>
        </div>

        {/* Domain Selection */}
        <div className="mb-8">
          <RadioGroup value={selectedDomain} onValueChange={setSelectedDomain}>
            <div className="grid md:grid-cols-2 gap-6">
              {domains.map((domain) => (
                <div key={domain.id}>
                  <RadioGroupItem value={domain.id} id={domain.id} className="sr-only" />
                  <Label htmlFor={domain.id} className="cursor-pointer">
                    <Card className={`transition-all duration-200 hover:shadow-lg border-2 ${
                      selectedDomain === domain.id 
                        ? "border-accent bg-accent/5 shadow-md" 
                        : "border-border hover:border-accent/50"
                    }`}>
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          <div className={`p-3 rounded-full ${
                            selectedDomain === domain.id 
                              ? "bg-accent/20" 
                              : "bg-muted"
                          }`}>
                            <domain.icon className={`h-6 w-6 ${
                              selectedDomain === domain.id 
                                ? "text-accent" 
                                : "text-muted-foreground"
                            }`} />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-foreground mb-2">
                              {domain.title}
                            </h3>
                            <p className="text-muted-foreground">
                              {domain.description}
                            </p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedDomain === domain.id
                              ? "border-accent bg-accent"
                              : "border-muted-foreground"
                          }`}>
                            {selectedDomain === domain.id && (
                              <div className="w-2 h-2 bg-white rounded-full" />
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            onClick={handleContinue}
            disabled={!selectedDomain}
            className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-3 text-lg font-semibold"
            size="lg"
          >
            Continue
          </Button>
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="text-muted-foreground hover:text-foreground"
          >
            Skip for Now
          </Button>
        </div>
      </main>
    </div>
  );
};

export default TeacherDomainSelection;