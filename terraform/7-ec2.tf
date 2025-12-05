# =============================================================================
# Data Source for Amazon Linux 2023 AMI
# =============================================================================
data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# =============================================================================
# EC2 Key Pair - Auto-created from local key file
# =============================================================================
resource "aws_key_pair" "ec2_key" {
  key_name   = "${var.project_name}-key-${var.environment}"
  public_key = file("${path.module}/keys/laptopshop-key.pub")

  tags = {
    Name = "${var.project_name}-key-${var.environment}"
  }
}

# =============================================================================
# EC2 Instance for Backend
# =============================================================================
resource "aws_instance" "backend" {
  ami                    = var.ec2_ami_id != "" ? var.ec2_ami_id : data.aws_ami.amazon_linux_2023.id
  instance_type          = var.ec2_instance_type
  key_name               = aws_key_pair.ec2_key.key_name
  subnet_id              = aws_subnet.public[0].id
  vpc_security_group_ids = [aws_security_group.ec2.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name

  root_block_device {
    volume_size           = 30
    volume_type           = "gp3"
    encrypted             = true
    delete_on_termination = true
  }

  user_data = base64encode(templatefile("${path.module}/templates/user-data.sh", {
    db_host        = module.database.rds_instance_address
    db_name        = var.db_name
    db_username    = var.db_username
    db_password    = var.db_password
    s3_bucket_name = aws_s3_bucket.images.bucket
    aws_region     = var.aws_region
    app_port       = var.app_port
  }))

  tags = {
    Name = "${var.project_name}-backend-${var.environment}"
  }

  # Wait for RDS to be available
  depends_on = [module.database]
}

# =============================================================================
# Elastic IP for EC2
# =============================================================================
resource "aws_eip" "backend" {
  instance = aws_instance.backend.id
  domain   = "vpc"

  tags = {
    Name = "${var.project_name}-backend-eip-${var.environment}"
  }
}
