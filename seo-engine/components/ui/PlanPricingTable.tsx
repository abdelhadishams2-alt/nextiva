'use client'

import './plan-pricing-table.css'

interface PlanPricingTableProps {
  columns: string[]
  plans: Array<{ name: string; values: (string | React.ReactNode)[] }>
  footnote?: string
}

export default function PlanPricingTable({ columns, plans, footnote }: PlanPricingTableProps) {
  return (
    <div className="plan-pricing-table__scroll">
      <table className="plan-pricing-table">
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th key={i} style={{ width: `${100 / columns.length}%` }}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {plans.map((plan, i) => (
            <tr key={i} className="plan-pricing-table__row">
              <td
                className="plan-pricing-table__plan-name"
                data-th={columns[0]}
              >
                {plan.name}
              </td>
              {plan.values.map((value, j) => (
                <td key={j} data-th={columns[j + 1]}>
                  {value}
                </td>
              ))}
            </tr>
          ))}

          {footnote && (
            <tr className="plan-pricing-table__row--footnote">
              <td colSpan={columns.length} data-th="Note">
                {footnote}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
