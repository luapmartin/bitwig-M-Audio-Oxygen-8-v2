//Author : Paul MARTIN
//https://github.com/luapmartin/bitwig-M-Audio-Oxygen-8-v2

loadAPI(1);
host.defineController("M-Audio",
                      "Oxygen 8 v2",
                      "1.1",
                      "69ff52b0-e25b-11e5-a837-0800200c9a66");
host.defineMidiPorts(1, 0);
//linux name for auto-detection : "USB Oxygen 8 v2 MIDI 1"
host.addDeviceNameBasedDiscoveryPair(["USB Oxygen 8 v2 MIDI 1"],[]);
//Windows name for auto-detection : "USB Oxygen 8 v2"
//OSX name for auto-detection should be also : "USB Oxygen 8 v2"
host.addDeviceNameBasedDiscoveryPair(["USB Oxygen 8 v2"],[]);

//Possible names are :
//Oxygen 8 v2
//USB Oxygen 8 v2 MIDI 1
//USB-Audio - USB Oxygen 8 v2
//M-Audio USB Oxygen 8 v2
//Midiman Oxygen 8 v2

//CONSTANTS :
//Values from the M-Audio Oxygen 8 v2
//ROW_1_KNOBS 71, 74, 84, 7
//ROW_2_KNOBS 91, 93, 5, 10
//TRANSPORTS 20,21,22,23,24,25

var BUTTONS_CC = {
  LOOP: 20,
  REWIND: 21,
  FORWARD: 22,
  STOP: 23,
  PLAY: 24,
  RECORD: 25,
};
var DEVICE_START_CC = 20;
var DEVICE_END_CC = 25;

var KNOBS = {
  ROW_1_KNOB_1: 71,
  ROW_1_KNOB_2: 74,
  ROW_1_KNOB_3: 84,
  ROW_1_KNOB_4: 7,
  ROW_2_KNOB_1: 91,
  ROW_2_KNOB_2: 93,
  ROW_2_KNOB_3: 5,
  ROW_2_KNOB_4: 10,
};

var KNOBS_CCs = [];
for (macro_name in KNOBS) {
  KNOBS_CCs.push(KNOBS[macro_name]);
}

var LOWEST_CC = 1;
var HIGHEST_CC = 70;

function init() {
  host.getMidiInPort(0).setMidiCallback(onMidi);
  host.getMidiInPort(0).createNoteInput("Keyboard");
  
  transport = host.createTransport();
  cursorDevice = host.createCursorDeviceSection(8);
  cursorTrack = host.createCursorTrackSection(0, 0);
  primaryInstrument = cursorTrack.getPrimaryInstrument();

  for (var i = 0; i < 8; i++) {
    var p = primaryInstrument.getMacro(i).getAmount();
    p.setIndication(true);
  }

  //Make the rest freely mappable
  userControls = host.createUserControlsSection(HIGHEST_CC - LOWEST_CC + 1 - 8);
  for (var i = LOWEST_CC; i < HIGHEST_CC; i++) {
    if (!isInDeviceParametersRange(i)) {
      var index = userIndexFromCC(i);
      //Debug: println("i " + i + " index  " + index);
      userControls.getControl(index).setLabel("CC" + i);
    }
  }
}

function onMidi(status, data1, data2) {
  if (isChannelController(status)) {
    //Handle 8 macro-switches
    if (isInDeviceParametersRange(data1)) {
      switch (data1) {
        case KNOBS.ROW_1_KNOB_1:
          var index = 0;
          break;
        case KNOBS.ROW_1_KNOB_2:
          var index = 1;
          break;
        case KNOBS.ROW_1_KNOB_3:
          var index = 2
          break;
        case KNOBS.ROW_1_KNOB_4:
          var index = 3
          break;
        case KNOBS.ROW_2_KNOB_1:
          var index = 4;
          break;
        case KNOBS.ROW_2_KNOB_2:
          var index = 5;
          break;
        case KNOBS.ROW_2_KNOB_3:
          var index = 6;
          break;
        case KNOBS.ROW_2_KNOB_4:
          var index = 7;
          break;
      }
      primaryInstrument.getMacro(index).getAmount().set(data2, 128);
    }
    //Handle transport-buttons
    else if ((data1 >= DEVICE_START_CC && data1 <= DEVICE_END_CC) && data2 > 0) {
      switch (data1) {
        case BUTTONS_CC.LOOP:
          transport.toggleLoop();
          break;
        case BUTTONS_CC.REWIND:
          transport.rewind();
          break;
        case BUTTONS_CC.FORWARD:
          transport.fastForward();
          break;
        case BUTTONS_CC.STOP:
          transport.stop();
          break;
        case BUTTONS_CC.PLAY:
          transport.play();
          break;
        case BUTTONS_CC.RECORD:
          //cursorTrack.getArm().toggle();
          transport.record();
          break;
      }
    } else {
      //Handle remaining CCs
      if (data1 >= LOWEST_CC && data1 <= HIGHEST_CC) {
        var index = data1 - LOWEST_CC;
        userControls.getControl(index).set(data2, 128);
      }
    }
  }
}

function isInDeviceParametersRange(cc) {
  return (KNOBS_CCs.indexOf(cc) > -1);
}

function userIndexFromCC(cc) {
  if (cc > DEVICE_END_CC) {
    return cc - LOWEST_CC - 8;
  }
  return cc - LOWEST_CC;
}

function exit() {}
