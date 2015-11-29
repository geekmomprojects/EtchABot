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
