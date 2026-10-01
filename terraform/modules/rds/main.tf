resource "random_password" "db" {
  length  = 32
  special = false
}

resource "aws_security_group" "rds" {
  name        = "${var.name}-rds"
  description = "MySQL from ECS tasks only"
  vpc_id      = var.vpc_id

  tags = {
    Name = "${var.name}-rds"
  }
}

resource "aws_vpc_security_group_ingress_rule" "mysql" {
  security_group_id            = aws_security_group.rds.id
  description                  = "ECS tasks"
  ip_protocol                  = "tcp"
  from_port                    = 3306
  to_port                      = 3306
  referenced_security_group_id = var.ecs_security_group_id
}

resource "aws_db_subnet_group" "main" {
  name       = var.name
  subnet_ids = var.private_subnet_ids

  tags = {
    Name = var.name
  }
}

resource "aws_db_instance" "main" {
  identifier = var.name

  engine         = "mysql"
  engine_version = "8.0"
  instance_class = var.instance_class

  db_name  = var.db_name
  username = var.db_username
  password = random_password.db.result

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp3"
  storage_encrypted     = true

  multi_az               = var.multi_az
  publicly_accessible    = false
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  backup_retention_period   = 7
  deletion_protection       = var.deletion_protection
  skip_final_snapshot       = var.skip_final_snapshot
  final_snapshot_identifier = var.skip_final_snapshot ? null : "${var.name}-final"

  auto_minor_version_upgrade      = true
  apply_immediately               = false
  enabled_cloudwatch_logs_exports = ["error", "slowquery"]
}

resource "aws_db_instance" "replica" {
  identifier          = "${var.name}-replica"
  replicate_source_db = aws_db_instance.main.identifier
  instance_class      = var.instance_class

  publicly_accessible    = false
  vpc_security_group_ids = [aws_security_group.rds.id]
  skip_final_snapshot    = true
  deletion_protection    = var.deletion_protection

  auto_minor_version_upgrade = true
  apply_immediately          = true
}
