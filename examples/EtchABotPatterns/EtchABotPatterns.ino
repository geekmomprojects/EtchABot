/*
 * EtchABotPatterns
 * by Debra Ansell (GeekMomProjects) 2015
 * www.geekmomprojects.com
 *
 * Software to make changing mathematical patterns on the Etch-a-Bot.
 * You could add any mathematical function, as long as it is 
 * parameteric.  Just provide a doReset() and calculatePoint() 
 * function for it inside an #ifdef statement as done below with
 * SPIROGRAPH and LISAJOUS.
 */

#include <Stepper.h>  // Must include this if we will use "EtchABot.h"
#include "EtchABot.h"

#define DEGREES_T0_RADIANS  0.0174533
#define RESET_MINUTES 4  // # of minutes after which we reset the pattern

// Pick one of the options below to define the type of curve
#define SPIROGRAPH
//#define LISAJOUS

// *** !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! **
// Create the correct size EtchABot object (using default pin assignments)
// *** BE SURE TO SPECIFY THE SIZE OF YOUR ETCH-A-SKETCH HERE, OR IT COULD GET RUINED! **
EtchABot etch(POCKET_SIZE);

// Global parameteric variables
int angle = 0;
float t = 0;  // Parametric angle in radians

#ifdef LISAJOUS
  int hParam = 7;
  int vParam = 11;
  void doReset() {
    hParam = random(4, 12);
    vParam = random(4, 12);
  }
  
  int calculatePoint(int*x, int*y) {
  t = angle*DEGREES_T0_RADIANS;
  *x = (int) round((etch.getMaxX()/2 - 20)*sin(hParam*t) + etch.getMaxX()/2);
  *y = (int) round((etch.getMaxY()/2 - 20)*cos(vParam*t) + etch.getMaxY()/2);
  // Increment angle
  angle = angle + 2;
 }
#endif

#ifdef SPIROGRAPH
   // Initial values of spirograph parameters
  float lParam = .3;
  float kParam = .8;
  
  // Generates random new Spirograph parameters
  void doReset() {
    int r = random(15, 85);
    lParam = r/100.0;
    r = random(15, 85);
    kParam = r/100.0;
  }

  // Calculates the value of x, y from t (in radians), and increments the angle
  int calculatePoint(int* x, int* y) {
    Serial.println("Lisajous calculate point");
    t = angle*DEGREES_T0_RADIANS;
    float fac = (1.0 - kParam)/kParam;
    *x = (int) round((etch.getMaxY()/2-20)*((1 - kParam)*cos(t) + lParam*kParam*cos(fac*t)) + etch.getMaxX()/2);
    *y = (int) round((etch.getMaxY()/2-20)*((1 - kParam)*sin(t) - lParam*kParam*sin(fac*t)) + etch.getMaxY()/2);
    // Increment angle
    angle = angle + 2;
  }
#endif 


// Keeps track of the last time we restarted the spirograph
int lastStart;

void setup() {
  delay(2000);
  randomSeed(analogRead(0));  // Initialize random
  etch.doErase();
  doReset();
  // put your setup code here, to run once:
  lastStart = millis()/1000;

  // Smooth, repeating curves draw better with backlash turned off
  etch.setHBacklash(0);
  etch.setVBacklash(0);
}

void loop() {
  // Erase and restart every few minutes
  if (millis()/1000 - lastStart > 60*RESET_MINUTES) {
    etch.doErase();
    lastStart = millis()/1000;
    angle = 0;

    doReset();

  }
  // Draw the next line segment
  int x, y;
  calculatePoint(&x, &y);
  etch.drawLine(x,y);
}
