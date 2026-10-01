output "address" {
  value = aws_db_instance.main.address
}

output "password" {
  value     = random_password.db.result
  sensitive = true
}

output "replica_address" {
  value = aws_db_instance.replica.address
}
