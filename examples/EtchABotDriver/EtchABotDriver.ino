 /*
  * EtchABotDriver
  * by Debra Ansell (GeekMomProjects) 2015
  * www.geekmomprojects.com
  * 
  * Arduino firmware for Etch-a-Bot to receive commands via the serial port.  To be received
  * correctly, all command must terminate in a semicolon ';'.  You can type all of these commands
  * into the Arduino IDE serial monitor to test.  Examples command: "L 100 2000;" moves the stylus 
  * in a straight line from the current position to position (100, 2000).;
  * 
  * Command summary:
  * 'B': set backlash values (command of form 'B b_x b_y' where b_x, b_y are backlash values)
  * 'b': return currently set backlash values (returned in form 'b b_x b_y')
  * 's': return size ("Pocket size") or ("Travel size")
  * 'd' or 'D': return dimensions (in x y format)
  * 'e' or 'E': erase screen by tilting 
  * 'l': draw line to relative position (e.g. "l 200 -400;" draws a line to a point 200 steps to
  *      the right and 400 steps above the current position)
  * 'L': draw line to absolute position (e.g. "L 300 500;" draws a line from the current position
  *      to the coordinate [300, 5000])
  * 'm': move to relative position (same effect as 'l' since we can't lift the stylus)
  * 'M': move to absolute position (same effect as 'L' since we can't lift the stylus)
  * 'O': turn off motor/motors (specified as 'E', 'H', or 'V'.  (e.g. "O HV;" or "O E;" or "O EHV;")
  */

#include <Stepper.h>  // Must include Stepper.h anytime we use "EtchABot.h"
#include "EtchABot.h"


// Command buffer definitiions
#define BUFFER_SIZE 16
typedef struct {
  char cmd;
  int  x;
  int  y;
} command;

command cmdBuffer[BUFFER_SIZE];
byte readPtr = 0;
byte writePtr = 0;

// Create EtchABot object with default pin assignments.  Please specify TRAVEL_SIZE
//  or POCKET_SIZE as is appropriate in the constructor below
EtchABot etch(TRAVEL_SIZE);


// Returns true if there is space in the buffer to write a new command
boolean spaceInBuffer() {
  if (((readPtr + 1) % BUFFER_SIZE) == writePtr) return false;
  else return true;
}

void setup() {
     
  Serial.begin(57600);
  Serial.println("#start up");
  Serial.println("OK");
  
  // Seem to need delay here before starting to draw with motors
  delay(4000);
  
}


