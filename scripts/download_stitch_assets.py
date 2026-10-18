import urllib.request
import os

screens = [
    {
        "id": "6290df7c6a394fd6b8ac3e03e5411296",
        "slug": "01_feed_proyek",
        "title": "Beranda & Feed Proyek",
        "screenshot_url": "https://lh3.googleusercontent.com/aida/AEtjO1VOGqRqotfl8bVhw6h4KeUuxWlYuPNVhdshIwiVg51Wh6qS26g7OCwM_YNHDiqNjcZlW0XlQCsO5vfqdDT5TlivsEy2_bldyM_2TNJBgVyTtpI2bs4yDDtKCrOZmUXe9240RCmAl-YmVbMr5RUxJzq2X5LB6hP1IuxWw7K5gOGMJt5xsmh5V7WiGepDXhHV-7gVYnG3Kn-4580ZAV81Ye5qdREy-YeeYFqpdabf5e1NYn3ipg6fBNnZjarS",
        "html_url": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1ZDI2YjY1YWM5OWYwMmE5YjY1YTliMWRjOWNkEgsSBxDvkNfWphoYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDc0NDcxMTk2NDQxMzI0MDI0NQ&filename=&opi=89354086"
    },
    {
        "id": "b7f1491f2df345eb9049393f36c4d92c",
        "slug": "02_koleksi_portofolio",
        "title": "Koleksi Portofolio Mahasiswa",
        "screenshot_url": "https://lh3.googleusercontent.com/aida/AEtjO1WO330U-yo2a4eRN-xJNrAGA7qa0Ho_0lJF-3lGTLdOEdLL3JUz2MTZ6UbI2dOpDJ-p-XLhlA4RcqyaP5G4XeDRxdsuXjhAjTPXqLzzVlb3SYJNcKVvPD7BMuqS11KdzfLP5cEZxn0i6wWzXWSbFToYJSqGGF1Szipt73cXYTY1ZColnTxgsYXa8zs5E6QYiNAQOSKpmws9-Yh7AYHj8O6Zpr_pWoP5acGlSVVxyjxGY7xseuI1Pfntx7Er",
        "html_url": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1ZDI2YjY5ZDlkOTIwN2M0ZTQwMjE2MTRhMGU5EgsSBxDvkNfWphoYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDc0NDcxMTk2NDQxMzI0MDI0NQ&filename=&opi=89354086"
    },
    {
        "id": "c8ff4cb8186844c3beb115e66152b611",
        "slug": "03_profil_mahasiswa_skills",
        "title": "Profil Mahasiswa & Skills",
        "screenshot_url": "https://lh3.googleusercontent.com/aida/AEtjO1VJdH7hYQInlMKbox3GLA67hIUhalMLh-SV6A1OOkyH7vYuq4vtJusGueMaBQ9ztyzKO4_1F6MXIz2R_JYcK3r1nHu0HQdeBcNss2Iu7XjYBuSN6wD-5oANIcLB93vIy6MUqP5vZE_bBZorC9MaXyHUR2nJK-xezg-4NsW3vQl6WF5SFSjNNtBj0hIfAPGdV9YZZtadfM4eUfAhP19PxcTFFIvfgN3ZvhcHEOw38GQwUblP3LWk77TcNyEM",
        "html_url": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1ZDI2YjU1ZjdhMjEwNTIyYTA0YWY2MzljZDZlEgsSBxDvkNfWphoYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDc0NDcxMTk2NDQxMzI0MDI0NQ&filename=&opi=89354086"
    },
    {
        "id": "dae967c6aef143b99f1ba4e6d9b1e2b7",
        "slug": "04_jelajah_rekomendasi_ai",
        "title": "Jelajah & Rekomendasi AI",
        "screenshot_url": "https://lh3.googleusercontent.com/aida/AEtjO1XNdBSiCn6fEw4KKMA8aqi2HO3GSARIHtmpPNoqs_h05Ye1O2GNOHPnFg-eGbaMIKy86ALvEMlP9krRKXyw30vTb8FwohOl8nadnMnAvapCGBou1Ftzsxg1e4J3HgBEDkGNqD9U-22hVFLKU7GUO_J9uQ5y8xRcs_N3AcqIrNMXjPnNqXqRGq5gTc0Ktj_VBS1sBncwCf_2PEAPksEc_rpZo73LrQ51C8bfFvBZyNc8hRwp2tQE3_PIvOUT",
        "html_url": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1ZDI2YjYzNzJmZjgwNWMyZmVkODg5MjkwMjE0EgsSBxDvkNfWphoYAZIBJAoKcHJvamVjdF9pZBIWQhQxMDc0NDcxMTk2NDQxMzI0MDI0NQ&filename=&opi=89354086"
    },
    {
        "id": "1082489741570845153",
        "slug": "00_prd_pertemuan_1",
        "title": "PRD & Paket Pertemuan 1",
        "screenshot_url": None,
        "html_url": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBKOARIhYXBwX2NvbXBhbmlvbl91c2VyX3VwbG9hZGVkX2ZpbGVzGmkKM3VzZXJfdXBsb2FkZWRfaHRtbF8wMDA2NWQyNmFlZGNmOWJjMDFhNjBiN2E0ZDI1NGU0NxILEgcQ75DX1qYaGAGSASQKCnByb2plY3RfaWQSFkIUMTA3NDQ3MTE5NjQ0MTMyNDAyNDU&filename=&opi=89354086"
    }
]

os.makedirs("ui/stitch/screenshots", exist_ok=True)
os.makedirs("ui/stitch/html", exist_ok=True)

headers = {'User-Agent': 'Mozilla/5.0'}

for item in screens:
    print(f"Processing: {item['title']}...")
    
    # Download Screenshot
    if item["screenshot_url"]:
        img_path = f"ui/stitch/screenshots/{item['slug']}.png"
        try:
            req = urllib.request.Request(item["screenshot_url"], headers=headers)
            with urllib.request.urlopen(req) as resp, open(img_path, 'wb') as out_file:
                out_file.write(resp.read())
            print(f"  [OK] Saved screenshot -> {img_path}")
        except Exception as e:
            print(f"  [FAIL] Screenshot error: {e}")

    # Download HTML / Content
    if item["html_url"]:
        ext = "md" if item["id"] == "1082489741570845153" else "html"
        code_path = f"ui/stitch/html/{item['slug']}.{ext}"
        try:
            req = urllib.request.Request(item["html_url"], headers=headers)
            with urllib.request.urlopen(req) as resp, open(code_path, 'wb') as out_file:
                out_file.write(resp.read())
            print(f"  [OK] Saved code -> {code_path}")
        except Exception as e:
            print(f"  [FAIL] Code error: {e}")

print("All downloads complete!")
