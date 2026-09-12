package com.foodieinc.backend.config;

import com.foodieinc.backend.entity.Dish;
import com.foodieinc.backend.entity.DishCategory;
import com.foodieinc.backend.entity.DriverProfile;
import com.foodieinc.backend.entity.Restaurant;
import com.foodieinc.backend.entity.User;
import com.foodieinc.backend.repository.DishCategoryRepository;
import com.foodieinc.backend.repository.DishRepository;
import com.foodieinc.backend.repository.DriverProfileRepository;
import com.foodieinc.backend.repository.RestaurantRepository;
import com.foodieinc.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Dev-only seed data so the frontend has real content to render.
 *
 * Runs only outside the "prod" profile and only when no restaurants exist,
 * so it is safe to restart locally without creating duplicates.
 */
@Configuration
@Profile("!prod")
@ConditionalOnProperty(name = "app.dev-seed.enabled", havingValue = "true", matchIfMissing = true)
public class DevDataSeeder {

    @Bean
    public CommandLineRunner seedDevData(
            UserRepository userRepository,
            RestaurantRepository restaurantRepository,
            DishCategoryRepository dishCategoryRepository,
            DishRepository dishRepository,
            DriverProfileRepository driverProfileRepository,
            PasswordEncoder passwordEncoder
    ) {
        return args -> {
            seedAdminIfMissing(userRepository, passwordEncoder);

            if (restaurantRepository.count() > 0) {
                return;
            }

            DishCategory mains = saveCategory(dishCategoryRepository, "Mains", 1);
            DishCategory starters = saveCategory(dishCategoryRepository, "Starters", 2);
            DishCategory desserts = saveCategory(dishCategoryRepository, "Desserts", 3);
            DishCategory drinks = saveCategory(dishCategoryRepository, "Drinks", 4);

            User owner1 = createOwner(userRepository, passwordEncoder,
                    "mama.thandi", "thandi@spicekitchen.co.za", "Thandi", "Mokoena");
            User owner2 = createOwner(userRepository, passwordEncoder,
                    "luca.rossi", "luca@bellapasta.co.za", "Luca", "Rossi");
            User owner3 = createOwner(userRepository, passwordEncoder,
                    "wei.chen", "wei@goldendragon.co.za", "Wei", "Chen");

            User driver1 = createDeliveryDriver(userRepository, passwordEncoder,
                    "dispatch.driver", "dispatch.driver@test.local", "Dispatch", "Driver");
            User driver2 = createDeliveryDriver(userRepository, passwordEncoder,
                    "dispatch.driver2", "dispatch.driver2@foodieinc.test", "Dispatch", "DriverTwo");

            Restaurant spiceKitchen = saveRestaurant(restaurantRepository, owner1,
                    "Spice Kitchen", "Home-style South African and Cape Malay comfort food.",
                    "14 Long Street", "Cape Town", "Western Cape", "8001",
                    "0211234567", "info@spicekitchen.co.za", "South African",
                    new BigDecimal("25.00"), new BigDecimal("100.00"), 35,
                    LocalTime.of(10, 0), LocalTime.of(21, 0),
                    new BigDecimal("-33.924900"), new BigDecimal("18.424100"));

            Restaurant bellaPasta = saveRestaurant(restaurantRepository, owner2,
                    "Bella Pasta", "Authentic Italian pasta and wood-fired pizza.",
                    "22 Kloof Street", "Cape Town", "Western Cape", "8001",
                    "0217654321", "info@bellapasta.co.za", "Italian",
                    new BigDecimal("30.00"), new BigDecimal("120.00"), 40,
                    LocalTime.of(11, 0), LocalTime.of(22, 0),
                    new BigDecimal("-33.926300"), new BigDecimal("18.415700"));

            Restaurant goldenDragon = saveRestaurant(restaurantRepository, owner3,
                    "Golden Dragon", "Classic Cantonese and Sichuan dishes made fresh daily.",
                    "5 Buitengracht Street", "Cape Town", "Western Cape", "8001",
                    "0219876543", "info@goldendragon.co.za", "Chinese",
                    new BigDecimal("20.00"), new BigDecimal("90.00"), 30,
                    LocalTime.of(11, 30), LocalTime.of(21, 30),
                    new BigDecimal("-33.918300"), new BigDecimal("18.412200"));

            saveDriverProfile(driverProfileRepository, driver1,
                    DriverProfile.VehicleType.MOTORCYCLE, "CA-DRVR-001",
                    true, new BigDecimal("-33.924800"), new BigDecimal("18.424000"));
            saveDriverProfile(driverProfileRepository, driver2,
                    DriverProfile.VehicleType.MOTORCYCLE, "CA-DRVR-002",
                    true, new BigDecimal("-34.050000"), new BigDecimal("18.500000"));

            saveDish(dishRepository, spiceKitchen, mains, "Bobotie",
                    "Spiced minced beef bake with a golden egg topping, served with yellow rice.",
                    new BigDecimal("145.00"), 25, false, false, true, 2, 680);
            saveDish(dishRepository, spiceKitchen, mains, "Cape Malay Chicken Curry",
                    "Mild, fragrant curry with potatoes and dried apricots.",
                    new BigDecimal("130.00"), 30, false, false, true, 2, 610);
            saveDish(dishRepository, spiceKitchen, starters, "Samoosas (6 pcs)",
                    "Crispy pastry parcels filled with spiced mince or vegetables.",
                    new BigDecimal("45.00"), 10, false, false, false, 1, 320);
            saveDish(dishRepository, spiceKitchen, desserts, "Malva Pudding",
                    "Warm sponge pudding with a sticky apricot glaze and custard.",
                    new BigDecimal("55.00"), 5, true, false, false, 0, 480);
            saveDish(dishRepository, spiceKitchen, drinks, "Rooibos Iced Tea",
                    "Chilled rooibos tea with a hint of citrus.",
                    new BigDecimal("25.00"), 2, true, true, true, 0, 60);

            saveDish(dishRepository, bellaPasta, mains, "Spaghetti Carbonara",
                    "Classic Roman carbonara with guanciale, egg, and pecorino.",
                    new BigDecimal("155.00"), 18, false, false, false, 0, 720);
            saveDish(dishRepository, bellaPasta, mains, "Margherita Pizza",
                    "San Marzano tomato, fresh mozzarella, and basil on a wood-fired base.",
                    new BigDecimal("140.00"), 15, true, false, false, 0, 850);
            saveDish(dishRepository, bellaPasta, starters, "Bruschetta",
                    "Toasted ciabatta with tomato, garlic, and olive oil.",
                    new BigDecimal("60.00"), 8, true, true, false, 0, 280);
            saveDish(dishRepository, bellaPasta, desserts, "Tiramisu",
                    "Espresso-soaked sponge layered with mascarpone cream.",
                    new BigDecimal("65.00"), 5, true, false, false, 0, 510);
            saveDish(dishRepository, bellaPasta, drinks, "San Pellegrino",
                    "Sparkling Italian mineral water.",
                    new BigDecimal("28.00"), 1, true, true, true, 0, 0);

            saveDish(dishRepository, goldenDragon, mains, "Kung Pao Chicken",
                    "Stir-fried chicken with peanuts, chilies, and Sichuan peppercorns.",
                    new BigDecimal("135.00"), 20, false, false, true, 3, 590);
            saveDish(dishRepository, goldenDragon, mains, "Sweet and Sour Pork",
                    "Crispy pork in a tangy pineapple sauce.",
                    new BigDecimal("125.00"), 22, false, false, true, 0, 650);
            saveDish(dishRepository, goldenDragon, starters, "Spring Rolls (4 pcs)",
                    "Crispy vegetable spring rolls with sweet chili dip.",
                    new BigDecimal("40.00"), 10, true, true, false, 0, 290);
            saveDish(dishRepository, goldenDragon, desserts, "Fried Banana with Honey",
                    "Crispy battered banana drizzled with honey.",
                    new BigDecimal("38.00"), 8, true, false, false, 0, 310);
            saveDish(dishRepository, goldenDragon, drinks, "Jasmine Tea",
                    "Fragrant hot jasmine tea.",
                    new BigDecimal("20.00"), 3, true, true, true, 0, 5);
        };
    }

