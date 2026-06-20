FROM maven:3.9.9-eclipse-temurin-25 AS build

WORKDIR /app

COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw

COPY src ./src
RUN ./mvnw -B -DskipTests package

FROM eclipse-temurin:25-jre-jammy

WORKDIR /app
ENV JAVA_OPTS=""

COPY --from=build /app/target/*-SNAPSHOT.jar /app/app.jar

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
