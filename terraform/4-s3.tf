# =============================================================================
# S3 Bucket for Image Uploads
# =============================================================================
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

locals {
  s3_bucket_name = var.s3_bucket_name != "" ? var.s3_bucket_name : "${var.project_name}-images-${random_string.bucket_suffix.result}"
}

resource "aws_s3_bucket" "images" {
  bucket        = local.s3_bucket_name
  force_destroy = var.s3_force_destroy

  tags = {
    Name = "${var.project_name}-images-${var.environment}"
  }
}

# =============================================================================
# S3 Bucket Versioning
# =============================================================================
resource "aws_s3_bucket_versioning" "images" {
  bucket = aws_s3_bucket.images.id

  versioning_configuration {
    status = "Enabled"
  }
}

# =============================================================================
# S3 Bucket Public Access Block
# =============================================================================
resource "aws_s3_bucket_public_access_block" "images" {
  bucket = aws_s3_bucket.images.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# =============================================================================
# S3 Bucket Policy - Allow public read for images
# =============================================================================
resource "aws_s3_bucket_policy" "images" {
  bucket = aws_s3_bucket.images.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.images.arn}/*"
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.images]
}

# =============================================================================
# S3 Bucket CORS Configuration
# =============================================================================
resource "aws_s3_bucket_cors_configuration" "images" {
  bucket = aws_s3_bucket.images.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE", "HEAD"]
    allowed_origins = ["*"] # Restrict this in production!
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# =============================================================================
# S3 Bucket Lifecycle Rules
# =============================================================================
resource "aws_s3_bucket_lifecycle_configuration" "images" {
  bucket = aws_s3_bucket.images.id

  rule {
    id     = "delete-old-versions"
    status = "Enabled"

    filter {
      prefix = ""
    }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }

  rule {
    id     = "abort-incomplete-uploads"
    status = "Enabled"

    filter {
      prefix = ""
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}
