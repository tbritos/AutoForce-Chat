
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
