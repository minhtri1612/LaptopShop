# LaptopShop AWS Infrastructure

This Terraform configuration sets up the complete AWS infrastructure for the LaptopShop application.

## Architecture Overview

```
                                    ┌─────────────────────────────────────────────────────────┐
                                    │                         VPC                              │
                                    │                    (10.0.0.0/16)                         │
                                    │                                                          │
    Internet ──────►  Internet      │   ┌─────────────────┐      ┌─────────────────┐          │
                      Gateway ──────┼──►│  Public Subnet  │      │  Public Subnet  │          │
                         │          │   │   10.0.1.0/24   │      │   10.0.2.0/24   │          │
                         │          │   │    (AZ-1a)      │      │    (AZ-1b)      │          │
                         │          │   │                 │      │                 │          │
                         │          │   │   ┌─────────┐   │      │                 │          │
                         │          │   │   │   EC2   │   │      │   ┌─────────┐   │          │
                         └──────────┼───┼──►│ Backend │   │      │   │   NAT   │   │          │
                                    │   │   │         │   │      │   │ Gateway │   │          │
                                    │   │   └────┬────┘   │      │   └────┬────┘   │          │
                                    │   └────────┼────────┘      └────────┼────────┘          │
                                    │            │                        │                    │
                                    │            │                        │                    │
                                    │   ┌────────┼────────┐      ┌────────┼────────┐          │
                                    │   │ Private│Subnet  │      │ Private│Subnet  │          │
                                    │   │   10.0.10.0/24  │      │   10.0.20.0/24  │          │
                                    │   │    (AZ-1a)      │      │    (AZ-1b)      │          │
                                    │   │                 │      │                 │          │
                                    │   │   ┌─────────┐   │      │                 │          │
                                    │   │   │   RDS   │◄──┼──────┼─────────────────┤          │
                                    │   │   │  MySQL  │   │      │                 │          │
                                    │   │   └─────────┘   │      │                 │          │
                                    │   └─────────────────┘      └─────────────────┘          │
                                    └─────────────────────────────────────────────────────────┘
                                    
                                                    ┌─────────┐
                                                    │   S3    │
                              EC2 (via IAM role) ──►│ Bucket  │◄── Public Read
                                                    │ Images  │
                                                    └─────────┘
```

## Resources Created

| Resource | Description |
|----------|-------------|
| VPC | Virtual Private Cloud with DNS support |
| Internet Gateway | For public internet access |
| NAT Gateway | For private subnet internet access |
| Public Subnets (2) | For EC2 and load balancers |
| Private Subnets (2) | For RDS database |
| Security Groups | For EC2 and RDS |
| EC2 Instance | Backend application server |
| Elastic IP | Static IP for EC2 |
| RDS MySQL | Managed MySQL 8.0 database |
| S3 Bucket | Image storage with public read access |
| IAM Role & Policy | EC2 role for S3 access |

## Prerequisites

1. **AWS CLI** configured with appropriate credentials
2. **Terraform** >= 1.0 installed
3. **SSH Key Pair** created in AWS (for EC2 access)

## Quick Start

### 1. Configure Variables

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with your values:

```hcl
aws_region   = "ap-southeast-2"
environment  = "dev"
project_name = "laptopshop"

# IMPORTANT: Create this key pair in AWS Console first!
ec2_key_name = "laptopshop-key"

# Set a strong password!
db_password = "YourSecurePassword123!"
```

### 2. Initialize Terraform

```bash
terraform init
```

### 3. Review the Plan

```bash
terraform plan
```

### 4. Apply the Configuration

```bash
terraform apply
```

### 5. Get Output Values

```bash
terraform output

# Get sensitive outputs
terraform output -raw database_url
terraform output env_variables
```

## Outputs

After successful deployment, you'll get:

- `ec2_public_ip` - Public IP of the backend server
- `application_url` - URL to access the application
- `rds_endpoint` - Database connection endpoint
- `s3_bucket_name` - S3 bucket name for images
- `database_url` - Full database connection string
- `env_variables` - Environment variables for your `.env` file

## Environment Variables

Add these to your `.env` file:

```env
# Database Configuration
DATABASE_URL=mysql://admin:password@rds-endpoint:3306/nodejspro

# AWS S3 Configuration
AWS_REGION=ap-southeast-2
AWS_S3_BUCKET_NAME=laptopshop-images-xxxxxxxx

# When running on EC2 with IAM role, you don't need access keys
# For local development, add:
# AWS_ACCESS_KEY_ID=your_access_key
# AWS_SECRET_ACCESS_KEY=your_secret_key
```

## Deploying the Application

### SSH to EC2

```bash
ssh -i ~/.ssh/laptopshop-key.pem ec2-user@<ec2_public_ip>
```

### Deploy Application

```bash
# Clone your repository
cd /home/ec2-user/app
git clone https://github.com/your-repo/LaptopShop.git .

# Copy environment file
# Edit .env with your values

# Run deployment
./deploy.sh
```

## Cost Estimation (ap-southeast-2 Sydney)

| Resource | Type | Estimated Monthly Cost |
|----------|------|------------------------|
| EC2 | t3.micro | ~$8-10 |
| RDS | db.t3.micro | ~$15-20 |
| S3 | Standard | ~$1-5 (depends on usage) |
| NAT Gateway | - | ~$35-40 |
| Elastic IP | - | Free (when attached) |
| **Total** | | **~$60-80/month** |

> 💡 **Cost Saving Tips:**
> - Remove NAT Gateway if private subnets don't need internet
> - Use Reserved Instances for production
> - Enable S3 lifecycle rules for old images

## Security Considerations

⚠️ **Before going to production:**

1. **Restrict SSH access** - Change `allowed_ssh_cidr` from `0.0.0.0/0` to your IP
2. **Use Secrets Manager** - Store database credentials in AWS Secrets Manager
3. **Enable HTTPS** - Add an Application Load Balancer with SSL certificate
4. **Restrict S3 CORS** - Limit `allowed_origins` to your domain
5. **Enable RDS encryption** - Already enabled by default
6. **Use private S3** - Consider using CloudFront for image delivery

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

> ⚠️ **Warning:** This will delete all data including the RDS database!

## Troubleshooting

### Cannot connect to RDS
- RDS is in private subnet, only accessible from EC2
- Check security group allows port 3306 from EC2 security group

### EC2 cannot access S3
- Verify IAM instance profile is attached
- Check IAM policy permissions

### Application not accessible
- Check security group allows port 3000
- Verify application is running: `pm2 status`
- Check logs: `pm2 logs`

## File Structure

```
terraform/
├── 0-provider.tf           # Terraform & AWS provider config
├── 1-variables.tf          # Input variables
├── 2-vpc.tf                # VPC, subnets, routing
├── 3-security-groups.tf    # Security groups
├── 4-s3.tf                 # S3 bucket for images
├── 5-rds.tf                # RDS MySQL database
├── 6-iam.tf                # IAM roles and policies
├── 7-ec2.tf                # EC2 instance
├── 8-outputs.tf            # Output values
├── terraform.tfvars.example # Example variables
└── templates/
    └── user-data.sh        # EC2 bootstrap script
```
