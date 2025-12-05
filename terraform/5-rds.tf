module "database" {
  source       = "./rds"
  project_name = "laptopshop-db"

  security_group_ids = [
    aws_security_group.rds.id
  ]
  subnet_ids = aws_subnet.public[*].id

  credentials = {
    username = "admin"
    password = var.db_password
  }
}
