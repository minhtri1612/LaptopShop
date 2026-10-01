terraform {
  backend "s3" {
    key          = "prod/terraform.tfstate"
    encrypt      = true
    use_lockfile = true
  }
}

locals {
  name = "${var.project_name}-${var.environment}"
}

module "vpc" {
  source   = "../../modules/vpc"
  name     = local.name
  vpc_cidr = var.vpc_cidr
}

module "ecr" {
  source = "../../modules/ecr"
  name   = local.name
}

module "s3" {
  source = "../../modules/s3"
  name   = local.name
}

module "alb" {
  source              = "../../modules/alb"
  name                = local.name
  vpc_id              = module.vpc.vpc_id
  public_subnet_ids   = module.vpc.public_subnet_ids
  app_port            = var.app_port
  certificate_arn     = var.certificate_arn
  deletion_protection = var.deletion_protection
}

module "ecs_sg" {
  source                = "../../modules/ecs/sg"
  name                  = local.name
  vpc_id                = module.vpc.vpc_id
  app_port              = var.app_port
  alb_security_group_id = module.alb.security_group_id
}

module "rds" {
  source                = "../../modules/rds"
  name                  = local.name
  vpc_id                = module.vpc.vpc_id
  ecs_security_group_id = module.ecs_sg.security_group_id
  private_subnet_ids    = module.vpc.private_subnet_ids
  db_name               = var.db_name
  db_username           = var.db_username
  instance_class        = var.db_instance_class
  multi_az              = var.multi_az
  deletion_protection   = var.deletion_protection
  skip_final_snapshot   = var.skip_final_snapshot
}

module "secrets" {
  source       = "../../modules/secrets"
  name         = local.name
  db_username  = var.db_username
  db_password  = module.rds.password
  db_host      = module.rds.address
  replica_host = module.rds.replica_address
  db_name      = var.db_name
}

module "iam" {
  source            = "../../modules/iam"
  name              = local.name
  secret_arn        = module.secrets.secret_arn
  images_bucket_arn = module.s3.bucket_arn
}

module "ecs" {
  source             = "../../modules/ecs"
  name               = local.name
  private_subnet_ids = module.vpc.private_subnet_ids
  security_group_id  = module.ecs_sg.security_group_id
  target_group_arn   = module.alb.target_group_arn
  app_port           = var.app_port
  cpu                = var.ecs_cpu
  memory             = var.ecs_memory
  desired_count      = var.ecs_desired_count
  image              = "${module.ecr.repository_url}:${var.image_tag}"
  region             = var.region
  execution_role_arn = module.iam.execution_role_arn
  task_role_arn      = module.iam.task_role_arn
  secret_arn         = module.secrets.secret_arn
  images_bucket      = module.s3.bucket_id

  depends_on = [module.alb]
}

module "github" {
  source             = "../../modules/github"
  name               = local.name
  github_repository  = var.github_repository
  github_branch      = var.github_branch
  execution_role_arn = module.iam.execution_role_arn
  task_role_arn      = module.iam.task_role_arn
}
