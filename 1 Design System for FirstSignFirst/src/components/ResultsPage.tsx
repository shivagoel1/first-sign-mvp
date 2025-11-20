import { BookOpen, CheckCircle, Download, Home, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";

interface ResultsPageProps {
  childName: string;
  onNavigate: (page: string) => void;
}

export function ResultsPage({ childName, onNavigate }: ResultsPageProps) {
  return (
    <div className="min-h-screen py-8 bg-orange-50/30">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-success" />
          </div>
          <h1 className="text-3xl mb-2">Assessment Complete!</h1>
          <p className="text-muted-foreground">
            Thank you for completing {childName}'s developmental assessment
          </p>
        </div>

        {/* Main Results Card */}
        <Card className="p-6 md:p-8 mb-6">
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-primary" />
                <h2 className="text-xl">Your Personalized Storybook</h2>
              </div>
              <p className="text-muted-foreground mb-6">
                We've created a beautiful storybook celebrating {childName}'s developmental journey! 
                This personalized narrative is based on your assessment responses and CDC guidelines.
              </p>

              {/* Storybook Preview */}
              <div className="bg-gradient-to-br from-primary/5 to-secondary/10 rounded-lg p-8 border-2 border-dashed border-primary/20 mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <BookOpen className="w-12 h-12 text-primary" />
                  <div>
                    <h3 className="text-lg">{childName}'s Milestone Journey</h3>
                    <p className="text-sm text-muted-foreground">A Story of Growth and Discovery</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground italic">
                  "Every day, {childName} discovers something new. With bright eyes and curious hands, 
                  they're learning to connect with the world around them. From their first smiles to 
                  their growing vocabulary, each moment is a celebration of development..."
                </p>
              </div>

              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                <Download className="w-4 h-4 mr-2" />
                Download Storybook (PDF)
              </Button>
            </div>

            <div className="border-t border-border pt-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-secondary-accent/10 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-secondary-accent" />
                </div>
                <h3>What Happens Next?</h3>
              </div>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center flex-shrink-0 text-sm">
                    1
                  </div>
                  <div>
                    <h4 className="mb-1">Physician Review</h4>
                    <p className="text-sm text-muted-foreground">
                      A qualified pediatrician will review your assessment and provide expert insights
                    </p>
                    <Badge variant="secondary" className="mt-2">
                      Typically 24-48 hours
                    </Badge>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-secondary-accent text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm">
                    2
                  </div>
                  <div>
                    <h4 className="mb-1">Personalized Recommendations</h4>
                    <p className="text-sm text-muted-foreground">
                      Receive tailored guidance and activity suggestions to support {childName}'s development
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-success text-success-foreground rounded-full flex items-center justify-center flex-shrink-0 text-sm">
                    3
                  </div>
                  <div>
                    <h4 className="mb-1">Track Progress</h4>
                    <p className="text-sm text-muted-foreground">
                      Complete assessments over time to see {childName}'s developmental journey unfold
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Email Notification Card */}
        <Card className="p-6 mb-6 bg-secondary/30 border-secondary-accent/20">
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-secondary-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-secondary-accent" />
            </div>
            <div className="flex-1">
              <h3 className="mb-2">Want to save this assessment?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create a free account to access your dashboard, track multiple children, 
                and receive notifications when your physician review is complete.
              </p>
              <Button variant="outline" className="bg-white">
                Create Free Account
              </Button>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => onNavigate("home")}
          >
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <Button 
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => onNavigate("assessment")}
          >
            Start Another Assessment
          </Button>
        </div>

        {/* Status Badge */}
        <div className="mt-6 p-4 bg-warning-light rounded-lg border border-warning/30 text-center">
          <Badge className="bg-warning text-warning-foreground mb-2">
            Pending Physician Review
          </Badge>
          <p className="text-sm text-warning-foreground">
            Your assessment is in the review queue. Check back soon for expert insights!
          </p>
        </div>
      </div>
    </div>
  );
}