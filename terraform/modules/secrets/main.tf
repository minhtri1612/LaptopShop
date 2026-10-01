resource "random_password" "session" {
  length  = 48
  special = false
}

resource "random_password" "jwt" {
  length  = 48
  special = false
}

resource "aws_secretsmanager_secret" "app" {
  name                    = "${var.name}/app"
  recovery_window_in_days = 7
}

resource "aws_secretsmanager_secret_version" "app" {
  secret_id = aws_secretsmanager_secret.app.id

  secret_string = jsonencode({
    DATABASE_URL         = "mysql://${var.db_username}:${var.db_password}@${var.db_host}:3306/${var.db_name}?connection_limit=20"
    DATABASE_REPLICA_URL = "mysql://${var.db_username}:${var.db_password}@${var.replica_host}:3306/${var.db_name}"
    SESSION_SECRET       = random_password.session.result
    JWT_SECRET           = random_password.jwt.result
  })
}
