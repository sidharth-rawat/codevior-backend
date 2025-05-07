# Define image names
NODE_APP_IMAGE = codevior-node-app
NGINX_IMAGE = codevior-nginx

# Define container names
NODE_APP_CONTAINER = codevior-node-app
NGINX_CONTAINER = codevior-nginx

# Define ports
NODE_APP_PORT = 3002
NODE_SOCKET_PORT = 6002
NGINX_PORT = 80

AWS_REGION = ap-south-1
AWS_ECR_REPO = 992382632806.dkr.ecr.ap-south-1.amazonaws.com # build an ECR repository for codevior

codevior_REPO = gatoes-codevior-app:latest
codevior_NGINX_REPO = gatoes-codevior-nginx:latest

# Build Node.js app image
build-node:
	docker build -t $(NODE_APP_IMAGE) -f Dockerfile .

# Build Nginx image
build-nginx:
	docker build -t $(NGINX_IMAGE) -f Dockerfile.nginx .

# Run Node.js app container
run-node:
	docker run -d --name $(NODE_APP_CONTAINER) -p $(NODE_APP_PORT):$(NODE_APP_PORT) -p $(NODE_SOCKET_PORT):$(NODE_SOCKET_PORT) -v /home/ubuntu/logs:/var/log/supervisord $(NODE_APP_IMAGE)


# Run Nginx container
run-nginx:
	docker run -d --name $(NGINX_CONTAINER) -p $(NGINX_PORT):$(NGINX_PORT) --link $(NODE_APP_CONTAINER):node-app $(NGINX_IMAGE)

# Stop and remove Node.js app container
stop-node:
	docker stop $(NODE_APP_CONTAINER)
	docker rm $(NODE_APP_CONTAINER)

# Stop and remove Nginx container
stop-nginx:
	docker stop $(NGINX_CONTAINER)
	docker rm $(NGINX_CONTAINER)

# Build all images
build: build-node build-nginx

tag-node:
	docker tag $(NODE_APP_IMAGE):latest $(AWS_ECR_REPO)/$(codevior_REPO)

# Tag Nginx image for AWS ECR
tag-nginx:
	docker tag $(NGINX_IMAGE):latest $(AWS_ECR_REPO)/$(codevior_NGINX_REPO)

#login to aws ECR
login-ecr:
	aws ecr get-login-password --region $(AWS_REGION) | docker login --username AWS --password-stdin $(AWS_ECR_REPO)

# Push Node.js app image to AWS ECR
push-node:
	docker push $(AWS_ECR_REPO)/$(codevior_REPO)

# Push Nginx image to AWS ECR
push-nginx:
	docker push $(AWS_ECR_REPO)/$(codevior_NGINX_REPO)


# Deploy to AWS ECR
push-ecr: build-node build-nginx tag-node tag-nginx login-ecr push-node push-nginx

# Run all containers
run: run-node run-nginx

# Stop and remove all containers
stop: stop-node stop-nginx


# Rebuild and run all
rebuild: build stop run

.PHONY: build-node build-nginx run-node run-nginx stop-node stop-nginx build run stop rebuild