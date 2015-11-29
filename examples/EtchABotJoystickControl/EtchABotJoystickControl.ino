/**
 * EtchABotJoystickControl 
 * Debra Ansell (www.geekmomprojects.com)
 * Using Sparkfun Analog Joystick to control direction of EtchABot motors.  
 * Pressing joystick button triggers erase.
 */

#include <Stepper.h>
#include "EtchABot.h"

int vert = 0;
int horz = 0;
int SEL, prevSEL = HIGH;
long lastDebounceTime = 0;
long debounceDelay = 50;  //millis

int VERT_MAX = 1023;
int HORZ_MAX = 1023;

#define MAX_DISTANCE 10
#define GND_PIN     A5    // Set to HIGH
#define VCC_PIN     A4    // Set to LOW
#define HORZ_PIN    A3
#define VERT_PIN    A2
#define BUTTON_PIN  A1

EtchABot etch(POCKET_SIZE);

void setup() {
  pinMode(GND_PIN, OUTPUT);
  pinMode(VCC_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT);
  pinMode(HORZ_PIN, INPUT);
  pinMode(VERT_PIN, INPUT);

  digitalWrite(GND_PIN, LOW);
  digitalWrite(VCC_PIN, HIGH);
  digitalWrite(BUTTON_PIN, HIGH);  // turn on pullup resistor
  Serial.begin(57600);
}

void loop() {
  // Check for button push - and debounce
  int reading = digitalRead(BUTTON_PIN);
  //Serial.print("reading = ");
  //Serial.println(reading);
  if (reading != prevSEL) {
     // reset timer
     lastDebounceTime = millis();
  }
  if (millis() - lastDebounceTime > debounceDelay) {
    if (reading != SEL) {
      SEL = reading;
        
      if (SEL == LOW) {  // Goes to ground if pressed (see sparkfun tutorial 272)
        etch.doErase();
      }
    }
  }
  prevSEL = reading;


  // Get direction relative to current position
  vert = analogRead(VERT_PIN);
  horz = analogRead(HORZ_PIN);

  // Get direction and magnitude of joystick vector (normalized to [-1.0,1.0] range
  float xNorm = 2.0*(vert - VERT_MAX/2.0)/VERT_MAX;
  float yNorm = -2.0*(horz - HORZ_MAX/2.0)/HORZ_MAX;

  // Ignore small fluctuations around the center
  if (abs(xNorm) < 0.1) xNorm = 0.0;
  if (abs(yNorm) < 0.1) yNorm = 0.0;

  int targetX = (int) round(etch.getX() + MAX_DISTANCE*xNorm);
  int targetY = (int) round(etch.getY() + MAX_DISTANCE*yNorm);
  targetX = constrain(targetX, 0, etch.getMaxX());
  targetY = constrain(targetY, 0, etch.getMaxY());

  /*
  Serial.print("(");
  Serial.print(targetX);
  Serial.print(", ");
  Serial.print(targetY);
  Serial.println(")");
  */
  etch.drawLine(targetX, targetY);
  
}
