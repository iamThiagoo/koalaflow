provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project   = "koalaflow"
      Component = "terraform-state"
      ManagedBy = "terraform"
    }
  }
}
