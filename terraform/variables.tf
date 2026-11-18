variable "ssh_allowed_cidr" {
  description = "Your public IP in CIDR format for SSH access, for example x.x.x.x/32"
  type        = string
  validation {
    condition     = can(cidrhost(var.ssh_allowed_cidr, 0))
    error_message = "Provide a valid CIDR range, such as your-public-ip/32."
  }
}

variable "key_name" {
  description = "Name of an existing AWS EC2 key pair in the selected region"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}
