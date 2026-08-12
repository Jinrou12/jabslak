from PIL import Image, ImageDraw, ImageFont
import os

font_path = r"C:\Users\Visal\AppData\Local\Microsoft\Windows\Fonts\Battambang-Bold.ttf"
if not os.path.exists(font_path):
    font_path = r"C:\Users\Visal\AppData\Local\Microsoft\Windows\Fonts\KhmerOSbattambang.ttf"

font = ImageFont.truetype(font_path, 22)
text = "ពុទ្ឌកបឋមសិក្សាកម្រងហ៊ុនណេង"

# Check bbox vs metrics
bbox = font.getbbox(text)
ascent, descent = font.getmetrics()
print("BBox:", bbox)
print("Metrics (ascent, descent):", ascent, descent)

# Create a test canvas to check rendering
img = Image.new('RGB', (600, 100), (15, 23, 42))
draw = ImageDraw.Draw(img)

# Draw rounded rectangle box with generous padding
box_h = bbox[3] - bbox[1] + descent + 16
box_w = bbox[2] - bbox[0] + 30

draw.rounded_rectangle([10, 10, 10 + box_w, 10 + box_h], radius=6, fill=(15, 23, 42), outline=(0, 229, 255), width=2)
draw.text((25, 18), text, font=font, fill=(255, 255, 255))

img.save('test_text.png')
print("Saved test_text.png")
