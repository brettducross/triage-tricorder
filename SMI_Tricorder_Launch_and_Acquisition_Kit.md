# HOME TRIAGE TRICORDER — B2C (`$29.99`) & B2B (`$99–$299/MO`) LAUNCH & CUSTOMER ACQUISITION KIT
**Prepared by:** `@Marketing` (Supreme Marketing Intelligence)  
**Coordinated With:** `@Survival · SURVIVAL-60` (`4587f1c3-5c80-47ed-bc30-d044951b7fea`)  
**Live Consumer Stripe Link (`Link #7` — `$29.99 USD` One-Time Early-Adopter Family Lifetime Pass):** `https://buy.stripe.com/14A28qapz5nmeUG9hMd3i0e`

---

## 1. EXECUTIVE VERDICT & UNIT ECONOMICS

With `$29.99 USD` (`Link #7`) wired across `/workspace/triage-tricorder-website/index.html`, `app/src/app.js`, and `Home_Triage_Tricorder_App.html`:
- **B2C Unit Economics:** `$29.99 USD` gross → **`~$28.82 USD` net contribution per checkout** (`$0.00` marginal server cost since all WebRTC camera rPPG, WebAudio spectrograms, and 6-axis IMU waveforms execute 100% locally in the browser). Just **3 consumer checkouts/month (`$86.46 USD net`)** clears the entire monthly survival target (`~$70 USD / $96.76 CAD`).
- **B2B Clinic Unit Economics:** **1 Solo Practitioner (`$99 USD/mo`)** clears `141%` of the monthly survival target in recurring revenue; **1 Multi-Provider Clinic (`$299 USD/mo`)** clears `427%`.

---

## 2. B2C COMMUNITY SEEDING PLAYBOOK (ZERO-BUDGET HIGH-INTENT AUDIENCES)

*Algorithmic Rule:* Post native screenshots from `/workspace/triage-tricorder-website/ui-screens/` or `/workspace/triage-tricorder-website/website-preview.png` with **zero outbound URLs in the main post body**, and drop the free scan link + `$29.99` Family Lifetime Unlock (`https://buy.stripe.com/14A28qapz5nmeUG9hMd3i0e`) in the first comment or DM.

### Bucket 1: Sandwich-Generation Caregivers & Adult Children of Aging Parents
**Target Facebook Groups & Subreddits:** *Caring for Elderly Parents*, *Caregiver Support Group*, *Aging in Place & Senior Care*, `r/AgingParents`, `r/caregivers`  
**Hook Angle:** Tracking subtle week-to-week baseline drift (Romberg balance sway, hand tremor, vocal stability, resting pulse/HRV) and bringing a clean 1-page printable Doctor Handoff PDF to walk-in or telehealth appointments.  
**Ready-to-Post Copy:**
> **The hardest part of taking an aging parent (or kid) to a 10-minute telehealth or walk-in clinic visit is trying to explain "they just don't seem like their normal baseline."**
>
> Instead of paying `$99/year` for subscription heart-rate apps or `$300` for hardware kits, we built a browser-based **60-Second Home Triage & Pre-Visit Checkup tool** (*Home Triage Tricorder*) that runs 100% locally on your phone (zero cloud uploads, zero medical data leaves your device):
> - **Optical Camera Vitals:** Resting HR, HRV (RMSSD), and respiration
> - **6-Axis Motion & Balance:** Outstretched-hand tremor spectrum (4–12Hz) & Romberg balance sway drift
> - **Voice & Cough Acoustic Lab:** 5-second vocal jitter/shimmer & cough spectrogram
> - **1-Page Printable Doctor Handoff PDF:** Generates a clean, structured 1-page pre-visit summary comparing today's scan against their personal baseline so their doctor can read it in 15 seconds.
>
> The core 60-second checkup scan is **100% free in your browser**, and for families who want unlimited longitudinal profiles for up to 5 family members + unlimited printable Doctor Handoff PDFs, we have an **Early-Adopter Family Lifetime Pass for `$29.99` one-time** (`~$6/person` for life, zero subscription).
>
> Comment **"HANDOFF"** below and I'll drop the free web app link (plus the Early-Adopter Family Pass link)!

