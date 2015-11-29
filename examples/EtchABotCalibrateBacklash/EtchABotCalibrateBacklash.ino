/** EtchABotCalibrateBacklash
 *  Created by Debra Ansell (geekmomprojects), November 1, 2015.
 *  www.geekmomprojects.com
 *  This routine tests several different values for calibrating the vertical and horizontal
  * backlash on the Etch-a-Sketch.  Note that the optimal values will differ for drawing curved
  * lines and straight lines, as well as for angled lines and vertical/horizontal lines.  Pick
  * the backlash values that look best for what kind of drawing you plan to do next.
  */

#include <Stepper.h>  // Must include Stepper.h anytime we use "EtchABot.h"
#include "EtchABot.h"

#define MAX_BACKLASH 300
#define MIN_BACKLASH 0
#define N_BACKLASH_VALUES 8

// Create EtchABot object with default pin assignments.  Please specify TRAVEL_SIZE
//  or POCKET_SIZE as is appropriate in the constructor below
EtchABot etch(POCKET_SIZE);

void doBacklashTest(char direction, int startingBacklash, int increment) {
  Serial.println("Starting backlash test");
  etch.doErase();

  int startX = 500;
  int startY = 500;
  int lastX = etch.getMaxX() - 500;
  int lastY = etch.getMaxY() - 500;
  int ticLength = 500;
  if (direction == 'v') {
    etch.drawLine(startX, startY);
    etch.drawLine(lastX, startY);    //Long horizontal line
    etch.drawLine(lastX, startY + ticLength);
    int incrementWidth = (int) (1.0*(lastX - startX)/N_BACKLASH_VALUES);
    for (int i = 0; i < N_BACKLASH_VALUES; i++) {
      int backlash = startingBacklash + i*increment;
      Serial.print("Setting backlash to: ");
      Serial.println(backlash);
      etch.setVBacklash(backlash);
      etch.drawLine(lastX, startY);
      lastX -= incrementWidth;
      etch.drawLine(lastX, startY);
      etch.drawLine(lastX, startY + ticLength);
    }
  } else if (direction == 'h') {
    etch.drawLine(startX, startY);
    etch.drawLine(startX, lastY);  // Long vertical line
    etch.drawLine(startX + ticLength, lastY); 
    int incrementHeight = (int) (1.0*(lastY - startY)/N_BACKLASH_VALUES);
    for (int i = 0; i < N_BACKLASH_VALUES; i++) {
      int backlash = startingBacklash + i*increment;
      Serial.print("Setting backlash to: ");
      Serial.println(backlash);
      etch.setHBacklash(backlash);
      etch.drawLine(startX, lastY);
      lastY -= incrementHeight;
      etch.drawLine(startX, lastY);
      etch.drawLine(startX + ticLength, lastY);
    }
  }
  etch.drawLine(0,0); // Return stylus to origin

}

void setup() {
  // put your setup code here, to run once:
  Serial.begin(57600);

  // Get user input for testing values
  Serial.println("Ready for backlash calibration test.  BE SURE THE STYLUS");
  Serial.println("IS AT THE TOP LEFT OF THE SCREEN BEFORE CONTINUING.");
  Serial.println("");
  
  Serial.setTimeout(100000);  // Length of time (in millis) to wait for answers

  // Find out if we're testing horizontal or vertical calibration
  char calType = ' ';
  while (calType != 'h' && calType != 'v') {

    Serial.println("Test horizontal (h) or vertical (v) calibration?");
    Serial.println("Enter 'h' or 'v'");
    while (Serial.available() < 1);  // wait for input
    calType = Serial.read();
    if (calType == 'h') Serial.println("Testing horizontal calibration");
    else if (calType == 'v') Serial.println("Testing vertical calibration");
    else {
      Serial.print("Received character: ");
      Serial.print(calType);
      Serial.println(" for calibration type.");
    }
  }
  // Clear any characters from buffer
  while(Serial.available()) Serial.read();


  // Get starting backlash value
  int startingBacklash = -1;
  while (startingBacklash < MIN_BACKLASH || startingBacklash > MAX_BACKLASH) {
    Serial.print("Please enter a backlash value between ");
    Serial.print(MIN_BACKLASH);
    Serial.print(" and ");
    Serial.println(MAX_BACKLASH);
 
    startingBacklash = Serial.parseInt();
    Serial.print("Starting backlash value: ");
    Serial.println(startingBacklash);

    // Clear any remaining characters from serialbuffer;
    while (Serial.available() > 0) Serial.read();
  }

  // Get backlash increment for test
  int backlashIncrement = -1;
  while (backlashIncrement < 1 || backlashIncrement > 50) {
    Serial.println("Please enter a backlash increment value between 1 and 50");
    backlashIncrement = Serial.parseInt();
    Serial.print("Backlash increment: ");
    Serial.println(backlashIncrement);
    Serial.println(" ");

    // Clear any remaining serial buffer characters
    while (Serial.available() > 0) Serial.read();
  }

  doBacklashTest(calType, startingBacklash, backlashIncrement);
  etch.turnOffMotors();
}


void loop() {
  // put your main code here, to run repeatedly:
}
