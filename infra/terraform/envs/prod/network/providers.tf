provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.tags
  }
}

locals {
  tags = {
    Project     = "koalaflow"
    Environment = "prod"
    Component   = "network"
    ManagedBy   = "terraform"
  }
}
