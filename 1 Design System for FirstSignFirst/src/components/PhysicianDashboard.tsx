import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Label } from "./ui/label";
import { ScrollArea } from "./ui/scroll-area";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { 
  Clock, 
  CheckCircle, 
  FileText, 
  Baby, 
  Eye, 
  Flag, 
  User, 
  Calendar, 
  AlertCircle, 
  RefreshCw, 
  Loader2, 
  Send, 
  X, 
  Smile, 
  MessageSquare, 
  Zap,
  UserRound,
  Mail,
  CalendarDays,
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  LogOut
} from "lucide-react";

interface PhysicianDashboardProps {
  onNavigate: (page: string) => void;
}

export function PhysicianDashboard({ onNavigate }: PhysicianDashboardProps) {
  const [selectedAssessment, setSelectedAssessment] = useState<number | null>(null);
  const [physicianNotes, setPhysicianNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Mock data
  const pendingAssessments = [
    {
      id: 1,
      assessmentId: "ASM-001",
      childName: "Shiv",
      childAgeMonths: 18,
      parentName: "Sarah Johnson",
      parentEmail: "sarah.johnson@email.com",
      submissionDate: "November 16, 2025 at 2:30 PM",
      completionDate: "November 16, 2025",
      redFlagCount: 2,
      status: "pending",
      aiReportStatus: "completed",
      aiReportProgress: 100,
      focusArea: "Typically Developing",
      storybook: {
        pages: [
          {
            pageNumber: 1,
            milestoneCode: "SE-001",
            displayText: "Social Smiles",
            narrativeText: "Shiv lights up the room with his warm smiles! He loves sharing joy with everyone around him.",
            hasRedFlag: false,
            imageUrl: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&h=300&fit=crop"
          },
          {
            pageNumber: 2,
            milestoneCode: "LC-003",
            displayText: "Language Development",
            narrativeText: "Shiv is working on his communication skills. Keep encouraging him with simple words and songs!",
            hasRedFlag: true,
            imageUrl: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&h=300&fit=crop"
          }
        ],
        generationCost: "$0.45",
        tokensUsed: 1523,
        imagesGenerated: 8
      },
      redFlags: [
        "Limited verbal communication - Child is not yet speaking in two-word phrases at 18 months",
        "Motor skills delay - Not yet walking independently"
      ],
      responses: [
        {
          category: "Social-Emotional",
          question: "Does your child smile at people?",
          value: "yes",
          notes: "He smiles all the time, especially at family members and when playing peek-a-boo."
        },
        {
          category: "Social-Emotional",
          question: "Does your child show interest in other children?",
          value: "sometimes",
          notes: "He watches other kids at the park but doesn't always try to play with them."
        },
        {
          category: "Language/Communication",
          question: "Does your child babble or make sounds?",
          value: "yes",
          notes: "Lots of babbling, especially 'mama' and 'dada' sounds."
        },
        {
          category: "Language/Communication",
          question: "Does your child point to things they want?",
          value: "no",
          notes: ""
        },
        {
          category: "Motor Skills",
          question: "Can your child sit without support?",
          value: "yes",
          notes: "Sits very well and can play with toys while sitting."
        },
        {
          category: "Motor Skills",
          question: "Does your child walk independently?",
          value: "no",
          notes: "Can pull up to standing but not walking yet. Takes a few steps with support."
        },
        {
          category: "Cognitive",
          question: "Does your child look for hidden objects?",
          value: "sometimes",
          notes: "Plays peek-a-boo and looks for toys that roll away."
        }
      ]
    }
  ];

  const reviewedAssessments = [
    {
      id: 2,
      assessmentId: "ASM-002",
      childName: "Emma",
      childAgeMonths: 24,
      parentName: "Michael Chen",
      reviewedDate: "November 15, 2025",
      status: "approved",
      reviewer: "Dr. Sarah Martinez"
    },
    {
      id: 3,
      assessmentId: "ASM-003",
      childName: "Oliver",
      childAgeMonths: 12,
      parentName: "Jessica Smith",
      reviewedDate: "November 14, 2025",
      status: "approved",
      reviewer: "Dr. Sarah Martinez"
    }
  ];

  const selectedAssessmentData = pendingAssessments.find(a => a.id === selectedAssessment);

  const handleApprove = () => {
    setIsProcessing(true);
    setTimeout(() => {
      alert("Assessment approved! The storybook has been shared with the parent.");
      setIsProcessing(false);
      setSelectedAssessment(null);
      setPhysicianNotes("");
    }, 1500);
  };

  const handleRequestRevision = () => {
    setIsProcessing(true);
    setTimeout(() => {
      alert("Revision requested. The parent will be notified with your notes.");
      setIsProcessing(false);
      setSelectedAssessment(null);
      setPhysicianNotes("");
    }, 1500);
  };

  const handleReject = () => {
    if (confirm("Are you sure you want to reject this assessment?")) {
      setIsProcessing(true);
      setTimeout(() => {
        alert("Assessment rejected. The parent will be notified.");
        setIsProcessing(false);
        setSelectedAssessment(null);
        setPhysicianNotes("");
      }, 1500);
    }
  };

  const handleRegenerateStorybook = () => {
    if (confirm("This will regenerate all images and PDFs. This may take a few minutes. Continue?")) {
      setIsProcessing(true);
      setTimeout(() => {
        alert("Storybook regeneration started. This will take 2-3 minutes.");
        setIsProcessing(false);
      }, 1500);
    }
  };

  const getResponseValueBadge = (value: string) => {
    const colors: Record<string, string> = {
      yes: "bg-success/10 text-success border-success/20",
      no: "bg-destructive/10 text-destructive border-destructive/20",
      sometimes: "bg-warning/10 text-warning border-warning/20",
      not_sure: "bg-muted text-muted-foreground border-border"
    };
    return (
      <Badge className={colors[value] || colors.not_sure}>
        {value.replace("_", " ").toUpperCase()}
      </Badge>
    );
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      "Social-Emotional": Smile,
      "Language/Communication": MessageSquare,
      "Motor Skills": Zap,
      "Cognitive": Baby
    };
    return icons[category] || Baby;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "Social-Emotional": "text-primary bg-primary/10",
      "Language/Communication": "text-secondary-accent bg-secondary-accent/10",
      "Motor Skills": "text-warning bg-warning/10",
      "Cognitive": "text-success bg-success/10"
    };
    return colors[category] || "text-muted bg-muted/10";
  };

  return (
    <div className="min-h-screen py-8 bg-gradient-to-br from-orange-50/30 via-white to-orange-50/20">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="p-8 mb-8 shadow-lg border-primary/20 bg-gradient-to-br from-white via-white to-primary-lighter/30">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Avatar className="w-16 h-16 ring-4 ring-primary/10 shadow-md">
                    <AvatarFallback className="bg-gradient-to-br from-secondary-accent via-primary to-primary text-white text-xl shadow-inner">
                      Dr
                    </AvatarFallback>
                  </Avatar>
                </motion.div>
                <div>
                  <h1 className="text-3xl mb-1 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Welcome, Dr. Martinez</h1>
                  <p className="text-muted-foreground/80 text-base">
                    Review developmental assessments and provide expert guidance
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => alert("Refresh functionality")}
                    className="shadow-sm hover:shadow-md transition-shadow"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => alert("Logout functionality")}
                    className="shadow-sm hover:shadow-md transition-shadow"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </motion.div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid md:grid-cols-4 gap-6 mb-8"
        >
          {[
            { icon: Clock, color: "warning", bgColor: "bg-warning/10", textColor: "text-warning", label: "Pending Review", value: pendingAssessments.length, delay: 0 },
            { icon: CheckCircle, color: "success", bgColor: "bg-success/10", textColor: "text-success", label: "Approved This Week", value: 47, delay: 0.1 },
            { icon: FileText, color: "primary", bgColor: "bg-primary/10", textColor: "text-primary", label: "Revisions Requested", value: 3, delay: 0.2 },
            { icon: Baby, color: "secondary-accent", bgColor: "bg-secondary-accent/10", textColor: "text-secondary-accent", label: "Total Reviewed", value: 234, delay: 0.3 }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: stat.delay }}
              whileHover={{ scale: 1.05, y: -4 }}
            >
              <Card className="p-6 shadow-md hover:shadow-lg transition-all bg-white">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center shadow-sm`}>
                    <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
                  </div>
                  <div>
                    <p className="text-3xl">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Main Content */}
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="pending">
              Pending ({pendingAssessments.length})
            </TabsTrigger>
            <TabsTrigger value="reviewed">
              Reviewed ({reviewedAssessments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <div className="space-y-4">
              {pendingAssessments.map((assessment, index) => (
                <motion.div
                  key={assessment.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  whileHover={{ scale: 1.01 }}
                >
                  <Card className="p-6 shadow-md hover:shadow-lg transition-all bg-white">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <h3 className="text-2xl">{assessment.childName}</h3>
                          <Badge variant="secondary">{assessment.childAgeMonths} months</Badge>
                          {assessment.redFlagCount > 0 && (
                            <Badge className="bg-destructive text-destructive-foreground">
                              <Flag className="w-3 h-3 mr-1" />
                              {assessment.redFlagCount} Red Flag{assessment.redFlagCount !== 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>

                        <div className="grid md:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <User className="w-4 h-4" />
                            <span>Parent: {assessment.parentName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>Submitted: {assessment.submissionDate}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <FileText className="w-4 h-4" />
                            <span>ID: {assessment.assessmentId}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-primary/10 text-primary border-primary/20">
                              {assessment.focusArea}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          size="lg"
                          className="bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all"
                          onClick={() => setSelectedAssessment(assessment.id)}
                        >
                          <Eye className="w-5 h-5 mr-2" />
                          Review Assessment
                        </Button>
                      </motion.div>
                    </div>
                  </Card>
                </motion.div>
              ))}

              {pendingAssessments.length === 0 && (
                <Card className="p-12 text-center shadow-md">
                  <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-success" />
                  </div>
                  <h3 className="text-xl mb-2">All Caught Up!</h3>
                  <p className="text-muted-foreground">
                    No pending assessments at the moment. Great work!
                  </p>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="reviewed">
            <div className="space-y-4">
              {reviewedAssessments.map((assessment, index) => (
                <motion.div
                  key={assessment.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  whileHover={{ scale: 1.01 }}
                >
                  <Card className="p-6 shadow-md hover:shadow-lg transition-all bg-white">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl">{assessment.childName}</h3>
                          <Badge variant="secondary">{assessment.childAgeMonths} months</Badge>
                          <Badge className="bg-success/10 text-success border-success/20">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Approved
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <p>Parent: {assessment.parentName}</p>
                          <p>Reviewed on {assessment.reviewedDate} by {assessment.reviewer}</p>
                          <p>Assessment ID: {assessment.assessmentId}</p>
                        </div>
                      </div>

                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button 
                          variant="outline" 
                          className="shadow-sm hover:shadow-md transition-shadow"
                          onClick={() => setSelectedAssessment(assessment.id)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </motion.div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Review Dialog */}
      <Dialog open={selectedAssessment !== null} onOpenChange={() => setSelectedAssessment(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col bg-white">
          <div className="px-6 pt-6 pb-4 border-b border-border flex-shrink-0 bg-white">
            <DialogHeader>
              <DialogTitle>Review Assessment - {selectedAssessmentData?.assessmentId}</DialogTitle>
              <DialogDescription>
                Review the assessment details, AI-generated storybook, and provide feedback.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto px-6 bg-orange-50/20">
            <div className="space-y-6 py-6">
              {/* Assessment Overview */}
              <Card className="p-6 bg-white border-orange-100 shadow-sm">
                <h3 className="text-lg mb-6">Assessment Overview</h3>
                
                {/* Info Pills */}
                <div className="flex flex-wrap gap-3 mb-6 pb-6 border-b border-border">
                  <Badge variant="outline" className="bg-orange-50/50 px-4 py-2 border-primary/30 text-sm">
                    <UserRound className="w-4 h-4 mr-2 text-primary" />
                    <span className="text-foreground">{selectedAssessmentData?.parentName}</span>
                  </Badge>
                  <Badge variant="outline" className="bg-orange-50/50 px-4 py-2 border-primary/30 text-sm">
                    <Mail className="w-4 h-4 mr-2 text-primary" />
                    <span className="text-foreground">{selectedAssessmentData?.parentEmail}</span>
                  </Badge>
                  <Badge variant="outline" className="bg-orange-50/50 px-4 py-2 border-primary/30 text-sm">
                    <Clock className="w-4 h-4 mr-2 text-primary" />
                    <span className="text-foreground">{selectedAssessmentData?.childAgeMonths} months</span>
                  </Badge>
                  <Badge variant="outline" className="bg-orange-50/50 px-4 py-2 border-primary/30 text-sm">
                    <CalendarDays className="w-4 h-4 mr-2 text-primary" />
                    <span className="text-foreground">{selectedAssessmentData?.completionDate}</span>
                  </Badge>
                </div>

                {/* Fields Grid */}
                <div className="grid md:grid-cols-3 gap-x-8 gap-y-6 mb-6 pb-6 border-b border-border">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Child Name</p>
                    <p className="text-base text-foreground">{selectedAssessmentData?.childName}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Age</p>
                    <p className="text-base text-foreground">{selectedAssessmentData?.childAgeMonths} months</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Parent Name</p>
                    <p className="text-base text-foreground">{selectedAssessmentData?.parentName}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Parent Email</p>
                    <p className="text-base text-foreground break-all">{selectedAssessmentData?.parentEmail}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Submission Date</p>
                    <p className="text-base text-foreground">{selectedAssessmentData?.submissionDate}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Red Flags</p>
                    <div className="flex items-center gap-2">
                      {selectedAssessmentData && selectedAssessmentData.redFlagCount > 0 ? (
                        <>
                          <Flag className="w-4 h-4 text-destructive" />
                          <span className="text-base text-destructive">{selectedAssessmentData.redFlagCount}</span>
                        </>
                      ) : (
                        <span className="text-base text-success">None</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Grid - Assessment ID and Review Status */}
                <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Assessment ID</p>
                    <p className="font-mono text-base text-foreground">{selectedAssessmentData?.assessmentId}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Review Status</p>
                    <Badge className="bg-warning/10 text-warning border-warning/30 px-3 py-1">
                      Awaiting physician review
                    </Badge>
                  </div>
                </div>
              </Card>

              {/* AI Report Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    AI-Generated Storybook Report
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRegenerateStorybook}
                    disabled={isProcessing}
                    className="bg-white"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerate Storybook
                  </Button>
                </div>

                {selectedAssessmentData?.aiReportStatus === "completed" && selectedAssessmentData?.storybook && (
                  <div className="space-y-4">
                    {/* Storybook Pages */}
                    {selectedAssessmentData.storybook.pages.map((page) => (
                      <Card key={page.pageNumber} className="p-6 bg-white border-orange-100 shadow-sm">
                        <div className="flex gap-6">
                          <img
                            src={page.imageUrl}
                            alt={`Page ${page.pageNumber}`}
                            className="w-40 h-30 rounded-lg object-cover flex-shrink-0"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">Page {page.pageNumber}</Badge>
                              <Badge variant="outline" className="bg-white border-primary/20">{page.milestoneCode}</Badge>
                              {page.hasRedFlag && (
                                <Badge className="bg-destructive/10 text-destructive border-destructive/20">
                                  <Flag className="w-3 h-3 mr-1" />
                                  Red Flag
                                </Badge>
                              )}
                            </div>
                            <h4 className="text-lg mb-2 text-foreground">{page.displayText}</h4>
                            <p className="text-muted-foreground">{page.narrativeText}</p>
                          </div>
                        </div>
                      </Card>
                    ))}

                    {/* Cost Metrics */}
                    <Card className="p-4 bg-primary/5 border-primary/10">
                      <p className="text-xs text-muted-foreground">
                        Generation Cost: {selectedAssessmentData.storybook.generationCost} • 
                        Tokens: {selectedAssessmentData.storybook.tokensUsed} • 
                        Images: {selectedAssessmentData.storybook.imagesGenerated}
                      </p>
                    </Card>
                  </div>
                )}

                {selectedAssessmentData?.aiReportStatus === "processing" && (
                  <Card className="p-8 text-center">
                    <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
                    <p className="text-lg mb-2">Generating AI Report...</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedAssessmentData.aiReportProgress}% complete
                    </p>
                  </Card>
                )}

                {selectedAssessmentData?.aiReportStatus === "failed" && (
                  <Card className="p-8 text-center border-destructive/20">
                    <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                    <p className="text-lg mb-2">AI Generation Failed</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      There was an error generating the report. Please try again.
                    </p>
                    <Button variant="outline">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Retry AI Generation
                    </Button>
                  </Card>
                )}

                {selectedAssessmentData?.aiReportStatus === "pending" && (
                  <Card className="p-8 text-center">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg mb-2">AI Report Not Started</p>
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                      <Send className="w-4 h-4 mr-2" />
                      Start AI Generation
                    </Button>
                  </Card>
                )}
              </div>

              {/* Red Flags Section */}
              {selectedAssessmentData && selectedAssessmentData.redFlagCount > 0 && (
                <div>
                  <h3 className="text-lg flex items-center gap-2 mb-4">
                    <Flag className="w-5 h-5 text-destructive" />
                    Red Flags ({selectedAssessmentData.redFlagCount})
                  </h3>
                  <Card className="p-6 border-destructive/20 bg-destructive/5">
                    <ul className="space-y-3">
                      {selectedAssessmentData.redFlags.map((flag, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                          <span>{flag}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                </div>
              )}

              {/* Milestone Responses Section */}
              <div>
                <h3 className="text-lg mb-4">
                  Milestone Responses ({selectedAssessmentData?.responses.length} responses)
                </h3>
                <div className="space-y-4">
                  {["Social-Emotional", "Language/Communication", "Motor Skills", "Cognitive"].map((category) => {
                    const categoryResponses = selectedAssessmentData?.responses.filter(
                      r => r.category === category
                    ) || [];
                    
                    if (categoryResponses.length === 0) return null;
                    
                    const Icon = getCategoryIcon(category);
                    
                    return (
                      <Card key={category} className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getCategoryColor(category)}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <h4 className="text-lg">{category}</h4>
                        </div>
                        <div className="space-y-4">
                          {categoryResponses.map((response, index) => (
                            <div key={index} className="pl-13 border-l-2 border-border pl-4">
                              <div className="flex items-start justify-between gap-4 mb-2">
                                <p className="text-sm font-medium">{response.question}</p>
                                {getResponseValueBadge(response.value)}
                              </div>
                              {response.notes && (
                                <p className="text-sm text-muted-foreground italic">
                                  Note: {response.notes}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Physician Notes Section */}
              <div>
                <Label htmlFor="physician-notes" className="text-lg mb-4 block">
                  Physician Notes & Recommendations
                </Label>
                <Textarea
                  id="physician-notes"
                  value={physicianNotes}
                  onChange={(e) => setPhysicianNotes(e.target.value)}
                  placeholder="Document your clinical observations, recommendations, and guidance for the parent. Include any developmental concerns, suggested activities, or follow-up actions."
                  className="min-h-32"
                />
              </div>

              {/* Review Actions */}
              <Card className="p-6 bg-gradient-to-br from-orange-50/30 to-white border-orange-100">
                <h3 className="text-lg mb-6">Review Actions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedAssessment(null)}
                    disabled={isProcessing}
                    className="w-full h-12 bg-white hover:bg-gray-50 whitespace-nowrap"
                  >
                    <X className="w-4 h-4 mr-2 flex-shrink-0" />
                    Close
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full h-12 border-destructive/30 text-destructive hover:bg-destructive/10 bg-white whitespace-nowrap"
                    onClick={handleReject}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 mr-2 flex-shrink-0 animate-spin" />
                    ) : (
                      <XCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                    )}
                    Reject
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full h-12 border-warning/30 text-warning hover:bg-warning/10 bg-white whitespace-nowrap"
                    onClick={handleRequestRevision}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 mr-2 flex-shrink-0 animate-spin" />
                    ) : (
                      <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                    )}
                    Request Revision
                  </Button>
                  <Button
                    className="w-full h-12 bg-success hover:bg-success/90 text-white shadow-md hover:shadow-lg transition-all whitespace-nowrap"
                    onClick={handleApprove}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 mr-2 flex-shrink-0 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 mr-2 flex-shrink-0" />
                    )}
                    Approve & Share
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}