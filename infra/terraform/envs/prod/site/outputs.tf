output "site_bucket" {
  description = "Set as the SITE_BUCKET repository variable."
  value       = module.site.bucket_name
}

output "site_distribution_id" {
  description = "Set as the SITE_DISTRIBUTION_ID repository variable."
  value       = module.site.distribution_id
}

output "site_deploy_role_arn" {
  description = "Set as the SITE_DEPLOY_ROLE_ARN repository variable."
  value       = module.deploy_role.arn
}

output "site_url" {
  description = "Set as the SITE_URL repository variable."
  value       = module.site.url
}
