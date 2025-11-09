'use client';

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui/radio-group'

export default function Home() {
  const [step, setStep] = useState(0)
  const [age, setAge] = useState('')
  const [disease, setDisease] = useState('')
  const [questions, setQuestions] = useState<any[]>([])
  const [answers, setAnswers] = useState<{ [key: string]: string }>({})
  const [status, setStatus] = useState('')

  useEffect(() => {
    if (step === 2 && age && disease) {
      supabase
        .from('milestones')
        .select('*')
        .eq('age_months', age)
        .eq('disease', disease)
        .then(({ data }) => setQuestions(data || []))
    }
  }, [step, age, disease])

  const handleAnswer = (qid: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [qid]: value }))
  }

  const handleAssessment = async () => {
    await supabase.from('assessment_responses').insert([
      {
        age,
        disease,
        answers,
        created_at: new Date().toISOString(),
      },
    ])
    setStep(3)
    setStatus('Report generating...')
    // Trigger backend/AI here if needed
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center py-8">
      {step === 0 && (
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow">
          <h1 className="text-2xl font-bold mb-8">Welcome to First Sign</h1>
          <Button onClick={() => setStep(1)} className="w-full">Start Assessment</Button>
        </div>
      )}

      {step === 1 && (
        <form className="w-full max-w-md p-6 bg-white rounded-lg shadow space-y-4"
         onSubmit={e => {e.preventDefault(); setStep(2)}}>
          <label className="block text-gray-700 font-semibold mb-2">Age in months</label>
          <Input
            type="number"
            value={age}
            onChange={e => setAge(e.target.value)}
            required
          />
          <label className="block text-gray-700 font-semibold mb-2">Disease</label>
          <Select value={disease} onValueChange={setDisease} required>
            <SelectTrigger>
              <SelectValue placeholder="Select disease" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Typically Developing">Typically Developing</SelectItem>
              <SelectItem value="Disease A">Disease A</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" className="w-full">Next</Button>
        </form>
      )}

      {step === 2 && (
        <form className="w-full max-w-xl p-6 bg-white rounded-lg shadow space-y-6"
          onSubmit={e => {e.preventDefault(); handleAssessment()}}>
          <h2 className="text-xl font-bold mb-4">Assessment Questions</h2>
          {questions.map((q) => (
            <div key={q.milestone_code} className="mb-4">
              <label className="block mb-2">{q.question}</label>
              <RadioGroup
                defaultValue=""
                onValueChange={val => handleAnswer(q.milestone_code, val)}
              >
                {Array.isArray(JSON.parse(q.options)) ? JSON.parse(q.options).map((option: string) => (
                  <div key={option} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={option} />
                    <label htmlFor={option}>{option}</label>
                  </div>
                )) : null}
              </RadioGroup>
            </div>
          ))}
          <Button type="submit" className="w-full">Submit Assessment</Button>
        </form>
      )}

      {step === 3 && (
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow flex flex-col items-center">
          <h2 className="text-xl font-bold mb-4">Thank you!</h2>
          <p className="mb-4">Status: {status}</p>
          {/* Add sign-in/up buttons here if needed */}
        </div>
      )}
    </main>
  )
}
