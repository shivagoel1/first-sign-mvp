import { useState } from "react";
import { ArrowLeft, ArrowRight, Baby, CheckCircle, MessageSquare, Smile, Zap } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Progress } from "./ui/progress";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { motion, AnimatePresence } from "motion/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface AssessmentFlowProps {
  onComplete: (data: AssessmentData) => void;
  onBack: () => void;
}

interface AssessmentData {
  childName: string;
  childAge: string;
  responses: Record<string, string>;
  notes: Record<string, string>;
}

const developmentalAreas = [
  {
    id: "social-emotional",
    name: "Social-Emotional",
    icon: Smile,
    color: "text-primary",
    bgColor: "bg-primary/10",
    questions: [
      {
        id: "se1",
        question: "Does your child smile at people?",
        options: ["Yes, frequently", "Sometimes", "Not yet"]
      },
      {
        id: "se2",
        question: "Does your child show interest in other children?",
        options: ["Yes, very interested", "Somewhat interested", "Not yet"]
      },
      {
        id: "se3",
        question: "Does your child respond to their name when called?",
        options: ["Yes, always", "Sometimes", "Rarely or never"]
      }
    ]
  },
  {
    id: "language",
    name: "Language/Communication",
    icon: MessageSquare,
    color: "text-secondary-accent",
    bgColor: "bg-secondary-accent/10",
    questions: [
      {
        id: "lc1",
        question: "Does your child babble or make sounds?",
        options: ["Yes, frequently", "Sometimes", "Not yet"]
      },
      {
        id: "lc2",
        question: "Does your child try to repeat sounds you make?",
        options: ["Yes, often", "Sometimes", "Not yet"]
      },
      {
        id: "lc3",
        question: "Does your child point to things they want?",
        options: ["Yes, regularly", "Sometimes", "Not yet"]
      }
    ]
  },
  {
    id: "motor",
    name: "Motor Skills",
    icon: Zap,
    color: "text-warning",
    bgColor: "bg-warning/10",
    questions: [
      {
        id: "m1",
        question: "Can your child sit without support?",
        options: ["Yes, independently", "With some support", "Not yet"]
      },
      {
        id: "m2",
        question: "Does your child reach for and grab toys?",
        options: ["Yes, regularly", "Sometimes", "Not yet"]
      },
      {
        id: "m3",
        question: "Can your child pick up small objects?",
        options: ["Yes, easily", "Working on it", "Not yet"]
      }
    ]
  },
  {
    id: "cognitive",
    name: "Cognitive",
    icon: Baby,
    color: "text-success",
    bgColor: "bg-success/10",
    questions: [
      {
        id: "c1",
        question: "Does your child look for hidden objects?",
        options: ["Yes, often", "Sometimes", "Not yet"]
      },
      {
        id: "c2",
        question: "Does your child explore objects by shaking, banging, or dropping?",
        options: ["Yes, frequently", "Sometimes", "Not yet"]
      },
      {
        id: "c3",
        question: "Does your child show curiosity about their surroundings?",
        options: ["Very curious", "Somewhat curious", "Limited curiosity"]
      }
    ]
  }
];

