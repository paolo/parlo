# Parlo — Landing Page Design

Extends [`2026-10-09-parlo-design.md`](2026-10-09-parlo-design.md) and
[`2026-10-20-language-profile-design.md`](2026-10-20-language-profile-design.md). The language-profile and
history/review plans are paused while this lands; this work is independent of both.

## 1. Intent

Parlo is live at **parlo.fun**, but a visitor who is not signed in is redirected straight to `/sign-in`, a plain
card with no explanation. The landing page replaces that first impression. Its one job: in a few seconds, make a
visitor *get* what Parlo does, then send them into the app with the Google sign-in button.

What Parlo does, and what the page has to show: other translators carry words across; Parlo carries the
*meaning* of a colloquial phrase across, even when the wording is completely different ("Cuesta un ojo de la
cara" and "It costs an arm and a leg" say the same thing in different images). It works with the user's **three
languages at once**: a native one, one they know well and one they are learning. The page shows this with a
single phrase in three languages, not with a tagline.

The audience is mostly people in Canada learning to live in more than one language (the author is a temporary
resident whose languages are Spanish, English and French, but the page must not be aimed only at people chasing
permanent residence). The page should feel quietly Canadian through its *phrases* (Québécois French is rarely
taught by apps), never through flags, maple leaves or politics.

### Goals

- A landing page at `/` for signed-out visitors, with the headline, a rotating three-language phrase shown as
  speech bubbles, and the Google sign-in button.
- The rotation shows the native language cycling through Spanish, Portuguese, Ukrainian, Mandarin, Hindi and
  Punjabi, always paired with English and French.
- A mix of Canadian and general phrases.
- Works well on phones first, and reads well (centered, not stretched) on desktop. Light and dark schemes.
- Link previews (title, description, image) that look good when the page is shared in chats.

### Non-goals

- Translating the page itself. Headline, buttons and all app UI stay in English; only the phrases are in other
  languages.
- Extra sections (pricing, feature lists, testimonials, FAQ). The page is one screen plus a footer line.
- Restyling the signed-in app. The visual language introduced here is scoped to the landing page; the app keeps
  its current look and may adopt pieces later as its own feature.
- Analytics, cookie banners and a waitlist or email capture. Visitors sign in or leave.
- A live translation demo on the page. The phrases are fixed content, not model calls.

### Anti-goals (a failure even if it technically works)

- Looks like a generic SaaS template.
- Any political, flag or national-symbol imagery. "Canadian" must come from the phrases and one footer line only.
- Literal translations in the phrase sets. Every set must be idiomatic in every language, otherwise the page
  contradicts its own pitch.
- Layout jumping when the phrases rotate (bubbles have different lengths per language).
- Colorful decoration for its own sake: no confetti, mascot, emoji or flags.

## 2. The page

Content, top to bottom, centered column:

1. **Top bar:** the "parlo" wordmark on the left and a "Sign in" link on the right (the same Google flow).
2. **Headline:** "Three languages. One meaning." (placeholder wording, final copy is the author's call).
3. **Subline:** "Understand what people really say, and say what you mean like they would."
4. **Conversation:** three speech bubbles in this order, alternating sides like a chat:
   1. the visitor's native language (the rotating one), on the left;
   2. English, on the right;
   3. French, on the left.

   Each bubble has a small language label (the code, e.g. "UK") above the phrase. The three bubbles are the same
   meaning in three wordings. They sit in a column of limited width (about 460 px) that is centered on the
   page, so on desktop the bubbles keep their left/right alternation but never travel to the screen edges.
   Bubbles are at most about 80% of the column.
5. **Google sign-in button:** Google's official light button (white, grey border, full-color "G"), and Google's
   official dark variant in the dark scheme. Label "Continue with Google". It does what the button in
   `SignInForm` does today (`authClient.signIn.social({ provider: "google", callbackURL: "/" })`).
6. **Footer line:** "Made in Canada".

### Rotation

- Every few seconds (about 5) the *whole conversation* changes together: a new phrase set, and the native
  language moves to the next one in the cycle (es, pt, uk, zh, hi, pa, then around). English and French do not
  rotate.
- Transition is a soft crossfade of the three bubbles, not a slide, and the container keeps a fixed height so
  nothing below it moves.
- Rotation pauses while the pointer is over the conversation or focus is inside it, and while the tab is hidden.
- Tapping or clicking the conversation advances to the next set.
- With `prefers-reduced-motion`, there is no automatic rotation and no animation; tapping still advances.
- Without JavaScript the first set renders (server-rendered), so the page is never empty.
- Screen readers get the current set once and are not interrupted by rotation (no live region).

### Content

A phrase set is one meaning with an idiomatic phrase in each of es, pt, uk, zh, hi, pa, en and fr. Plan for
about 8 sets, roughly half Canadian. First set (agreed in the conversation):

| Meaning | fr | en | es |
|---|---|---|---|
| It's very cold | Il fait frette | It's freezing out | Hace un frío que pela |

Ukrainian "Дубак надворі" was proposed for the same set. **All non-English/French text, and the Mandarin, Hindi,
Punjabi, Portuguese and Ukrainian ones especially, is unverified machine-written content and must be reviewed by
native or fluent speakers before release.** Other Canadian candidates raised so far: "Give'r" (EN, going all
out), "Ça marche" (FR, "sounds good"), "Take a rain check".

Content lives in a typed data module (not hard-coded in JSX), validated by a test that every set has all eight
languages, uses only codes from `src/shared/languages.ts`, and has no empty strings.

## 3. Look and feel

- **Palette (light):** page `#f4f5fb`, text `#1d2033`, secondary text `#6b7090`, bubbles white with a soft
  shadow, accent (language labels, links) `#4c5fd5`.
- **Palette (dark):** page `#14162a`, text `#eceefb`, secondary `#8d93b8`, bubbles `#21244a` with no shadow,
  accent `#8f9cf5`.
- These are starting values taken from the approved mockup; contrast must be checked (WCAG AA for text) and the
  dark scheme follows Mantine's color scheme (`auto`, as the root layout already sets).
- Typography: Geist (already in the app), heavy weight and tight tracking for the headline. No new font, which
  also avoids a font that lacks Cyrillic, Devanagari, Gurmukhi or Chinese glyphs.
- Bubbles: large radius with one small-radius corner (the "tail") on the side of the speaker.
- Every phrase element carries the correct `lang` attribute (`zh` as `zh-Hans`) so browsers pick the right glyph
  shapes, and `dir="auto"`.
- Built with Mantine components and Mantine's color-scheme mechanism where practical. No new UI library.

## 4. Routing and auth

- `/` is currently the signed-in app (`src/app/(app)/page.tsx`) and `src/proxy.ts` redirects any request without
  a session cookie to `/sign-in`. New behavior: **signed-out visitors at `/` see the landing page, with the URL
  staying `https://parlo.fun/`**; signed-in visitors at `/` see the app exactly as today. All other app routes
  still redirect signed-out visitors to `/sign-in`.
- Suggested mechanism (builder's call): in `proxy.ts`, rewrite `/` to a landing route when there is no session
  cookie, instead of redirecting.
- `/sign-in` stays. The landing button and the sign-in page share the same Google flow, and the development-only
  password form stays on `/sign-in` only.
- The landing page does not call any API route and needs no data from the server.
- The check stays cookie-only, like the existing proxy: it is an optimistic check and real authorization
  happens in the route handlers. A visitor with an expired cookie gets the app route and its existing
  failure handling, exactly as today. No server-side session lookup is added for the landing page.
- The Google button uses Google's official button artwork, inlined as SVG (light and dark variants), not a
  restyled Mantine button. The two variants are swapped with CSS only (Mantine's `lightHidden` / `darkHidden`
  helpers), so the server-rendered page never flashes the wrong variant.

## 5. Sharing and metadata

- Page `<title>` and description for the landing route, written around the idea of the product ("Understand and
  use colloquial phrases across your three languages"), not "Parlo".
- Open Graph and Twitter card tags, with a 1200×630 image showing the hero (headline plus the first conversation).
  A statically generated image is enough.
- `lang="en"` on the document stays.

## 6. Left to the builder

- The exact rewrite mechanism, component split and file locations, following the repo's `src/ui` and `src/app`
  conventions.
- Rotation timing, crossfade duration and the reserved height, as long as nothing shifts.
- How to produce the Open Graph image.
- Final headline wording if the author does not supply it; the placeholder above is acceptable.
- Tests: component tests for the content module, rotation (fake timers, pause, reduced motion, tap to advance)
  and the signed-out/signed-in routing; and a manual pass in a browser for light/dark and a narrow phone width.

## 7. Calls made without the author

- Rotation interval of about 5 seconds and the crossfade style.
- Pause on hover/focus/hidden tab, and tap-to-advance.
- The footer wording "Made in Canada".
- Rewrite at `/` instead of a separate public URL for the landing page.
- Open Graph image and metadata (the author said the page will be shared, but did not ask for this).
- Keeping Geist rather than adding a display font.
- Content release: the builder drafts all 8 sets in all 8 languages, the content test requires every language
  in every set, and the author gets the draft to review (or have reviewed by fluent speakers) before the page
  goes live. Nothing is published with unreviewed text.
- The Open Graph image is a committed static PNG, made last, after the content and headline are final. The
  placeholder headline is acceptable until then.
- "Made in Canada" was in an earlier mockup but not in the last one, so it is a guess. It is one line of text
  and trivial to remove.
- Stale-cookie handling and the Google button artwork are settled in §4.
