package com.example.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.logging.Level;
import java.util.logging.Logger;

@Service
public class EmailService {

    private static final Logger LOGGER = Logger.getLogger(EmailService.class.getName());

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:smartgrocery.app@gmail.com}")
    private String fromEmail;

    public void sendEmail(String to, String subject, String body) {
        if (mailSender == null) {
            LOGGER.log(Level.WARNING, "JavaMailSender is not initialized. Skipping sending email to {0} with subject: {1}", new Object[]{to, subject});
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            message.setFrom(fromEmail);

            mailSender.send(message);
            LOGGER.log(Level.INFO, "Email sent successfully to {0} (Subject: {1})", new Object[]{to, subject});
        } catch (MailException e) {
            LOGGER.log(Level.WARNING, "Failed to send email to {0} due to network/SMTP issue: {1}", new Object[]{to, e.getMessage()});
        } catch (Exception e) {
            LOGGER.log(Level.WARNING, "Unexpected error occurred while sending email to {0}: {1}", new Object[]{to, e.getMessage()});
        }
    }
}
