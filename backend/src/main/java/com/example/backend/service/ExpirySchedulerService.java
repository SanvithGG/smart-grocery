package com.example.backend.service;

import com.example.backend.entity.GroceryItem;
import com.example.backend.repository.GroceryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class ExpirySchedulerService {

    private static final Logger log = LoggerFactory.getLogger(ExpirySchedulerService.class);

    @Autowired
    private GroceryRepository groceryRepository;

    // Runs every day at 8:00 AM
    @Scheduled(cron = "0 0 8 * * ?")
    public void scanExpiringItemsDaily() {
        performExpiryScan();
    }

    // Runs once on application startup
    @EventListener(ApplicationReadyEvent.class)
    public void onStartup() {
        log.info("Starting automated inventory & expiry monitoring scan...");
        performExpiryScan();
    }

    public void performExpiryScan() {
        LocalDate today = LocalDate.now();
        List<GroceryItem> allPurchased = groceryRepository.findAll().stream()
                .filter(item -> item != null && item.isPurchased())
                .toList();

        int expiringCount = 0;
        int expiredCount = 0;
        int lowStockCount = 0;

        for (GroceryItem item : allPurchased) {
            String userIdentifier = (item.getUser() != null) ? item.getUser().getUsername() : "Guest";

            if (item.getExpiryDate() != null) {
                long daysUntilExpiry = ChronoUnit.DAYS.between(today, item.getExpiryDate());

                if (daysUntilExpiry < 0) {
                    expiredCount++;
                    log.warn("EXPIRED ITEM ALERT [User: {}]: '{}' expired on {} ({} days ago)",
                            userIdentifier, item.getName(), item.getExpiryDate(), Math.abs(daysUntilExpiry));
                } else if (daysUntilExpiry <= 3) {
                    expiringCount++;
                    log.info("EXPIRING SOON ALERT [User: {}]: '{}' expires in {} day(s) on {}",
                            userIdentifier, item.getName(), daysUntilExpiry, item.getExpiryDate());
                }
            }

            if (item.getQuantity() <= 2) {
                lowStockCount++;
                log.info("LOW STOCK WATCHLIST [User: {}]: '{}' quantity is {}",
                        userIdentifier, item.getName(), item.getQuantity());
            }
        }

        log.info("Expiry Scan Complete: {} expired items, {} expiring soon, {} low stock items.",
                expiredCount, expiringCount, lowStockCount);
    }
}
