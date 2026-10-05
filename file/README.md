# SAMVEDNA

**Sensor-Assisted Multi-modal Vibration & Emission Detection for Non-invasive Assessment**

*Listening to what your joints are telling you.*

An AI-assisted, sensor-fused wearable and offline-first mobile app for early screening of Osteoarthritis (OA) risk in the North Eastern Region (NER) of India.

Built for **Smart India Hackathon 2026** — Problem Statement ID **26004**, issued by the **Ministry of Development of North Eastern Region (MDoNER)**.

🔗 **Website / Download:** https://samvedna-9z1xwa1mb-ksrct.vercel.app/

---

## Table of Contents

- [Problem Statement](#problem-statement)
- [Overview](#overview)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Hardware](#hardware)
- [Mobile Application](#mobile-application)
- [AI / ML Model](#ai--ml-model)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Getting Started](#getting-started)
- [Datasets & Research References](#datasets--research-references)
- [Validation Status & Roadmap](#validation-status--roadmap)
- [Team](#team)
- [Disclaimer](#disclaimer)
- [License](#license)

---

## Problem Statement

Osteoarthritis is one of the most common musculoskeletal disorders, yet in the North Eastern Region it frequently goes undiagnosed due to difficult terrain, physically demanding livelihoods, an aging population, and limited access to specialist orthopaedic care. Rural and remote health facilities lack affordable, portable screening tools for early-stage detection.

**SAMVEDNA** addresses this directly: a portable, affordable, offline-capable screening system deployable in primary health centres, rural health camps, and community outreach programs — usable independently by a patient, a health worker, or a doctor.

## Overview

SAMVEDNA combines a **multi-sensor wearable knee band** with an **offline-first mobile application** to detect early OA risk markers during a simple movement test — no specialist equipment, no hospital visit, no internet connection required.

The scientific foundation is a **2026 peer-reviewed IIT Guwahati study** (*Medical Engineering & Physics*) validating acoustic-emission knee sensing on 121 Indian subjects — chosen deliberately because it is itself North Eastern Region-based research, not an imported assumption.

## Key Features

- 🎙️ **Acoustic Emission Sensing** — detects the friction sound released by degrading knee cartilage
- 🦵 **Motion Sensing** — dual IMUs track joint angle, gait phase, and bilateral symmetry
- ⚖️ **Pressure Sensing** — detects weight-bearing load asymmetry between legs
- 🧠 **Explainable AI Risk Model** — Random Forest / Gradient Boosted Trees + SHAP, outputs Low / Moderate / High risk with a stated reason, not a black-box score
- 📴 **Fully Offline-First** — registration, screening, reporting, and exercise tracking all work with zero internet; sync happens only when connectivity appears
- 🌐 **Multilingual** — English, Hindi, Assamese, expandable to other NER languages
- 👥 **One Universal Device** — the same hardware and app serve a patient at home, a health worker in a rural camp, or a doctor reviewing trends — no separate product lines, no mandatory human-review gate blocking a result
- 📈 **Longitudinal Tracking** — every screening is logged, building a risk trend over time, not just a single snapshot

## System Architecture

```
Wearable Knee Band (Acoustic + IMU + Pressure)
        │
        ▼
Data Ingestion Layer — ESP32: BLE + WiFi SoftAP
        │
        ▼
Offline Mobile App  ◄──────────►  AI Sensor Fusion
(SQLite + SQLCipher)               (Random Forest + SHAP)
        │                                   │
        │                                   ▼
        │                         Explainable AI
        │                         (top contributing sensor)
        ▼                                   │
Screening Decision  ◄──────────────────────┘
(Risk tier + guidance, shown instantly on-device)
        │
        ├──► Low/Moderate → Self-care guidance + re-screen reminder
        ├──► High → "Consult a doctor" recommendation
        │
        ▼
Backend Sync (when connectivity appears)
→ Trend storage + population-level model improvement
```

No mandatory health-worker review step is built into the core loop — the device is designed to work independently, the same way a home glucose-monitoring kit does, with professional consultation triggered automatically only when the risk tier warrants it.

## Hardware

| Component | Spec |
|---|---|
| Acoustic sensor | Nano 30 piezoelectric AE transducer (25.5mm × 15.2mm, 300 kHz resonance, 62 dB peak sensitivity) — same sensing element as the reference IIT Guwahati study |
| Acquisition electronics | Custom preamp + bandpass filter, ESP32-based ADC sampling — miniaturized in place of the industrial lab-grade acquisition system used in the reference study |
| IMU | 2× ISM330DHCX (thigh + shank) — joint angle, angular velocity, gait-phase detection, bilateral symmetry |
| Pressure | 2× FSR 402 — weight-bearing load and asymmetry |
| Compute / connectivity | ESP32-S3 — BLE (pairing, control, low-rate telemetry) + local WiFi SoftAP (high-throughput acoustic waveform transfer, no internet required) |
| Power | 3.7V 1000mAh Li-ion battery, USB-C charging |
| Protocol | 3× sit-to-stand-to-sit cycles (metronome-paced) + a 10-meter walk test |

Calibration is performed **per session**, not just at manufacture: an adaptive acoustic noise-floor threshold, a Hsu-Nielsen pencil-lead reference check, IMU neutral-pose zeroing, and FSR zero-offset calibration. Every calibration event is logged so an anomalous reading can always be traced back to a calibration issue rather than mistaken for a real signal.

## Mobile Application

Offline-first end-to-end: patient registration, screening capture, feature extraction, and report viewing all function with zero internet connectivity. Internet is used only for opportunistic backend sync.

**Seven tracking systems:**
1. Patient Profile
2. Screening Session
3. Risk / Biomarker Trend
4. Exercise Adherence
5. Symptom / Pain Diary
6. Device Calibration Log
7. Sync Status

**Security:** encrypted local storage (SQLite + SQLCipher), encrypted local WiFi transfer, TLS for backend sync, role-based access (Patient / Health Worker / Doctor views over the same data).

## AI / ML Model

1. Per-session feature extraction across all three sensors (acoustic hits, amplitude, rise time, duration, absolute energy, signal strength; joint angle, gait phase, symmetry; load asymmetry)
2. **Age/sex-baseline normalization** — necessary because biomarkers like acoustic hit count naturally rise with healthy aging; without this step, older patients would be falsely flagged as high-risk
3. **Random Forest / Gradient Boosted Trees classifier** — chosen over deep learning for reliability on small datasets and for interpretability
4. **SHAP (TreeSHAP)** — per-prediction explainability, showing which sensor/feature drove the result
5. **Confidence gate** — low-confidence results prompt a retest directly to the user; no external reviewer required
6. Aggregated feedback across devices feeds periodic backend model updates over time

## Tech Stack

`Flutter` · `SQLite + SQLCipher` · `Python` · `scikit-learn` · `SHAP` · `ESP32 / ESP32-S3` · `Arduino / ESP-IDF` · `Bluetooth Low Energy` · `WiFi (SoftAP)`

## Repository Structure

```
samvedna/
├── firmware/           # ESP32-S3 sensor capture + BLE/WiFi firmware
├── mobile-app/         # Flutter offline-first application
├── ml-model/           # Feature extraction, training, SHAP explainability
├── backend/            # Sync API, storage, analytics dashboard
├── docs/               # Architecture docs, calibration notes, datasets
└── README.md
```

> Adjust this section to match your actual folder layout as the repo evolves.

## Getting Started

### Firmware
```bash
# Requires: Arduino IDE or PlatformIO, ESP32-S3 board support
# Libraries: SparkFun 6DoF ISM330DHCX, plus standard ESP32 BLE/WiFi libraries
cd firmware/
# flash to ESP32-S3, then open Serial Monitor at 115200 baud
# Commands: CAL (calibrate) | START (begin session) | STOP (end session)
```

### Mobile App
```bash
cd mobile-app/
flutter pub get
flutter run
```

### ML Model
```bash
cd ml-model/
pip install -r requirements.txt
python train.py
```

## Datasets & Research References

**Core research anchor:**
- Verma, D.K. et al. (2026). *Knee joint health assessment using acoustic sensors in osteoarthritis: a quantitative and parametric study.* Medical Engineering & Physics, 147, 015006. IIT Guwahati.

**Supporting literature:**
- Khan, T.I. et al. (2021). *Research on diagnosis of knee osteoarthritis using acoustic emission technique.* Acoustical Science and Technology.
- Shark, L-K. et al. (2011). *Knee acoustic emission: a potential biomarker for quantitative assessment of joint ageing and degeneration.* Medical Engineering & Physics.
- Mascaro, B. et al. (2009). *Exploratory study of a non-invasive method based on acoustic emission for assessing the dynamic integrity of knee joints.* Medical Engineering & Physics.

**Public datasets used for pipeline validation:**
- Zenodo 7660579 — Khokhlova et al. knee acoustic emission dataset (51 participants, AE + KOOS + 5×sit-to-stand)
- Yareta clinical gait dataset — 100 confirmed knee-OA patients (pre/post TKA) + 32 controls, with WOMAC/SF-12 scores
- PhysioNet Multimodal Gait Dataset — 59 healthy subjects, research-grade IMU/EMG/force-plate reference

## Validation Status & Roadmap

SAMVEDNA is positioned honestly as a **screening and triage aid**, not a diagnostic replacement. Current validation status:

- [x] Architecture and sensor pipeline designed and bench-tested
- [x] Feature extraction validated in logic against public AE and gait datasets
- [ ] Real scaling-factor calibration against a lab-grade AE digitizer (pending access to a university NDT lab)
- [ ] Small pilot cohort with clinician-confirmed OA status and WOMAC scores
- [ ] Iterative replacement of literature-seeded baselines with measured pilot data
- [ ] On-device (fully offline) ML inference — currently deferred to backend scoring on sync

## Team

**Team Project Aarogya** — Smart India Hackathon 2026

- Arshath Mohamed A — [Leader]
- Kanikshaa R — [Member]
- Kanis S  — [Member]
- Mathiarasi E — [Member]
- Saran G — [Member]
- Sri Vishnu T S — [Member]

## Disclaimer

SAMVEDNA is a **screening and risk-awareness tool**. It does not provide a clinical diagnosis and is not a substitute for professional medical evaluation. A "High" risk result is a recommendation to consult a qualified doctor, not a diagnostic conclusion.

## License

*(Add your chosen license — e.g. MIT, Apache 2.0 — here)*
