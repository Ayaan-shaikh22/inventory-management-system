pipeline {
    agent any

    parameters {
        string(name: 'DOCKERHUB_USER', defaultValue: 'your-dockerhub-username', description: 'Docker Hub account / namespace')
        string(name: 'EC2_HOST', defaultValue: '', description: 'Public IPv4 or DNS of the deployment EC2 instance')
        string(name: 'GIT_BRANCH', defaultValue: 'main', description: 'Git branch to build')
    }

    environment {
        FRONTEND_IMAGE = "${params.DOCKERHUB_USER}/inventory-frontend"
        BACKEND_IMAGE  = "${params.DOCKERHUB_USER}/inventory-backend"
        APP_DIR = '/home/ubuntu/inventory-management-system'
    }

    stages {
        stage('Checkout Code') {
            steps {
                git branch: params.GIT_BRANCH,
                    url: 'https://github.com/tabish-devops/inventory-management-system.git'
            }
        }

        stage('Check Project Files') {
            steps {
                sh '''
                    test -f frontend/package.json
                    test -f backend/package.json
                    test -f frontend/Dockerfile
                    test -f backend/Dockerfile
                    test -f database/schema.sql
                    echo "Inventory project files verified"
                '''
            }
        }

        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    sh 'npm ci && npm run build'
                }
            }
        }

        stage('Check Backend') {
            steps {
                dir('backend') {
                    sh 'npm ci && npm run check'
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                sh '''
                    docker build -t "$FRONTEND_IMAGE:latest" ./frontend
                    docker build -t "$BACKEND_IMAGE:latest" ./backend
                '''
            }
        }

        stage('Push Images to Docker Hub') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-creds',
                    usernameVariable: 'DH_USER',
                    passwordVariable: 'DH_TOKEN'
                )]) {
                    sh '''
                        set +x
                        echo "$DH_TOKEN" | docker login -u "$DH_USER" --password-stdin
                        docker push "$FRONTEND_IMAGE:latest"
                        docker push "$BACKEND_IMAGE:latest"
                        docker logout
                    '''
                }
            }
        }

        stage('Deploy to EC2') {
            when {
                expression { return params.EC2_HOST?.trim() }
            }
            steps {
                withCredentials([
                    sshUserPrivateKey(
                        credentialsId: 'ec2-ssh-key',
                        keyFileVariable: 'SSH_KEY',
                        usernameVariable: 'SSH_USER'
                    )
                ]) {
                    sh '''
                        ssh -i "$SSH_KEY" -o StrictHostKeyChecking=accept-new -o ConnectTimeout=15 "$SSH_USER@$EC2_HOST" \
                          "cd '$APP_DIR' && DOCKERHUB_USER='$DOCKERHUB_USER' docker compose pull backend frontend && DOCKERHUB_USER='$DOCKERHUB_USER' docker compose up -d backend frontend && docker compose ps"
                    '''
                }
            }
        }
    }

    post {
        success {
            echo 'Inventory CI/CD pipeline completed successfully.'
        }
        failure {
            echo 'Pipeline failed. Check the Jenkins Console Output.'
        }
    }
}
