MFRC522-python
==============
- Update Oct 2018  
  Replace spi by spidev\
  Remove Hardware reset\
  Remove GPIO from MFRC522\
  Add  DoorSystem example using a relay with mariadb sql\
  Check DoorSystem_HowTo.txt 

- Update Sept 2018
  Modification of the Read function to be able to get RFID Identification  of 7 Bytes and 10 bytes 


A small class to interface with the NFC reader Module MFRC522 on the Raspberry Pi.
This is a Python port of the example code for the NFC module MF522-AN.

## Examples
This repository includes a couple of examples showing how to read, write, and dump data from a chip. They are thoroughly commented, and should be easy to understand.

## Pins
You can use [this](http://i.imgur.com/y7Fnvhq.png) image for reference.

| Name | Pin # | Pin name   |
|:------:|:-------:|:------------:|
| SDA  | 24    | GPIO8      |
| SCK  | 23    | GPIO11     |
| MOSI | 19    | GPIO10     |
| MISO | 21    | GPIO9      |
| IRQ  | None  | None       |
| GND  | Any   | Any Ground |
| RST  | None  | None       |
| 3.3V | 1     | 3V3        |

## Usage
Import the class by importing MFRC522 in the top of your script. For more info see the examples.

## License
This code and examples are licensed under the GNU Lesser General Public License 3.0.
