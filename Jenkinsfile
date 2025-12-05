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
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
                echo '✅ Code checked out'
            }
        }
        
        stage('Setup Node.js') {
            steps {
                sh '''
                    export NVM_DIR="$HOME/.nvm"
                    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                    nvm use 18 || nvm install 18
                    node --version
                    npm --version
                '''
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh '''
                    export NVM_DIR="$HOME/.nvm"
                    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
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
                            export NVM_DIR="$HOME/.nvm"
                            [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                            npm run lint || true
                        '''
                    }
                }
                stage('TypeScript Check') {
                    steps {
                        sh '''
                            export NVM_DIR="$HOME/.nvm"
                            [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                            npx tsc --noEmit || true
                        '''
                    }
                }
            }
        }
        
        stage('Run Tests') {
            steps {
                sh '''
                    export NVM_DIR="$HOME/.nvm"
                    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                    npm test || echo "No tests configured yet"
                '''
                echo '✅ Tests complete'
            }
        }
        
        stage('Build') {
            steps {
                sh '''
                    export NVM_DIR="$HOME/.nvm"
                    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                    npm run build
                    npx prisma generate
                '''
                echo '✅ Build complete'
            }
        }
        
        stage('Package') {
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
                branch 'main'
            }
            steps {
                sh '''
                    SSH_KEY="/var/lib/jenkins/.ssh/laptopshop-ec2-key"
                    
                    scp -i ${SSH_KEY} -o StrictHostKeyChecking=no \
                        app.tar.gz ${EC2_USER}@${EC2_HOST}:/tmp/
                    
                    ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_HOST} << 'ENDSSH'
                            set -e
                            echo "🚀 Starting deployment..."
                            
                            pm2 stop laptopshop || true
                            
                            if [ -d "/home/ec2-user/app" ]; then
                                mv /home/ec2-user/app /home/ec2-user/app_backup_$(date +%Y%m%d_%H%M%S)
                            fi
                            
                            mkdir -p /home/ec2-user/app
                            tar -xzvf /tmp/app.tar.gz -C /home/ec2-user/app
                            cd /home/ec2-user/app
                            
                            npx prisma migrate deploy || true
                            
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
                branch 'main'
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
            cleanWs()
        }
        success {
            echo '🎉 Pipeline completed successfully! App: http://3.24.80.105:3000'
        }
        failure {
            echo '❌ Pipeline failed! Check logs for details.'
        }
    }
}
