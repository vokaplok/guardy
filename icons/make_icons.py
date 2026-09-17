#!/usr/bin/env python3
"""Draw Guardy shield icons as PNG files."""
import math
import os
import struct
import zlib

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "icons")

INK = (27, 36, 28, 255)
GOLD = (212, 162, 76, 255)
CREAM = (246, 239, 226, 255)


def png(width, height, pixels):
    def chunk(tag, data):
        crc = zlib.crc32(tag + data) & 0xFFFFFFFF
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", crc)

    raw = b"".join(b"\x00" + bytes(pixels[y * width * 4 : (y + 1) * width * 4]) for y in range(height))
    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(raw, 9))
        + chunk(b"IEND", b"")
    )


def mix(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(4))


def setp(px, w, x, y, color):
    if 0 <= x < w and 0 <= y < w:
        i = (y * w + x) * 4
        px[i : i + 4] = color


def stamp(px, w, x, y, color, r=1.6):
    x0, y0 = int(x - r), int(y - r)
    x1, y1 = int(x + r), int(y + r)
    for yy in range(y0, y1 + 1):
        for xx in range(x0, x1 + 1):
            d = math.hypot(xx - x, yy - y)
            if d <= r:
                t = max(0.0, 1.0 - d / (r + 0.001))
                setp(px, w, xx, yy, mix((0, 0, 0, 0), color, min(1.0, t * 1.4)))


def inside_shield(nx, ny):
    # nx, ny in 0..1
    if ny < 0.12 or ny > 0.92:
        return False
    top = 0.18 + 0.22 * abs(nx - 0.5)
    if ny < top:
        return False
    half = 0.38 * (1.0 - (ny - 0.2) / 0.8) ** 0.85 + 0.08
    return abs(nx - 0.5) <= half


def draw(size):
    px = bytearray(size * size * 4)
    for y in range(size):
        for x in range(size):
            nx, ny = x / (size - 1), y / (size - 1)
            if inside_shield(nx, ny):
                inner = inside_shield(0.5 + (nx - 0.5) / 0.82, 0.08 + ny * 0.86)
                color = GOLD if inner else INK
                setp(px, size, x, y, color)
            elif inside_shield(0.5 + (nx - 0.5) / 1.08, ny + 0.01):
                setp(px, size, x, y, INK)

    # check mark
    steps = size * 4
    for i in range(steps):
        t = i / steps
        if t < 0.38:
            u = t / 0.38
            x = (0.32 + 0.12 * u) * size
            y = (0.50 + 0.14 * u) * size
        else:
            u = (t - 0.38) / 0.62
            x = (0.44 + 0.24 * u) * size
            y = (0.64 - 0.26 * u) * size
        stamp(px, size, x, y, INK, r=size * 0.045)
    return png(size, size, px)


os.makedirs(OUT, exist_ok=True)
for size in (16, 48, 128):
    path = os.path.join(OUT, f"icon{size}.png")
    with open(path, "wb") as handle:
        handle.write(draw(size))
    print(path)
