'use client'

import { useState, type ReactNode } from 'react'
import './quick-start-guide.css'

interface Step {
  heading: string
  content: string | ReactNode
  image?: string
}

interface QuickStartGuideProps {
  title: string
  steps: Step[]
}

export default function QuickStartGuide({ title, steps }: QuickStartGuideProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="quick-start-guide">
      <div className="quick-start-guide__item">
        <button
          className="quick-start-guide__handle"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <span className="quick-start-guide__title">{title}</span>
          <span
            className={`quick-start-guide__icon${open ? ' quick-start-guide__icon--open' : ''}`}
          />
        </button>

        {open && (
          <div className="quick-start-guide__body">
            <ol className="quick-start-guide__steps">
              {steps.map((step, i) => (
                <li key={i} className="quick-start-guide__step">
                  <h4 className="quick-start-guide__step-heading">
                    {step.heading}
                  </h4>
                  <div className="quick-start-guide__step-content">
                    {typeof step.content === 'string' ? (
                      <p>{step.content}</p>
                    ) : (
                      step.content
                    )}
                  </div>
                  {step.image && (
                    <p className="quick-start-guide__step-image-wrap">
                      <img
                        src={step.image}
                        alt={step.heading}
                        className="quick-start-guide__step-image"
                        loading="lazy"
                      />
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  )
}
