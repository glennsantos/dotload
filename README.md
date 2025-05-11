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

## Simple EC2 Deployment Guide with AWS CLI

This guide provides a simpler approach to deploy alaCarte to an EC2 instance using AWS CLI and `pnpm dev` or `pnpm start`.

### Deployment Checklist

- [ ] Set up AWS CLI
- [ ] Create an EC2 key pair
- [ ] Set up security groups
- [ ] Launch an EC2 instance
- [ ] Connect to existing RDS database
- [ ] Install Node.js 22.x and dependencies
- [ ] Clone and configure the application
- [ ] Set up environment variables
- [ ] Run database migrations
- [ ] Start the application
- [ ] Set up a domain and SSL (optional)

### 1. Set up AWS CLI

First, ensure you have AWS CLI installed and configured with your credentials:

```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure AWS CLI
aws configure
```

Enter your AWS Access Key ID, Secret Access Key, default region (e.g., ap-southeast-1), and output format (json).

### 2. Create an EC2 key pair

```bash
# Create a key pair
aws ec2 create-key-pair \
  --key-name alacarte-key \
  --query 'KeyMaterial' \
  --output text > alacarte-key.pem

# Set proper permissions
chmod 400 alacarte-key.pem
```

### 3. Set up security groups

```bash
# Create security group for EC2
aws ec2 create-security-group \
  --group-name alacarte-ec2-sg \
  --description "Security group for alaCarte EC2 instance"

# Get your public IP
MY_IP=$(curl -s https://checkip.amazonaws.com)/32

# Add inbound rules
aws ec2 authorize-security-group-ingress \
  --group-name alacarte-ec2-sg \
  --protocol tcp \
  --port 22 \
  --cidr $MY_IP

aws ec2 authorize-security-group-ingress \
  --group-name alacarte-ec2-sg \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-name alacarte-ec2-sg \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-name alacarte-ec2-sg \
  --protocol tcp \
  --port 3000 \
  --cidr 0.0.0.0/0
```

### 4. Allow EC2 to access your RDS instance

```bash
# Get your EC2 security group ID
EC2_SG_ID=$(aws ec2 describe-security-groups \
  --group-names alacarte-ec2-sg \
  --query 'SecurityGroups[0].GroupId' \
  --output text)

# Get your RDS security group ID (replace rds-sg-name with your actual RDS security group name)
RDS_SG_NAME="your-rds-sg-name"
RDS_SG_ID=$(aws ec2 describe-security-groups \
  --group-names $RDS_SG_NAME \
  --query 'SecurityGroups[0].GroupId' \
  --output text)

# Allow EC2 security group to access RDS
aws ec2 authorize-security-group-ingress \
  --group-id $RDS_SG_ID \
  --protocol tcp \
  --port 5432 \
  --source-group $EC2_SG_ID
```

### 5. Launch an EC2 instance

```bash
# Get the latest Amazon Linux 2023 AMI ID
AMI_ID=$(aws ec2 describe-images \
  --owners amazon \
  --filters "Name=name,Values=al2023-ami-2023*-x86_64" "Name=state,Values=available" \
  --query 'sort_by(Images, &CreationDate)[-1].ImageId' \
  --output text)

# Launch EC2 instance
INSTANCE_ID=$(aws ec2 run-instances \
  --image-id $AMI_ID \
  --count 1 \
  --instance-type t2.small \
  --key-name alacarte-key \
  --security-groups alacarte-ec2-sg \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=alacarte-server}]' \
  --block-device-mappings '[{"DeviceName":"/dev/xvda","Ebs":{"VolumeSize":10,"DeleteOnTermination":true}}]' \
  --query 'Instances[0].InstanceId' \
  --output text)

# Wait for instance to be running
aws ec2 wait instance-running --instance-ids $INSTANCE_ID

# Get public DNS name
PUBLIC_DNS=$(aws ec2 describe-instances \
  --instance-ids $INSTANCE_ID \
  --query 'Reservations[0].Instances[0].PublicDnsName' \
  --output text)

echo "EC2 instance launched with ID: $INSTANCE_ID"
echo "Public DNS: $PUBLIC_DNS"
```

### 6. Connect to your EC2 instance

```bash
# Connect to your EC2 instance using the key pair and public DNS
ssh -i alacarte-key.pem ec2-user@$PUBLIC_DNS
```

