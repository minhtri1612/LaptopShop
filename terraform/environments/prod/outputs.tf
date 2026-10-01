output "alb_dns_name" {
  value = module.alb.dns_name
}

output "ecr_repository_url" {
  value = module.ecr.repository_url
}

output "images_bucket" {
  value = module.s3.bucket_id
}

output "ecs_cluster" {
  value = module.ecs.cluster_name
}

output "ecs_service" {
  value = module.ecs.service_name
}

output "rds_address" {
  value = module.rds.address
}

output "rds_replica_address" {
  value = module.rds.replica_address
}

output "github_plan_role_arn" {
  value = module.github.plan_role_arn
}

output "github_deploy_role_arn" {
  value = module.github.deploy_role_arn
}
