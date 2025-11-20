import { BookOpen, Calendar, Download, Eye, Plus, RefreshCw, LogOut, User, TrendingUp, Baby, FileText, CheckCircle, Clock, AlertCircle, Flag, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { motion } from "motion/react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { StorybookViewer } from "./StorybookViewer";

interface ParentDashboardProps {
  onNavigate: (page: string) => void;
}

export function ParentDashboard({ onNavigate }: ParentDashboardProps) {
  const [selectedChildId, setSelectedChildId] = useState<number | null>(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null);
  const [showStorybook, setShowStorybook] = useState(false);

  // Mock data
  const parentName = "Sarah";
  const children = [
    {
      id: 1,
      name: "Shiv",
      ageMonths: 18,
      gender: "Male",
      assessmentCount: 3,
      assessments: [
        {
          id: "ASM-001",
          completionDate: "November 15, 2025",
          status: "approved",
          statusMessage: "Assessment approved. Storybook is ready!",
          storybookReady: true,
          pdfAvailable: true
        },
        {
          id: "ASM-002",
          completionDate: "November 10, 2025",
          status: "generating",
          statusMessage: "AI is creating your personalized storybook. This usually takes 2-3 minutes.",
          storybookReady: false,
          pdfAvailable: false
        },
        {
          id: "ASM-003",
          completionDate: "November 8, 2025",
          status: "pending",
          statusMessage: "Your assessment has been submitted and is waiting for a pediatrician to review.",
          storybookReady: false,
          pdfAvailable: false
        }
      ]
    },
    {
      id: 2,
      name: "Emma",
      ageMonths: 24,
      gender: "Female",
      assessmentCount: 2,
      assessments: [
        {
          id: "ASM-004",
          completionDate: "November 12, 2025",
          status: "needs-revision",
          statusMessage: "The pediatrician has requested additional information. Please review and update your assessment.",
          storybookReady: false,
          pdfAvailable: false
        },
        {
          id: "ASM-005",
          completionDate: "October 20, 2025",
          status: "approved",
          statusMessage: "Assessment approved. Storybook is ready!",
          storybookReady: true,
          pdfAvailable: true
        }
      ]
    }
  ];

  const selectedChild = children.find(c => c.id === selectedChildId);
  const totalChildren = children.length;
  const totalAssessments = children.reduce((sum, child) => sum + child.assessmentCount, 0);
  const mostRecentDate = children[0]?.assessments[0]?.completionDate || "N/A";
  const completionPercentage = 85;

  const hasIncompleteAssessment = selectedChild?.assessments.some(a => a.status === "generating" || a.status === "pending");

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-success/10 text-success border-success/20">Approved</Badge>;
      case "pending":
        return <Badge className="bg-warning/10 text-warning border-warning/20">Pending Review</Badge>;
      case "generating":
        return <Badge className="bg-secondary-accent/10 text-secondary-accent border-secondary-accent/20">Generating Storybook</Badge>;
      case "awaiting-review":
        return <Badge className="bg-primary/10 text-primary border-primary/20">Awaiting Review</Badge>;
      case "needs-revision":
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Needs Revision</Badge>;
      case "rejected":
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen py-8 bg-gradient-to-br from-orange-50/50 via-white to-orange-50/30">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="p-8 mb-8 shadow-lg border-orange-100 bg-gradient-to-br from-white via-white to-orange-50/20">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
              <div className="flex items-center gap-4">
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Avatar className="w-16 h-16 ring-4 ring-primary/10 shadow-md">
                    <AvatarFallback className="bg-gradient-to-br from-primary via-primary to-orange-700 text-white text-xl shadow-inner">
                      {parentName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </motion.div>
                <div>
                  <h1 className="text-3xl mb-1 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Welcome back, {parentName}!</h1>
                  <p className="text-muted-foreground/80 text-base">
                    Track your children's developmental milestones
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="shadow-sm hover:shadow-md transition-shadow"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
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

            <div className="grid md:grid-cols-2 gap-4">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-primary to-orange-700 hover:from-primary/90 hover:to-orange-700/90 text-white h-14 shadow-lg hover:shadow-xl transition-all"
                  onClick={() => onNavigate("assessment")}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Start New Assessment
                </Button>
              </motion.div>
              {hasIncompleteAssessment && (
                <motion.div 
                  whileHover={{ scale: 1.02 }} 
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full border-2 border-primary/30 text-primary hover:bg-primary/10 hover:border-primary h-14 shadow-md hover:shadow-lg transition-all bg-white"
                    onClick={() => onNavigate("assessment")}
                  >
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Continue Latest Assessment
                  </Button>
                </motion.div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Family Snapshot */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="p-8 mb-8 shadow-lg border-orange-100">
            <h2 className="text-2xl mb-6">Family Snapshot</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: User, color: "primary", label: "Selected Child", value: selectedChild?.name || "-" },
                { icon: TrendingUp, color: "success", label: "Progress", value: `${completionPercentage}%` },
                { icon: Baby, color: "secondary-accent", label: "Children", value: totalChildren },
                { icon: FileText, color: "warning", label: "Assessments", value: totalAssessments }
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-4 group"
                >
                  <div className={`w-12 h-12 bg-${stat.color}/10 rounded-xl flex items-center justify-center group-hover:bg-${stat.color}/20 transition-colors`}>
                    <stat.icon className={`w-6 h-6 text-${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground">
                <Calendar className="w-4 h-4 inline mr-2" />
                Most recent assessment: {mostRecentDate}
              </p>
            </div>
          </Card>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Your Children Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl mb-6">Your Children</h2>
            <div className="space-y-4">
              {children.length === 0 ? (
                <Card className="p-8 text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Baby className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="mb-2">No children registered yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start by creating your first assessment
                  </p>
                  <Button
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={() => onNavigate("assessment")}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Assessment
                  </Button>
                </Card>
              ) : (
                children.map((child, index) => (
                  <motion.div
                    key={child.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <Card
                      className={`p-6 cursor-pointer transition-all shadow-md hover:shadow-lg ${
                        selectedChildId === child.id
                          ? "border-2 border-primary bg-gradient-to-br from-primary/5 to-primary/10"
                          : "hover:border-primary/30 bg-white"
                      }`}
                      onClick={() => setSelectedChildId(child.id)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10 ring-2 ring-primary/20">
                            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
                              {child.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="text-lg">{child.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {child.ageMonths} months • {child.gender}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          {child.assessmentCount} assessment{child.assessmentCount !== 1 ? 's' : ''}
                        </p>
                        <Button
                          size="sm"
                          variant={selectedChildId === child.id ? "default" : "ghost"}
                          className={selectedChildId === child.id ? "bg-primary hover:bg-primary/90 text-primary-foreground" : ""}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedChildId(child.id);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>

          {/* Assessments List */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl">
                {selectedChild ? `${selectedChild.name}'s Assessments` : "Select a Child"}
              </h2>
              {selectedChild && (
                <Button
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={() => onNavigate("assessment")}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Assessment
                </Button>
              )}
            </div>

            <div className="space-y-4">
              {!selectedChild ? (
                <Card className="p-12 text-center shadow-md">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Eye className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="mb-2">No child selected</h3>
                  <p className="text-muted-foreground">
                    Select a child from the left to view their assessments
                  </p>
                </Card>
              ) : selectedChild.assessments.length === 0 ? (
                <Card className="p-12 text-center shadow-md">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="mb-2">No assessments yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Start tracking {selectedChild.name}'s developmental milestones
                  </p>
                  <Button
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={() => onNavigate("assessment")}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Assessment
                  </Button>
                </Card>
              ) : (
                selectedChild.assessments.map((assessment, index) => (
                  <motion.div
                    key={assessment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    whileHover={{ scale: 1.01 }}
                  >
                    <Card className="p-6 shadow-md hover:shadow-lg transition-shadow bg-white">
                      <div className="flex flex-col gap-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg">Assessment {assessment.id}</h3>
                              {getStatusBadge(assessment.status)}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              <span>{assessment.completionDate}</span>
                            </div>
                          </div>
                        </div>

                        <div className={`p-4 rounded-lg border ${
                          assessment.status === "approved" ? "bg-gradient-to-r from-success/5 to-success/10 border-success/20" :
                          assessment.status === "generating" ? "bg-gradient-to-r from-secondary-accent/5 to-secondary-accent/10 border-secondary-accent/20" :
                          assessment.status === "needs-revision" ? "bg-gradient-to-r from-destructive/5 to-destructive/10 border-destructive/20" :
                          "bg-gradient-to-r from-warning/5 to-warning/10 border-warning/20"
                        }`}>
                          <p className="text-sm">{assessment.statusMessage}</p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="whitespace-nowrap"
                            onClick={() => setSelectedAssessmentId(assessment.id)}
                          >
                            <Eye className="w-4 h-4 mr-2 flex-shrink-0" />
                            View Details
                          </Button>
                          {assessment.storybookReady && (
                            <Button
                              size="sm"
                              className="bg-secondary-accent hover:bg-secondary-accent/90 text-white whitespace-nowrap"
                              onClick={() => setShowStorybook(true)}
                            >
                              <BookOpen className="w-4 h-4 mr-2 flex-shrink-0" />
                              View Storybook
                            </Button>
                          )}
                          {assessment.pdfAvailable && (
                            <Button
                              size="sm"
                              className="bg-primary hover:bg-primary/90 text-primary-foreground whitespace-nowrap"
                              onClick={() => alert("Downloading PDF...")}
                            >
                              <Download className="w-4 h-4 mr-2 flex-shrink-0" />
                              Download PDF
                            </Button>
                          )}
                          {assessment.status === "generating" && (
                            <div className="flex items-center gap-2 px-3 py-2 bg-secondary-accent/10 rounded-md">
                              <div className="w-4 h-4 border-2 border-secondary-accent border-t-transparent rounded-full animate-spin" />
                              <span className="text-sm text-secondary-accent">Storybook in progress...</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        {/* Assessment Details Dialog */}
        {selectedAssessmentId && (
          <Dialog open={!!selectedAssessmentId} onOpenChange={() => setSelectedAssessmentId(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 bg-white">
              <div className="px-6 pt-6 pb-4 border-b border-orange-100 bg-gradient-to-r from-orange-50 via-white to-blue-50">
                <DialogHeader>
                  <DialogTitle className="text-2xl bg-gradient-to-r from-primary to-secondary-accent bg-clip-text text-transparent">
                    Assessment Details
                  </DialogTitle>
                  <DialogDescription className="text-sm">
                    View comprehensive information about this assessment
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="flex-1 overflow-y-auto px-6 bg-gradient-to-br from-orange-50/20 via-white to-blue-50/20">
                <div className="space-y-6 py-6">
                  {/* Status Overview */}
                  <Card className="p-6 bg-gradient-to-br from-orange-50/50 to-white border-orange-100 shadow-sm">
                    <h3 className="text-lg mb-4 text-primary">Status Overview</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Current Status</p>
                        <div className="flex items-center gap-3">
                          {selectedChild?.assessments.find(a => a.id === selectedAssessmentId) && 
                            getStatusBadge(selectedChild.assessments.find(a => a.id === selectedAssessmentId)!.status)
                          }
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Status Message</p>
                        <p className="text-sm text-foreground">
                          {selectedChild?.assessments.find(a => a.id === selectedAssessmentId)?.statusMessage}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Completion Date</p>
                        <p className="text-sm flex items-center gap-2 text-foreground">
                          <Calendar className="w-4 h-4 text-primary" />
                          {selectedChild?.assessments.find(a => a.id === selectedAssessmentId)?.completionDate}
                        </p>
                      </div>
                    </div>
                  </Card>

                  {/* Child Information */}
                  <Card className="p-6 bg-white border-orange-100 shadow-sm">
                    <h3 className="text-lg mb-4 text-primary">Child Information</h3>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs uppercase text-muted-foreground mb-1 tracking-wide">Child Name</p>
                        <p className="font-medium text-foreground">{selectedChild?.name}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-muted-foreground mb-1 tracking-wide">Age</p>
                        <p className="font-medium text-foreground">{selectedChild?.ageMonths} months</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-muted-foreground mb-1 tracking-wide">Gender</p>
                        <p className="font-medium text-foreground">{selectedChild?.gender}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-muted-foreground mb-1 tracking-wide">Assessment ID</p>
                        <p className="font-mono font-medium text-foreground">{selectedAssessmentId}</p>
                      </div>
                    </div>
                  </Card>

                  {/* Assessment Summary */}
                  <Card className="p-6 bg-white border-orange-100 shadow-sm">
                    <h3 className="text-lg mb-4 text-primary">Assessment Summary</h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                        <p className="text-2xl mb-1 text-primary">24</p>
                        <p className="text-xs text-muted-foreground">Questions Answered</p>
                      </div>
                      <div className="p-4 bg-success/5 rounded-lg border border-success/20">
                        <p className="text-2xl mb-1 text-success">18</p>
                        <p className="text-xs text-muted-foreground">Met Milestones</p>
                      </div>
                      <div className="p-4 bg-warning/5 rounded-lg border border-warning/20">
                        <p className="text-2xl mb-1 text-warning">4</p>
                        <p className="text-xs text-muted-foreground">In Progress</p>
                      </div>
                      <div className="p-4 bg-destructive/5 rounded-lg border border-destructive/20">
                        <p className="text-2xl mb-1 text-destructive">2</p>
                        <p className="text-xs text-muted-foreground">Needs Attention</p>
                      </div>
                    </div>
                  </Card>

                  {/* Next Steps */}
                  <Card className="p-6 bg-gradient-to-br from-blue-50/50 to-white border-blue-100 shadow-sm">
                    <h3 className="text-lg mb-4 flex items-center gap-2 text-secondary-accent">
                      <AlertCircle className="w-5 h-5 text-secondary-accent" />
                      Next Steps
                    </h3>
                    <ul className="space-y-3 text-sm">{selectedChild?.assessments.find(a => a.id === selectedAssessmentId)?.status === "pending" && (
                        <>
                          <li className="flex items-start gap-3">
                            <Clock className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                            <span className="text-foreground">Your assessment is awaiting physician review. We'll notify you when it's ready.</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                            <span className="text-foreground">Average review time is 1-2 business days.</span>
                          </li>
                        </>
                      )}
                      {selectedChild?.assessments.find(a => a.id === selectedAssessmentId)?.status === "generating" && (
                        <>
                          <li className="flex items-start gap-3">
                            <Clock className="w-4 h-4 text-secondary-accent mt-0.5 flex-shrink-0" />
                            <span className="text-foreground">AI is generating your personalized storybook. This usually takes 2-3 minutes.</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <RefreshCw className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                            <span className="text-foreground">Refresh this page to check the latest status.</span>
                          </li>
                        </>
                      )}
                      {selectedChild?.assessments.find(a => a.id === selectedAssessmentId)?.status === "approved" && (
                        <>
                          <li className="flex items-start gap-3">
                            <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                            <span className="text-foreground">Your assessment has been approved! The storybook is ready to view and download.</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <BookOpen className="w-4 h-4 text-secondary-accent mt-0.5 flex-shrink-0" />
                            <span className="text-foreground">Click "View Storybook" to see your child's personalized developmental story.</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <Download className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                            <span className="text-foreground">Download the PDF to keep a permanent copy for your records.</span>
                          </li>
                        </>
                      )}
                      {selectedChild?.assessments.find(a => a.id === selectedAssessmentId)?.status === "needs-revision" && (
                        <>
                          <li className="flex items-start gap-3">
                            <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                            <span className="text-foreground">The pediatrician has requested additional information to complete the assessment.</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <FileText className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                            <span className="text-foreground">Please review the physician's notes and update your responses as needed.</span>
                          </li>
                        </>
                      )}
                    </ul>
                  </Card>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3 pb-6">
                    {selectedChild?.assessments.find(a => a.id === selectedAssessmentId)?.storybookReady && (
                      <>
                        <Button
                          className="bg-secondary-accent hover:bg-secondary-accent/90 text-white shadow-md hover:shadow-lg transition-all whitespace-nowrap"
                          onClick={() => {
                            setShowStorybook(true);
                            setSelectedAssessmentId(null);
                          }}
                        >
                          <BookOpen className="w-4 h-4 mr-2 flex-shrink-0" />
                          View Storybook
                        </Button>
                        <Button
                          className="bg-gradient-to-r from-primary to-orange-700 hover:from-primary/90 hover:to-orange-700/90 text-white shadow-md hover:shadow-lg transition-all whitespace-nowrap"
                          onClick={() => alert("Downloading PDF...")}
                        >
                          <Download className="w-4 h-4 mr-2 flex-shrink-0" />
                          Download PDF
                        </Button>
                      </>
                    )}
                    {selectedChild?.assessments.find(a => a.id === selectedAssessmentId)?.status === "needs-revision" && (
                      <Button
                        className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all whitespace-nowrap"
                        onClick={() => {
                          setSelectedAssessmentId(null);
                          onNavigate("assessment");
                        }}
                      >
                        <FileText className="w-4 h-4 mr-2 flex-shrink-0" />
                        Update Assessment
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      className="bg-white border-orange-200 hover:bg-orange-50 whitespace-nowrap"
                      onClick={() => setSelectedAssessmentId(null)}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Storybook Viewer */}
        <StorybookViewer
          open={showStorybook}
          onClose={() => setShowStorybook(false)}
          childName={selectedChild?.name || ""}
          assessmentId={selectedAssessmentId || "ASM-001"}
        />
      </div>
    </div>
  );
}