# =============================================================================
# General Variables
# =============================================================================
variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "ap-southeast-2"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "laptopshop"
}

# =============================================================================
# VPC Variables
# =============================================================================
variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["ap-southeast-2a", "ap-southeast-2b"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.20.0/24"]
}

# =============================================================================
# EC2 Variables
# =============================================================================
variable "ec2_instance_type" {
  description = "EC2 instance type for the backend server"
  type        = string
  default     = "t3.small"  # 2 vCPU, 2GB RAM - much better performance
}

variable "ec2_key_name" {
  description = "Name of the SSH key pair for EC2 access"
  type        = string
  default     = "laptopshop-key"
}

variable "ec2_ami_id" {
  description = "AMI ID for EC2 instance (Amazon Linux 2023)"
  type        = string
  default     = "" # Will use data source if empty
}

# =============================================================================
# RDS Variables
# =============================================================================
variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_name" {
  description = "Name of the database"
  type        = string
  default     = "nodejspro"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "admin"
  sensitive   = true
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}

variable "db_allocated_storage" {
  description = "Allocated storage for RDS in GB"
  type        = number
  default     = 20
}

variable "db_max_allocated_storage" {
  description = "Maximum allocated storage for RDS autoscaling in GB"
  type        = number
  default     = 100
}

# =============================================================================
# S3 Variables
# =============================================================================
variable "s3_bucket_name" {
  description = "Name of the S3 bucket for image uploads"
  type        = string
  default     = "" # Will be generated if empty
}

variable "s3_force_destroy" {
  description = "Allow bucket deletion even if not empty"
  type        = bool
  default     = false
}

# =============================================================================
# Application Variables
# =============================================================================
variable "app_port" {
  description = "Port on which the application runs"
  type        = number
  default     = 3000
}

variable "allowed_ssh_cidr" {
  description = "CIDR block allowed for SSH access"
  type        = string
  default     = "0.0.0.0/0" # Restrict this in production!
}
