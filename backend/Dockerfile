# ==========================================
# Multi-stage Dockerfile for Campus Hub Pro Backend
# Stage 1: Build the JAR package
# ==========================================
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /app

# Cache Gradle wrapper and dependencies
COPY gradlew gradlew.bat settings.gradle build.gradle ./
COPY gradle ./gradle

# Grant execution rights to Gradle wrapper
RUN chmod +x ./gradlew

# Download dependencies
RUN ./gradlew dependencies --no-daemon || true

# Copy source code and build executable jar
COPY src ./src
RUN ./gradlew bootJar --no-daemon -x test

# ==========================================
# Stage 2: Minimal Runtime Environment
# ==========================================
FROM eclipse-temurin:21-jre-alpine AS runner

WORKDIR /app

# Install curl for docker healthcheck
RUN apk add --no-cache curl tzdata

# Set timezone to Asia/Ho_Chi_Minh (Vietnam Time)
ENV TZ=Asia/Ho_Chi_Minh

# Create non-root system user for improved container security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Copy jar from builder stage
COPY --from=builder --chown=appuser:appgroup /app/build/libs/*.jar app.jar

# Expose backend port
EXPOSE 8080

# Configure JVM memory limits and flags for containers
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"

# Healthcheck via Spring Boot Actuator
HEALTHCHECK --interval=20s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
