package com.example.backend;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;

import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class BackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}

	@Bean
	@ConditionalOnBean(JdbcTemplate.class)
	public CommandLineRunner migrateDb(JdbcTemplate jdbcTemplate) {
		return args -> {
			try {
				int updated = jdbcTemplate.update(
					"UPDATE seller_orders SET status = 'DELIVERING' WHERE status IN ('PENDING', 'ACCEPTED')"
				);
				System.out.println("Migrated " + updated + " legacy seller order statuses to DELIVERING.");
			} catch (org.springframework.dao.DataAccessException e) {
				System.err.println("Migration failed or already executed: " + e.getMessage());
			}
		};
	}
}
