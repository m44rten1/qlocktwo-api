import board
import time
import neopixel
pixels = neopixel.NeoPixel(board.D18, 2)

# pixels[0] = (255, 0, 0)
pixel_pin = board.D18

# The number of NeoPixels
num_pixels = 1
 
# The order of the pixel colors - RGB or GRB. Some NeoPixels have red and green reversed!
# For RGBW NeoPixels, simply change the ORDER to RGBW or GRBW.
ORDER = neopixel.GRB
 
pixels = neopixel.NeoPixel(pixel_pin, num_pixels, brightness=0.2, auto_write=False,
                           pixel_order=ORDER)

while True:
    pixels.fill((255, 0, 0))
    pixels.show()
    time.sleep(1)
    
    pixels.fill((0, 255, 0))
    pixels.show()
    time.sleep(1)
    
    pixels.fill((0, 0, 255))
    pixels.show()
    time.sleep(1)
    
