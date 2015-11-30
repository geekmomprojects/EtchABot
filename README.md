# EtchABot
Description of and source software for the EtchABot drawing bot.  Instructions for assembly are at http://www.geekmomprojects.com/etchabot-a-cnc-etch-a-sketch/

The EtchABot Arduino library files are:
-EtchABot.h
-EtchABot.cpp
-keywords.txt
They should be installed with the other Arduino libraries

Example Arduino sketches in "examples" folder.  They are:
(1) EtchABotAnalogClock - runs EtchABot as analog clock.  Requires calibrated DS3231 clock module to work.
(2) EtchABotCalibrateBacklash - runs calibration code to determine horizontal/vertical backlash parameters.
(3) EtchABotDriver - runs EtchABot in a mode to take commands from the Serial port.
(4) EtchABotJoystickControl - runs EtchABot in mode that draws the input from attached thumb joystick.
(5) EtchABotPatterns - draws parametric patterns (Lissajous or Spirograph), erases and restarts with different parameters every few minutes.

The SVG files for lasercut wood parts are in the "design" folder.  Parts are intended to be cut from 1/8" MDF or similar wood.

The nodefiles folder contains Node.js and javascript/HTML files to run an app to send images to the EtchABot through the serial port while it is running EtchABot driver.  This software is still a work in progress, however, to start the program, go to the "nodefiles" directory in a shell, and type "npm start -- portname" where portname is the name of the serial port the Arduino is attached to.  Then open a browswer window and type "localhost:8000" as the URL to run the program.
