output "arn" {
  description = "Role ARN, used as role-to-assume in GitHub Actions."
  value       = aws_iam_role.this.arn
}

output "name" {
  description = "Role name."
  value       = aws_iam_role.this.name
}
