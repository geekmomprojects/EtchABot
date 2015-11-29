/*
 * EtchABotAnalogClock
 * by Debra Ansell (GeekMomProjets) 2015
 * www.geekmomprojects.com
 * 
 * Arduino firmware for Etch-a-Sketch analog clock. 
 *
 * RTC Clock Library usage copied from Plotclock by Johannes Heberlein
 * Obtain RTC and time libraries at http://playground.arduino.cc/Code/time
 * 
 */

#include <Time.h> 
#include <Stepper.h>  // Have to include stepper library to be able to use EtchABot library
#include "EtchABot.h"

#define REALTIMECLOCK  //Uncomment this to enable the real time clock

#ifdef REALTIMECLOCK
// for instructions on how to hook up a real time clock,
// see here -> http://www.pjrc.com/teensy/td_libs_DS1307RTC.html
// DS1307RTC works with the DS1307, DS1337 and DS3231 real time clock chips.
// Please run the SetTime example to initialize the time on new RTC chips and begin running.

  #include <Wire.h>
  #include <DS1307RTC.h> // see http://playground.arduino.cc/Code/time    
  // I'm using analog output pins 2 and 3 to supply power to the
  // RTC Clock pins, whic connect directly to Arduino as follows:
  // VCC -> A3 (digital 17), Set HIGH
  // GND -> A2 (digital 16), Set LOW
  // SDA -> A4 (SDA)
  // SCL -> A5 (SCL)

  #define VCC_PIN  17
  #define GND_PIN  16
#endif


#define MINUTE_HAND_LENGTH 1800
#define HOUR_HAND_LENGTH   1100
#define UPDATE_INTERVAL    1  //# of minutes between display updates

// Tracks time of last rendering
int lastMinute = -1;

// Initializes time - if no RTC or computer attached, just make up a time
void initializeTime() {
  Serial.begin(57600);
  
#ifdef REALTIMECLOCK
  pinMode(GND_PIN, OUTPUT);
  pinMode(VCC_PIN, OUTPUT);
  digitalWrite(GND_PIN, LOW);  // We're using A4, A5 (digital 16, 17) as Power, GND for RTC
  digitalWrite(VCC_PIN, HIGH);
  
  // Set current time only the first to values, hh,mm are needed  
  tmElements_t tm;
  if (RTC.read(tm)) {
    setTime(tm.Hour,tm.Minute,tm.Second,tm.Day,tm.Month,tm.Year);
    Serial.println("DS1307 time is set OK.");
  } else {
    if (RTC.chipPresent()){
      Serial.println("DS1307 is stopped.  Please run the SetTime example to initialize the time and begin running.");
    } else {
      Serial.println("DS1307 read error!  Please check the circuitry.");
    } 
  }
#else
  // Start the clock - just picking a random time for now (actucally, time is not totally random,
  //  it is an homage to PlotClock)
  setTime(19,38,0,0,0,0);
#endif 
}


// Be sure to initialize this the correct size (TRAVEL_SIZE or POCKET_SIZE)
//  for your Etch-a-Sketch.  Otherwise you run the risk of ruining your Etch-a-Sketch
EtchABot etch(POCKET_SIZE);

void setup() {
   
  Serial.begin(57600);
  Serial.println("#start up");
  
  // Seem to need delay here before starting to draw with motors
  delay(2000);
  
  // Set up time variables and initialize clock
  initializeTime();
  
  // Move to the middle of the screen and erase
  etch.drawLine(etch.getMaxX()/2, etch.getMaxY()/2);
  etch.doErase();
}

// Draws the hands of the analog clock, given current hour/min
void drawTime(int h, int m) {
  
  int centerX = etch.getMaxX()/2;
  int centerY = etch.getMaxY()/2;  

  // Make sure we are at the center (shouldn't be necessary)
  etch.drawLine(centerX, centerY);
  
  // Compute the angle of the hour and minute hand (in radians) relative to the center
  // in a frame where 0 degrees is at 12:00 and angle increases in the clockwise direction
  const float twoPi = 6.283;
  const float halfPi = 1.5707;
  float angleMin = twoPi*((float) m)/60.0;   // 
  float angleHour = twoPi*((float) (60.0*h + m))/(12.0*60.0);
  
  // convert angle to unit circle reference frame
  angleMin =  halfPi - angleMin;
  angleHour = halfPi - angleHour;
  
  /*
  Serial.print("AngleHour, AngleMin = ");
  Serial.print(((int) (angleHour*360/twoPi)) % 360);
  Serial.print(", ");
  Serial.println(((int) (angleMin*360/twoPi)) % 360);
  */
   
  // find x,y position relative to the center of the canvas
  // subtract y position because our coordinate system has y axis down, not up
  int xMinute = centerX + (int) (MINUTE_HAND_LENGTH*cos(angleMin));
  int yMinute = centerY - (int) (MINUTE_HAND_LENGTH*sin(angleMin));
  int xHour = centerX + (int) (HOUR_HAND_LENGTH*cos(angleHour));
  int yHour = centerY - (int) (HOUR_HAND_LENGTH*sin(angleHour));

  /*
  Serial.print("xHour, yHour = ");
  Serial.print(xHour);
  Serial.print(", ");
  Serial.println(yHour);
  Serial.print("xMin, yMin = ");
  Serial.print(xMinute);
  Serial.print(", ");
  Serial.println(yMinute);
  */
  
  // For now, just draw the hands as a straight line.
  etch.drawLine(xHour, yHour);
  etch.drawLine(centerX, centerY);
  etch.drawLine(xMinute, yMinute);
  etch.drawLine(centerX, centerY);
  etch.turnOffMotors();
}


void loop() {
  // When minutes have changed by UPDATE_INTERVAL, draw new clock face
    int h = hour();
    int m = minute();
    
    if (m >= (lastMinute + UPDATE_INTERVAL) % 60) {
      /*
      Serial.print("lastMinute = ");
      Serial.print(lastMinute);
      Serial.print(" Current time = ");
      Serial.print(h);
      Serial.print(":");
      Serial.println(m);
      */
      lastMinute = m;
      etch.doErase();
      drawTime(h, m);
    }
}
