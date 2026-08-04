import React from "react";
import { DD_FEE_LINES, DD_FEE_SINGLES } from "@/constants/danceDollarsAgreement";

const Blank = () => (
  <span className="inline-block border-b border-black min-w-[90px] mx-1" />
);

export default function DanceDollarsFeeBlock() {
  return (
    <div className="space-y-2 text-[13px] font-semibold">
      {DD_FEE_LINES.map((l) => (
        <div key={l.label} className="flex flex-wrap items-end gap-x-1">
          <span>{l.label}: $</span><Blank />
          <span>+ {l.extra} $</span><Blank />
          <span>= {l.total}: $</span><Blank />
        </div>
      ))}
      {DD_FEE_SINGLES.map((s) => (
        <div key={s} className="flex flex-wrap items-end gap-x-1">
          <span>{s}:</span><Blank />
        </div>
      ))}
    </div>
  );
}