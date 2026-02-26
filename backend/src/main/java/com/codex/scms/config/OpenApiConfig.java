package com.codex.scms.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("Student Complaint Management API")
                .version("v1")
                .description("RBAC complaint workflow system with AI classification, imgbb uploads, email + SLA scheduler")
                .contact(new Contact().name("Engineering Team")))
            .addSecurityItem(new SecurityRequirement().addList("bearerAuth"))
            .schemaRequirement("bearerAuth", new SecurityScheme()
                .name("Authorization")
                .type(SecurityScheme.Type.HTTP)
                .scheme("bearer")
                .bearerFormat("JWT"));
    }
}
