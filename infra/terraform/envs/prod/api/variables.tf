variable "aws_region" {
  description = "Region for regional resources and the state bucket."
  type        = string
}

variable "state_bucket" {
  description = "Terraform state bucket, used to read the network, ecr and data root outputs."
  type        = string
}

variable "image_tag" {
  description = "Tag of the koalaflow-api image to run; the repository is immutable, so every release needs a new tag (e.g. the git SHA)."
  type        = string
}

variable "desired_count" {
  description = "Number of api tasks; keep 0 until the image exists in ECR."
  type        = number
}

variable "better_auth_url" {
  description = "Public base URL of the api as seen by browsers (Better Auth callbacks and cookies)."
  type        = string
}

variable "email_from" {
  description = "Sender address for sign-in codes."
  type        = string
}
