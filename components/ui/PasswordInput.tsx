"use client";
import { useState, forwardRef } from "react";

/**
 * Drop-in replacement for <input type="password">, with a Show/Hide
 * toggle — same visual pattern already used on the login page, now
 * reusable everywhere a password is entered (register, forgot/reset
 * password, settings, staff creation, etc).
 *
 * Accepts every normal <input> prop (value, onChange, required,
 * className, style, onFocus, onBlur, id, placeholder, minLength...)
 * and passes them straight through, so it's a safe swap for any
 * existing `<input type="password" .../>` without needing to change
 * surrounding form logic.
 */
type PasswordInputProps = React.InputHTMLAttributes<HTMLInputElement>;

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ style, ...props }, ref) => {
    const [show, setShow] = useState(false);
    return (
      <div style={{ position: "relative" }}>
        <input
          {...props}
          ref={ref}
          type={show ? "text" : "password"}
          style={{ paddingRight: "2.75rem", ...(style || {}) }}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          style={{
            position: "absolute",
            right: "0.75rem",
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#A3A3A3",
            fontSize: "0.75rem",
            fontFamily: "var(--font-body, inherit)",
            fontWeight: 600,
            padding: "0.25rem",
          }}
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";
export default PasswordInput;
