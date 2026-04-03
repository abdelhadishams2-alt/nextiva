'use client'

import './feature-matrix.css'

interface FeatureRow {
  feature: string | React.ReactNode
  values: (string | React.ReactNode)[]
}

interface FeatureSection {
  heading: string
  rows: FeatureRow[]
}

interface FeatureMatrixProps {
  planNames: string[]
  sections: FeatureSection[]
}

export default function FeatureMatrix({ planNames, sections }: FeatureMatrixProps) {
  const totalColumns = planNames.length + 1

  return (
    <div className="feature-matrix__scroll">
      <table className="feature-matrix">
        <thead>
          <tr>
            <th>Feature</th>
            {planNames.map((name, i) => (
              <th key={i}>{name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sections.map((section, sIdx) => (
            <FeatureMatrixSection
              key={sIdx}
              section={section}
              totalColumns={totalColumns}
              planNames={planNames}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function FeatureMatrixSection({
  section,
  totalColumns,
  planNames,
}: {
  section: FeatureSection
  totalColumns: number
  planNames: string[]
}) {
  return (
    <>
      <tr className="feature-matrix__row--section">
        <td colSpan={totalColumns} data-th="Section">
          <strong>{section.heading}</strong>
        </td>
      </tr>
      {section.rows.map((row, rIdx) => (
        <tr key={rIdx} className="feature-matrix__row">
          <td className="feature-matrix__feature" data-th="Feature">
            {row.feature}
          </td>
          {row.values.map((value, vIdx) => {
            const isFullSpan = row.values.length === 1
            return (
              <td
                key={vIdx}
                colSpan={isFullSpan ? planNames.length : undefined}
                data-th={planNames[vIdx] || planNames[0]}
              >
                {value}
              </td>
            )
          })}
        </tr>
      ))}
    </>
  )
}
