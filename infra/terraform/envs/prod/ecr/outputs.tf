output "repository_urls" {
  description = "Image repository URL per service (api, app)."
  value       = { for name, repository in aws_ecr_repository.this : name => repository.repository_url }
}

output "ecr_push_role_arn" {
  description = "Set as the ECR_PUSH_ROLE_ARN repository variable."
  value       = module.push_role.arn
}
