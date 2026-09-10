import axios, { AxiosError, type AxiosResponse } from "axios";
import { LATENCY_MS } from "./config";
import { demoStore } from "./store";

let interceptorId: number | null = null;

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });

const splitUrl = (raw: string) => {
  const anchor = raw.indexOf("/api/");
  if (anchor === -1) return null;
  const tail = raw.slice(anchor);
  const [path, search = ""] = tail.split("?");
  return { path, query: new URLSearchParams(search) };
};

const mergeParams = (query: URLSearchParams, params: unknown) => {
  if (params instanceof URLSearchParams) {
    params.forEach((value, key) => query.set(key, value));
    return query;
  }
  if (params && typeof params === "object") {
    Object.entries(params as Record<string, unknown>).forEach(
      ([key, value]) => {
        if (value !== undefined && value !== null) query.set(key, String(value));
      },
    );
  }
  return query;
};

export const installDemoApi = () => {
  if (interceptorId !== null) return;
  interceptorId = axios.interceptors.request.use((config) => {
    if (!demoStore.active) return config;
    const target = splitUrl(config.url ?? "");
    if (!target) return config;

    const result = demoStore.handle(
      (config.method ?? "get").toUpperCase(),
      target.path,
      config.data,
      mergeParams(target.query, config.params),
    );
    if (!result) return config;

    config.adapter = async () => {
      await wait(LATENCY_MS);
      const status = result.status ?? 200;
      const response = {
        data: result.data,
        status,
        statusText: status >= 400 ? "Error" : "OK",
        headers: {},
        config,
      } as AxiosResponse;
      if (status >= 400) {
        throw new AxiosError(
          result.message ?? "Demo request failed",
          String(status),
          config,
          null,
          response,
        );
      }
      return response;
    };
    return config;
  });
};

export const uninstallDemoApi = () => {
  if (interceptorId === null) return;
  axios.interceptors.request.eject(interceptorId);
  interceptorId = null;
};
