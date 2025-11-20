import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { ChevronLeft, ChevronRight, X, Download, Flag } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface StorybookPage {
  pageNumber: number;
  milestoneCode: string;
  displayText: string;
  narrativeText: string;
  hasRedFlag: boolean;
  imageUrl: string;
}

interface StorybookViewerProps {
  open: boolean;
  onClose: () => void;
  childName: string;
  assessmentId: string;
}

export function StorybookViewer({ open, onClose, childName, assessmentId }: StorybookViewerProps) {
  const [currentPage, setCurrentPage] = useState(0);

  // Mock storybook data
  const storybookPages: StorybookPage[] = [
    {
      pageNumber: 1,
      milestoneCode: "SE-001",
      displayText: "Social Smiles & Connection",
      narrativeText: `${childName} lights up the room with warm smiles! Their ability to share joy with everyone around them shows wonderful social-emotional development. These precious moments of connection are building blocks for future relationships.`,
      hasRedFlag: false,
      imageUrl: "https://images.unsplash.com/photo-1588495644868-1416d25d8b33?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYXBweSUyMGJhYnklMjBzbWlsaW5nfGVufDF8fHx8MTc2MzMyNjkzOHww&ixlib=rb-4.1.0&q=80&w=1080"
    },
    {
      pageNumber: 2,
      milestoneCode: "LC-003",
      displayText: "Language Development Journey",
      narrativeText: `${childName} is working on communication skills in their own unique way. Keep encouraging them with simple words, songs, and lots of conversation. Every child develops at their own pace, and your support makes all the difference!`,
      hasRedFlag: true,
      imageUrl: "https://images.unsplash.com/photo-1556375536-6474fb6a64f0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYWJ5JTIwbGFuZ3VhZ2UlMjBkZXZlbG9wbWVudHxlbnwxfHx8fDE3NjM0MjQ2MTl8MA&ixlib=rb-4.1.0&q=80&w=1080"
    },
    {
      pageNumber: 3,
      milestoneCode: "M-005",
      displayText: "Motor Skills Adventures",
      narrativeText: `${childName} is building strength and coordination every day! From rolling to reaching, each movement is a victory. Encourage plenty of tummy time and safe exploration to support their physical development.`,
      hasRedFlag: false,
      imageUrl: "https://images.unsplash.com/photo-1624104559269-2381ca6b0012?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYWJ5JTIwbW90b3IlMjBza2lsbHMlMjBjcmF3bGluZ3xlbnwxfHx8fDE3NjM0MjQ2MjJ8MA&ixlib=rb-4.1.0&q=80&w=1080"
    },
    {
      pageNumber: 4,
      milestoneCode: "C-007",
      displayText: "Cognitive Growth & Learning",
      narrativeText: `${childName}'s curiosity is blooming! They're discovering cause and effect, recognizing familiar faces, and learning about their world. Support this growth with age-appropriate toys and plenty of interactive playtime.`,
      hasRedFlag: false,
      imageUrl: "https://images.unsplash.com/photo-1633219664515-2441564d0cc4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0b2RkbGVyJTIwcGxheWluZyUyMGVkdWNhdGlvbmFsfGVufDF8fHx8MTc2MzQyNDYxN3ww&ixlib=rb-4.1.0&q=80&w=1080"
    }
  ];

  const goToNextPage = () => {
    if (currentPage < storybookPages.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const page = storybookPages[currentPage];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] p-0 gap-0 overflow-hidden flex flex-col bg-white">
        {/* Accessible DialogHeader - visually hidden but present for screen readers */}
        <DialogHeader className="sr-only">
          <DialogTitle>{childName}'s Development Story - Page {currentPage + 1} of {storybookPages.length}</DialogTitle>
          <DialogDescription>
            Viewing developmental milestone storybook for assessment {assessmentId}. Use Previous and Next buttons to navigate between pages.
          </DialogDescription>
        </DialogHeader>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-orange-100 flex-shrink-0 bg-gradient-to-r from-orange-50 via-white to-blue-50">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h2 className="text-2xl mb-1 bg-gradient-to-r from-primary to-secondary-accent bg-clip-text text-transparent">{childName}'s Development Story</h2>
              <p className="text-sm text-muted-foreground">Assessment {assessmentId}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-white border-orange-200 text-primary">
              Page {currentPage + 1} of {storybookPages.length}
            </Badge>
            <Badge variant="outline" className="bg-white border-blue-200 text-secondary-accent">
              {page.milestoneCode}
            </Badge>
            {page.hasRedFlag && (
              <Badge className="bg-warning/10 text-warning border-warning/30">
                <Flag className="w-3 h-3 mr-1" />
                Needs Attention
              </Badge>
            )}
          </div>
        </div>

        {/* Storybook Page Content */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-br from-orange-50/30 via-white to-blue-50/30">
          <div className="p-8">
            <Card className="overflow-hidden shadow-lg border-orange-100">
              {/* Image */}
              <div className="aspect-video bg-gradient-to-br from-orange-100 to-blue-100 relative overflow-hidden">
                <ImageWithFallback
                  src={page.imageUrl}
                  alt={page.displayText}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-md border border-orange-100">
                  <p className="text-xs uppercase tracking-wide text-primary">{page.milestoneCode}</p>
                </div>
              </div>

              {/* Content */}
              <div className="p-8 bg-white">
                <h3 className="text-3xl mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">{page.displayText}</h3>
                <p className="text-lg leading-relaxed text-foreground/80">
                  {page.narrativeText}
                </p>

                {page.hasRedFlag && (
                  <div className="mt-6 p-4 bg-warning/5 border border-warning/30 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Flag className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-warning mb-1">Attention Recommended</p>
                        <p className="text-sm text-muted-foreground">
                          Your pediatrician has identified this as an area to monitor or discuss further. This doesn't necessarily indicate a problem, but it's worth bringing up at your next visit.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 border-t border-orange-100 flex-shrink-0 bg-gradient-to-r from-orange-50/50 to-blue-50/50">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={goToPrevPage}
              disabled={currentPage === 0}
              className="bg-white border-orange-200 hover:bg-orange-50 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <div className="flex items-center gap-2">
              {storybookPages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPage(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentPage
                      ? "bg-gradient-to-r from-primary to-orange-700 w-8 shadow-sm"
                      : "bg-muted-foreground/30 hover:bg-primary/50 w-2"
                  }`}
                  aria-label={`Go to page ${index + 1}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={goToNextPage}
                disabled={currentPage === storybookPages.length - 1}
                className="bg-white border-orange-200 hover:bg-orange-50 disabled:opacity-50"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                className="bg-gradient-to-r from-primary to-orange-700 hover:from-primary/90 hover:to-orange-700/90 text-white shadow-md hover:shadow-lg transition-all"
                onClick={() => alert("Downloading PDF...")}
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}