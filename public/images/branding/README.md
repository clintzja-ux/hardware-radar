# Hardware Radar Brand Assets

## Recommended website paths

Copy these files into:

public/images/branding/

- hardware-radar-logo.svg
- hardware-radar-icon.svg
- favicon.svg
- favicon.ico
- favicon-16.png
- favicon-32.png
- apple-touch-icon.png

## Header replacement

Replace the temporary mark in `renderHeader.js` with:

```html
<img
    class="header-logo-image"
    src="images/branding/hardware-radar-icon.svg"
    alt=""
    aria-hidden="true"
>
```

Keep the existing `Hardware Radar` text beside it so the brand remains readable.

## Head tags

Use on every page:

```html
<link rel="icon" type="image/svg+xml" href="images/branding/favicon.svg">
<link rel="alternate icon" href="images/branding/favicon.ico">
<link rel="apple-touch-icon" href="images/branding/apple-touch-icon.png">
```

Remove the temporary line:

```html
<link rel="icon" href="data:,">
```

## CSS

```css
.header-logo-image{
    width:34px;
    height:34px;
    display:block;
}
```
