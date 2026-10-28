# Home Triage Tricorder — Commercial & Regulatory-Safe Monetization Plan (Survival · SURVIVAL-60)

## 1. Regulatory & Legal Safe Harbor (How to Sell Today Without an FDA Class II / Health Canada MDL Delay)
To monetize immediately and legitimately in the US and Canada while staying outside regulated Software as a Medical Device (SaMD) diagnosis claims:
- **Positioning:** Market as a **"Multi-Sensor Personal Baseline Tracker & Pre-Visit Doctor Handoff Intake Tool"** (FDA *General Wellness: Policy for Low Risk Devices* + *Clinical Decision Support / Administrative Pre-Visit Intake*).
- **Language Guardrails:**
  - Never claim to "diagnose, treat, cure, or rule out" a disease.
  - Frame optical rPPG, vocal jitter/shimmer, IMU tremor FFT, Archimedes spiral, and Weber lateralization as **"Personal Physiological Baseline & Drift Metrics"** and **"Structured Pre-Visit Exam Observations for Your Clinician."**
  - Keep the mandatory Step-1 Red-Flag Emergency Gate (`9-1-1`, HealthLink BC `8-1-1`, Poison Control, `9-8-8`) prominent before any symptom workflow.

---

## 2. Three Revenue Tracks (Fastest Path to Verified Cashflow)

### Track 1: B2B White-Label "Pre-Visit Sensor Intake" for Independent Telehealth, Direct Primary Care (DPC) & Naturopathic/Functional Clinics ($99–$299/mo SaaS)
- **The Pain Point:** Video telehealth visits (Jane App, Practice Better, Doxy.me, SimplePractice) suffer because the clinician gets zero physical exam data before the call—no vitals, no lung/voice audio, no pupil/conjunctiva/oral check, no neuro tremor/balance screen, and no structured symptom history.
- **The Offer:** Clinics embed or text a white-label link (`tricorder.clinicname.com`) to patients 10 minutes before a virtual visit. The patient runs the 60-second checkup + symptom triage on their phone and generates the **1-Tap Doctor Handoff PDF** (which the patient uploads or emails to the clinic chart).
- **Pricing:**
  - **Solo Practitioner Plan ($99/mo):** Unlimited patient pre-visit handoff PDFs, clinic logo/header on the PDF, custom intake link.
  - **Multi-Provider Clinic Plan ($299/mo):** Up to 10 clinicians, custom symptom presets, webhook/PDF export for Jane App / Practice Better / Doxy.me workflows.
- **Why It Sells Fast:** Landing just **1 clinic on the $99/mo plan** clears the entire $96.76 CAD (~$70 USD) monthly survival floor in recurring revenue.

### Track 2: B2C Direct Freemium Web App ("Personal Baseline + Unlimited Doctor Handoff PDF Pack")
- **Free Tier (Viral Lead Magnet):**
  - Full 60-Second General Checkup Scan (1 saved local baseline).
  - Basic Symptom Triage screen + emergency red-flag check.
- **Paid Upgrade ($29.99 One-Time "Early-Adopter Family Baseline & Doctor Handoff Lifetime Pass" (anchored against $79/yr) or $4.99/mo):**
  - Unlimited multi-profile family baselines (Track yourself, kids, and aging parents over time with % drift charts).
  - Full **Printable/Downloadable Doctor Handoff Clinical Summary PDF** with sensor waveforms, vocal biomarkers, IMU tremor spectrum, and Weber/audiometry summary to bring to walk-in clinic, ER, or telehealth appointments.
  - Full access to all 5 **Doctor's Black Bag** live sensor labs.

### Track 3: Employer / Remote-Work & Caregiver Aging-in-Place Check-In ($49–$199/mo)
- Daily 60-second remote baseline check-in for adult children monitoring aging parents at home (tracks subtle drift in voice jitter, Romberg balance sway, hand tremor, and resting rPPG HR/HRV and exports a weekly family summary).

---

## 3. Immediate Launch Checklist
1. **Public HTTPS Deployment (Zero Cost):** Host `/workspace/triage-tricorder/` on Cloudflare Pages, Vercel, or GitHub Pages so mobile Safari and Chrome unlock `navigator.mediaDevices.getUserMedia` (Camera + Raw Mic) and `DeviceMotionEvent` (6-axis IMU) over HTTPS.
2. **Stripe Checkout Integration:** Attach a **$29.99 USD Stripe Payment Link** for the B2C "Family Baseline & Doctor Handoff PDF Pro Unlock" and a **$99/mo Stripe Subscription Link** for the B2B Telehealth Clinic White-Label Starter tier.
3. **Outreach Wave 1 (BC & North America):** Pitch independent Direct Primary Care (DPC) doctors and telehealth clinics using Jane App (headquartered in BC, used by tens of thousands of clinics) a **free 14-day pre-visit intake pilot**.
