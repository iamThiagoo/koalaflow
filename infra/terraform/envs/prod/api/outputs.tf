output "cluster_name" {
  description = "ECS cluster that runs the api and app services."
  value       = aws_ecs_cluster.this.name
}

output "api_security_group_id" {
  description = "Security group of the api tasks; the app adds its ingress rule to it."
  value       = aws_security_group.api.id
}

output "api_internal_url" {
  description = "Private URL of the api inside the VPC."
  value       = "http://api.${aws_service_discovery_private_dns_namespace.this.name}:${local.port}"
}

output "better_auth_secret_arn" {
  description = "Secret that holds BETTER_AUTH_SECRET; set its value with the AWS CLI."
  value       = aws_secretsmanager_secret.better_auth.arn
}
