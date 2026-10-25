output "vpc_id" {
  description = "VPC id."
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "Public subnet ids (load balancer)."
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "Private subnet ids (ECS tasks, RDS, Redis)."
  value       = aws_subnet.private[*].id
}
