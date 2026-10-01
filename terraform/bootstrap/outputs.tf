output "state_bucket_name" {
  description = "Pass this to the main stack as the S3 backend bucket."
  value       = aws_s3_bucket.state.id
}

output "backend_hcl" {
  description = "Copy into terraform/backend.hcl before terraform init in the main stack."
  value       = <<-EOT
    bucket       = "${aws_s3_bucket.state.id}"
    key          = "prod/terraform.tfstate"
    region       = "${var.aws_region}"
    encrypt      = true
    use_lockfile = true
  EOT
}
