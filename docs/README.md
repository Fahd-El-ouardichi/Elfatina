# ELFATINA الفاتنة — Production Website

Arabic-first (RTL), story-driven pre-launch boutique site for the ELFATINA abaya brand.
Pure static HTML/CSS/JS — no build step, no dependencies. Upload the folder to any host.

## Structure

```
website/
├── index.html                  Home: hero, collection showcase, story teaser, testimonials, waitlist CTA
├── story.html                  Full brand story (4 chapters) + animated atelier corner
├── contact.html                Contact & waitlist page
├── 404.html                    Not-found page
├── collections/
│   ├── al-awda.html            "The Comeback" collection (all 5 products)
│   └── al-yaqut.html           "Al-Yaqut" teaser collection (coming soon)
├── products/
│   ├── sahara.html             Signature piece — 1,290 MAD
│   ├── sakina.html             949 MAD
│   ├── fajr.html               899 MAD
│   ├── layl.html               1,190 MAD
│   └── madina.html             1,090 MAD
├── assets/
│   ├── css/style.css           Single shared stylesheet (light + dark theme)
│   ├── js/main.js              Reveal animations, lightbox, thumbnails, progress bar
│   └── img/                    Photos (placeholders from Unsplash, free license)
├── robots.txt
└── sitemap.xml
```

## SEO already in place

- Unique `<title>` + meta description per page (Arabic, keyword-rich)
- Canonical URLs, Open Graph + Twitter cards
- JSON-LD structured data: Organization, WebSite, Product (+ price, PreOrder availability), BreadcrumbList, CollectionPage, ContactPage
- `sitemap.xml` + `robots.txt`
- Semantic HTML, one `<h1>` per page, descriptive `alt` text on every image
- `loading="lazy"` on below-the-fold images, `fetchpriority="high"` + preload on hero images

## Before going live — replace these placeholders

1. **Domain**: all absolute URLs use `https://www.elfatina.ma/`. Search-replace it across
   all `.html` files + `sitemap.xml` + `robots.txt` with your real domain.
2. **Photos**: `assets/img/*.jpg` are Unsplash placeholders. Replace with real product
   photos (keep the same filenames and the site needs no other change).
3. **Prices / stock lines**: currently demo values ("بقيت 7 قطع" etc.).
4. **Testimonials** on `index.html`: replace with real customer messages.
5. **Instagram/TikTok links**: currently `@elfatina` — set your real handles.
6. **Waitlist form** on `contact.html`: currently opens the visitor's email app.
   For a real form, create a free endpoint at formspree.io and set it as the form `action`.
7. **Email**: order buttons use `elouardichifahd1998@gmail.com` (mailto). Later, replace
   with WhatsApp links (`https://wa.me/2126XXXXXXXX?text=...`) — usually converts better in Morocco.

## Hosting (any of these, all free tiers)

- **Netlify / Vercel**: drag & drop the `website` folder — done.
- **GitHub Pages**: push the folder to a repo, enable Pages.
- **Classic hosting (cPanel)**: upload contents into `public_html`.

After deploying, submit `sitemap.xml` in Google Search Console.
