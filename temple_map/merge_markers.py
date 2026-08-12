import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

img = Image.open('map.jpg').convert('RGB')
arr = np.array(img)

# Let's write a script to cluster nearby cyan regions into single markers
cyan_mask = (arr[:, :, 0] < 120) & (arr[:, :, 1] > 180) & (arr[:, :, 2] > 200)

# Dilate mask slightly to merge two-digit numbers (like 10, 11, 12, 13, 14, 15, 16)
kernel = np.ones((15, 15), np.uint8)
dilated = cv2.dilate(cyan_mask.astype(np.uint8), kernel)

import scipy.ndimage as ndimage
lbl_cyan, num_cyan = ndimage.label(dilated)

markers = []
for i in range(1, num_cyan + 1):
    ys, xs = np.where(lbl_cyan == i)
    if len(xs) > 30:
        cx, cy = int(np.mean(xs)), int(np.mean(ys))
        markers.append((cx, cy))

markers.sort(key=lambda m: (m[1], m[0]))
print(f"Total merged cyan markers: {len(markers)}")
for idx, (x, y) in enumerate(markers):
    print(f"Marker {idx+1}: x={x}, y={y}")
