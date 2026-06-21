package com.foodieinc.backend.controller;

import com.foodieinc.backend.dto.UserAdminUpdateDTO;
import com.foodieinc.backend.dto.UserDTO;
import com.foodieinc.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<UserDTO> updateUser(@PathVariable Long id,
                                              @Valid @RequestBody UserAdminUpdateDTO userDTO,
                                              Authentication authentication) {
        return ResponseEntity.ok(userService.updateUserAdmin(id, userDTO, authentication.getName()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivateUser(@PathVariable Long id, Authentication authentication) {
        userService.deactivateUser(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}