### 7. Install Node.js 22.x and dependencies

Once connected to your EC2 instance, run these commands:

```bash
# Install Node.js 22.x
curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
sudo yum install -y nodejs

# Install pnpm
npm install -g pnpm

# Install Git and other dependencies
sudo yum install -y git

# Install PostgreSQL client for database connection testing
sudo yum install -y postgresql
```

### 8. Connect to existing RDS database

Before proceeding, gather the following information about your RDS instance:
- Endpoint (hostname)
- Port (typically 5432 for PostgreSQL)
- Database name (alacarte_db)
- Username and password

Test the connection to your RDS instance:

```bash
# Test connection (replace with your actual RDS details)
RDS_ENDPOINT="your-rds-endpoint"
RDS_USERNAME="your-username"
RDS_DATABASE="alacarte_db"

# Test the connection
psql -h $RDS_ENDPOINT -U $RDS_USERNAME -d $RDS_DATABASE
# You'll be prompted for the password
```

### 9. Clone and configure the application

```bash
# Clone the repository
git clone https://github.com/glennsantos/alacarte.git
cd alacarte

# Install dependencies
pnpm install
```

### 10. Set up environment variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit the .env file with your configuration
cat > .env << EOL
# Database connection (replace with your actual RDS details)
DATABASE_URL=postgresql://$RDS_USERNAME:your-password@$RDS_ENDPOINT:5432/$RDS_DATABASE
DIRECT_URL=postgresql://$RDS_USERNAME:your-password@$RDS_ENDPOINT:5432/$RDS_DATABASE

# Xendit configuration (replace with your actual Xendit details)
XENDIT_API_KEY=your_xendit_api_key
XENDIT_SECRET_KEY=your_xendit_secret_key
XENDIT_WEBHOOK_SECRET=your_webhook_secret

# Other environment variables as needed
NEXTAUTH_URL=http://$(curl -s http://169.254.169.254/latest/meta-data/public-hostname):3000
NEXTAUTH_SECRET=$(openssl rand -base64 32)
EOL
```

### 11. Run database migrations

```bash
# Run Prisma migrations
pnpm prisma migrate deploy
```

### 12. Start the application

For development mode as requested:

```bash
# Start in development mode
pnpm dev
```

To keep the application running after you disconnect from SSH, use PM2:

```bash
# Install PM2
npm install -g pm2

# Start the application with PM2
pm2 start npm --name "alacarte" -- run dev

# Set PM2 to start on boot
pm2 save
pm2 startup
sudo env PATH=$PATH:/usr/bin pm2 startup -u ec2-user --hp /home/ec2-user
```

### 13. Set up a domain and SSL (optional)

#### Create and assign an Elastic IP

Run these commands on your local machine with AWS CLI configured:

```bash
# Allocate a new Elastic IP
EIP_ALLOCATION_ID=$(aws ec2 allocate-address \
  --domain vpc \
  --query 'AllocationId' \
  --output text)

# Associate Elastic IP with your EC2 instance
aws ec2 associate-address \
  --allocation-id $EIP_ALLOCATION_ID \
  --instance-id $INSTANCE_ID

# Get the allocated public IP
ELASTIC_IP=$(aws ec2 describe-addresses \
  --allocation-ids $EIP_ALLOCATION_ID \
  --query 'Addresses[0].PublicIp' \
  --output text)

echo "Elastic IP allocated: $ELASTIC_IP"
```

#### Register a domain with Route 53 (optional)

```bash
# Register a domain (replace with your desired domain)
DOMAIN_NAME="yourdomain.com"

# Check domain availability
aws route53domains check-domain-availability \
  --domain-name $DOMAIN_NAME

# If available, register the domain
aws route53domains register-domain \
  --domain-name $DOMAIN_NAME \
  --duration-in-years 1 \
  --auto-renew \
  --admin-contact "$(cat admin-contact.json)" \
  --registrant-contact "$(cat registrant-contact.json)" \
  --tech-contact "$(cat tech-contact.json)" \
  --privacy-protect-admin-contact \
  --privacy-protect-registrant-contact \
  --privacy-protect-tech-contact
```

#### Create DNS records in Route 53

```bash
# Create a hosted zone
HOSTED_ZONE_ID=$(aws route53 create-hosted-zone \
  --name $DOMAIN_NAME \
  --caller-reference $(date +%s) \
  --query 'HostedZone.Id' \
  --output text | sed 's/\/hostedzone\///')

