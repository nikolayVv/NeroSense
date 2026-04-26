# NeroSense — Step 5: Pricing Structure

**Cassini Business Design Playbook · Step 5 deliverables (part 2 of 3)**
Prepared April 2026 · Working document

This document operationalises the price model from the Business Model Canvas. It commits to numbers — illustrative, not contracted — and shows the working behind them so they can be defended in the pitch and pressure-tested in customer interviews.

> **Posture decision flagged here, recorded in full in §8:** v1 ships in 12 months on an in-house-built lean-prototype USV, not a rented one. This supersedes the rent-the-robot baseline carried in the Business Model Canvas. The pricing below is built on the hardware-path assumption.

---

## 1. Pricing logic

**Competitive anchor against EOMAP, with a value-based ceiling and a cost-based floor.**

The dominant logic is competitive: NeroSense prices relative to EOMAP because EOMAP is the player Sofiyska Voda will compare a tender against, and the player whose framework-contract pattern Bulgarian basin directorates will reference when scoping the 4th RBMP. The price *position* matters more than the absolute number — NeroSense needs to read as "credible alternative to EOMAP, with the in-situ loop included," not as a discount commodity.

Two boundaries discipline that competitive anchor.

The **floor** is a cost-plus calculation. Whatever the competitive number says, it cannot price below the burdened cost of running the EO pipeline plus one season of USV operations plus account management at the target 40–50% gross margin. If the floor exceeds what the customer can pay, the answer is to descope, not to bleed margin.

The **ceiling** is the customer's avoided cost — manual sampling trips, lab fees, a bloom incident reaching the intake, and the analyst-week burned on assembling the BD annex. The ceiling sits well above the floor at Iskar scale. The competitive anchor lands somewhere in the middle.

This is honestly a hybrid logic dressed as competitive. That's the right disposition: pure cost-plus underprices the closed-loop USP, pure value-based overshoots BG procurement reality, and pure competitive ignores that EOMAP doesn't ship the in-situ half of the loop. The competitive anchor is the headline; the floor and ceiling are the guardrails.

---

## 2. Competitive reference points

These are the anchors the price card is built against. None of them are exact comparables — NeroSense's offer is genuinely different — but they bound the conversation.

### 2.1 EOMAP

EOMAP is the EU EO incumbent in inland water-quality monitoring. Two reference points are useful.

**Planet–Germany framework, 2025.** Planet Labs Germany signed a seven-figure contract with the German Federal Ministry of the Interior and Community (BMI) and the German Federal Agency for Cartography and Geodesy (BKG) covering one year with an option to renew for two more years. The deal includes a fixed rate of all of Planet's data products over Germany, including water monitoring services from Planet's partner EOMAP and access to Planet's Insights Platform. "Seven-figure" implies €1–10M for national-scale coverage of Germany, with the EOMAP services as one bundled component. Conservatively assume EOMAP's water-monitoring share of that contract is on the order of €300–800k/year for nationwide coverage of all relevant water bodies.

**eoapp AQUA platform.** EOMAP markets eoapp AQUA, an online solution that enables water managers to easily monitor their water bodies in an up to daily frequency, including for small water bodies, with applicability to bathing water management and EU Water Framework Directive compliance. Pricing is bespoke per AOI; published comparables suggest a single-reservoir, single-year subscription on eoapp AQUA lands in the €40–120k/year band depending on parameter set, refresh frequency, and AOI complexity.

**The implication for NeroSense pricing.** EOMAP at the per-reservoir level is in the €40–120k/year range for satellite-only delivery. EOMAP at the national-framework level is in the €300–800k/year range. NeroSense's *Watch + Validate* tier should price at a defensible delta to EOMAP-only, accounting for the fact that NeroSense ships the in-situ validation EOMAP leaves to the customer.

### 2.2 Sentinel Hub (Sinergise / Planet)

