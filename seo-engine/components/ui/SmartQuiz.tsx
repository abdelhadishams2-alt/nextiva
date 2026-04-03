'use client'

import { useState } from 'react'
import './smart-quiz.css'

interface QuizOption {
  label: string
  points: number
}

interface QuizQuestion {
  question: string
  options: QuizOption[]
}

interface QuizResult {
  minScore: number
  maxScore: number
  title: string
  description: string
  partner?: string
}

interface SmartQuizProps {
  heading: string
  description: string
  questions: QuizQuestion[]
  results: QuizResult[]
}

type QuizState = 'intro' | 'active' | 'result'

export default function SmartQuiz({
  heading,
  description,
  questions,
  results,
}: SmartQuizProps) {
  const [state, setState] = useState<QuizState>('intro')
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [selectedOption, setSelectedOption] = useState<number | null>(null)

  const handleStart = () => {
    setState('active')
    setCurrentQuestion(0)
    setAnswers([])
    setSelectedOption(null)
  }

  const handleAnswer = (points: number, index: number) => {
    setSelectedOption(index)
    setTimeout(() => {
      const newAnswers = [...answers, points]
      setAnswers(newAnswers)
      setSelectedOption(null)

      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1)
      } else {
        setState('result')
      }
    }, 400)
  }

  const handleRestart = () => {
    setState('intro')
    setCurrentQuestion(0)
    setAnswers([])
    setSelectedOption(null)
  }

  const getResult = (): QuizResult | null => {
    const totalPoints = answers.reduce((sum, p) => sum + p, 0)
    for (const result of results) {
      if (totalPoints >= result.minScore && totalPoints <= result.maxScore) {
        return result
      }
    }
    return results[results.length - 1] || null
  }

  const progress = questions.length > 0
    ? ((currentQuestion + 1) / questions.length) * 100
    : 0

  return (
    <div className="smart-quiz">
      {state === 'intro' && (
        <div className="smart-quiz__intro">
          <h3 className="smart-quiz__heading">{heading}</h3>
          <p className="smart-quiz__description">{description}</p>
          <button className="smart-quiz__start-btn" onClick={handleStart}>
            Start Quiz
          </button>
        </div>
      )}

      {state === 'active' && (
        <div className="smart-quiz__card">
          <div className="smart-quiz__progress">
            <div
              className="smart-quiz__progress-bar"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="smart-quiz__counter">
            Question {currentQuestion + 1} of {questions.length}
          </p>

          <div className="smart-quiz__body">
            <h3 className="smart-quiz__question">
              {questions[currentQuestion].question}
            </h3>

            <div className="smart-quiz__options">
              {questions[currentQuestion].options.map((option, i) => (
                <button
                  key={i}
                  className={`smart-quiz__option${selectedOption === i ? ' smart-quiz__option--selected' : ''}`}
                  onClick={() => handleAnswer(option.points, i)}
                  disabled={selectedOption !== null}
                >
                  <span className="smart-quiz__checkbox">
                    {selectedOption === i && (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                      >
                        <path
                          d="M2 7l3.5 3.5L12 4"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>
                  <span className="smart-quiz__option-label">
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {state === 'result' && (() => {
        const result = getResult()
        if (!result) return null
        return (
          <div className="smart-quiz__card">
            <div className="smart-quiz__body">
              <div className="smart-quiz__result-badge">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 28 28"
                  fill="none"
                >
                  <path
                    d="M4 14l7 7L24 7"
                    stroke="#fff"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className="smart-quiz__result-label">We recommend:</h3>
              <div className="smart-quiz__result-title">{result.title}</div>
              <p className="smart-quiz__result-description">
                {result.description}
              </p>
              <div className="smart-quiz__result-actions">
                {result.partner && (
                  <a
                    href={`/out/${result.partner}`}
                    target="_blank"
                    rel="noopener nofollow"
                    className="smart-quiz__cta-btn"
                  >
                    Try for Free
                  </a>
                )}
                <button
                  className="smart-quiz__restart-btn"
                  onClick={handleRestart}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="1 4 1 10 7 10" />
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                  </svg>
                  Retake Quiz
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
