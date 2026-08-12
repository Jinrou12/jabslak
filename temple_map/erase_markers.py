import cv2
import numpy as np

# Load image
img = cv2.imread('map.jpg')

# Detect Cyan pixels (Numbers 1-16)
# BGR format in OpenCV: Cyan has High B, High G, Low R
hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

# Cyan mask in HSV: Hue around 80-100, Saturation > 100, Value > 150
lower_cyan = np.array([80, 100, 150])
upper_cyan = np.array([105, 255, 255])
cyan_mask = cv2.inRange(hsv, lower_cyan, upper_cyan)

# Yellow mask in HSV: Hue around 15-35, Saturation > 120, Value > 150
lower_yellow = np.array([15, 120, 150])
upper_yellow = np.array([35, 255, 255])
yellow_mask = cv2.inRange(hsv, lower_yellow, upper_yellow)

# Combine masks
combined_mask = cv2.bitwise_or(cyan_mask, yellow_mask)

# Dilate mask slightly to cover black outlines around numbers/letters
kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
dilated_mask = cv2.dilate(combined_mask, kernel, iterations=2)

# Inpaint using Telea algorithm
clean_bg = cv2.inpaint(img, dilated_mask, inpaintRadius=5, flags=cv2.INPAINT_TELEA)

# Save cleaned image with numbers & ABCDE removed!
cv2.imwrite('map_clean.jpg', clean_bg)
print("Erasure complete! Saved map_clean.jpg")
