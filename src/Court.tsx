import * as React from "react";
import { SVGProps } from "react";

export function Court(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      xmlSpace="preserve"
      style={{
        fillRule: "evenodd",
        clipRule: "evenodd",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        strokeMiterlimit: 1.5,
      }}
      width="24px"
      height="24px"
      {...props}
    >
      <path
        d="M1.028 10.423V8.411a1.487 1.487 0 0 1 1.487-1.488h19.057a1.489 1.489 0 0 1 1.487 1.488v2.012"
        style={{
          fill: "none",
          stroke: "currentColor",
          strokeWidth: "1.5px",
        }}
        transform="translate(0 .577)"
      />
      <path
        d="m19.143 9.832 1.623 6.755a4.32 4.32 0 0 1-.727 3.583c-.758 1.014-1.921 1.607-3.153 1.607H7.129c-1.232 0-2.396-.593-3.154-1.607a4.323 4.323 0 0 1-.726-3.583l1.623-6.755m1.379-5.74.177-.736C6.767 1.944 7.983.954 9.377.954h5.261c1.394 0 2.61.99 2.949 2.402l.177.736"
        style={{
          fill: "none",
          stroke: "currentColor",
          strokeWidth: "1.53px",
        }}
        transform="matrix(1 0 0 .9581 0 1.08)"
      />
      <path
        d="M6.575 12.5h11"
        style={{
          fill: "none",
          stroke: "currentColor",
          strokeWidth: "1.5px",
        }}
        transform="translate(-.075 1.5)"
      />
      <path
        d="m11.979 13.618.015 6.147M11.979.199v2.476"
        style={{
          fill: "none",
          stroke: "currentColor",
          strokeWidth: "1.58px",
        }}
        transform="matrix(1 0 0 .89474 0 1.816)"
      />
    </svg>
  );
}
