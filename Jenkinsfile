pipeline {
    agent any

    options {
        disableConcurrentBuilds()
    }

    environment {
        IMAGE_NAME = 'ghcr.io/anterg-labs/sotra-frontend'
        DEPLOY_HOST = '192.168.217.190'
        DEPLOY_USER = 'cristhian'
        DEPLOY_PATH = '/opt/frontend'

        API_URL = 'http://localhost:8080'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Docker') {
            steps {
                script {
                    env.IMAGE_TAG = sh(
                        script: 'git rev-parse --short=7 HEAD',
                        returnStdout: true
                    ).trim()
                }

                sh '''
                    docker build \
                      --build-arg API_URL="$API_URL" \
                      -t "$IMAGE_NAME:$IMAGE_TAG" \
                      -t "$IMAGE_NAME:latest" \
                      .
                '''
            }
        }

        stage('Push GHCR') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'ghcr-credentials',
                        usernameVariable: 'GH_USER',
                        passwordVariable: 'GH_TOKEN'
                    )
                ]) {
                    sh '''
                        set +x

                        echo "$GH_TOKEN" | docker login ghcr.io \
                          -u "$GH_USER" --password-stdin

                        docker push "$IMAGE_NAME:$IMAGE_TAG"
                        docker push "$IMAGE_NAME:latest"

                        docker logout ghcr.io
                    '''
                }
            }
        }

        stage('Deploy VM') {
            steps {
                withCredentials([
                    file(
                        credentialsId: 'vm2-known-hosts',
                        variable: 'KNOWN_HOSTS'
                    )
                ]) {
                    sshagent(credentials: ['vm2-ssh']) {
                        sh '''
                            ssh -o StrictHostKeyChecking=yes \
                              -o UserKnownHostsFile="$KNOWN_HOSTS" \
                              "$DEPLOY_USER@$DEPLOY_HOST" \
                              "cd '$DEPLOY_PATH' && \
                               IMAGE_NAME='$IMAGE_NAME' IMAGE_TAG='$IMAGE_TAG' \
                               docker compose -f compose.production.yml pull sotra-frontend-prod && \
                               IMAGE_NAME='$IMAGE_NAME' IMAGE_TAG='$IMAGE_TAG' \
                               docker compose -f compose.production.yml up -d --no-deps sotra-frontend-prod"
                        '''
                    }
                }
            }
        }
    }

    post {
        success {
            echo 'SOTRA Frontend desplegado correctamente.'
        }

        failure {
            echo 'Error en el pipeline de despliegue.'
        }
    }
}
