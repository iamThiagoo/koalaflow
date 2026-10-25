data "terraform_remote_state" "global" {
  backend = "s3"
  config = {
    bucket = var.state_bucket
    key    = "global/terraform.tfstate"
    region = var.aws_region
  }
}

locals {
  global       = data.terraform_remote_state.global.outputs
  repositories = toset(["api", "app"])
}

resource "aws_ecr_repository" "this" {
  for_each = local.repositories

  name                 = "koalaflow-${each.key}"
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_lifecycle_policy" "this" {
  for_each = aws_ecr_repository.this

  repository = each.value.name
  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep the last 10 images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 10
      }
      action = { type = "expire" }
    }]
  })
}

data "aws_iam_policy_document" "push" {
  /**
   * Rule: ecr:GetAuthorizationToken does not support resource-level permissions, so it needs "*".
   */
  statement {
    actions   = ["ecr:GetAuthorizationToken"]
    resources = ["*"]
  }

  statement {
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:InitiateLayerUpload",
      "ecr:UploadLayerPart",
      "ecr:CompleteLayerUpload",
      "ecr:PutImage",
    ]
    resources = [for repository in aws_ecr_repository.this : repository.arn]
  }
}

module "push_role" {
  source = "../../../modules/github-oidc-role"

  name              = "koalaflow-prod-ecr-push"
  oidc_provider_arn = local.global.github_oidc_provider_arn
  subjects          = ["${local.global.github_subject_prefix}:ref:refs/heads/main"]
  inline_policies   = { push = data.aws_iam_policy_document.push.json }
}
