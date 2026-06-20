package com.foodieinc.backend.controller;

import com.foodieinc.backend.dto.JwtResponse;
import com.foodieinc.backend.dto.LoginRequest;
import com.foodieinc.backend.dto.UserDTO;
import com.foodieinc.backend.dto.UserRegistrationDTO;
import com.foodieinc.backend.security.JwtTokenProvider;
import com.foodieinc.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final JwtTokenProvider tokenProvider;

    @PostMapping("/login")
    public ResponseEntity<JwtResponse> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getUsername(),
                        loginRequest.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);

        UserDTO userDTO = userService.getUserByUsername(loginRequest.getUsername());

        return ResponseEntity.ok(new JwtResponse(jwt, userDTO));
    }

    @PostMapping("/register")
    public ResponseEntity<UserDTO> registerUser(@Valid @RequestBody UserRegistrationDTO registrationDTO) {
        UserDTO newUser = userService.registerUser(registrationDTO);
        return new ResponseEntity<>(newUser, HttpStatus.CREATED);
    }
}
