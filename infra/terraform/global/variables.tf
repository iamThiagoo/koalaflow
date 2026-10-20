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
