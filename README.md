# 🛡️ DefenderID - Military Identity Security System

**DefenderID** is a high-security, local-first identity verification and gate access system designed for military and defense environments. It combines web-based personnel management with physical IoT-based gate control.

---

## 🚀 Key Features

*   **🔒 Restricted Access Control**: Only authorized military personnel and administrators can access the system.
*   **🪪 Digital ID Generation**: Generates professional defense identity cards with PDF and PNG export options.
*   **🖐 Biometric Integration**: Multi-stage authentication flow (Login -> Details -> Biometric Verification).
*   **🔍 Personnel Lookup Tool**: Integrated Admin/Security tool to instantly verify personnel details via Card ID.
*   **🎮 Physical Gate Control**: Real-time control and monitoring of a servo-based security gate.
*   **🌐 Local-First Architecture**: Runs entirely on a local network for maximum privacy and security.

---

## 🛠️ Technology Stack

*   **Frontend**: React.js, Tailwind CSS, Lucide Icons, Framer Motion.
*   **Backend**: Node.js, Express, MongoDB, JWT Authentication.
*   **IoT**: ESP32, AS608 Fingerprint Sensor, MG996R Servo, LCD I2C, 4x4 Keypad.

---

## 👤 Authorized Personnel

The system is currently configured for a specific defense unit. Only the following emails are authorized for access:

| Name | Email | Role |
| :--- | :--- | :--- |
| **Tamanna Saini** | `tamannasaini860@gmail.com` | Soldier (Personnel) |
| **Sonakshi** | `sonakshidhiman12@gmail.com` | Soldier (Personnel) |
| **System Admin** | `admin@gate.local` | Administrator |
| **Security Officer** | `security@gate.local` | Security / Guard |

---

## ⚙️ Installation & Setup

### 1. Prerequisites
*   **Node.js** (v16 or higher)
*   **MongoDB** (Running locally on port 27017)
*   **Arduino IDE** (For flashing the ESP32)

### 2. Quick Start (Windows)
Double-click the startup script in the `scripts/` folder:
📄 `scripts/start_project.bat`

This will automatically:
1.  Install Backend dependencies.
2.  Install Frontend dependencies.
3.  Seed the database with authorized personnel data.
4.  Launch both the Backend (Port 5000) and Frontend (Port 5173).

### 3. Database Seeding
To reset the database or reload personnel data manually:
```bash
cd backend
node seedData.js
```

---

## 🔌 Hardware Configuration

The system is designed to work with an **ESP32** microcontroller. 

1.  Open `iot-device/esp32/main.ino` in Arduino IDE.
2.  Update `iot-device/config/wifi_config.h` with your WiFi SSID, Password, and your Laptop's IP Address.
3.  Flash the code to your ESP32.

### Pin Mapping:
*   **Servo**: Pin 13
*   **Fingerprint (TX/RX)**: Pins 16/17
*   **LCD (SDA/SCL)**: Pins 21/22
*   **Keypad**: See `keypad_module.ino` for row/column mapping.

---

## 📂 Project Structure

```text
├── backend/            # Express API & MongoDB Models
├── frontend/           # React App (Vite + Tailwind)
├── iot-device/         # Arduino Sketches for ESP32
├── scripts/            # Automation (Batch scripts)
└── docs/               # Hardware Setup Guides
```

---

## ⚖️ License
Internal Use Only - Defense Security Division.
