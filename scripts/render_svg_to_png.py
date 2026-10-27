import os
import shutil
import subprocess
import tempfile

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
DIAGRAMS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "docs", "diagrams"))

DIAGRAMS = [
    {
        "svg": "use-case.svg",
        "png": "use-case.png",
        "width": 1600,
        "height": 1220
    },
    {
        "svg": "erd.svg",
        "png": "erd.png",
        "width": 1850,
        "height": 1400
    },
    {
        "svg": "activity-posting-moderasi.svg",
        "png": "activity-posting-moderasi.png",
        "width": 1500,
        "height": 1000
    },
    {
        "svg": "activity-pencarian-rekomendasi.svg",
        "png": "activity-pencarian-rekomendasi.png",
        "width": 1500,
        "height": 980
    },
    {
        "svg": "activity-portofolio-skpi.svg",
        "png": "activity-portofolio-skpi.png",
        "width": 1500,
        "height": 900
    }
]

def render_all():
    print(f"Target Diagrams Directory: {DIAGRAMS_DIR}")
    temp_dir = tempfile.mkdtemp()
    
    try:
        for diag in DIAGRAMS:
            svg_file = os.path.join(DIAGRAMS_DIR, diag["svg"])
            png_dest = os.path.join(DIAGRAMS_DIR, diag["png"])
            temp_png = os.path.join(temp_dir, diag["png"])
            
            if not os.path.exists(svg_file):
                print(f"[SKIP] SVG not found: {svg_file}")
                continue
                
            print(f"Rendering {diag['svg']} -> {diag['png']} ({diag['width']}x{diag['height']})...")
            
            # Use file:/// URL
            file_url = f"file:///{svg_file.replace(os.sep, '/')}"
            
            cmd = [
                CHROME_PATH,
                "--headless=new",
                "--no-sandbox",
                "--disable-gpu",
                f"--user-data-dir={temp_dir}",
                f"--window-size={diag['width']},{diag['height']}",
                f"--screenshot={temp_png}",
                file_url
            ]
            
            res = subprocess.run(cmd, capture_output=True, text=True)
            
            if os.path.exists(temp_png) and os.path.getsize(temp_png) > 0:
                shutil.copy2(temp_png, png_dest)
                size_kb = os.path.getsize(png_dest) / 1024
                print(f"  [OK] Successfully generated {diag['png']} ({size_kb:.1f} KB)")
            else:
                print(f"  [ERROR] Failed to generate {diag['png']}. Stderr: {res.stderr}")
                
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)

if __name__ == "__main__":
    render_all()