// Get the string out of the input.  Assumes each string has format: 'c x y', where
// 'c' is a character command and x,y are intergers
boolean extractCmd(String &inputString) {
    // First character had better be the command
    char cmd = inputString[0];
    int x = 0, y = 0;
    int space1, space2, len;
    boolean returnVal = true;
  
    switch (cmd) {
      case 'B': // Set backlash to supplied values
        space1 = inputString.indexOf(' ');
        space2 = inputString.lastIndexOf(' ');
        etch.setHBacklash(inputString.substring(space1 + 1, space2).toInt());
        etch.setVBacklash(inputString.substring(space2 + 1).toInt());
        Serial.print("#b ");
        Serial.print(etch.getHBacklash());
        Serial.print(", ");
        Serial.println(etch.getVBacklash());
        break;
      case 'b': // Return backlash values 
        Serial.print("#b ");
        Serial.print(etch.getHBacklash());
        Serial.print(" ");
        Serial.println(etch.getVBacklash());
        break;
      case 'D':
      case 'd':  // Return screen dimensions
        Serial.print("#D ");
        Serial.print(etch.getMaxX());
        Serial.print(" ");
        Serial.println(etch.getMaxY());
        break;  
      case 'E':
      case 'e':
        // Convert to upper case
        cmd = 'E';
        x = 0;
        y = 0;
        addCmdToBuffer(cmd, x, y);
        break;
      case 'L':
      case 'M':
        cmd = 'L';
        space1 = inputString.indexOf(' ');
        space2 = inputString.lastIndexOf(' ');
        x = inputString.substring(space1 + 1, space2).toInt();
        y = inputString.substring(space2 + 1).toInt();
        addCmdToBuffer(cmd, x, y);
        break;
      case 'l':
      case 'm':
        // Coordinates will be converted before moving to next point
        cmd = 'l';
        space1 = inputString.indexOf(' ');
        space2 = inputString.lastIndexOf(' ');
        x = inputString.substring(space1 + 1, space2).toInt();
        y = inputString.substring(space2 + 1).toInt();
        addCmdToBuffer(cmd, x, y);
        break;
      case 'O': // Shutoff specified motor
        space1 = inputString.indexOf(' ');
        inputString.toUpperCase(); 
        len = inputString.length();
        for (int i = space1 + 1; i < len; i++) {
          if (inputString.charAt(i) == 'E') etch.turnOffEraseMotor();
          else if (inputString.charAt(i) == 'H') etch.turnOffHorzMotor();
          else if (inputString.charAt(i) == 'V') etch.turnOffVertMotor();
        }
        break;
      case 's':  // Return string containing size
        if (etch.getType() == POCKET_SIZE) {
          Serial.println("#s Pocket size");
        } else {
          Serial.println("#s Travel size");
        }
        break;
      default:
        Serial.print("#unknown command: ");
        Serial.println(cmd);
        if (spaceInBuffer()) Serial.println("OK");
        returnVal = false;
        break;
    }
    
    // Add the command to the buffer and increment the write pointer
    if (spaceInBuffer()) Serial.println("OK");
    return returnVal;
}

// Adds a commad to the buffer and increments the write pointer
void addCmdToBuffer(char cmd, int x, int y) {
    cmdBuffer[writePtr].cmd = cmd;
    cmdBuffer[writePtr].x = x;
    cmdBuffer[writePtr].y = y;
    writePtr = (writePtr + 1) % BUFFER_SIZE; 
    if (spaceInBuffer()) Serial.println("OK");   
}

void doNextCmd() {
  if (readPtr == writePtr) return;  // no new commands
  
  //Serial.println("In doNextCmd");
  char cmd = cmdBuffer[readPtr].cmd;
  int x = cmdBuffer[readPtr].x;
  int y = cmdBuffer[readPtr].y;
  if (cmd == 'l') {
    x += etch.getX();
    y += etch.getY();
    cmd = 'L';
  }
    
  if (cmdBuffer[readPtr].cmd == 'E') {
    etch.doErase();
  } else if (cmdBuffer[readPtr].cmd == 'L') {
    etch.drawLine(x, y);
  } 
  readPtr = (readPtr + 1) % BUFFER_SIZE;
  if (spaceInBuffer()) Serial.println("OK");
    
  Serial.print("#cmd: ");
  Serial.print(cmd);
  if (cmd == 'E') {
    Serial.println("");
  } else {
    Serial.print(", x:");
    Serial.print(x);
    Serial.print(", y:");
    Serial.println(y);
  }
}


String inputString = "";
boolean stringComplete = false;
void loop() {

  #ifndef MODE_CALIBRATION
    // Fill the command buffer with commands
    // TBD - make sure we don't hang waiting for a new command
    while (Serial.available() && spaceInBuffer()) {
      // Get the new byte
      char inChar = (char) Serial.read();
      // add it to inputString
      if (inChar != '\n' && inChar != '\r') {
        inputString += inChar;
        if (inChar == ';') {
          stringComplete = true;
        }
      }
      // Parse the string for instructions
      if (stringComplete) {
        //delay(50);
        //Serial.print("Got String: ");
        //Serial.println(inputString.c_str());
        extractCmd(inputString);
        inputString = "";
        stringComplete = false;
      }
    }
    
    doNextCmd();
  #endif
}
