variable "aws_region" {
  description = "Region for the Terraform state bucket."
  type        = string
  default     = "ap-southeast-2"
}

variable "state_bucket_name" {
  description = "Globally unique name for the remote state bucket. Example: laptopshop-tfstate-123456789012."
  type        = string
}