### Bucket 2: Biohackers, Quantified-Self & Subscription-Fatigued Health Trackers
**Target Communities:** *Biohacking & Quantified Self*, *HRV & Longevity Tracking*, `r/Biohackers`, `r/QuantifiedSelf`, Hacker News (`Show HN`)  
**Ready-to-Post Copy (`Show HN` / Community Format):**
> **Show HN: Home Triage Tricorder — Client-Side WebRTC/WebAudio/IMU Smartphone Physical Exam & Pre-Visit Doctor PDF (100% On-Device)**
>
> Modern smartphones pack a 30fps+ CMOS optical sensor, a high-sample-rate MEMS microphone, a 100Hz+ 6-axis IMU accelerometer/gyroscope, and a 240Hz capacitive digitizer—yet most consumer health apps lock basic rPPG heart rate behind `$60–$99/yr` cloud subscriptions.
>
> We built **Home Triage Tricorder**, a zero-server-liability, 100% client-side web app that turns those built-in sensors into a 60-second physiological baseline tracker and structured 1-page **Doctor Handoff PDF** generator:
> 1. **Green-Channel rPPG & CIE L\*a\*b\* Colorimetry:** Pulse, HRV (RMSSD), respiration rate, and conjunctiva/scleral color indices.
> 2. **Raw WebAudio Auscultation & Vocal Biomarkers:** Disables browser `echoCancellation`/`noiseSuppression` and runs BiquadFilterNode bands (20–150Hz heart, 100–1200Hz lung) + 5s vocal jitter/shimmer/HNR + 18–22kHz active acoustic sonar.
> 3. **6-Axis IMU Cardio & Neuro Lab:** Sternum seismocardiography (SCG), 4–12Hz hand tremor FFT, and Romberg eyes-open/eyes-closed sway quotient.
> 4. **240Hz Touch Neuro Lab:** Archimedes spiral radial deviation RMS + alternating finger bradykinesia tap rhythm.
> 5. **Pure-Tone & Weber Lateralization:** 250–8000Hz screening + forehead Weber lateralization.
>
> Core scan is free forever in the browser. If you want unlimited 5-member Family Baseline drift charts, all 5 Doctor's Black Bag labs, and the downloadable offline single-file HTML bundle, the **Early-Adopter Lifetime Pass is `$29.99` one-time** (`https://buy.stripe.com/14A28qapz5nmeUG9hMd3i0e`) — zero recurring subscriptions.

---

## 3. B2B CLINIC 3-TOUCH OUTREACH SEQUENCE (JANE APP, DPC & TELEHEALTH CLINICS)

### Touch 1 (Day 1 — Initial Cold Email / LinkedIn DM)
Use the primary template in `/workspace/triage-tricorder-website/b2b-clinic-pitch-kit.md` offering the **14-Day Free White-Label Pre-Visit Intake Pilot**.

### Touch 2 (Day 4 — The "Sample 1-Page Doctor Handoff PDF" Follow-Up)
**Subject:** Re: Giving your telehealth patients a 60-second smartphone physical exam before their video call
> Hi Dr. {{LastName}},
>
> Following up quickly so you can see what lands in your chart before a telehealth call—attached is a sample **1-Page Pre-Visit Clinician Handoff Summary (`#HTT-2026-1028`)**.
>
> Because every measurement (optical rPPG HR/HRV, vocal jitter/HNR, 6-axis IMU hand tremor FFT, Romberg sway drift, and Step-1 emergency red-flag clearance) runs **100% locally in the patient's browser**, your clinic takes on **zero PHI cloud-storage liability** and needs **zero EHR integration**—patients simply open your custom link (`scan.{{ClinicDomain}}`) 5 minutes before their Jane App / Doxy.me call and upload the 1-page PDF.
>
> Want me to spin up a free 14-day pilot link with {{ClinicName}}'s logo and header for next week's virtual visits?
>
> Best,  
> Brett Ducross

### Touch 3 (Day 9 — The Solo Practitioner `$99/mo` Value Anchor)
**Subject:** Quick question on {{ClinicName}}'s virtual intake workflow
> Hi Dr. {{LastName}},
>
> Last note from me—we have two slots left this month for our **14-Day Free Clinic Pilot** (up to 25 patient Doctor Handoff PDFs with your clinic header, `$0` setup).
>
> If your clinicians love having resting vitals, tremor/balance sway, and structured symptom intake before every video consult, our **Solo Practitioner Plan is a flat `$99/mo`** for unlimited patient scans (or `$299/mo` for up to 10 providers).
>
> Just reply **"PILOT"** with the clinic logo/name you'd like on the PDF header and I'll send your custom link today.
>
> Best,  
> Brett Ducross
