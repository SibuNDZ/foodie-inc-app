package com.foodieinc.backend.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class FileStorageServiceTest {

    @TempDir
    Path tempDir;

    @Test
    void store_ShouldAcceptAJpegAndKeepItUnderTheFolder() throws Exception {
        FileStorageService storage = new FileStorageService(tempDir.toString());
        MockMultipartFile file = new MockMultipartFile(
                "file", "bobotie.jpg", "image/jpeg", new byte[] {1, 2, 3, 4});

        String relative = storage.store("dishes", file);

        assertTrue(relative.startsWith("dishes/"));
        assertTrue(relative.endsWith(".jpg"));
        assertTrue(storage.resolve(relative).toFile().exists());
    }

    @Test
    void store_ShouldRejectANonImage() throws Exception {
        FileStorageService storage = new FileStorageService(tempDir.toString());
        MockMultipartFile file = new MockMultipartFile(
                "file", "notes.txt", "text/plain", "nope".getBytes());

        assertThrows(IllegalArgumentException.class, () -> storage.store("dishes", file));
    }
}
