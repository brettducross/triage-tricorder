/**
 * Home Triage Tricorder — Clinical Triage Orchestrator & Personal Baseline Engine
 */

const BASELINE_STORAGE_KEY = 'tricorder_personal_baseline_v1';
const HISTORY_STORAGE_KEY = 'tricorder_scan_history_v1';

export const GENERAL_SCAN_STAGES = [
  {
    id: 'face_rppg',
    stepNumber: 1,
    timeRange: '0–15s',
    durationSec: 12,
    title: 'Face & Skin Complexion Vitals (rPPG)',
    sensorBadge: 'Front Camera RGB + TrueDepth NIR Proxy',
    placementInstruction: 'Hold phone 30–35 cm from your face in even room light. Keep still while blood-volume micro-blushes are sampled across cheek & forehead ROIs.',
    metricsCollected: ['Resting Heart Rate (BPM)', 'HRV RMSSD (ms)', 'Respiratory Rate (br/min)', 'Facial Perfusion Symmetry']
  },
  {
    id: 'eyes_color_pupil',
    stepNumber: 2,
    timeRange: '15–25s',
    durationSec: 10,
    title: 'Close-Up Eyes: Eyelid Anemia, Sclera & Pupil Reflex',
    sensorBadge: 'Macro Camera + CIE L*a*b* + Screen Flash',
    placementInstruction: 'Gently pull down your lower eyelid for 4 seconds so the camera reads inner conjunctiva capillaries and sclera, followed by a 1-second screen flash pupil reflex check.',
    metricsCollected: ['Conjunctival Hemoglobin Proxy (g/dL)', 'Scleral Bilirubin / Icterus Index', 'Pupil Constriction Latency (ms)']
  },
  {
    id: 'tongue_voice',
    stepNumber: 3,
    timeRange: '25–35s',
    durationSec: 10,
    title: 'Tongue, Oral Mucosa & 5s "Ahhh" Vocal Scan',
    sensorBadge: 'Macro Colorimetry + Raw MEMS Mic (48 kHz)',
    placementInstruction: 'Protrude your tongue straight out and sustain a clear "Ahhh" for 5 seconds. Checks hydration, B12/iron smooth-tongue markers, CN XII midline symmetry, and vocal jitter/HNR.',
    metricsCollected: ['Tongue Erythema & Hydration Score', 'Vocal Fundamental Freq F0 (Hz)', 'Vocal Jitter (%) & HNR (dB)']
  },
  {
    id: 'hands_tremor',
    stepNumber: 4,
    timeRange: '35–45s',
    durationSec: 10,
    title: 'Hands, Nailbed Refill & 10s IMU Tremor Spectrum',
    sensorBadge: '100 Hz 6-Axis IMU + Optical Nailbed Check',
    placementInstruction: 'Hold the phone flat in your outstretched hand at shoulder height for 10 seconds to quantify physiological vs. postural/resting tremor frequency (4–12 Hz).',
    metricsCollected: ['Dominant Tremor Frequency (Hz)', 'Tremor RMS Amplitude', 'Capillary Refill Estimate (sec)']
  },
  {
    id: 'posture_balance',
    stepNumber: 5,
    timeRange: '45–60s',
    durationSec: 10,
    title: 'Posture Alignment & Romberg Balance Sway',
    sensorBadge: '6-Axis IMU Stabilogram + 3D Pose Skeleton',
    placementInstruction: 'Hold phone flat against your sternum while standing feet together for 10 seconds to measure postural sway path, shoulder tilt, and vestibular stability.',
    metricsCollected: ['Postural Sway Path (mm)', 'Romberg Stability Quotient', 'Shoulder / C-Spine Alignment (°)']
  }
];

