#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Annotating the clean high-resolution temple photo (1024x1024).
"""

import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

from PIL import Image, ImageDraw, ImageFont
import os

# Original coordinates on 966x966 scaled to 1024x1024
SCALE = 1024.0 / 966.0

ORIG_MARKERS = [
    ("ធម្មសាលាសភា",                  156, 428, "building"),
    ("មហាកុដិ",                       182, 520, "building"),
    ("កុដិសាឡុម",                     142, 673, "building"),
    ("កុដិតូច",                       43,  342, "building"),
    ("កុដិថ្មី",                      157, 259, "building"),
    ("កុដិគ្រូធំ",                   235, 259, "building"),
    ("ព្រះវិហារ",                     362, 524, "building"),
    ("ដើមពោធិព្រឹក្ស",               348, 636, "building"),
    ("បណ្ណាល័យ",                     568, 523, "building"),
    ("ពុទ្ឌកបឋមសិក្សាកម្រងហ៊ុនណេង", 565, 430, "building"),
    ("កុដិយាយតា",                    421, 258, "building"),
    ("ប៉ុស្តវិទ្យុ",                 523, 209, "building"),
    ("អាងទឹក",                       640, 283, "building"),
    ("អាងទឹកវិទ្យុ",                603, 183, "building"),
    ("ព្រះផ្ទំ",                      627, 351, "building"),
    ("ចេយតីចាយសៀងអីុ",              514, 759, "building"),
    ("ក្លោងទ្វារទី១",               740, 61,  "gate"),
    ("ក្លោងទ្វារទី២",               278, 186, "gate"),
    ("ក្លោងទ្វារទី៣",               907, 536, "gate"),
    ("ក្លោងទ្វារទី៤",               706, 683, "gate"),
    ("ក្លោងទ្វារទី៥",               41,  452, "gate"),
]

FONT_PATHS = [
    r"C:\Users\Visal\AppData\Local\Microsoft\Windows\Fonts\Battambang-Bold.ttf",
    r"C:\Users\Visal\AppData\Local\Microsoft\Windows\Fonts\KhmerOSbattambang.ttf",
    r"C:\Users\Visal\AppData\Local\Microsoft\Windows\Fonts\NotoSansKhmer-Bold.ttf",
    r"C:\Windows\Fonts\KhmerUIb.ttf",
]

def get_font(size):
    for p in FONT_PATHS:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                continue
    return ImageFont.load_default()

def draw_clean_label(draw, img_w, img_h, name, tx, ty, category, font):
    border_color = (0, 229, 255) if category == "building" else (255, 214, 0)

    nm_bb = font.getbbox(name)
    nw = nm_bb[2] - nm_bb[0]
    nh = nm_bb[3] - nm_bb[1]

    px, py = 8, 4
    box_w = nw + px * 2
    box_h = nh + py * 2

    # Center box on the target location
    bx1 = tx - box_w // 2
    by1 = ty - box_h // 2
    bx2 = bx1 + box_w
    by2 = by1 + box_h

    # Ensure box remains within image bounds
    if bx1 < 4:
        bx1, bx2 = 4, 4 + box_w
    if bx2 > img_w - 4:
        bx1, bx2 = img_w - 4 - box_w, img_w - 4
    if by1 < 4:
        by1, by2 = 4, 4 + box_h
    if by2 > img_h - 4:
        by1, by2 = img_h - 4 - box_h, img_h - 4

    # Draw small pin circle inside target
    draw.ellipse([tx-4, ty-4, tx+4, ty+4], fill=border_color, outline=(0,0,0), width=1)

    # Rounded rectangle background box with subtle shadow
    draw.rounded_rectangle([bx1, by1, bx2, by2], radius=5, fill=(15, 23, 42, 230), outline=border_color, width=2)

    # Render Khmer text with black shadow outline
    text_x = bx1 + px - nm_bb[0]
    text_y = by1 + py - nm_bb[1]

    for dx, dy in [(-1,-1),(1,-1),(-1,1),(1,1),(0,-1),(0,1),(-1,0),(1,0)]:
        draw.text((text_x + dx, text_y + dy), name, font=font, fill=(0, 0, 0))

    draw.text((text_x, text_y), name, font=font, fill=(255, 255, 255))

def main():
    img_path = 'map_clean_new.jpg'
    img = Image.open(img_path).convert('RGBA')
    W, H = img.size
    print(f"Annotating clean new image {img_path} ({W}x{H})...")

    overlay = Image.new('RGBA', (W, H), (0,0,0,0))
    draw = ImageDraw.Draw(overlay)

    font = get_font(15)

    for (name, ox, oy, category) in ORIG_MARKERS:
        tx = int(ox * SCALE)
        ty = int(oy * SCALE)
        draw_clean_label(draw, W, H, name, tx, ty, category, font)
        print(f"Labeled -> {name} at ({tx}, {ty})")

    out_img = Image.alpha_composite(img, overlay).convert('RGB')
    out_img.save('temple_map_labeled.jpg', quality=95)
    print("Saved temple_map_labeled.jpg successfully!")

if __name__ == '__main__':
    main()
