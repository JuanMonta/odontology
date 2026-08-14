package api;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class Application {

	/**
	 * Mapper Jackson 2 para (des)serializar los bloques JSON de la historia
	 * clínica 033 (LONGTEXT). Spring Boot 4 auto-configura Jackson 3, por eso
	 * este bean se declara explícitamente.
	 */
	@Bean
	public ObjectMapper hclObjectMapper() {
		return new ObjectMapper();
	}

	public static void main(String[] args) {
		SpringApplication.run(Application.class, args);
	}

}
