data "terraform_remote_state" "network" {
  backend = "s3"
  config = {
    bucket = var.state_bucket
    key    = "prod/network/terraform.tfstate"
    region = var.aws_region
  }
}

locals {
  network = data.terraform_remote_state.network.outputs
}

/**
 * Rule: the security groups have no ingress rules here. Each workload (api) adds its own rule
 * from its security group, so nothing can reach the data stores until it is granted explicitly.
 */
resource "aws_security_group" "db" {
  name        = "koalaflow-prod-db"
  description = "Postgres; ingress is added by the workloads that need it"
  vpc_id      = local.network.vpc_id
}

resource "aws_security_group" "redis" {
  name        = "koalaflow-prod-redis"
  description = "Redis; ingress is added by the workloads that need it"
  vpc_id      = local.network.vpc_id
}

resource "aws_db_subnet_group" "this" {
  name       = "koalaflow-prod"
  subnet_ids = local.network.private_subnet_ids
}

resource "aws_db_instance" "this" {
  identifier     = "koalaflow-prod"
  engine         = "postgres"
  engine_version = "17"
  instance_class = "db.t4g.micro"

  allocated_storage = 20
  storage_type      = "gp3"
  storage_encrypted = true

  db_name  = "koalaflow"
  username = "koalaflow"

  /**
   * Rule: the master password is generated and kept in Secrets Manager by RDS, so it never
   * reaches Terraform variables or state.
   */
  manage_master_user_password = true

  db_subnet_group_name   = aws_db_subnet_group.this.name
  vpc_security_group_ids = [aws_security_group.db.id]
  publicly_accessible    = false

  backup_retention_period = 7

  /**
   * Rule: learning setup, so destroying the database does not keep a final snapshot. Remove this
   * and set final_snapshot_identifier before the database holds data that matters.
   */
  skip_final_snapshot = true
}

resource "aws_elasticache_subnet_group" "this" {
  name       = "koalaflow-prod"
  subnet_ids = local.network.private_subnet_ids
}

/**
 * Rule: Redis has no auth token; access is limited by its security group, and traffic is
 * encrypted in transit (the api requires a rediss:// URL in production).
 */
resource "aws_elasticache_replication_group" "this" {
  replication_group_id = "koalaflow-prod"
  description          = "Koalaflow cache and rate limit"

  engine         = "redis"
  engine_version = "7.1"
  node_type      = "cache.t4g.micro"

  num_cache_clusters         = 1
  automatic_failover_enabled = false

  subnet_group_name  = aws_elasticache_subnet_group.this.name
  security_group_ids = [aws_security_group.redis.id]

  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
}
