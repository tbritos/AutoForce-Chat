
/**
 * Formata números de telefone para o padrão visual (ex: +55 (11) 99999-9999)
 */
export const formatPhone = (phone: string | undefined | null): string => {
  if (!phone) return '';
  
  // Remove tudo que não é dígito
  const cleaned = phone.replace(/\D/g, '');

  // Verifica se é um número brasileiro padrão (55 + DDD + 8 ou 9 dígitos)
  if (cleaned.startsWith('55') && (cleaned.length === 12 || cleaned.length === 13)) {
    const ddd = cleaned.substring(2, 4);
    const isNineDigit = cleaned.length === 13;
    
    if (isNineDigit) {
        // +55 (XX) XXXXX-XXXX
        const part1 = cleaned.substring(4, 9);
        const part2 = cleaned.substring(9);
        return `+55 (${ddd}) ${part1}-${part2}`;
    } else {
        // +55 (XX) XXXX-XXXX (Fixo ou antigo)
        const part1 = cleaned.substring(4, 8);
        const part2 = cleaned.substring(8);
        return `+55 (${ddd}) ${part1}-${part2}`;
    }
  }

  // Se não bater com o padrão (ex: número internacional sem 55 ou curto), retorna original
  return phone;
};

const getFirstString = (obj: any, keys: string[]): string => {
  for (const key of keys) {
    const value = obj?.[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
};

const parseJsonIfPossible = (value: string): any | null => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export interface WhatsAppTemplateButton {
  type: string;
  text: string;
  url?: string;
}

export interface WhatsAppTemplateData {
  header?: string;
  body: string;
  buttons: WhatsAppTemplateButton[];
}

const stripWrappingQuotes = (value: string): string => {
  if (value.length < 2) return value;
  const first = value[0];
  const last = value[value.length - 1];
  if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
    return value.slice(1, -1);
  }
  return value;
};

const normalizeEscapedJson = (value: string): string => {
  return value
    .replace(/\\\\n/g, '\n')
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'");
};

const parseUnknownJson = (input: unknown, depth = 0): any | null => {
  if (depth > 4) return null;
  if (typeof input !== 'string') return input;

  const trimmed = input.trim();
  if (!trimmed) return null;

  const candidates = [
    trimmed,
    stripWrappingQuotes(trimmed),
    normalizeEscapedJson(trimmed),
    normalizeEscapedJson(stripWrappingQuotes(trimmed))
  ];

  for (const candidate of candidates) {
    const parsed = parseJsonIfPossible(candidate);
    if (parsed === null) continue;
    if (typeof parsed === 'string') return parseUnknownJson(parsed, depth + 1);
    return parsed;
  }

  return null;
};

const getTemplateComponents = (payload: any): any[] => {
  if (!payload) return [];

  if (Array.isArray(payload)) {
    const isComponentsArray = payload.every((item) => typeof item === 'object' && item !== null && 'type' in item);
    if (isComponentsArray) return payload;

    for (const item of payload) {
      const nested = getTemplateComponents(item);
      if (nested.length) return nested;
    }
    return [];
  }

  const containers = [payload, payload.template, payload.message, payload.data, payload.payload];
  for (const container of containers) {
    if (!container || typeof container !== 'object') continue;
    if (Array.isArray(container.components)) return container.components;
    if (typeof container.components === 'string') {
      const parsed = parseUnknownJson(container.components);
      const nested = getTemplateComponents(parsed);
      if (nested.length) return nested;
    }
  }

  return [];
};

export const parseWhatsAppTemplateMessage = (text: string): WhatsAppTemplateData | null => {
  if (!text || typeof text !== 'string') return null;

  const parsed = parseUnknownJson(text);
  const components = getTemplateComponents(parsed);
  if (!components.length) return null;

  let header = '';
  let body = '';
  const buttons: WhatsAppTemplateButton[] = [];

  components.forEach((component: any) => {
    const type = String(component?.type || '').toUpperCase();
    if (type === 'HEADER') {
      const headerText = getFirstString(component, ['text', 'header', 'value']);
      if (headerText) header = headerText;
    }

    if (type === 'BODY') {
      const bodyText = getFirstString(component, ['text', 'body', 'value']);
      if (bodyText) body = bodyText;
    }

    if (type === 'BUTTONS') {
      const items = Array.isArray(component?.buttons) ? component.buttons : [];
      items.forEach((btn: any) => {
        const buttonText = getFirstString(btn, ['text', 'title', 'value']);
        if (!buttonText) return;
        buttons.push({
          type: String(btn?.type || 'BUTTON').toUpperCase(),
          text: buttonText,
          url: getFirstString(btn, ['url', 'link'])
        });
      });
    }
  });

  if (!header && !body && !buttons.length) return null;
  return {
    header: header || undefined,
    body: body || '',
    buttons
  };
};

export const formatMessagePreview = (text: string): string => {
  const template = parseWhatsAppTemplateMessage(text);
  if (!template) return text;

  const bodyLine = (template.body || '').split('\n').find((line) => line.trim())?.trim() || '';
  if (template.header && bodyLine) return `Template: ${template.header} - ${bodyLine}`;
  if (template.header) return `Template: ${template.header}`;
  if (bodyLine) return `Template: ${bodyLine}`;
  return 'Template WhatsApp';
};

const isGenericTemplateLabel = (value: string): boolean => {
  const normalized = (value || '').trim().toLowerCase();
  return normalized === 'template' || normalized === 'templat' || normalized.startsWith('templat ');
};

const extractTemplateBody = (payload: any): string => {
  const directBody = getFirstString(payload, ['template_body', 'templateBody', 'body', 'message', 'text']);
  if (directBody) return directBody;

  const components = Array.isArray(payload?.components) ? payload.components : [];
  const bodyComponent = components.find((c: any) => String(c?.type || '').toUpperCase() === 'BODY');
  if (!bodyComponent) return '';

  const componentText = getFirstString(bodyComponent, ['text', 'body']);
  if (componentText) return componentText;

  const parameters = Array.isArray(bodyComponent?.parameters) ? bodyComponent.parameters : [];
  const chunks = parameters
    .map((p: any) => getFirstString(p, ['text', 'value']))
    .filter(Boolean);

  return chunks.join(' ').trim();
};

export const resolveMessageText = (dbMsg: any): string => {
  const rawContent = getFirstString(dbMsg, ['content', 'text', 'message', 'body']);
  const parsedContent = rawContent ? parseJsonIfPossible(rawContent) : null;
  const payload = parsedContent && typeof parsedContent === 'object' ? { ...dbMsg, ...parsedContent } : dbMsg;

  const templateName = getFirstString(payload, ['template_name', 'templateName', 'name']);
  const templateBody = extractTemplateBody(payload);

  if (rawContent && !isGenericTemplateLabel(rawContent)) {
    return rawContent;
  }

  if (templateBody) {
    if (templateName) return `Template: ${templateName}\n${templateBody}`;
    return templateBody;
  }

  if (templateName) {
    return `Template: ${templateName}`;
  }

  return rawContent || '';
};

/**
 * Toca um som sutil de notificação para novas mensagens
 */
export const playNotificationSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    // Configuração do tom (Bip suave e moderno)
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.1); // Slide para C6
    
    gain.gain.setValueAtTime(0.05, ctx.currentTime); // Volume baixo
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (error) {
    console.error("Erro ao tocar som:", error);
  }
};
