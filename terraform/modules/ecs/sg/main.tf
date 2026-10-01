resource "aws_security_group" "ecs" {
  name        = "${var.name}-ecs"
  description = "ECS tasks"
  vpc_id      = var.vpc_id

  tags = {
    Name = "${var.name}-ecs"
  }
}

resource "aws_vpc_security_group_ingress_rule" "app" {
  security_group_id            = aws_security_group.ecs.id
  description                  = "Load balancer"
  ip_protocol                  = "tcp"
  from_port                    = var.app_port
  to_port                      = var.app_port
  referenced_security_group_id = var.alb_security_group_id
}

resource "aws_vpc_security_group_egress_rule" "all" {
  security_group_id = aws_security_group.ecs.id
  description       = "Outbound via NAT"
  ip_protocol       = "-1"
  cidr_ipv4         = "0.0.0.0/0"
}
