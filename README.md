# alaCarte

A modern, flexible digital product marketplace platform built with Next.js and Prisma.

## Overview

alaCarte is an innovative platform for creators to sell digital products, offering flexible product variations, seamless file uploads, and easy payment configuration.

## Table of Contents

- [Local Development](#local-development)
- [Deployment Process](#deployment-process)
  - [Database Setup](#database-setup)
  - [AWS Infrastructure](#aws-infrastructure)
  - [Email Service Configuration](#email-service-configuration)
  - [Payment Gateway Integration](#payment-gateway-integration)
  - [Containerization](#containerization)
  - [CI/CD Pipeline](#cicd-pipeline)
  - [Monitoring and Logging](#monitoring-and-logging)

## Local Development

### Prerequisites
- Node.js 22.x
- pnpm (Package Manager)
- PostgreSQL 14+

### Setup
1. Clone the repository
```bash
git clone https://github.com/glennsantos/alacarte.git
cd alaCarte
```

2. Install dependencies
```bash
pnpm install
```

3. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your local configuration
```

4. Set up the database
```bash
pnpm prisma migrate dev
```

5. Run the development server
```bash
pnpm dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser to see the app.

### Additional Commands
- Build for production: `pnpm build`
- Start production server: `pnpm start`
- Lint the project: `pnpm lint`
- Run tests: `pnpm test`

## Deployment Process

### Database Setup

#### PostgreSQL on AWS RDS

1. Create a PostgreSQL database instance on AWS RDS
   ```bash
   # Using AWS CLI
   aws rds create-db-instance \
     --db-instance-identifier alacarte-db \
     --db-instance-class db.t3.small \
     --engine postgres \
     --master-username admin \
     --master-user-password <secure-password> \
     --allocated-storage 20 \
     --vpc-security-group-ids <security-group-id> \
     --db-subnet-group <subnet-group>
   ```

2. Configure security groups to allow access from your application servers

3. Create the database
   ```sql
   CREATE DATABASE alacarte_db;
   ```

4. Run migrations using Prisma
   ```bash
   # Set DATABASE_URL in .env to point to your RDS instance
   DATABASE_URL=postgresql://username:password@your-rds-endpoint:5432/alacarte_db
   DIRECT_URL=postgresql://username:password@your-rds-endpoint:5432/alacarte_db
   
   # Run migrations
   pnpm prisma migrate deploy
   ```

### AWS Infrastructure

#### S3 Setup for File Storage

1. Create S3 buckets for different purposes
   ```bash
   # Using AWS CLI
   aws s3 mb s3://alacarte-uploads --region ap-southeast-1
   aws s3 mb s3://alacarte-products --region ap-southeast-1
   ```

2. Configure CORS for the buckets
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": ["https://yourdomain.com"],
       "ExposeHeaders": []
     }
   ]
   ```

3. Create an IAM user with programmatic access for the application
   ```bash
   aws iam create-user --user-name alacarte-app
   ```

4. Attach policies for S3 access
   ```bash
   aws iam attach-user-policy --user-name alacarte-app --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
   ```

5. Generate access keys and add to environment variables
   ```bash
   aws iam create-access-key --user-name alacarte-app
   ```

#### CloudFront for Content Delivery

1. Create a CloudFront distribution for your S3 buckets
   ```bash
   aws cloudfront create-distribution \
     --origin-domain-name alacarte-products.s3.amazonaws.com \
     --default-root-object index.html
   ```

2. Configure SSL certificate using AWS Certificate Manager

3. Set up custom domain in CloudFront

### Email Service Configuration

#### Setup with SES (Simple Email Service)

1. Verify domain ownership in SES
   ```bash
   aws ses verify-domain-identity --domain yourdomain.com
   ```

2. Add the provided DNS records to your domain registrar

3. Request production access if sending to non-verified recipients

4. Create SMTP credentials
   ```bash
   aws ses create-smtp-credentials
   ```

5. Update environment variables with SMTP settings
   ```
   SMTP_HOST=email-smtp.ap-southeast-1.amazonaws.com
   SMTP_PORT=587
   SMTP_USER=your_smtp_username
   SMTP_PASS=your_smtp_password
   EMAIL_FROM=no-reply@yourdomain.com
   ```

### Payment Gateway Integration

#### Xendit Setup

1. Create a Xendit account at [https://dashboard.xendit.co/register](https://dashboard.xendit.co/register)

2. Complete business verification process

3. Generate API keys from the Xendit dashboard
   - Go to Settings > API Keys
   - Generate a secret key for production
   - Generate a separate key for development/testing

4. Configure webhook endpoints
   - Set up webhook URL: `https://yourdomain.com/api/webhooks/xendit`
   - Generate a webhook secret key
   - Add verification token to your environment variables

5. Update environment variables
   ```
   XENDIT_API_KEY=your_xendit_api_key
   XENDIT_SECRET_KEY=your_xendit_secret_key
   XENDIT_WEBHOOK_SECRET=your_webhook_secret
   ```

### Containerization

#### Docker Setup

1. The application is containerized using Docker with a multi-stage build process:
   - Base image: Node.js 22 Alpine
   - Dependencies installation stage
   - Build stage for Next.js application
   - Production runtime stage

2. Docker Compose is used to orchestrate the application and database:
   ```bash
   # Build and start the containers
   docker-compose up -d
   
   # View logs
   docker-compose logs -f
   
   # Stop containers
   docker-compose down
   ```

3. Environment setup for Docker:
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit the environment variables as needed
   # Make sure to set database credentials that will be used in the containers
   ```

4. Database migrations with Docker:
   ```bash
   # Run migrations inside the container
   docker-compose exec app npx prisma migrate deploy
   ```

5. Accessing the application:
   - The application will be available at http://localhost:3000
   - The PostgreSQL database will be exposed on port 5433 (configurable in .env)



### CI/CD Pipeline

#### AWS CodePipeline Setup

1. Create an ECR repository for Docker images
   ```bash
   aws ecr create-repository --repository-name alacarte --region ap-southeast-1
   ```

2. Set up CodeBuild project
   - Connect to your GitHub repository
   - Create a buildspec.yml file in your repository

   ```yaml
   version: 0.2
   
   phases:
     pre_build:
       commands:
         - echo Logging in to Amazon ECR...
         - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com
     build:
       commands:
         - echo Building the Docker image...
         - docker build -t $IMAGE_REPO_NAME:$IMAGE_TAG .
         - docker tag $IMAGE_REPO_NAME:$IMAGE_TAG $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG
     post_build:
       commands:
         - echo Pushing the Docker image...
         - docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG
         - echo Writing image definitions file...
         - aws ecs update-service --cluster $ECS_CLUSTER --service $ECS_SERVICE --force-new-deployment
   ```

3. Create an ECS cluster and service
   ```bash
   aws ecs create-cluster --cluster-name alacarte-cluster
   ```

4. Create a task definition for your container
   ```json
   {
     "family": "alacarte-task",
     "executionRoleArn": "arn:aws:iam::your-account-id:role/ecsTaskExecutionRole",
     "networkMode": "awsvpc",
     "containerDefinitions": [
       {
         "name": "alacarte-container",
         "image": "your-account-id.dkr.ecr.region.amazonaws.com/alacarte:latest",
         "essential": true,
         "portMappings": [
           {
             "containerPort": 3000,
             "hostPort": 3000,
             "protocol": "tcp"
           }
         ],
         "environment": [
           {
             "name": "NODE_ENV",
             "value": "production"
           }
         ],
         "secrets": [
           {
             "name": "DATABASE_URL",
             "valueFrom": "arn:aws:ssm:region:your-account-id:parameter/alacarte/database_url"
           }
         ],
         "logConfiguration": {
           "logDriver": "awslogs",
           "options": {
             "awslogs-group": "/ecs/alacarte",
             "awslogs-region": "region",
             "awslogs-stream-prefix": "ecs"
           }
         }
       }
     ],
     "requiresCompatibilities": ["FARGATE"],
     "cpu": "1024",
     "memory": "2048"
   }
   ```

5. Create a CodePipeline to automate deployment
   ```bash
   aws codepipeline create-pipeline --cli-input-json file://pipeline.json
   ```

### Monitoring and Logging

1. Set up CloudWatch for container logs
   ```bash
   aws logs create-log-group --log-group-name /ecs/alacarte
   ```

2. Create CloudWatch alarms for monitoring
   ```bash
   aws cloudwatch put-metric-alarm \
     --alarm-name alacarte-cpu-utilization \
     --alarm-description "Alarm when CPU exceeds 80%" \
     --metric-name CPUUtilization \
     --namespace AWS/ECS \
     --statistic Average \
     --period 60 \
     --threshold 80 \
     --comparison-operator GreaterThanThreshold \
     --dimensions Name=ClusterName,Value=alacarte-cluster Name=ServiceName,Value=alacarte-service \
     --evaluation-periods 1 \
     --alarm-actions arn:aws:sns:region:account-id:alacarte-alerts
   ```

3. Set up X-Ray for distributed tracing
   - Add the AWS X-Ray SDK to your application
   - Configure sampling rules
   - Visualize service maps and traces

### Final Deployment Checklist

- [ ] Database migrations are applied
- [ ] Environment variables are configured in AWS Parameter Store/Secrets Manager
- [ ] S3 buckets are created and configured
- [ ] CloudFront distribution is set up
- [ ] Email service is configured and verified
- [ ] Payment gateway integration is tested
- [ ] Docker container is built and pushed to ECR
- [ ] ECS service is running with the latest container
- [ ] DNS records are updated to point to the load balancer
- [ ] SSL certificates are installed and working
- [ ] Monitoring and alerts are configured
- [ ] Backup strategy is implemented