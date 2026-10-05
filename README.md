# AYURAGIES Clinical Intelligence Node 🦴

Welcome to the **AYURAGIES Platform**, a powerful, real-time AI-driven knee health monitoring and diagnostic system. 

## 🚀 Completely Offline & Mobile Ready

**No Internet? No Problem.**
The entire AYURAGIES engine is designed to run **100% offline**. You can download the Android APK directly to your phone and perform clinical-grade screenings, motion tracking, and AI diagnostic assessments anywhere in the world, completely disconnected from the cloud.

### 📱 Get the App
1. Download the `AYURAGIES_Clinical_v2.apk` (available in this repository).
2. Install it on your Android device (ensure "Install from unknown sources" is enabled).
3. Start screening immediately! All AI models, 3D joint reconstructions, and patient databases operate strictly **on-device** for maximum privacy, zero latency, and true portability.

## 💻 Platform Architecture
- **Frontend:** React, Tailwind CSS, Vite
- **Hardware Integration:** Real-time IMU sensor telemetry (Bluetooth)
- **Computer Vision:** On-device Gait & Motion Tracking

## 🌟 Key Clinical Features
- **Live Camera Feed:** Real-time motion capture and pose estimation.
- **3D Knee Reconstruction:** Live synchronization with hardware sensors (IMU, Temp, Pressure) to visualize Varus/Valgus angles and joint space dynamically.
- **AI Assessment:** Automated clinical scoring (Osteoarthritis Risk, Cartilage Integrity) with high-confidence diagnostics and immediate physical therapy recommendations.
- **Motion Analysis:** Deep kinematic graphing for Flexion-Extension and Gait Symmetry.

## 🛠️ Local Development (Web/Desktop)

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```
2. **Start the development server:**
   ```bash
   npm run dev
   ```
3. Open `http://localhost:5174` in your browser.
