# Home Triage Tricorder — Google Play & Apple App Store Submission & Compliance Kit

## 1. Store Listing Copy (Ready to Copy-Paste)

- **App Name (30 chars max):** `Tricorder: Pre-Visit Baseline`
- **Subtitle (iOS - 30 chars max):** `60s Sensor Baseline & Doc PDF`
- **Short Description (Google Play - 80 chars max):**
  `60-second smartphone sensor baseline tracker & 1-page pre-visit clinician PDF.`
- **Primary Category:** `Health & Fitness` (Primary) / `Medical` (Secondary)
- **Keywords (iOS 100-char field):**
  `baseline,pre-visit,intake,telehealth,tremor,romberg,voice,vitals,wellness,handoff,doctor,diary,log`

### Full Store Description (Apple Guideline 1.4.1 & Google Play Health Policy Safe)
> **Track Your Personal 60-Second Physiological Baseline & Prepare Structured Pre-Visit Notes for Your Clinician — 100% On Your Phone.**
>
> Before a telehealth video call or walk-in clinic visit, it can be hard to summarize what changed from your normal baseline. **Home Triage Tricorder** turns your smartphone's built-in camera, microphone, motion sensors, and touch screen into a personal baseline logger and structured pre-visit clinician handoff organizer.
>
> **CORE MODES:**
> - **60-Second General Checkup Scan:** Establish a 5-stage personal baseline when you feel well (Optical Pulse Rhythm, Visual Colorimetry, 5-Second "Ahhh" Voice Stability, 10-Second Outstretched-Hand Tremor Spectrum, and Standing Romberg Balance Sway) and track your % drift over time.
> - **"Something's Bothering Me" Pre-Visit Intake:** Starts with an immediate Step-1 Emergency Red-Flag check, guides you through 2–4 relevant smartphone sensor observations, and formats a clean **1-Page Printable Doctor Handoff PDF** to bring to your appointment.
> - **5 Interactive Sensor Labs:** Explore Optical Colorimetry, Acoustic Spectrograms, 6-Axis IMU Motion, 240Hz Archimedes Spiral Touch Tracing, and Pure-Tone/Forehead Tone Lateralization.
>
> **100% ON-DEVICE PRIVACY:**
> All camera, microphone, and motion signal processing runs locally on your device. Zero raw video, audio recordings, or health logs are uploaded to external cloud servers.
>
> **IMPORTANT MEDICAL DISCLAIMER:**
> Home Triage Tricorder is a general wellness personal baseline tracker and administrative pre-visit intake organizer. It is not a medical device, does not diagnose, treat, cure, or prevent any disease, and is never a substitute for professional medical advice. Always consult a qualified healthcare provider before making medical decisions. In an emergency, call 9-1-1 immediately.

---

## 2. Google Play Console "Health Apps Declaration" Answers
When submitting in Google Play Console → **App content** → **Health apps**:
1. **Check:** *"Health and fitness"* and *"Medical reference and education / Personal health diary & pre-visit intake."*
2. **Do NOT check:** *"Medical device app that connects to regulated hardware or diagnoses conditions."*
3. **Privacy Policy / Data Safety Section:**
   - **Data Collected:** `None` (100% local `localStorage` on-device; no remote telemetry server).
   - **Data Shared with Third Parties:** `None`.

---

## 3. Apple App Store Review Notes (Guideline 1.4.1 Physical Harm Prevention)
Paste this into **App Review Information → Notes** in App Store Connect:
> "Hello App Review Team:
> 1. **Non-Diagnostic Positioning:** This app is a personal wellness baseline logger and pre-visit appointment preparation tool (FDA General Wellness & Administrative Pre-Visit Intake category). It makes zero diagnostic claims and includes a mandatory Step-1 Emergency Red-Flag screen (`9-1-1` / `8-1-1` / `9-8-8`) and clinician disclaimer on every screen and PDF export.
> 2. **Simulated Demo Toggle Built In:** Reviewers can test every workflow immediately on any iPhone or iPad using the top-right **'Simulated Demo / Live Sensors'** toggle without needing any external peripherals.
> 3. **Methodology Citations:** Optical green-channel photoplethysmography (Verkruysse et al., *Optics Express*), vocal jitter/shimmer phonation stability (Tsanas et al., *IEEE TBME*), IMU postural stabilometry (Mancini et al., *J NeuroEng Rehabil*), and Archimedes spiral tremor kinematics (Pullman, *Mov Disord*) are cited in the app's documentation strictly as educational reference for personal baseline drift tracking."

---

## 4. RevenueCat & In-App Purchase (IAP) Product IDs
Configure these two products in **App Store Connect**, **Google Play Console**, and **RevenueCat**:
1. `tricorder_family_pro_unlock_2999` — **$29.99 USD Non-Consumable One-Time Purchase** ("Family Baseline & Unlimited Doctor Handoff PDF Pro Unlock").
2. `tricorder_clinic_solo_99_mo` — **$99.00 USD / Month Auto-Renewable Subscription** ("Solo Practitioner White-Label Pre-Visit Intake Plan").