    private DishCategory saveCategory(DishCategoryRepository repo, String name, int order) {
        DishCategory category = new DishCategory();
        category.setName(name);
        category.setDisplayOrder(order);
        category.setActive(true);
        return repo.save(category);
    }

    private User createOwner(UserRepository repo, PasswordEncoder encoder,
                             String username, String email, String firstName, String lastName) {
        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(encoder.encode("Password123!"));
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setRole(User.UserRole.RESTAURANT_OWNER);
        user.setActive(true);
        return repo.save(user);
    }

    private void seedAdminIfMissing(UserRepository repo, PasswordEncoder encoder) {
        if (repo.findByUsername("admin").isPresent()) {
            return;
        }
        User admin = new User();
        admin.setUsername("admin");
        admin.setEmail("admin@foodieinc.local");
        admin.setPassword(encoder.encode("Password123!"));
        admin.setFirstName("Foodie");
        admin.setLastName("Admin");
        admin.setRole(User.UserRole.ADMIN);
        admin.setActive(true);
        repo.save(admin);
    }

        private User createDeliveryDriver(UserRepository repo, PasswordEncoder encoder,
                                                                          String username, String email, String firstName, String lastName) {
                User user = new User();
                user.setUsername(username);
                user.setEmail(email);
                user.setPassword(encoder.encode("Password123!"));
                user.setFirstName(firstName);
                user.setLastName(lastName);
                user.setRole(User.UserRole.DELIVERY_PERSON);
                user.setActive(true);
                return repo.save(user);
        }

