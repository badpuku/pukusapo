import type { ReactNode } from "react";
import type { UIMatch } from "react-router";

export type AppUIMatch<D = unknown> = UIMatch<D, RouteHandle>;

export type RouteHandler<R = ReactNode> = (
  match: AppUIMatch<unknown>,
  index: number,
  matches: AppUIMatch<unknown>[],
) => R;

/**
 * export const handle: RouteHandle = {
 *   breadcrumb: (match, index, matches) => ({
 *     to: "/parent/" + match.params.id,
 *     title: "Some Route"
 *   }),
 * };
 */
export interface RouteHandle {
  breadcrumb?: (
    match: AppUIMatch<unknown>,
    index: number,
    matches: AppUIMatch<unknown>[],
  ) => { to: string; title: string };
}
