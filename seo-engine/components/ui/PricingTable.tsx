'use client'

import './pricing-table.css'

interface PricingTableProps {
  headers: string[]
  rows: Array<{ provider: string; values: string[] }>
}

export default function PricingTable({ headers, rows }: PricingTableProps) {
  return (
    <div className="pricing-table__scroll">
      <table className="pricing-table">
        <thead>
          <tr>
            {headers.map((header, i) => (
              <th key={i}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="pricing-table__row">
              <td className="pricing-table__provider" data-th={headers[0]}>
                {row.provider}
              </td>
              {row.values.map((value, j) => (
                <td key={j} data-th={headers[j + 1]}>
                  {value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
