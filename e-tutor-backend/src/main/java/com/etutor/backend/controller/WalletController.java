package com.etutor.backend.controller;

import com.etutor.backend.model.Transaction;
import com.etutor.backend.model.Wallet;
import com.etutor.backend.service.WalletService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/wallet")
public class WalletController {

    private final WalletService walletService;

    public WalletController(WalletService walletService) {
        this.walletService = walletService;
    }

    // Lấy thông tin ví của user đang đăng nhập
    @GetMapping
    public ResponseEntity<?> getWallet(@AuthenticationPrincipal Long userId) {
        try {
            Wallet wallet = walletService.getWalletByUserId(userId);
            return ResponseEntity.ok(wallet);
        } catch (Exception ex) {
            Map<String, String> error = new HashMap<>();
            error.put("error", ex.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // Lấy lịch sử giao dịch của user đang đăng nhập
    @GetMapping("/transactions")
    public ResponseEntity<?> getTransactions(@AuthenticationPrincipal Long userId) {
        try {
            List<Transaction> transactions = walletService.getTransactionHistory(userId);
            return ResponseEntity.ok(transactions);
        } catch (Exception ex) {
            Map<String, String> error = new HashMap<>();
            error.put("error", ex.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // API giả lập nạp tiền vào ví
    @PostMapping("/deposit")
    public ResponseEntity<?> deposit(@AuthenticationPrincipal Long userId, @RequestParam BigDecimal amount) {
        try {
            Wallet wallet = walletService.deposit(userId, amount);
            return ResponseEntity.ok(wallet);
        } catch (Exception ex) {
            Map<String, String> error = new HashMap<>();
            error.put("error", ex.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // API giả lập rút tiền khỏi ví
    @PostMapping("/withdraw")
    public ResponseEntity<?> withdraw(@AuthenticationPrincipal Long userId, @RequestParam BigDecimal amount) {
        try {
            Wallet wallet = walletService.withdraw(userId, amount);
            return ResponseEntity.ok(wallet);
        } catch (Exception ex) {
            Map<String, String> error = new HashMap<>();
            error.put("error", ex.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // Lấy doanh thu của Gia sư
    @GetMapping("/tutor/revenue")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> getTutorRevenue(@AuthenticationPrincipal Long userId) {
        try {
            BigDecimal revenue = walletService.getTutorRevenue(userId);
            Map<String, Object> response = new HashMap<>();
            response.put("revenue", revenue);
            return ResponseEntity.ok(response);
        } catch (Exception ex) {
            Map<String, String> error = new HashMap<>();
            error.put("error", ex.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // Lấy thống kê dòng tiền tổng cho Admin
    @GetMapping("/admin/cashflow")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAdminCashflow() {
        try {
            Map<String, BigDecimal> cashflow = walletService.getAdminCashflow();
            return ResponseEntity.ok(cashflow);
        } catch (Exception ex) {
            Map<String, String> error = new HashMap<>();
            error.put("error", ex.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // Lấy danh sách yêu cầu rút tiền đang chờ duyệt cho Admin
    @GetMapping("/admin/withdrawals/pending")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getPendingWithdrawals() {
        try {
            List<Map<String, Object>> withdrawals = walletService.getPendingWithdrawals();
            return ResponseEntity.ok(withdrawals);
        } catch (Exception ex) {
            Map<String, String> error = new HashMap<>();
            error.put("error", ex.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // Phê duyệt yêu cầu rút tiền
    @PostMapping("/admin/withdrawals/{transactionId}/approve")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> approveWithdraw(@PathVariable Long transactionId) {
        try {
            walletService.approveWithdraw(transactionId);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Đã phê duyệt yêu cầu rút tiền thành công!");
            return ResponseEntity.ok(response);
        } catch (Exception ex) {
            Map<String, String> error = new HashMap<>();
            error.put("error", ex.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // Từ chối yêu cầu rút tiền kèm lý do
    @PostMapping("/admin/withdrawals/{transactionId}/reject")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> rejectWithdraw(@PathVariable Long transactionId, @RequestBody Map<String, String> body) {
        try {
            String reason = body.get("reason");
            walletService.rejectWithdraw(transactionId, reason);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Đã từ chối yêu cầu rút tiền và hoàn lại số dư thành công!");
            return ResponseEntity.ok(response);
        } catch (Exception ex) {
            Map<String, String> error = new HashMap<>();
            error.put("error", ex.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // Lấy toàn bộ nhật ký giao dịch phục vụ đối soát dòng tiền cho Admin
    @GetMapping("/admin/transactions/all")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllTransactions() {
        try {
            List<Map<String, Object>> transactions = walletService.getAllTransactionsWithUserInfo();
            return ResponseEntity.ok(transactions);
        } catch (Exception ex) {
            Map<String, String> error = new HashMap<>();
            error.put("error", ex.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // Gia sư mua gói VIP
    @PostMapping("/tutor/buy-vip")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<?> buyVip(@AuthenticationPrincipal Long userId, @RequestBody Map<String, Integer> body) {
        try {
            int days = body.getOrDefault("days", 7);
            com.etutor.backend.model.User updatedUser = walletService.buyVip(userId, days);
            return ResponseEntity.ok(updatedUser);
        } catch (Exception ex) {
            Map<String, String> error = new HashMap<>();
            error.put("error", ex.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
}
