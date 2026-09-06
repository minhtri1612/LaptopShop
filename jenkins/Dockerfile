FROM jenkins/jenkins:lts-jdk17

USER root

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates git unzip xz-utils \
    && rm -rf /var/lib/apt/lists/*

# Docker CLI talks to the host daemon via /var/run/docker.sock
RUN curl -fsSL "https://download.docker.com/linux/static/stable/x86_64/docker-27.5.1.tgz" -o /tmp/docker.tgz \
    && tar -xzf /tmp/docker.tgz --strip-components=1 -C /usr/local/bin docker/docker \
    && rm /tmp/docker.tgz

# Trivy image scanner
RUN curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh \
    | sh -s -- -b /usr/local/bin

# Node.js 18 — matches Dockerfile / nvm use 18
RUN curl -fsSL https://nodejs.org/dist/v18.20.5/node-v18.20.5-linux-x64.tar.xz -o /tmp/node.tar.xz \
    && tar -xJf /tmp/node.tar.xz -C /usr/local --strip-components=1 \
    && rm /tmp/node.tar.xz

# SonarScanner CLI — Jenkins tool name is "SonarQubeScanner"
RUN curl -fsSL https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-6.2.1.4610.zip -o /tmp/sonar-scanner.zip \
    && unzip -q /tmp/sonar-scanner.zip -d /opt \
    && mv /opt/sonar-scanner-* /opt/sonar-scanner \
    && rm /tmp/sonar-scanner.zip \
    && git config --system --add safe.directory /workspace

COPY plugins.txt /usr/share/jenkins/ref/plugins.txt
RUN jenkins-plugin-cli --plugin-file /usr/share/jenkins/ref/plugins.txt

USER jenkins