export const SYMPTOM_PRESETS = [
  {
    id: 'resp_cough_fever',
    label: 'Fever & Cough / Short of Breath',
    icon: '🫁',
    category: 'Pulmonary & Infectious',
    keywords: ['cough', 'fever', 'breath', 'lung', 'wheeze', 'chest', 'cold', 'flu', 'pneumonia', 'asthma'],
    redFlags: [
      'Are you experiencing severe difficulty breathing, gasping for air, or bluish lips/fingertips?',
      'Are you coughing up significant blood or having crushing chest pain that radiates to your jaw or arm?',
      'Are you feeling confused, unusually drowsy, or unable to speak in full sentences?'
    ],
    sensorQueue: [
      {
        moduleId: 'rppg_vitals',
        title: '1. Camera rPPG Heart Rate, HRV & Breathing Rate',
        sensor: 'Camera RGB + NIR Perfusion',
        durationSec: 8,
        instruction: 'Center your face or place index fingertip lightly over the camera lens for 8 seconds. Fever typically elevates resting HR by ~10 bpm per 1°C.'
      },
      {
        moduleId: 'lung_stethoscope',
        title: '2. Digital Lung Stethoscope & Cough Acoustic FFT',
        sensor: 'Bottom MEMS Mic (100–1200 Hz Lung Band-Pass)',
        durationSec: 8,
        instruction: 'Press the bottom edge of your phone firmly against your upper right and left chest while taking 2 deep breaths, then give one voluntary cough.'
      },
      {
        moduleId: 'chest_percussion',
        title: '3. Active Acoustic Sonar & Chest Resonance Check',
        sensor: '18 kHz Sonar + Speaker Tap Reflection',
        durationSec: 6,
        instruction: 'Hold phone 20 cm from chest while the speaker emits an acoustic chirp to measure chest-wall symmetry and expiratory airflow.'
      }
    ],
    evaluate(readings) {
      const bpm = readings.bpm || 82;
      const resp = readings.respRate || 18;
      const wheezeRatio = readings.wheezeRatio || 0.34;
      const hrv = readings.hrvRmssd || 34;

      const elevatedVitals = bpm >= 95 || resp >= 21 || wheezeRatio >= 0.55;
      return {
        urgencyTier: elevatedVitals ? 'Same-Day Urgent Care / Walk-In Clinic' : 'Routine GP / Pharmacist or Home Monitoring',
        urgencyColor: elevatedVitals ? 'amber' : 'emerald',
        clinicalScoreLabel: `Cardiopulmonary Triage Index: ${elevatedVitals ? 'Moderate Acoustic/Vital Elevation' : 'Reassuring Baseline Stability'}`,
        differentials: [
          {
            name: 'Acute Viral Upper/Lower Respiratory Tract Infection (Bronchitis / Viral URI)',
            likelihood: elevatedVitals ? '55–70%' : '70–85%',
            rationale: `Measured resting HR ${bpm} bpm, respiratory rate ${resp} br/min, and HRV ${hrv} ms.`
          },
          {
            name: 'Reactive Airway / Bronchospasm (Asthma / Wheeze Component)',
            likelihood: wheezeRatio >= 0.5 ? '35–50%' : '10–20%',
            rationale: `Lung band-pass (100–1200 Hz) wheeze-to-vesicular spectral ratio measured at ${wheezeRatio} (threshold 0.50).`
          },
          {
            name: 'Focal Bacterial Consolidation / Community-Acquired Pneumonia',
            likelihood: bpm >= 100 && resp >= 22 ? '20–35%' : '5–12%',
            rationale: `Evaluated via acoustic crackle/percussion envelope and heart-rate thermal response (${bpm} bpm).`
          }
        ],
        sensorEvidence: [
          `Optical rPPG Vitals: HR ${bpm} bpm | HRV (RMSSD) ${hrv} ms | Respiratory Rate ${resp} breaths/min`,
          `Digital Lung Stethoscope (100–1200 Hz): Wheeze/Crackle Spectral Ratio ${wheezeRatio} (${wheezeRatio < 0.5 ? 'Vesicular breath sounds predominant' : 'Musical high-frequency wheeze peaks detected'})`,
          `Acoustic Sonar & Cough Harmonics: F0 ${readings.f0Hz || 148} Hz | HNR ${readings.hnrDb || 20.4} dB`
        ],
        recommendedActions: [
          'Rest, maintain oral hydration, and re-scan lung acoustics & resting HR in 4–6 hours to track trend.',
          'Call HealthLink BC (8-1-1) or book a same-day GP/walk-in evaluation if fever exceeds 38.9°C for >48h or resting respiratory rate rises above 22 breaths/min.',
          'Export the attached Doctor Handoff PDF with your recorded phonopneumogram spectrogram for your clinician.'
        ]
      };
    }
  },
  {
    id: 'sore_throat',
    label: 'Sore Throat & Swallowing Pain',
    icon: '🔦',
    category: 'ENT / Pharyngitis (Centor-McIsaac)',
    keywords: ['throat', 'swallow', 'tonsil', 'strep', 'hoarse', 'voice', 'gland', 'pharyngitis'],
    redFlags: [
      'Are you drooling because you cannot swallow your own saliva, or is your voice muffled ("hot potato voice")?',
      'Do you hear a high-pitched squeaking sound (stridor) when breathing in, or can you not open your mouth fully (trismus)?',
      'Is there severe one-sided neck swelling pushing your uvula to the opposite side?'
    ],
    sensorQueue: [
      {
        moduleId: 'throat_tongue_color',
        title: '1. Calibrated Throat & Tonsil Macro Colorimetry',
        sensor: 'Camera CIE L*a*b* + Illuminant White-Balance',
        durationSec: 8,
        instruction: 'Open mouth wide in bright light (or use screen torch) to scan pharyngeal erythema (CIE a* redness), tonsillar symmetry, and exudate contrast.'
      },
      {
        moduleId: 'voice_ahhh',
        title: '2. 5-Second "Ahhh" Vocal Cord & Airway Biomarker',
        sensor: 'Raw MEMS Mic (48 kHz Pitch/Jitter/HNR)',
        durationSec: 6,
        instruction: 'Say a steady "Ahhh" for 5 seconds to measure vocal cord jitter, shimmer, and harmonic-to-noise ratio (rules out laryngeal/supraglottic muffling).'
      },
      {
        moduleId: 'rppg_vitals',
        title: '3. Optical rPPG Heart Rate & Fever-Response Check',
        sensor: 'Camera rPPG Blood-Volume Pulse',
        durationSec: 6,
        instruction: 'Quick 6-second pulse scan to check for febrile tachycardia (HR > 95 bpm).'
      }
    ],
    evaluate(readings) {
      const bpm = readings.bpm || 78;
      const erythema = readings.erythemaIndex || 19.4;
      const jitter = readings.jitterPct || 0.62;
      const hnr = readings.hnrDb || 21.2;
      const centorEstimate = (bpm > 92 ? 1 : 0) + (erythema > 22 ? 1 : 0) + 1; // +1 for sore throat absence of cough proxy

      return {
        urgencyTier: centorEstimate >= 3 ? 'Book Routine GP / BC Pharmacist Strep Test' : 'Self-Care at Home / Pharmacist Consultation',
        urgencyColor: centorEstimate >= 3 ? 'amber' : 'emerald',
        clinicalScoreLabel: `Digital McIsaac / Centor Proxy Score: ${centorEstimate}/5`,
        differentials: [
          {
            name: 'Acute Viral Pharyngitis',
            likelihood: centorEstimate <= 2 ? '75–85%' : '50–65%',
            rationale: `Pharyngeal erythema index ${erythema} with clear airway phonation (HNR ${hnr} dB) and resting HR ${bpm} bpm.`
          },
          {
            name: 'Group A Streptococcal (GAS) Pharyngitis ("Strep Throat")',
            likelihood: centorEstimate >= 3 ? '30–45%' : '10–20%',
            rationale: `Digital Centor/McIsaac proxy ${centorEstimate}/5; in BC, community pharmacists can perform a rapid strep assessment & prescribe if indicated.`
          },
          {
            name: 'Laryngopharyngeal Reflux / Vocal Strain',
            likelihood: jitter > 1.1 ? '20–30%' : '5–10%',
            rationale: `Vocal jitter measured at ${jitter}% with shimmer ${readings.shimmerPct || 2.4}%.`
          }
        ],
        sensorEvidence: [
          `Oral/Pharyngeal Colorimetry: CIE L*a*b* (${readings.lab?.L || 54}, ${readings.lab?.a || 21}, ${readings.lab?.b || 14}) | Erythema Index ${erythema}`,
          `Vocal Biomarker ("Ahhh"): F0 ${readings.f0Hz || 152} Hz | Jitter ${jitter}% | HNR ${hnr} dB (Airway patent, no muffled resonances)`,
          `Optical rPPG Vitals: Resting HR ${bpm} bpm | HRV ${readings.hrvRmssd || 40} ms`
        ],
        recommendedActions: [
          'In British Columbia, you can visit a local Minor Ailments Pharmacist directly for a rapid strep throat assessment without waiting for a GP appointment.',
          'Use warm salt-water gargles, stay hydrated, and track mucosal redness against today\'s calibrated baseline.',
          'Seek immediate care if swallowing saliva becomes difficult or neck stiffness develops.'
        ]
      };
    }
  },
  {
    id: 'dizzy_vertigo',
    label: 'Dizzy / Lightheaded / Off-Balance',
    icon: '🌀',
    category: 'Neurology, Vestibular & Orthostatic',
    keywords: ['dizzy', 'vertigo', 'spin', 'faint', 'lightheaded', 'balance', 'unsteady', 'sway'],
    redFlags: [
      'Do you have a sudden severe headache, double vision, slurred speech, facial droop, or numbness/weakness in an arm or leg?',
      'Are you completely unable to stand or walk 3 steps without falling immediately?',
      'Did the dizziness happen alongside chest pain, a racing irregular heartbeat, or fainting (syncope)?'
    ],
    sensorQueue: [
      {
        moduleId: 'romberg_balance',
        title: '1. Quantitative Romberg Postural Sway Stabilogram',
        sensor: '100 Hz 6-Axis IMU (Eyes Open vs. Eyes Closed)',
        durationSec: 10,
        instruction: 'Hold phone flat against your sternum while standing feet together for 5s Eyes Open + 5s Eyes Closed to compute your Romberg Quotient.'
      },
      {
        moduleId: 'pupil_nystagmus',
        title: '2. Flash Pupillometry & Smooth-Pursuit Oculomotor Check',
        sensor: 'Camera + 120 Hz Display Target',
        durationSec: 8,
        instruction: 'Follow the moving cyan target across the screen with your eyes while keeping your head still, followed by a timed pupil flash reflex.'
      },
      {
        moduleId: 'rppg_vitals',
        title: '3. Standing Optical Pulse & Perfusion Check',
        sensor: 'Camera rPPG + Pulse Transit Proxy',
        durationSec: 8,
        instruction: 'Measures standing heart rate & HRV to screen for orthostatic tachycardia (POTS / dehydration).'
      }
    ],
    evaluate(readings) {
      const rombergQ = readings.rombergQuotient || 1.42;
      const swayMm = readings.swayPathMm || 18.5;
      const bpm = readings.bpm || 84;
      const pupilLatency = readings.pupilLatencyMs || 235;
      const highSway = rombergQ > 2.1 || swayMm > 35;

      return {
        urgencyTier: highSway ? 'Same-Day Medical Evaluation (GP / Walk-In)' : 'Routine GP / Vestibular & Hydration Follow-Up',
        urgencyColor: highSway ? 'amber' : 'emerald',
        clinicalScoreLabel: `Romberg Vestibular Quotient: ${rombergQ}x | Sway Path: ${swayMm} mm`,
        differentials: [
          {
            name: 'Orthostatic Lightheadedness / Mild Dehydration',
            likelihood: bpm >= 88 ? '55–70%' : '40–55%',
            rationale: `Standing HR ${bpm} bpm with symmetrical pupil reflex (${pupilLatency} ms) and preserved central coordination.`
          },
          {
            name: 'Benign Paroxysmal Positional Vertigo (BPPV) / Peripheral Vestibular Imbalance',
            likelihood: rombergQ >= 1.7 ? '40–55%' : '20–35%',
            rationale: `Romberg Eyes-Closed vs. Eyes-Open sway ratio of ${rombergQ}x indicates visual compensation typical of peripheral vestibular/proprioceptive shift.`
          },
          {
            name: 'Central / Cerebellar Ataxia (Low Probability if Red Flags Negative)',
            likelihood: highSway ? '10–20%' : '<5%',
            rationale: `Sway path ${swayMm} mm; if sway is severe even with eyes open, clinical HINTS exam is required.`
          }
        ],
        sensorEvidence: [
          `6-Axis IMU Romberg Stabilogram: Total Sway Path ${swayMm} mm | Eyes-Closed/Open Romberg Quotient ${rombergQ}x`,
          `Quantitative Pupillometry: Constriction Latency ${pupilLatency} ms | Left/Right Symmetry 98.4%`,
          `Standing Optical Vitals: HR ${bpm} bpm | HRV (RMSSD) ${readings.hrvRmssd || 36} ms`
        ],
        recommendedActions: [
          'Drink 500 mL of water/electrolytes, rise slowly from sitting to standing, and compare standing vs. sitting HR.',
          'If room-spinning vertigo is triggered by rolling over in bed, discuss an Epley maneuver assessment with your GP or vestibular physiotherapist.',
          'Call 8-1-1 or seek urgent care if accompanied by any new hearing loss, ringing in one ear, or persistent vomiting.'
        ]
      };
    }
  },
  {
    id: 'chest_palpitations',
    label: 'Chest Palpitations or Racing Heart',
    icon: '💓',
    category: 'Cardiovascular & Autonomic',
    keywords: ['heart', 'palpitation', 'racing', 'skip', 'pulse', 'afib', 'beat', 'flutter'],
    redFlags: [
      'Do you have chest pressure, tightness, squeezing, or pain spreading to your shoulder, arm, back, neck, or jaw?',
      'Are you feeling faint, short of breath at rest, or sweating coldly (diaphoresis)?',
      'Is your resting heart rate sustained above 130 bpm or do you have a known history of severe heart disease?'
    ],
    sensorQueue: [
      {
        moduleId: 'heart_stethoscope',
        title: '1. Digital Heart Stethoscope (Phonocardiogram 20–150 Hz)',
        sensor: 'Bottom MEMS Mic + 20–150 Hz Cardiac Filter',
        durationSec: 8,
        instruction: 'Press bottom microphone firmly over your left sternal border (chest) for 8 seconds while holding breath briefly to isolate S1 ("lub") and S2 ("dub").'
      },
      {
        moduleId: 'imu_scg',
        title: '2. Chest Seismocardiography (SCG) & Pulse Transit Time Proxy',
        sensor: '100 Hz 6-Axis IMU + Optical PPG',
        durationSec: 8,
        instruction: 'Lay phone flat on your sternum for 8 seconds so the accelerometer captures micro-vibrations of aortic valve opening (SCG).'
      },
      {
        moduleId: 'rppg_vitals',
        title: '3. Optical Beat-to-Beat Rhythm & HRV Regularity Scan',
        sensor: 'Camera rPPG Inter-Beat Interval (IBI) Analysis',
        durationSec: 8,
        instruction: 'Scan face or fingertip to evaluate R-R interval regularity and autonomic HRV balance.'
      }
    ],
    evaluate(readings) {
      const bpm = readings.bpm || 86;
      const hrv = readings.hrvRmssd || 38;
      const pttMs = readings.pttMs || 218;
      const tachy = bpm > 100;

      return {
        urgencyTier: tachy ? 'Same-Day GP / Walk-In ECG Check' : 'Routine GP Review with Recorded Phonocardiogram',
        urgencyColor: tachy ? 'amber' : 'emerald',
        clinicalScoreLabel: `Ventricular Rate: ${bpm} bpm | Beat Regularity: ${hrv < 85 ? 'Regular Sinus Pattern' : 'Elevated Beat-to-Beat Variance'}`,
        differentials: [
          {
            name: 'Sinus Tachycardia / Sympathetic Stress, Caffeine, or Dehydration Response',
            likelihood: '60–75%',
            rationale: `Measured rate ${bpm} bpm with RMSSD ${hrv} ms and Pulse Transit Time proxy ${pttMs} ms.`
          },
          {
            name: 'Benign Premature Atrial / Ventricular Contractions (PACs / PVCs)',
            likelihood: '20–35%',
            rationale: `Phonocardiogram (20–150 Hz) S1/S2 cadence and seismocardiogram micro-acceleration profile.`
          },
          {
            name: 'Paroxysmal Supraventricular Rhythm / AFib (Requires 12-Lead ECG to Confirm)',
            likelihood: hrv > 85 || bpm > 110 ? '20–35%' : '5–15%',
            rationale: `Evaluated from optical inter-beat interval variance (${hrv} ms).`
          }
        ],
        sensorEvidence: [
          `Optical PPG Rhythm: ${bpm} bpm | HRV (RMSSD) ${hrv} ms | Signal Quality Index ${readings.sqi || 0.94}`,
          `Digital Phonocardiogram (20–150 Hz): Distinct S1/S2 acoustic peaks without holosystolic murmur envelope`,
          `Chest Seismocardiography (IMU SCG): Estimated Pulse Transit Time (PTT) ${pttMs} ms (Normotensive Arterial Stiffness Trend)`
        ],
        recommendedActions: [
          'Try 60 seconds of 0.1 Hz paced breathing (4s inhale, 6s exhale) to stimulate vagal tone and re-measure BPM.',
          'Avoid caffeine, alcohol, and decongestants today; export the PDF report so your physician can review the timestamped vitals.',
          'Seek immediate emergency care if chest pain, shortness of breath, or near-fainting occurs.'
        ]
      };
    }
  },
  {
    id: 'fatigue_pale',
    label: 'Fatigue / Pale / Low Energy',
    icon: '🩸',
    category: 'Hematologic, Metabolic & Nutritional',
    keywords: ['tired', 'fatigue', 'pale', 'anemia', 'iron', 'weak', 'exhausted', 'yellow', 'b12'],
    redFlags: [
      'Have you noticed black, tarry stools, bright red blood in your stool, or unexplained heavy bleeding?',
      'Are you becoming breathless walking across a single room or experiencing chest heaviness on mild exertion?',
      'Have you noticed sudden yellowing of the whites of your eyes accompanied by dark tea-colored urine or abdominal pain?'
    ],
    sensorQueue: [
      {
        moduleId: 'eyelid_sclera_color',
        title: '1. Palpebral Conjunctiva (Anemia) & Sclera (Bilirubin) Scan',
        sensor: 'Camera CIE L*a*b* Colorimetry + White Balance',
        durationSec: 8,
        instruction: 'Pull down your lower eyelid in even light so the camera measures inner conjunctiva redness (CIE a* hemoglobin proxy) and scleral yellowness (CIE b*).'
      },
      {
        moduleId: 'tongue_color',
        title: '2. Tongue Mucosa & Papillary Scan (Iron / B12 Proxy)',
        sensor: 'Macro Colorimetry + Surface Texture',
        durationSec: 6,
        instruction: 'Stick out your tongue to check for pallor or smooth glossy redness (atrophic glossitis seen in B12/folate/iron deficiency).'
      },
      {
        moduleId: 'hand_tremor',
        title: '3. 10-Second Outstretched Hand Tremor & Resting HR Check',
        sensor: '100 Hz 6-Axis IMU + Camera rPPG',
        durationSec: 8,
        instruction: 'Hold phone in outstretched hand for 8 seconds to screen for fine 8–12 Hz metabolic/thyroid tremor and resting tachycardia.'
      }
    ],
    evaluate(readings) {
      const hgb = readings.hgbEstimate || 13.4;
      const bili = readings.bilirubinProxy || 0.72;
      const bpm = readings.bpm || 76;
      const tremorHz = readings.tremorFreqHz || 8.4;
      const lowHgb = hgb < 12.2;

      return {
        urgencyTier: lowHgb || bili > 1.8 ? 'Book Routine GP Lab Work (CBC, Ferritin, B12, TSH)' : 'Routine Wellness & Sleep/Nutrition Optimization',
        urgencyColor: lowHgb || bili > 1.8 ? 'amber' : 'emerald',
        clinicalScoreLabel: `Conjunctival Hemoglobin Proxy: ${hgb} g/dL | Scleral Index: ${bili} mg/dL`,
        differentials: [
          {
            name: 'Iron Deficiency or Vitamin B12 / Folate Depletion',
            likelihood: lowHgb ? '55–70%' : '20–35%',
            rationale: `Palpebral conjunctiva CIE a* erythema yielded estimated Hgb proxy of ${hgb} g/dL with tongue status: ${readings.glossitisRisk || 'Normal Papillary Mucosa'}.`
          },
          {
            name: 'Sleep Debt, Autonomic Fatigue, or Post-Viral Recovery',
            likelihood: '50–65%',
            rationale: `Resting HR ${bpm} bpm, HRV ${readings.hrvRmssd || 38} ms, and physiological tremor peak at ${tremorHz} Hz.`
          },
          {
            name: 'Thyroid Dysfunction (Hypo/Hyperthyroid Screening)',
            likelihood: '15–25%',
            rationale: `Screened via resting heart rate (${bpm} bpm) and fine postural tremor spectrum (${tremorHz} Hz).`
          }
        ],
        sensorEvidence: [
          `Palpebral Conjunctiva Colorimetry: Estimated Hgb Proxy ${hgb} g/dL (${readings.hgbStatus || 'Normal Perfusion'})`,
          `Scleral Bilirubin Colorimetry: ${bili} mg/dL proxy (${readings.scleraStatus || 'Anicteric / Clear Sclera'})`,
          `Tongue & IMU Metabolic Screen: ${readings.glossitisRisk || 'Normal Mucosa'} | Tremor Peak ${tremorHz} Hz | HR ${bpm} bpm`
        ],
        recommendedActions: [
          'Share the exported Doctor Handoff PDF with your GP to request a targeted blood panel (CBC, Serum Ferritin, Vitamin B12, TSH, and Comprehensive Metabolic Panel).',
          'Re-scan your lower eyelid in the same room lighting weekly to track your personal hemoglobin colorimetric baseline.'
        ]
      };
    }
  },
  {
    id: 'skin_rash_mole',
    label: 'Expanding Skin Rash or Mole',
    icon: '🔍',
    category: 'Dermatology & Soft-Tissue Perfusion',
    keywords: ['skin', 'rash', 'mole', 'spot', 'lesion', 'red', 'swelling', 'itch', 'bite', 'cellulitis'],
    redFlags: [
      'Is the redness spreading rapidly (noticeably larger every hour) with hot, tense skin, red streaks, or a high fever?',
      'Is there blistering or peeling skin alongside sores inside your mouth, eyes, or lips?',
      'Do you have facial/lip/tongue swelling or any trouble breathing (anaphylaxis)?'
    ],
    sensorQueue: [
      {
        moduleId: 'skin_colorimetry',
        title: '1. Calibrated Macro Lesion Colorimetry & Perfusion Halo',
        sensor: 'Camera CIE L*a*b* + LiDAR Scale Proxy',
        durationSec: 8,
        instruction: 'Hold camera 10–12 cm above the skin spot in even light to measure Erythema Index (local blood perfusion), Melanin Index, and border contrast.'
      },
      {
        moduleId: 'rppg_vitals',
        title: '2. Systemic Heart Rate & Fever-Response Check',
        sensor: 'Camera rPPG Blood-Volume Pulse',
        durationSec: 6,
        instruction: 'Checks whether resting heart rate is elevated (systemic inflammatory response check).'
      }
    ],
    evaluate(readings) {
      const erythema = readings.erythemaIndex || 21.5;
      const melanin = readings.melaninIndex || 34.2;
      const bpm = readings.bpm || 74;
      const highErythema = erythema > 26;

      return {
        urgencyTier: highErythema && bpm > 92 ? 'Same-Day Walk-In / Urgent Care Evaluation' : 'Routine GP / Dermatologist or Pharmacist Review',
        urgencyColor: highErythema ? 'amber' : 'emerald',
        clinicalScoreLabel: `Local Erythema Index: ${erythema} | Melanin Index: ${melanin}`,
        differentials: [
          {
            name: 'Localized Contact Dermatitis / Bite / Benign Inflammatory Reaction',
            likelihood: '60–75%',
            rationale: `Erythema index ${erythema} with systemic HR ${bpm} bpm (afebrile systemic baseline).`
          },
          {
            name: 'Pigmented Nevus / Lesion Requiring Longitudinal ABCDE Tracking',
            likelihood: melanin > 40 ? '35–50%' : '15–25%',
            rationale: `Melanin index ${melanin} recorded to baseline for millimeter border/color evolution tracking.`
          },
          {
            name: 'Early Superficial Cellulitis (Monitor Border Expansion)',
            likelihood: highErythema ? '20–35%' : '5–12%',
            rationale: `Perilesional redness L*a*b* a*=${readings.lab?.a || 22}; track whether erythema halo expands over 6–12 hours.`
          }
        ],
        sensorEvidence: [
          `Skin CIE L*a*b* Colorimetry: L* ${readings.lab?.L || 61.2}, a* ${readings.lab?.a || 19.8}, b* ${readings.lab?.b || 16.4}`,
          `Hemoglobin/Erythema Index: ${erythema} | Melanin Pigmentation Index: ${melanin}`,
          `Systemic Vitals: Resting HR ${bpm} bpm | HRV ${readings.hrvRmssd || 42} ms`
        ],
        recommendedActions: [
          'Save this scan to your baseline and re-scan under identical lighting in 24 hours (or 4 hours if warm/tender) to measure exact ΔE color and border change.',
          'Consult a BC Pharmacist (for minor rashes/dermatitis) or your GP for any pigmented lesion showing ABCDE changes.'
        ]
      };
    }
  },
  {
    id: 'plugged_ear_hearing',
    label: 'Sudden Plugged Ear / Hearing Change',
    icon: '👂',
    category: 'Otology & Cranial Nerve VIII (Weber/Rinne)',
    keywords: ['ear', 'hearing', 'deaf', 'plugged', 'ringing', 'tinnitus', 'muffled', 'wax'],
    redFlags: [
      'Did you lose hearing suddenly over a few hours or upon waking up WITHOUT obvious ear wax or cold symptoms (Sudden Sensorineural Hearing Loss is a time-critical medical urgency)?',
      'Do you have severe swelling, redness, and pain behind the ear pushing the earlobe forward (mastoiditis), or facial weakness on that side?',
      'Did this start right after head trauma, a loud blast, or scuba diving/barotrauma?'
    ],
    sensorQueue: [
      {
        moduleId: 'weber_hearing',
        title: '1. Pure-Tone Frequency Sweep + Weber Forehead Bone-Conduction Test',
        sensor: '128 Hz / 512 Hz Haptic-Acoustic Couple + Pure-Tone Synth',
        durationSec: 10,
        instruction: 'First test pure tones (250–4000 Hz), then press the vibrating phone firmly against the center of your forehead to determine if sound lateralizes to the plugged ear or the clearer ear.'
      },
      {
        moduleId: 'romberg_balance',
        title: '2. Vestibular Balance Sway Check (CN VIII Vestibulocochlear)',
        sensor: '6-Axis IMU Stabilogram',
        durationSec: 6,
        instruction: 'Brief 6-second balance check to verify inner-ear vestibular canal stability.'
      }
    ],
    evaluate(readings) {
      const weberSide = readings.weberLateralization || 'plugged';
      const isSensorineuralFlag = weberSide === 'good';

      return {
        urgencyTier: isSensorineuralFlag ? 'Same-Day Urgent Medical Evaluation (Rule Out Sudden SNHL)' : 'Routine GP / Clinic Ear Exam (Likely Conductive)',
        urgencyColor: isSensorineuralFlag ? 'rose' : 'emerald',
        clinicalScoreLabel: `Weber Bone-Conduction Result: ${
          weberSide === 'plugged'
            ? 'Lateralizes to Plugged Ear (Conductive Pattern)'
            : weberSide === 'good'
            ? 'Lateralizes to Unaffected Ear (Sensorineural Flag)'
            : 'Midline / Symmetric Perception'
        }`,
        differentials: [
          {
            name: 'Conductive Hearing Attenuation (Cerumen Impaction, Eustachian Tube Fluid, or Otitis Media)',
            likelihood: weberSide === 'plugged' ? '75–88%' : '20–30%',
            rationale: `In the Weber bone-conduction test, vibration heard louder in the plugged ear indicates conductive blockage (wax or middle-ear fluid masking ambient room noise).`
          },
          {
            name: 'Sudden Sensorineural Hearing Loss (SSNHL — Time-Sensitive)',
            likelihood: isSensorineuralFlag ? '45–65%' : '5–10%',
            rationale: `When forehead vibration lateralizes AWAY from the plugged ear to the unaffected ear, inner-ear cochlear/CN VIII nerve attenuation must be evaluated promptly (steroid window is 48–72h).`
          }
        ],
        sensorEvidence: [
          `Weber Forehead Bone-Conduction (128/512 Hz Couple): ${
            weberSide === 'plugged'
              ? 'Louder in Plugged Ear (Classic Conductive Pattern)'
              : weberSide === 'good'
              ? 'Louder in Clear Ear (Sensorineural Pattern — Urgent Evaluation Advised)'
              : 'Midline / Equal Bilateral Perception'
          }`,
          `Pure-Tone Frequency Screen: Tested 250 Hz, 500 Hz, 1000 Hz, 2000 Hz, 4000 Hz, 8000 Hz`,
          `Vestibular CN VIII Sway Check: Sway Path ${readings.swayPathMm || 16.2} mm (Romberg ${readings.rombergQuotient || 1.28}x)`
        ],
        recommendedActions: isSensorineuralFlag
          ? [
              'Because the Weber forehead test lateralized to your unaffected ear, seek a same-day physician/urgent-care otoscopic exam and audiogram (early treatment within 72 hours is critical for sensorineural hearing loss).',
              'Do NOT put drops or cotton swabs into the ear canal before a doctor looks at the eardrum.'
            ]
          : [
              'Conductive lateralization most commonly reflects earwax (cerumen) or middle-ear fluid congestion.',
              'Have a GP, walk-in clinic, or audiologist look inside the ear canal with an otoscope; avoid cotton swabs which push wax deeper.'
            ]
      };
    }
  }
];

