package com.foodieinc.backend.web;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class UploadsResourceTest {

    @Autowired
    private MockMvc mockMvc;

    @Value("${app.upload.dir}")
    private String uploadDir;

    @Test
    void missingUpload_IsA404NotA500() throws Exception {
        mockMvc.perform(get("/uploads/dishes/does-not-exist.jpg"))
                .andExpect(status().isNotFound());
    }

    @Test
    void storedUpload_IsServedPublicly() throws Exception {
        Path dir = Path.of(uploadDir).toAbsolutePath().normalize().resolve("dishes");
        Files.createDirectories(dir);
        Path file = dir.resolve("served.png");
        Files.write(file, new byte[] {1, 2, 3});

        mockMvc.perform(get("/uploads/dishes/served.png"))
                .andExpect(status().isOk())
                .andExpect(content().bytes(new byte[] {1, 2, 3}));
    }
}
