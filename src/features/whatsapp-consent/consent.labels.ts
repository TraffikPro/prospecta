import type {
  WhatsAppConsentPurpose,
  WhatsAppConsentSource,
  WhatsAppConsentStatus,
} from "@prisma/client";

export const whatsappConsentStatusLabels: Record<WhatsAppConsentStatus, string> =
  {
    UNKNOWN: "Não verificada",
    OPTED_IN: "Autorizado",
    OPTED_OUT: "Recusado",
  };

export const whatsappConsentSourceLabels: Record<WhatsAppConsentSource, string> =
  {
    PHONE_CALL: "Ligação",
    EMAIL: "E-mail",
    FORM: "Formulário",
    INBOUND_WHATSAPP: "WhatsApp iniciado pelo contato",
    OTHER: "Outro",
  };

export const whatsappConsentPurposeLabels: Record<
  WhatsAppConsentPurpose,
  string
> = {
  PRESENTATION: "Apresentação",
  DEMO: "Demonstração",
  MEETING: "Reunião",
  FOLLOW_UP: "Follow-up solicitado",
  OTHER: "Outro",
};

export const AUTHORIZED_API_UNAVAILABLE_COPY =
  "Autorizado, mas envio pela API ainda indisponível";
