/**
 * Rule: the zone is shared by every environment; recreating it would change its name servers.
 * Rule: no zone exists until a domain is set.
 */
resource "aws_route53_zone" "primary" {
  count = var.domain_name == null ? 0 : 1

  name = var.domain_name

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_iam_openid_connect_provider" "github" {
  url            = "https://token.actions.githubusercontent.com"
  client_id_list = ["sts.amazonaws.com"]
}

/**
 * Rule: pull requests can only read, so a plan never changes resources.
 * Rule: a plan reads resource configuration and the Terraform state, never application data:
 *       object contents outside the state bucket, secrets, parameters, decrypted keys, table
 *       items and logs are denied even though ReadOnlyAccess would allow them.
 */
data "aws_iam_policy_document" "plan_data_guard" {
  statement {
    sid           = "DenyObjectReadsOutsideState"
    effect        = "Deny"
    actions       = ["s3:GetObject", "s3:GetObjectVersion", "s3:GetObjectAttributes", "s3:GetObjectVersionAttributes"]
    not_resources = ["arn:aws:s3:::${var.state_bucket}/*"]
  }

  statement {
    sid    = "DenyApplicationDataReads"
    effect = "Deny"
    actions = [
      "secretsmanager:GetSecretValue",
      "ssm:GetParameter",
      "ssm:GetParameters",
      "ssm:GetParametersByPath",
      "ssm:GetParameterHistory",
      "kms:Decrypt",
      "dynamodb:GetItem",
      "dynamodb:BatchGetItem",
      "dynamodb:Query",
      "dynamodb:Scan",
      "rds-data:*",
      "logs:GetLogEvents",
      "logs:FilterLogEvents",
      "logs:StartQuery",
      "logs:GetQueryResults",
      "athena:GetQueryResults",
    ]
    resources = ["*"]
  }
}

module "terraform_plan_role" {
  source = "../modules/github-oidc-role"

  name              = "koalaflow-terraform-plan"
  oidc_provider_arn = aws_iam_openid_connect_provider.github.arn
  subjects          = ["${var.github_subject_prefix}:pull_request"]
  managed_policy_arns = [
    "arn:aws:iam::aws:policy/ReadOnlyAccess",
  ]
  inline_policies = { data-guard = data.aws_iam_policy_document.plan_data_guard.json }
}

/**
 * Rule: applies run only in the protected production environment, after approval.
 */
module "terraform_apply_role" {
  source = "../modules/github-oidc-role"

  name              = "koalaflow-terraform-apply"
  oidc_provider_arn = aws_iam_openid_connect_provider.github.arn
  subjects          = ["${var.github_subject_prefix}:environment:production"]
  managed_policy_arns = [
    "arn:aws:iam::aws:policy/AdministratorAccess",
  ]
}
