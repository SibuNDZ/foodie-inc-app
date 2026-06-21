package com.foodieinc.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserAdminUpdateDTO {
    private String firstName;
    private String lastName;
    private String phone;
    private String address;
    private String role;
    private Boolean isActive;
}