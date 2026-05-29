# Headline Market Rolodex Skin Revert

The original Rolodex/headline selector styling is still preserved as the base CSS.

The luxury watch skin is applied by this class in `src/games/headline-market/HeadlineMarketGame.tsx`:

```tsx
className="storybook-date-console rolodex-watch-skin"
```

To quickly revert to the previous design, remove `rolodex-watch-skin` so it becomes:

```tsx
className="storybook-date-console"
```

The watch-specific CSS lives under selectors beginning with:

```css
.storybook-date-console.rolodex-watch-skin
.rolodex-watch-skin
```