Pure data-platform input cost. NeroSense's own COGS line, not a customer-facing price.

Sentinel Hub commercial subscriptions start at €83.25 per month for commercial users, with consumer/research access from €25 per month, and enterprise-level service and in-house deployments available. Enterprise tiers (S, M, L) scale with processing-unit and request quotas. For commercial PlanetScope, users subscribe to a parcel and receive all archive and fresh data for one year for that parcel; one quota package includes 100 ha to process, with all available products free of additional charge.

For NeroSense's Iskar-scale pipeline (Sentinel-2 + S-3 ingestion across a single ~30km² reservoir, with computed bloom-risk products at 3–5 day refresh), the realistic commercial Sentinel Hub spend is on the order of €5–15k/year per reservoir at the *Enterprise S* tier — a manageable line item that scales sub-linearly with the number of reservoirs because base infrastructure amortises across the customer set.

### 2.3 Bulgarian framework-contract structure

Bulgarian public procurement disciplines what shape the contract can take. Per the Public Procurement Act, a framework agreement determines the conditions of contracts to be awarded during a certain period, including the prices and, if possible, the envisaged quantities, with a term that must not be longer than four years (eight years for sectoral contracting authorities). The 4-year cap is the right horizon for NeroSense's framework tier — long enough to amortise integration cost, short enough to fit the standard ZOP frame.

The IBRD-supported RBMP development model — Bulgaria's MOEW retained the World Bank as consultant within the framework of an Agreement for the provision of support services in support of the development of RBMPs and RMPs for Bulgaria, and the project was funded by the Cohesion Fund of the European Union under the Operational Programme "Environment 2014-2020" — is a useful precedent: BG buys monitoring-and-planning services through multi-year EU-cofunded vehicles, not annual budget lines. The 4th RBMP cycle (2028–2033) is positioned to use the same vehicle. Pricing must therefore work both as a year-1 standalone (Sofiyska Voda commercial contract) and as a multi-year RBMP-cofunded line item.

---

## 3. The price card

Three customer-facing tiers plus a separate pilot fee. Internally these are SaaS economics; externally each is sold as a fixed-scope service deliverable to fit BG procurement.

| Tier | Scope | Indicative annual price (€) | Sold to |
|---|---|---|---|
| **Watch** | Satellite-only · 3–5 day refresh bloom-risk maps · alerting · ArcGIS exports · automated monthly report | 35,000 – 70,000 | Smaller BG utilities · BD secondary water bodies · price-sensitive accounts |
| **Watch + Validate** | Watch + auto-dispatch of in-house USV (up to 12 validation events / season) + automated BD-format annual report | 110,000 – 180,000 | Sofiyska Voda · ViK Burgas · ViK Plovdiv · primary source-water reservoirs |
| **Framework** | Watch + Validate, multi-water-body scope, 4-year term, methodology annex, priority dispatch SLA | 350,000 – 700,000 over 4 years | Basin directorates · MOEW · multi-reservoir utilities |
| **Iskar pilot fee** *(separate, one-off)* | 12-month integration sprint with SV's buoy and LIMS, in-house USV deployment, pilot report | 100,000 – 140,000 | Sofiyska Voda only — supersedes year-1 tier billing |

### 3.1 What's included and not included

**Included in every tier:** EO pipeline, alerts, ArcGIS exports, automated reports, customer support, methodology updates. The base subscription is "all-you-can-eat" on the satellite side — the marginal cost of one more pixel processed is genuinely near zero, and metering it would add invoice complexity that BG buyers won't tolerate.

**Bundled, not metered, in *Watch + Validate*:** USV dispatch events. The Monday-morning auto-dispatch screen is the product; the customer never sees a per-mission invoice line. The cap (12 events per season for *Watch + Validate*; uncapped for *Framework*) is a fair-use line, not a revenue line — overage is handled by an account conversation, not an automatic charge. This is the right posture for B2G: Elena cannot defend a variable invoice to her finance team, and the bundle removes that friction.

