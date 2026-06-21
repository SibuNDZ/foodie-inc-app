package com.foodieinc.backend.service;

import com.foodieinc.backend.dto.UserAdminUpdateDTO;
import com.foodieinc.backend.dto.UserDTO;
import com.foodieinc.backend.dto.UserRegistrationDTO;
import com.foodieinc.backend.entity.User;
import com.foodieinc.backend.exception.ResourceNotFoundException;
import com.foodieinc.backend.exception.UserAlreadyExistsException;
import com.foodieinc.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.springframework.http.HttpStatus.FORBIDDEN;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserDTO registerUser(UserRegistrationDTO registrationDTO) {
        // Check if user already exists
        if (userRepository.existsByUsername(registrationDTO.getUsername())) {
            throw new UserAlreadyExistsException("Username already taken");
        }

        if (userRepository.existsByEmail(registrationDTO.getEmail())) {
            throw new UserAlreadyExistsException("Email already registered");
        }

        // Create new user
        User user = new User();
        user.setUsername(registrationDTO.getUsername());
        user.setEmail(registrationDTO.getEmail());
        user.setPassword(passwordEncoder.encode(registrationDTO.getPassword()));
        user.setFirstName(registrationDTO.getFirstName());
        user.setLastName(registrationDTO.getLastName());
        user.setPhone(registrationDTO.getPhone());
        user.setAddress(registrationDTO.getAddress());
        user.setRole(User.UserRole.CUSTOMER);

        User savedUser = userRepository.save(user);
        return convertToDTO(savedUser);
    }

    public UserDTO getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return convertToDTO(user);
    }

    public UserDTO getUserByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return convertToDTO(user);
    }

    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::convertToDTO)
                .toList();
    }

    public UserDTO updateUser(Long id, UserDTO userDTO) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setFirstName(userDTO.getFirstName());
        user.setLastName(userDTO.getLastName());
        user.setPhone(userDTO.getPhone());
        user.setAddress(userDTO.getAddress());

        User updatedUser = userRepository.save(user);
        return convertToDTO(updatedUser);
    }

    public UserDTO updateUserAdmin(Long id, UserAdminUpdateDTO userDTO, String currentUsername) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (isSelfAdminLockoutAttempt(user, userDTO, currentUsername)) {
            throw new ResponseStatusException(FORBIDDEN, "You cannot change your own role or active status.");
        }

        if (userDTO.getFirstName() != null) {
            user.setFirstName(userDTO.getFirstName());
        }
        if (userDTO.getLastName() != null) {
            user.setLastName(userDTO.getLastName());
        }
        if (userDTO.getPhone() != null) {
            user.setPhone(userDTO.getPhone());
        }
        if (userDTO.getAddress() != null) {
            user.setAddress(userDTO.getAddress());
        }
        if (userDTO.getRole() != null && !userDTO.getRole().isBlank()) {
            user.setRole(User.UserRole.valueOf(userDTO.getRole()));
        }
        if (userDTO.getIsActive() != null) {
            user.setActive(userDTO.getIsActive());
        }

        return convertToDTO(userRepository.save(user));
    }

    public void deactivateUser(Long id, String currentUsername) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getUsername().equals(currentUsername)) {
            throw new ResponseStatusException(FORBIDDEN, "You cannot deactivate your own account.");
        }

        user.setActive(false);
        userRepository.save(user);
    }

    private boolean isSelfAdminLockoutAttempt(User targetUser, UserAdminUpdateDTO userDTO, String currentUsername) {
        if (!targetUser.getUsername().equals(currentUsername)) {
            return false;
        }

        return userDTO.getRole() != null || userDTO.getIsActive() != null;
    }

    private UserDTO convertToDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setPhone(user.getPhone());
        dto.setAddress(user.getAddress());
        dto.setRole(user.getRole().name());
        dto.setIsActive(user.isActive());
        return dto;
    }
}