data "terraform_remote_state" "network" {
  backend = "s3"
  config = {
    bucket = var.state_bucket
    key    = "prod/network/terraform.tfstate"
    region = var.aws_region
  }
}

data "terraform_remote_state" "ecr" {
  backend = "s3"
  config = {
    bucket = var.state_bucket
    key    = "prod/ecr/terraform.tfstate"
    region = var.aws_region
  }
}

data "terraform_remote_state" "api" {
  backend = "s3"
  config = {
    bucket = var.state_bucket
    key    = "prod/api/terraform.tfstate"
    region = var.aws_region
  }
}

data "terraform_remote_state" "site" {
  backend = "s3"
  config = {
    bucket = var.state_bucket
    key    = "prod/site/terraform.tfstate"
    region = var.aws_region
  }
}

locals {
  network = data.terraform_remote_state.network.outputs
  ecr     = data.terraform_remote_state.ecr.outputs
  api     = data.terraform_remote_state.api.outputs
  site    = data.terraform_remote_state.site.outputs
  port    = 3001
}

resource "aws_cloudwatch_log_group" "app" {
  name              = "/koalaflow/prod/app"
  retention_in_days = 30
}

data "aws_iam_policy_document" "ecs_tasks_assume" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

/**
 * Rule: the app holds no secrets (the api owns auth and data), so its execution role only pulls
 * the image and writes logs.
 */
resource "aws_iam_role" "execution" {
  name               = "koalaflow-prod-app-execution"
  assume_role_policy = data.aws_iam_policy_document.ecs_tasks_assume.json
}

resource "aws_iam_role_policy_attachment" "execution" {
  role       = aws_iam_role.execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

data "aws_ec2_managed_prefix_list" "cloudfront" {
  name = "com.amazonaws.global.cloudfront.origin-facing"
}

/**
 * Rule: the load balancer accepts traffic only from CloudFront's origin-facing addresses, so the
 * public entry point is the distribution and the ALB DNS name is not usable directly.
 */
resource "aws_security_group" "alb" {
  name        = "koalaflow-prod-alb"
  description = "Application load balancer; ingress only from CloudFront"
  vpc_id      = local.network.vpc_id
}

resource "aws_vpc_security_group_ingress_rule" "alb_from_cloudfront" {
  security_group_id = aws_security_group.alb.id
  prefix_list_id    = data.aws_ec2_managed_prefix_list.cloudfront.id
  ip_protocol       = "tcp"
  from_port         = 80
  to_port           = 80
}

resource "aws_vpc_security_group_egress_rule" "alb_to_app" {
  security_group_id            = aws_security_group.alb.id
  referenced_security_group_id = aws_security_group.app.id
  ip_protocol                  = "tcp"
  from_port                    = local.port
  to_port                      = local.port
}

/**
 * Rule: the app tasks accept traffic only from the load balancer.
 */
resource "aws_security_group" "app" {
  name        = "koalaflow-prod-app"
  description = "App tasks; ingress only from the load balancer"
  vpc_id      = local.network.vpc_id
}

resource "aws_vpc_security_group_ingress_rule" "app_from_alb" {
  security_group_id            = aws_security_group.app.id
  referenced_security_group_id = aws_security_group.alb.id
  ip_protocol                  = "tcp"
  from_port                    = local.port
  to_port                      = local.port
}

/**
 * Rule: egress is open because tasks reach ECR, CloudWatch Logs and the api through the NAT
 * gateway; there are no VPC endpoints yet.
 */
resource "aws_vpc_security_group_egress_rule" "app_all" {
  security_group_id = aws_security_group.app.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}

resource "aws_vpc_security_group_ingress_rule" "api_from_app" {
  security_group_id            = local.api.api_security_group_id
  referenced_security_group_id = aws_security_group.app.id
  ip_protocol                  = "tcp"
  from_port                    = 3000
  to_port                      = 3000
}

resource "aws_lb" "this" {
  name               = "koalaflow-prod"
  load_balancer_type = "application"
  subnets            = local.network.public_subnet_ids
  security_groups    = [aws_security_group.alb.id]
}

resource "aws_lb_target_group" "app" {
  name        = "koalaflow-prod-app"
  vpc_id      = local.network.vpc_id
  port        = local.port
  protocol    = "HTTP"
  target_type = "ip"

  health_check {
    path    = "/"
    matcher = "200-399"
  }
}

/**
 * Rule: the listener is plain HTTP because the ALB has no certificate without a domain. Viewers
 * reach it only through CloudFront, which terminates TLS.
 */
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.this.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}

resource "aws_ecs_task_definition" "app" {
  family                   = "koalaflow-prod-app"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.execution.arn

  container_definitions = jsonencode([
    {
      name      = "app"
      image     = "${local.ecr.repository_urls["app"]}:${var.image_tag}"
      essential = true
      portMappings = [
        { containerPort = local.port, protocol = "tcp" }
      ]
      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "PORT", value = tostring(local.port) },
        { name = "HOSTNAME", value = "0.0.0.0" },
        { name = "API_URL", value = local.api.api_internal_url },
        { name = "SITE_URL", value = local.site.site_url },
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.app.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "app"
        }
      }
    }
  ])
}

resource "aws_ecs_service" "app" {
  name            = "app"
  cluster         = local.api.cluster_name
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = local.network.private_subnet_ids
    security_groups  = [aws_security_group.app.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = "app"
    container_port   = local.port
  }

  depends_on = [aws_lb_listener.http]
}

data "aws_cloudfront_cache_policy" "caching_disabled" {
  name = "Managed-CachingDisabled"
}

data "aws_cloudfront_origin_request_policy" "all_viewer" {
  name = "Managed-AllViewer"
}

/**
 * Rule: CachingDisabled + AllViewer, because the dashboard is per-user and cookie-authenticated;
 * nothing is cached and every header, cookie and query string reaches the app.
 */
resource "aws_cloudfront_distribution" "this" {
  enabled     = true
  comment     = "koalaflow-prod-app"
  price_class = "PriceClass_100"

  origin {
    origin_id   = "alb"
    domain_name = aws_lb.this.dns_name

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    target_origin_id         = "alb"
    viewer_protocol_policy   = "redirect-to-https"
    allowed_methods          = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods           = ["GET", "HEAD"]
    cache_policy_id          = data.aws_cloudfront_cache_policy.caching_disabled.id
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.all_viewer.id
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}
