variable "name" {
  description = "Resource name prefix, e.g. koalaflow-prod-site."
  type        = string
}

variable "domain_name" {
  description = "Canonical host that serves the site, e.g. koalaflow.com. Null serves it on the CloudFront domain."
  type        = string
  default     = null
}

variable "redirect_domain_names" {
  description = "Extra hosts that redirect to domain_name. Only www.<domain_name> is supported by the viewer-request function."
  type        = list(string)
  default     = []

  validation {
    condition = (
      var.domain_name == null
      ? length(var.redirect_domain_names) == 0
      : alltrue([for d in var.redirect_domain_names : d == "www.${var.domain_name}"])
    )
    error_message = "redirect_domain_names may only contain www.<domain_name>, and needs domain_name."
  }
}

variable "zone_id" {
  description = "Route 53 hosted zone that holds domain_name. Required when domain_name is set."
  type        = string
  default     = null

  validation {
    condition     = var.domain_name == null || var.zone_id != null
    error_message = "zone_id is required when domain_name is set."
  }
}

variable "price_class" {
  description = "CloudFront price class. PriceClass_All includes the South America edges."
  type        = string
  default     = "PriceClass_All"
}
