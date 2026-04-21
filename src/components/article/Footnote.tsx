interface FootnoteProps {
  number: number;
}

export default function Footnote({ number }: FootnoteProps) {
  return (
    <sup className="footnote__ref" id={`fnref-${number}`}>
      <a href={`#fn-${number}`} className="footnote__ref-link" aria-label={`Footnote ${number}`}>
        {number}
      </a>
    </sup>
  );
}
