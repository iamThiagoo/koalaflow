data "terraform_remote_state" "global" {
  backend = "s3"

  config = {
    bucket = var.state_bucket
    key    = "global/terraform.tfstate"
    region = var.aws_region
  }
}

/**
 * Rule: null outputs are not stored in state, so a missing domain or zone reads as null.
 */
locals {
  global      = data.terraform_remote_state.global.outputs
  domain_name = try(local.global.domain_name, null)
}

module "site" {
  source = "../../../modules/static-site"

  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }

  name                  = "koalaflow-prod-site"
  domain_name           = local.domain_name
  redirect_domain_names = local.domain_name == null ? [] : ["www.${local.domain_name}"]
  zone_id               = try(local.global.zone_id, null)
}

/**
 * Rule: the deploy workflow can only replace site files and invalidate the site cache.
 */
data "aws_iam_policy_document" "deploy" {
  statement {
    sid       = "ListSiteBucket"
    actions   = ["s3:ListBucket"]
    resources = [module.site.bucket_arn]
  }

  statement {
    sid       = "WriteSiteObjects"
    actions   = ["s3:PutObject", "s3:DeleteObject"]
    resources = ["${module.site.bucket_arn}/*"]
  }

  statement {
    sid       = "InvalidateSiteCache"
    actions   = ["cloudfront:CreateInvalidation", "cloudfront:GetInvalidation"]
    resources = [module.site.distribution_arn]
  }
}

module "deploy_role" {
  source = "../../../modules/github-oidc-role"

  name              = "koalaflow-prod-site-deploy"
  oidc_provider_arn = local.global.github_oidc_provider_arn
  subjects          = ["${local.global.github_subject_prefix}:ref:refs/heads/main"]
  inline_policies   = { deploy = data.aws_iam_policy_document.deploy.json }
}
