package com.example.backend.service;

import com.example.backend.dto.SellerDashboardResponse;
import com.example.backend.dto.SellerOrderCreateRequest;
import com.example.backend.dto.SellerOrderResponse;
import com.example.backend.dto.SellerOrderStatusUpdateRequest;
import com.example.backend.dto.SellerProductRequest;
import com.example.backend.dto.SellerProductResponse;
import com.example.backend.entity.SellerOrder;
import com.example.backend.entity.SellerOrderStatus;
import com.example.backend.entity.SellerProduct;
import com.example.backend.entity.User;
import com.example.backend.exception.ConflictException;
import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.repository.SellerOrderRepository;
import com.example.backend.repository.SellerProductRepository;
import com.example.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class SellerService {

    private static final int LOW_STOCK_THRESHOLD = 3;

    private final UserRepository userRepository;
    private final SellerProductRepository sellerProductRepository;
    private final SellerOrderRepository sellerOrderRepository;

    public SellerService(
            UserRepository userRepository,
            SellerProductRepository sellerProductRepository,
            SellerOrderRepository sellerOrderRepository
    ) {
        this.userRepository = userRepository;
        this.sellerProductRepository = sellerProductRepository;
        this.sellerOrderRepository = sellerOrderRepository;
    }

    public SellerDashboardResponse getDashboard(String username) {
        User seller = getSeller(username);
        List<SellerProduct> products = sellerProductRepository.findBySellerIdOrderByUpdatedAtDesc(seller.getId());
        List<SellerOrder> orders = sellerOrderRepository.findBySellerIdOrderByOrderedAtDesc(seller.getId());

        long activeProducts = products.stream().filter(SellerProduct::isActive).count();
        long lowStockProducts = products.stream()
                .filter(SellerProduct::isActive)
                .filter(product -> product.getStock() <= LOW_STOCK_THRESHOLD)
                .count();
        long totalStock = products.stream().mapToLong(SellerProduct::getStock).sum();
        Map<String, Double> priceByProductName = products.stream()
                .collect(Collectors.toMap(
                        product -> product.getName().toLowerCase(),
                        SellerProduct::getPrice,
                        (first, second) -> first
                ));
        double revenue = orders.stream()
                .filter(order -> order.getStatus() == SellerOrderStatus.DELIVERED)
                .mapToDouble(order -> resolveOrderTotal(order, priceByProductName))
                .sum();

        return new SellerDashboardResponse(
                products.size(),
                activeProducts,
                lowStockProducts,
                countOrdersByStatus(orders, SellerOrderStatus.PENDING),
                countOrdersByStatus(orders, SellerOrderStatus.ACCEPTED),
                countOrdersByStatus(orders, SellerOrderStatus.DELIVERED),
                totalStock,
                revenue
        );
    }

    public List<SellerProductResponse> getProducts(String username) {
        User seller = getSeller(username);
        return sellerProductRepository.findBySellerIdOrderByUpdatedAtDesc(seller.getId()).stream()
                .map(this::mapProduct)
                .toList();
    }

    public List<SellerProductResponse> getAvailableProducts() {
        return sellerProductRepository.findByActiveTrueAndStockGreaterThanOrderByUpdatedAtDesc(0).stream()
                .map(this::mapProduct)
                .toList();
    }

    public SellerProductResponse createProduct(String username, SellerProductRequest request) {
        User seller = getSeller(username);

        SellerProduct product = new SellerProduct();
        applyProductRequest(product, request);
        product.setSeller(seller);

        return mapProduct(sellerProductRepository.save(product));
    }

    public SellerProductResponse updateProduct(String username, Long id, SellerProductRequest request) {
        User seller = getSeller(username);
        SellerProduct product = sellerProductRepository.findByIdAndSellerId(id, seller.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Seller product not found"));

        applyProductRequest(product, request);

        return mapProduct(sellerProductRepository.save(product));
    }

    public void deleteProduct(String username, Long id) {
        User seller = getSeller(username);
        SellerProduct product = sellerProductRepository.findByIdAndSellerId(id, seller.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Seller product not found"));

        sellerProductRepository.delete(product);
    }

    public List<SellerOrderResponse> getOrders(String username) {
        User seller = getSeller(username);
        return sellerOrderRepository.findBySellerIdOrderByOrderedAtDesc(seller.getId()).stream()
                .map(this::mapOrder)
                .toList();
    }

    @Transactional
    public SellerOrderResponse createMarketplaceOrder(
            String username,
            Long productId,
            SellerOrderCreateRequest request
    ) {
        User customer = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
        SellerProduct product = sellerProductRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Seller product not found"));

        if (!product.isActive()) {
            throw new ConflictException("This seller product is not available right now");
        }

        if (product.getStock() < request.getQuantity()) {
            throw new ConflictException("Only " + product.getStock() + " unit(s) are available");
        }

        product.setStock(product.getStock() - request.getQuantity());
        product.setUpdatedAt(LocalDateTime.now());
        sellerProductRepository.save(product);

        SellerOrder order = new SellerOrder();
        order.setProductName(product.getName());
        order.setCategory(product.getCategory());
        order.setQuantity(request.getQuantity());
        order.setUnitPrice(product.getPrice());
        order.setTotalPrice(product.getPrice() * request.getQuantity());
        order.setCustomerName(customer.getUsername());
        order.setStatus(SellerOrderStatus.PENDING);
        order.setOrderedAt(LocalDateTime.now());
        order.setSeller(product.getSeller());

        return mapOrder(sellerOrderRepository.save(order));
    }

    public SellerOrderResponse updateOrderStatus(String username, Long id, SellerOrderStatusUpdateRequest request) {
        User seller = getSeller(username);
        SellerOrder order = sellerOrderRepository.findByIdAndSellerId(id, seller.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Seller order not found"));

        SellerOrderStatus nextStatus;
        try {
            nextStatus = SellerOrderStatus.valueOf(request.getStatus().trim().toUpperCase());
        } catch (IllegalArgumentException exception) {
            throw new ConflictException("Order status must be PENDING, ACCEPTED, or DELIVERED");
        }

        order.setStatus(nextStatus);
        return mapOrder(sellerOrderRepository.save(order));
    }

    private User getSeller(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Seller not found"));
    }

    private void applyProductRequest(SellerProduct product, SellerProductRequest request) {
        product.setName(request.getName().trim());
        product.setCategory(request.getCategory().trim());
        product.setPrice(request.getPrice());
        product.setStock(request.getStock());
        product.setExpiryDate(request.getExpiryDate());
        product.setActive(request.isActive());
        product.setUpdatedAt(LocalDateTime.now());
    }

    private long countOrdersByStatus(List<SellerOrder> orders, SellerOrderStatus status) {
        return orders.stream().filter(order -> order.getStatus() == status).count();
    }

    private double resolveOrderTotal(SellerOrder order, Map<String, Double> priceByProductName) {
        if (order.getTotalPrice() > 0) {
            return order.getTotalPrice();
        }

        if (order.getUnitPrice() > 0) {
            return order.getUnitPrice() * order.getQuantity();
        }

        double productPrice = priceByProductName.getOrDefault(order.getProductName().toLowerCase(), 0.0);
        return productPrice * order.getQuantity();
    }

    private SellerProductResponse mapProduct(SellerProduct product) {
        return new SellerProductResponse(
                product.getId(),
                product.getName(),
                product.getCategory(),
                product.getPrice(),
                product.getStock(),
                product.getExpiryDate(),
                product.isActive(),
                product.getUpdatedAt()
        );
    }

    private SellerOrderResponse mapOrder(SellerOrder order) {
        return new SellerOrderResponse(
                order.getId(),
                order.getProductName(),
                order.getCategory(),
                order.getQuantity(),
                order.getUnitPrice(),
                order.getTotalPrice(),
                order.getCustomerName(),
                order.getStatus().name(),
                order.getOrderedAt()
        );
    }
}
