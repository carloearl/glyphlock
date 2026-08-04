import React from "react";
import DanceDollarsFeeBlock from "@/components/nups/contracts/DanceDollarsFeeBlock";
import {
  DD_HEADER, DD_TITLE, DD_RECEIPT_ACK, DD_PREAMBLE, DD_BODY,
  DD_CLOSING, DD_FINAL_SALE, DD_SIGNATURE_FIELDS,
} from "@/constants/danceDollarsAgreement";

// Verbatim legacy print form. Separate instrument from the GlyphBucks v3.1 agreement.
export default function DanceDollarsAgreement() {
  return (
    <div className="bg-white text-black mx-auto max-w-[8.5in] p-8 space-y-4 print:p-0">
      <div className="text-center border-b-2 border-black pb-3">
        <h1 className="text-xl font-black uppercase">{DD_HEADER}</h1>
        <p className="text-sm font-bold tracking-widest">{DD_TITLE}</p>
      </div>

      <DanceDollarsFeeBlock />

      <p className="text-[12px] font-black uppercase border-y border-black py-2">
        {DD_RECEIPT_ACK}
      </p>

      <p className="text-[12px] italic">{DD_PREAMBLE}</p>
      <p className="text-[11px] leading-[1.5] text-justify">{DD_BODY}</p>
      <p className="text-[12px] font-semibold">{DD_CLOSING}</p>

      <p className="text-center text-[13px] font-black uppercase border-2 border-black py-2">
        {DD_FINAL_SALE}
      </p>

      <div className="flex gap-6 items-end pt-2">
        <div className="text-center">
          <div className="w-28 h-28 border-2 border-black" />
          <p className="text-[10px] font-bold mt-1">THUMB PRINT</p>
        </div>
        <div className="flex-1 space-y-6">
          {DD_SIGNATURE_FIELDS.map((f) => (
            <div key={f} className="flex items-end gap-2">
              <span className="text-[11px] font-bold whitespace-nowrap">{f}</span>
              <span className="flex-1 border-b border-black h-5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}