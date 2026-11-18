import { AsyncLocalStorage } from 'node:async_hooks';

type RequestStore = {
  correlationId: string;
};

export const asyncLocalStorage = new AsyncLocalStorage<RequestStore>();

export function getCorrelationId(): string | undefined {
  return asyncLocalStorage.getStore()?.correlationId;
}
