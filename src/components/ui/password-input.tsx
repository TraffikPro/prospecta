"use client";

import type { ButtonProps, GroupProps, InputProps } from "@chakra-ui/react";
import {
  IconButton,
  Input,
  InputGroup,
  mergeRefs,
  useControllableState,
} from "@chakra-ui/react";
import * as React from "react";

export interface PasswordVisibilityProps {
  /** The default visibility state of the password input. */
  defaultVisible?: boolean;
  /** The controlled visibility state of the password input. */
  visible?: boolean;
  /** Callback invoked when the visibility state changes. */
  onVisibleChange?: (visible: boolean) => void;
  /** Custom icons for the visibility toggle button. */
  visibilityIcon?: { on: React.ReactNode; off: React.ReactNode };
}

export interface PasswordInputProps
  extends InputProps,
    PasswordVisibilityProps {
  rootProps?: GroupProps;
}

function EyeIcon() {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
      <path d="M9.9 5.1A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a18.2 18.2 0 0 1-3.2 4.4" />
      <path d="M6.1 6.1A18.5 18.5 0 0 0 2 12s3.5 7 10 7a10.4 10.4 0 0 0 4.2-.9" />
    </svg>
  );
}

/** Chakra password-input snippet adapted without react-icons. */
export const PasswordInput = React.forwardRef<
  HTMLInputElement,
  PasswordInputProps
>(function PasswordInput(props, ref) {
  const {
    rootProps,
    defaultVisible,
    visible: visibleProp,
    onVisibleChange,
    visibilityIcon = { on: <EyeIcon />, off: <EyeOffIcon /> },
    borderRadius = "button",
    ...rest
  } = props;

  const [visible, setVisible] = useControllableState({
    value: visibleProp,
    defaultValue: defaultVisible || false,
    onChange: onVisibleChange,
  });

  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <InputGroup
      endElement={
        <VisibilityTrigger
          disabled={rest.disabled}
          onPointerDown={(event) => {
            if (rest.disabled) return;
            if (event.button !== 0) return;
            event.preventDefault();
            setVisible(!visible);
          }}
        >
          {visible ? visibilityIcon.off : visibilityIcon.on}
        </VisibilityTrigger>
      }
      {...rootProps}
    >
      <Input
        {...rest}
        borderRadius={borderRadius}
        ref={mergeRefs(ref, inputRef)}
        type={visible ? "text" : "password"}
      />
    </InputGroup>
  );
});

const VisibilityTrigger = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function VisibilityTrigger(props, ref) {
    return (
      <IconButton
        tabIndex={-1}
        ref={ref}
        me="-2"
        aspectRatio="square"
        size="sm"
        variant="ghost"
        height="calc(100% - {spacing.2})"
        aria-label="Alternar visibilidade"
        {...props}
      />
    );
  },
);
