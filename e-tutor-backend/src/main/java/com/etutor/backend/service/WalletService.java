package com.etutor.backend.service;

import com.etutor.backend.model.Transaction;
import com.etutor.backend.model.TransactionStatus;
import com.etutor.backend.model.TransactionType;
import com.etutor.backend.model.Wallet;
import com.etutor.backend.repository.TransactionRepository;
import com.etutor.backend.repository.WalletRepository;
import com.etutor.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class WalletService {

    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    public WalletService(WalletRepository walletRepository, 
                         TransactionRepository transactionRepository,
                         UserRepository userRepository) {
        this.walletRepository = walletRepository;
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
    }

    // Lấy thông tin Ví của người dùng
    @Transactional(readOnly = true)
    public Wallet getWalletByUserId(Long userId) {
        return walletRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Ví tiền không tồn tại cho người dùng này!"));
    }

    // Lấy lịch sử giao dịch của Ví
    @Transactional(readOnly = true)
    public List<Transaction> getTransactionHistory(Long userId) {
        Wallet wallet = getWalletByUserId(userId);
        return transactionRepository.findByWalletIdOrderByCreatedAtDesc(wallet.getId());
    }

    // API Giả lập Nạp Tiền (Deposit)
    @Transactional
    public Wallet deposit(Long userId, BigDecimal amount) {
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Số tiền nạp phải lớn hơn 0!");
        }

        Wallet wallet = getWalletByUserId(userId);
        wallet.setBalance(wallet.getBalance().add(amount));
        Wallet savedWallet = walletRepository.save(wallet);

        // Ghi lại Log giao dịch
        Transaction transaction = Transaction.builder()
                .walletId(wallet.getId())
                .amount(amount)
                .type(TransactionType.DEPOSIT)
                .status(TransactionStatus.SUCCESS)
                .description("Nạp tiền vào ví (Giả lập)")
                .build();
        transactionRepository.save(transaction);

        return savedWallet;
    }

    // API Giả lập Rút Tiền (Withdraw)
    @Transactional
    public Wallet withdraw(Long userId, BigDecimal amount) {
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Số tiền rút phải lớn hơn 0!");
        }

        Wallet wallet = getWalletByUserId(userId);
        if (wallet.getBalance().compareTo(amount) < 0) {
            throw new RuntimeException("Số dư khả dụng không đủ để thực hiện rút tiền!");
        }

        wallet.setBalance(wallet.getBalance().subtract(amount));
        Wallet savedWallet = walletRepository.save(wallet);

        // Ghi lại Log giao dịch ở trạng thái PENDING
        Transaction transaction = Transaction.builder()
                .walletId(wallet.getId())
                .amount(amount)
                .type(TransactionType.WITHDRAW)
                .status(TransactionStatus.PENDING)
                .description("Yêu cầu rút tiền đang chờ duyệt")
                .build();
        transactionRepository.save(transaction);

        return savedWallet;
    }

    // Hàm nghiệp vụ Đóng băng tiền (Freeze - Escrow) khi học viên thanh toán chốt lớp
    @Transactional
    public void freezeBalance(Long studentId, BigDecimal amount) {
        Wallet wallet = getWalletByUserId(studentId);
        if (wallet.getBalance().compareTo(amount) < 0) {
            throw new RuntimeException("Số dư ví không đủ để thanh toán lớp học này!");
        }

        wallet.setBalance(wallet.getBalance().subtract(amount));
        wallet.setFrozenBalance(wallet.getFrozenBalance().add(amount));
        walletRepository.save(wallet);

        // Ghi log giao dịch LOCK tiền
        Transaction transaction = Transaction.builder()
                .walletId(wallet.getId())
                .amount(amount)
                .type(TransactionType.LOCK)
                .status(TransactionStatus.SUCCESS)
                .description("Đóng băng học phí lớp học (Escrow)")
                .build();
        transactionRepository.save(transaction);
    }

    // Hàm nghiệp vụ Giải ngân (Unfreeze & Distribute) từ ví đóng băng học viên chuyển sang ví gia sư (sau khi trừ phí)
    @Transactional
    public void unfreezeAndDistribute(Long studentId, Long tutorId, BigDecimal amount, double commissionRate) {
        Wallet studentWallet = getWalletByUserId(studentId);
        Wallet tutorWallet = getWalletByUserId(tutorId);

        if (studentWallet.getFrozenBalance().compareTo(amount) < 0) {
            throw new RuntimeException("Số tiền đóng băng không đủ để giải ngân!");
        }

        // Tính toán dòng tiền
        BigDecimal totalAmount = amount;
        BigDecimal commission = totalAmount.multiply(BigDecimal.valueOf(commissionRate));
        BigDecimal tutorEarnings = totalAmount.subtract(commission);

        // Trừ tiền đóng băng của học viên
        studentWallet.setFrozenBalance(studentWallet.getFrozenBalance().subtract(totalAmount));
        walletRepository.save(studentWallet);

        // Cộng tiền vào ví khả dụng của gia sư
        tutorWallet.setBalance(tutorWallet.getBalance().add(tutorEarnings));
        walletRepository.save(tutorWallet);

        // Ghi log mở khóa tiền cho học viên
        Transaction studentTx = Transaction.builder()
                .walletId(studentWallet.getId())
                .amount(totalAmount)
                .type(TransactionType.UNLOCK)
                .status(TransactionStatus.SUCCESS)
                .description(String.format("Giải ngân học phí sang Gia sư (Trừ %d%% hoa hồng)", (int)(commissionRate * 100)))
                .build();
        transactionRepository.save(studentTx);

        // Ghi log nhận tiền cho gia sư
        Transaction tutorTx = Transaction.builder()
                .walletId(tutorWallet.getId())
                .amount(tutorEarnings)
                .type(TransactionType.DEPOSIT)
                .status(TransactionStatus.SUCCESS)
                .description(String.format("Nhận tiền học phí từ Học viên (Mã ví: %d)", studentWallet.getId()))
                .build();
        transactionRepository.save(tutorTx);

        // Ghi log doanh thu hoa hồng của hệ thống (lưu chung với ví của Tutor hoặc Admin, ở đây dùng tạm ví của Tutor để track)
        if (commission.compareTo(BigDecimal.ZERO) > 0) {
            Transaction commissionTx = Transaction.builder()
                    .walletId(tutorWallet.getId())
                    .amount(commission)
                    .type(TransactionType.COMMISSION)
                    .status(TransactionStatus.SUCCESS)
                    .description("Phí hoa hồng nền tảng")
                    .build();
            transactionRepository.save(commissionTx);
        }
    }

    // Hàm nghiệp vụ Hoàn tiền (Refund) khi xảy ra tranh chấp có lợi cho học viên hoặc hủy lớp
    @Transactional
    public void refund(Long studentId, BigDecimal amount) {
        Wallet wallet = getWalletByUserId(studentId);

        if (wallet.getFrozenBalance().compareTo(amount) < 0) {
            throw new RuntimeException("Số tiền đóng băng không đủ để thực hiện hoàn tiền!");
        }

        // Giải phóng tiền đóng băng quay lại số dư khả dụng
        wallet.setFrozenBalance(wallet.getFrozenBalance().subtract(amount));
        wallet.setBalance(wallet.getBalance().add(amount));
        walletRepository.save(wallet);

        // Ghi log hoàn tiền REFUND
        Transaction transaction = Transaction.builder()
                .walletId(wallet.getId())
                .amount(amount)
                .type(TransactionType.REFUND)
                .status(TransactionStatus.SUCCESS)
                .description("Hoàn tiền học phí đã đóng băng về ví khả dụng")
                .build();
        transactionRepository.save(transaction);
    }

    // Lấy thống kê doanh thu cho Gia sư (tính bằng tổng DEPOSIT trừ đi khoản tự nạp nếu có, hoặc chỉ đếm DEPOSIT nhận từ học viên)
    // Để đơn giản, ở đây ta lấy tổng DEPOSIT vào ví.
    @Transactional(readOnly = true)
    public BigDecimal getTutorRevenue(Long tutorId) {
        Wallet wallet = getWalletByUserId(tutorId);
        return transactionRepository.sumAmountByWalletIdAndType(wallet.getId(), TransactionType.DEPOSIT);
    }

    // Lấy thống kê dòng tiền tổng cho Admin
    @Transactional(readOnly = true)
    public java.util.Map<String, BigDecimal> getAdminCashflow() {
        BigDecimal totalDeposits = transactionRepository.sumAmountByType(TransactionType.DEPOSIT);
        BigDecimal totalWithdraws = transactionRepository.sumAmountByType(TransactionType.WITHDRAW);
        BigDecimal totalCommissions = transactionRepository.sumAmountByType(TransactionType.COMMISSION);

        java.util.Map<String, BigDecimal> stats = new java.util.HashMap<>();
        stats.put("totalDeposits", totalDeposits);
        stats.put("totalWithdraws", totalWithdraws);
        stats.put("totalCommissions", totalCommissions);
        return stats;
    }

    // Lấy danh sách yêu cầu rút tiền đang chờ duyệt cho Admin
    @Transactional(readOnly = true)
    public List<java.util.Map<String, Object>> getPendingWithdrawals() {
        List<Transaction> pendingTxs = transactionRepository.findByTypeAndStatusOrderByCreatedAtDesc(
                TransactionType.WITHDRAW, TransactionStatus.PENDING);
        List<java.util.Map<String, Object>> result = new java.util.ArrayList<>();
        for (Transaction tx : pendingTxs) {
            java.util.Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", tx.getId());
            map.put("walletId", tx.getWalletId());
            map.put("amount", tx.getAmount());
            map.put("type", tx.getType());
            map.put("status", tx.getStatus());
            map.put("description", tx.getDescription());
            map.put("createdAt", tx.getCreatedAt());

            walletRepository.findById(tx.getWalletId()).ifPresent(wallet -> {
                userRepository.findById(wallet.getUserId()).ifPresent(user -> {
                    map.put("userFullName", user.getFullName());
                    map.put("userEmail", user.getEmail());
                });
            });
            result.add(map);
        }
        return result;
    }

    // Lấy toàn bộ nhật ký giao dịch kèm thông tin user phục vụ đối soát dòng tiền cho Admin
    @Transactional(readOnly = true)
    public List<java.util.Map<String, Object>> getAllTransactionsWithUserInfo() {
        List<Transaction> allTxs = transactionRepository.findAllByOrderByCreatedAtDesc();
        List<java.util.Map<String, Object>> result = new java.util.ArrayList<>();
        for (Transaction tx : allTxs) {
            java.util.Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", tx.getId());
            map.put("walletId", tx.getWalletId());
            map.put("amount", tx.getAmount());
            map.put("type", tx.getType());
            map.put("status", tx.getStatus());
            map.put("description", tx.getDescription());
            map.put("createdAt", tx.getCreatedAt());

            walletRepository.findById(tx.getWalletId()).ifPresent(wallet -> {
                userRepository.findById(wallet.getUserId()).ifPresent(user -> {
                    map.put("userFullName", user.getFullName());
                    map.put("userEmail", user.getEmail());
                });
            });
            result.add(map);
        }
        return result;
    }

    // Phê duyệt yêu cầu rút tiền
    @Transactional
    public void approveWithdraw(Long transactionId) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Giao dịch không tồn tại!"));

        if (transaction.getType() != TransactionType.WITHDRAW) {
            throw new RuntimeException("Giao dịch không phải là yêu cầu rút tiền!");
        }

        if (transaction.getStatus() != TransactionStatus.PENDING) {
            throw new RuntimeException("Giao dịch này đã được xử lý trước đó!");
        }

        transaction.setStatus(TransactionStatus.SUCCESS);
        transaction.setDescription("Yêu cầu rút tiền đã được phê duyệt thành công");
        transactionRepository.save(transaction);
    }

    // Từ chối yêu cầu rút tiền và hoàn lại tiền về số dư khả dụng
    @Transactional
    public void rejectWithdraw(Long transactionId, String reason) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Giao dịch không tồn tại!"));

        if (transaction.getType() != TransactionType.WITHDRAW) {
            throw new RuntimeException("Giao dịch không phải là yêu cầu rút tiền!");
        }

        if (transaction.getStatus() != TransactionStatus.PENDING) {
            throw new RuntimeException("Giao dịch này đã được xử lý trước đó!");
        }

        // Hoàn lại tiền vào ví khả dụng
        Wallet wallet = walletRepository.findById(transaction.getWalletId())
                .orElseThrow(() -> new RuntimeException("Ví tiền không tồn tại!"));
        wallet.setBalance(wallet.getBalance().add(transaction.getAmount()));
        walletRepository.save(wallet);

        // Cập nhật giao dịch thành FAILED
        transaction.setStatus(TransactionStatus.FAILED);
        transaction.setDescription("Yêu cầu rút tiền bị từ chối: " + (reason != null && !reason.trim().isEmpty() ? reason.trim() : "Không có lý do cụ thể"));
        transactionRepository.save(transaction);
    }

    // Gia sư mua gói VIP
    @Transactional
    public com.etutor.backend.model.User buyVip(Long userId, int days) {
        com.etutor.backend.model.User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại!"));

        if (user.getRole() != com.etutor.backend.model.Role.TUTOR) {
            throw new RuntimeException("Chỉ tài khoản Gia sư mới có quyền mua gói VIP!");
        }

        BigDecimal price;
        if (days == 7) {
            price = new BigDecimal("99000");
        } else if (days == 30) {
            price = new BigDecimal("299000");
        } else {
            throw new RuntimeException("Gói VIP không hợp lệ! Vui lòng chọn gói 7 ngày hoặc 30 ngày.");
        }

        Wallet wallet = getWalletByUserId(userId);
        if (wallet.getBalance().compareTo(price) < 0) {
            throw new RuntimeException("Số dư ví khả dụng không đủ để mua gói VIP này! Vui lòng nạp thêm tiền.");
        }

        // Trừ tiền trong ví
        wallet.setBalance(wallet.getBalance().subtract(price));
        walletRepository.save(wallet);

        // Gia hạn VIP
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        java.time.LocalDateTime newExpiry;
        if (user.getVipExpiry() == null || user.getVipExpiry().isBefore(now)) {
            newExpiry = now.plusDays(days);
        } else {
            newExpiry = user.getVipExpiry().plusDays(days);
        }
        user.setVipExpiry(newExpiry);
        com.etutor.backend.model.User savedUser = userRepository.save(user);

        // Ghi log giao dịch VIP_PURCHASE
        Transaction transaction = Transaction.builder()
                .walletId(wallet.getId())
                .amount(price)
                .type(TransactionType.VIP_PURCHASE)
                .status(TransactionStatus.SUCCESS)
                .description(String.format("Mua gói VIP gia sư ưu tiên hiển thị (%d ngày)", days))
                .build();
        transactionRepository.save(transaction);

        return savedUser;
    }
}