    private Restaurant saveRestaurant(RestaurantRepository repo, User owner, String name, String description,
                                      String address, String city, String state, String zipCode,
                                      String phone, String email, String cuisineType,
                                      BigDecimal deliveryFee, BigDecimal minimumOrder, int estimatedDeliveryTime,
                                      LocalTime openingTime, LocalTime closingTime,
                                      BigDecimal latitude, BigDecimal longitude) {
        Restaurant restaurant = new Restaurant();
        restaurant.setOwner(owner);
        restaurant.setName(name);
        restaurant.setDescription(description);
        restaurant.setAddress(address);
        restaurant.setCity(city);
        restaurant.setState(state);
        restaurant.setZipCode(zipCode);
        restaurant.setPhone(phone);
        restaurant.setEmail(email);
        restaurant.setCuisineType(cuisineType);
        restaurant.setAverageRating(new BigDecimal("4.50"));
        restaurant.setTotalReviews(0);
        restaurant.setDeliveryFee(deliveryFee);
        restaurant.setMinimumOrder(minimumOrder);
        restaurant.setEstimatedDeliveryTime(estimatedDeliveryTime);
        restaurant.setOpeningTime(openingTime);
        restaurant.setClosingTime(closingTime);
                restaurant.setLatitude(latitude);
                restaurant.setLongitude(longitude);
        restaurant.setActive(true);
        restaurant.setOpen(true);
        return repo.save(restaurant);
    }

        private void saveDriverProfile(DriverProfileRepository repo, User user,
                                                                   DriverProfile.VehicleType vehicleType, String licensePlate,
                                                                   boolean available, BigDecimal latitude, BigDecimal longitude) {
                DriverProfile profile = new DriverProfile();
                profile.setUser(user);
                profile.setVehicleType(vehicleType);
                profile.setLicensePlate(licensePlate);
                profile.setAvailable(available);
                profile.setCurrentLatitude(latitude);
                profile.setCurrentLongitude(longitude);
                profile.setLastLocationUpdatedAt(LocalDateTime.now());
                repo.save(profile);
        }

    private void saveDish(DishRepository repo, Restaurant restaurant, DishCategory category,
                          String name, String description, BigDecimal price, int prepTime,
                          boolean vegetarian, boolean vegan, boolean glutenFree,
                          int spiceLevel, int calories) {
        Dish dish = new Dish();
        dish.setRestaurant(restaurant);
        dish.setCategory(category);
        dish.setName(name);
        dish.setDescription(description);
        dish.setPrice(price);
        dish.setPreparationTime(prepTime);
        dish.setVegetarian(vegetarian);
        dish.setVegan(vegan);
        dish.setGlutenFree(glutenFree);
        dish.setSpiceLevel(spiceLevel);
        dish.setCalories(calories);
        dish.setAvailable(true);
        repo.save(dish);
    }
}
