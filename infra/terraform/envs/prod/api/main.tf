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

data "terraform_remote_state" "data" {
  backend = "s3"
  config = {
    bucket = var.state_bucket
    key    = "prod/data/terraform.tfstate"
    region = var.aws_region
  }
}

locals {
  network = data.terraform_remote_state.network.outputs
  ecr     = data.terraform_remote_state.ecr.outputs
  data    = data.terraform_remote_state.data.outputs
  port    = 3000
}

resource "aws_ecs_cluster" "this" {
  name = "koalaflow-prod"
}

resource "aws_cloudwatch_log_group" "api" {
  name              = "/koalaflow/prod/api"
  retention_in_days = 30
}

/**
 * Rule: the api is reachable only inside the VPC, through this private DNS name
 * (api.koalaflow.local); the app service calls it, nothing on the internet does.
 */
resource "aws_service_discovery_private_dns_namespace" "this" {
  name = "koalaflow.local"
  vpc  = local.network.vpc_id
}

resource "aws_service_discovery_service" "api" {
  name = "api"

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.this.id

    dns_records {
      type = "A"
      ttl  = 10
    }
  }
}

/**
 * Rule: Terraform creates only the secret container. The value is set with the AWS CLI so it
 * never reaches Terraform variables or state.
 */
resource "aws_secretsmanager_secret" "better_auth" {
  name = "koalaflow/prod/api/better-auth-secret"
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
 * Rule: the execution role (used by ECS to start the task) can pull images, write logs and read
 * only the two secrets injected into the container.
 */
resource "aws_iam_role" "execution" {
  name               = "koalaflow-prod-api-execution"
  assume_role_policy = data.aws_iam_policy_document.ecs_tasks_assume.json
}

resource "aws_iam_role_policy_attachment" "execution" {
  role       = aws_iam_role.execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

data "aws_iam_policy_document" "execution_secrets" {
  statement {
    actions = ["secretsmanager:GetSecretValue"]
    resources = [
      aws_secretsmanager_secret.better_auth.arn,
      local.data.db_master_secret_arn,
    ]
  }
}

resource "aws_iam_role_policy" "execution_secrets" {
  name   = "read-api-secrets"
  role   = aws_iam_role.execution.id
  policy = data.aws_iam_policy_document.execution_secrets.json
}

/**
 * Rule: no ingress rules here. The app service adds its own rule to reach port 3000, so only
 * explicitly granted callers can reach the api.
 */
resource "aws_security_group" "api" {
  name        = "koalaflow-prod-api"
  description = "api tasks; ingress is added by the workloads that call the api"
  vpc_id      = local.network.vpc_id
}

/**
 * Rule: egress is open because the tasks must reach ECR, Secrets Manager, CloudWatch Logs and
 * SES through the NAT gateway; there are no VPC endpoints yet.
 */
resource "aws_vpc_security_group_egress_rule" "api_all" {
  security_group_id = aws_security_group.api.id
  ip_protocol       = "-1"
  cidr_ipv4         = "0.0.0.0/0"
}

resource "aws_vpc_security_group_ingress_rule" "db_from_api" {
  security_group_id            = local.data.db_security_group_id
  referenced_security_group_id = aws_security_group.api.id
  ip_protocol                  = "tcp"
  from_port                    = 5432
  to_port                      = 5432
}

resource "aws_vpc_security_group_ingress_rule" "redis_from_api" {
  security_group_id            = local.data.redis_security_group_id
  referenced_security_group_id = aws_security_group.api.id
  ip_protocol                  = "tcp"
  from_port                    = 6379
  to_port                      = 6379
}

resource "aws_ecs_task_definition" "api" {
  family                   = "koalaflow-prod-api"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.execution.arn

  container_definitions = jsonencode([
    {
      name      = "api"
      image     = "${local.ecr.repository_urls["api"]}:${var.image_tag}"
      essential = true

      portMappings = [{ containerPort = local.port, protocol = "tcp" }]

      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "PORT", value = tostring(local.port) },
        { name = "DB_HOST", value = local.data.db_address },
        { name = "DB_PORT", value = tostring(local.data.db_port) },
        { name = "DB_NAME", value = local.data.db_name },
        { name = "REDIS_URL", value = "rediss://${local.data.redis_endpoint}:6379" },
        { name = "BETTER_AUTH_URL", value = var.better_auth_url },
        { name = "EMAIL_FROM", value = var.email_from },
        { name = "AWS_REGION", value = var.aws_region },
      ]

      secrets = [
        { name = "DB_USER", valueFrom = "${local.data.db_master_secret_arn}:username::" },
        { name = "DB_PASSWORD", valueFrom = "${local.data.db_master_secret_arn}:password::" },
        { name = "BETTER_AUTH_SECRET", valueFrom = aws_secretsmanager_secret.better_auth.arn },
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.api.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "api"
        }
      }
    }
  ])
}

resource "aws_ecs_service" "api" {
  name            = "api"
  cluster         = aws_ecs_cluster.this.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = local.network.private_subnet_ids
    security_groups  = [aws_security_group.api.id]
    assign_public_ip = false
  }

  service_registries {
    registry_arn = aws_service_discovery_service.api.arn
  }
}
