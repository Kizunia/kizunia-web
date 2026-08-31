export { LocationService } from "./services/location.service";
export { LocationSearchService } from "./services/location-search.service";

export { LocationRepository } from "./repository/location.repository";

export { LocationMapper, locationMapper } from "./mapper/location.mapper";

export { LocationInputSchema, type LocationInput } from "./schemas/location-input";
export {
  LocationSearchQuerySchema,
  type LocationSearchQuery,
} from "./schemas/location-search";

export type { LocationDTO } from "./types/location.dto";
export type {
  LocationSearchProvider,
  LocationSearchResult,
  LocationSuggestion,
} from "./types/provider";

export {
  composeDisplayName,
  inferPrecision,
  normalizeLocationInput,
  type NormalizedLocation,
} from "./utils/normalize";

export { resolveLocationProvider } from "./providers";
