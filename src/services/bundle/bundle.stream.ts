// Bundle Fulfilment SSE Stream
import { API_ENDPOINTS } from '../endpoints';
import { getAuthHeader } from '../auth.service';
import { createLogger } from '../logger';
import type { CISRecord, CCNRecord, SDPRecord } from '../../types';

const log = createLogger('BundleStream');

export interface SSECallbacks {
  onCIS: (records: CISRecord[]) => void;
  onCCN: (records: CCNRecord[]) => void;
  onSDP: (records: SDPRecord[]) => void;
  onPhaseChange: (phase: 'cis' | 'ccn' | 'sdp' | 'complete' | 'error') => void;
  onError: (msg: string) => void;
  onComplete: () => void;
}

/**
 * Opens an SSE connection to the bundle endpoint and calls back as named events arrive.
 * Returns an abort function to cancel the stream.
 */
export function streamBundleData(
  msisdn: string,
  startDate: string,
  endDate: string,
  callbacks: SSECallbacks
): () => void {
  const url = `${API_ENDPOINTS.FETCH_SUBSCRIBER_DATA}?msisdn=${msisdn}&startDate=${startDate}&endDate=${endDate}`;
  const controller = new AbortController();

  log.info(`Opening SSE stream — msisdn: ${msisdn}, range: ${startDate}→${endDate}`);

  (async () => {
    let authHeader: string;
    try {
      authHeader = getAuthHeader();
    } catch (authErr) {
      const msg = authErr instanceof Error ? authErr.message : 'Authentication error';
      log.error(`SSE request blocked — ${msg}`);
      callbacks.onError(msg);
      callbacks.onPhaseChange('error');
      return;
    }

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'text/event-stream', Authorization: authHeader },
      });

      log.info(`SSE response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        log.error(`SSE request failed — HTTP ${response.status}`, body || '(no body)');
        callbacks.onError(`HTTP ${response.status}: ${response.statusText}`);
        callbacks.onPhaseChange('error');
        return;
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          log.debug('SSE reader done');
          break;
        }
        buffer += decoder.decode(value, { stream: true });

        const messages = buffer.split('\n\n');
        buffer = messages.pop() || '';

        for (const msg of messages) {
          if (!msg.trim()) continue;
          const lines = msg.split('\n');
          let eventName = '';
          let dataLine = '';

          for (const line of lines) {
            if (line.startsWith('event:')) eventName = line.slice(6).trim();
            if (line.startsWith('data:')) dataLine = line.slice(5).trim();
          }

          if (!eventName || !dataLine) continue;

          try {
            const parsed = JSON.parse(dataLine);
            if (eventName === 'CIS') {
              log.info(`SSE event: CIS — ${parsed.length} record(s)`);
              callbacks.onPhaseChange('cis');
              callbacks.onCIS(parsed as CISRecord[]);
            } else if (eventName === 'CCN') {
              log.info(`SSE event: CCN — ${parsed.length} record(s)`);
              callbacks.onPhaseChange('ccn');
              callbacks.onCCN(parsed as CCNRecord[]);
            } else if (eventName === 'SDP') {
              log.info(`SSE event: SDP — ${parsed.length} record(s)`);
              callbacks.onPhaseChange('sdp');
              callbacks.onSDP(parsed as SDPRecord[]);
            } else {
              log.warn(`SSE event: unknown type "${eventName}" — ignoring`);
            }
          } catch (parseErr) {
            log.warn(`SSE parse error on event "${eventName}"`, parseErr);
          }
        }
      }

      log.info('SSE stream complete');
      callbacks.onPhaseChange('complete');
      callbacks.onComplete();
    } catch (err: any) {
      if (err.name === 'AbortError') {
        log.debug('SSE stream aborted');
        return;
      }
      log.error('SSE stream exception', err);
      callbacks.onError(err.message || 'Stream failed');
      callbacks.onPhaseChange('error');
    }
  })();

  return () => {
    log.debug('SSE stream abort requested');
    controller.abort();
  };
}