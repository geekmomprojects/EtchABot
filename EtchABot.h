/*
 * EtchABot.h - Library for controlling the EtchABot.
 * Created by Debra Ansell (geekmomprojects), October 22, 2015.
 * www.geekmomprojects.com
 */
#ifndef EtchABot_h
#define EtchABot_h

#include "Arduino.h"
#include <Stepper.h>  // You MUST include the stepper library in your sketch
					  // as well because of Arduino IDE quirkiness in library includes
//#include <Time.h>

#define POCKET_SIZE 1
#define TRAVEL_SIZE 2

// Actual backlash varies with each Etch-a-Sketch.  Need to run
// calibration to find the optimal values
#define DEFAULT_HORZ_BACKLASH 120
#define DEFAULT_VERT_BACKLASH 120

#define MOTOR_SPEED 40 			// units are rev/min
#define STEPS_PER_ROT 2048 		// when running steppers in 4-step mode
								// which is what <Stepper.h> uses

// Size of drawing area in units of stepper motor steps
#define MAX_X_TRAVEL 6500
#define MAX_Y_TRAVEL 4600
#define MAX_X_POCKET 6000
#define MAX_Y_POCKET 4000

// Give the pen time to get to the right position
#define STEP_DELAY 3

class EtchABot
{
  private:
    int _hBacklash = DEFAULT_HORZ_BACKLASH;
	int _vBacklash = DEFAULT_VERT_BACKLASH;
	int _etchType;
	int _xMin=0, _yMin = 0, _xMax, _yMax;
	int _currentX = 0, _currentY = 0;  //Assume we're starting at the upper left corner always
	uint8_t _prevHorzDir = 0, _prevVertDir = 0;
	uint8_t _motorPins[12];   //List of motor pins used (in order horz, vert, erase);
	Stepper _stepperHorz, _stepperVert, _stepperErase;
	
	boolean horzDirChange(uint8_t dir);
	boolean vertDirChange(uint8_t dir);
	
  public:
    EtchABot(int type, int h1, int h2, int h3, int h4, int v1, int v2, int v3, int v4, int e1, int e2, int e3, int e4);
	EtchABot(int type);		
	
	void doErase();
    void drawLine(int targetX, int targetY, boolean motorShutOff=false);
	//void drawArc(int xCenter, int yCenter, int nSegs, float degrees);
	void turnOffMotors();
	void turnOffEraseMotor();
	void turnOffHorzMotor();
	void turnOffVertMotor();
	
	// Get/set functions
	int getType() {return _etchType;}
	int getX() {return _currentX;}
	int getY() {return _currentY;}
	int getMaxX() {return _xMax;}
	int getMaxY() {return _yMax;}
	int getHBacklash() {return _hBacklash;}
	int getVBacklash() {return _vBacklash;}
	void setHBacklash(int b) {_hBacklash = b;}
	void setVBacklash(int b) {_vBacklash = b;}
	
};

#endif