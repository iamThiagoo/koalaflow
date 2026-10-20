variable "aws_region" {
  description = "Default region for account-wide resources."
  type        = string
}

variable "domain_name" {
  description = "Apex domain served by Koalaflow. Null until a domain is bought; no hosted zone is created."
  type        = string
  default     = null
}

variable "github_subject_prefix" {
  description = "OIDC subject prefix GitHub issues for the repository allowed to assume CI roles. With immutable subjects it is repo:<owner>@<owner-id>/<repo>@<repo-id>; read it from `gh api repos/<owner>/<repo>/actions/oidc/customization/sub` (sub_claim_prefix)."
  type        = string

  validation {
    condition     = startswith(var.github_subject_prefix, "repo:")
    error_message = "github_subject_prefix must start with \"repo:\"."
  }
}

variable "monthly_budget_usd" {
  description = "Monthly AWS cost budget in USD; alerts are sent as spend approaches it."
  type        = number

  validation {
    condition     = var.monthly_budget_usd > 0
    error_message = "monthly_budget_usd must be greater than zero."
  }
}

variable "budget_alert_emails" {
  description = "Email addresses that receive budget alerts. Kept out of the repository: CI reads the BUDGET_ALERT_EMAILS secret, local runs read global/local.auto.tfvars."
  type        = list(string)
  sensitive   = true

  validation {
    condition     = length(var.budget_alert_emails) > 0
    error_message = "budget_alert_emails needs at least one address."
  }
}

variable "state_bucket" {
  description = "Terraform state bucket; the only bucket whose objects the plan role may read."
  type        = string
}
