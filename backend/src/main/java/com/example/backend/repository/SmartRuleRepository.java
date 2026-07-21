package com.example.backend.repository;

import com.example.backend.entity.SmartRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SmartRuleRepository extends JpaRepository<SmartRule, Long> {
    List<SmartRule> findByType(SmartRule.RuleType type);
    java.util.Optional<SmartRule> findByItemKeyIgnoreCaseAndType(String itemKey, SmartRule.RuleType type);
}
