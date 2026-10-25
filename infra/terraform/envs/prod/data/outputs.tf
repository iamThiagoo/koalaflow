output "db_address" {
  description = "Postgres host name."
  value       = aws_db_instance.this.address
}

output "db_port" {
  description = "Postgres port."
  value       = aws_db_instance.this.port
}

output "db_name" {
  description = "Initial database name."
  value       = aws_db_instance.this.db_name
}

output "db_master_secret_arn" {
  description = "Secrets Manager secret holding the master credentials."
  value       = aws_db_instance.this.master_user_secret[0].secret_arn
}

output "db_security_group_id" {
  description = "Security group of the database; workloads add their ingress rule to it."
  value       = aws_security_group.db.id
}

output "redis_endpoint" {
  description = "Redis primary endpoint host name."
  value       = aws_elasticache_replication_group.this.primary_endpoint_address
}

output "redis_security_group_id" {
  description = "Security group of Redis; workloads add their ingress rule to it."
  value       = aws_security_group.redis.id
}
