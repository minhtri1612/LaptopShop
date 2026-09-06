#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE=(docker compose -f docker-compose.ci.yaml)
SONAR_URL="http://localhost:9001"
JENKINS_URL="http://localhost:8081"
SONAR_USER="admin"
SONAR_PASS="admin123"

export DOCKER_GID
DOCKER_GID="$(stat -c '%g' /var/run/docker.sock 2>/dev/null || echo 0)"

echo "==> Docker socket GID: ${DOCKER_GID}"
echo "==> Starting SonarQube on :9001 (food-order already uses :9000)..."
"${COMPOSE[@]}" up -d sonar_db sonarqube

echo "==> Waiting for SonarQube at ${SONAR_URL} (first boot can take 1–3 minutes)..."
for i in $(seq 1 90); do
  status="$(curl -sf "${SONAR_URL}/api/system/status" 2>/dev/null || true)"
  if echo "${status}" | grep -q '"status":"UP"'; then
    echo "==> SonarQube is UP"
    break
  fi
  if [ "${i}" -eq 90 ]; then
    echo "SonarQube did not become ready in time. Check: docker logs laptopshop-sonarqube"
    exit 1
  fi
  sleep 4
done

change_password() {
  curl -sf -u "$1:$2" -X POST \
    "${SONAR_URL}/api/users/change_password?login=admin&previousPassword=$2&password=${SONAR_PASS}" \
    >/dev/null 2>&1 || true
}

change_password "${SONAR_USER}" "admin"
change_password "${SONAR_USER}" "${SONAR_PASS}"

auth_ok() {
  curl -sf -u "${SONAR_USER}:${SONAR_PASS}" "${SONAR_URL}/api/authentication/validate" \
    | grep -q '"valid":true'
}

if ! auth_ok; then
  echo "Could not log in to SonarQube as admin/${SONAR_PASS}."
  echo "Open ${SONAR_URL} and finish the onboarding wizard, then re-run this script."
  exit 1
fi

curl -sf -u "${SONAR_USER}:${SONAR_PASS}" -X POST \
  "${SONAR_URL}/api/user_tokens/revoke" -d "name=jenkins-local" >/dev/null 2>&1 || true

TOKEN_JSON="$(curl -sf -u "${SONAR_USER}:${SONAR_PASS}" -X POST \
  "${SONAR_URL}/api/user_tokens/generate" -d "name=jenkins-local")"

SONAR_TOKEN="$(python3 -c 'import json,sys; print(json.load(sys.stdin)["token"])' <<<"${TOKEN_JSON}")"
if [ -z "${SONAR_TOKEN}" ] || [ "${SONAR_TOKEN}" = "None" ]; then
  echo "Failed to create SonarQube token:"
  echo "${TOKEN_JSON}"
  exit 1
fi
export SONAR_TOKEN

cat > .env.ci <<EOF
SONAR_TOKEN=${SONAR_TOKEN}
DOCKER_GID=${DOCKER_GID}
EOF

echo "==> Building and starting Jenkins on :8081..."
"${COMPOSE[@]}" --env-file .env.ci up -d --build jenkins

echo "==> Waiting for Jenkins at ${JENKINS_URL} ..."
for i in $(seq 1 60); do
  if curl -sf -o /dev/null -u admin:admin "${JENKINS_URL}/login"; then
    echo "==> Jenkins is ready"
    break
  fi
  if [ "${i}" -eq 60 ]; then
    echo "Jenkins did not become ready in time. Check: docker logs laptopshop-jenkins"
    exit 1
  fi
  sleep 5
done

echo
echo "Local CI is up."
echo "  Jenkins:   ${JENKINS_URL}   (admin / admin)"
echo "  SonarQube: ${SONAR_URL}   (admin / admin123)"
echo "  Job:       ${JENKINS_URL}/job/laptopshop/"
echo
echo "Open the job and click Build Now."
echo "After the build: SonarQube project 'laptopshop', Trivy in Console Output."
echo "EC2 deploy is skipped locally."
