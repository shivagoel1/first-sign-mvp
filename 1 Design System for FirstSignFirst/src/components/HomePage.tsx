import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Baby, BookOpen, Shield, Sparkles, Heart, CheckCircle, ArrowRight, Clock, Users, Star } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { motion } from "motion/react";

interface HomePageProps {
  onNavigate: (page: string) => void;
}

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.5 }
};

export function HomePage({ onNavigate }: HomePageProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Background Pattern */}
      <section className="relative py-16 md:py-24 lg:py-32 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-primary/20 blur-3xl"></div>
          <div className="absolute top-40 right-20 w-48 h-48 rounded-full bg-warning/20 blur-3xl"></div>
          <div className="absolute bottom-20 left-1/3 w-40 h-40 rounded-full bg-secondary-accent/20 blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 md:px-6 max-w-7xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left: Text Content */}
            <motion.div 
              className="space-y-6 lg:space-y-8"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <motion.div 
                className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full shadow-sm"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <Heart className="w-4 h-4" />
                <span>Trusted by 10,000+ parents</span>
              </motion.div>
              
              <motion.h1 
                className="text-4xl md:text-5xl lg:text-6xl leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                Is your little one developing on track?
              </motion.h1>
              
              <motion.p 
                className="text-lg md:text-xl text-muted-foreground max-w-xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                Get peace of mind with our quick developmental assessment. Receive a personalized 
                storybook and expert pediatrician feedback—all completely free.
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                <Button 
                  size="lg" 
                  onClick={() => onNavigate("assessment")}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground h-12 md:h-14 px-6 md:px-8 shadow-lg hover:shadow-xl transition-all"
                >
                  Start Free Assessment
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </motion.div>
              
              <motion.div 
                className="flex flex-col sm:flex-row sm:flex-wrap gap-4 sm:gap-6 text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.6 }}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                  <span>No signup required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                  <span>Just 10 minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                  <span>100% free</span>
                </div>
              </motion.div>
            </motion.div>
            
            {/* Right: Hero Image */}
            <motion.div 
              className="relative order-first lg:order-last"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="absolute -inset-4 bg-gradient-to-br from-primary/20 to-warning/20 rounded-3xl blur-2xl"></div>
              <div className="relative rounded-3xl shadow-2xl overflow-hidden h-[400px] md:h-[500px]">
                <ImageWithFallback
                  src="https://images.unsplash.com/flagged/photo-1558411158-9d2bc0cea41c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdXRlJTIwYmFieSUyMHNtaWxpbmd8ZW58MXx8fHwxNzYzNDQzNDY2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Happy baby developmental milestone"
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* What You'll Get Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 max-w-6xl">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl mb-4">What you'll get</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to track your child's development
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="p-8 border-2 hover:border-primary/30 transition-all text-center shadow-lg hover:shadow-xl bg-white h-full">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-md">
                  <Baby className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl mb-4">Milestone Assessment</h3>
                <p className="text-muted-foreground">
                  Simple questions covering social, language, motor, and cognitive development for your child's age
                </p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="p-8 border-2 hover:border-primary/30 transition-all text-center shadow-lg hover:shadow-xl bg-white h-full">
                <div className="w-16 h-16 bg-secondary-accent/10 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-md">
                  <BookOpen className="w-8 h-8 text-secondary-accent" />
                </div>
                <h3 className="text-xl mb-4">Personalized Storybook</h3>
                <p className="text-muted-foreground">
                  A beautiful PDF storybook celebrating your child's unique journey and achievements
                </p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="p-8 border-2 hover:border-primary/30 transition-all text-center shadow-lg hover:shadow-xl bg-white h-full">
                <div className="w-16 h-16 bg-success/10 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-md">
                  <Shield className="w-8 h-8 text-success" />
                </div>
                <h3 className="text-xl mb-4">Pediatrician Review</h3>
                <p className="text-muted-foreground">
                  Expert feedback and recommendations from a qualified pediatrician within 48 hours
                </p>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative py-20 overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute bottom-10 right-10 w-64 h-64 rounded-full bg-primary/20 blur-3xl"></div>
          <div className="absolute top-20 left-10 w-48 h-48 rounded-full bg-warning/20 blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 md:px-6 max-w-6xl relative z-10">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl mb-4">How it works</h2>
            <p className="text-lg text-muted-foreground">
              Three simple steps, results in minutes
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all border border-border h-full flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-xl mb-6 shadow-lg">
                  1
                </div>
                <h3 className="text-xl mb-4 text-center">Answer questions about your child</h3>
                <p className="text-muted-foreground text-center">
                  Share what your child can do—from smiling and playing to talking and walking. Takes about 10 minutes!
                </p>
              </div>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all border border-border h-full flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-xl mb-6 shadow-lg">
                  2
                </div>
                <h3 className="text-xl mb-4 text-center">Get your personalized storybook</h3>
                <p className="text-muted-foreground text-center">
                  Receive a beautifully designed storybook celebrating your child's milestones instantly.
                </p>
              </div>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all border border-border h-full flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-xl mb-6 shadow-lg">
                  3
                </div>
                <h3 className="text-xl mb-4 text-center">Receive expert guidance</h3>
                <p className="text-muted-foreground text-center">
                  A qualified pediatrician reviews and provides personalized recommendations.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 bg-primary/5">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <Sparkles className="w-12 h-12 text-primary mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl mb-4">Why parents love FirstSignFirst</h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="p-8 bg-white text-center h-full">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Heart className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl mb-3">Supportive, not scary</h3>
                <p className="text-muted-foreground">
                  We celebrate every milestone and provide gentle, encouraging guidance
                </p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="p-8 bg-white text-center h-full">
                <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
                  <Shield className="w-8 h-8 text-success" />
                </div>
                <h3 className="text-xl mb-3">Expert-backed</h3>
                <p className="text-muted-foreground">
                  Built on CDC guidelines and reviewed by real pediatricians
                </p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="p-8 bg-white text-center h-full">
                <div className="w-16 h-16 rounded-full bg-secondary-accent/10 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-8 h-8 text-secondary-accent" />
                </div>
                <h3 className="text-xl mb-3">Quick and easy</h3>
                <p className="text-muted-foreground">
                  No long forms or complicated medical terms—just simple questions
                </p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="p-8 bg-white text-center h-full">
                <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-8 h-8 text-warning" />
                </div>
                <h3 className="text-xl mb-3">Beautiful memories</h3>
                <p className="text-muted-foreground">
                  Keep your child's storybook as a precious keepsake of their journey
                </p>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl mb-6">
              Ready to get started?
            </h2>
            <p className="text-xl text-muted-foreground mb-10">
              Your child's developmental journey starts here. No commitment required.
            </p>
            <Button 
              size="lg" 
              onClick={() => onNavigate("assessment")}
              className="bg-primary hover:bg-primary/90 text-primary-foreground h-14 px-8"
            >
              Start Free Assessment
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <p className="text-muted-foreground mt-6">
              Takes 10 minutes • No login required • 100% free
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}