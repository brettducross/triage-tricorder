# Home Triage Tricorder — v2 3D Organ & Volumetric Body Scan Roadmap
*(Triggered as v1 adoption & revenue scale)*

## 1. Visual Goal
Upgrade the 2D wireframe/vector HUD into a **real-time interactive 3D WebGL / Three.js anatomical engine** (`60fps` on mobile GPUs via compressed Draco `.glb` anatomical meshes and custom GLSL holographic shaders) where every live phone sensor drives a 3D organ simulation in real time.

## 2. The 6 Interactive 3D Organ & Body Simulations
1. **3D Full-Body Volumetric CT/MRI-Style Slice Scanner (Mode 1 — 60s Checkup):**
   - Translucent glass-shader 3D human body with an interactive horizontal/coronal laser clipping plane that travels from head to toe as each stage of the 60-second scan progresses, illuminating the active organ system in volumetric teal/cyan.
2. **3D Beating Heart & Arterial Perfusion Mesh (Camera rPPG + Chest IMU SCG):**
   - 3D 4-chamber heart + aortic arch that contracts in exact phase-lock with the user's live rPPG pulse wave (`R-Peak` systole and `Dicrotic Notch` aortic valve closure), coloring myocardial and peripheral capillary perfusion dynamically.
3. **3D Bronchial Tree & Alveolar Acoustic Resonance Map (Raw Mic Stethoscope + 18–22 kHz Sonar):**
   - 3D trachea, left/right mainstem bronchi, and lung lobes that illuminate by frequency band (`100–300 Hz` large airway vs. `400–1200 Hz` wheeze/crackle zones) in sync with the live microphone FFT spectrogram.
4. **3D Cranial Nerve, Pupil Iris & Vocal Fold Kinematics (Ocular + 5s "Ahhh" Voice Lab):**
   - Close-up 3D iris sphincter constriction simulation synced to the flash pupillometry latency (`ms`), plus a 3D laryngeal vocal-cord vibration model driven by live fundamental frequency ($F_0$), jitter, and shimmer.
5. **3D Inner-Ear Cochlea & Skull Bone-Conduction Wave Propagation (Weber & Pure-Tone Lab):**
   - 3D skull + left/right cochlea and ossicles showing the `128 Hz` forehead vibration wave traveling through cranial bone and lateralizing to the selected ear (visually explaining conductive vs. sensorineural pathways to the patient and clinician).
6. **3D Skeletal Spine & Center-of-Mass Stabilogram Avatar (IMU Romberg & Hand Tremor Lab):**
   - Live 3D skeletal rig that tilts and sways in 1:1 sync with the phone's 6-axis gyroscope/accelerometer during the Eyes-Open vs. Eyes-Closed Romberg balance test.
