variable "name" {
  description = "IAM role name."
  type        = string
}

variable "oidc_provider_arn" {
  description = "ARN of the GitHub Actions OIDC provider in this account."
  type        = string
}

variable "subjects" {
  description = "Allowed GitHub token subjects, e.g. repo:owner@<id>/repo@<id>:ref:refs/heads/main."
  type        = list(string)

  validation {
    condition     = length(var.subjects) > 0 && alltrue([for s in var.subjects : startswith(s, "repo:")])
    error_message = "subjects must be non-empty and each one must start with \"repo:\"."
  }
}

variable "managed_policy_arns" {
  description = "Managed policies attached to the role."
  type        = list(string)
  default     = []
}

variable "inline_policies" {
  description = "Inline policy documents attached to the role, keyed by a static name, e.g. { deploy = <json> }."
  type        = map(string)
  default     = {}
}

variable "max_session_duration" {
  description = "Maximum session duration in seconds."
  type        = number
  default     = 3600
}
