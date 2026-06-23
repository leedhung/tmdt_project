# Stage 1: Build the Spring Boot application
FROM maven:3.9-eclipse-temurin-17-alpine AS build
WORKDIR /app
COPY pom.xml .
# Cache dependencies in a separate layer (excluding tests to save bandwidth and prevent TLS errors)
RUN mvn dependency:go-offline -B -DexcludeScope=test -Dhttp.keepAlive=false -Dmaven.wagon.http.pool=false -Dhttps.protocols=TLSv1.2 -Dmaven.wagon.http.retryHandler.count=5 || true
COPY src ./src
RUN mvn package -Dmaven.test.skip=true -U -Dhttp.keepAlive=false -Dmaven.wagon.http.pool=false -Dhttps.protocols=TLSv1.2 -Dmaven.wagon.http.retryHandler.count=5

# Stage 2: Lightweight JRE runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/backend-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8081
ENV DB_HOST=mysql
ENTRYPOINT ["java", "-jar", "app.jar"]
