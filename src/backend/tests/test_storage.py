import io

import pytest
from PIL import Image

from app.services.storage import MAX_DOC_SIZE, MAX_IMAGE_SIZE, storage_service


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
    huge_data = b"0" * (MAX_IMAGE_SIZE + 10)
    with pytest.raises(ValueError, match="melebihi batas maksimal"):
        storage_service.validate_and_sanitize_image(huge_data)


def test_pdf_validation_valid():
    pdf_bytes = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"
    data, filename, content_type = storage_service.validate_document_pdf(pdf_bytes)
    assert filename.endswith(".pdf")
    assert content_type == "application/pdf"
    assert data == pdf_bytes


def test_pdf_validation_invalid_header():
    invalid_pdf = b"NOT_A_PDF_CONTENT"
    with pytest.raises(ValueError, match="bukan merupakan dokumen PDF yang valid"):
        storage_service.validate_document_pdf(invalid_pdf)


def test_pdf_size_limit():
    huge_pdf = b"%PDF-" + b"0" * (MAX_DOC_SIZE + 10)
    with pytest.raises(ValueError, match="melebihi batas maksimal"):
        storage_service.validate_document_pdf(huge_pdf)
