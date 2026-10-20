variable "aws_region" {
  description = "Region for regional resources (the site bucket)."
  type        = string
}

variable "state_bucket" {
  description = "Terraform state bucket, used to read the global root outputs."
  type        = string
}
