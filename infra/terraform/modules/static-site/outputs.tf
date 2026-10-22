output "bucket_name" {
  description = "Bucket that holds the site files."
  value       = aws_s3_bucket.site.bucket
}

output "bucket_arn" {
  description = "ARN of the site bucket."
  value       = aws_s3_bucket.site.arn
}

output "distribution_id" {
  description = "CloudFront distribution ID, used for invalidations."
  value       = aws_cloudfront_distribution.site.id
}

output "distribution_arn" {
  description = "CloudFront distribution ARN."
  value       = aws_cloudfront_distribution.site.arn
}

output "url" {
  description = "Canonical site URL: the domain, or the CloudFront domain when none is set."
  value = (
    local.custom_domain
    ? "https://${var.domain_name}"
    : "https://${aws_cloudfront_distribution.site.domain_name}"
  )
}
