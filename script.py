import board
import time
import neopixel
import sys

r = int(sys.argv[1])
g = int(sys.argv[2])
b = int(sys.argv[3])
brightness = float(sys.argv[4]) / 100.0

pixels = neopixel.NeoPixel(board.D18, 2)

# pixels[0] = (255, 0, 0)
pixel_pin = board.D18

# The number of NeoPixels
num_pixels = 1
 
# The order of the pixel colors - RGB or GRB. Some NeoPixels have red and green reversed!
# For RGBW NeoPixels, simply change the ORDER to RGBW or GRBW.
ORDER = neopixel.GRB
 
pixels = neopixel.NeoPixel(pixel_pin, num_pixels, brightness=brightness, auto_write=False,
                           pixel_order=ORDER)

pixels.fill((r, g, b))
pixels.show()
    
