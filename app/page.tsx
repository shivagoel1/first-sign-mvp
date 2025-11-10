
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Brain,
  Clock,
  FileText,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserPlus,
} from 'lucide-react'

const features = [
  {
    title: 'Quick & Easy',
    description: 'Complete the assessment in just 5-10 minutes—no login required.',
    icon: Clock,
    accent: 'bg-blue-100 text-blue-600 border-t-blue-500',
  },
  {
    title: 'AI-Powered Insights',
    description:
      "Receive a personalized storybook crafted from your child's developmental journey.",
    icon: Brain,
    accent: 'bg-purple-100 text-purple-600 border-t-purple-500',
  },
  {
    title: 'Expert Review',
    description:
      'Every result is reviewed by qualified physicians before reaching your dashboard.',
    icon: UserCheck,
    accent: 'bg-green-100 text-green-600 border-t-green-500',
  },
]

const steps = [
  {
    title: 'Answer Questions',
    description: 'Share insights about your child—it only takes 5-10 minutes.',
    icon: FileText,
  },
  {
    title: 'Create an Account',
    description: 'Save progress and access your child’s developmental history anytime.',
    icon: UserPlus,
  },
  {
    title: 'AI Storybook',
    description: 'Our AI crafts a personalized story to celebrate every milestone.',
    icon: Sparkles,
  },
  {
    title: 'Physician Review',
    description: 'A licensed physician reviews and approves your results for accuracy.',
    icon: ShieldCheck,
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <main className="flex flex-col gap-24">
        <section className="relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 px-6 py-24 text-center text-white sm:px-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.2),_transparent_40%)]" />
          <div className="relative w-full max-w-5xl animate-fade-in space-y-10">
            <div className="flex flex-col items-center gap-6">
              <div className="flex items-center justify-center rounded-full bg-white/15 p-4 shadow-xl backdrop-blur">
                <Sparkles className="h-10 w-10 text-yellow-200" />
              </div>
              <span className="rounded-full bg-white/15 px-5 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-white/80 shadow-lg backdrop-blur">
                Developmental Milestones Reimagined
              </span>
            </div>
            <div className="space-y-6">
              <h1 className="text-balance text-5xl font-bold leading-tight drop-shadow-xl sm:text-6xl md:text-7xl">
                Welcome to FirstSign
              </h1>
              <p className="mx-auto max-w-2xl text-balance text-lg text-gray-200 sm:text-xl">
                Track developmental milestones, uncover AI-powered insights, and receive
                physician-approved guidance—all through one modern experience.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button
                size="lg"
                className="group transform bg-white px-8 py-6 text-base font-semibold text-blue-600 shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:bg-white"
                asChild
              >
                <Link href="/assessment">Start Free Assessment</Link>
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="border-2 border-white/80 bg-transparent px-8 py-6 text-base font-semibold text-white shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:border-white hover:bg-white/10"
                asChild
              >
                <Link href="/login">Login</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="bg-white px-6 py-20 sm:px-10">
          <div className="mx-auto max-w-6xl space-y-12">
            <div className="space-y-4 text-center">
              <h2 className="text-3xl font-semibold text-slate-950 sm:text-4xl">
                Why Families Choose FirstSign
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-slate-600">
                Thoughtfully designed tools that help families understand and support
                their child’s unique development journey.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon
                const [iconBg, iconText, topBorder] = feature.accent.split(' ')
                return (
                  <Card
                    key={feature.title}
                    className={`group relative h-full transform border-t-4 ${topBorder} rounded-2xl bg-white/90 p-6 shadow-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl`}
                  >
                    <CardHeader className="space-y-6 pb-4">
                      <div
                        className={`self-start rounded-2xl p-3 shadow ${iconBg} ${iconText}`}
                      >
                        <Icon className="h-8 w-8" />
                      </div>
                      <CardTitle className="text-2xl font-semibold text-slate-900">
                        {feature.title}
                      </CardTitle>
                      <CardDescription className="text-base text-slate-600">
                        {feature.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-br from-gray-50 via-white to-blue-50 px-6 py-20 sm:px-10">
          <div className="mx-auto max-w-6xl space-y-12">
            <div className="space-y-4 text-center">
              <h2 className="text-3xl font-semibold text-slate-950 sm:text-4xl">
                How It Works
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-slate-600">
                Start with a simple assessment and follow a guided path to detailed,
                physician-backed insights.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-2">
              {steps.map((step, index) => {
                const Icon = step.icon
                return (
                  <Card
                    key={step.title}
                    className="group relative flex h-full flex-col gap-6 rounded-2xl border border-blue-100 bg-white p-8 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg">
                        <span className="text-xl font-semibold">{index + 1}</span>
                      </div>
                      <div className="rounded-full bg-blue-50 p-3 text-blue-600">
                        <Icon className="h-6 w-6" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <CardTitle className="text-2xl font-semibold text-slate-900">
                        {step.title}
                      </CardTitle>
                      <CardContent className="p-0 text-base text-slate-600">
                        {step.description}
                      </CardContent>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>
      </main>

      <footer className="relative mt-10 bg-gray-900 text-gray-300">
        <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 sm:px-10 md:flex-row md:items-center md:justify-between">
          <p className="text-sm">
            © {new Date().getFullYear()} FirstSign. All rights reserved.
          </p>
          <nav className="flex flex-wrap gap-6 text-sm font-medium">
            <Link href="/about" className="transition-colors duration-200 hover:text-white">
              About
            </Link>
            <Link
              href="/privacy"
              className="transition-colors duration-200 hover:text-white"
            >
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors duration-200 hover:text-white">
              Terms
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
