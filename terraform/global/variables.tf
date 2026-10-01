variable "region" {
  description = "AWS region."
  type        = string
  default     = "ap-southeast-2"
}

variable "project_name" {
  description = "Project name used in resource names."
  type        = string
  default     = "laptopshop"
}

variable "environment" {
  description = "Environment name."
  type        = string

  validation {
    condition     = var.environment == "prod"
    error_message = "environment must be prod."
  }
}

variable "vpc_cidr" {
  description = "CIDR of this environment VPC. Each environment uses its own range."
  type        = string
}

variable "app_port" {
  type    = number
  default = 3000
}

variable "certificate_arn" {
  description = "ACM certificate ARN. Leave empty to serve HTTP only."
  type        = string
  default     = ""
}

variable "deletion_protection" {
  type    = bool
  default = false
}

variable "skip_final_snapshot" {
  type    = bool
  default = true
}

variable "db_name" {
  type    = string
  default = "nodejspro"
}

variable "db_username" {
  type    = string
  default = "admin"
}

variable "db_instance_class" {
  type    = string
  default = "db.t4g.micro"
}

variable "multi_az" {
  type    = bool
  default = false
}

variable "ecs_cpu" {
  type    = number
  default = 512
}

variable "ecs_memory" {
  type    = number
  default = 1024
}

variable "ecs_desired_count" {
  description = "Set to 0 until an image exists in ECR, then raise it."
  type        = number
  default     = 0
}

variable "image_tag" {
  type    = string
  default = "latest"
}

variable "github_repository" {
  description = "GitHub repository allowed to deploy, as owner/name."
  type        = string
  default     = "minhtri1612/LaptopShop"
}

variable "github_branch" {
  description = "Branch allowed to assume the deploy role."
  type        = string
  default     = "main"
}
