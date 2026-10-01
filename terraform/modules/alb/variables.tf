variable "name" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "public_subnet_ids" {
  type = list(string)
}

variable "app_port" {
  type = number
}

variable "certificate_arn" {
  type    = string
  default = ""
}

variable "deletion_protection" {
  type    = bool
  default = false
}
