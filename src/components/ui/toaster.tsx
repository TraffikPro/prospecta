"use client";

import {
  Toaster as ChakraToaster,
  Portal,
  Spinner,
  Stack,
  Toast,
  createToaster,
} from "@chakra-ui/react";

export const toaster = createToaster({
  placement: "top",
  max: 3,
  pauseOnPageIdle: true,
});

export function Toaster() {
  return (
    <Portal>
      <ChakraToaster toaster={toaster} insetInline={{ mdDown: "4" }}>
        {(toast) => (
          <Toast.Root
            width={{ md: "sm" }}
            data-testid="app-toast"
            data-type={toast.type}
            role="status"
            aria-live="polite"
          >
            {toast.type === "loading" ? (
              <Spinner size="sm" color="blue.solid" />
            ) : (
              <Toast.Indicator />
            )}
            <Stack gap="1" flex="1" maxWidth="100%">
              {toast.title ? (
                <Toast.Title data-testid="app-toast-title">
                  {toast.title}
                </Toast.Title>
              ) : null}
              {toast.description ? (
                <Toast.Description>{toast.description}</Toast.Description>
              ) : null}
            </Stack>
            {toast.action ? (
              <Toast.ActionTrigger>{toast.action.label}</Toast.ActionTrigger>
            ) : null}
            {toast.closable ? <Toast.CloseTrigger /> : null}
          </Toast.Root>
        )}
      </ChakraToaster>
    </Portal>
  );
}

export function notifySuccess(title: string, description?: string): void {
  toaster.create({
    type: "success",
    title,
    description,
    closable: true,
  });
}

export function notifyError(title: string, description?: string): void {
  toaster.create({
    type: "error",
    title,
    description,
    closable: true,
  });
}
