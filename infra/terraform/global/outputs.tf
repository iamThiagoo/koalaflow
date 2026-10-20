output "domain_name" {
  description = "Apex domain, or null when none is set."
  value       = var.domain_name
}

output "zone_id" {
  description = "Route 53 hosted zone ID, or null when no domain is set."
  value       = one(aws_route53_zone.primary[*].zone_id)
}

output "name_servers" {
  description = "Name servers to set at the domain registrar, or null when no domain is set."
  value       = one(aws_route53_zone.primary[*].name_servers)
}

output "github_oidc_provider_arn" {
  description = "GitHub Actions OIDC provider ARN."
  value       = aws_iam_openid_connect_provider.github.arn
}

output "github_subject_prefix" {
  description = "OIDC subject prefix of the repository trusted by CI roles."
  value       = var.github_subject_prefix
}

output "terraform_plan_role_arn" {
  description = "Set as the TERRAFORM_PLAN_ROLE_ARN repository variable."
  value       = module.terraform_plan_role.arn
}

output "terraform_apply_role_arn" {
  description = "Set as the TERRAFORM_APPLY_ROLE_ARN repository variable."
  value       = module.terraform_apply_role.arn
}
