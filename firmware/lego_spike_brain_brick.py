# ==============================================================================
# Brain Brick — LEGO Mindstorms Robot Inventor (51515) / SPIKE Prime MicroPython Script
# ==============================================================================
# Creator: Beknur (15 y.o., Astana, Kazakhstan)
# Project: Brain Brick for RevenueCat Shipathon 2026
#
# INSTRUCTIONS:
# 1. Open the official LEGO Mindstorms app or LEGO SPIKE app on your computer/tablet.
# 2. Create a new Python project.
# 3. Paste this script into the project and click RUN (or Download to Hub slot 0).
# 4. Turn on your Hub.
# 5. Open Brain Brick on your Android phone in Chrome (or Capacitor app).
# 6. In Mission Control, switch mode to [🧱 LEGO 51515] and tap "Connect Link"!
# ==============================================================================

import time
import hub

# ------------------------------------------------------------------------------
# 1. Hardware Pin & Port Configuration
# ------------------------------------------------------------------------------
# Default standard driving base:
# Port A: Left Drive Motor
# Port B: Right Drive Motor
# Port C: Ultrasonic Distance Sensor (eyes)
# Port D: Gripper / Arm motor (optional)
# ------------------------------------------------------------------------------

print("[BrainBrick] Initializing LEGO Robot Inventor 51515 Hub...")

# Light up smiling face on 5x5 LED Matrix
hub.display.show(hub.Image.HAPPY)
time.sleep(0.5)

# Initialize motors
motor_left = hub.port.A.motor
motor_right = hub.port.B.motor

# Ultrasonic distance sensor on port C
sonar = None
if hasattr(hub.port.C, "device"):
    sonar = hub.port.C.device

# ------------------------------------------------------------------------------
# 2. Main Autonomous Safety & Telemetry Loop
# ------------------------------------------------------------------------------
# When connected via Bluetooth BLE to the Brain Brick mobile app,
# the app transmits LWP3 speed commands to ports A and B.
# This script runs a local reflex loop: if distance < 18cm, it auto-brakes!
# ------------------------------------------------------------------------------

def run_safety_loop():
    print("[BrainBrick] Safety reflex monitor active. Awaiting AI commands...")
    
    while True:
        try:
            # Check ultrasonic sensor if connected
            if sonar and hasattr(sonar, "get"):
                dist_data = sonar.get()
                if dist_data and len(dist_data) > 0:
                    distance_cm = dist_data[0]
                    
                    # Hardware reflex: if obstacle < 18cm ahead, cut motor power immediately!
                    if distance_cm is not None and 0 < distance_cm < 18:
                        if motor_left:
                            motor_left.brake()
                        if motor_right:
                            motor_right.brake()
                        hub.display.show(hub.Image.SAD)
                        time.sleep(0.2)
                        hub.display.show(hub.Image.HAPPY)

            # Battery level monitoring
            battery = hub.battery.capacity()
            
            time.sleep(0.05) # 20Hz loop
        except Exception as e:
            print("[BrainBrick] Loop warning:", e)
            time.sleep(0.1)

# Start safety monitor
run_safety_loop()
