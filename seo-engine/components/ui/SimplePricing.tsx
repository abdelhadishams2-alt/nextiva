'use client'

import { type ReactNode } from 'react'
import './simple-pricing.css'

interface Plan {
  name: string
  price: string
  description: string
}

interface SimplePricingProps {
  plans: Plan[]
  notes?: ReactNode[]
}

export default function SimplePricing({ plans, notes }: SimplePricingProps) {
  return (
    <section className="simple-pricing" id="pricing">
      <div className="simple-pricing__table">
        {plans.map((plan, i) => (
          <div className="simple-pricing__row" key={i}>
            <div className="simple-pricing__value">{plan.price}</div>
            <div className="simple-pricing__detail">
              <h3 className="simple-pricing__name">{plan.name}</h3>
              <p className="simple-pricing__description">{plan.description}</p>
            </div>
          </div>
        ))}
      </div>

      {notes && notes.length > 0 && (
        <div className="simple-pricing__notes">
          {notes.map((note, i) => (
            <p key={i} className="simple-pricing__note">
              {note}
            </p>
          ))}
        </div>
      )}
    </section>
  )
}
