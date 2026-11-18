# Inventory Management System | Cloud & DevOps Project

## Project overview

StockWise is a three-tier inventory management web application built with React, Node.js, Express and PostgreSQL. It supports product catalogue management and demonstrates containerization, CI/CD, AWS infrastructure provisioning and server monitoring.

This repository is a learning project. Run and verify each component in your own environment before describing it as deployed or production-ready.

## Application features

- Create, view, update and delete products.
- Store a unique SKU, product name, category, quantity and unit price.
- Search products by SKU, name or category.
- Calculate stock status automatically:
  - Out of Stock: quantity is 0.
  - Low Stock: quantity is between 1 and 5.
  - In Stock: quantity is greater than 5.
- Persist product records in PostgreSQL.
- Expose REST endpoints through an Express API.

## Technology stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, JavaScript, CSS, Nginx |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Containers | Docker, Docker Compose |
| CI/CD | Jenkins, Git, GitHub |
| Container registry | Docker Hub |
| Cloud / IaC | AWS EC2, Terraform |
| Monitoring | Prometheus, Node Exporter, Grafana |
| Server OS | Ubuntu Linux |

## Architecture

```text
Browser
   |
   v
React frontend (Nginx container)
   |
   | /api requests
   v
Node.js + Express API container
   |
   v
PostgreSQL database container

GitHub -> Jenkins -> Build and test -> Docker Hub -> EC2 deployment
                                                   |
                                                   v
                                      Node Exporter -> Prometheus -> Grafana
```

## Repository structure

```text
inventory-management-system/
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
├── database/
│   └── schema.sql
├── inventory-monitoring/
│   ├── docker-compose.yml
│   ├── grafana/ec2-monitoring.json
│   └── prometheus/prometheus.yml
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── src/
├── terraform/
│   ├── main.tf
│   ├── variables.tf
│   └── terraform.tfvars.example
├── docker-compose.yml
├── Jenkinsfile
└── README.md
```

## Run locally with Docker Compose

### Prerequisites

Install Docker Desktop with Docker Compose. Start Docker Desktop before running commands.

### 1. Configure environment

In the project root, copy `.env.example` to `.env` and replace the sample password with a strong local password. Do not commit `.env` to Git.

PowerShell:

```powershell
Copy-Item .env.example .env
```

Edit `.env`, then run:

```powershell
docker compose up --build -d
docker compose ps
docker compose logs -f backend
```

Open the application at `http://localhost:8081`.

API health endpoint: `http://localhost:5000/api/health`.

Stop the stack:

```powershell
docker compose down
```

To remove the database volume and all locally stored product records as well:

```powershell
docker compose down -v
```

**Warning:** `down -v` permanently deletes the local PostgreSQL data volume. Use it only when you intentionally want a clean database. The schema is automatically initialized only when PostgreSQL creates a new empty data directory.

## Run without Docker (development)

1. Install Node.js and PostgreSQL.
2. Create a database named `inventory_db`.
3. Run `database/schema.sql` against that database.
4. In `backend`, install dependencies with `npm install`.
5. Create `backend/.env` with `PORT=5000`, `DB_HOST=localhost`, `DB_PORT=5432`, `DB_NAME=inventory_db`, `DB_USER=postgres` and your local `DB_PASSWORD`.
6. Start the API using `npm run dev`.
7. In another terminal, run `npm install` and `npm run dev` inside `frontend`.

The Vite development server may need a development proxy configuration to route `/api` requests to the backend; the Docker/Nginx setup already proxies `/api` to the backend service.

## REST API

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | API and database health check |
| GET | `/api/products` | List products |
| GET | `/api/products/:id` | Get one product |
| POST | `/api/products` | Create a product |
| PUT | `/api/products/:id` | Update a product |
| DELETE | `/api/products/:id` | Delete a product |

Example JSON for creating a product:

```json
{
  "sku": "ELEC-1001",
  "name": "Wireless Keyboard",
  "category": "Electronics",
  "quantity": 18,
  "price": 1499.00
}
```

## Jenkins CI/CD

The Jenkinsfile checks out the repository, verifies project files, builds the React frontend, checks backend JavaScript syntax, builds Docker images and pushes them to Docker Hub.

Configure these Jenkins items before running the pipeline:

- Jenkins credential `dockerhub-creds`: Docker Hub username and access token (username/password credential type).
- Jenkins credential `ec2-ssh-key`: SSH private key and SSH username for the EC2 deployment account.
- Pipeline parameter `DOCKERHUB_USER`: your Docker Hub namespace.
- Pipeline parameter `EC2_HOST`: public IP or DNS of your own EC2 instance.
- Create the repository `https://github.com/tabish-devops/inventory-management-system` or update the Git URL in the Jenkinsfile to your actual repository URL.

On EC2, clone this repository into `/home/ubuntu/inventory-management-system`, configure its `.env` file, install Docker and Docker Compose, and ensure the SSH user can run Docker. The deployment stage is skipped when `EC2_HOST` is empty. Never place passwords, access tokens or private keys directly in the Jenkinsfile.

## AWS and Terraform

The Terraform configuration provisions an Ubuntu 24.04 EC2 instance and a security group in `ap-south-1`. SSH ingress is restricted to `ssh_allowed_cidr`; HTTP ingress is open for the web application.

From the `terraform` directory:

```bash
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your own SSH CIDR and existing EC2 key pair name.
terraform init
terraform fmt -check
terraform validate
terraform plan
```

Review the plan carefully before `terraform apply`. AWS resources can incur charges. Do not commit real `terraform.tfvars`, state files or credentials. This configuration creates an EC2 instance and security group; it does not create a custom VPC or automatically install/deploy the application.

## Monitoring

The monitoring Compose file starts Prometheus and Grafana, bound to localhost on ports 9090 and 3000. The Prometheus configuration expects Node Exporter to be reachable at `host.docker.internal:9100` from the monitoring containers. For a remote EC2 host, configure Node Exporter on EC2 and create a secure SSH tunnel from the machine running Docker to the EC2 host. Do not expose port 9100 publicly.

Start monitoring from `inventory-monitoring`:

```bash
docker compose up -d
```

Open Prometheus at `http://localhost:9090` and Grafana at `http://localhost:3000`. Configure the Prometheus data source in Grafana as `http://prometheus:9090` and import `grafana/ec2-monitoring.json` if you want to use the included dashboard. Confirm that the dashboard queries match the metrics exposed by your Node Exporter version.

## Security and cost notes

- Use your own strong database password and keep `.env` out of Git.
- Restrict SSH to your own IP address.
- Do not expose PostgreSQL, Prometheus, Grafana or Node Exporter directly to the public internet.
- Review AWS cost estimates and Terraform plans before creating resources.
- Use Jenkins credentials for secrets; never hardcode tokens or private keys.

## Author

**Ayaan Shaikh**  
GitHub: [Ayaan-shaikh22](https://github.com/Ayaan-shaikh22)
