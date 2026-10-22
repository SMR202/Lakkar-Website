---
name: Lakkar Home
description: Modern minimal homewares storefront grounded in the uploaded Urdu logo.
colors:
  slate: "#504c5e"
  ink: "#302d36"
  wood: "#b89882"
  paper: "#faf9f6"
  line: "#dedbd5"
  muted: "#68636c"
typography:
  display:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "clamp(50px, 5.1vw, 76px)"
    fontWeight: 400
    lineHeight: 1.08
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "39px"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "-0.035em"
  title:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "16px"
    lineHeight: 1.5
    letterSpacing: "-0.015em"
  label:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "12px"
  wordmark:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "34px"
    lineHeight: 1
    letterSpacing: "0.02em"
rounded:
  square: "0px"
spacing:
  compact: "14px"
  regular: "24px"
  section: "75px"
components:
  button-primary:
    backgroundColor: "{colors.slate}"
    textColor: "#ffffff"
    rounded: "{rounded.square}"
    padding: "14px 23px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.square}"
    padding: "14px 23px"
  field:
    backgroundColor: "#ffffff"
    textColor: "{colors.ink}"
    rounded: "{rounded.square}"
    padding: "12px"
---

# Design System: Lakkar Home

## Overview

**Creative North Star: "Modern minimal warmth"**

The owner's modern, minimal direction combines quiet sans-serif headings, generous space and tactile wood photography. The original Urdu logo remains the brand anchor. The current samples are explicitly illustrative and do not establish claims about inventory or manufacture.

**Key Characteristics:**

- Quiet typography and generous whitespace.
- Slate actions on warm paper surfaces.
- Photographs carry the material character.
- Plain square controls and restrained separators.

## Colors

The frontmatter records the runtime custom properties in `src/style.css`.

### Primary

Slate anchors primary buttons, the announcement strip and footer. Ink carries principal text. Wood supplies selection and scrollbar accents.

### Neutral

Paper is the main surface, line separates adjacent content, and muted carries supporting text. Warm photography supplies the richer brown range rather than decorative interface fills.

## Typography

Self-hosted DM Sans carries headings, body and controls. Cormorant Garamond remains in the wordmark and selected bag, product-detail and empty-state headings. The final heading rules override the earlier serif base declarations.

Desktop hero type uses the display token; the intermediate viewport uses (58px), and narrow screens use (45px) with line height (1.07). Collection headings use the headline token, reduced to (31px) on narrow screens. Product titles use the title token, reduced to (13px) on narrow screens. Body and utility text vary by context; prices use tabular numerals.

## Layout

Desktop sections use (6%) horizontal gutters. The product grid has four columns, changing to two below (900px). At (640px), horizontal gutters become (20px), the hero separates copy from its lower photograph, and the story changes from two columns to a vertical composition. Mobile imagery keeps reserved aspect ratios. The bag and checkout share a right drawer (500px) wide on desktop and full width on mobile.

## Elevation & Depth

Product cards remain flat and unboxed. Tonal section surfaces and photography establish depth. The dialog shadow and dim backdrop distinguish a focused task; the transient status notice has a soft offset shadow. Shadow values and motion live in the sidecar.

## Shapes

Buttons, images and fields use square geometry. Fine borders separate quantities and fields. Scrollbar thumbs have a small functional curve; controls do not inherit that curve.

## Components

### Buttons

Primary actions use slate with white text; outline actions use an ink label and fine separator-colored border. Hover darkens the primary action. Keyboard focus uses a slate outline (2px) with (4px) offset. Disabled actions reduce opacity and use a non-interactive cursor.

### Product cards

Photography leads, followed by a small category, product title and price. Desktop adds a square plus control; mobile provides a full-width labelled add action. Photo hover uses a restrained scale transition, and equivalent product-detail access remains available on touch.

### Inputs and filters

Checkout fields use a white surface, a thin border and square corners. Labels stay visible above fields; errors appear in text. Native selects retain platform popup behavior. Category filters use an underline for selection rather than filled badges.

### Navigation and overlays

The desktop header combines the original logo/wordmark, plain links and bag action. Navigation links recede on narrow screens while the bag remains available. Native modal dialogs provide background inertness and focus containment. Motion is removed for reduced-motion preference; forced-color mode preserves operable system controls.

## Do's and Don'ts

### Do:

- **Do** preserve the uploaded logo and the owner's modern minimal direction.
- **Do** keep material expression in real photography and quiet interface surfaces.
- **Do** use consistent focus, error and disabled states across checkout and bag.
- **Do** label illustrative product imagery and data honestly until verified content arrives.

### Don't:

- **Don't** add decorative gradients or promotional badges to this restrained interface.
- **Don't** turn product cards into elevated panels.
- **Don't** treat sample products, prices or policies as verified business claims.
