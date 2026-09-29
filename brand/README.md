# Heyden brand material

Taken from https://heyden.ai and its maker's site, https://firetechlabs.com, on 28 September 2026. Colour and type
values are copied from the live CSS. Every claim a film makes must trace to a line in this file or in `site/*.md`.

## What Heyden is (from the sites)

- **Tagline:** "Ideas to Outcomes". **Positioning line:** "A Global Innovation Hub for Emergency Services".
- **Meta description:** "Heyden guides fire and emergency services through a structured process to evaluate, validate,
  and adopt hazard technologies."
- **Share description:** "An AI driven collaboration platform to support emergency services in evaluating, validating,
  and adopting new technology."
- **Four verbs** (home page, scroll-driven section):
  - **Collaborate:** "Individual and inter-agency data sharing. Skip the duplicated efforts."
  - **Innovate:** "Quickly assess the viability of proposals. No more missed opportunities."
  - **Strategise:** "Ensure alignment between projects and strategy. Kill scope creep."
  - **Solve:** "Find solutions to your trickiest problems through the Commons. The world's at your fingertips."
- **Roles** (home page role picker; full text in `site/home.md`):
  - Agency: "Share across agencies. Scan the market. Decide faster."
  - Vendor: "Own your Commons presence. Research agencies. Position with intent."
  - Industry body: "Track emerging tech. Read the sector. Direct effort where it counts."
- **The Commons:** a searchable directory of agencies, vendors, researchers and industry bodies. On 28 Sep it showed
  "Showing 1–21 of 219". Trending capabilities: Situational Awareness, Forecasting & Prediction, Decision Support &
  Analytics, Response & Field Operations. Listings span Australia, the US and Canada.
- **Named features:** Commons, Ask Heyden ("AI research on demand"), Heyden Insights, Quick Assessment, Strategy Hub,
  Tenancy analytics, Multi-agency tenancy, Shared project workspaces.
- **Pricing** ("One Commons. Many ways in."): Free (own your listing), Starter US$25 per seat per month, Premium US$49
  per seat per month. Monthly or annual (save 20%).
- **FAQ:** customers own their data, stored in their operating location; a compliance framework that "tracks SOC 2
  Type II, ISO 28001 2022 and ISM IRAP controls" (tracks, not certified; "28001" is as written on the site);
  English, French and Spanish; API and MCP integrations on request.

## The problem it solves (firetechlabs.com)

"Wildfire agencies are increasingly approached by vendors, innovators, researchers, and service providers offering
emerging technologies ... Today that information is gathered through informal and inconsistent processes. There is no
mechanism for sharing insights, tracking maturity, or coordinating engagement across the wildfire community."

- Duplicated effort across agencies
- Fragmented knowledge and inconsistent evaluations
- Limited visibility into deployments
- Repeated demands on subject matter experts
- Hazard tech that struggles to reach the frontline

Other lines: "Hazard Tech from Lab to Market", "We help turn good ideas into real-world capability",
"Vendor-neutral. User-focused. Evidence-based adoption.", "Secure and Sovereign".

## Who makes it

- **Firetech Labs Pty Ltd**, Peregian Digital Hub, 253-255 David Low Way, Peregian Beach QLD 4573, Australia.
  Heyden is its "flagship product"; it also sells professional services (validation, integration, delivery, market access).
- **Founders** (firetechlabs.com/about): Leigh Kelson, "a life-long tech entrepreneur with a proven track record in
  taking companies from inception to listing"; Connor Wilson, "a Flight Test Engineer with over a decade of experience
  in the Royal Australian Air Force".
- **Story:** "originally established as Firetech Connect under Noosa Council", it "grew over five years into a trusted
  platform for testing and accelerating hazard technologies" (firetechlabs.com/about).
- **Why Firetech Connect exists** (peregianhub.com.au/history): "The catastrophic bushfires of 2019 almost burnt down
  the Hub and the entire Peregian Beach township, saved only by the brave efforts of over 300 volunteer firefighters."
  The suburb was evacuated for 96 hours. "This experience inspired the creation of the Hub's Firetech Connect
  project ... The program launched in early 2020."
- **Projects** (firetechlabs.com/about): Fire Air Traffic Management Trials, "a world first with a fixed wing BVLOS
  drone operating within 300ft of operationally active helicopters"; a national RPAS roadmap with the ANU Bushfire
  Research Centre of Excellence.
- **Partners listed by Firetech Labs** (not necessarily Heyden customers): QFD, ANU, Noosa Shire Council,
  FPInnovations, Suncorp, Thales.
- **Not the same company:** Hayden AI (hayden.ai) makes traffic-enforcement cameras.

## Files

- `site/`: every page as a visitor sees it at 1440×900, with its text in `site/<page>.md`.
  - Pages: home, commons, pricing, faq, contact, login, commons-signup.
  - `site/firetechlabs.md`: page text of firetechlabs.com (home and about), captured 28 Sep. The quotes above from
    firetechlabs.com and peregianhub.com.au/history were checked word for word against those pages.
  - `home-feature-01..04.png`: the four states of the scroll-driven verb section.
  - `home-role-<role>-<n>.png`: every role tab and tile.