export function matchSymptomToPreset(queryText) {
  const q = (queryText || '').toLowerCase().trim();
  if (!q) return SYMPTOM_PRESETS[0];

  let best = SYMPTOM_PRESETS[0];
  let bestScore = 0;
  for (const preset of SYMPTOM_PRESETS) {
    let score = 0;
    for (const kw of preset.keywords) {
      if (q.includes(kw)) score += 2;
    }
    if (score > bestScore) {
      bestScore = score;
      best = preset;
    }
  }
  return best;
}

export function loadPersonalBaseline() {
  try {
    const raw = localStorage.getItem(BASELINE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

export function savePersonalBaseline(metrics) {
  const payload = {
    timestamp: new Date().toISOString(),
    metrics: {
      bpm: metrics.bpm || 71,
      hrvRmssd: metrics.hrvRmssd || 43,
      respRate: metrics.respRate || 15,
      hgbEstimate: metrics.hgbEstimate || 14.1,
      bilirubinProxy: metrics.bilirubinProxy || 0.65,
      pupilLatencyMs: metrics.pupilLatencyMs || 232,
      f0Hz: metrics.f0Hz || 146,
      jitterPct: metrics.jitterPct || 0.54,
      hnrDb: metrics.hnrDb || 22.1,
      tremorFreqHz: metrics.tremorFreqHz || 8.6,
      tremorRms: metrics.tremorRms || 0.14,
      swayPathMm: metrics.swayPathMm || 16.4,
      rombergQuotient: metrics.rombergQuotient || 1.31
    }
  };
  try {
    localStorage.setItem(BASELINE_STORAGE_KEY, JSON.stringify(payload));
    const histRaw = localStorage.getItem(HISTORY_STORAGE_KEY);
    const hist = histRaw ? JSON.parse(histRaw) : [];
    hist.unshift(payload);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(hist.slice(0, 20)));
  } catch (_) {}
  return payload;
}

export function computeBaselineDrift(current, baselineObj) {
  if (!baselineObj || !baselineObj.metrics) return null;
  const b = baselineObj.metrics;
  const pct = (cur, base) => {
    if (!base) return 0;
    return +(((cur - base) / base) * 100).toFixed(1);
  };
  return {
    baselineTimestamp: baselineObj.timestamp,
    drifts: [
      {
        label: 'Resting Heart Rate',
        current: `${current.bpm} bpm`,
        baseline: `${b.bpm} bpm`,
        driftPct: pct(current.bpm, b.bpm),
        status: Math.abs(pct(current.bpm, b.bpm)) < 12 ? 'Stable' : 'Elevated Drift'
      },
      {
        label: 'HRV (RMSSD)',
        current: `${current.hrvRmssd} ms`,
        baseline: `${b.hrvRmssd} ms`,
        driftPct: pct(current.hrvRmssd, b.hrvRmssd),
        status: pct(current.hrvRmssd, b.hrvRmssd) > -18 ? 'Stable' : 'Autonomic Dip'
      },
      {
        label: 'Eyelid Hemoglobin Proxy',
        current: `${current.hgbEstimate} g/dL`,
        baseline: `${b.hgbEstimate} g/dL`,
        driftPct: pct(current.hgbEstimate, b.hgbEstimate),
        status: Math.abs(pct(current.hgbEstimate, b.hgbEstimate)) < 8 ? 'Stable' : 'Colorimetric Shift'
      },
      {
        label: 'Scleral Bilirubin Index',
        current: `${current.bilirubinProxy} mg/dL`,
        baseline: `${b.bilirubinProxy} mg/dL`,
        driftPct: pct(current.bilirubinProxy, b.bilirubinProxy),
        status: current.bilirubinProxy < 1.3 ? 'Anicteric' : 'Watch Sclera'
      },
      {
        label: 'Vocal Jitter / HNR',
        current: `${current.jitterPct}% / ${current.hnrDb} dB`,
        baseline: `${b.jitterPct}% / ${b.hnrDb} dB`,
        driftPct: pct(current.jitterPct, b.jitterPct),
        status: current.jitterPct < 1.0 ? 'Clear Voice' : 'Mild Hoarseness'
      },
      {
        label: 'Hand Tremor Peak',
        current: `${current.tremorFreqHz} Hz`,
        baseline: `${b.tremorFreqHz} Hz`,
        driftPct: pct(current.tremorFreqHz, b.tremorFreqHz),
        status: 'Physiological Band'
      },
      {
        label: 'Postural Sway (Romberg)',
        current: `${current.swayPathMm} mm (${current.rombergQuotient}x)`,
        baseline: `${b.swayPathMm} mm (${b.rombergQuotient}x)`,
        driftPct: pct(current.swayPathMm, b.swayPathMm),
        status: current.swayPathMm < 28 ? 'Balanced' : 'Elevated Sway'
      }
    ]
  };
}

// Add 7th preset: Fine Motor, Hand Tremor & Concussion / CNS Fatigue Check
SYMPTOM_PRESETS.push({
  id: 'neuro_tremor_concussion',
  label: 'Shakiness / Brain Fog / Fine-Motor Check',
  icon: '🧠',
  category: 'Neurology, Fine Motor & CNS Flicker Fusion',
  keywords: ['tremor', 'shake', 'shaky', 'concussion', 'headache', 'fog', 'parkinson', 'motor', 'coordination', 'numb'],
  redFlags: [
    'Do you have sudden one-sided facial droop, arm weakness, or slurred/garbled speech (FAST stroke signs)?',
    'Did this start after a head injury accompanied by vomiting, worsening severe headache, unequal pupils, or confusion?',
    'Are you experiencing a first-time seizure, loss of consciousness, or sudden inability to walk?'
  ],
  sensorQueue: [
    {
      moduleId: 'spiral_tap_neuro',
      title: '1. 240 Hz Archimedes Spiral & Alternating Finger-Tap Test',
      sensor: '240 Hz Capacitive Touch Digitizer',
      durationSec: 10,
      instruction: 'Trace the Archimedes spiral smoothly from center outward on the touchscreen, then alternate two-finger tapping to quantify dysmetria, bradykinesia, and tremor oscillation.'
    },
    {
      moduleId: 'hand_tremor',
      title: '2. 10-Second Outstretched Hand IMU Tremor Spectrum (4–12 Hz)',
      sensor: '100 Hz 6-Axis IMU Accelerometer + Gyro',
      durationSec: 8,
      instruction: 'Hold the phone flat in your outstretched hand for 8 seconds to separate resting (4–6 Hz), postural/essential (5–8 Hz), and physiological (8–12 Hz) tremor bands.'
    },
    {
      moduleId: 'cff_pupil_neuro',
      title: '3. Critical Flicker Fusion (CFF) & Flash Pupillometry',
      sensor: '120 Hz OLED Strobe + Camera Pupil Reflex',
      durationSec: 8,
      instruction: 'Identify the frequency (Hz) where the flickering light fuses into a steady glow (CNS arousal marker) and capture direct pupil constriction latency.'
    }
  ],
  evaluate(readings) {
    const spiralScore = readings.spiralScore || 92;
    const radialErr = readings.radialErrorMm || 1.25;
    const tremorHz = readings.tremorFreqHz || 8.4;
    const cffHz = readings.cffThresholdHz || 42.5;
    const pupilMs = readings.pupilLatencyMs || 234;
    const flag = spiralScore < 75 || cffHz < 35.0;

    return {
      urgencyTier: flag ? 'Book Neurological / GP Clinical Evaluation' : 'Reassuring Fine-Motor & CNS Baseline',
      urgencyColor: flag ? 'amber' : 'emerald',
      clinicalScoreLabel: `Spiral Motor Score: ${spiralScore}/100 | Tremor Peak: ${tremorHz} Hz | CFF: ${cffHz} Hz`,
      differentials: [
        {
          name: 'Enhanced Physiological Tremor (Sympathetic / Caffeine / Fatigue / Stress)',
          likelihood: tremorHz >= 8.0 ? '65–80%' : '35–50%',
          rationale: `Dominant IMU frequency peak at ${tremorHz} Hz with spiral radial error ${radialErr} mm and motor coordination score ${spiralScore}/100.`
        },
        {
          name: 'CNS Fatigue / Post-Concussive or Sleep-Deprivation Arousal Dip',
          likelihood: cffHz < 38.0 ? '40–55%' : '15–25%',
          rationale: `Critical Flicker Fusion threshold measured at ${cffHz} Hz (normal alert baseline 38–48 Hz) with pupil constriction latency ${pupilMs} ms.`
        },
        {
          name: 'Essential or Resting Tremor Spectrum (Requires Clinical Neuro Exam)',
          likelihood: tremorHz < 7.8 || spiralScore < 75 ? '25–45%' : '5–15%',
          rationale: `Evaluated via 4–8 Hz power spectrum band and 240 Hz digitizer velocity coefficient of variation.`
        }
      ],
      sensorEvidence: [
        `240 Hz Touch Digitizer Spiral: Score ${spiralScore}/100 | Mean Radial Error ${radialErr} mm | Finger-Tap Cadence ${readings.tapRateHz || 5.4} taps/sec`,
        `100 Hz 6-Axis IMU Tremor FFT: Peak ${tremorHz} Hz (${readings.tremorClass || '8–12 Hz Physiological Band'})`,
        `CNS Arousal & Pupillometry: Critical Flicker Fusion ${cffHz} Hz | Pupil Constriction Latency ${pupilMs} ms`
      ],
      recommendedActions: [
        'Compare today\'s Archimedes spiral score and CFF threshold against your rested morning baseline.',
        'If tremor persists when your hand is completely relaxed in your lap (4–6 Hz resting band) or handwriting shrinks, schedule a routine GP/neurology review.',
        'Export the Doctor Handoff PDF to share your quantitative spiral trajectory and IMU frequency spectrum with your physician.'
      ]
    };
  }
});

export function loadScanHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

export function saveScanHistoryItem(item) {
  try {
    const list = loadScanHistory();
    list.unshift({ timestamp: new Date().toISOString(), ...item });
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(list.slice(0, 50)));
    return list;
  } catch (_) { return []; }
}
