# Theme & Design Tokens

## CSS Custom Properties (src/styles/tokens.css)

```css
:root {
  --color-bg: #ffffff;
  --color-fg: #12131a;
  --color-muted: #666666;
  --color-border: #e9e9ec;
  --color-primary: #12131a;
  --color-accent: #3b82f6;
  --color-dark-bg: #0b1924;
  --brand-navy: #02122c;
  --brand-blue: #0062b8;
  --cta-blue: #06f;
  --text-primary: #1a1a1a;
  --text-secondary: #4a4b46;
  --text-tertiary: #6c6967;
  --font-sans: var(--font-space-grotesk), system-ui, sans-serif;
  --font-display: 'Lora', Georgia, serif;
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 12px;
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --container-max: 1280px;
}
```

## Fonts
- Space Grotesk (primary sans-serif)
- Geist Mono (monospace)
- Lora (serif display, weights 400/500/700)

## CSS Strategy
- Plain CSS with BEM naming — NO Tailwind
- Desktop-first responsive (max-width: 1024px, 768px)
- One CSS file per component in src/styles/
