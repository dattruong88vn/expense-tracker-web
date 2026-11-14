import css from './index.css?inline';

/** Compiled theme declarations, case-insensitive because the CSS pipeline may normalise hex case. */
const compiled = css.replace(/\s+/g, ' ').toLowerCase();

describe('design tokens', () => {
  it.each([
    ['--color-income', '#15803d', '#4ade80'],
    ['--color-expense', '#be123c', '#fb7185'],
    ['--color-primary', '#4f46e5', '#818cf8'],
  ])('declares %s with its light and dark values', (token, light, dark) => {
    expect(compiled).toContain(`${token}: ${light}`);
    expect(compiled).toMatch(new RegExp(`prefers-color-scheme: ?dark\\).*${token}: ${dark}`));
  });

  it('declares the category palette', () => {
    expect(compiled).toContain('--color-category-orange: #c2410c');
    expect(compiled).toContain('--color-category-slate: #475569');
  });

  it('resolves the utilities text-income and text-expense to the tokens', () => {
    expect(compiled).toMatch(/\.text-income ?\{ ?color: ?var\(--color-income\)/);
    expect(compiled).toMatch(/\.text-expense ?\{ ?color: ?var\(--color-expense\)/);
  });
});