export function AssessmentFlow({ onComplete, onBack }: AssessmentFlowProps) {
  const [step, setStep] = useState(0);
  const [childName, setChildName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [focusArea, setFocusArea] = useState("");
  const [currentAreaIndex, setCurrentAreaIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  const totalSteps = developmentalAreas.reduce((acc, area) => acc + area.questions.length, 0) + 1;
  const currentStep = step;
  const progress = (currentStep / totalSteps) * 100;

  const currentArea = developmentalAreas[currentAreaIndex];
  const currentQuestion = currentArea?.questions[currentQuestionIndex];

  const handleNext = () => {
    if (step === 0) {
      if (!childName || !dateOfBirth || !focusArea) return;
      setStep(1);
      return;
    }

    if (currentQuestionIndex < currentArea.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else if (currentAreaIndex < developmentalAreas.length - 1) {
      setCurrentAreaIndex(currentAreaIndex + 1);
      setCurrentQuestionIndex(0);
    } else {
      // Assessment complete
      onComplete({
        childName,
        childAge: dateOfBirth,
        responses,
        notes
      });
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step === 0) {
      onBack();
      return;
    }
    if (step === 1) {
      setStep(0);
      return;
    }

    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else if (currentAreaIndex > 0) {
      setCurrentAreaIndex(currentAreaIndex - 1);
      setCurrentQuestionIndex(developmentalAreas[currentAreaIndex - 1].questions.length - 1);
    }
    setStep(step - 1);
  };

  const canProceed = () => {
    if (step === 0) return childName && dateOfBirth && focusArea;
    if (currentQuestion) return responses[currentQuestion.id];
    return false;
  };

  // Helper function to format focus area for display
  const getFocusAreaDisplay = () => {
    const focusAreaMap: Record<string, string> = {
      "typically-developing": "TYPICALLY DEVELOPING",
      "autism-spectrum": "AUTISM SPECTRUM",
      "cerebral-palsy": "CEREBRAL PALSY",
      "down-syndrome": "DOWN SYNDROME"
    };
    return focusAreaMap[focusArea] || "";
  };

  return (
    <div className="min-h-screen py-8 bg-orange-50/30">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header with Child's Name (only show during questions) */}
        {step > 0 && childName && (
          <div className="mb-6">
            <h1 className="text-3xl mb-2">{childName}'s Assessment</h1>
            <p className="text-muted-foreground">
              Answer each question to help us understand your child's developmental progress.
            </p>
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              {step === 0 ? "Getting Started" : `Question ${currentStep} of ${totalSteps - 1}`}
            </span>
            <span className="text-sm text-muted-foreground">
              {step === 0 ? "" : `${Math.round(progress)}% Complete`}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card className="p-8 md:p-10">
          <AnimatePresence mode="wait">
            {step === 0 ? (
              <motion.div
                key="intro"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-3xl mb-3 text-center">Tell us about your child</h2>
                <p className="text-muted-foreground mb-8 text-center">
                  This helps us show age-appropriate questions tailored to your family.
                </p>

                <div className="space-y-6">
                  <div>
                    <Label htmlFor="childName">Child's Name</Label>
                    <Input
                      id="childName"
                      value={childName}
                      onChange={(e) => setChildName(e.target.value)}
                      placeholder="Enter your child's name"
                      className="mt-2"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        placeholder="mm/dd/yyyy"
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="focusArea">Focus Area</Label>
                      <Select
                        value={focusArea}
                        onValueChange={(value) => setFocusArea(value)}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select a focus area" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="typically-developing">Typically Developing</SelectItem>
                          <SelectItem value="autism-spectrum">Autism Spectrum</SelectItem>
                          <SelectItem value="cerebral-palsy">Cerebral Palsy</SelectItem>
                          <SelectItem value="down-syndrome">Down Syndrome</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={`question-${currentQuestion.id}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Badges for Area and Focus */}
                <div className="flex items-center gap-2 mb-6">
                  <Badge className="bg-success/10 text-success hover:bg-success/20 border-success/20">
                    {currentArea.name.toUpperCase()}
                  </Badge>
                  <Badge className="bg-secondary-accent/10 text-secondary-accent hover:bg-secondary-accent/20 border-secondary-accent/20">
                    {getFocusAreaDisplay()}
                  </Badge>
                </div>

                {/* Question */}
                <div className="mb-6">
                  <h3 className="text-2xl mb-6">{currentQuestion.question}</h3>

                  <RadioGroup
                    value={responses[currentQuestion.id] || ""}
                    onValueChange={(value) => 
                      setResponses({ ...responses, [currentQuestion.id]: value })
                    }
                    className="space-y-3"
                  >
                    {currentQuestion.options.map((option, index) => (
                      <motion.div 
                        key={index} 
                        className="flex items-center space-x-3"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.3 }}
                      >
                        <RadioGroupItem value={option} id={`option-${index}`} />
                        <Label 
                          htmlFor={`option-${index}`} 
                          className={`cursor-pointer flex-1 py-4 px-5 rounded-lg border-2 transition-all ${
                            responses[currentQuestion.id] === option
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/30 hover:bg-muted/30"
                          }`}
                        >
                          {option}
                        </Label>
                      </motion.div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Notes Section */}
                <div className="mb-6">
                  <Label htmlFor="notes" className="text-sm text-muted-foreground">
                    Notes (optional)
                  </Label>
                  <Textarea
                    id="notes"
                    value={notes[currentQuestion.id] || ""}
                    onChange={(e) => setNotes({ ...notes, [currentQuestion.id]: e.target.value })}
                    placeholder="Add any observations, context, or examples you'd like to share."
                    className="mt-2 min-h-[100px] resize-none"
                  />
                </div>

                {/* Remember Tip */}
                <div className="bg-accent/30 rounded-lg p-4 border border-accent">
                  <p className="text-sm text-accent-foreground">
                    💡 <strong>Remember:</strong> Every child develops at their own pace. 
                    These questions help us understand your child's unique journey.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-between mt-8 pt-6 border-t border-border">
            <Button
              variant="outline"
              onClick={handleBack}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {step === 0 ? "Back to Home" : "Back"}
            </Button>

            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {step === 0 ? "Continue to Questions" : currentAreaIndex === developmentalAreas.length - 1 && 
               currentQuestionIndex === currentArea.questions.length - 1
                ? "Complete Assessment"
                : "Next"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </Card>

        {/* Area Progress Indicators */}
        {step > 0 && (
          <div className="mt-6 flex justify-center gap-2">
            {developmentalAreas.map((area, index) => (
              <div
                key={area.id}
                className={`h-1.5 rounded-full transition-all ${
                  index < currentAreaIndex
                    ? "bg-success w-12"
                    : index === currentAreaIndex
                    ? "bg-primary w-16"
                    : "bg-muted w-8"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}