package com.foodieinc.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/gif");

    private static final Map<String, String> EXTENSION_BY_TYPE = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp",
            "image/gif", ".gif");

    private final Path root;

    public FileStorageService(@Value("${app.upload.dir:uploads}") String uploadDir) throws IOException {
        this.root = Path.of(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(this.root);
    }

    /**
     * Stores an image under {@code folder} and returns the relative path used by
     * the static resource handler, e.g. {@code restaurants/uuid.jpg}.
     */
    public String store(String folder, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("An image file is required");
        }

        String contentType = file.getContentType() == null
                ? ""
                : file.getContentType().toLowerCase(Locale.ROOT);
        if (!ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("Only JPEG, PNG, WebP, and GIF images are accepted");
        }

        String safeFolder = sanitizeFolder(folder);
        String filename = UUID.randomUUID() + EXTENSION_BY_TYPE.get(contentType);
        Path destination = root.resolve(safeFolder).resolve(filename).normalize();
        if (!destination.startsWith(root)) {
            throw new IllegalArgumentException("Invalid upload path");
        }

        try {
            Files.createDirectories(destination.getParent());
            try (InputStream in = file.getInputStream()) {
                Files.copy(in, destination);
            }
        } catch (IOException e) {
            throw new IllegalStateException("Could not store the uploaded image", e);
        }

        return safeFolder + "/" + filename;
    }

    public Path resolve(String relativePath) {
        return root.resolve(relativePath).normalize();
    }

    private static String sanitizeFolder(String folder) {
        if (folder == null || !folder.matches("[a-z0-9-]+")) {
            throw new IllegalArgumentException("Invalid upload folder");
        }
        return folder;
    }
}
