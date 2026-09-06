pipeline {
    agent any
    
    environment {
        CI = 'true'
        NODE_OPTIONS = '--experimental-vm-modules'
        
        // EC2 Configuration
        EC2_HOST = '3.24.80.105'
        EC2_USER = 'ec2-user'
        APP_DIR = '/home/ec2-user/app'
        
        // AWS Configuration
        AWS_REGION = 'ap-southeast-2'
        S3_BUCKET = 'laptopshop-images-vt3cui7k'
        
        // Database
        DB_HOST = 'laptopshop-db.c986iw6k2ihl.ap-southeast-2.rds.amazonaws.com'
        DB_NAME = 'nodejspro'

        IMAGE_TAG = "${BUILD_NUMBER}"
        SONAR_PROJECT_KEY = 'laptopshop'
        SONAR_PROJECT_NAME = 'LaptopShop'
    }
    
    stages {
        stage('Checkout') {
            steps {
                script {
                    if (env.LOCAL_CI == 'true') {
                        sh '''
                            if [ -d /workspace ]; then
                              find . -mindepth 1 -maxdepth 1 -exec rm -rf {} +
                              cp -a /workspace/. .
                            else
                              echo "LOCAL_CI is set but /workspace is missing; falling back to scm"
                            fi
                        '''
                    } else {
                        checkout scm
                    }
                }
                echo '✅ Code checked out'
            }
        }
        
        stage('Setup Node.js') {
            steps {
                sh '''
                    if command -v node >/dev/null 2>&1; then
                        node --version
                        npm --version
                    else
                        export NVM_DIR="$HOME/.nvm"
                        [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                        nvm use 18 || nvm install 18
                        node --version
                        npm --version
                    fi
                '''
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh '''
                    if ! command -v node >/dev/null 2>&1; then
                        export NVM_DIR="$HOME/.nvm"
                        [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                        nvm use 18 || nvm install 18
                    fi
                    npm ci --prefer-offline || npm install
                '''
                echo '✅ Dependencies installed'
            }
        }
        
        stage('Lint & Type Check') {
            parallel {
                stage('ESLint') {
                    steps {
                        sh '''
                            if ! command -v node >/dev/null 2>&1; then
                                export NVM_DIR="$HOME/.nvm"
                                [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                                nvm use 18 || nvm install 18
                            fi
                            npm run lint || true
                        '''
                    }
                }
                stage('TypeScript Check') {
                    steps {
                        sh '''
                            if ! command -v node >/dev/null 2>&1; then
                                export NVM_DIR="$HOME/.nvm"
                                [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                                nvm use 18 || nvm install 18
                            fi
                            npx prisma generate
                            npx tsc --noEmit || true
                        '''
                    }
                }
            }
        }
        
        stage('Run Tests') {
            steps {
                sh '''
                    if ! command -v node >/dev/null 2>&1; then
                        export NVM_DIR="$HOME/.nvm"
                        [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                        nvm use 18 || nvm install 18
                    fi
                    npm run test:coverage
                '''
                echo '✅ Tests complete'
            }
        }
        
        stage('Build') {
            steps {
                sh '''
                    if ! command -v node >/dev/null 2>&1; then
                        export NVM_DIR="$HOME/.nvm"
                        [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                        nvm use 18 || nvm install 18
                    fi
                    npx prisma generate
                    npm run build
                '''
                echo '✅ Build complete'
            }
        }

        stage('SonarQube Analysis') {
            when {
                environment name: 'LOCAL_CI', value: 'true'
            }
            steps {
                withCredentials([string(credentialsId: 'sonarqube-token', variable: 'SONAR_TOKEN')]) {
                    sh """
                        /opt/sonar-scanner/bin/sonar-scanner \
                        -Dsonar.projectKey=${SONAR_PROJECT_KEY} \
                        -Dsonar.projectName='${SONAR_PROJECT_NAME}' \
                        -Dsonar.sources=src \
                        -Dsonar.tests=src/__tests__ \
                        -Dsonar.test.inclusions=src/__tests__/**/*.ts \
                        -Dsonar.exclusions=**/node_modules/**,**/dist/**,**/coverage/**,**/public/**,**/*.pem,terraform/**,jenkins/**,src/views/** \
                        -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info \
                        -Dsonar.coverage.exclusions=src/__tests__/**,src/views/**,src/types/** \
                        -Dsonar.host.url=http://${env.SONAR_HOST_URL ?: 'sonarqube:9000'} \
                        -Dsonar.token=${SONAR_TOKEN} \
                        -Dsonar.sourceEncoding=UTF-8
                    """
                }
            }
        }

        stage('Build Docker Image') {
            when {
                environment name: 'LOCAL_CI', value: 'true'
            }
            steps {
                sh '''
                    BUILD_CONTEXT="${PROJECT_DIR:-.}"
                    echo "Building Docker image laptopshop:${IMAGE_TAG} (context: ${BUILD_CONTEXT})"
                    docker build -t "laptopshop:${IMAGE_TAG}" "${BUILD_CONTEXT}"
                    docker tag "laptopshop:${IMAGE_TAG}" laptopshop:latest
                    docker images | grep laptopshop
                '''
            }
        }

        stage('Trivy Security Scan') {
            when {
                environment name: 'LOCAL_CI', value: 'true'
            }
            steps {
                sh '''
                    IGNORE=""
                    if [ -f .trivyignore ]; then
                      IGNORE="--ignorefile .trivyignore"
                    fi
                    trivy image --severity CRITICAL,HIGH --ignore-unfixed --exit-code 1 $IGNORE "laptopshop:${IMAGE_TAG}"
                '''
            }
        }
        
        stage('Package') {
            when {
                not { environment name: 'SKIP_AWS', value: 'true' }
            }
            steps {
                sh '''
                    tar --exclude='node_modules/.cache' \
                        --exclude='*.log' \
                        -czvf app.tar.gz \
                        dist/ \
                        node_modules/ \
                        package.json \
                        package-lock.json \
                        prisma/ \
                        src/views/ \
                        public/
                '''
                echo '✅ Package created'
            }
        }
        
        stage('Deploy to EC2') {
            when {
                not { environment name: 'SKIP_AWS', value: 'true' }
            }
            steps {
                sh '''
                    SSH_KEY="/var/lib/jenkins/.ssh/laptopshop-ec2-key"
                    
                    scp -i ${SSH_KEY} -o StrictHostKeyChecking=no \
                        app.tar.gz ${EC2_USER}@${EC2_HOST}:/tmp/
                    
                    ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_HOST} << 'ENDSSH'
                            set -e
                            echo "🚀 Starting deployment..."
                            
                            # Backup .env file before stopping
                            if [ -f "/home/ec2-user/app/.env" ]; then
                                cp /home/ec2-user/app/.env /tmp/.env.backup
                            fi
                            
                            pm2 stop laptopshop || true
                            
                            if [ -d "/home/ec2-user/app" ]; then
                                mv /home/ec2-user/app /home/ec2-user/app_backup_$(date +%Y%m%d_%H%M%S)
                            fi
                            
                            mkdir -p /home/ec2-user/app
                            tar -xzvf /tmp/app.tar.gz -C /home/ec2-user/app
                            cd /home/ec2-user/app
                            
                            # Restore .env file
                            if [ -f "/tmp/.env.backup" ]; then
                                cp /tmp/.env.backup /home/ec2-user/app/.env
                                echo "✅ .env restored"
                            fi
                            
                            npx prisma migrate deploy
                            
                            pm2 start dist/app.js --name laptopshop --update-env
                            pm2 save
                            
                            rm /tmp/app.tar.gz
                            ls -dt /home/ec2-user/app_backup_* 2>/dev/null | tail -n +4 | xargs rm -rf || true
                            
                            echo "✅ Deployment complete!"
ENDSSH
                '''
                echo '🚀 Deployed to EC2!'
            }
        }
        
        stage('Health Check') {
            when {
                not { environment name: 'SKIP_AWS', value: 'true' }
            }
            steps {
                sh '''
                    echo "Waiting for app to start..."
                    sleep 10
                    
                    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://${EC2_HOST}:3000 || echo "000")
                    
                    if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "302" ]; then
                        echo "✅ Health check passed! Status: $HTTP_STATUS"
                    else
                        echo "❌ Health check failed! Status: $HTTP_STATUS"
                        exit 1
                    fi
                '''
            }
        }
    }
    
    post {
        always {
            script {
                if (env.LOCAL_CI != 'true') {
                    cleanWs()
                }
            }
        }
        success {
            echo '🎉 Pipeline completed successfully!'
        }
        failure {
            echo '❌ Pipeline failed! Check logs for details.'
        }
    }
}
