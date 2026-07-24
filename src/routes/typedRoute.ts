import type { RouteConfig } from './routes';

/** Extracts `:name` segments from a route path literal, e.g. `/quiz/:operation` -> "operation". */
type ExtractParamNames<Path extends string> =
    Path extends `${string}:${infer Param}/${infer Rest}`
        ? Param | ExtractParamNames<`/${Rest}`>
        : Path extends `${string}:${infer Param}`
          ? Param
          : never;

/** page.js always populates route params as strings. Paths with no `:segment` yield `{}`. */
export type RouteParams<Path extends string> = {
    [K in ExtractParamNames<Path>]: string;
};

/**
 * A `PageJS.Context` whose `params` is inferred from the route path instead of `any`.
 * Overrides `params` via interface inheritance rather than `Omit<PageJS.Context, 'params'>`
 * — `Context` has a `[idx: string]: any` index signature, which makes `keyof Context`
 * resolve to `string | number` and breaks `Omit`/`Pick` (they'd drop every named member).
 */
export interface TypedContext<Path extends string> extends PageJS.Context {
    params: RouteParams<Path>;
}

/**
 * Defines a route with `context.params` typed from the path itself — a typo like
 * `context.params.operaton` on `/quiz/:operation` is now a compile error instead of
 * silently resolving to `undefined` (page.js's own `Context.params` type is `any`).
 */
export function route<Path extends string>(
    path: Path,
    handler: (context: TypedContext<Path>) => void,
    middleware?: ((context: PageJS.Context, next: () => void) => void)[]
): RouteConfig {
    return {
        path,
        handler: handler as (context: PageJS.Context) => void,
        middleware,
    };
}
