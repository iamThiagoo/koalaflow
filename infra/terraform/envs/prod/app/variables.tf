variable "aws_region" {
  description = "Region for regional resources and the state bucket."
  type        = string
}

variable "state_bucket" {
  description = "Terraform state bucket, used to read the other roots' outputs."
  type        = string
}

variable "image_tag" {
  description = "Tag of the app image in ECR (repositories are immutable, so use a unique tag such as a git SHA)."
  type        = string
}

variable "desired_count" {
  description = "Number of app tasks; 0 until an image exists in ECR."
  type        = number
}
