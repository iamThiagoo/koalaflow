variable "aws_region" {
  description = "Region for regional resources and the state bucket."
  type        = string
}

variable "state_bucket" {
  description = "Terraform state bucket, used to read the network root outputs."
  type        = string
}
