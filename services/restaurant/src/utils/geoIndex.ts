import Restaurant from "../models/Restaurant.js";
import MenuItems from "../models/MenuItems.js";

let ensurePromise: Promise<unknown> | null = null;

const isMissingIndexError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  return /unable to find index|2dsphere|geo near/i.test(message);
};

export const ensureGeoIndexes = () => {
  if (!ensurePromise) {
    ensurePromise = Promise.all([
      Restaurant.createIndexes(),
      MenuItems.createIndexes(),
    ]).finally(() => {
      ensurePromise = null;
    });
  }
  return ensurePromise;
};

export const withGeoIndexRepair = async <T>(
  run: () => Promise<T>,
): Promise<T> => {
  try {
    return await run();
  } catch (error) {
    if (!isMissingIndexError(error)) throw error;
    await ensureGeoIndexes();
    return run();
  }
};