**Not included anywhere in v1:** microcystin / cyanotoxin proxy products, bidirectional LIMS write-back, formal WFD methodology annex (deferred to v2 per the Step 4 MVP grid), custom hardware integration beyond buoy + LIMS read-only.

### 3.2 Translation to BGN

Bulgaria operates a fixed-peg currency board: 1 EUR = 1.95583 BGN. All prices above translate directly:

| Tier | EUR | BGN |
|---|---|---|
| Watch | 35,000 – 70,000 | 68,500 – 137,000 |
| Watch + Validate | 110,000 – 180,000 | 215,000 – 352,000 |
| Framework (4-year total) | 350,000 – 700,000 | 685,000 – 1,369,000 |
| Iskar pilot fee | 100,000 – 140,000 | 196,000 – 274,000 |

EUR is the contract currency; BGN figures are sanity-checks for buyers reviewing the proposal against an annual budget line.

---

## 4. The Iskar pilot, costed

The pilot is the single most important commercial decision NeroSense makes in year 1. Pricing it correctly matters more than getting the recurring tiers right.

### 4.1 Cost build-up (12 months)

| Cost line | Range (€) | Notes |
|---|---|---|
| Engineering — EO + USV orchestration team (4–6 FTE part-time over 12 months) | 90,000 – 140,000 | Founder time at sub-market rates assumed |
| In-house USV — lean prototype build (1 unit) | 30,000 – 50,000 | Hull, propulsion, sensor payload, autonomy stack |
| USV ops: deployment, retrieval, maintenance, fuel/charging | 8,000 – 15,000 | One reservoir, one season |
| In-situ lab analysis (validation samples) | 6,000 – 12,000 | ~12 samples × €500–1,000/sample |
| Sentinel Hub commercial (Enterprise S) | 5,000 – 10,000 | Single-reservoir scope |
| Cloud compute + storage | 4,000 – 8,000 | Iskar AOI, 12 months |
| Insurance, permits, BG maritime/inland-waters compliance | 5,000 – 10,000 | Operating an autonomous vessel on a reservoir |
| Sales, contract, project management | 8,000 – 15,000 | Bid prep, monthly reviews, final report |
| **Total burdened cost** | **156,000 – 260,000** | Mid-point ~€200,000 |

### 4.2 Pricing the pilot against the cost

Two honest models, both worth showing to a mentor.

**Model A — Recover most of the cost from the customer.** Pilot fee €130–140k, gross margin -€20k to -€60k. The pilot is a loss-leader; the recurring *Watch + Validate* contract from year 2 onward turns it positive over the 4-year horizon. This is the standard B2G pattern — the lighthouse customer subsidises NeroSense in cash, NeroSense subsidises them in margin.

**Model B — Subsidise the pilot heavily, recover via grants.** Pilot fee €100–110k, target the rest from a Cassini Phase 2 / EIC Accelerator / ESA BIC grant. Gross margin -€90k or worse on pilot revenue alone; positive once grant funding is included. This is the realistic pattern for a pre-revenue hardware-led startup, and it matches the year-1 funding mix the team committed to (grants front-loaded, equity follows traction).

**Recommended posture:** combine both. Quote €120–130k as the pilot fee — close to Model A — and pursue grant funding for the marine-robotics build track in parallel. The headline number on the invoice tells Sofiyska Voda the pilot is real commercial work (which builds credibility for the recurring tier conversation), while the grant covers the genuine first-of-its-kind hardware NRE that no commercial customer should be expected to fund.

### 4.3 Year-2 conversion

Sofiyska Voda exits the pilot into a *Watch + Validate* annual contract at the upper end of the band (€160–180k/year), reflecting the deeper integration, better data, and validated dispatch SLA the pilot demonstrated. Three years of recurring revenue at that rate is €480–540k — comfortably positive once the pilot's loss is amortised across the relationship.

