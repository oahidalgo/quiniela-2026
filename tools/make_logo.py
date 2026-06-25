"""
Procesa el logo United 2026:
- recorta la pelota (parte superior cuadrada)
- aplica máscara circular -> fondo transparente
- guarda en public/logo.png

Uso:
  1. Guardá la imagen del logo en:  D:\\Claudio\\quiniela-2026\\logo_src.png
  2. Ejecutá:  python tools/make_logo.py
"""
import os
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(HERE, "logo_src.png")
OUT_DIR = os.path.join(HERE, "public")
OUT = os.path.join(OUT_DIR, "logo.png")
SIZE = 256

def main():
    if not os.path.exists(SRC):
        print(f"[!] No encontré {SRC}")
        print("    Guardá la imagen del logo ahí y volvé a correr el script.")
        return

    img = Image.open(SRC).convert("RGBA")
    w, h = img.size

    # Recorta un cuadrado desde arriba (la pelota) ignorando el texto inferior
    side = min(w, h)
    box = (0, 0, w, w) if h >= w else (0, 0, w, h)
    ball = img.crop(box).resize((SIZE, SIZE), Image.LANCZOS)

    # Máscara circular -> esquinas transparentes (sin fondo blanco cuadrado)
    mask = Image.new("L", (SIZE, SIZE), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, SIZE, SIZE), fill=255)

    out = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    out.paste(ball, (0, 0), mask)

    os.makedirs(OUT_DIR, exist_ok=True)
    out.save(OUT)
    print(f"[ok] Logo guardado en {OUT}")

if __name__ == "__main__":
    main()
