terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Uncomment this block to use S3 backend for state management
  # backend "s3" {
  #   bucket         = "laptopshop-terraform-state"
  #   key            = "terraform.tfstate"
  #   region         = "ap-southeast-2"
  #   encrypt        = true
  #   dynamodb_table = "terraform-state-lock"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "LaptopShop"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}