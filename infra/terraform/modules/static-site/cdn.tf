resource "aws_cloudfront_origin_access_control" "site" {
  name                              = var.name
  description                       = "Signed reads from ${aws_s3_bucket.site.bucket}"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_function" "viewer_request" {
  name    = "${var.name}-viewer-request"
  runtime = "cloudfront-js-2.0"
  comment = "www redirect, directory indexes and trailing slashes"
  code    = file("${path.module}/functions/viewer-request.js")
  publish = true
}

/**
 * Rule: the edge honours each object's Cache-Control (set at upload) within these bounds.
 * Rule: cookies, headers and query strings are not part of the cache key; the site is static.
 */
resource "aws_cloudfront_cache_policy" "site" {
  name        = "${var.name}-static"
  min_ttl     = 0
  default_ttl = 86400
  max_ttl     = 31536000

  parameters_in_cache_key_and_forwarded_to_origin {
    enable_accept_encoding_brotli = true
    enable_accept_encoding_gzip   = true

    cookies_config {
      cookie_behavior = "none"
    }

    headers_config {
      header_behavior = "none"
    }

    query_strings_config {
      query_string_behavior = "none"
    }
  }
}

/**
 * Rule: HSTS has no preload so it can still be rolled back.
 * Rule: no Content-Security-Policy yet; the static export uses inline scripts.
 */
resource "aws_cloudfront_response_headers_policy" "site" {
  name = "${var.name}-security-headers"

  security_headers_config {
    strict_transport_security {
      access_control_max_age_sec = 63072000
      include_subdomains         = true
      preload                    = false
      override                   = true
    }

    content_type_options {
      override = true
    }

    frame_options {
      frame_option = "DENY"
      override     = true
    }

    referrer_policy {
      referrer_policy = "strict-origin-when-cross-origin"
      override        = true
    }
  }
}

/**
 * Rule: without a domain the site is served on the CloudFront domain with its default certificate.
 */
locals {
  origin_id     = "s3-site"
  custom_domain = var.domain_name != null
  aliases       = local.custom_domain ? concat([var.domain_name], var.redirect_domain_names) : []
}

resource "aws_cloudfront_distribution" "site" {
  enabled             = true
  comment             = var.name
  aliases             = local.aliases
  default_root_object = "index.html"
  http_version        = "http2and3"
  is_ipv6_enabled     = true
  price_class         = var.price_class

  origin {
    origin_id                = local.origin_id
    domain_name              = aws_s3_bucket.site.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.site.id
  }

  default_cache_behavior {
    target_origin_id           = local.origin_id
    viewer_protocol_policy     = "redirect-to-https"
    allowed_methods            = ["GET", "HEAD"]
    cached_methods             = ["GET", "HEAD"]
    compress                   = true
    cache_policy_id            = aws_cloudfront_cache_policy.site.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.site.id

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.viewer_request.arn
    }
  }

  /**
   * Rule: missing objects answer the site's not-found page with status 404.
   */
  dynamic "custom_error_response" {
    for_each = [403, 404]

    content {
      error_code            = custom_error_response.value
      response_code         = 404
      response_page_path    = "/404.html"
      error_caching_min_ttl = 60
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = !local.custom_domain
    acm_certificate_arn            = one(aws_acm_certificate_validation.site[*].certificate_arn)
    ssl_support_method             = local.custom_domain ? "sni-only" : null
    minimum_protocol_version       = local.custom_domain ? "TLSv1.2_2021" : null
  }
}
