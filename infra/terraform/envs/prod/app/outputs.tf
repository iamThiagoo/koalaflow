output "app_url" {
  description = "Public URL of the dashboard and player (CloudFront)."
  value       = "https://${aws_cloudfront_distribution.this.domain_name}"
}
