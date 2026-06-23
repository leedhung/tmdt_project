package com.etutor.backend.service;

import com.etutor.backend.model.Transaction;
import com.etutor.backend.model.TransactionStatus;
import com.etutor.backend.model.TransactionType;
import com.etutor.backend.model.Wallet;
import com.etutor.backend.repository.TransactionRepository;
import com.etutor.backend.repository.WalletRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class WalletService {

    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;

    public WalletService(WalletRepository walletRepository, TransactionRepository transactionRepository) {
        this.walletRepository = walletRepository;
        this.transactionRepository = transactionRepository;
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

        // Ghi lại Log giao dịch
        Transaction transaction = Transaction.builder()
                .walletId(wallet.getId())
                .amount(amount)
                .type(TransactionType.WITHDRAW)
                .status(TransactionStatus.SUCCESS)
                .description("Rút tiền từ ví về tài khoản ngân hàng")
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
    }

    // Hàm nghiệp vụ Hoàn tiền (Refund) khi xảy ra tranh chấp có lợi cho học viên
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

        // Ghi log hoàn tiền UNLOCK
        Transaction transaction = Transaction.builder()
                .walletId(wallet.getId())
                .amount(amount)
                .type(TransactionType.UNLOCK)
                .status(TransactionStatus.SUCCESS)
                .description("Hoàn tiền học phí đã đóng băng về ví khả dụng")
                .build();
        transactionRepository.save(transaction);
    }
}
