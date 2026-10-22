/**
 * Rule: only tokens issued for AWS STS and for the listed repository subjects can assume the role.
 * Rule: subjects are matched exactly; wildcards would let other branches or forks in.
 */
data "aws_iam_policy_document" "trust" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [var.oidc_provider_arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values   = var.subjects
    }
  }
}

resource "aws_iam_role" "this" {
  name               = var.name
  assume_role_policy = data.aws_iam_policy_document.trust.json
}

resource "aws_iam_role_policy_attachment" "managed" {
  for_each = toset(var.managed_policy_arns)

  role       = aws_iam_role.this.name
  policy_arn = each.value
}

/**
 * Rule: inline policies are keyed by a static name, so the plan knows how many exist before their
 * documents (which may reference resources not yet created) are known.
 */
resource "aws_iam_role_policy" "inline" {
  for_each = var.inline_policies

  name   = "${var.name}-${each.key}"
  role   = aws_iam_role.this.id
  policy = each.value
}
