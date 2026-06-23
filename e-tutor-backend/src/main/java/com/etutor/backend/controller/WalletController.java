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
}
