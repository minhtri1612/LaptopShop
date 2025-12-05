# =============================================================================
# Jenkins EC2 Instance for CI/CD
# =============================================================================

# Jenkins Key Pair - using newly generated key
resource "aws_key_pair" "jenkins_key" {
  key_name   = "${var.project_name}-jenkins-key-${var.environment}"
  public_key = file("${path.module}/keys/jenkins-key.pub")

  tags = {
    Name = "${var.project_name}-jenkins-key-${var.environment}"
  }
}

# Security Group for Jenkins
resource "aws_security_group" "jenkins_sg" {
  name        = "${var.project_name}-jenkins-sg-${var.environment}"
  description = "Security group for Jenkins server"
  vpc_id      = aws_vpc.main.id

  # SSH access
  ingress {
    description = "SSH access"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Jenkins web UI
  ingress {
    description = "Jenkins web UI"
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Jenkins agent port
  ingress {
    description = "Jenkins agent port"
    from_port   = 50000
    to_port     = 50000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Outbound traffic
  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-jenkins-sg-${var.environment}"
  }
}

# IAM Role for Jenkins
resource "aws_iam_role" "jenkins_role" {
  name = "${var.project_name}-jenkins-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-jenkins-role-${var.environment}"
  }
}

# IAM Policy for Jenkins (ECR, S3, EC2 access)
resource "aws_iam_role_policy" "jenkins_policy" {
  name = "${var.project_name}-jenkins-policy-${var.environment}"
  role = aws_iam_role.jenkins_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:*",
          "s3:*",
          "ec2:Describe*"
        ]
        Resource = "*"
      }
    ]
  })
}

# IAM Instance Profile for Jenkins
resource "aws_iam_instance_profile" "jenkins_profile" {
  name = "${var.project_name}-jenkins-profile-${var.environment}"
  role = aws_iam_role.jenkins_role.name
}

# Jenkins EC2 Instance
resource "aws_instance" "jenkins" {
  ami                    = data.aws_ami.amazon_linux_2023.id
  instance_type          = "t3.medium"
  key_name               = aws_key_pair.jenkins_key.key_name
  vpc_security_group_ids = [aws_security_group.jenkins_sg.id]
  subnet_id              = aws_subnet.public[0].id
  iam_instance_profile   = aws_iam_instance_profile.jenkins_profile.name

  user_data = base64encode(<<-EOF
    #!/bin/bash
    set -e
    
    # Update system
    yum update -y
    
    # Install Java 17 (required for Jenkins)
    yum install -y java-17-amazon-corretto java-17-amazon-corretto-devel
    
    # Add Jenkins repo
    wget -O /etc/yum.repos.d/jenkins.repo https://pkg.jenkins.io/redhat-stable/jenkins.repo
    rpm --import https://pkg.jenkins.io/redhat-stable/jenkins.io-2023.key
    
    # Install Jenkins
    yum install -y jenkins
    
    # Install Docker
    yum install -y docker
    systemctl start docker
    systemctl enable docker
    usermod -a -G docker jenkins
    usermod -a -G docker ec2-user
    
    # Install Docker Compose
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    
    # Install Git
    yum install -y git
    
    # Install Node.js 18
    curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
    yum install -y nodejs
    
    # Start Jenkins
    systemctl start jenkins
    systemctl enable jenkins
    
    # Wait for Jenkins to start and get initial password
    sleep 60
    echo "Jenkins initial admin password:" > /home/ec2-user/jenkins-info.txt
    cat /var/lib/jenkins/secrets/initialAdminPassword >> /home/ec2-user/jenkins-info.txt
    chown ec2-user:ec2-user /home/ec2-user/jenkins-info.txt
  EOF
  )

  root_block_device {
    volume_size           = 30
    volume_type           = "gp3"
    encrypted             = true
    delete_on_termination = true
  }

  tags = {
    Name = "${var.project_name}-jenkins-${var.environment}"
    Type = "Jenkins"
  }
}

# Elastic IP for Jenkins
resource "aws_eip" "jenkins_eip" {
  instance = aws_instance.jenkins.id
  domain   = "vpc"

  tags = {
    Name = "${var.project_name}-jenkins-eip-${var.environment}"
  }
}

# =============================================================================
# Jenkins Outputs
# =============================================================================
output "jenkins_public_ip" {
  description = "Public IP of Jenkins server"
  value       = aws_eip.jenkins_eip.public_ip
}

output "jenkins_url" {
  description = "Jenkins web UI URL"
  value       = "http://${aws_eip.jenkins_eip.public_ip}:8080"
}

output "jenkins_ssh_command" {
  description = "SSH command to connect to Jenkins"
  value       = "ssh -i /home/minhtri/cloud/go-micro/terraform/jenkins_private_key.pem ec2-user@${aws_eip.jenkins_eip.public_ip}"
}