# Create A record pointing to your Elastic IP
aws route53 change-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID \
  --change-batch '{"Changes":[{"Action":"CREATE","ResourceRecordSet":{"Name":"'$DOMAIN_NAME'.",'"Type":"A","TTL":300,"ResourceRecords":[{"Value":"'$ELASTIC_IP'"}]}}]}'

# Create www subdomain
aws route53 change-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID \
  --change-batch '{"Changes":[{"Action":"CREATE","ResourceRecordSet":{"Name":"www.'$DOMAIN_NAME'.",'"Type":"A","TTL":300,"ResourceRecords":[{"Value":"'$ELASTIC_IP'"}]}}]}'
```

#### Set up Nginx and SSL on your EC2 instance

Run these commands on your EC2 instance:

```bash
# Install Nginx
sudo yum install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Create Nginx configuration
sudo mkdir -p /etc/nginx/sites-available
sudo mkdir -p /etc/nginx/sites-enabled

# Add include directive to nginx.conf if it doesn't exist
if ! grep -q "include /etc/nginx/sites-enabled/*" /etc/nginx/nginx.conf; then
  sudo sed -i '/http {/a \
    include /etc/nginx/sites-enabled/*;' /etc/nginx/nginx.conf
fi

# Create site configuration
cat > /tmp/alacarte << EOL
server {
    listen 80;
    server_name $DOMAIN_NAME www.$DOMAIN_NAME;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOL

sudo cp /tmp/alacarte /etc/nginx/sites-available/alacarte
sudo ln -s /etc/nginx/sites-available/alacarte /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Install Certbot for SSL
sudo yum install -y certbot python3-certbot-nginx
sudo certbot --nginx -d $DOMAIN_NAME -d www.$DOMAIN_NAME --non-interactive --agree-tos --email your-email@example.com
```

### 14. Deployment Verification Checklist

After completing the deployment, verify the following:

- [ ] Application is accessible via public IP or domain
- [ ] Database connection is working
- [ ] Xendit payment integration is functioning
- [ ] File uploads are working
- [ ] User registration and login are working
- [ ] Product creation and management are working
- [ ] Webhooks are properly configured

### 15. Troubleshooting

```bash
# Check application logs
pm2 logs alacarte

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Check system logs
sudo journalctl -u nginx

# Test database connection
psql -h $RDS_ENDPOINT -U $RDS_USERNAME -d $RDS_DATABASE

# Restart the application after making changes
pm2 restart alacarte
```

### 16. Detailed EC2 Deployment Steps

This section provides a detailed guide based on our recent deployment experience.

#### Prerequisites
- AWS CLI configured with appropriate permissions
- SSH key pair for EC2 access
- Existing RDS PostgreSQL database

#### Step 1: SSH Configuration

Create an SSH config file to simplify connections:

```
Host alacarte-ec2
    HostName ec2-47-128-210-191.ap-southeast-1.compute.amazonaws.com
    User ec2-user
    IdentityFile /path/to/your-key.pem
    IdentitiesOnly yes
    StrictHostKeyChecking no
    UserKnownHostsFile /dev/null
```

#### Step 2: Connect to EC2 Instance

```bash
ssh -v alacarte-ec2
```

#### Step 3: Install Dependencies

```bash
# Install Node.js 22.x
sudo dnf install -y nodejs

# Install pnpm
sudo npm install -g pnpm

# Install PM2
sudo npm install -g pm2

# Install PostgreSQL client
sudo dnf install -y postgresql15
```

#### Step 4: Deploy Application Code

```bash
# Clone repository or transfer code to EC2
scp -r -F ssh_config /path/to/local/alacarte alacarte-ec2:~/
```

#### Step 5: Configure Environment Variables

Create or update the `.env` file with the necessary configuration:

```bash
# Create/edit .env file with proper values
cat > ~/alacarte/.env << EOL
# Database Configuration
DATABASE_URL=postgresql://postgres:YourSecurePassword@alacarte-db.cvy41u3lhk79.ap-southeast-1.rds.amazonaws.com:5432/alacarte_db
DIRECT_URL=postgresql://postgres:YourSecurePassword@alacarte-db.cvy41u3lhk79.ap-southeast-1.rds.amazonaws.com:5432/alacarte_db

# Fee Configuration
PAYOUT_PERCENTAGE_FEE=0.05
PAYOUT_FIXED_FEE=15

# Xendit Configuration
XENDIT_API_KEY=xnd_development_YourXenditApiKey
XENDIT_SECRET_KEY=xnd_development_YourXenditSecretKey
XENDIT_WEBHOOK_SECRET=YourXenditWebhookSecret

# Email Configuration
SMTP_HOST=smtp.example.com
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
SMTP_PORT=2525
EMAIL_FROM=alaCarte <no-reply@example.com>

# NextAuth configuration
NEXTAUTH_URL=http://ec2-47-128-210-191.ap-southeast-1.compute.amazonaws.com:3000
NEXTAUTH_SECRET=$(openssl rand -base64 32)
EOL
```

**Important Notes:**

1. **Database Connection**: If you encounter authentication issues with the RDS database, you may need to reset the master password:

```bash
# Reset RDS master password
aws rds modify-db-instance \
  --db-instance-identifier alacarte-db \
  --master-user-password 'NewSecurePassword!' \
  --apply-immediately
```

2. **Xendit API Keys**: For development, use keys with the `xnd_development_` prefix. For production, use `xnd_production_` prefix.

3. **NextAuth Secret**: The command `$(openssl rand -base64 32)` generates a secure random string for the NextAuth secret.

#### Step 6: RDS Security Group Configuration

If you encounter database connection issues, update the RDS security group:

```bash
# Get EC2 security group ID
EC2_SG_ID=$(aws ec2 describe-instances --instance-ids your-instance-id --query 'Reservations[0].Instances[0].SecurityGroups[0].GroupId' --output text)

# Update RDS security group to allow connections from EC2
aws ec2 authorize-security-group-ingress --group-id your-rds-security-group-id --protocol tcp --port 5432 --source-group $EC2_SG_ID
```

#### Step 7: Generate Prisma Client and Run Migrations

```bash
cd ~/alacarte
pnpm prisma generate
pnpm prisma migrate deploy
```

#### Step 8: Start Application with PM2

```bash
cd ~/alacarte
pm2 start npm --name "alacarte" -- run dev

# Configure PM2 to start on boot
pm2 save
pm2 startup
# Run the command PM2 outputs
```

#### Step 9: Configure Nginx as Reverse Proxy

```bash
# Install Nginx
sudo dnf install -y nginx

# Create Nginx configuration
sudo bash -c 'cat > /etc/nginx/conf.d/alacarte.conf << EOL
server {
    listen 80;
    server_name your-ec2-public-dns;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOL'

# Update Nginx main configuration for long server names
sudo sed -i 's/# server_names_hash_bucket_size.*/server_names_hash_bucket_size 128;/' /etc/nginx/nginx.conf

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### Step 10: Verify Deployment

Access your application at:
- http://your-ec2-public-dns:3000 (direct access)
- http://your-ec2-public-dns (if using Nginx)

### 17. Troubleshooting Common Deployment Issues

#### Database Connection Issues

```bash
# Reset RDS master password if needed
aws rds modify-db-instance --db-instance-identifier your-db-identifier --master-user-password 'NewSecurePassword!' --apply-immediately

# Test database connection
PGPASSWORD='your-password' psql -h your-rds-endpoint -U postgres -d alacarte_db -c 'SELECT current_database();'
```

#### Nginx Configuration Issues

```bash
# Test Nginx configuration
sudo nginx -t

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
```

#### Application Startup Issues

```bash
# Check PM2 logs
pm2 logs alacarte

# Restart application
pm2 restart alacarte

# Check if Prisma client is generated
cd ~/alacarte && pnpm prisma generate
```

### 18. Cleanup (when needed)

To clean up resources when no longer needed:

```bash
# Stop the EC2 instance
aws ec2 stop-instances --instance-ids $INSTANCE_ID

# Terminate the EC2 instance (permanent deletion)
aws ec2 terminate-instances --instance-ids $INSTANCE_ID

# Release the Elastic IP
aws ec2 release-address --allocation-id $EIP_ALLOCATION_ID

# Delete security group (only after instance is terminated)
aws ec2 delete-security-group --group-name alacarte-ec2-sg

# Delete key pair
aws ec2 delete-key-pair --key-name alacarte-key
```