---

## 5. Unit economics at steady state

Year 3, illustrative, assuming five reservoirs across BG utilities + one BD framework.

| Item | Per *Watch + Validate* reservoir/year | Notes |
|---|---|---|
| Revenue | €145,000 | Mid-band |
| EO pipeline allocation | €8,000 | Amortised across customer set |
| Sentinel Hub commercial | €4,000 | Per-reservoir share of enterprise tier |
| USV ops (in-house unit, allocated season-share) | €18,000 | Including maintenance, depreciation, fuel |
| In-situ lab analysis | €8,000 | ~12 events/season |
| Customer success, account management | €15,000 | Allocated FTE share |
| Methodology, R&D allocation | €12,000 | Sofia U. collab, model refinement |
| Cloud, infra, support tools | €5,000 | |
| **Total COGS** | **€70,000** | |
| **Gross margin** | **€75,000 (52%)** | Above the 40–50% target |

The 52% margin at this scale exceeds the 40–50% target because by year 3 the EO pipeline is amortised across five reservoirs and the in-house USV is amortised across its full annual operating envelope. In year 1 the same calculation produces 25–35% margin (single reservoir, single USV, all costs concentrated). The trajectory matters: **year 1 margin is below target on purpose; year 3 margin is above target by design.** Steady state lands inside the band.

The Framework tier (€175k/year average over 4 years per multi-water-body BD contract) carries similar unit economics with a multi-reservoir discount of roughly 15% baked in — fewer dollars per reservoir, but lower per-account overhead.

---

## 6. Where the numbers came from

A note on calibration, because the price card needs to survive its first investor meeting.

The €110–180k *Watch + Validate* band is anchored at the upper end of EOMAP's per-reservoir eoapp AQUA range (~€40–120k satellite-only) plus a premium for the bundled in-situ validation. The premium is roughly the customer's avoided cost of running the boat themselves: a typical manual sampling season for a single reservoir runs 12–20 boat-trips at €1,500–3,000 fully-loaded cost per trip, plus €500–1,000 per lab analysis, totalling €25–60k/season in customer-borne ops. NeroSense absorbs that line and adds margin on top — which is exactly how the price comes out higher than EOMAP's satellite-only number but defensible in a side-by-side comparison.

The €350–700k 4-year Framework band is anchored against the BG IBRD-supported RBMP precedent (multi-year, multi-water-body, EU-cofunded vehicle) and discounts the per-reservoir number for multi-water-body scope. It sits comfortably below EOMAP's national-framework comparable (~€300–800k/year for Germany), which is the right posture for a BG-led challenger entering the 4th RBMP cycle.

The €100–140k Iskar pilot fee is anchored against the burdened-cost model in §4.1 and the realistic ceiling of what a single Sofiyska Voda commercial line can absorb without going to procurement-tender.

All bands are wide on purpose. They tighten in customer interviews and tender responses — not in this document.

---

## 7. What this commits us to validate

Per the Cassini playbook's Step 5 Task 2 ("run quick tests with customers on your revenue model"), three numbers need pressure-testing before the pitch:

1. **The EOMAP per-reservoir comparable.** The €40–120k band is inferred from public sources; one direct conversation with a former EOMAP customer or a Veolia Group procurement contact would tighten it to a single number we can quote.
2. **Sofiyska Voda's actual current spend on manual sampling at Iskar.** This is the avoided-cost ceiling. The persona pack tells us Elena does this work; it doesn't tell us what it costs SV's budget. One conversation with Elena's operations counterpart unlocks the strongest price-defense argument in the deck.
3. **The pilot fee against Sofiyska Voda's discretionary commercial threshold.** BG procurement law sets a threshold below which contracts can be directly awarded without a full tender. If €120–130k is below that threshold, the pilot is a single signature. If it's above, the pilot becomes a tender with timeline implications. This is a legal-research question, not a customer-interview question.

