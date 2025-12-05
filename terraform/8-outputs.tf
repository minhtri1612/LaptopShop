# =============================================================================
# VPC Outputs
# =============================================================================
output "vpc_id" {
  description = "The ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "List of private subnet IDs"
  value       = aws_subnet.private[*].id
}

# =============================================================================
# EC2 Outputs
# =============================================================================
output "ec2_instance_id" {
  description = "The ID of the EC2 instance"
  value       = aws_instance.backend.id
}

output "ec2_public_ip" {
  description = "The Elastic IP address of the EC2 instance"
  value       = aws_eip.backend.public_ip
}

output "ec2_public_dns" {
  description = "The public DNS of the EC2 instance"
  value       = aws_instance.backend.public_dns
}

output "application_url" {
  description = "URL to access the application"
  value       = "http://${aws_eip.backend.public_ip}:${var.app_port}"
}

output "ssh_command" {
  description = "SSH command to connect to EC2 instance"
  value       = "ssh -i terraform/keys/laptopshop-key ec2-user@${aws_eip.backend.public_ip}"
}

output "ec2_key_name" {
  description = "Name of the SSH key pair"
  value       = aws_key_pair.ec2_key.key_name
}

# =============================================================================
# RDS Outputs
# =============================================================================
output "rds_endpoint" {
  description = "The endpoint of the RDS instance"
  value       = module.database.rds_instance_endpoint
}

output "rds_address" {
  description = "The hostname of the RDS instance"
  value       = module.database.rds_instance_address
}

output "rds_port" {
  description = "The port of the RDS instance"
  value       = module.database.rds_instance_port
}

output "database_url" {
  description = "Database connection URL for Prisma"
  value       = "mysql://${var.db_username}:${var.db_password}@${module.database.rds_instance_endpoint}/${var.db_name}"
  sensitive   = true
}

# =============================================================================
# S3 Outputs
# =============================================================================
output "s3_bucket_name" {
  description = "The name of the S3 bucket"
  value       = aws_s3_bucket.images.bucket
}

output "s3_bucket_arn" {
  description = "The ARN of the S3 bucket"
  value       = aws_s3_bucket.images.arn
}

output "s3_bucket_domain_name" {
  description = "The domain name of the S3 bucket"
  value       = aws_s3_bucket.images.bucket_domain_name
}

output "s3_bucket_regional_domain_name" {
  description = "The regional domain name of the S3 bucket"
  value       = aws_s3_bucket.images.bucket_regional_domain_name
}

# =============================================================================
# Environment Variables Output (for .env file)
# =============================================================================
output "env_variables" {
  description = "Environment variables to add to your .env file"
  value       = <<-EOT

    # ===========================================
    # Add these to your .env file
    # ===========================================
    
    # Database Configuration
    DATABASE_URL=mysql://${var.db_username}:****@${module.database.rds_instance_endpoint}/${var.db_name}
    
    # AWS S3 Configuration
    AWS_REGION=${var.aws_region}
    AWS_S3_BUCKET_NAME=${aws_s3_bucket.images.bucket}
    
    # Note: If using IAM role (recommended), you don't need access keys
    # If running locally, add these:
    # AWS_ACCESS_KEY_ID=your_access_key
    # AWS_SECRET_ACCESS_KEY=your_secret_key
    
  EOT
  sensitive   = true
}