- `assets/`: files the site itself serves.
  - The hero loop, https://heyden.ai/heyden-landing.mp4, isn't stored here; `film/extract-footage.sh` downloads it.
    It's 42.09 s at 1920×1080 and 29.97 fps: seven 6 s aerial hazard shots (fire front, flood, hose on burnt bush,
    helicopter bucket dip, smoke column, crop fire, crews under a helicopter). It looks like licensed stock: confirm
    the licence covers this film before it's posted.
  - `Projects-`, `QA-`, `SH-`, `Rolodex-screenshot.png`: the product UI. They show what the product does and its real
    labels; they're reference, not layouts to copy. Their demo data names real organisations (CAL FIRE, NSW RFS
    documents); don't show those organisations as users.
  - `og-image.jpg`: the 1200×630 share image. `site.css`: the live stylesheet.
- `logo/`: `favicon.svg` and `heyden-mark.svg` (the same mark: a bold "H" in the system font, gradient `#FF0000` →
  `#FF5722`); `firetechlabs-logo.jpg` (the maker's logo, 2708×708). There is no designed wordmark: the nav sets
  "Heyden" in white Inter; the login page sets it in orange-red.
- `fonts/`: Inter (SIL Open Font License, from the Google Fonts repository). The site loads Inter 400, 500, 600 and 700.

## Colour

| Role | Value |
|---|---|
| Page background | `#0A0A0A` |
| Section background | `#0F0F0F` |
| Cards, app surfaces | `#141414`, `#161616`, `#1A1A1A`; the app's frame is lighter, about `#2B2B2B` |
| Warm dark card (dark theme) | `#2E2822`, frame `#3A332C` |
| Text | white; muted text at 92%, 85%, 78%, 72%, 65% and 35% white |
| Hairlines | white at 8% and 12% |
| Accent orange (buttons, kickers, active tab) | `#FB8B24` |
| Brand orange (`--brand`) | `#E85D26` |
| Other oranges in the CSS | `#FF6B00`, `#FF8533`, `#FDBA74` |
| Mark gradient | `#FF0000` → `#FF5722` |
| Researcher badge blue | `#185FA5` on `#B5D4F4` (light theme) |
| Amber | `#F6C453` |
| Light theme (Commons) | background `#FAFAF8`, text `#1A1A1A`, cards `#FCFBF9`, badge `#FFF6EA` |

Priority colours in Strategy Hub: Critical red, High orange, Medium blue, Low grey.

## Type

- **Inter** throughout.
- **h1:** 600, 68 px, line height 74.8 px, letter spacing −0.5 px, white.
- **Section h3:** 600, 40 px, line height 50 px.
- **Verb titles (h2):** 700, 30 px, line height 37.5 px, letter spacing −0.3 px.
- **Lead paragraph:** 400, 19 px, line height 28 px, 65% white.
- **Kickers** ("WHAT CAN I DO ON HEYDEN?", "PROPOSAL ASSESSMENT"): small uppercase, letter-spaced, `#FB8B24`.

## Product UI copy (from the screenshots)

The product's real features and labels, for use in a mockup. The screenshots are reference for what it does, not
layouts to copy.

- **Projects:** "Welcome back, Connor". "Project Pipeline - see how your projects are progressing...". Stages:
  1 Define Problem → 2 Identify Stakeholders → 3 Stakeholder validation → 4 Readiness (TRL / IRL / ORL) →
  5 Business Case → 6 Implement → 7 Measure Success. Cards show "% complete", the stage, "N days in stage",
  "Updated ..." Example projects: "Camera Detection - Smoke", "Stratoship — Stratospheric Airship Wildfi...",
  "Firefighter Wearables". "+ New Project".
- **Proposal assessment:** kicker "PROPOSAL ASSESSMENT"; "What have the good idea fairies come up with today?";
  input "The vendor has offered this platform as a services model — I've"; button "Assess proposal";
  "ASSESSED PROJECTS", "SHARED WITH ME".
- **Strategy Hub:** "Align innovation projects with organisational strategy". Tabs: Dashboard, Objectives, Source
  Documents. Tiles: Total objectives 124 ("across 6 source documents"), Coverage 0% ("0 of 124 have aligned
  projects"), Critical gaps 105 ("critical/high with 0 projects"), Active projects 2 ("2 unaligned").
  "COVERAGE BY SOURCE DOCUMENT", "PRIORITY DISTRIBUTION" (Uncovered / Covered), "HIGHEST PRIORITY GAPS — CRITICAL
  OBJECTIVES WITH NO PROJECT COVERAGE", "no aligned projects".
- **Rolodex:** "Search vendors, industry bodies, researchers, products, and capabilities"; placeholder "Vendor,
  product, capability, or hazard..."; "TRENDING CAPABILITIES": Early Warning & Detection, Forecasting & Prediction,
  Situational Awareness, Response & Field Operations; badges VENDOR, INDUSTRY BODY (orange), RESEARCHER (blue).
