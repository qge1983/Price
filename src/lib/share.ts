import type { RateRow } from './rates';
import { periodLabel, rateText } from './format';
import { CONFIG } from '../config';

/** WhatsApp-friendly text (*bold* works in WhatsApp) */
export function buildShareText(r: RateRow): string {
  const title = [r.company, r.product].filter(Boolean).join(' · ');
  const lines = [
    title ? `*${title}*` : '',
    r.model ? `Model: *${r.model}*` : '',
    `Cash: ${rateText(r.cash)}`,
    `Installment: ${rateText(r.installment)}`,
    r.hasFix ? `Fix Rate: ${rateText(r.fix)}` : '',
    r.remarks ? `Note: ${r.remarks}` : '',
    r.period ? `Rates of ${periodLabel(r.period)}` : '',
    `— ${CONFIG.companyName}`,
  ];
  return lines.filter(Boolean).join('\n');
}

export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall back below */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
