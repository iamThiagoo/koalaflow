# CloudFront only accepts ACM certificates issued in us-east-1.
resource "aws_acm_certificate" "site" {
  count    = local.custom_domain ? 1 : 0
  provider = aws.us_east_1

  domain_name               = var.domain_name
  subject_alternative_names = var.redirect_domain_names
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "certificate_validation" {
  for_each = local.custom_domain ? {
    for option in aws_acm_certificate.site[0].domain_validation_options : option.domain_name => {
      name   = option.resource_record_name
      type   = option.resource_record_type
      record = option.resource_record_value
    }
  } : {}

  zone_id         = var.zone_id
  name            = each.value.name
  type            = each.value.type
  records         = [each.value.record]
  ttl             = 300
  allow_overwrite = true
}

resource "aws_acm_certificate_validation" "site" {
  count    = local.custom_domain ? 1 : 0
  provider = aws.us_east_1

  certificate_arn         = aws_acm_certificate.site[0].arn
  validation_record_fqdns = [for record in aws_route53_record.certificate_validation : record.fqdn]
}
