# Build stage
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app
COPY . .
RUN chmod +x ./mvnw
RUN ./mvnw clean package -DskipTests

# Run stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080 10000
ENTRYPOINT ["sh", "-c", "java -Xmx384m -Xms192m -XX:+UseSerialGC -Dserver.port=${PORT:-8080} -jar app.jar"]
