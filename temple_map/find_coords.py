from PIL import Image
import numpy as np

img = Image.open('map.jpg').convert('RGB')
arr = np.array(img)
h, w, _ = arr.shape

# Cyan filter: high Green, high Blue, low Red
# Cyan digits are brightly colored cyan: R < 100, G > 180, B > 200 (approx)
cyan_mask = (arr[:, :, 0] < 120) & (arr[:, :, 1] > 180) & (arr[:, :, 2] > 200)

# Yellow filter: high Red, high Green, low Blue
# Yellow letters: R > 200, G > 200, B < 100
yellow_mask = (arr[:, :, 0] > 200) & (arr[:, :, 1] > 200) & (arr[:, :, 2] < 100)

# Find connected components or bounding boxes for cyan and yellow pixels
import scipy.ndimage as ndimage

lbl_cyan, num_cyan = ndimage.label(cyan_mask)
print(f"Found {num_cyan} cyan regions")

cyan_centers = []
for i in range(1, num_cyan + 1):
    ys, xs = np.where(lbl_cyan == i)
    if len(xs) > 15: # filter out tiny noise
        cy, cx = int(np.mean(ys)), int(np.mean(xs))
        cyan_centers.append((cx, cy, len(xs)))

# Sort top-to-bottom or left-to-right to inspect
cyan_centers.sort(key=lambda item: (item[1], item[0]))
for c in cyan_centers:
    print(f"Cyan region: x={c[0]}, y={c[1]}, size={c[2]}")

lbl_yellow, num_yellow = ndimage.label(yellow_mask)
print(f"\nFound {num_yellow} yellow regions")
yellow_centers = []
for i in range(1, num_yellow + 1):
    ys, xs = np.where(lbl_yellow == i)
    if len(xs) > 15:
        cy, cx = int(np.mean(ys)), int(np.mean(xs))
        yellow_centers.append((cx, cy, len(xs)))

yellow_centers.sort(key=lambda item: (item[1], item[0]))
for c in yellow_centers:
    print(f"Yellow region: x={c[0]}, y={c[1]}, size={c[2]}")