The pricing card is defensible without those validations. It is not committable until they exist.

---

## 8. The hardware-path delta — what changes upstream

This document is built on a posture decision the previous artefacts did not assume. Recording it here so the next reviewer can see it.

**The decision.** The founding team has marine-robotics build capability. v1 ships in 12 months on an in-house-built lean-prototype USV (target build cost <€50k per unit, 1–2 units in year 1). The hardware NRE is funded grant-first (EIC Accelerator, ESA BIC, Horizon Europe), with equity following traction and pilot revenue contributing once it lands.

**What this changes from the Business Model Canvas.**

- **Key resources** add a marine-robotics build capability that is now the strongest moat element in the project — it makes USP #1 ("closed-loop satellite + autonomous robot") genuinely uncopyable by EOMAP at the timescale that matters.
- **Cost structure** gains a hardware NRE line (€30–50k for the year-1 build) and shifts the variable-cost picture: USV ops is now an owned-asset depreciation line, not a per-dispatch rental fee.
- **Key partners** loses "USV rental partner as essential" and replaces it with hardware supply chain partners (sensors, propulsion, hull fab) plus permit/insurance providers for autonomous-vessel operation on BG inland waters.
- **Funding ask** moves from a software-economics pitch to a hardware-augmented one. ESA BIC and EIC Accelerator are now first-line funding targets, not nice-to-haves.

**What this changes from the Step 4 MVP.**

- **Timeline** moves from 6 months to 12 months. The MVP grid still holds — the seven v1 features are unchanged — but the integration sprint with Sofiyska Voda's buoy and LIMS now runs in parallel with the hardware build, not after a rented asset is in place.
- **USP #1 strengthens.** "Closed-loop satellite + autonomous robot" gains a sub-claim: *and we built the robot*. That is a much harder USP for EOMAP to attack than orchestration of a partner asset, and it is the right framing for the Cassini pitch.
- **Hero feature** is unchanged. The Monday-morning auto-dispatch screen still does the work; the difference is that the asset on the other end of the dispatch call is owned, not rented.

**What this does *not* change.**

- The customer wedge ("late detection") is unchanged.
- The customer-facing pricing is bundled regardless of supply-side asset model, exactly as we intended.
- The segment sequencing (BG utilities → BD → EU) is unchanged.
- The Sofia University methodology partnership (USP #4) is unchanged and remains soft/relationship rather than essential.

A follow-up note documenting these deltas as edits to Step 4 and the Canvas is owed before the next review.

---

## Canvas update — pricing line

The Business Model Canvas's revenue-stream box should now read:

> **Pilot fees** (year 1, one-off, €100–140k) → **tiered SaaS** (year 2+: Watch €35–70k, Watch+Validate €110–180k, Framework €350–700k/4yr) → **EU framework billings** (year 4+, post-2028 RBMP, indicative €500k–2M/4yr).

That replaces the placeholder ranges from the canvas with the working numbers from §3.

---

## Appendix — source artefacts

- *NeroSense Step 4: Products / Services* — MVP scope, USP table, value proposition.
- *NeroSense Step 5: Business Model Canvas* — revenue streams, cost structure (now superseded on USV asset model).
- *NeroSense Customer Persona Pack — Sofiyska Voda* — Elena, Operations Director.
- *NeroSense Customer Pack: Bulgarian Water Authorities* — RESAC precedent, infringement-defense framing, segment sequencing.
- *NeroSense Market Analysis* — competitor band 1 (EOMAP, Brockmann, CLS, Sinergise, CyanoLakes, Gybe, RESAC).
- EOMAP / Planet Germany contract reference (May 2025).
- Sentinel Hub commercial pricing (Sinergise public materials).
- Bulgarian Public Procurement Act — framework agreement structure.
- Bulgaria MOEW / IBRD RBMP 2022–2027 reference.