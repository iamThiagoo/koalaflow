output "arn" {
  description = "Role ARN, used as role-to-assume in GitHub Actions."
  value       = aws_iam_role.this.arn
}
