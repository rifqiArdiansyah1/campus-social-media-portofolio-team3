import io

import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.main import app
from app.services.storage import storage_service

client = TestClient(app)


def test_image_validation_valid():
    img = Image.new("RGB", (100, 100), color="green")
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    data = buf.getvalue()

    sanitized, filename, content_type = storage_service.validate_and_sanitize_image(data)
    assert filename.endswith(".jpg")
    assert content_type == "image/jpeg"
    assert len(sanitized) > 0


def test_image_validation_png():
    img = Image.new("RGBA", (50, 50), color=(255, 0, 0, 128))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    data = buf.getvalue()

    sanitized, filename, content_type = storage_service.validate_and_sanitize_image(data)
    assert filename.endswith(".png")
    assert content_type == "image/png"


def test_image_validation_invalid_format():
    fake_data = b"GIF89a\x01\x00\x01\x00\x80\x00\x00\x00\x00\x00\xff\xff\xff!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;"
    with pytest.raises(ValueError, match="tidak didukung"):
        storage_service.validate_and_sanitize_image(fake_data)


def test_image_size_limit():
    huge_data = b"0" * (storage_service.max_image_size + 10)
    with pytest.raises(ValueError, match="melebihi batas maksimal"):
        storage_service.validate_and_sanitize_image(huge_data)


def test_pdf_validation_valid():
    pdf_bytes = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"
    data, filename, content_type = storage_service.validate_document_pdf(pdf_bytes)
    assert filename.endswith(".pdf")
    assert content_type == "application/pdf"
    assert data == pdf_bytes


def test_pdf_validation_with_leading_whitespace():
    # ISO 32000-1 §7.5.2 allows header within first 1024 bytes
    pdf_bytes = b"\r\n\t  %PDF-1.7\n%stream\n%%EOF"
    data, filename, content_type = storage_service.validate_document_pdf(pdf_bytes)
    assert filename.endswith(".pdf")
    assert content_type == "application/pdf"
    assert data == pdf_bytes


def test_pdf_validation_invalid_header():
    invalid_pdf = b"NOT_A_PDF_CONTENT"
    with pytest.raises(ValueError, match="bukan merupakan dokumen PDF yang valid"):
        storage_service.validate_document_pdf(invalid_pdf)


def test_pdf_size_limit():
    huge_pdf = b"%PDF-" + b"0" * (storage_service.max_doc_size + 10)
    with pytest.raises(ValueError, match="melebihi batas maksimal"):
        storage_service.validate_document_pdf(huge_pdf)


def test_local_storage_upload_and_static_serving():
    bucket = "post-images"
    test_data = b"fake-image-bytes-for-static-testing"
    path = storage_service.upload_file(bucket, "test_file.txt", test_data, "text/plain")
    assert path == "test_file.txt"

    public_url = storage_service.get_public_url(bucket, path)
    assert f"/static/{bucket}/{path}" in public_url

    response = client.get(f"/static/{bucket}/{path}")
    assert response.status_code == 200
    assert response.content == test_data


def test_pdf_validation_encrypted():
    encrypted_pdf = b"%PDF-1.4\n1 0 obj\n<< /Encrypt 2 0 R >>\nendobj\ntrailer\n<<>>\n%%EOF"
    with pytest.raises(ValueError, match="terenkripsi atau diproteksi"):
        storage_service.validate_document_pdf(encrypted_pdf)


def test_pdf_validation_with_user_id():
    pdf_bytes = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"
    data, filename, content_type = storage_service.validate_document_pdf(pdf_bytes, user_id=42)
    assert filename.startswith("42/")
    assert filename.endswith(".pdf")
    assert content_type == "application/pdf"


def test_object_exists():
    bucket = "portfolio-docs"
    test_data = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"
    path = storage_service.upload_file(bucket, "42/sample_doc.pdf", test_data, "application/pdf")
    assert storage_service.object_exists(bucket, path) is True
    assert storage_service.object_exists(bucket, "non_existent_file.pdf") is False
