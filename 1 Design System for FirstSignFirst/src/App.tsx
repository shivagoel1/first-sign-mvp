import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Header } from "./components/Header";
import { HomePage } from "./components/HomePage";
import { AssessmentFlow } from "./components/AssessmentFlow";
import { ResultsPage } from "./components/ResultsPage";
import { ParentDashboard } from "./components/ParentDashboard";
import { PhysicianDashboard } from "./components/PhysicianDashboard";
import { ParentLogin } from "./components/ParentLogin";
import { PhysicianLogin } from "./components/PhysicianLogin";

type Page = "home" | "assessment" | "results" | "dashboard" | "physician-dashboard" | "parent-login" | "physician-login";
type UserType = "guest" | "parent" | "physician";

interface AssessmentData {
  childName: string;
  childAge: string;
  responses: Record<string, string>;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [userType, setUserType] = useState<UserType>("guest");
  const [assessmentData, setAssessmentData] = useState<AssessmentData | null>(null);

  const handleNavigate = (page: string) => {
    setCurrentPage(page as Page);
  };

  const handleAssessmentComplete = (data: AssessmentData) => {
    setAssessmentData(data);
    setCurrentPage("results");
  };

  // Demo mode switcher - for demonstration purposes
  const DemoModeSwitcher = () => (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="text-xs text-muted-foreground mb-2">Demo Mode:</p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setUserType("guest");
              setCurrentPage("home");
            }}
            className={`text-xs px-3 py-1 rounded ${
              userType === "guest"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            Guest
          </button>
          <button
            onClick={() => {
              setUserType("parent");
              setCurrentPage("dashboard");
            }}
            className={`text-xs px-3 py-1 rounded ${
              userType === "parent"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            Parent
          </button>
          <button
            onClick={() => {
              setUserType("physician");
              setCurrentPage("physician-dashboard");
            }}
            className={`text-xs px-3 py-1 rounded ${
              userType === "physician"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            Physician
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-orange-50/30">
      <Header 
        onNavigate={handleNavigate} 
        currentPage={currentPage}
        userType={userType}
      />
      
      <AnimatePresence mode="wait">
        {currentPage === "home" && (
          <motion.div
            key="home"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <HomePage onNavigate={handleNavigate} />
          </motion.div>
        )}
        
        {currentPage === "assessment" && (
          <motion.div
            key="assessment"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <AssessmentFlow 
              onComplete={handleAssessmentComplete}
              onBack={() => handleNavigate(userType === "parent" ? "dashboard" : "home")}
            />
          </motion.div>
        )}
        
        {currentPage === "results" && (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
          >
            <ResultsPage 
              childName={assessmentData?.childName || "Your Child"}
              onNavigate={handleNavigate}
            />
          </motion.div>
        )}
        
        {currentPage === "dashboard" && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <ParentDashboard onNavigate={handleNavigate} />
          </motion.div>
        )}
        
        {currentPage === "physician-dashboard" && (
          <motion.div
            key="physician-dashboard"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <PhysicianDashboard onNavigate={handleNavigate} />
          </motion.div>
        )}

        {currentPage === "parent-login" && (
          <motion.div
            key="parent-login"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <ParentLogin 
              onNavigate={handleNavigate}
              onLogin={() => {
                setUserType("parent");
                setCurrentPage("dashboard");
              }}
            />
          </motion.div>
        )}

        {currentPage === "physician-login" && (
          <motion.div
            key="physician-login"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <PhysicianLogin 
              onNavigate={handleNavigate}
              onLogin={() => {
                setUserType("physician");
                setCurrentPage("physician-dashboard");
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <DemoModeSwitcher />
    </div>
  );
}