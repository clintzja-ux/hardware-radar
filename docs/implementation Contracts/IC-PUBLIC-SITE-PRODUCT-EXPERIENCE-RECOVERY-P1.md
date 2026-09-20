# IC-PUBLIC-SITE-PRODUCT-EXPERIENCE-RECOVERY-P1

**Status:** IMPLEMENTED / FIXTURE-CERTIFIED / OPERATOR VISUAL ACCEPTANCE REQUIRED  
**Authority:** rendering and local development preview only

## Contract

Hardware Radar exposes one explicit non-production development-preview composition. It copies the checked-in public shell to `.forge-review/public-preview`, generates the canonical Atlas RAM catalog, evaluates canonical current-display state through the existing source-rights and item-price comparison owner, emits the sanitized public current-retail projection, and regenerates product pages.

The catalog remains available when there are zero prices, mixed price coverage, or current-price failure. Unsupported price, seller, condition, shipping, fee, tax, recommendation, Cheapest, and checkout-total claims remain absent. A supported current item-price comparison may identify the lower displayed item price only with the standard excluded-cost disclosure.

The preview marker records `DEVELOPMENT_PREVIEW` and false production-publication, release, and deployment authority. The production build does not consume preview output and remains governed by the certified artifact/release manifest.

## Operator workflow

```text
npm run build:public:development-preview
npm run serve:public:development-preview
```

Open the homepage, `/ram/`, the target product route, and `/contact.html` at `http://127.0.0.1:4173/`. Stop for operator visual acceptance before returning to authorized artifact work.
