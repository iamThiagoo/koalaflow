output "state_bucket" {
  description = "Bucket name to write into every backend.tf."
  value       = aws_s3_bucket.state.bucket
}
