terraform {
  backend "s3" {
    bucket       = "koalaflow-tfstate-799183605660"
    key          = "bootstrap/terraform.tfstate"
    region       = "us-east-1"
    encrypt      = true
    use_lockfile = true
  }
}
