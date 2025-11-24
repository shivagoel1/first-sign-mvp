'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Header } from '@/components/header'
import { ImageWithFallback } from '@/components/figma/image-with-fallback'
import {
  ArrowRight,
  Baby,
  BookOpen,
  Shield,
  CheckCircle,
  Sparkles,
  Heart,
  HelpCircle,
  Clock,
  Users,
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden pt-16">
      <Header userType="guest" currentPath="/" />
      
      {/* Hero Section with Background Pattern */}
      <section className="relative py-12 md:py-16 lg:py-20 overflow-hidden w-full">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-30 pointer-events-none overflow-hidden">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-primary/20 blur-3xl"></div>
          <div className="absolute top-40 right-20 w-48 h-48 rounded-full bg-warning/20 blur-3xl"></div>
          <div className="absolute bottom-20 left-1/3 w-40 h-40 rounded-full bg-secondary-accent/20 blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 md:px-6 max-w-7xl relative z-10 w-full">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-center">
            {/* Left: Text Content */}
            <motion.div 
              className="space-y-5 lg:space-y-6"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <motion.div 
                className="flex flex-wrap items-center gap-3"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full shadow-sm text-sm font-medium">
                  <Heart className="w-3.5 h-3.5" />
                  <span>Trusted by 10,000+ parents</span>
                </div>
                <div className="inline-flex items-center gap-2 bg-success/10 text-success px-3 py-1.5 rounded-full shadow-sm text-sm font-medium">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Reviewed by Board-Certified Pediatricians</span>
                </div>
              </motion.div>
              
              <motion.h1 
                className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight bg-gradient-to-r from-primary via-orange-600 to-primary bg-clip-text text-transparent"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                Track Your Child's Growth Journey
              </motion.h1>
              
              <motion.p 
                className="text-base md:text-lg text-muted-foreground max-w-xl leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                <span className="font-semibold text-foreground">Every child develops at their own pace.</span> Get peace of mind with our free, physician-reviewed developmental assessment and receive a personalized storybook celebrating your little one's unique milestones.
              </motion.p>
              
              <motion.div
                className="flex flex-col sm:flex-row gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                <Button 
                  size="lg" 
                  asChild
                  className="bg-gradient-to-r from-primary to-orange-700 hover:from-primary/90 hover:to-orange-700/90 text-white h-11 md:h-12 px-6 md:px-8 shadow-xl hover:shadow-2xl transition-all text-sm md:text-base font-semibold"
                >
                  <Link href="/assessment">
                    Get Your Free Assessment
                    <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2" />
                  </Link>
                </Button>
                <Button 
                  variant="outline"
                  size="lg"
                  asChild
                  className="h-11 md:h-12 px-6 md:px-8 border-2 text-sm md:text-base"
                >
                  <Link href="/#faq">
                    Learn More
                  </Link>
                </Button>
              </motion.div>
              
              <motion.div 
                className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4 text-sm text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.6 }}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                  <span>No signup required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                  <span>Just 10 minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
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
              <div className="absolute -inset-4 bg-gradient-to-br from-primary/30 via-warning/20 to-secondary-accent/30 rounded-3xl blur-3xl"></div>
              <div className="relative rounded-3xl shadow-2xl overflow-hidden h-[280px] md:h-[360px] lg:h-[420px] border-4 border-white/50">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800&q=90"
                  alt="Parent and child celebrating developmental milestones together"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-transparent"></div>
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-xl border border-primary/20">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary to-orange-700 rounded-full flex items-center justify-center shadow-lg">
                        <Sparkles className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground">Personalized Storybook</p>
                        <p className="text-xs text-muted-foreground">AI-generated, physician-reviewed</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* What You'll Get Section */}
      <section id="features" className="py-20 bg-gradient-to-br from-orange-50/50 via-white to-orange-50/30 w-full overflow-hidden scroll-mt-24">
        <div className="container mx-auto px-4 max-w-6xl w-full">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">What You&apos;ll Receive</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-orange-700 bg-clip-text text-transparent">
              What you&apos;ll get
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to track your child&apos;s development
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 w-full">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -5 }}
              className="w-full"
            >
              <Card className="p-8 border-2 border-primary/20 hover:border-primary/50 transition-all text-center shadow-lg hover:shadow-2xl bg-gradient-to-br from-white to-primary/5 h-full group w-full">
                <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg group-hover:scale-110 transition-transform">
                  <Baby className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Milestone Assessment</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Simple questions covering social, language, motor, and cognitive development for your child&apos;s age
                </p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ y: -5 }}
              className="w-full"
            >
              <Card className="p-8 border-2 border-secondary-accent/20 hover:border-secondary-accent/50 transition-all text-center shadow-lg hover:shadow-2xl bg-gradient-to-br from-white to-secondary-accent/5 h-full group w-full">
                <div className="w-20 h-20 bg-gradient-to-br from-secondary-accent/20 to-secondary-accent/10 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg group-hover:scale-110 transition-transform">
                  <BookOpen className="w-10 h-10 text-secondary-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Personalized Storybook</h3>
                <p className="text-muted-foreground leading-relaxed">
                  A beautiful PDF storybook celebrating your child&apos;s unique journey and achievements
                </p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ y: -5 }}
              className="w-full"
            >
              <Card className="p-8 border-2 border-success/20 hover:border-success/50 transition-all text-center shadow-lg hover:shadow-2xl bg-gradient-to-br from-white to-success/5 h-full group w-full">
                <div className="w-20 h-20 bg-gradient-to-br from-success/20 to-success/10 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg group-hover:scale-110 transition-transform">
                  <Shield className="w-10 h-10 text-success" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Pediatrician Review</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Expert feedback and recommendations from a qualified pediatrician within 48 hours
                </p>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative py-20 overflow-hidden bg-gradient-to-br from-white via-orange-50/20 to-white w-full scroll-mt-24">
        {/* Decorative background elements */}
        <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
          <div className="absolute bottom-10 right-10 w-64 h-64 rounded-full bg-primary/20 blur-3xl"></div>
          <div className="absolute top-20 left-10 w-48 h-48 rounded-full bg-warning/20 blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 md:px-6 max-w-6xl relative z-10 w-full">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">Simple Process</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-orange-700 bg-clip-text text-transparent">
              How it works
            </h2>
            <p className="text-lg text-muted-foreground">
              Three simple steps, results in minutes
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 w-full">
            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -5 }}
              className="w-full"
            >
              <div className="bg-gradient-to-br from-white to-primary/5 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all border-2 border-primary/20 h-full flex flex-col items-center group w-full">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-orange-700 text-white flex items-center justify-center text-2xl font-bold mb-6 shadow-xl group-hover:scale-110 transition-transform">
                  1
                </div>
                <h3 className="text-xl font-semibold mb-4 text-center">Answer questions about your child</h3>
                <p className="text-muted-foreground text-center leading-relaxed">
                  Share what your child can do—from smiling and playing to talking and walking. Takes about 10 minutes!
                </p>
                <div className="mt-4 flex items-center gap-2 text-sm text-primary">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium">~10 minutes</span>
                </div>
              </div>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ y: -5 }}
              className="w-full"
            >
              <div className="bg-gradient-to-br from-white to-secondary-accent/5 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all border-2 border-secondary-accent/20 h-full flex flex-col items-center group w-full">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-secondary-accent to-primary text-white flex items-center justify-center text-2xl font-bold mb-6 shadow-xl group-hover:scale-110 transition-transform">
                  2
                </div>
                <h3 className="text-xl font-semibold mb-4 text-center">Get your personalized storybook</h3>
                <p className="text-muted-foreground text-center leading-relaxed">
                  Receive a beautifully designed storybook celebrating your child&apos;s milestones. Generated within 24-48 hours after physician review.
                </p>
                <div className="mt-4 flex items-center gap-2 text-sm text-secondary-accent">
                  <BookOpen className="w-4 h-4" />
                  <span className="font-medium">15+ pages</span>
                </div>
              </div>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ y: -5 }}
              className="w-full"
            >
              <div className="bg-gradient-to-br from-white to-success/5 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all border-2 border-success/20 h-full flex flex-col items-center group w-full">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-success to-green-600 text-white flex items-center justify-center text-2xl font-bold mb-6 shadow-xl group-hover:scale-110 transition-transform">
                  3
                </div>
                <h3 className="text-xl font-semibold mb-4 text-center">Receive expert guidance</h3>
                <p className="text-muted-foreground text-center leading-relaxed">
                  A qualified pediatrician reviews and provides personalized recommendations within 48 hours.
                </p>
                <div className="mt-4 flex items-center gap-2 text-sm text-success">
                  <Shield className="w-4 h-4" />
                  <span className="font-medium">Expert reviewed</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section id="why-us" className="py-20 bg-gradient-to-br from-primary/5 via-white to-primary/5 w-full overflow-hidden scroll-mt-24">
        <div className="container mx-auto px-4 max-w-5xl w-full">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 mb-6 shadow-lg">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-orange-700 bg-clip-text text-transparent">
              Why parents love FirstSignFirst
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 lg:gap-8 w-full">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -5 }}
              className="w-full"
            >
              <Card className="p-8 bg-gradient-to-br from-white to-primary/5 text-center h-full border-2 border-primary/20 shadow-lg hover:shadow-2xl transition-all group w-full">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform">
                  <Heart className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Supportive, not scary</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We celebrate every milestone and provide gentle, encouraging guidance
                </p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ y: -5 }}
              className="w-full"
            >
              <Card className="p-8 bg-gradient-to-br from-white to-success/5 text-center h-full border-2 border-success/20 shadow-lg hover:shadow-2xl transition-all group w-full">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-success/20 to-success/10 flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform">
                  <Shield className="w-10 h-10 text-success" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Expert-backed</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Built on CDC guidelines and reviewed by real pediatricians
                </p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ y: -5 }}
              className="w-full"
            >
              <Card className="p-8 bg-gradient-to-br from-white to-secondary-accent/5 text-center h-full border-2 border-secondary-accent/20 shadow-lg hover:shadow-2xl transition-all group w-full">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-secondary-accent/20 to-secondary-accent/10 flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform">
                  <CheckCircle className="w-10 h-10 text-secondary-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Quick and easy</h3>
                <p className="text-muted-foreground leading-relaxed">
                  No long forms or complicated medical terms—just simple questions
                </p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.4 }}
              whileHover={{ y: -5 }}
              className="w-full"
            >
              <Card className="p-8 bg-gradient-to-br from-white to-warning/5 text-center h-full border-2 border-warning/20 shadow-lg hover:shadow-2xl transition-all group w-full">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-warning/20 to-warning/10 flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform">
                  <Sparkles className="w-10 h-10 text-warning" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Beautiful memories</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Keep your child&apos;s storybook as a precious keepsake of their journey
                </p>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-gradient-to-br from-muted/30 via-white to-muted/30 w-full overflow-hidden scroll-mt-20">
        <div className="container mx-auto px-4 max-w-4xl w-full">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
              <HelpCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Common Questions</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-orange-700 bg-clip-text text-transparent">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-muted-foreground">
              Everything you need to know about FirstSignFirst
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="p-6 md:p-8 bg-white shadow-xl border-2 border-border w-full">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1" className="border-b border-border/50">
                  <AccordionTrigger className="text-left font-semibold hover:no-underline py-4">
                    Is this a medical diagnosis?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    No, FirstSignFirst is not a medical diagnosis tool. It&apos;s a developmental screening and tracking tool designed to help parents understand their child&apos;s progress. Our assessments are based on CDC milestone guidelines and reviewed by pediatricians, but they should not replace regular pediatric checkups or professional medical advice.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2" className="border-b border-border/50">
                  <AccordionTrigger className="text-left font-semibold hover:no-underline py-4">
                    How long does it take to get my storybook?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    After you complete the assessment (about 10 minutes), a qualified pediatrician reviews it within 24-48 hours. Once approved, your personalized storybook is generated and available for download. The entire process typically takes 24-48 hours from completion to storybook delivery.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3" className="border-b border-border/50">
                  <AccordionTrigger className="text-left font-semibold hover:no-underline py-4">
                    Is my child&apos;s information secure and private?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    Absolutely. We take privacy seriously. Your child&apos;s information is encrypted and stored securely. We follow industry-standard security practices and never share your data with third parties. You can read our full privacy policy for more details.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4" className="border-b border-border/50">
                  <AccordionTrigger className="text-left font-semibold hover:no-underline py-4">
                    What if I&apos;m concerned about my child&apos;s development?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    If you have concerns about your child&apos;s development, we recommend speaking with your pediatrician. Our assessments can help identify areas that may need attention, and the pediatrician review provides expert guidance. However, always consult with a healthcare professional for any specific concerns.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5" className="border-b border-border/50">
                  <AccordionTrigger className="text-left font-semibold hover:no-underline py-4">
                    Do I need to create an account?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    No account is required to start! You can begin the assessment immediately. However, creating a free account allows you to track multiple assessments over time, save your storybooks, and access your child&apos;s developmental history.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6" className="border-b border-border/50">
                  <AccordionTrigger className="text-left font-semibold hover:no-underline py-4">
                    Can I take assessments for multiple children?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    Yes! You can create assessments for multiple children. Each child gets their own personalized storybook and developmental tracking. Simply start a new assessment and provide the child&apos;s information.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-7">
                  <AccordionTrigger className="text-left font-semibold hover:no-underline py-4">
                    What age ranges do you cover?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    Our assessments cover developmental milestones from birth through early childhood, typically up to 5 years old. The questions are automatically tailored to your child&apos;s specific age to ensure age-appropriate evaluation.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-white to-primary/10 w-full overflow-hidden">
        <div className="container mx-auto px-4 max-w-3xl w-full">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Get Started Today</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-orange-700 bg-clip-text text-transparent">
              Ready to get started?
            </h2>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Your child&apos;s developmental journey starts here. No commitment required.
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                size="lg" 
                asChild
                className="bg-gradient-to-r from-primary to-orange-700 hover:from-primary/90 hover:to-orange-700/90 text-white h-14 px-8 shadow-2xl hover:shadow-3xl transition-all text-lg font-semibold"
              >
                <Link href="/assessment">
                  Start Free Assessment
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </motion.div>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-8 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-sm">Takes 10 minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-sm">No login required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <span className="text-sm font-semibold">100% free</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
