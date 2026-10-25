terraform {
  backend "s3" {
    bucket       = "koalaflow-tfstate-799183605660"
    key          = "prod/data/terraform.tfstate"
    region       = "us-east-1"
    encrypt      = true
    use_lockfile = true
  }
}
