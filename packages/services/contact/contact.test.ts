import { beforeEach, describe, expect, it, vi } from "vitest";
import ContactService, {
  _resetContactRateLimits,
  checkContactRateLimit,
} from "./index";
import { escapeHtml, sanitizeHeader, sendContactMail } from "./mailer";
import { sendMessageInput } from "./model";

describe("Contact Form 5D Unit & Integration Tests", () => {
  beforeEach(() => {
    _resetContactRateLimits();
    vi.restoreAllMocks();
  });

  describe("Input Validation & Zod Schema", () => {
    it("validates correct contact input", () => {
      const valid = sendMessageInput.safeParse({
        name: "Jane Doe",
        email: "jane@example.com",
        message: "Hello, I would like to inquire about your service.",
      });
      expect(valid.success).toBe(true);
    });

    it("rejects input with name shorter than 2 characters or longer than 100 characters", () => {
      const tooShort = sendMessageInput.safeParse({
        name: "J",
        email: "jane@example.com",
        message: "Valid message length here.",
      });
      expect(tooShort.success).toBe(false);

      const tooLong = sendMessageInput.safeParse({
        name: "A".repeat(101),
        email: "jane@example.com",
        message: "Valid message length here.",
      });
      expect(tooLong.success).toBe(false);
    });

    it("rejects input with invalid email format", () => {
      const invalidEmail = sendMessageInput.safeParse({
        name: "Jane Doe",
        email: "not-a-valid-email",
        message: "Valid message length here.",
      });
      expect(invalidEmail.success).toBe(false);
    });

    it("rejects input with message shorter than 10 or longer than 2000 characters", () => {
      const tooShort = sendMessageInput.safeParse({
        name: "Jane Doe",
        email: "jane@example.com",
        message: "Short",
      });
      expect(tooShort.success).toBe(false);

      const tooLong = sendMessageInput.safeParse({
        name: "Jane Doe",
        email: "jane@example.com",
        message: "M".repeat(2001),
      });
      expect(tooLong.success).toBe(false);
    });
  });

  describe("HTML Escaping & Header Injection Protection", () => {
    it("escapes all HTML special characters in body", () => {
      const unsafe = '<script>alert("XSS")</script> & \'hello\'';
      const safe = escapeHtml(unsafe);
      expect(safe).toBe("&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt; &amp; &#039;hello&#039;");
      expect(safe).not.toContain("<script>");
    });

    it("strips CRLF and newlines from name and subject to prevent header injection", () => {
      const maliciousName = "Jane Doe\r\nBcc: victim@example.com\nSubject: Injected";
      const sanitized = sanitizeHeader(maliciousName);
      expect(sanitized).toBe("Jane Doe Bcc: victim@example.com Subject: Injected");
      expect(sanitized).not.toContain("\r");
      expect(sanitized).not.toContain("\n");
    });
  });

  describe("Honeypot Handling", () => {
    it("silently returns success without sending email when honeypot is filled", async () => {
      const contactService = new ContactService();
      const sendMailMock = vi.fn().mockResolvedValue(undefined);

      const result = await contactService.sendMessage(
        {
          name: "Spam Bot",
          email: "bot@spam.com",
          message: "Check out this spam link immediately!",
          honeypot: "http://spam-link.com",
        },
        "192.168.1.1",
        { sendMailFn: sendMailMock },
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain("Thank you for reaching out");
      // Transporter was never invoked
      expect(sendMailMock).not.toHaveBeenCalled();
    });
  });

  describe("Per-IP Rate Limiting (3 per hour)", () => {
    it("allows up to 3 messages per IP and blocks the 4th message with TOO_MANY_REQUESTS", () => {
      const ip = "203.0.113.195";

      // First 3 calls should succeed
      expect(() => checkContactRateLimit(ip)).not.toThrow();
      expect(() => checkContactRateLimit(ip)).not.toThrow();
      expect(() => checkContactRateLimit(ip)).not.toThrow();

      // 4th call must throw TOO_MANY_REQUESTS
      expect(() => checkContactRateLimit(ip)).toThrowError(/Too many messages sent/);
    });

    it("allows requests from different IPs independently", () => {
      const ipA = "198.51.100.1";
      const ipB = "198.51.100.2";

      // Exhaust limit for ipA
      checkContactRateLimit(ipA);
      checkContactRateLimit(ipA);
      checkContactRateLimit(ipA);
      expect(() => checkContactRateLimit(ipA)).toThrow();

      // ipB should still be allowed
      expect(() => checkContactRateLimit(ipB)).not.toThrow();
    });
  });

  describe("Message Delivery & Mailer Integration", () => {
    it("sends valid message and sets correct recipient, replyTo, subject, and escaped content", async () => {
      const contactService = new ContactService();
      let sentMailOptions: any = null;

      const mockTransporter: any = {
        sendMail: vi.fn().mockImplementation((opts) => {
          sentMailOptions = opts;
          return Promise.resolve({ messageId: "test-id" });
        }),
      };

      const result = await contactService.sendMessage(
        {
          name: "Alice Smith\r\n",
          email: "alice@example.com",
          message: "Hello!\nI need help with a custom form.\n<script>alert('test')</script>",
        },
        "198.51.100.50",
        {
          sendMailFn: (opts) =>
            sendContactMail({
              ...opts,
              contactEmail: "admin@ftheform.com",
              transporterOverride: mockTransporter,
            }),
        },
      );

      expect(result.success).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
      expect(sentMailOptions.to).toBe("admin@ftheform.com");
      expect(sentMailOptions.replyTo).toBe("alice@example.com");
      expect(sentMailOptions.subject).toBe("New Contact Form Message from Alice Smith");
      expect(sentMailOptions.subject).not.toContain("\r");
      expect(sentMailOptions.html).toContain("&lt;script&gt;alert(&#039;test&#039;)&lt;/script&gt;");
      expect(sentMailOptions.text).toContain("Hello!\nI need help with a custom form.");
    });

    it("returns a generic error message when the mailer fails and does not leak provider details", async () => {
      const contactService = new ContactService();

      const mockFailingTransporter: any = {
        sendMail: vi.fn().mockRejectedValue(new Error("535 5.7.8 Username and Password not accepted / SMTP authentication failed")),
      };

      await expect(
        contactService.sendMessage(
          {
            name: "Bob Jones",
            email: "bob@example.com",
            message: "Testing failure handling on contact mailer.",
          },
          "198.51.100.60",
          {
            sendMailFn: (opts) =>
              sendContactMail({
                ...opts,
                contactEmail: "admin@ftheform.com",
                transporterOverride: mockFailingTransporter,
              }),
          },
        ),
      ).rejects.toThrow("Could not send your message, please try again");
    });

    it("fails gracefully with generic error when mailer env vars are missing", async () => {
      const contactService = new ContactService();

      // Ensure no CONTACT_EMAIL configured
      const originalContactEmail = process.env.CONTACT_EMAIL;
      delete process.env.CONTACT_EMAIL;

      await expect(
        contactService.sendMessage(
          {
            name: "Bob Jones",
            email: "bob@example.com",
            message: "Testing missing env vars graceful handling.",
          },
          "198.51.100.70",
        ),
      ).rejects.toThrow("Could not send your message, please try again");

      if (originalContactEmail) {
        process.env.CONTACT_EMAIL = originalContactEmail;
      }
    });
  });
});
